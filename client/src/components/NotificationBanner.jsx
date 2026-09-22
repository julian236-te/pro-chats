import React, { useEffect } from 'react';
import { MessageSquare, X, Image as ImageIcon, Video, Mic } from 'lucide-react';

export default function NotificationBanner({
  notification,
  onOpenChat,
  onClose,
  isDarkMode
}) {
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [notification, onClose]);

  if (!notification) return null;

  const getMessageSnippet = () => {
    if (notification.type === 'image') {
      return (
        <span className="flex items-center gap-1">
          <ImageIcon size={13} className="text-[#c27847]" />
          <span>صورة جديدة</span>
        </span>
      );
    }
    if (notification.type === 'video') {
      return (
        <span className="flex items-center gap-1">
          <Video size={13} className="text-[#c27847]" />
          <span>مقطع فيديو جديد</span>
        </span>
      );
    }
    if (notification.type === 'voice') {
      return (
        <span className="flex items-center gap-1">
          <Mic size={13} className="text-[#c27847]" />
          <span>رسالة صوتية ({notification.audioDuration || '0:06'})</span>
        </span>
      );
    }
    return notification.text || 'رسالة جديدة';
  };

  return (
    <div
      onClick={() => {
        onOpenChat(notification);
        onClose();
      }}
      className={`absolute top-3 left-3 right-3 z-50 p-3 rounded-2xl shadow-2xl border backdrop-blur-md cursor-pointer transition-all animate-banner-in select-none ${
        isDarkMode
          ? 'bg-[#2c201a]/95 border-[#443026] text-[#f7ece1]'
          : 'bg-white/95 border-[#ebdcd0] text-[#3d2314]'
      }`}
      dir="rtl"
    >
      <div className="flex items-center justify-between mb-1 opacity-80">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#c27847]">
          <MessageSquare size={13} />
          <span>Pro Chats</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#b89f8f]">الآن</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
            title="إغلاق"
          >
            <X size={13} className="text-[#b89f8f]" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <img
          src={
            notification.senderAvatar ||
            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
          }
          alt={notification.senderName || ''}
          className="w-10 h-10 rounded-full object-cover ring-2 ring-[#c27847]/40 flex-shrink-0"
        />
        <div className="flex-1 min-w-0 text-right">
          <h4 className="text-xs font-bold truncate leading-tight mb-0.5">
            {notification.senderName || 'مستخدم Pro Chats'}
          </h4>
          <div className="text-xs text-[#b89f8f] truncate leading-tight">
            {getMessageSnippet()}
          </div>
        </div>
      </div>
    </div>
  );
}
