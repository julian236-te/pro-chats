import React, { useState, useRef } from 'react';
import { ArrowRight, Camera, Edit2, Check, QrCode, ShieldCheck, Upload, Link as LinkIcon, Loader2 } from 'lucide-react';
import { resizeImageFile } from '../utils/image';

export default function ProfileModal({ user, onUpdateUser, onClose, isDarkMode, setIsDarkMode, onLogout }) {
  const [name, setName] = useState(user.name);
  const [about, setAbout] = useState(user.about);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleSaveName = () => {
    setIsEditingName(false);
    onUpdateUser({ ...user, name });
  };

  const handleSaveAbout = () => {
    setIsEditingAbout(false);
    onUpdateUser({ ...user, about });
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const resizedBase64 = await resizeImageFile(file, 450, 450, 0.85);
      onUpdateUser({ ...user, avatar: resizedBase64 });
    } catch (err) {
      console.error('Error reading/resizing image:', err);
      alert('تعذر تحميل الصورة، يرجى المحاولة بصورة أخرى.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUrlPrompt = () => {
    const newUrl = prompt('أدخل رابط الصورة الجديد (URL):', user.avatar);
    if (newUrl && newUrl.trim() !== '') {
      onUpdateUser({ ...user, avatar: newUrl.trim() });
    }
  };

  return (
    <div className={`absolute inset-0 z-50 flex flex-col overflow-y-auto select-none transition-colors ${
      isDarkMode ? 'bg-[#1f1612] text-[#f7ece1]' : 'bg-[#faf4ed] text-[#3d2314]'
    }`}>
      {/* Header - Lighter Brown */}
      <header className={`px-4 py-3 flex items-center gap-4 ${
        isDarkMode ? 'bg-[#2c201a] text-white' : 'bg-[#784e38] text-white'
      }`}>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-black/10">
          <ArrowRight size={22} className="rotate-180" />
        </button>
        <h2 className="text-lg font-bold">الملف الشخصي</h2>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center p-6 gap-6">
        {/* Hidden File Input for Device Media */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleImageFileChange}
        />

        {/* Avatar with Camera Overlay */}
        <div className="flex flex-col items-center gap-3 my-2">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative group cursor-pointer"
            title="انقر لتغيير الصورة من جهازك"
          >
            <img
              src={user.avatar}
              alt={user.name}
              className="w-36 h-36 rounded-full object-cover ring-4 ring-[#a56a4c] shadow-xl transition-all group-hover:brightness-90"
            />
            <div className="absolute inset-0 bg-black/45 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
              {isUploading ? (
                <Loader2 size={28} className="animate-spin text-white" />
              ) : (
                <>
                  <Camera size={28} />
                  <span className="text-[11px] font-bold mt-1">تغيير الصورة</span>
                </>
              )}
            </div>

            {/* Small camera badge */}
            <div className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-[#a56a4c] text-white flex items-center justify-center shadow-md border-2 border-white dark:border-[#1f1612]">
              <Camera size={15} />
            </div>
          </div>

          {/* Action buttons: Pick from device OR URL */}
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#a56a4c] hover:bg-[#915738] active:scale-95 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
            >
              <Upload size={14} />
              <span>{isUploading ? 'جاري التحميل...' : 'اختيار صورة من جهازك'}</span>
            </button>
            <button
              onClick={handleUrlPrompt}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                isDarkMode
                  ? 'border-[#443026] text-[#c27847] hover:bg-[#2c201a]'
                  : 'border-[#ebdcd0] text-[#a56a4c] hover:bg-white'
              }`}
              title="إدخال رابط صورة مباشرة"
            >
              <LinkIcon size={13} />
              <span>رابط</span>
            </button>
          </div>
        </div>

        {/* QR Code Button */}
        <button
          onClick={() => setShowQR(!showQR)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold transition-colors ${
            isDarkMode ? 'border-[#443026] hover:bg-[#2c201a] text-[#e29968]' : 'border-[#d6c4b2] hover:bg-white text-[#a56a4c]'
          }`}
        >
          <QrCode size={16} className="text-[#c27847]" />
          <span>{showQR ? 'إخفاء رمز QR' : 'عرض رمز QR الخاص بي'}</span>
        </button>

        {showQR && (
          <div className="p-4 bg-white rounded-2xl shadow-xl flex flex-col items-center gap-2 animate-fadeIn border border-[#ebdcd0]">
            <img
              src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=https://prochats.app/me"
              alt="Pro Chats QR Code"
              className="w-40 h-40"
            />
            <span className="text-xs font-bold text-gray-700">امسح للدردشة المباشرة في Pro Chats</span>
          </div>
        )}

        {/* Info Cards */}
        <div className={`w-full rounded-2xl p-4 shadow-sm flex flex-col gap-4 border ${
          isDarkMode ? 'bg-[#2c201a] border-[#443026]' : 'bg-white border-[#ebdcd0]'
        }`}>
          {/* Name Field */}
          <div className="text-right">
            <span className="text-xs text-[#c27847] font-semibold">الاسم</span>
            <div className="flex items-center justify-between mt-1">
              {isEditingName ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1 bg-transparent border-b border-[#a56a4c] outline-none text-base font-medium"
                    autoFocus
                  />
                  <button onClick={handleSaveName} className="text-[#a56a4c]">
                    <Check size={18} />
                  </button>
                </div>
              ) : (
                <>
                  <button onClick={() => setIsEditingName(true)} className="text-[#b89f8f] hover:text-[#a56a4c]">
                    <Edit2 size={16} />
                  </button>
                  <span className="text-base font-semibold">{user.name}</span>
                </>
              )}
            </div>
            <p className="text-[11px] text-[#b89f8f] mt-1">
              هذا الاسم سيكون ظاهراً لكافة جهات اتصالك في Pro Chats.
            </p>
          </div>

          <hr className="border-gray-100 dark:border-[#443026]" />

          {/* About / Bio Field */}
          <div className="text-right">
            <span className="text-xs text-[#c27847] font-semibold">الحالة (About)</span>
            <div className="flex items-center justify-between mt-1">
              {isEditingAbout ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    className="flex-1 bg-transparent border-b border-[#a56a4c] outline-none text-sm font-medium"
                    autoFocus
                  />
                  <button onClick={handleSaveAbout} className="text-[#a56a4c]">
                    <Check size={18} />
                  </button>
                </div>
              ) : (
                <>
                  <button onClick={() => setIsEditingAbout(true)} className="text-[#b89f8f] hover:text-[#a56a4c]">
                    <Edit2 size={16} />
                  </button>
                  <span className="text-sm">{user.about}</span>
                </>
              )}
            </div>
          </div>

          <hr className="border-gray-100 dark:border-[#443026]" />

          {/* Phone Number Field */}
          <div className="text-right">
            <span className="text-xs text-[#c27847] font-semibold">رقم الهاتف</span>
            <div className="mt-1 text-sm font-mono tracking-wider font-semibold">
              {user.phone}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        {onLogout && (
          <button
            onClick={() => {
              if (window.confirm('هل أنت متأكد من تسجيل الخروج من هذا الحساب؟')) {
                onLogout();
              }
            }}
            className="w-full py-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 active:scale-98 text-red-500 text-xs font-bold transition-all flex items-center justify-center gap-2 border border-red-500/20"
          >
            <span>تسجيل الخروج من الحساب</span>
          </button>
        )}

        {/* Security badge */}
        <div className="flex items-center gap-2 text-xs text-[#b89f8f]">
          <ShieldCheck size={16} className="text-[#c27847]" />
          <span>حسابك محمي في Pro Chats بالتشفير التام</span>
        </div>
      </div>
    </div>
  );
}
