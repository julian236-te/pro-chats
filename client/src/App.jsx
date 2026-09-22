import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import PhoneFrame from './components/PhoneFrame';
import TopBar from './components/TopBar';
import ChatList from './components/ChatList';
import ChatRoom from './components/ChatRoom';
import StatusViewer from './components/StatusViewer';
import CallsTab from './components/CallsTab';
import CallModal from './components/CallModal';
import ProfileModal from './components/ProfileModal';
import NewChatModal from './components/NewChatModal';
import AuthScreen from './components/AuthScreen';
import NotificationBanner from './components/NotificationBanner';
import { initialStatuses, initialCalls } from './data/mockData';
import { playReceivedSound } from './utils/audio';
import { normalizePhone, getChatId } from './utils/phone';

const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_SERVER_URL || (
  typeof window !== 'undefined' && window.location.hostname === 'localhost' && window.location.port === '3000'
    ? 'http://localhost:4000'
    : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4000')
);

export default function App() {
  // Load saved user from localStorage
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('whatsapp_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Load saved chats from localStorage
  const [chats, setChats] = useState(() => {
    try {
      const saved = localStorage.getItem('whatsapp_chats');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [statuses, setStatuses] = useState(initialStatuses);
  const [calls, setCalls] = useState(initialCalls);

  const [activeChat, setActiveChat] = useState(null);
  const [activeTab, setActiveTab] = useState('chats');

  // Light Mode is now DEFAULT (false = Light Mode)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('prochats_theme');
      return saved !== null ? saved === 'dark' : false;
    } catch (e) {
      return false;
    }
  });

  // Persist theme preference
  useEffect(() => {
    try {
      localStorage.setItem('prochats_theme', isDarkMode ? 'dark' : 'light');
    } catch (e) {}
  }, [isDarkMode]);

  // Request browser push notification permission on initial load
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Search & Navigation Modals
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [activeCall, setActiveCall] = useState(null);
  const [typingContact, setTypingContact] = useState(null);
  const [inAppNotification, setInAppNotification] = useState(null);

  const socketRef = useRef(null);
  const activeChatRef = useRef(activeChat);

  // Keep activeChatRef synchronized and join chat room
  useEffect(() => {
    activeChatRef.current = activeChat;
    if (socketRef.current && activeChat?.id) {
      socketRef.current.emit('join_chat', activeChat.id);
      if (user?.phone) {
        socketRef.current.emit('mark_messages_read', {
          chatId: activeChat.id || activeChat.chatId,
          readerPhone: user.phone
        });
      }
    }
    if (activeChat?.id) {
      setChats((prev) =>
        prev.map((c) =>
          c.id === activeChat.id || c.chatId === activeChat.chatId
            ? { ...c, unreadCount: 0 }
            : c
        )
      );
    }
  }, [activeChat?.id, user?.phone]);

  // Handle incoming message notification (Sound + Browser Notification + Floating In-App Banner)
  const triggerMessageNotification = (msg) => {
    // 1. Play chime sound
    playReceivedSound();

    // 2. Native Browser System / OS Push Notification
    try {
      if ('Notification' in window) {
        if (Notification.permission === 'default') {
          Notification.requestPermission().catch(() => {});
        }
        if (Notification.permission === 'granted') {
          let preview = msg.text;
          if (msg.type === 'image') preview = '📷 أرسل صورة جديدة';
          else if (msg.type === 'video') preview = '🎥 أرسل مقطع فيديو';
          else if (msg.type === 'voice') preview = '🎙️ أرسل رسالة صوتية';

          const notif = new Notification(msg.senderName || 'Pro Chats', {
            body: preview || 'رسالة جديدة',
            icon: msg.senderAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
            badge: msg.senderAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
            tag: `prochats_${msg.chatId || 'msg'}`
          });

          notif.onclick = () => {
            window.focus();
            notif.close();
            const senderNorm = msg.senderCleanPhone || normalizePhone(msg.senderPhone);
            setChats((prev) => {
              const target = prev.find(
                (c) => c.id === msg.chatId || c.chatId === msg.chatId || normalizePhone(c.phone) === senderNorm
              );
              if (target) setActiveChat(target);
              return prev;
            });
          };
        }
      }
    } catch (err) {
      console.warn('Browser notification note:', err);
    }

    // 3. Floating In-App Banner Notification if not looking at this exact chat
    const curActive = activeChatRef.current;
    const senderNorm = msg.senderCleanPhone || normalizePhone(msg.senderPhone);
    const isLookingAtThisChat = curActive && (
      curActive.id === msg.chatId ||
      curActive.chatId === msg.chatId ||
      normalizePhone(curActive.phone) === senderNorm
    );

    if (!isLookingAtThisChat) {
      setInAppNotification(msg);
    }
  };

  // Open chat from notification banner
  const handleOpenChatFromNotification = (notif) => {
    const senderNorm = notif.senderCleanPhone || normalizePhone(notif.senderPhone);
    const targetChat = chats.find(
      (c) => c.id === notif.chatId || c.chatId === notif.chatId || normalizePhone(c.phone) === senderNorm
    );
    if (targetChat) {
      setActiveChat(targetChat);
    } else {
      const newChat = {
        id: notif.chatId,
        chatId: notif.chatId,
        name: notif.senderName || `مستخدم ${notif.senderPhone}`,
        phone: notif.senderPhone,
        cleanPhone: senderNorm,
        avatar: notif.senderAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        about: 'متاح في Pro Chats ☕️',
        isOnline: true,
        lastSeen: 'متصل الآن',
        unreadCount: 0,
        messages: [notif]
      };
      setChats((prev) => [newChat, ...prev]);
      setActiveChat(newChat);
    }
  };

  // Persist chats to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('whatsapp_chats', JSON.stringify(chats));
    } catch (e) {
      console.warn('LocalStorage save error', e);
    }
  }, [chats]);

  // When user logs in, register with server and fetch real server chats
  useEffect(() => {
    if (!user || !user.phone) return;

    // 1. Register with backend DB
    fetch(`${SOCKET_SERVER_URL}/api/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: user.phone,
        name: user.name,
        avatar: user.avatar,
        about: user.about
      })
    })
      .then((res) => res.json())
      .then((data) => {
        console.log('User registered on server:', data);
      })
      .catch(console.warn);

    // 2. Fetch all real conversation history for this phone from server
    fetch(`${SOCKET_SERVER_URL}/api/chats?phone=${encodeURIComponent(user.phone)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.chats && data.chats.length > 0) {
          setChats(data.chats);
        }
      })
      .catch(console.warn);
  }, [user?.phone]);

  // Background Live Synchronization: keeps messages, avatars, names and status up to date seamlessly
  useEffect(() => {
    if (!user || !user.phone) return;

    const syncInterval = setInterval(() => {
      fetch(`${SOCKET_SERVER_URL}/api/chats?phone=${encodeURIComponent(user.phone)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.chats && data.chats.length > 0) {
            setChats((prevChats) => {
              let hasChanges = false;
              const merged = data.chats.map((serverChat) => {
                const localChat = prevChats.find(
                  (lc) => lc.id === serverChat.id || normalizePhone(lc.phone) === normalizePhone(serverChat.phone)
                );
                if (!localChat) {
                  hasChanges = true;
                  return serverChat;
                }

                const hasNewMessages = serverChat.messages.length > localChat.messages.length;
                const hasNewAvatar = serverChat.avatar && serverChat.avatar !== localChat.avatar;
                const hasNewName = serverChat.name && serverChat.name !== localChat.name;
                const hasNewOnline = serverChat.isOnline !== localChat.isOnline;
                const hasNewLastSeen = serverChat.lastSeen !== localChat.lastSeen;

                if (hasNewMessages || hasNewAvatar || hasNewName || hasNewOnline || hasNewLastSeen) {
                  hasChanges = true;
                  const cur = activeChatRef.current;
                  const isCurrent = cur && (cur.id === serverChat.id || normalizePhone(cur.phone) === normalizePhone(serverChat.phone));
                  return {
                    ...localChat,
                    ...serverChat,
                    avatar: serverChat.avatar || localChat.avatar,
                    name: serverChat.name || localChat.name,
                    about: serverChat.about || localChat.about,
                    isOnline: serverChat.isOnline ?? localChat.isOnline,
                    lastSeen: serverChat.lastSeen || localChat.lastSeen,
                    unreadCount: isCurrent
                      ? 0
                      : (localChat?.unreadCount || 0) + (hasNewMessages ? serverChat.messages.length - localChat.messages.length : 0)
                  };
                }
                return localChat;
              });

              prevChats.forEach((pc) => {
                if (!merged.some((mc) => mc.id === pc.id || normalizePhone(mc.phone) === normalizePhone(pc.phone))) {
                  merged.push(pc);
                }
              });

              return hasChanges ? merged : prevChats;
            });

            // If an active chat is open, immediately sync new messages, avatar, and contact info into view
            const curActive = activeChatRef.current;
            if (curActive) {
              const serverActive = data.chats.find(
                (c) => c.id === curActive.id || c.chatId === curActive.chatId || normalizePhone(c.phone) === normalizePhone(curActive.phone)
              );
              if (serverActive) {
                const hasNewMessages = serverActive.messages.length > (curActive.messages?.length || 0);
                const hasNewAvatar = serverActive.avatar && serverActive.avatar !== curActive.avatar;
                const hasNewName = serverActive.name && serverActive.name !== curActive.name;
                const hasNewOnline = serverActive.isOnline !== curActive.isOnline;
                const hasNewLastSeen = serverActive.lastSeen !== curActive.lastSeen;

                if (hasNewMessages || hasNewAvatar || hasNewName || hasNewOnline || hasNewLastSeen) {
                  setActiveChat((prev) => (prev ? {
                    ...prev,
                    messages: serverActive.messages,
                    avatar: serverActive.avatar || prev.avatar,
                    name: serverActive.name || prev.name,
                    about: serverActive.about || prev.about,
                    isOnline: serverActive.isOnline ?? prev.isOnline,
                    lastSeen: serverActive.lastSeen || prev.lastSeen
                  } : null));
                }
              }
            }
          }
        })
        .catch(() => {});
    }, 2000);

    return () => clearInterval(syncInterval);
  }, [user?.phone]);

  // Initialize Socket.IO connection (PERSISTENT: does NOT disconnect on chat switch)
  useEffect(() => {
    if (!user || !user.phone) return;

    try {
      const socket = io(SOCKET_SERVER_URL, {
        reconnectionAttempts: 20,
        reconnectionDelay: 1000,
        timeout: 10000
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('Connected to real-time chat server as:', user.phone);
        socket.emit('user_connected', {
          phone: user.phone,
          name: user.name,
          avatar: user.avatar
        });
        if (activeChatRef.current?.id) {
          socket.emit('join_chat', activeChatRef.current.id);
        }
      });

      // Receive incoming real-time message from another phone number
      socket.on('receive_message', (msg) => {
        console.log('Real message received in real-time:', msg);
        triggerMessageNotification(msg);

        const senderNorm = msg.senderCleanPhone || normalizePhone(msg.senderPhone);
        const curActive = activeChatRef.current;
        const isCurrent = curActive && (
          curActive.id === msg.chatId ||
          curActive.chatId === msg.chatId ||
          normalizePhone(curActive.phone) === senderNorm
        );

        // Update activeChat if currently open
        if (isCurrent) {
          setActiveChat((prev) => {
            if (!prev) return null;
            const alreadyHas = prev.messages.some((m) => m.id === msg.id);
            return {
              ...prev,
              avatar: msg.senderAvatar || prev.avatar,
              name: msg.senderName || prev.name,
              messages: alreadyHas ? prev.messages : [...prev.messages, msg]
            };
          });
        }

        // Update chats list and bump conversation to top
        setChats((prevChats) => {
          const existsIdx = prevChats.findIndex(
            (c) => normalizePhone(c.phone) === senderNorm || c.id === msg.chatId || c.chatId === msg.chatId
          );

          if (existsIdx >= 0) {
            const updated = [...prevChats];
            const target = updated[existsIdx];
            const alreadyHas = target.messages.some((m) => m.id === msg.id);
            const newTarget = {
              ...target,
              avatar: msg.senderAvatar || target.avatar,
              name: msg.senderName || target.name,
              unreadCount: isCurrent ? 0 : (target.unreadCount || 0) + (alreadyHas ? 0 : 1),
              messages: alreadyHas ? target.messages : [...target.messages, msg]
            };
            updated.splice(existsIdx, 1);
            return [newTarget, ...updated];
          } else {
            const newChat = {
              id: msg.chatId,
              chatId: msg.chatId,
              name: msg.senderName || `مستخدم ${msg.senderPhone}`,
              phone: msg.senderPhone,
              cleanPhone: senderNorm,
              avatar: msg.senderAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
              about: 'متاح في Pro Chats ☕️',
              isOnline: true,
              lastSeen: 'متصل الآن',
              unreadCount: isCurrent ? 0 : 1,
              messages: [msg]
            };
            return [newChat, ...prevChats];
          }
        });
      });

      // Real-time profile update broadcast listener (avatar, name, bio changes)
      socket.on('user_profile_updated', (updatedProfile) => {
        if (!updatedProfile || !updatedProfile.phone) return;
        console.log('User profile updated in real-time:', updatedProfile);
        const norm = normalizePhone(updatedProfile.phone);

        // 1. If this is the current logged-in user
        if (user && normalizePhone(user.phone) === norm) {
          setUser((prev) => {
            const fresh = { ...prev, ...updatedProfile };
            try {
              localStorage.setItem('whatsapp_user', JSON.stringify(fresh));
            } catch (e) {}
            return fresh;
          });
        }

        // 2. Update in chats list
        setChats((prevChats) => {
          return prevChats.map((c) => {
            if (normalizePhone(c.phone) === norm || c.cleanPhone === norm) {
              return {
                ...c,
                avatar: updatedProfile.avatar || c.avatar,
                name: updatedProfile.name || c.name,
                about: updatedProfile.about || c.about,
                isOnline: updatedProfile.isOnline ?? c.isOnline,
                lastSeen: updatedProfile.lastSeen || c.lastSeen
              };
            }
            return c;
          });
        });

        // 3. Update activeChat if currently looking at this conversation
        setActiveChat((prev) => {
          if (!prev) return null;
          if (normalizePhone(prev.phone) === norm || prev.cleanPhone === norm) {
            return {
              ...prev,
              avatar: updatedProfile.avatar || prev.avatar,
              name: updatedProfile.name || prev.name,
              about: updatedProfile.about || prev.about,
              isOnline: updatedProfile.isOnline ?? prev.isOnline,
              lastSeen: updatedProfile.lastSeen || prev.lastSeen
            };
          }
          return prev;
        });
      });

      // Typing indicator
      socket.on('typing_status', (data) => {
        setTypingContact(data);
      });

      // Read receipts update from recipient
      socket.on('messages_marked_read', (data) => {
        if (!data || !data.chatId) return;
        const myClean = user?.phone ? normalizePhone(user.phone) : '';

        setChats((prevChats) =>
          prevChats.map((c) => {
            if (c.id === data.chatId || c.chatId === data.chatId) {
              return {
                ...c,
                unreadCount: 0,
                messages: (c.messages || []).map((m) => {
                  const sNorm = m.senderCleanPhone || normalizePhone(m.senderPhone);
                  if (m.senderId === 'me' || (myClean && sNorm === myClean)) {
                    return { ...m, status: 'read' };
                  }
                  return m;
                })
              };
            }
            return c;
          })
        );

        setActiveChat((prev) => {
          if (!prev) return null;
          if (prev.id === data.chatId || prev.chatId === data.chatId) {
            return {
              ...prev,
              unreadCount: 0,
              messages: (prev.messages || []).map((m) => {
                const sNorm = m.senderCleanPhone || normalizePhone(m.senderPhone);
                if (m.senderId === 'me' || (myClean && sNorm === myClean)) {
                  return { ...m, status: 'read' };
                }
                return m;
              })
            };
          }
          return prev;
        });
      });

      // Emoji reaction update in real-time
      socket.on('message_reaction_updated', (data) => {
        if (!data || !data.chatId || !data.messageId) return;

        const updateReactionsInList = (msgList) =>
          (msgList || []).map((m) =>
            m.id === data.messageId ? { ...m, reactions: data.reactions || {} } : m
          );

        setChats((prevChats) =>
          prevChats.map((c) => {
            if (c.id === data.chatId || c.chatId === data.chatId) {
              return {
                ...c,
                messages: updateReactionsInList(c.messages)
              };
            }
            return c;
          })
        );

        setActiveChat((prev) => {
          if (!prev) return null;
          if (prev.id === data.chatId || prev.chatId === data.chatId) {
            return {
              ...prev,
              messages: updateReactionsInList(prev.messages)
            };
          }
          return prev;
        });
      });

      // Incoming call event from another phone number
      socket.on('incoming_call', (data) => {
        setActiveCall({
          contact: data.caller,
          type: data.type || 'audio'
        });
      });

      // User presence updates (Online/Offline)
      socket.on('user_presence', (data) => {
        setChats((prev) =>
          prev.map((c) => {
            if (normalizePhone(c.phone) === data.cleanPhone) {
              return {
                ...c,
                isOnline: data.isOnline,
                lastSeen: data.isOnline ? 'متصل الآن' : data.lastSeen || 'غير متصل'
              };
            }
            return c;
          })
        );
      });

      return () => {
        socket.disconnect();
      };
    } catch (e) {
      console.warn('Socket connection note:', e);
    }
  }, [user?.phone]);

  // Login handler
  const handleLoginSuccess = (newUser) => {
    setUser(newUser);
    try {
      localStorage.setItem('whatsapp_user', JSON.stringify(newUser));
    } catch (e) {
      console.warn(e);
    }
  };

  // Logout handler
  const handleLogout = () => {
    try {
      localStorage.removeItem('whatsapp_user');
      localStorage.removeItem('whatsapp_chats');
    } catch (e) {
      console.warn(e);
    }
    setUser(null);
    setChats([]);
    setActiveChat(null);
    setShowProfile(false);
  };

  // Total unread messages
  const unreadTotal = chats.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  // Handle sending message to recipient phone
  const handleSendMessage = ({ type, text, mediaUrl, audioDuration, replyTo }) => {
    if (!activeChat || !user) return;

    const chatId = getChatId(user.phone, activeChat.phone);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      senderId: 'me',
      chatId: chatId,
      senderPhone: user.phone,
      senderCleanPhone: normalizePhone(user.phone),
      senderName: user.name,
      senderAvatar: user.avatar,
      recipientPhone: activeChat.phone,
      recipientCleanPhone: normalizePhone(activeChat.phone),
      type: type || 'text',
      text: text || '',
      mediaUrl: mediaUrl || null,
      audioDuration: audioDuration || null,
      replyTo: replyTo || null,
      reactions: {},
      timestamp: timeStr,
      status: 'delivered'
    };

    // Update local state immediately
    const updatedChat = {
      ...activeChat,
      id: chatId,
      messages: [...(activeChat.messages || []), newMessage]
    };

    setActiveChat(updatedChat);
    setChats((prev) => {
      const rest = prev.filter(
        (c) => normalizePhone(c.phone) !== normalizePhone(activeChat.phone)
      );
      return [updatedChat, ...rest];
    });

    // Emit via Socket.IO to server for real delivery to recipient phone
    if (socketRef.current) {
      socketRef.current.emit('send_message', newMessage);
    }
  };

  // Handle toggling emoji reaction on a message
  const handleReactMessage = ({ chatId, messageId, emoji }) => {
    if (!user || !chatId || !messageId) return;

    if (socketRef.current) {
      socketRef.current.emit('react_message', {
        chatId,
        messageId,
        emoji,
        phone: user.phone
      });
    }

    const toggleReaction = (reactionsObj) => {
      const reactions = { ...(reactionsObj || {}) };
      const currentReactors = reactions[emoji] ? [...reactions[emoji]] : [];
      const index = currentReactors.indexOf(user.phone);
      if (index > -1) {
        currentReactors.splice(index, 1);
        if (currentReactors.length === 0) {
          delete reactions[emoji];
        } else {
          reactions[emoji] = currentReactors;
        }
      } else {
        reactions[emoji] = [...currentReactors, user.phone];
      }
      return reactions;
    };

    const updateInMsgs = (msgs) =>
      (msgs || []).map((m) =>
        m.id === messageId ? { ...m, reactions: toggleReaction(m.reactions) } : m
      );

    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId || c.chatId === chatId
          ? { ...c, messages: updateInMsgs(c.messages) }
          : c
      )
    );

    setActiveChat((prev) => {
      if (!prev) return null;
      if (prev.id === chatId || prev.chatId === chatId) {
        return { ...prev, messages: updateInMsgs(prev.messages) };
      }
      return prev;
    });
  };

  // Handle toggling pin status for a chat
  const handleTogglePinChat = (chatId) => {
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId || c.chatId === chatId
          ? { ...c, isPinned: !c.isPinned }
          : c
      )
    );
  };

  // Start call to another phone number
  const handleStartCall = (contact, type) => {
    setActiveCall({
      contact,
      type: type || 'audio'
    });

    if (socketRef.current && contact?.phone && user) {
      socketRef.current.emit('start_call', {
        senderPhone: user.phone,
        senderName: user.name,
        senderAvatar: user.avatar,
        recipientPhone: contact.phone,
        type: type || 'audio'
      });
    }
  };

  // Add new status
  const handleAddStatus = (newStory) => {
    if (!user) return;
    const myStatus = {
      id: 'my_status_' + Date.now(),
      userName: user.name,
      userAvatar: user.avatar,
      time: 'الآن',
      stories: [newStory]
    };
    setStatuses([myStatus, ...statuses]);
  };

  // Add new contact or select existing
  const handleAddNewContact = (newContact) => {
    const norm = normalizePhone(newContact.phone);
    const existing = chats.find((c) => normalizePhone(c.phone) === norm);

    if (existing) {
      setActiveChat(existing);
    } else {
      const chatId = getChatId(user.phone, newContact.phone);
      const readyContact = {
        ...newContact,
        id: chatId,
        chatId: chatId
      };
      setChats([readyContact, ...chats]);
      setActiveChat(readyContact);
    }

    setShowNewChat(false);
  };

  // Update profile
  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
    try {
      localStorage.setItem('whatsapp_user', JSON.stringify(updatedUser));
    } catch (e) {
      console.warn(e);
    }

    // Update in chats state if user has self chat or contact matches
    const myNorm = normalizePhone(updatedUser.phone);
    setChats((prev) =>
      prev.map((c) => {
        if (normalizePhone(c.phone) === myNorm || c.cleanPhone === myNorm) {
          return { ...c, avatar: updatedUser.avatar, name: updatedUser.name };
        }
        return c;
      })
    );
    if (activeChat && (normalizePhone(activeChat.phone) === myNorm || activeChat.cleanPhone === myNorm)) {
      setActiveChat((prev) => (prev ? { ...prev, avatar: updatedUser.avatar, name: updatedUser.name } : null));
    }

    // Update on server
    fetch(`${SOCKET_SERVER_URL}/api/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedUser)
    }).catch(console.warn);

    // Sync with live socket if connected
    if (socketRef.current?.connected) {
      socketRef.current.emit('user_connected', {
        phone: updatedUser.phone,
        name: updatedUser.name,
        avatar: updatedUser.avatar
      });
      socketRef.current.emit('update_profile', updatedUser);
    }
  };

  // Live update contact info when loaded from lookup or modal
  const handleUpdateContactInfo = (contactInfo) => {
    if (!contactInfo || !contactInfo.phone) return;
    const norm = normalizePhone(contactInfo.phone);

    setChats((prev) =>
      prev.map((c) => {
        if (normalizePhone(c.phone) === norm || c.cleanPhone === norm) {
          return {
            ...c,
            avatar: contactInfo.avatar || c.avatar,
            name: contactInfo.name || c.name,
            about: contactInfo.about || c.about,
            isOnline: contactInfo.isOnline ?? c.isOnline,
            lastSeen: contactInfo.lastSeen || c.lastSeen
          };
        }
        return c;
      })
    );

    setActiveChat((prev) => {
      if (!prev) return null;
      if (normalizePhone(prev.phone) === norm || prev.cleanPhone === norm) {
        return {
          ...prev,
          avatar: contactInfo.avatar || prev.avatar,
          name: contactInfo.name || prev.name,
          about: contactInfo.about || prev.about,
          isOnline: contactInfo.isOnline ?? prev.isOnline,
          lastSeen: contactInfo.lastSeen || prev.lastSeen
        };
      }
      return prev;
    });
  };

  // Delete chat handler
  const handleDeleteChat = async (chatId) => {
    try {
      await fetch(`${SOCKET_SERVER_URL}/api/chats/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId })
      });
    } catch (e) {
      console.warn('Error deleting chat on server:', e);
    }

    // Remove from local state
    setChats((prev) => prev.filter((c) => c.id !== chatId && c.chatId !== chatId));

    // If currently viewing this chat, exit chat room
    if (activeChat && (activeChat.id === chatId || activeChat.chatId === chatId)) {
      setActiveChat(null);
    }
  };

  // Clear messages in chat handler
  const handleClearChat = async (chatId) => {
    try {
      await fetch(`${SOCKET_SERVER_URL}/api/chats/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId })
      });
    } catch (e) {
      console.warn('Error clearing chat on server:', e);
    }

    // Clear messages in local chats state
    setChats((prev) =>
      prev.map((c) => {
        if (c.id === chatId || c.chatId === chatId) {
          return { ...c, messages: [] };
        }
        return c;
      })
    );

    // Also update activeChat messages
    if (activeChat && (activeChat.id === chatId || activeChat.chatId === chatId)) {
      setActiveChat((prev) => (prev ? { ...prev, messages: [] } : null));
    }
  };

  return (
    <div className={isDarkMode ? 'dark' : ''} dir="rtl">
      <PhoneFrame isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode}>
        {/* Floating In-App Notification Banner */}
        <NotificationBanner
          notification={inAppNotification}
          onOpenChat={handleOpenChatFromNotification}
          onClose={() => setInAppNotification(null)}
          isDarkMode={isDarkMode}
        />

        {/* If user is NOT logged in, show Phone Login Screen */}
        {!user ? (
          <AuthScreen
            onLoginSuccess={handleLoginSuccess}
            isDarkMode={isDarkMode}
          />
        ) : activeChat ? (
          /* If a chat is active, show the Chat Room */
          <ChatRoom
            chat={activeChat}
            user={user}
            socket={socketRef.current}
            onBack={() => setActiveChat(null)}
            onSendMessage={handleSendMessage}
            onReactMessage={handleReactMessage}
            onStartCall={handleStartCall}
            onDeleteChat={handleDeleteChat}
            onClearChat={handleClearChat}
            onUpdateContact={handleUpdateContactInfo}
            typingContact={typingContact}
            isDarkMode={isDarkMode}
          />
        ) : (
          /* Otherwise show main tabs: TopBar + Chats / Status / Calls */
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <TopBar
              user={user}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              unreadTotal={unreadTotal}
              onOpenProfile={() => setShowProfile(true)}
              onOpenNewChat={() => setShowNewChat(true)}
              onSearchToggle={(val) => setIsSearching(val)}
              isSearching={isSearching}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
            />

            {/* Tab Body */}
            {activeTab === 'chats' && (
              <ChatList
                chats={chats}
                onSelectChat={(chat) => setActiveChat(chat)}
                onDeleteChat={handleDeleteChat}
                onTogglePinChat={handleTogglePinChat}
                typingContact={typingContact}
                searchQuery={searchQuery}
                onOpenNewChat={() => setShowNewChat(true)}
                isDarkMode={isDarkMode}
              />
            )}

            {activeTab === 'status' && (
              <StatusViewer
                statuses={statuses}
                user={user}
                onAddStatus={handleAddStatus}
                isDarkMode={isDarkMode}
              />
            )}

            {activeTab === 'calls' && (
              <CallsTab
                calls={calls}
                onStartCall={handleStartCall}
                isDarkMode={isDarkMode}
              />
            )}
          </div>
        )}

        {/* Profile / Settings Modal */}
        {showProfile && user && (
          <ProfileModal
            user={user}
            onUpdateUser={handleUpdateUser}
            onClose={() => setShowProfile(false)}
            onLogout={handleLogout}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
          />
        )}

        {/* New Chat / Contacts Modal */}
        {showNewChat && (
          <NewChatModal
            contacts={chats}
            onSelectContact={(contact) => {
              setActiveChat(contact);
              setShowNewChat(false);
            }}
            onAddNewContact={handleAddNewContact}
            onClose={() => setShowNewChat(false)}
            isDarkMode={isDarkMode}
          />
        )}

        {/* Call Modal */}
        {activeCall && (
          <CallModal
            callData={activeCall}
            onClose={() => setActiveCall(null)}
          />
        )}
      </PhoneFrame>
    </div>
  );
}
