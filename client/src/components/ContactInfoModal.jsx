import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Phone,
  Video,
  Copy,
  Check,
  ShieldCheck,
  Trash2,
  Image as ImageIcon,
  MessageSquare,
  Clock,
  UserCheck
} from 'lucide-react';

const API_SERVER = 'http://localhost:4000';

export default function ContactInfoModal({
  chat,
  onClose,
  onStartCall,
  onClearChat,
  onDeleteChat,
  onUpdateContact,
  isDarkMode
}) {
  const [copied, setCopied] = useState(false);
  const [liveInfo, setLiveInfo] = useState(null);

  // Fetch latest info from server if available and sync with chat
  useEffect(() => {
    if (chat?.phone) {
      fetch(`${API_SERVER}/api/users/lookup?phone=${encodeURIComponent(chat.phone)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.exists && data.user) {
            setLiveInfo(data.user);
            if (typeof onUpdateContact === 'function') {
              onUpdateContact(data.user);
            }
          }
        })
        .catch(() => {});
    }
  }, [chat?.phone]);

  const displayName = liveInfo?.name || chat.name || 'مستخدم Pro Chats';
  const displayPhone = liveInfo?.phone || chat.phone || chat.cleanPhone || 'غير متوفر';
  const displayAvatar = liveInfo?.avatar || chat.avatar;
  const displayAbout = liveInfo?.about || chat.about || 'متاح في Pro Chats ☕️';
  const isOnline = liveInfo?.isOnline ?? chat.isOnline;
  const lastSeen = liveInfo?.lastSeen || chat.lastSeen || (isOnline ? 'متصل الآن' : 'غير متصل');

  // Count media files in messages
  const mediaCount = (chat.messages || []).filter(
    (m) => m.type === 'image' || m.type === 'video'
  ).length;

  const handleCopyPhone = () => {
    if (displayPhone) {
      navigator.clipboard?.writeText(displayPhone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={`absolute inset-0 z-50 flex flex-col overflow-y-auto select-none transition-colors animate-fadeIn ${
        isDarkMode ? 'bg-[#1f1612] text-[#f7ece1]' : 'bg-[#faf4ed] text-[#3d2314]'
      }`}
      dir="rtl"
    >
      {/* Header */}
      <header
        className={`px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm transition-colors ${
          isDarkMode ? 'bg-[#2c201a] text-white' : 'bg-[#784e38] text-white'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/10 active:scale-95 transition-transform"
            title="رجوع"
          >
            <ArrowRight size={22} className="rotate-180" />
          </button>
          <h2 className="text-lg font-bold">معلومات جهة الاتصال</h2>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex flex-col items-center p-5 gap-5">
        {/* Large Avatar */}
        <div className="relative mt-2">
          <img
            src={displayAvatar}
            alt={displayName}
            className="w-32 h-32 rounded-full object-cover ring-4 ring-[#a56a4c] shadow-xl"
          />
          {isOnline && (
            <span
              className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-[#c27847] border-3 border-white dark:border-[#1f1612] shadow-sm"
              title="متصل الآن"
            />
          )}
        </div>

        {/* Name and Online Status */}
        <div className="text-center">
          <h1 className="text-xl font-bold tracking-tight mb-1">{displayName}</h1>
          <p className="text-xs text-[#b89f8f] font-medium flex items-center justify-center gap-1.5">
            {isOnline ? (
              <span className="text-[#c27847] font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#c27847] animate-ping" />
                متصل الآن
              </span>
            ) : (
              <span>{lastSeen}</span>
            )}
          </p>
        </div>

        {/* Action Buttons Row (Voice Call, Video Call, Message) */}
        <div className="flex items-center justify-center gap-4 w-full max-w-xs">
          {onStartCall && (
            <button
              onClick={() => {
                onClose();
                onStartCall(chat, 'audio');
              }}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 px-3 rounded-2xl border transition-all active:scale-95 shadow-sm ${
                isDarkMode
                  ? 'bg-[#2c201a] border-[#443026] hover:bg-[#382a22] text-[#e29968]'
                  : 'bg-white border-[#ebdcd0] hover:bg-[#fbf7f2] text-[#a56a4c]'
              }`}
            >
              <Phone size={20} className="mb-1 text-[#c27847]" />
              <span className="text-[11px] font-semibold">صوت</span>
            </button>
          )}

          {onStartCall && (
            <button
              onClick={() => {
                onClose();
                onStartCall(chat, 'video');
              }}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 px-3 rounded-2xl border transition-all active:scale-95 shadow-sm ${
                isDarkMode
                  ? 'bg-[#2c201a] border-[#443026] hover:bg-[#382a22] text-[#e29968]'
                  : 'bg-white border-[#ebdcd0] hover:bg-[#fbf7f2] text-[#a56a4c]'
              }`}
            >
              <Video size={20} className="mb-1 text-[#c27847]" />
              <span className="text-[11px] font-semibold">فيديو</span>
            </button>
          )}

          <button
            onClick={onClose}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 px-3 rounded-2xl border transition-all active:scale-95 shadow-sm ${
              isDarkMode
                ? 'bg-[#2c201a] border-[#443026] hover:bg-[#382a22] text-[#e29968]'
                : 'bg-white border-[#ebdcd0] hover:bg-[#fbf7f2] text-[#a56a4c]'
            }`}
          >
            <MessageSquare size={20} className="mb-1 text-[#c27847]" />
            <span className="text-[11px] font-semibold">مراسلة</span>
          </button>
        </div>

        {/* Account Details Card */}
        <div
          className={`w-full rounded-2xl p-4 shadow-sm flex flex-col gap-4 border ${
            isDarkMode ? 'bg-[#2c201a] border-[#443026]' : 'bg-white border-[#ebdcd0]'
          }`}
        >
          {/* Phone Number Item */}
          <div className="flex items-center justify-between">
            <div className="text-right">
              <span className="text-xs text-[#c27847] font-bold block mb-0.5">
                رقم الهاتف
              </span>
              <span className="text-base font-mono font-semibold tracking-wider dir-ltr inline-block">
                {displayPhone}
              </span>
            </div>
            <button
              onClick={handleCopyPhone}
              className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-all active:scale-95 ${
                copied
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : isDarkMode
                  ? 'border-[#443026] text-[#b89f8f] hover:text-[#e29968]'
                  : 'border-[#ebdcd0] text-[#784e38] hover:bg-[#faf4ed]'
              }`}
              title="نسخ رقم الهاتف"
            >
              {copied ? (
                <>
                  <Check size={14} />
                  <span>تم النسخ</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>نسخ</span>
                </>
              )}
            </button>
          </div>

          <hr className="border-gray-100 dark:border-[#443026]" />

          {/* About / Status Item */}
          <div className="text-right">
            <span className="text-xs text-[#c27847] font-bold block mb-0.5">
              الحالة والأخبار (About)
            </span>
            <p className="text-sm font-medium leading-relaxed">
              {displayAbout}
            </p>
          </div>

          <hr className="border-gray-100 dark:border-[#443026]" />

          {/* Media & Docs Summary */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon size={18} className="text-[#c27847]" />
              <span className="text-xs font-semibold">الوسائط والمستندات المشتركة</span>
            </div>
            <span className="text-xs text-[#b89f8f] font-bold">
              {mediaCount} ملف
            </span>
          </div>
        </div>

        {/* Security / Encryption Badge */}
        <div
          className={`w-full rounded-2xl p-3.5 flex items-center gap-3 border ${
            isDarkMode ? 'bg-[#2c201a]/70 border-[#443026]' : 'bg-[#fbf7f2] border-[#ebdcd0]'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-[#a56a4c]/15 flex items-center justify-center flex-shrink-0 text-[#c27847]">
            <ShieldCheck size={20} />
          </div>
          <div className="text-right flex-1">
            <h4 className="text-xs font-bold text-[#a56a4c] dark:text-[#e29968]">
              تشفير تام من طرف إلى طرف
            </h4>
            <p className="text-[11px] text-[#b89f8f] leading-tight mt-0.5">
              الرسائل والمكالمات مشفرة ولا يمكن لأحد خارج هذه المحادثة قراءتها.
            </p>
          </div>
        </div>

        {/* Danger Zone: Clear and Delete Actions */}
        <div
          className={`w-full rounded-2xl p-2 flex flex-col gap-1 border ${
            isDarkMode ? 'bg-[#2c201a] border-[#443026]' : 'bg-white border-[#ebdcd0]'
          }`}
        >
          {onClearChat && (
            <button
              onClick={() => {
                if (window.confirm('هل تريد مسح كافة الرسائل من هذه المحادثة؟')) {
                  onClearChat(chat.id || chat.chatId);
                  onClose();
                }
              }}
              className="w-full px-4 py-2.5 text-right flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors text-xs font-semibold"
            >
              <span>مسح كافة الرسائل</span>
              <Trash2 size={16} className="text-[#b89f8f]" />
            </button>
          )}

          {onDeleteChat && (
            <button
              onClick={() => {
                if (
                  window.confirm(
                    `هل أنت متأكد من حذف محادثة "${displayName}" بالكامل من حسابك؟`
                  )
                ) {
                  onDeleteChat(chat.id || chat.chatId);
                  onClose();
                }
              }}
              className="w-full px-4 py-2.5 text-right flex items-center justify-between hover:bg-red-500/10 rounded-xl transition-colors text-xs font-bold text-red-500"
            >
              <span>حذف جهة الاتصال والمحادثة</span>
              <Trash2 size={16} className="text-red-500" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
