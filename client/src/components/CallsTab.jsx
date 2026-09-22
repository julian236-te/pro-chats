import React from 'react';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, PhoneCall } from 'lucide-react';

export default function CallsTab({ calls, onStartCall, isDarkMode }) {
  return (
    <div className="relative flex-1 flex flex-col overflow-y-auto select-none p-2">
      <div className="px-3 py-2 text-right">
        <span className="text-xs font-bold uppercase tracking-wider text-[#b89f8f]">
          سجل المكالمات
        </span>
      </div>

      {calls.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#b89f8f]">
          <PhoneCall size={32} className="mb-2 text-[#a56a4c]" />
          <p className="text-xs font-semibold">لا توجد مكالمات سابقة</p>
          <p className="text-[11px] mt-1">ابدأ مكالمة صوتية أو فيديو مع أي من جهات اتصالك في Pro Chats.</p>
        </div>
      ) : (
        <div className="divide-y divide-[#ebdcd0] dark:divide-[#2c201a]">
          {calls.map((call) => (
            <div
              key={call.id}
              className={`flex items-center justify-between px-3 py-3 rounded-xl transition-colors ${
                isDarkMode ? 'hover:bg-[#2c201a]' : 'hover:bg-[#fbf7f2]'
              }`}
            >
              {/* Call action icon */}
              <button
                onClick={() => onStartCall(call, call.type)}
                className="p-2 rounded-full text-[#a56a4c] hover:bg-[#a56a4c]/10 transition-colors"
                title="إجراء مكالمة"
              >
                {call.type === 'video' ? <Video size={20} /> : <Phone size={20} />}
              </button>

              {/* Contact details & call status */}
              <div className="flex items-center gap-3 text-right">
                <div>
                  <h4 className={`text-sm font-semibold ${
                    call.status === 'missed' ? 'text-red-500' : isDarkMode ? 'text-white' : 'text-[#3d2314]'
                  }`}>
                    {call.name}
                  </h4>
                  <div className="flex items-center justify-end gap-1 text-xs text-[#b89f8f] mt-0.5">
                    <span>{call.time}</span>
                    {call.status === 'missed' ? (
                      <PhoneMissed size={14} className="text-red-500" />
                    ) : call.direction === 'outgoing' ? (
                      <PhoneOutgoing size={14} className="text-[#c27847]" />
                    ) : (
                      <PhoneIncoming size={14} className="text-[#c27847]" />
                    )}
                  </div>
                </div>

                <img
                  src={call.avatar}
                  alt={call.name}
                  className="w-11 h-11 rounded-full object-cover shadow-sm"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Call Button */}
      <button
        onClick={() => alert('اختر جهة اتصال من قائمة الدردشات لبدء مكالمة معها')}
        className="absolute bottom-6 left-6 w-14 h-14 rounded-2xl bg-[#a56a4c] hover:bg-[#915738] active:scale-95 text-white flex items-center justify-center shadow-xl transition-all z-10"
        title="مكالمة جديدة"
      >
        <PhoneCall size={22} />
      </button>
    </div>
  );
}
