import React, { useState, useEffect } from 'react';
import { ArrowRight, Search, UserPlus, Users, MessageSquare, CheckCircle2, UserCheck, Loader2, AlertTriangle } from 'lucide-react';
import { normalizePhone } from '../utils/phone';

const API_SERVER = 'http://localhost:4000';

export default function NewChatModal({
  contacts,
  onSelectContact,
  onAddNewContact,
  onClose,
  isDarkMode
}) {
  const [search, setSearch] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  // Search bar lookup state
  const [searchLookup, setSearchLookup] = useState(null);
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [searchNotFound, setSearchNotFound] = useState(false);

  // New contact drawer lookup state
  const [newPhoneLookup, setNewPhoneLookup] = useState(null);
  const [isSearchingNewPhone, setIsSearchingNewPhone] = useState(false);
  const [newPhoneNotFound, setNewPhoneNotFound] = useState(false);

  const [formError, setFormError] = useState('');

  // 1. Search Bar Lookup: Check server whenever user writes a phone number in search
  useEffect(() => {
    const cleanDigits = search.replace(/\D/g, '');
    const norm = normalizePhone(search);

    if (cleanDigits.length >= 7 || norm.length >= 7) {
      setIsSearchingUser(true);
      setSearchNotFound(false);

      const timer = setTimeout(() => {
        fetch(`${API_SERVER}/api/users/lookup?phone=${encodeURIComponent(norm || cleanDigits)}`)
          .then((res) => res.json())
          .then((data) => {
            setIsSearchingUser(false);
            if (data.exists && data.user) {
              setSearchLookup(data.user);
              setSearchNotFound(false);
            } else {
              setSearchLookup(null);
              setSearchNotFound(true);
            }
          })
          .catch(() => {
            setIsSearchingUser(false);
            setSearchLookup(null);
            setSearchNotFound(true);
          });
      }, 350);

      return () => clearTimeout(timer);
    } else {
      setSearchLookup(null);
      setSearchNotFound(false);
      setIsSearchingUser(false);
    }
  }, [search]);

  // 2. New Phone Lookup: Check server whenever user writes in the phone drawer
  useEffect(() => {
    const cleanDigits = newPhone.replace(/\D/g, '');
    const norm = normalizePhone(newPhone);

    if (cleanDigits.length >= 7 || norm.length >= 7) {
      setIsSearchingNewPhone(true);
      setNewPhoneNotFound(false);

      const timer = setTimeout(() => {
        fetch(`${API_SERVER}/api/users/lookup?phone=${encodeURIComponent(norm || cleanDigits)}`)
          .then((res) => res.json())
          .then((data) => {
            setIsSearchingNewPhone(false);
            if (data.exists && data.user) {
              setNewPhoneLookup(data.user);
              setNewPhoneNotFound(false);
              if (!newName.trim() && data.user.name) {
                setNewName(data.user.name);
              }
            } else {
              setNewPhoneLookup(null);
              setNewPhoneNotFound(true);
            }
          })
          .catch(() => {
            setIsSearchingNewPhone(false);
            setNewPhoneLookup(null);
            setNewPhoneNotFound(true);
          });
      }, 350);

      return () => clearTimeout(timer);
    } else {
      setNewPhoneLookup(null);
      setNewPhoneNotFound(false);
      setIsSearchingNewPhone(false);
    }
  }, [newPhone]);

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    (c.cleanPhone && c.cleanPhone.includes(search.replace(/\D/g, '')))
  );

  const handleCreateContact = (e) => {
    e.preventDefault();
    const phoneToUse = newPhone.trim();
    const contactName = newName.trim();

    if (!phoneToUse) {
      setFormError('يرجى إدخال رقم الهاتف');
      return;
    }

    if (!contactName) {
      setFormError('يرجى إدخال اسم جهة الاتصال (حقل إجباري)');
      return;
    }

    if (newPhoneNotFound) {
      setFormError('⚠️ تحذير: هذا الرقم ليس لديه حساب مسجل في Pro Chats. يرجى التأكد من الرقم.');
      return;
    }

    setFormError('');

    const contactAvatar = newPhoneLookup?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
    const contactAbout = newPhoneLookup?.about || 'متاح في Pro Chats ☕️';

    onAddNewContact({
      id: 'c_' + Date.now(),
      name: contactName,
      phone: phoneToUse,
      avatar: contactAvatar,
      about: contactAbout,
      isOnline: newPhoneLookup?.isOnline || false,
      lastSeen: newPhoneLookup?.lastSeen || 'متصل الآن',
      unreadCount: 0,
      messages: []
    });

    setIsAddingNew(false);
    setNewName('');
    setNewPhone('');
    setNewPhoneLookup(null);
    setNewPhoneNotFound(false);
  };

  return (
    <div className={`absolute inset-0 z-50 flex flex-col overflow-y-auto select-none transition-colors ${
      isDarkMode ? 'bg-[#1f1612] text-[#f7ece1]' : 'bg-white text-[#3d2314]'
    }`}>
      {/* Header */}
      <header className={`px-4 py-3 flex items-center justify-between ${
        isDarkMode ? 'bg-[#2c201a] text-white' : 'bg-[#784e38] text-white'
      }`}>
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-1 rounded-full hover:bg-black/10">
            <ArrowRight size={22} className="rotate-180" />
          </button>
          <div className="text-right">
            <h2 className="text-base font-bold">بدء محادثة جديدة</h2>
            <p className="text-xs opacity-80">ابحث برقم الهاتف أو الاسم</p>
          </div>
        </div>
      </header>

      {/* Search Input Bar */}
      <div className="p-3 border-b border-[#ebdcd0] dark:border-[#2c201a]">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${
          isDarkMode ? 'bg-[#2c201a] text-white' : 'bg-[#f7f2ec] text-[#3d2314]'
        }`}>
          {isSearchingUser ? (
            <Loader2 size={18} className="animate-spin text-[#c27847]" />
          ) : (
            <Search size={18} className="text-[#b89f8f]" />
          )}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="اكتب رقم هاتف للتواصل الفوري معه..."
            className="bg-transparent border-none outline-none w-full text-sm text-right placeholder-[#b89f8f]"
          />
        </div>
      </div>

      {/* 1. Progress Indicator when checking number */}
      {isSearchingUser && (
        <div className="m-3 p-3 rounded-2xl bg-[#a56a4c]/5 border border-[#a56a4c]/20 flex items-center justify-center gap-2 text-xs text-[#a56a4c] dark:text-[#e29968] animate-fadeIn">
          <Loader2 size={16} className="animate-spin text-[#c27847]" />
          <span>جاري فحص الرقم والتأكد من وجود حساب على السيرفر...</span>
        </div>
      )}

      {/* 2. Registered Account Found Banner */}
      {searchLookup && (
        <div className="m-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3 text-right">
            <img
              src={searchLookup.avatar}
              alt={searchLookup.name}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-[#c27847] shadow-sm"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-bold text-[#c27847]">{searchLookup.name}</h4>
                <CheckCircle2 size={15} className="text-emerald-500" />
              </div>
              <p className="text-xs text-[#b89f8f] font-mono">{searchLookup.phone}</p>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                حساب مسجل على Pro Chats ✅
              </span>
            </div>
          </div>

          <button
            onClick={() => onAddNewContact({
              id: 'c_' + Date.now(),
              name: searchLookup.name,
              phone: searchLookup.phone,
              avatar: searchLookup.avatar,
              about: searchLookup.about,
              isOnline: searchLookup.isOnline,
              lastSeen: searchLookup.lastSeen,
              unreadCount: 0,
              messages: []
            })}
            className="px-4 py-2 rounded-full bg-[#a56a4c] hover:bg-[#915738] active:scale-95 text-white text-xs font-bold shadow-md transition-all"
          >
            مراسلة الآن
          </button>
        </div>
      )}

      {/* 3. Warning Banner: When number has NO registered account */}
      {searchNotFound && !isSearchingUser && (
        <div className="m-3 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-start gap-3 animate-fadeIn text-right">
          <div className="w-9 h-9 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertTriangle size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-bold text-red-600 dark:text-red-400">
                لا يوجد حساب مسجل بهذا الرقم!
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-600 dark:text-red-400 font-bold">
                غير مسجل ❌
              </span>
            </div>
            <p className="text-xs text-[#b89f8f] leading-relaxed">
              الرقم <span className="font-mono font-bold text-[#c27847]">{search}</span> ليس لديه حساب مسجل على Pro Chats حالياً.
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
              تأكد من كتابة الرقم بشكل صحيح مع كود الدولة (+20...)، حيث لن تصل أي رسائل إلى هذا الرقم حتى يقوم صاحبه بالتسجيل في التطبيق.
            </p>
          </div>
        </div>
      )}

      {/* Quick Action Button: Add new contact manually */}
      <div className="p-2 flex flex-col gap-1 border-b border-[#ebdcd0] dark:border-[#2c201a] text-right">
        <button
          onClick={() => {
            setIsAddingNew(true);
            setFormError('');
          }}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
            isDarkMode ? 'hover:bg-[#2c201a]' : 'hover:bg-[#fbf7f2]'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-[#a56a4c] text-white flex items-center justify-center">
            <UserPlus size={20} />
          </div>
          <div>
            <h4 className="text-sm font-semibold">تسجيل رقم جديد</h4>
            <p className="text-xs text-[#b89f8f]">أدخل الاسم والرقم لإضافته وبدء المحادثة</p>
          </div>
        </button>
      </div>

      {/* Add New Contact Form Drawer */}
      {isAddingNew && (
        <form onSubmit={handleCreateContact} className={`m-3 p-4 rounded-2xl border flex flex-col gap-3 animate-fadeIn text-right ${
          isDarkMode ? 'bg-[#2c201a] border-[#443026]' : 'bg-[#faf4ed] border-[#ebdcd0]'
        }`}>
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-[#c27847]">تسجيل جهة اتصال جديدة</h4>
            <span className="text-[11px] text-red-500 font-semibold">* الاسم والرقم مطلوبان</span>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#8c6f5d] dark:text-[#b89f8f]">
              رقم الهاتف <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              placeholder="مثلاً: +20 100 123 4567..."
              value={newPhone}
              onChange={(e) => {
                setNewPhone(e.target.value);
                if (formError) setFormError('');
              }}
              className={`px-3 py-2 rounded-xl text-sm border outline-none text-right font-mono ${
                isDarkMode ? 'bg-[#1f1612] border-[#443026] text-white' : 'bg-white border-[#ebdcd0]'
              }`}
              required
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#8c6f5d] dark:text-[#b89f8f]">
              اسم جهة الاتصال <span className="text-red-500">* (إجباري)</span>
            </label>
            <input
              type="text"
              placeholder="اكتب اسم جهة الاتصال هنا (إجباري)..."
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                if (formError) setFormError('');
              }}
              className={`px-3 py-2 rounded-xl text-sm border outline-none text-right ${
                formError && !newName.trim()
                  ? 'border-red-500 bg-red-500/10'
                  : isDarkMode ? 'bg-[#1f1612] border-[#443026] text-white' : 'bg-white border-[#ebdcd0]'
              }`}
              required
            />
          </div>

          {/* Searching progress */}
          {isSearchingNewPhone && (
            <div className="flex items-center gap-1.5 text-xs text-[#c27847] text-right">
              <Loader2 size={13} className="animate-spin" />
              <span>جاري التحقق من الرقم على السيرفر...</span>
            </div>
          )}

          {/* Account Found */}
          {newPhoneLookup && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2 text-right animate-fadeIn">
              <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                حساب مسجل باسم: {newPhoneLookup.name} ✅
              </span>
            </div>
          )}

          {/* Account Not Found Warning */}
          {newPhoneNotFound && !isSearchingNewPhone && (
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-2 text-right animate-fadeIn">
              <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-xs text-red-600 dark:text-red-400 font-bold leading-relaxed">
                تحذير: لا يوجد حساب مسجل بهذا الرقم في Pro Chats!
                <span className="block font-normal text-[11px] text-[#b89f8f] mt-0.5">
                  تأكد من صحة الرقم؛ حيث لن تصله رسائلك إلا بعد أن يقوم بإنشاء حساب في التطبيق.
                </span>
              </div>
            </div>
          )}

          {formError && (
            <p className="text-xs text-red-500 font-bold animate-pulse">
              ⚠️ {formError}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 mt-1">
            <button
              type="button"
              onClick={() => {
                setIsAddingNew(false);
                setFormError('');
              }}
              className="px-3 py-1.5 rounded-xl text-xs text-gray-500 hover:bg-black/5"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={!newName.trim() || !newPhone.trim()}
              className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all ${
                newName.trim() && newPhone.trim()
                  ? 'bg-[#a56a4c] hover:bg-[#915738] cursor-pointer'
                  : 'bg-stone-400 dark:bg-stone-800 cursor-not-allowed opacity-60'
              }`}
            >
              بدء المحادثة فوراً
            </button>
          </div>
        </form>
      )}

      {/* Saved / Recent Contacts List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#ebdcd0] dark:divide-[#2c201a]">
        <div className="px-4 py-2 text-xs font-bold text-[#b89f8f] text-right">
          المحادثات السابقة وجهات الاتصال
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#b89f8f]">
            {search ? 'لا توجد نتائج مطابقة، انقر على "مراسلة رقم جديد"' : 'لا توجد جهات اتصال بعد. اكتب رقماً بالأعلى لبدء محادثة فورية.'}
          </div>
        ) : (
          filtered.map((contact) => (
            <div
              key={contact.id}
              onClick={() => onSelectContact(contact)}
              className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                isDarkMode ? 'hover:bg-[#2c201a]' : 'hover:bg-[#fbf7f2]'
              }`}
            >
              <img
                src={contact.avatar}
                alt={contact.name}
                className="w-11 h-11 rounded-full object-cover"
              />
              <div className="flex-1 text-right">
                <h4 className="text-sm font-semibold">{contact.name}</h4>
                <p className="text-xs text-[#b89f8f] font-mono">{contact.phone}</p>
              </div>
              <MessageSquare size={16} className="text-[#c27847]" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
