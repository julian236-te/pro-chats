import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowRight, Phone, Video, MoreVertical, Paperclip, Send, Mic, 
  Smile, Check, CheckCheck, Play, Pause, Image as ImageIcon,
  Trash2, X, Lock, FileText, Camera, Download, Eye, Info, Reply, FileDown
} from 'lucide-react';
import { playSentSound, playSimulatedVoiceNote } from '../utils/audio';
import { normalizePhone } from '../utils/phone';
import MediaViewerModal from './MediaViewerModal';
import ContactInfoModal from './ContactInfoModal';

const QUICK_EMOJIS = ['😊', '😂', '❤️', '👍', '🔥', '🙏', '😍', '👏', '🎉', '☕️', '✨', '🌹', '👋', '💯', '🤔', '💪'];
const REACTION_EMOJIS = ['❤️', '😂', '👍', '🔥', '😮', '🙏'];

export default function ChatRoom({
  chat,
  user,
  socket,
  onBack,
  onSendMessage,
  onReactMessage,
  onStartCall,
  onDeleteChat,
  onClearChat,
  onUpdateContact,
  typingContact,
  isDarkMode
}) {
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null); // { type: 'image' | 'video', url: string }
  const [viewingMedia, setViewingMedia] = useState(null); // Modal state

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const recordingSecondsRef = useRef(0);
  const audioChunksRef = useRef([]);

  // Playing audio state
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState('');
  const activeAudioRef = useRef(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat.messages, typingContact]);

  // Read receipts: mark messages as read in this conversation
  useEffect(() => {
    if (socket && chat && user?.phone) {
      socket.emit('mark_messages_read', {
        chatId: chat.id || chat.chatId,
        readerPhone: user.phone
      });
    }
  }, [chat.id, chat.messages?.length, socket, user?.phone]);

  // Typing indicator debounce broadcast
  useEffect(() => {
    if (!socket || !chat || !user) return;
    if (inputText.trim().length > 0) {
      socket.emit('typing', {
        chatId: chat.id || chat.chatId,
        senderPhone: user.phone,
        recipientPhone: chat.phone,
        isTyping: true
      });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', {
          chatId: chat.id || chat.chatId,
          senderPhone: user.phone,
          recipientPhone: chat.phone,
          isTyping: false
        });
      }, 1500);
    } else {
      socket.emit('typing', {
        chatId: chat.id || chat.chatId,
        senderPhone: user.phone,
        recipientPhone: chat.phone,
        isTyping: false
      });
    }

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [inputText, socket, chat, user]);

  // Stop typing on chat exit
  useEffect(() => {
    return () => {
      if (socket && chat && user) {
        socket.emit('typing', {
          chatId: chat.id || chat.chatId,
          senderPhone: user.phone,
          recipientPhone: chat.phone,
          isTyping: false
        });
      }
    };
  }, [chat.id, socket, user]);

  // Clean up audio on unmount or chat switch
  useEffect(() => {
    return () => {
      if (activeAudioRef.current) {
        if (typeof activeAudioRef.current.stop === 'function') {
          activeAudioRef.current.stop();
        } else if (typeof activeAudioRef.current.pause === 'function') {
          activeAudioRef.current.pause();
        }
      }
    };
  }, [chat.id]);

  // One-click direct download helper
  const handleDownloadFile = (url, type, e) => {
    e?.stopPropagation();
    try {
      const link = document.createElement('a');
      link.href = url;
      const ext = type === 'video' || url.includes('.mp4') ? 'mp4' : 'jpg';
      link.download = `ProChats_${Date.now()}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.warn('Download error:', err);
      window.open(url, '_blank');
    }
  };

  // Export Chat History to .txt file
  const handleExportChat = () => {
    if (!chat.messages || chat.messages.length === 0) {
      alert('لا توجد رسائل لتصديرها في هذه المحادثة.');
      return;
    }
    let content = `========================================\n`;
    content += `سجل محادثة Pro Chats مع: ${chat.name} (${chat.phone})\n`;
    content += `تاريخ التصدير: ${new Date().toLocaleString('ar-EG')}\n`;
    content += `عدد الرسائل: ${chat.messages.length}\n`;
    content += `========================================\n\n`;

    chat.messages.forEach((msg) => {
      const myClean = user?.phone ? normalizePhone(user.phone) : '';
      const senderClean = msg.senderCleanPhone || normalizePhone(msg.senderPhone);
      const isMe = msg.senderId === 'me' || (myClean && senderClean && myClean === senderClean);
      const sender = isMe ? (user?.name || 'أنت') : (msg.senderName || chat.name);
      const time = msg.timestamp || '';
      let body = msg.text || '';
      if (msg.type === 'image') body = `[صورة] ${body}`;
      if (msg.type === 'video') body = `[فيديو] ${body}`;
      if (msg.type === 'voice') body = `[رسالة صوتية ${msg.audioDuration || ''}]`;
      if (msg.replyTo) {
        body = `[رد على ${msg.replyTo.senderName}: "${msg.replyTo.text}"] ` + body;
      }
      content += `[${time}] ${sender}: ${body}\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ProChats_${chat.name.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_')}_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle Send text, image or video message
  const handleSend = () => {
    if (!inputText.trim() && !selectedMedia) return;

    const replyData = replyingTo ? {
      id: replyingTo.id,
      text: replyingTo.text,
      senderName: replyingTo.senderName,
      type: replyingTo.type
    } : null;

    if (selectedMedia) {
      onSendMessage({
        type: selectedMedia.type,
        mediaUrl: selectedMedia.url,
        text: inputText.trim(),
        replyTo: replyData
      });
      setSelectedMedia(null);
    } else {
      onSendMessage({
        type: 'text',
        text: inputText.trim(),
        replyTo: replyData
      });
    }

    setInputText('');
    setReplyingTo(null);
    setShowEmojiPicker(false);
    playSentSound();
  };

  // Start Voice Note Recording (Microphone)
  const startRecording = async () => {
    recordingSecondsRef.current = 0;
    setRecordingSeconds(0);
    audioChunksRef.current = [];
    setIsRecording(true);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          const secs = recordingSecondsRef.current || 1;
          const durationStr = `0:${secs < 10 ? '0' : ''}${secs}`;
          const replyData = replyingTo ? {
            id: replyingTo.id,
            text: replyingTo.text,
            senderName: replyingTo.senderName,
            type: replyingTo.type
          } : null;

          if (audioChunksRef.current.length > 0) {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64Audio = reader.result;
              onSendMessage({
                type: 'voice',
                mediaUrl: base64Audio,
                audioDuration: durationStr,
                text: '',
                replyTo: replyData
              });
              playSentSound();
              setReplyingTo(null);
            };
            reader.readAsDataURL(audioBlob);
          } else {
            onSendMessage({
              type: 'voice',
              mediaUrl: null,
              audioDuration: durationStr,
              text: '',
              replyTo: replyData
            });
            playSentSound();
            setReplyingTo(null);
          }

          stream.getTracks().forEach((track) => track.stop());
        };

        recorder.start();
      }
    } catch (err) {
      console.warn('Microphone permission not granted, will use simulated voice note:', err);
    }

    recordingTimerRef.current = setInterval(() => {
      recordingSecondsRef.current += 1;
      setRecordingSeconds(recordingSecondsRef.current);
    }, 1000);
  };

  // Stop & Send Voice Note
  const stopAndSendRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    } else {
      const secs = recordingSecondsRef.current || 2;
      const durationStr = `0:${secs < 10 ? '0' : ''}${secs}`;
      onSendMessage({
        type: 'voice',
        mediaUrl: null,
        audioDuration: durationStr,
        text: ''
      });
      playSentSound();
    }

    setIsRecording(false);
    setRecordingSeconds(0);
  };

  // Cancel Recording
  const cancelRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    setIsRecording(false);
    setRecordingSeconds(0);
  };

  // Handle media upload (Photos & Videos)
  const handleMediaSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedMedia({
          type: isVideo ? 'video' : 'image',
          url: event.target.result
        });
        setShowAttachMenu(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Toggle Playing Voice Note (Audible Playback)
  const togglePlayAudio = (msg) => {
    if (playingAudioId === msg.id) {
      if (activeAudioRef.current) {
        if (typeof activeAudioRef.current.stop === 'function') {
          activeAudioRef.current.stop();
        } else if (typeof activeAudioRef.current.pause === 'function') {
          activeAudioRef.current.pause();
        }
      }
      setPlayingAudioId(null);
      setAudioProgress(0);
      setAudioCurrentTime('');
      return;
    }

    if (activeAudioRef.current) {
      if (typeof activeAudioRef.current.stop === 'function') {
        activeAudioRef.current.stop();
      } else if (typeof activeAudioRef.current.pause === 'function') {
        activeAudioRef.current.pause();
      }
    }

    setPlayingAudioId(msg.id);
    setAudioProgress(0);

    if (msg.mediaUrl) {
      try {
        const audio = new Audio(msg.mediaUrl);
        activeAudioRef.current = audio;

        audio.ontimeupdate = () => {
          if (audio.duration) {
            const pct = (audio.currentTime / audio.duration) * 100;
            const currentSec = Math.floor(audio.currentTime);
            setAudioProgress(pct);
            setAudioCurrentTime(`0:${currentSec < 10 ? '0' : ''}${currentSec}`);
          }
        };

        audio.onended = () => {
          setPlayingAudioId(null);
          setAudioProgress(0);
          setAudioCurrentTime('');
        };

        audio.onerror = () => {
          playFallbackSynth(msg);
        };

        audio.play().catch(() => {
          playFallbackSynth(msg);
        });
      } catch (e) {
        playFallbackSynth(msg);
      }
    } else {
      playFallbackSynth(msg);
    }
  };

  const playFallbackSynth = (msg) => {
    let durSec = 6;
    if (msg.audioDuration) {
      const parts = msg.audioDuration.split(':');
      if (parts.length === 2) {
        durSec = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10) || 6;
      }
    }

    const synth = playSimulatedVoiceNote(
      durSec,
      (elapsedSec, pct) => {
        const currentSec = Math.floor(elapsedSec);
        setAudioProgress(pct);
        setAudioCurrentTime(`0:${currentSec < 10 ? '0' : ''}${currentSec}`);
      },
      () => {
        setPlayingAudioId(null);
        setAudioProgress(0);
        setAudioCurrentTime('');
      }
    );
    activeAudioRef.current = synth;
  };

  return (
    <div className="relative flex-1 flex flex-col h-full overflow-hidden select-none">
      {/* Hidden File Input for photos & videos */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleMediaSelect}
        accept="image/*,video/*"
        className="hidden"
      />

      {/* Chat Room Header */}
      <header className={`px-3 py-2 flex items-center justify-between z-20 shadow-sm transition-colors ${
        isDarkMode ? 'bg-[#2c201a] text-[#f7ece1]' : 'bg-[#784e38] text-white'
      }`}>
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <button
            onClick={onBack}
            className="p-1 -mr-1 rounded-full hover:bg-black/10 active:scale-95 transition-transform"
            title="رجوع"
          >
            <ArrowRight size={22} className="rotate-180" />
          </button>

          {/* Clickable Contact Profile Area */}
          <div
            onClick={() => setShowContactInfo(true)}
            className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer group hover:opacity-90 active:scale-[0.99] transition-all"
            title="عرض معلومات الحساب ورقم الهاتف"
          >
            <div className="relative flex-shrink-0">
              <img
                src={chat.avatar}
                alt={chat.name}
                className="w-10 h-10 rounded-full object-cover ring-1 ring-white/20 group-hover:ring-[#e29968] transition-all"
              />
              {chat.isOnline && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#c27847] ring-2 ring-white dark:ring-[#2c201a]" />
              )}
            </div>

            <div className="flex-1 min-w-0 text-right">
              <h2 className="text-base font-semibold truncate leading-tight group-hover:text-[#f3eae0] transition-colors">
                {chat.name}
              </h2>
              <p className="text-[11px] truncate opacity-90 leading-tight">
                {typingContact?.isTyping && (
                  typingContact?.chatId === chat.id ||
                  typingContact?.chatId === chat.chatId ||
                  (typingContact?.senderPhone && chat.phone && typingContact.senderPhone.replace(/\D/g, '') === chat.phone.replace(/\D/g, ''))
                ) ? (
                  <span className="text-[#e29968] font-bold animate-pulse">
                    يكتب الآن...
                  </span>
                ) : chat.isOnline ? (
                  'متصل الآن'
                ) : (
                  chat.lastSeen || 'آخر ظهور اليوم'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Video Call, Voice Call & Menu buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onStartCall(chat, 'video')}
            className="p-1.5 rounded-full hover:bg-black/10 active:scale-90 transition-transform"
            title="مكالمة فيديو"
          >
            <Video size={20} />
          </button>

          <button
            onClick={() => onStartCall(chat, 'audio')}
            className="p-1.5 rounded-full hover:bg-black/10 active:scale-90 transition-transform"
            title="مكالمة صوتية"
          >
            <Phone size={19} />
          </button>

          {/* Three dots menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-full hover:bg-black/10 active:scale-90 transition-transform"
              title="المزيد من الخيارات"
            >
              <MoreVertical size={19} />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <div className={`absolute left-0 mt-2 w-48 rounded-xl shadow-2xl py-2 z-50 text-sm animate-fadeIn border ${
                  isDarkMode ? 'bg-[#33251e] border-[#443026] text-[#f7ece1]' : 'bg-white border-[#ebdcd0] text-[#3d2314]'
                }`}>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowContactInfo(true);
                    }}
                    className="w-full px-4 py-2.5 text-right flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <span>معلومات الحساب</span>
                    <Info size={16} className="text-[#b89f8f]" />
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      handleExportChat();
                    }}
                    className="w-full px-4 py-2.5 text-right flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <span>تصدير المحادثة (TXT)</span>
                    <FileDown size={16} className="text-[#b89f8f]" />
                  </button>

                  <hr className="my-1 border-gray-200 dark:border-[#443026]" />

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      if (window.confirm('هل تريد مسح كافة الرسائل من هذه المحادثة؟')) {
                        onClearChat(chat.id || chat.chatId);
                      }
                    }}
                    className="w-full px-4 py-2.5 text-right flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <span>مسح الرسائل</span>
                    <Trash2 size={16} className="text-[#b89f8f]" />
                  </button>

                  <hr className="my-1 border-gray-200 dark:border-[#443026]" />

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      if (window.confirm(`هل أنت متأكد من حذف محادثة "${chat.name}" بالكامل من حسابك؟`)) {
                        onDeleteChat(chat.id || chat.chatId);
                      }
                    }}
                    className="w-full px-4 py-2.5 text-right flex items-center justify-between hover:bg-red-500/10 text-red-500 font-semibold transition-colors"
                  >
                    <span>حذف المحادثة</span>
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Chat Messages Body with Pro Chats Warm Doodle Wallpaper */}
      <div className={`flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2.5 ${
        isDarkMode ? 'wa-chat-bg-dark' : 'wa-chat-bg-light'
      }`}>
        {/* End-to-End Encryption Notice Badge */}
        <div className="mx-auto my-1 max-w-[85%] text-center">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] shadow-sm ${
            isDarkMode 
              ? 'bg-[#2c201a] text-[#e29968] border border-[#443026]' 
              : 'bg-[#faf2e9] text-[#784e38] border border-[#ecd9c7]'
          }`}>
            <Lock size={12} className="flex-shrink-0 text-[#c27847]" />
            <span>محادثات Pro Chats مشفرة تماماً بين الطرفين بأعلى درجات الأمان.</span>
          </div>
        </div>

        {/* Date Divider Badge */}
        <div className="flex justify-center my-1">
          <span className={`text-[11px] font-medium px-3 py-1 rounded-lg shadow-sm ${
            isDarkMode ? 'bg-[#2c201a] text-[#b89f8f]' : 'bg-white text-[#784e38]'
          }`}>
            اليوم
          </span>
        </div>

        {/* Messages List */}
        {chat.messages.map((msg) => {
          const myPhoneNorm = user ? normalizePhone(user.phone) : '';
          const senderNorm = msg.senderCleanPhone || normalizePhone(msg.senderPhone);
          const isMe = msg.senderId === 'me' || (myPhoneNorm && senderNorm && myPhoneNorm === senderNorm);
          const isPlayingThis = playingAudioId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[82%] relative group/msg ${
                isMe ? 'self-end items-end' : 'self-start items-start'
              }`}
            >
              {/* Floating Quick Action Bar (Reactions + Reply) on hover */}
              <div className={`absolute -top-7 ${isMe ? 'left-0' : 'right-0'} opacity-0 group-hover/msg:opacity-100 transition-all duration-150 z-20 flex items-center gap-1 bg-white/95 dark:bg-[#33251e]/95 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-md border border-[#ebdcd0] dark:border-[#443026] pointer-events-auto`}>
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReactMessage?.({
                        chatId: chat.id || chat.chatId,
                        messageId: msg.id,
                        emoji
                      });
                    }}
                    className="text-xs hover:scale-130 active:scale-95 transition-transform p-0.5"
                    title={`تفاعل بـ ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}

                <span className="w-[1px] h-3 bg-gray-300 dark:bg-gray-600 mx-0.5" />

                {/* Reply button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setReplyingTo({
                      id: msg.id,
                      text: msg.text || (msg.type === 'voice' ? 'رسالة صوتية' : msg.type === 'image' ? 'صورة' : 'فيديو'),
                      senderName: isMe ? 'أنت' : (msg.senderName || chat.name),
                      type: msg.type
                    });
                  }}
                  className="text-[#b89f8f] hover:text-[#c27847] p-0.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  title="رد على هذه الرسالة"
                >
                  <Reply size={13} />
                </button>
              </div>

              {/* Group sender name */}
              {chat.isGroup && !isMe && msg.senderName && (
                <span className="text-[11px] font-bold text-amber-600 mb-0.5 px-1">
                  {msg.senderName}
                </span>
              )}

              {/* Message Bubble Container */}
              <div className={`px-3 py-2 rounded-2xl shadow-sm relative transition-all ${
                isMe
                  ? isDarkMode
                    ? 'bg-[#674431] text-[#fdf7f2] rounded-br-xs'
                    : 'bg-[#fcf4ec] text-[#3d2314] rounded-br-xs border border-[#ebdcd0]'
                  : isDarkMode
                    ? 'bg-[#2c201a] text-[#f7ece1] rounded-bl-xs'
                    : 'bg-white text-[#3d2314] rounded-bl-xs border border-gray-100'
              }`}>
                {/* Quoted Reply Box */}
                {msg.replyTo && (
                  <div className={`mb-1.5 p-2 rounded-xl border-r-4 border-[#c27847] text-right text-xs ${
                    isDarkMode ? 'bg-black/25 text-[#f7ece1]' : 'bg-black/5 text-[#3d2314]'
                  }`}>
                    <span className="font-bold text-[#c27847] block text-[11px] truncate">
                      {msg.replyTo.senderName}
                    </span>
                    <span className="opacity-80 line-clamp-2 text-[11px] truncate">
                      {msg.replyTo.text}
                    </span>
                  </div>
                )}
                {/* 1. Image Message with Click-to-View & Download Button */}
                {msg.type === 'image' && (
                  <div className="relative mb-1.5 overflow-hidden rounded-xl group/media cursor-pointer">
                    <img
                      src={msg.mediaUrl}
                      alt="مرفق"
                      onClick={() => setViewingMedia({
                        type: 'image',
                        url: msg.mediaUrl,
                        senderName: isMe ? 'أنت' : (msg.senderName || chat.name),
                        timestamp: msg.timestamp,
                        caption: msg.text
                      })}
                      className="max-h-64 w-full object-cover rounded-xl transition-transform hover:scale-[1.02]"
                    />

                    {/* Quick Action Overlay (View / Download) */}
                    <div className="absolute top-2 left-2 flex items-center gap-1 opacity-90 group-hover/media:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleDownloadFile(msg.mediaUrl, 'image', e)}
                        className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white shadow-md transition-transform active:scale-95 flex items-center gap-1 text-[10px]"
                        title="تحميل الصورة"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        onClick={() => setViewingMedia({
                          type: 'image',
                          url: msg.mediaUrl,
                          senderName: isMe ? 'أنت' : (msg.senderName || chat.name),
                          timestamp: msg.timestamp,
                          caption: msg.text
                        })}
                        className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white shadow-md transition-transform active:scale-95"
                        title="عرض بملء الشاشة"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. Video Message with Click-to-View & Download Button */}
                {msg.type === 'video' && (
                  <div className="relative mb-1.5 overflow-hidden rounded-xl group/media cursor-pointer bg-black/40">
                    <video
                      src={msg.mediaUrl}
                      className="max-h-64 w-full object-cover rounded-xl"
                      preload="metadata"
                      onClick={() => setViewingMedia({
                        type: 'video',
                        url: msg.mediaUrl,
                        senderName: isMe ? 'أنت' : (msg.senderName || chat.name),
                        timestamp: msg.timestamp,
                        caption: msg.text
                      })}
                    />

                    {/* Center Big Play Button */}
                    <div
                      onClick={() => setViewingMedia({
                        type: 'video',
                        url: msg.mediaUrl,
                        senderName: isMe ? 'أنت' : (msg.senderName || chat.name),
                        timestamp: msg.timestamp,
                        caption: msg.text
                      })}
                      className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#a56a4c] text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110">
                        <Play size={22} className="translate-x-0.5" />
                      </div>
                    </div>

                    {/* Quick Download Overlay */}
                    <div className="absolute top-2 left-2 flex items-center gap-1 z-10">
                      <button
                        onClick={(e) => handleDownloadFile(msg.mediaUrl, 'video', e)}
                        className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white shadow-md transition-transform active:scale-95"
                        title="تحميل الفيديو"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. Voice Note Message */}
                {msg.type === 'voice' && (
                  <div className="flex items-center gap-3 py-1 min-w-[220px]">
                    <button
                      onClick={() => togglePlayAudio(msg)}
                      className={`w-11 h-11 rounded-full flex items-center justify-center text-white flex-shrink-0 transition-transform active:scale-95 shadow-sm ${
                        isPlayingThis ? 'bg-[#c27847] ring-2 ring-[#c27847]/40' : isMe ? 'bg-[#a56a4c]' : 'bg-[#784e38]'
                      }`}
                      title={isPlayingThis ? 'إيقاف مؤقت' : 'تشغيل الفويس نوت'}
                    >
                      {isPlayingThis ? <Pause size={19} /> : <Play size={19} className="translate-x-0.5" />}
                    </button>

                    <div className="flex-1 flex flex-col justify-center gap-1.5">
                      <div className="flex items-center gap-[3px] h-6 cursor-pointer" onClick={() => togglePlayAudio(msg)}>
                        {[35, 65, 30, 85, 55, 40, 75, 95, 60, 30, 70, 50, 80, 30, 60, 40].map((h, idx) => {
                          const barPct = (idx / 16) * 100;
                          const isPassed = isPlayingThis && audioProgress >= barPct;

                          return (
                            <span
                              key={idx}
                              style={{
                                height: isPlayingThis 
                                  ? `${Math.max(25, (h + Math.sin(audioProgress + idx) * 20))}%` 
                                  : `${h}%`
                              }}
                              className={`w-[3px] rounded-full transition-all duration-200 ${
                                isPassed
                                  ? 'bg-[#c27847]'
                                  : isDarkMode ? 'bg-[#5c4335]' : 'bg-[#d6c4b2]'
                              }`}
                            />
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-semibold opacity-85">
                        <span className="font-mono">
                          {isPlayingThis && audioCurrentTime
                            ? `${audioCurrentTime} / ${msg.audioDuration || '0:10'}`
                            : msg.audioDuration || '0:10'}
                        </span>
                        <div className="flex items-center gap-1">
                          <Mic size={13} className={isMe ? 'text-[#c27847]' : 'text-amber-500'} />
                          {isPlayingThis && (
                            <span className="text-[10px] text-[#c27847] animate-pulse">جاري التشغيل</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Text Content */}
                {msg.text && (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words pl-2 text-right">
                    {msg.text}
                  </p>
                )}

                {/* Timestamp & Read Receipts */}
                <div className="flex items-center justify-end gap-1 mt-1 text-[10px] select-none opacity-80">
                  <span className={isDarkMode ? 'text-[#b89f8f]' : 'text-[#8c6f5d]'}>
                    {msg.timestamp}
                  </span>
                  {isMe && (
                    <span>
                      {msg.status === 'read' ? (
                        <CheckCheck size={14} className="text-[#38bdf8]" />
                      ) : msg.status === 'delivered' ? (
                        <CheckCheck size={14} className={isDarkMode ? 'text-[#b89f8f]' : 'text-[#8c6f5d]'} />
                      ) : (
                        <Check size={14} className={isDarkMode ? 'text-[#b89f8f]' : 'text-[#8c6f5d]'} />
                      )}
                    </span>
                  )}
                </div>
              </div>

              {/* Reaction chips pill below message bubble */}
              {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                <div className={`flex items-center gap-1 mt-0.5 ${isMe ? 'self-end' : 'self-start'} select-none z-10`}>
                  <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full shadow-sm border text-xs ${
                    isDarkMode 
                      ? 'bg-[#33251e] border-[#443026] text-white' 
                      : 'bg-white border-[#ebdcd0] text-[#3d2314]'
                  }`}>
                    {Object.entries(msg.reactions).map(([emoji, phones]) => {
                      if (!phones || phones.length === 0) return null;
                      const myClean = user?.phone ? normalizePhone(user.phone) : '';
                      const userReacted = myClean && phones.some((p) => normalizePhone(p) === myClean);
                      return (
                        <button
                          key={emoji}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onReactMessage?.({
                              chatId: chat.id || chat.chatId,
                              messageId: msg.id,
                              emoji
                            });
                          }}
                          className={`flex items-center gap-0.5 px-1 py-0.5 rounded-full transition-all active:scale-95 ${
                            userReacted 
                              ? 'bg-[#c27847]/20 ring-1 ring-[#c27847]' 
                              : 'hover:bg-black/5 dark:hover:bg-white/5'
                          }`}
                          title={`${phones.length} تفاعل`}
                        >
                          <span>{emoji}</span>
                          {phones.length > 1 && (
                            <span className="text-[10px] font-bold text-[#c27847]">
                              {phones.length}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Live Typing bubble */}
        {typingContact?.isTyping && (
          typingContact?.chatId === chat.id ||
          typingContact?.chatId === chat.chatId ||
          (typingContact?.senderPhone && chat.phone && typingContact.senderPhone.replace(/\D/g, '') === chat.phone.replace(/\D/g, ''))
        ) && (
          <div className={`self-start px-4 py-2.5 rounded-2xl rounded-bl-xs shadow-sm flex items-center gap-1.5 animate-pulse ${
            isDarkMode ? 'bg-[#2c201a] text-gray-300' : 'bg-white text-gray-700'
          }`}>
            <span className="w-2 h-2 rounded-full bg-[#c27847] animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full bg-[#c27847] animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full bg-[#c27847] animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Selected Media Preview (Image or Video) before sending */}
      {selectedMedia && (
        <div className={`p-2 border-t flex items-center justify-between ${
          isDarkMode ? 'bg-[#2c201a] border-[#443026]' : 'bg-[#f4ebe1] border-[#ecd9c7]'
        }`}>
          <div className="flex items-center gap-3">
            {selectedMedia.type === 'video' ? (
              <video src={selectedMedia.url} className="w-14 h-14 rounded-xl object-cover bg-black" />
            ) : (
              <img src={selectedMedia.url} alt="معاينة" className="w-14 h-14 rounded-xl object-cover" />
            )}
            <div className="text-right">
              <span className="text-xs font-bold text-[#c27847]">
                {selectedMedia.type === 'video' ? 'فيديو جاهز للإرسال' : 'صورة جاهزة للإرسال'}
              </span>
              <p className="text-[11px] text-[#b89f8f]">يمكنك كتابة تعليق مع الوسائط أدناه</p>
            </div>
          </div>
          <button
            onClick={() => setSelectedMedia(null)}
            className="p-1.5 rounded-full text-red-500 hover:bg-black/10"
            title="إلغاء المرفق"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Attachment Menu Popup */}
      {showAttachMenu && (
        <div className={`absolute bottom-16 right-4 p-3 rounded-2xl shadow-2xl z-30 flex flex-col gap-2 border animate-fadeIn ${
          isDarkMode ? 'bg-[#33251e] border-[#443026] text-[#f7ece1]' : 'bg-white border-[#ebdcd0] text-[#3d2314]'
        }`}>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right"
          >
            <span className="w-9 h-9 rounded-full bg-[#a56a4c] text-white flex items-center justify-center">
              <ImageIcon size={18} />
            </span>
            <span className="text-xs font-semibold">صور وفيديوهات المعرض</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right"
          >
            <span className="w-9 h-9 rounded-full bg-amber-700 text-white flex items-center justify-center">
              <Camera size={18} />
            </span>
            <span className="text-xs font-semibold">الكاميرا</span>
          </button>
          <button
            onClick={() => alert('تم اختيار مشاركة مستند')}
            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-right"
          >
            <span className="w-9 h-9 rounded-full bg-amber-900 text-white flex items-center justify-center">
              <FileText size={18} />
            </span>
            <span className="text-xs font-semibold">مستند أو ملف</span>
          </button>
        </div>
      )}

      {/* Quick Emoji Drawer */}
      {showEmojiPicker && (
        <div className={`p-2.5 border-t flex flex-wrap gap-2 justify-center z-20 select-none ${
          isDarkMode ? 'bg-[#2c201a] border-[#443026]' : 'bg-[#f4ebe1] border-[#ecd9c7]'
        }`}>
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => setInputText((prev) => prev + emoji)}
              className="text-xl hover:scale-125 active:scale-95 transition-transform p-1 rounded-lg"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Quote / Reply Preview Banner above input */}
      {replyingTo && (
        <div className={`px-3 py-2 flex items-center justify-between border-t border-b animate-fadeIn z-20 ${
          isDarkMode ? 'bg-[#33251e] border-[#443026]' : 'bg-[#f4ebe1] border-[#ecd9c7]'
        }`}>
          <div className="flex items-center gap-2 border-r-4 border-[#c27847] pr-2.5 flex-1 min-w-0">
            <Reply size={16} className="text-[#c27847] flex-shrink-0" />
            <div className="flex-1 min-w-0 text-right">
              <span className="text-xs font-bold text-[#c27847] block truncate">
                الرد على {replyingTo.senderName}
              </span>
              <span className="text-xs text-[#b89f8f] block truncate">
                {replyingTo.text}
              </span>
            </div>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 rounded-full hover:bg-black/10 text-gray-400 hover:text-red-500 transition-colors"
            title="إلغاء الرد"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Chat Bottom Input Bar */}
      <div className={`p-2 flex items-center gap-2 z-20 select-none transition-colors ${
        isDarkMode ? 'bg-[#2c201a]' : 'bg-[#f4ebe1]'
      }`}>
        {isRecording ? (
          /* Live Voice Recording Bar */
          <div className={`flex-1 flex items-center justify-between px-4 py-2.5 rounded-full shadow-sm animate-pulse ${
            isDarkMode ? 'bg-[#1f1612] text-white' : 'bg-white text-[#3d2314]'
          }`}>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-record-pulse" />
              <span className="text-xs font-bold text-red-500 font-mono">
                0:{recordingSeconds < 10 ? '0' : ''}{recordingSeconds}
              </span>
              <span className="text-xs opacity-80">جاري تسجيل صوتك الآن...</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={cancelRecording}
                className="text-xs font-semibold text-red-400 hover:text-red-500 flex items-center gap-1"
                title="إلغاء التسجيل"
              >
                <Trash2 size={16} />
                <span>إلغاء</span>
              </button>
              <button
                onClick={stopAndSendRecording}
                className="w-8 h-8 rounded-full bg-[#a56a4c] text-white flex items-center justify-center hover:bg-[#915738]"
                title="إرسال الفويس نوت"
              >
                <Send size={15} className="rotate-180" />
              </button>
            </div>
          </div>
        ) : (
          /* Standard Input Bar */
          <>
            <div className={`flex-1 flex items-center gap-2 px-3 py-1.5 rounded-full shadow-sm ${
              isDarkMode ? 'bg-[#382a22] text-white' : 'bg-white text-[#3d2314]'
            }`}>
              {/* Emoji button */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="text-[#b89f8f] hover:text-[#c27847] transition-colors p-1"
                title="رموز تعبيرية"
              >
                <Smile size={21} />
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSend();
                }}
                placeholder="اكتب رسالة..."
                className="flex-1 bg-transparent border-none outline-none text-sm leading-normal text-right placeholder-[#b89f8f]"
              />

              {/* Attach Clip */}
              <button
                type="button"
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                className="text-[#b89f8f] hover:text-[#c27847] transition-colors p-1"
                title="إرفاق صورة أو فيديو"
              >
                <Paperclip size={20} className="-rotate-45" />
              </button>

              {/* Camera icon */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[#b89f8f] hover:text-[#c27847] transition-colors p-1"
                title="التقاط أو اختيار وسائط"
              >
                <Camera size={20} />
              </button>
            </div>

            {/* Mic button OR Send button */}
            {inputText.trim() || selectedMedia ? (
              <button
                onClick={handleSend}
                className="w-11 h-11 rounded-full bg-[#a56a4c] hover:bg-[#915738] active:scale-95 text-white flex items-center justify-center shadow-md transition-all flex-shrink-0"
                title="إرسال"
              >
                <Send size={18} className="rotate-180 translate-x-0.5" />
              </button>
            ) : (
              <button
                onClick={startRecording}
                className="w-11 h-11 rounded-full bg-[#a56a4c] hover:bg-[#915738] active:scale-95 text-white flex items-center justify-center shadow-md transition-all flex-shrink-0"
                title="تسجيل رسالة صوتية (اضغط للتسجيل)"
              >
                <Mic size={20} />
              </button>
            )}
          </>
        )}
      </div>

      {/* Fullscreen Media Viewer Modal */}
      {viewingMedia && (
        <MediaViewerModal
          media={viewingMedia}
          onClose={() => setViewingMedia(null)}
        />
      )}

      {/* Contact Info Modal (Shows name, phone, status, call actions) */}
      {showContactInfo && (
        <ContactInfoModal
          chat={chat}
          onClose={() => setShowContactInfo(false)}
          onStartCall={onStartCall}
          onClearChat={onClearChat}
          onDeleteChat={onDeleteChat}
          onUpdateContact={onUpdateContact}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
}
