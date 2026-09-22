import React, { useState } from 'react';
import { Camera, Search, MoreVertical, Moon, Sun, User, Settings, Users, MessageSquarePlus } from 'lucide-react';

export default function TopBar({
  user,
  activeTab,
  setActiveTab,
  unreadTotal,
  onOpenProfile,
  onOpenNewChat,
  onSearchToggle,
  isSearching,
  searchQuery,
  setSearchQuery,
  isDarkMode,
  setIsDarkMode
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className={`w-full select-none z-20 transition-colors shadow-sm ${
      isDarkMode ? 'bg-[#2c201a] text-[#f7ece1]' : 'bg-[#784e38] text-white'
    }`}>
      {/* Top row: Pro Chats Title & Action Icons */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        {isSearching ? (
          <div className="flex-1 flex items-center gap-2 bg-black/15 dark:bg-black/25 rounded-full px-3 py-1.5 animate-fadeIn">
            <Search size={18} className="text-[#e2d5c8]" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث في المحادثات..."
              className="bg-transparent border-none outline-none w-full text-sm text-white placeholder-[#e2d5c8]/70"
            />
            <button
              onClick={() => {
                setSearchQuery('');
                onSearchToggle(false);
              }}
              className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 hover:bg-white/30 text-white"
            >
              إلغاء
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <h1 className={`text-xl font-bold tracking-wide ${isDarkMode ? 'text-[#fdf7f2]' : 'text-white'}`}>
                Pro Chats
              </h1>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-black/20 text-[#fdf7f2] font-semibold">
                PRO
              </span>
            </div>

            <div className="flex items-center gap-3.5 text-inherit">
              <button
                onClick={() => onSearchToggle(true)}
                className="hover:opacity-80 transition-opacity p-1"
                title="بحث"
              >
                <Search size={20} />
              </button>

              <button
                onClick={onOpenNewChat}
                className="hover:opacity-80 transition-opacity p-1"
                title="محادثة جديدة"
              >
                <MessageSquarePlus size={20} />
              </button>

              {/* User Avatar on Home Screen */}
              {user && (
                <button
                  onClick={onOpenProfile}
                  className="relative p-0.5 rounded-full hover:ring-2 hover:ring-[#e29968] transition-all flex items-center justify-center group"
                  title={`الملف الشخصي: ${user.name}`}
                >
                  <img
                    src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                    alt={user.name || 'حسابي'}
                    className="w-7 h-7 rounded-full object-cover ring-1.5 ring-white/50 shadow-sm transition-transform group-hover:scale-105"
                  />
                </button>
              )}

              {/* Three dots menu */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="hover:opacity-80 transition-opacity p-1"
                  title="خيارات إضافية"
                >
                  <MoreVertical size={20} />
                </button>

                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowMenu(false)}
                    />
                    <div className={`absolute left-0 mt-2 w-52 rounded-2xl shadow-2xl py-2 z-50 text-sm animate-fadeIn border ${
                      isDarkMode ? 'bg-[#33251e] border-[#443026] text-[#f7ece1]' : 'bg-white border-[#ebdcd0] text-[#3d2314]'
                    }`}>
                      {/* User Header in Menu */}
                      {user && (
                        <div
                          onClick={() => {
                            setShowMenu(false);
                            onOpenProfile();
                          }}
                          className="px-3.5 py-2.5 flex items-center gap-2.5 border-b border-gray-100 dark:border-[#443026] cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-9 h-9 rounded-full object-cover ring-2 ring-[#a56a4c]"
                          />
                          <div className="flex-1 min-w-0 text-right">
                            <div className="font-bold text-xs truncate leading-tight">{user.name}</div>
                            <div className="text-[10px] text-[#b89f8f] truncate font-mono mt-0.5">{user.phone}</div>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onOpenNewChat();
                        }}
                        className="w-full px-4 py-2.5 text-right flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      >
                        <span>محادثة جديدة</span>
                        <Users size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onOpenProfile();
                        }}
                        className="w-full px-4 py-2.5 text-right flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      >
                        <span>الملف الشخصي</span>
                        <User size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          setIsDarkMode(!isDarkMode);
                        }}
                        className="w-full px-4 py-2.5 text-right flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      >
                        <span>{isDarkMode ? 'الوضع النهاري' : 'الوضع الليلي'}</span>
                        {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                      </button>
                      <hr className="my-1 border-gray-200 dark:border-[#443026]" />
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onOpenProfile();
                        }}
                        className="w-full px-4 py-2.5 text-right flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      >
                        <span>الإعدادات</span>
                        <Settings size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Tabs navigation row */}
      <nav className="flex items-center text-center font-bold text-sm tracking-wide border-b border-black/10 dark:border-white/5">
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex-1 py-2.5 relative transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'chats'
              ? isDarkMode ? 'text-[#e29968]' : 'text-white'
              : isDarkMode ? 'text-[#b89f8f]' : 'text-white/75'
          }`}
        >
          <span>الدردشات</span>
          {unreadTotal > 0 && (
            <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-semibold ${
              activeTab === 'chats'
                ? isDarkMode ? 'bg-[#e29968] text-[#1f1612]' : 'bg-white text-[#784e38]'
                : 'bg-[#c27847] text-white'
            }`}>
              {unreadTotal}
            </span>
          )}
          {activeTab === 'chats' && (
            <div className={`absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full ${
              isDarkMode ? 'bg-[#e29968]' : 'bg-white'
            }`} />
          )}
        </button>

        <button
          onClick={() => setActiveTab('status')}
          className={`flex-1 py-2.5 relative transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'status'
              ? isDarkMode ? 'text-[#e29968]' : 'text-white'
              : isDarkMode ? 'text-[#b89f8f]' : 'text-white/75'
          }`}
        >
          <span>الحالة</span>
          <span className="w-2 h-2 rounded-full bg-[#c27847]" />
          {activeTab === 'status' && (
            <div className={`absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full ${
              isDarkMode ? 'bg-[#e29968]' : 'bg-white'
            }`} />
          )}
        </button>

        <button
          onClick={() => setActiveTab('calls')}
          className={`flex-1 py-2.5 relative transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'calls'
              ? isDarkMode ? 'text-[#e29968]' : 'text-white'
              : isDarkMode ? 'text-[#b89f8f]' : 'text-white/75'
          }`}
        >
          <span>المكالمات</span>
          {activeTab === 'calls' && (
            <div className={`absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full ${
              isDarkMode ? 'bg-[#e29968]' : 'bg-white'
            }`} />
          )}
        </button>
      </nav>
    </header>
  );
}
