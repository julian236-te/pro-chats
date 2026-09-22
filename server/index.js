const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Support base64 image/video/audio payloads

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 5e7 // 50MB buffer for media attachments
});

// Database file path
const DB_FILE = path.join(__dirname, 'database.json');

// Initialize database
let db = {
  users: {},         // { [normalizedPhone]: { phone, name, avatar, about, isOnline, lastSeen } }
  conversations: {}  // { [chatId]: { id, participants: [phone1, phone2], messages: [] } }
};

function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(content);
      console.log(`Database loaded: ${Object.keys(db.users).length} users, ${Object.keys(db.conversations).length} conversations.`);
    }
  } catch (err) {
    console.error('Error loading database:', err);
  }
}

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database:', err);
  }
}

loadDatabase();

// Normalize phone numbers to digits only with robust regional handling
function normalizePhone(p) {
  if (!p) return '';
  let digits = String(p).replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  
  // Remove redundant zero after country code 20 for Egypt (e.g. 20011... -> 2011...)
  if (digits.startsWith('2001') && digits.length === 13) {
    digits = '20' + digits.slice(3);
  }
  // If starts with 01 and length 11 (e.g. 01116195859) -> 201116195859
  if (digits.startsWith('01') && digits.length === 11) {
    digits = '20' + digits.slice(1);
  }
  // If starts with 1 and length 10 (e.g. 1116195859) -> 201116195859
  if (digits.startsWith('1') && digits.length === 10) {
    digits = '20' + digits;
  }
  // Saudi numbers: e.g. 96605... -> 9665..., or 05... -> 9665...
  if (digits.startsWith('96605') && digits.length === 13) {
    digits = '966' + digits.slice(4);
  }
  if (digits.startsWith('05') && digits.length === 10) {
    digits = '966' + digits.slice(1);
  }
  return digits;
}

// Generate unified deterministic chat ID between two phone numbers
function getChatId(phoneA, phoneB) {
  const p1 = normalizePhone(phoneA);
  const p2 = normalizePhone(phoneB);
  return [p1, p2].sort().join('__');
}

// REST APIs
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    registeredUsersCount: Object.keys(db.users).length,
    conversationsCount: Object.keys(db.conversations).length,
    time: new Date().toISOString()
  });
});

// Register or update user profile
app.post('/api/users/register', (req, res) => {
  const { phone, name, avatar, about } = req.body;
  if (!phone || !name) {
    return res.status(400).json({ error: 'Phone and Name are required' });
  }

  const norm = normalizePhone(phone);
  const existing = db.users[norm] || {};

  const user = {
    ...existing,
    phone,
    cleanPhone: norm,
    name: name.trim(),
    avatar: avatar || existing.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    about: about || existing.about || 'متاح في Pro Chats ☕️',
    isOnline: true,
    lastSeen: 'متصل الآن',
    updatedAt: new Date().toISOString()
  };

  db.users[norm] = user;
  saveDatabase();

  console.log(`User registered: ${user.name} (${user.cleanPhone})`);

  // Broadcast real-time profile update to all connected clients immediately
  io.emit('user_profile_updated', user);

  res.json({ success: true, user });
});

// Lookup user by phone number
app.get('/api/users/lookup', (req, res) => {
  const phone = req.query.phone;
  if (!phone) return res.status(400).json({ error: 'Phone query required' });

  const norm = normalizePhone(phone);
  const user = db.users[norm];

  if (user) {
    res.json({ exists: true, user });
  } else {
    res.json({ exists: false, message: 'User not registered yet' });
  }
});

// Get all chats for a specific user phone
app.get('/api/chats', (req, res) => {
  const phone = req.query.phone;
  if (!phone) return res.status(400).json({ error: 'Phone query required' });

  const norm = normalizePhone(phone);
  const userChats = [];

  for (const [chatId, conv] of Object.entries(db.conversations)) {
    if (conv.participants && conv.participants.includes(norm)) {
      const otherPhone = conv.participants.find((p) => p !== norm);
      const otherUser = db.users[otherPhone] || {
        phone: otherPhone,
        cleanPhone: otherPhone,
        name: 'مستخدم ' + otherPhone,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        about: 'متاح في Pro Chats ☕️',
        isOnline: false,
        lastSeen: 'غير متصل'
      };

      userChats.push({
        id: chatId,
        chatId: chatId,
        phone: otherUser.phone,
        cleanPhone: otherUser.cleanPhone,
        name: otherUser.name,
        avatar: otherUser.avatar,
        about: otherUser.about,
        isOnline: otherUser.isOnline,
        lastSeen: otherUser.lastSeen,
        unreadCount: 0,
        messages: conv.messages || []
      });
    }
  }

  res.json({ chats: userChats });
});

// Delete conversation completely from database
app.post('/api/chats/delete', (req, res) => {
  const { chatId } = req.body;
  if (!chatId) return res.status(400).json({ error: 'chatId required' });

  if (db.conversations[chatId]) {
    delete db.conversations[chatId];
    saveDatabase();
    console.log(`Conversation deleted: ${chatId}`);
  }

  res.json({ success: true, message: 'Chat deleted successfully' });
});

// Clear messages in conversation
app.post('/api/chats/clear', (req, res) => {
  const { chatId } = req.body;
  if (!chatId) return res.status(400).json({ error: 'chatId required' });

  if (db.conversations[chatId]) {
    db.conversations[chatId].messages = [];
    saveDatabase();
    console.log(`Messages cleared for: ${chatId}`);
  }

  res.json({ success: true, message: 'Messages cleared' });
});

// WebSocket Real-time connections
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // User registers their active presence with their phone number
  socket.on('user_connected', (userData) => {
    if (!userData || !userData.phone) return;

    const norm = normalizePhone(userData.phone);
    const rawDigits = String(userData.phone).replace(/\D/g, '');
    
    socket.userPhone = norm;
    socket.join('user_' + norm);
    if (rawDigits && rawDigits !== norm) {
      socket.join('user_' + rawDigits);
    }

    if (db.users[norm]) {
      db.users[norm].isOnline = true;
      db.users[norm].lastSeen = 'متصل الآن';
      saveDatabase();
    }

    console.log(`User online: ${userData.name || norm} joined room user_${norm} & user_${rawDigits}`);
    io.emit('user_presence', { cleanPhone: norm, isOnline: true });
  });

  // Client requests immediate profile sync
  socket.on('update_profile', (userData) => {
    if (!userData || !userData.phone) return;
    const norm = normalizePhone(userData.phone);
    if (db.users[norm]) {
      if (userData.avatar) db.users[norm].avatar = userData.avatar;
      if (userData.name) db.users[norm].name = userData.name;
      if (userData.about) db.users[norm].about = userData.about;
      db.users[norm].updatedAt = new Date().toISOString();
      saveDatabase();
      io.emit('user_profile_updated', db.users[norm]);
    }
  });

  // Client joins a specific conversation room
  socket.on('join_chat', (chatId) => {
    if (chatId) {
      socket.join(chatId);
    }
  });

  // Handle sending a message to another phone number
  socket.on('send_message', (data) => {
    console.log('Sending message event:', {
      from: data.senderPhone,
      to: data.recipientPhone,
      type: data.type
    });

    const senderNorm = normalizePhone(data.senderPhone);
    const recipientNorm = normalizePhone(data.recipientPhone);
    const rawRecipient = String(data.recipientPhone || '').replace(/\D/g, '');

    if (!senderNorm || !recipientNorm) {
      console.warn('Missing sender or recipient phone');
      return;
    }

    const chatId = getChatId(senderNorm, recipientNorm);

    // Ensure conversation exists in DB
    if (!db.conversations[chatId]) {
      db.conversations[chatId] = {
        id: chatId,
        participants: [senderNorm, recipientNorm],
        messages: []
      };
    }

    const message = {
      id: data.id || 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      chatId: chatId,
      senderPhone: data.senderPhone,
      senderCleanPhone: senderNorm,
      senderName: data.senderName,
      senderAvatar: data.senderAvatar,
      recipientPhone: data.recipientPhone,
      recipientCleanPhone: recipientNorm,
      type: data.type || 'text',
      text: data.text || '',
      mediaUrl: data.mediaUrl || null,
      audioDuration: data.audioDuration || null,
      replyTo: data.replyTo || null,
      reactions: data.reactions || {},
      timestamp: data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'delivered'
    };

    // Store message in database
    db.conversations[chatId].messages.push(message);
    saveDatabase();

    // 1. Deliver to recipient in real-time across all possible rooms
    io.to('user_' + recipientNorm).emit('receive_message', message);
    if (rawRecipient && rawRecipient !== recipientNorm) {
      io.to('user_' + rawRecipient).emit('receive_message', message);
    }
    io.to(chatId).emit('receive_message', message);

    // 2. Acknowledge to sender and sync other sender tabs
    socket.emit('message_delivered', { messageId: message.id, chatId });
    io.to('user_' + senderNorm).emit('message_sent_sync', message);
  });

  // Handle Read Receipts (marking messages as read by reader)
  socket.on('mark_messages_read', (data) => {
    if (!data || !data.chatId || !data.readerPhone) return;
    const { chatId, readerPhone } = data;
    const readerNorm = normalizePhone(readerPhone);

    if (db.conversations[chatId] && db.conversations[chatId].messages) {
      let updatedCount = 0;
      db.conversations[chatId].messages.forEach((m) => {
        const recipNorm = m.recipientCleanPhone || normalizePhone(m.recipientPhone);
        if (recipNorm === readerNorm && m.status !== 'read') {
          m.status = 'read';
          updatedCount++;
        }
      });

      if (updatedCount > 0) {
        saveDatabase();
        io.to(chatId).emit('messages_marked_read', { chatId, readerPhone });
        const otherParticipant = db.conversations[chatId].participants?.find((p) => p !== readerNorm);
        if (otherParticipant) {
          io.to('user_' + otherParticipant).emit('messages_marked_read', { chatId, readerPhone });
        }
      }
    }
  });

  // Handle message reaction toggle
  socket.on('react_message', (data) => {
    if (!data || !data.chatId || !data.messageId || !data.userPhone) return;
    const { chatId, messageId, userPhone, emoji } = data;
    const userNorm = normalizePhone(userPhone);

    if (db.conversations[chatId] && db.conversations[chatId].messages) {
      const msg = db.conversations[chatId].messages.find((m) => m.id === messageId);
      if (msg) {
        msg.reactions = msg.reactions || {};
        if (msg.reactions[userNorm] === emoji) {
          delete msg.reactions[userNorm]; // Toggle off if clicked again
        } else {
          msg.reactions[userNorm] = emoji;
        }
        saveDatabase();

        const reactionPayload = {
          chatId,
          messageId,
          reactions: msg.reactions
        };

        io.to(chatId).emit('message_reaction_updated', reactionPayload);
        db.conversations[chatId].participants?.forEach((p) => {
          io.to('user_' + p).emit('message_reaction_updated', reactionPayload);
        });
      }
    }
  });

  // Typing indicator
  socket.on('typing', (data) => {
    const recipientNorm = normalizePhone(data.recipientPhone);
    const senderNorm = normalizePhone(data.senderPhone);
    const rawRecipient = String(data.recipientPhone || '').replace(/\D/g, '');
    if (!recipientNorm) return;

    const payload = {
      chatId: getChatId(senderNorm, recipientNorm),
      senderPhone: data.senderPhone,
      senderCleanPhone: senderNorm,
      senderName: data.senderName,
      isTyping: Boolean(data.isTyping)
    };

    io.to('user_' + recipientNorm).emit('typing_status', payload);
    if (rawRecipient && rawRecipient !== recipientNorm) {
      io.to('user_' + rawRecipient).emit('typing_status', payload);
    }
    io.to(payload.chatId).emit('typing_status', payload);
  });

  // Real-time Audio/Video calling between phone numbers
  socket.on('start_call', (data) => {
    const recipientNorm = normalizePhone(data.recipientPhone);
    if (!recipientNorm) return;

    socket.to('user_' + recipientNorm).emit('incoming_call', {
      caller: {
        phone: data.senderPhone,
        cleanPhone: normalizePhone(data.senderPhone),
        name: data.senderName,
        avatar: data.senderAvatar
      },
      type: data.type || 'audio',
      chatId: getChatId(data.senderPhone, data.recipientPhone)
    });
  });

  // User disconnects
  socket.on('disconnect', () => {
    if (socket.userPhone) {
      const norm = socket.userPhone;
      if (db.users[norm]) {
        db.users[norm].isOnline = false;
        db.users[norm].lastSeen = 'آخر ظهور ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        saveDatabase();
        io.emit('user_presence', { cleanPhone: norm, isOnline: false, lastSeen: db.users[norm].lastSeen });
      }
      console.log(`User disconnected: ${norm}`);
    }
  });
});

// Health check endpoint for cloud platforms
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date() });
});

// Serve static frontend in production or when client/dist exists
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && req.path !== '/health') {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    }
  });
}

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Pro Chats Real-time Server running on http://localhost:${PORT}`);
});
