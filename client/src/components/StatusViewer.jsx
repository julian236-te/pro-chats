import React, { useState, useEffect } from 'react';
import { Plus, X, ChevronRight, ChevronLeft, Send, Sparkles, Image as ImageIcon } from 'lucide-react';

export default function StatusViewer({
  statuses,
  user,
  onAddStatus,
  isDarkMode
}) {
  const [activeStoryGroup, setActiveStoryGroup] = useState(null);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // New status creator state
  const [isCreatingStatus, setIsCreatingStatus] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [statusBg, setStatusBg] = useState('from-amber-700 to-stone-800');

  const bgOptions = [
    'from-amber-700 to-stone-800',
    'from-amber-600 to-amber-900',
    'from-stone-600 to-stone-850',
    'from-yellow-700 to-stone-900',
    'from-orange-700 to-stone-900'
  ];

  // Auto-progress stories
  useEffect(() => {
    if (!activeStoryGroup) return;

    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (storyIndex < activeStoryGroup.stories.length - 1) {
            setStoryIndex((s) => s + 1);
            return 0;
          } else {
            setActiveStoryGroup(null);
            setStoryIndex(0);
            return 0;
          }
        }
        return prev + 2.5;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [activeStoryGroup, storyIndex]);

  const handleOpenStories = (group) => {
    setActiveStoryGroup(group);
    setStoryIndex(0);
    setProgress(0);
  };

  const handleNextStory = () => {
    if (activeStoryGroup && storyIndex < activeStoryGroup.stories.length - 1) {
      setStoryIndex((s) => s + 1);
      setProgress(0);
    } else {
      setActiveStoryGroup(null);
    }
  };

  const handlePrevStory = () => {
    if (storyIndex > 0) {
      setStoryIndex((s) => s - 1);
      setProgress(0);
    }
  };

  const handlePublishStatus = () => {
    if (!statusText.trim()) return;
    onAddStatus({
      type: 'text',
      bgColor: statusBg,
      caption: statusText.trim()
    });
    setStatusText('');
    setIsCreatingStatus(false);
  };

  return (
    <div className="relative flex-1 flex flex-col overflow-y-auto select-none p-4">
      {/* My Status Section */}
      <div className="flex items-center justify-between pb-3 border-b border-[#ebdcd0] dark:border-[#2c201a]">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setIsCreatingStatus(true)}>
          <div className="relative">
            <img
              src={user?.avatar}
              alt="حالتي"
              className="w-13 h-13 rounded-full object-cover ring-2 ring-transparent"
            />
            <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#a56a4c] text-white flex items-center justify-center border-2 border-white dark:border-[#1f1612]">
              <Plus size={14} strokeWidth={3} />
            </span>
          </div>

          <div className="text-right">
            <h3 className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-[#3d2314]'}`}>
              حالتي
            </h3>
            <p className="text-xs text-[#b89f8f]">انقر لإضافة تحديث للحالة</p>
          </div>
        </div>
      </div>

      {/* Recent Updates Header */}
      <div className="mt-4 mb-2 text-right">
        <span className="text-xs font-bold uppercase tracking-wider text-[#b89f8f]">
          آخر التحديثات
        </span>
      </div>

      {/* Contact Statuses List */}
      {statuses.length === 0 ? (
        <div className="text-center py-8 text-[#b89f8f] text-xs">
          لا توجد حالات حديثة من جهات اتصالك
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {statuses.map((item) => (
            <div
              key={item.id}
              onClick={() => handleOpenStories(item)}
              className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors ${
                isDarkMode ? 'hover:bg-[#2c201a]' : 'hover:bg-[#fbf7f2]'
              }`}
            >
              {/* Avatar with lighter golden brown circle */}
              <div className="p-[2.5px] rounded-full border-2 border-[#c27847]">
                <img
                  src={item.userAvatar}
                  alt={item.userName}
                  className="w-11 h-11 rounded-full object-cover"
                />
              </div>

              <div className="flex-1 text-right">
                <h4 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-[#3d2314]'}`}>
                  {item.userName}
                </h4>
                <p className="text-xs text-[#b89f8f]">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Story Viewer Overlay */}
      {activeStoryGroup && (
        <div className="absolute inset-0 z-50 bg-[#140e0b] flex flex-col justify-between text-white animate-fadeIn">
          {/* Top Progress Bars */}
          <div className="p-3 flex items-center gap-1.5 z-20">
            {activeStoryGroup.stories.map((_, idx) => (
              <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#e29968] transition-all duration-100 ease-linear rounded-full"
                  style={{
                    width: idx < storyIndex ? '100%' : idx === storyIndex ? `${progress}%` : '0%'
                  }}
                />
              </div>
            ))}
          </div>

          {/* Story Header */}
          <div className="px-4 py-1 flex items-center justify-between z-20">
            <div className="flex items-center gap-2">
              <img
                src={activeStoryGroup.userAvatar}
                alt={activeStoryGroup.userName}
                className="w-9 h-9 rounded-full object-cover"
              />
              <div className="text-right">
                <h5 className="text-sm font-semibold">{activeStoryGroup.userName}</h5>
                <span className="text-[10px] opacity-75">{activeStoryGroup.time}</span>
              </div>
            </div>

            <button
              onClick={() => setActiveStoryGroup(null)}
              className="p-1 rounded-full bg-black/40 hover:bg-black/60"
            >
              <X size={20} />
            </button>
          </div>

          {/* Story Content */}
          <div className="relative flex-1 flex items-center justify-center p-4">
            <div
              className="absolute left-0 top-0 bottom-0 w-1/2 cursor-pointer z-10"
              onClick={handlePrevStory}
            />
            <div
              className="absolute right-0 top-0 bottom-0 w-1/2 cursor-pointer z-10"
              onClick={handleNextStory}
            />

            {activeStoryGroup.stories[storyIndex]?.type === 'image' ? (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <img
                  src={activeStoryGroup.stories[storyIndex].url}
                  alt="Story"
                  className="max-h-[70vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
                />
                {activeStoryGroup.stories[storyIndex].caption && (
                  <p className="mt-4 px-4 py-2 rounded-xl bg-black/60 text-sm text-center">
                    {activeStoryGroup.stories[storyIndex].caption}
                  </p>
                )}
              </div>
            ) : (
              <div className={`w-full h-full rounded-3xl bg-gradient-to-br ${activeStoryGroup.stories[storyIndex]?.bgColor || 'from-amber-700 to-stone-800'} flex items-center justify-center p-8 text-center shadow-2xl`}>
                <p className="text-2xl font-bold leading-relaxed">
                  {activeStoryGroup.stories[storyIndex]?.caption}
                </p>
              </div>
            )}
          </div>

          {/* Story Reply Bar */}
          <div className="p-3 bg-black/40 backdrop-blur-md flex items-center gap-2 z-20">
            <input
              type="text"
              placeholder="رد على الحالة..."
              className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm text-white placeholder-white/60 outline-none"
            />
            <button
              onClick={() => {
                alert('تم إرسال الرد على الحالة!');
                setActiveStoryGroup(null);
              }}
              className="w-9 h-9 rounded-full bg-[#a56a4c] text-white flex items-center justify-center"
            >
              <Send size={16} className="rotate-180" />
            </button>
          </div>
        </div>
      )}

      {/* New Status Creator Modal */}
      {isCreatingStatus && (
        <div className="absolute inset-0 z-50 bg-[#1f1612] flex flex-col justify-between p-6 animate-fadeIn">
          <div className="flex items-center justify-between text-white">
            <button
              onClick={() => setIsCreatingStatus(false)}
              className="p-1 rounded-full bg-white/10 hover:bg-white/20"
            >
              <X size={22} />
            </button>
            <h4 className="font-semibold text-base">إضافة حالة نصية</h4>
            <button
              onClick={handlePublishStatus}
              className="px-4 py-1.5 rounded-full bg-[#a56a4c] hover:bg-[#915738] text-white font-bold text-xs"
            >
              نشر
            </button>
          </div>

          <div className={`flex-1 rounded-3xl bg-gradient-to-br ${statusBg} my-6 p-6 flex flex-col items-center justify-center text-center shadow-inner`}>
            <textarea
              autoFocus
              value={statusText}
              onChange={(e) => setStatusText(e.target.value)}
              placeholder="اكتب حالتك هنا..."
              rows={4}
              className="w-full bg-transparent border-none outline-none text-white text-2xl font-bold text-center placeholder-white/60 resize-none"
            />
          </div>

          {/* Background color selectors */}
          <div className="flex items-center justify-center gap-3">
            {bgOptions.map((bg) => (
              <button
                key={bg}
                onClick={() => setStatusBg(bg)}
                className={`w-9 h-9 rounded-full bg-gradient-to-br ${bg} border-2 ${
                  statusBg === bg ? 'border-white scale-110' : 'border-transparent'
                } transition-all`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
