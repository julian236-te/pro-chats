import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, Moon, Sun, Wifi, Battery, Signal } from 'lucide-react';

export default function PhoneFrame({ children, isDarkMode, setIsDarkMode }) {
  const [isMobileFrame, setIsMobileFrame] = useState(true);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`min-h-screen w-full flex flex-col items-center justify-center transition-colors duration-300 ${
      isDarkMode ? 'bg-[#140e0b] text-[#f7ece1]' : 'bg-[#f0e6db] text-[#3d2314]'
    }`}>
      {/* Top Controls Bar */}
      <header className="w-full max-w-5xl py-2.5 px-4 flex items-center justify-between z-20 text-xs md:text-sm font-medium">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#a56a4c] text-white font-bold text-xs shadow-sm">
            PC
          </span>
          <span className="font-bold tracking-wide text-sm hidden sm:inline">
            Pro Chats
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#a56a4c]/20 text-[#c27847] dark:text-[#e29968] border border-[#a56a4c]/30 font-semibold">
            Light Brown Edition
          </span>
        </div>

        <div className="flex items-center gap-2 bg-black/10 dark:bg-white/10 p-1 rounded-xl backdrop-blur-md">
          {/* Frame Toggle */}
          <button
            onClick={() => setIsMobileFrame(!isMobileFrame)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              isMobileFrame 
                ? 'bg-white dark:bg-[#2c201a] shadow-sm font-semibold text-[#a56a4c] dark:text-[#e29968]' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            title="تبديل وضع إطار الموبايل أو ملء الشاشة"
          >
            {isMobileFrame ? <Smartphone size={16} /> : <Monitor size={16} />}
            <span>{isMobileFrame ? 'إطار الموبايل' : 'ملء الشاشة'}</span>
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
            title="تغيير المظهر (ليلي / نهاري)"
          >
            {isDarkMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-amber-900" />}
            <span className="hidden sm:inline">{isDarkMode ? 'نهاري' : 'ليلي'}</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className={`relative transition-all duration-300 flex flex-col overflow-hidden ${
        isMobileFrame 
          ? 'w-[390px] h-[844px] max-h-[92vh] rounded-[48px] border-[10px] border-[#38261e] dark:border-[#261b15] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] ring-1 ring-white/10 my-auto'
          : 'w-full max-w-4xl h-[94vh] rounded-2xl shadow-2xl border border-[#ded0c2] dark:border-[#38261e]'
      } ${isDarkMode ? 'bg-[#1f1612]' : 'bg-[#fffaf5]'}`}>
        
        {/* Smartphone Status Bar */}
        {isMobileFrame && (
          <div className={`w-full pt-3 pb-1 px-7 flex items-center justify-between z-30 select-none text-[13px] font-semibold tracking-tight ${
            isDarkMode ? 'bg-[#2c201a] text-[#f7ece1]' : 'bg-[#784e38] text-white'
          }`}>
            <span>{currentTime || '09:41'}</span>

            {/* Dynamic Island */}
            <div className="w-24 h-4 bg-black rounded-full flex items-center justify-center gap-1.5 shadow-inner">
              <div className="w-2.5 h-2.5 rounded-full bg-[#111] border border-gray-700/60" />
              <div className="w-1.5 h-1.5 rounded-full bg-amber-800/60" />
            </div>

            <div className="flex items-center gap-1.5">
              <Signal size={12} strokeWidth={2.5} />
              <Wifi size={13} strokeWidth={2.5} />
              <Battery size={15} strokeWidth={2.5} className="fill-current" />
            </div>
          </div>
        )}

        {/* The App Screen */}
        <div className="relative flex-1 flex flex-col overflow-hidden w-full h-full">
          {children}
        </div>

        {/* Smartphone Home Indicator Bar */}
        {isMobileFrame && (
          <div className="w-full py-1.5 flex justify-center items-center bg-transparent pointer-events-none z-30">
            <div className="w-32 h-1 bg-amber-800/25 dark:bg-amber-600/20 rounded-full" />
          </div>
        )}
      </main>
    </div>
  );
}
