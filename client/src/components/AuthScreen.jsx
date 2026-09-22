import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, Check, ArrowRight, Camera, ShieldCheck, RefreshCw, MessageSquare, Upload, Loader2 } from 'lucide-react';
import { resizeImageFile } from '../utils/image';

const COUNTRIES = [
  { name: 'مصر', code: '+20', flag: '🇪🇬' },
  { name: 'المملكة العربية السعودية', code: '+966', flag: '🇸🇦' },
  { name: 'الإمارات العربية المتحدة', code: '+971', flag: '🇦🇪' },
  { name: 'الكويت', code: '+965', flag: '🇰🇼' },
  { name: 'قطر', code: '+974', flag: '🇶🇦' },
  { name: 'الأردن', code: '+962', flag: '🇯🇴' },
  { name: 'المغرب', code: '+212', flag: '🇲🇦' },
  { name: 'الجزائر', code: '+213', flag: '🇩🇿' },
  { name: 'العراق', code: '+964', flag: '🇮🇶' },
  { name: 'الولايات المتحدة', code: '+1', flag: '🇺🇸' }
];

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
];

export default function AuthScreen({ onLoginSuccess, isDarkMode }) {
  // Step: 'welcome' | 'phone' | 'otp' | 'profile'
  const [step, setStep] = useState('welcome');

  // Phone input states
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // OTP states
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const otpInputsRef = useRef([]);

  // Profile setup states
  const [displayName, setDisplayName] = useState('');
  const [nameError, setNameError] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0]);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarFileInputRef = useRef(null);

  const handleDeviceAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingAvatar(true);
      const resizedBase64 = await resizeImageFile(file, 450, 450, 0.85);
      setSelectedAvatar(resizedBase64);
    } catch (err) {
      console.error('Error processing avatar:', err);
      alert('تعذر قراءة الصورة، يرجى اختيار ملف صورة صالح.');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarFileInputRef.current) avatarFileInputRef.current.value = '';
    }
  };

  // Timer for OTP resend countdown
  useEffect(() => {
    let interval = null;
    if (step === 'otp' && resendTimer > 0) {
      interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, resendTimer]);

  // Handle phone submit
  const handlePhoneSubmit = (e) => {
    e.preventDefault();
    const cleanNumber = phoneNumber.trim().replace(/\D/g, '');
    if (cleanNumber.length < 7) {
      setPhoneError('يرجى إدخال رقم هاتف صحيح');
      return;
    }
    setPhoneError('');
    setResendTimer(45);
    setStep('otp');
  };

  // Handle individual OTP digit input
  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto move to next input
    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    // Auto verify if all 6 digits entered
    if (newOtp.every((digit) => digit !== '')) {
      const code = newOtp.join('');
      verifyOtp(code);
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Verify OTP
  const verifyOtp = (code) => {
    if (code.length === 6) {
      setOtpError('');
      setStep('profile');
    } else {
      setOtpError('كود التحقق غير صحيح، حاول مرة أخرى');
    }
  };

  // Complete profile & login
  const handleFinishProfile = (e) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setNameError('يرجى كتابة اسمك (حقل إجباري للمتابعة)');
      return;
    }

    setNameError('');
    setIsInitializing(true);

    setTimeout(() => {
      const fullPhone = `${selectedCountry.code} ${phoneNumber.trim()}`;
      const newUser = {
        id: 'user_' + Date.now(),
        name: displayName.trim(),
        phone: fullPhone,
        about: 'متاح في Pro Chats ☕️ | Hey there! I am using Pro Chats.',
        avatar: selectedAvatar,
        createdAt: new Date().toISOString()
      };

      onLoginSuccess(newUser);
    }, 1200);
  };

  return (
    <div className={`relative flex-1 flex flex-col justify-between p-6 select-none overflow-y-auto ${
      isDarkMode ? 'bg-[#1f1612] text-[#f7ece1]' : 'bg-white text-[#3d2314]'
    }`}>
      {/* 1. WELCOME SCREEN */}
      {step === 'welcome' && (
        <div className="flex-1 flex flex-col items-center justify-between py-8 animate-fadeIn text-center">
          <div className="flex flex-col items-center gap-6 mt-8">
            <h1 className="text-2xl font-bold tracking-tight text-[#c27847]">
              أهلاً بك في Pro Chats
            </h1>

            {/* Pro Chats Warm Brown Illustration Badge */}
            <div className="relative my-4">
              <div className="w-48 h-48 rounded-full bg-[#a56a4c]/10 dark:bg-[#a56a4c]/20 flex items-center justify-center">
                <div className="w-36 h-36 rounded-full bg-[#a56a4c] flex items-center justify-center text-white shadow-2xl shadow-[#a56a4c]/40">
                  <MessageSquare size={72} className="translate-x-1" />
                </div>
              </div>
            </div>

            <p className="text-xs text-[#b89f8f] max-w-xs leading-relaxed">
              اقرأ <span className="text-[#38bdf8] cursor-pointer">سياسة الخصوصية</span>. انقر على "الموافقة والمتابعة" لقبول <span className="text-[#38bdf8] cursor-pointer">شروط الخدمة</span> الخاصة بـ Pro Chats.
            </p>
          </div>

          <button
            onClick={() => setStep('phone')}
            className="w-full max-w-xs py-3 rounded-full bg-[#a56a4c] hover:bg-[#915738] active:scale-98 text-white font-bold text-sm shadow-lg transition-all"
          >
            الموافقة والمتابعة
          </button>
        </div>
      )}

      {/* 2. PHONE NUMBER INPUT SCREEN */}
      {step === 'phone' && (
        <div className="flex-1 flex flex-col justify-between py-6 animate-fadeIn">
          <div>
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setStep('welcome')}
                className="p-1 text-[#b89f8f] hover:text-white"
              >
                <ArrowRight size={20} className="rotate-180" />
              </button>
              <h2 className="text-base font-bold text-[#c27847]">أدخل رقم هاتفك</h2>
              <div className="w-6" />
            </div>

            <p className="text-xs text-center text-[#b89f8f] mb-8 leading-relaxed">
              سيرسل Pro Chats رسالة نصية قصيرة (SMS) للتحقق من رقم هاتفك.
            </p>

            <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-4 max-w-xs mx-auto">
              {/* Country Picker Dropdown */}
              <div className="flex flex-col gap-1 border-b-2 border-[#a56a4c] pb-1">
                <label className="text-[11px] text-[#c27847] font-semibold text-right">الدولة</label>
                <select
                  value={selectedCountry.code}
                  onChange={(e) => {
                    const found = COUNTRIES.find((c) => c.code === e.target.value);
                    if (found) setSelectedCountry(found);
                  }}
                  className={`bg-transparent outline-none text-sm font-semibold cursor-pointer py-1 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {COUNTRIES.map((c) => (
                    <option
                      key={c.name}
                      value={c.code}
                      className={isDarkMode ? 'bg-[#2c201a] text-white' : 'bg-white text-gray-900'}
                    >
                      {c.flag} {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Phone Input Box with country prefix */}
              <div className="flex items-center gap-3 border-b-2 border-[#a56a4c] pb-1 mt-2">
                <span className="text-base font-mono font-bold text-[#c27847] select-none" dir="ltr">
                  {selectedCountry.code}
                </span>
                <input
                  type="tel"
                  autoFocus
                  dir="ltr"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="10 1234 5678"
                  className={`flex-1 bg-transparent outline-none text-base font-semibold tracking-wider placeholder-[#b89f8f] ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}
                  required
                />
              </div>

              {phoneError && (
                <p className="text-xs text-red-500 font-medium text-right mt-1">
                  {phoneError}
                </p>
              )}
            </form>
          </div>

          <div className="flex flex-col items-center gap-3">
            <button
              onClick={handlePhoneSubmit}
              className="w-full max-w-xs py-3 rounded-full bg-[#a56a4c] hover:bg-[#915738] active:scale-98 text-white font-bold text-sm shadow-md transition-all"
            >
              التالي
            </button>
            <div className="flex items-center gap-1 text-[11px] text-[#b89f8f]">
              <ShieldCheck size={14} className="text-[#c27847]" />
              <span>محمي بالتشفير التام في Pro Chats</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. OTP VERIFICATION SCREEN */}
      {step === 'otp' && (
        <div className="flex-1 flex flex-col justify-between py-6 animate-fadeIn">
          <div>
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setStep('phone')}
                className="p-1 text-[#b89f8f] hover:text-white"
              >
                <ArrowRight size={20} className="rotate-180" />
              </button>
              <h2 className="text-base font-bold text-[#c27847]">التحقق من رقمك</h2>
              <div className="w-6" />
            </div>

            <div className="text-center mb-6">
              <p className="text-xs text-[#b89f8f] mb-1">
                تم إرسال كود التحقق في رسالة نصية SMS إلى:
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm font-bold font-mono text-[#c27847]" dir="ltr">
                  {selectedCountry.code} {phoneNumber}
                </span>
                <button
                  onClick={() => setStep('phone')}
                  className="text-xs text-[#38bdf8] font-semibold underline"
                >
                  تعديل
                </button>
              </div>
            </div>

            {/* Auto-fill Tip */}
            <div className="mx-auto max-w-xs mb-6 p-2.5 rounded-xl bg-[#a56a4c]/10 border border-[#a56a4c]/20 text-center">
              <p className="text-[11px] text-[#c27847] font-medium">
                💡 كود التحقق التجريبي هو: <strong>123456</strong>
              </p>
              <button
                type="button"
                onClick={() => {
                  const demo = ['1', '2', '3', '4', '5', '6'];
                  setOtp(demo);
                  verifyOtp('123456');
                }}
                className="mt-1.5 text-[11px] px-3 py-1 rounded-full bg-[#a56a4c] hover:bg-[#915738] text-white font-bold"
              >
                تعبئة تلقائية والتحقق فوراً
              </button>
            </div>

            {/* 6 Digits OTP Inputs */}
            <div className="flex items-center justify-center gap-2 max-w-xs mx-auto mb-4" dir="ltr">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (otpInputsRef.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e.key)}
                  className={`w-11 h-12 rounded-xl text-center text-xl font-bold border-2 transition-all outline-none ${
                    digit ? 'border-[#a56a4c]' : 'border-gray-300 dark:border-[#443026]'
                  } ${isDarkMode ? 'bg-[#2c201a] text-white' : 'bg-gray-50 text-[#3d2314]'}`}
                />
              ))}
            </div>

            {otpError && (
              <p className="text-xs text-red-500 text-center font-medium mb-4">
                {otpError}
              </p>
            )}

            {/* Resend SMS Counter */}
            <div className="text-center text-xs text-[#b89f8f]">
              {resendTimer > 0 ? (
                <span>إعادة إرسال رسالة SMS بعد ({resendTimer} ثانية)</span>
              ) : (
                <button
                  onClick={() => setResendTimer(60)}
                  className="text-[#c27847] font-bold hover:underline inline-flex items-center gap-1"
                >
                  <RefreshCw size={13} />
                  <span>إعادة إرسال كود التحقق</span>
                </button>
              )}
            </div>
          </div>

          <button
            onClick={() => verifyOtp(otp.join(''))}
            disabled={otp.some((d) => d === '')}
            className={`w-full max-w-xs mx-auto py-3 rounded-full text-white font-bold text-sm shadow-md transition-all ${
              otp.every((d) => d !== '')
                ? 'bg-[#a56a4c] hover:bg-[#915738] cursor-pointer'
                : 'bg-stone-400 dark:bg-stone-800 cursor-not-allowed opacity-60'
            }`}
          >
            تأكيد الكود
          </button>
        </div>
      )}

      {/* 4. PROFILE SETUP SCREEN */}
      {step === 'profile' && (
        <form onSubmit={handleFinishProfile} className="flex-1 flex flex-col justify-between py-6 animate-fadeIn text-center">
          <div>
            <h2 className="text-lg font-bold text-[#c27847] mb-2">معلومات الملف الشخصي</h2>
            <p className="text-xs text-[#b89f8f] mb-6">
              يُرجى إدخال اسمك وتحديد صورتك الرمزية في Pro Chats.
            </p>

            {/* Avatar Selector */}
            <div className="flex flex-col items-center gap-3 mb-6">
              {/* Hidden file input for device media */}
              <input
                type="file"
                ref={avatarFileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleDeviceAvatarChange}
              />

              <div
                onClick={() => avatarFileInputRef.current?.click()}
                className="relative cursor-pointer group"
                title="اضغط لاختيار صورة من جهازك"
              >
                <img
                  src={selectedAvatar}
                  alt="الصورة الرمزية"
                  className="w-28 h-28 rounded-full object-cover ring-4 ring-[#a56a4c] shadow-xl transition-all group-hover:brightness-90"
                />
                <div className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  {isUploadingAvatar ? (
                    <Loader2 size={24} className="animate-spin text-white" />
                  ) : (
                    <Camera size={24} />
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    avatarFileInputRef.current?.click();
                  }}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#a56a4c] text-white flex items-center justify-center shadow-lg border-2 border-white dark:border-[#1f1612] hover:bg-[#915738] transition-colors"
                  title="رفع صورة من الجهاز"
                >
                  <Camera size={16} />
                </button>
              </div>

              {/* Upload from device button */}
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => avatarFileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#a56a4c]/10 hover:bg-[#a56a4c]/20 text-[#a56a4c] dark:text-[#e29968] text-xs font-bold transition-all border border-[#a56a4c]/30 disabled:opacity-50"
                >
                  <Upload size={13} />
                  <span>{isUploadingAvatar ? 'جاري التحميل...' : 'اختيار صورة من جهازك'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const url = prompt('أدخل رابط صورة من الإنترنت (URL):', selectedAvatar);
                    if (url && url.trim() !== '') setSelectedAvatar(url.trim());
                  }}
                  className="px-2.5 py-1.5 rounded-full border border-gray-200 dark:border-[#443026] text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  رابط URL
                </button>
              </div>

              {/* Avatar options picker */}
              <div className="flex items-center justify-center gap-2 mt-1">
                {PRESET_AVATARS.map((av, idx) => (
                  <img
                    key={idx}
                    src={av}
                    alt="Preset"
                    onClick={() => setSelectedAvatar(av)}
                    className={`w-9 h-9 rounded-full object-cover cursor-pointer transition-all ${
                      selectedAvatar === av ? 'ring-2 ring-[#a56a4c] scale-110' : 'opacity-60 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Name Input */}
            <div className="max-w-xs mx-auto mt-4 text-center">
              <label className="text-xs font-bold text-[#c27847] block mb-1">
                الاسم الشخصي <span className="text-red-500">* (إجباري)</span>
              </label>
              <div className={`border-b-2 pb-1 transition-colors ${
                nameError ? 'border-red-500' : 'border-[#a56a4c]'
              }`}>
                <input
                  type="text"
                  autoFocus
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    if (nameError) setNameError('');
                  }}
                  placeholder="اكتب اسمك الكامل هنا (إجباري)..."
                  className={`w-full bg-transparent outline-none text-base font-semibold text-center placeholder-[#b89f8f] ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}
                  required
                />
              </div>
              {nameError && (
                <p className="text-xs text-red-500 font-bold mt-1.5 animate-pulse">
                  ⚠️ {nameError}
                </p>
              )}
            </div>
            <p className="text-[11px] text-[#b89f8f] mt-2">
              هذا الاسم إجباري وسيكون ظاهراً لكافة جهات اتصالك في Pro Chats.
            </p>
          </div>

          <div className="flex flex-col items-center">
            {isInitializing ? (
              <div className="flex items-center gap-2 text-sm text-[#c27847] font-semibold animate-pulse">
                <RefreshCw size={18} className="animate-spin" />
                <span>جاري تهيئة حسابك في Pro Chats...</span>
              </div>
            ) : (
              <button
                type="submit"
                disabled={!displayName.trim()}
                className={`w-full max-w-xs py-3 rounded-full text-white font-bold text-sm shadow-md transition-all ${
                  displayName.trim()
                    ? 'bg-[#a56a4c] hover:bg-[#915738] cursor-pointer'
                    : 'bg-stone-400 dark:bg-stone-800 cursor-not-allowed opacity-60'
                }`}
              >
                بدء استخدام Pro Chats
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
