import React from 'react';
import { Check, CheckCheck, Mic, Image, MessageSquarePlus, Pin, Trash2 } from 'lucide-react';

export default function ChatList({
  chats,
  onSelectChat,
  searchQuery,
  onOpenNewChat,
  onDeleteChat,
  onTogglePinChat,
  typingContact,
  isDarkMode
}) {
  // Sort pinned chats to top
  const sortedChats = [...chats].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  const filteredChats = sortedChats.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.messages.length > 0 && c.messages[c.messages.length - 1].text?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusIcon = (status) => {
    if (status === 'read') {
      return <CheckCheck size={16} className="text-[#38bdf8]" />;
    }
    if (status === 'delivered') {
      return <CheckCheck size={16} className="text-[#b89f8f]" />;
    }
    return <Check size={16} className="text-[#b89f8f]" />;
  };

  return (
    <div className="relative flex-1 flex flex-col overflow-y-auto w-full">
      {/* List of chats */}
      {filteredChats.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none animate-fadeIn">
          <div className="w-20 h-20 rounded-full bg-[#a56a4c]/10 dark:bg-[#a56a4c]/20 flex items-center justify-center text-[#a56a4c] dark:text-[#e29968] mb-4 shadow-inner">
            <MessageSquarePlus size={36} />
          </div>
          <h3 className={`text-base font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-[#3d2314]'}`}>
            {searchQuery ? 'لا توجد نتائج مطابقة' : 'لا توجد محادثات بعد'}
          </h3>
          <p className="text-xs text-[#b89f8f] max-w-xs mb-5 leading-relaxed">
            {searchQuery
              ? 'تأكد من كتابة الاسم أو رقم الهاتف بشكل صحيح'
              : 'ابدأ بمراسلة جهات اتصالك الآن عن طريق النقر على الزر أدناه.'}
          </p>
          <button
            onClick={onOpenNewChat}
            className="px-5 py-2.5 rounded-full bg-[#a56a4c] hover:bg-[#915738] active:scale-95 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2"
          >
            <MessageSquarePlus size={16} />
            <span>بدء محادثة جديدة</span>
          </button>
        </div>
      ) : (
        <div className="divide-y divide-[#ebdcd0] dark:divide-[#2c201a]">
          {filteredChats.map((chat) => {
            const lastMsg = chat.messages[chat.messages.length - 1];
            const isMe = lastMsg?.senderId === 'me';
            const isTypingNow = typingContact?.isTyping && (
              typingContact?.chatId === chat.id ||
              typingContact?.chatId === chat.chatId ||
              (typingContact?.senderPhone && chat.phone && typingContact.senderPhone.replace(/\D/g, '') === chat.phone.replace(/\D/g, ''))
            );

            return (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat)}
                className={`group flex items-center gap-3 px-4 py-3 cursor-pointer select-none transition-colors ${
                  chat.isPinned
                    ? isDarkMode ? 'bg-[#291e17]/60' : 'bg-[#faf3ec]/80'
                    : ''
                } ${
                  isDarkMode 
                    ? 'hover:bg-[#2c201a] active:bg-[#2c201a]' 
                    : 'hover:bg-[#fbf7f2] active:bg-[#f3eae0]'
                }`}
              >
                {/* Avatar with online dot */}
                <div className="relative flex-shrink-0">
                  <img
                    src={chat.avatar}
                    alt={chat.name}
                    className="w-12 h-12 rounded-full object-cover shadow-sm ring-1 ring-black/10"
                  />
                  {chat.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#c27847] border-2 border-white dark:border-[#1f1612]" />
                  )}
                </div>

                {/* Contact name and last message */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <h3 className={`text-base font-semibold truncate ${
                        isDarkMode ? 'text-[#fdf7f2]' : 'text-[#3d2314]'
                      }`}>
                        {chat.name}
                      </h3>
                      {chat.isPinned && (
                        <Pin size={13} className="text-[#c27847] fill-[#c27847] flex-shrink-0 rotate-45" title="محادثة مثبتة" />
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <span className={`text-xs ${
                        chat.unreadCount > 0 
                          ? 'text-[#c27847] font-bold' 
                          : isDarkMode ? 'text-[#b89f8f]' : 'text-gray-500'
                      }`}>
                        {lastMsg?.timestamp || ''}
                      </span>

                      {/* Pin button */}
                      {onTogglePinChat && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePinChat(chat.id || chat.chatId);
                          }}
                          className={`p-1 rounded transition-all ${
                            chat.isPinned
                              ? 'text-[#c27847] opacity-100 hover:opacity-75'
                              : 'opacity-0 group-hover:opacity-100 text-[#b89f8f] hover:text-[#c27847]'
                          }`}
                          title={chat.isPinned ? 'إلغاء تثبيت المحادثة' : 'تثبيت المحادثة في الأعلى'}
                        >
                          <Pin size={14} className={chat.isPinned ? 'fill-[#c27847]' : ''} />
                        </button>
                      )}

                      {/* Delete button */}
                      {onDeleteChat && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`هل أنت متأكد من حذف محادثة "${chat.name}"؟`)) {
                              onDeleteChat(chat.id || chat.chatId);
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-[#b89f8f] hover:text-red-500 rounded transition-all"
                          title="حذف المحادثة"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm truncate">
                      {isTypingNow ? (
                        <span className="text-xs font-bold text-[#c27847] animate-pulse">
                          يكتب الآن...
                        </span>
                      ) : (
                        <>
                          {isMe && lastMsg && getStatusIcon(lastMsg.status)}

                          {lastMsg?.type === 'voice' ? (
                            <span className="flex items-center gap-1 text-[#b89f8f]">
                              <Mic size={15} className="text-[#c27847]" />
                              <span>رسالة صوتية ({lastMsg.audioDuration || '0:10'})</span>
                            </span>
                          ) : lastMsg?.type === 'image' ? (
                            <span className="flex items-center gap-1 text-[#b89f8f]">
                              <Image size={15} className="text-[#c27847]" />
                              <span>صورة</span>
                            </span>
                          ) : (
                            <span className={`truncate ${
                              chat.unreadCount > 0 
                                ? isDarkMode ? 'text-white font-medium' : 'text-[#3d2314] font-medium' 
                                : isDarkMode ? 'text-[#b89f8f]' : 'text-gray-500'
                            }`}>
                              {lastMsg ? lastMsg.text : 'ابدأ المحادثة الآن...'}
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Unread badge */}
                    {chat.unreadCount > 0 && (
                      <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-[#c27847] text-white font-bold text-xs flex items-center justify-center shadow-sm">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Action Button (New Chat) */}
      <button
        onClick={onOpenNewChat}
        className="absolute bottom-6 left-6 w-14 h-14 rounded-2xl bg-[#a56a4c] hover:bg-[#915738] active:scale-95 text-white flex items-center justify-center shadow-xl transition-all z-10"
        title="محادثة جديدة"
      >
        <MessageSquarePlus size={24} />
      </button>
    </div>
  );
}
