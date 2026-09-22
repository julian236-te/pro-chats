import React, { useState, useEffect, useRef } from 'react';
import { PhoneOff, Mic, MicOff, Volume2, VolumeX, Video, VideoOff, Lock } from 'lucide-react';
import { startRingtone, stopRingtone } from '../utils/audio';

export default function CallModal({ callData, onClose }) {
  const [callStatus, setCallStatus] = useState('ringing');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(callData.type === 'video');
  const [duration, setDuration] = useState(0);

  const durationTimerRef = useRef(null);

  useEffect(() => {
    startRingtone();

    const connectTimer = setTimeout(() => {
      stopRingtone();
      setCallStatus('connected');
      durationTimerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    }, 3500);

    return () => {
      stopRingtone();
      clearTimeout(connectTimer);
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, []);

  const handleEndCall = () => {
    stopRingtone();
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    onClose();
  };

  const formatDuration = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="absolute inset-0 z-50 bg-[#1a120e] text-white flex flex-col justify-between p-6 select-none animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col items-center gap-1 mt-4 text-center">
        <div className="flex items-center gap-1.5 text-xs text-[#b89f8f] mb-1">
          <Lock size={12} className="text-[#c27847]" />
          <span>مكالمة Pro Chats مشفرة تماماً</span>
        </div>
        <h2 className="text-2xl font-bold">{callData.contact.name}</h2>
        <p className="text-sm text-[#e29968] font-medium">
          {callStatus === 'ringing' 
            ? callData.type === 'video' ? 'جاري الاتصال بمكالمة فيديو...' : 'جاري الاتصال...' 
            : formatDuration(duration)}
        </p>
      </div>

      {/* Center Avatar / Video Area */}
      <div className="flex-1 flex flex-col items-center justify-center my-8">
        {callData.type === 'video' && isVideoOn && callStatus === 'connected' ? (
          <div className="relative w-full h-72 rounded-3xl overflow-hidden bg-black/80 border border-white/10 shadow-2xl flex items-center justify-center">
            <img
              src={callData.contact.avatar}
              alt={callData.contact.name}
              className="w-full h-full object-cover"
            />
            {/* Self floating preview */}
            <div className="absolute bottom-3 right-3 w-20 h-28 rounded-xl bg-stone-900 border-2 border-white/20 overflow-hidden shadow-lg">
              <div className="w-full h-full bg-[#4a2e20] flex items-center justify-center text-[10px] text-white/70">
                أنت
              </div>
            </div>
          </div>
        ) : (
          <div className="relative flex items-center justify-center">
            {/* Animated Pulse Rings */}
            {callStatus === 'ringing' && (
              <>
                <div className="absolute w-44 h-44 rounded-full bg-[#a56a4c]/25 animate-ping" />
                <div className="absolute w-36 h-36 rounded-full bg-[#a56a4c]/35" />
              </>
            )}
            <img
              src={callData.contact.avatar}
              alt={callData.contact.name}
              className="w-28 h-28 rounded-full object-cover ring-4 ring-[#a56a4c] shadow-2xl relative z-10"
            />
          </div>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div className="p-4 bg-[#2c201a]/95 backdrop-blur-md rounded-3xl flex items-center justify-around mb-2 border border-[#443026]">
        {/* Speaker Toggle */}
        <button
          onClick={() => setIsSpeakerOn(!isSpeakerOn)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            isSpeakerOn ? 'bg-white/20 text-white' : 'bg-white/10 text-gray-400'
          }`}
          title="مكبر الصوت"
        >
          {isSpeakerOn ? <Volume2 size={22} /> : <VolumeX size={22} />}
        </button>

        {/* Video Toggle */}
        <button
          onClick={() => setIsVideoOn(!isVideoOn)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            isVideoOn ? 'bg-white/20 text-white' : 'bg-white/10 text-gray-400'
          }`}
          title="الكاميرا"
        >
          {isVideoOn ? <Video size={22} /> : <VideoOff size={22} />}
        </button>

        {/* Mute Mic Toggle */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            isMuted ? 'bg-red-500 text-white' : 'bg-white/20 text-white'
          }`}
          title="كتم الصوت"
        >
          {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>

        {/* End Call Button */}
        <button
          onClick={handleEndCall}
          className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 text-white flex items-center justify-center shadow-lg transition-transform"
          title="إنهاء المكالمة"
        >
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
}
