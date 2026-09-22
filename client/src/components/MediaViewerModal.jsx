import React, { useState } from 'react';
import { X, Download, ZoomIn, ZoomOut, Share2, Play, ArrowRight } from 'lucide-react';

export default function MediaViewerModal({ media, onClose }) {
  const [zoomLevel, setZoomLevel] = useState(1);

  if (!media) return null;

  // Download media helper
  const handleDownload = (e) => {
    e?.stopPropagation();
    try {
      const link = document.createElement('a');
      link.href = media.url;
      const isVideo = media.type === 'video' || media.url?.includes('video') || media.url?.includes('.mp4');
      const ext = isVideo ? 'mp4' : 'jpg';
      link.download = `ProChats_${Date.now()}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.warn('Download error:', err);
      // Fallback
      window.open(media.url, '_blank');
    }
  };

  const handleZoomIn = (e) => {
    e.stopPropagation();
    setZoomLevel((prev) => Math.min(prev + 0.3, 2.5));
  };

  const handleZoomOut = (e) => {
    e.stopPropagation();
    setZoomLevel((prev) => Math.max(prev - 0.3, 0.7));
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between text-white select-none animate-fadeIn">
      {/* Top Controls Bar */}
      <header className="p-3 px-4 bg-black/50 backdrop-blur-sm flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 active:scale-95 transition-transform"
            title="إغلاق"
          >
            <ArrowRight size={22} className="rotate-180" />
          </button>

          <div className="text-right">
            <h4 className="text-sm font-bold text-white">
              {media.senderName || 'الوسائط'}
            </h4>
            <span className="text-[11px] text-gray-300">
              {media.timestamp || 'اليوم'}
            </span>
          </div>
        </div>

        {/* Action Buttons: Download, Zoom, Close */}
        <div className="flex items-center gap-2">
          {media.type === 'image' && (
            <>
              <button
                onClick={handleZoomIn}
                className="p-2 rounded-full hover:bg-white/10 text-gray-200 hover:text-white transition-colors"
                title="تكبير الصورة"
              >
                <ZoomIn size={19} />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-2 rounded-full hover:bg-white/10 text-gray-200 hover:text-white transition-colors"
                title="تصغير الصورة"
              >
                <ZoomOut size={19} />
              </button>
            </>
          )}

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#a56a4c] hover:bg-[#915738] active:scale-95 text-white text-xs font-bold shadow-lg transition-all"
            title="تحميل إلى جهازك"
          >
            <Download size={15} />
            <span>تحميل</span>
          </button>
        </div>
      </header>

      {/* Media Center Viewport */}
      <div
        className="relative flex-1 flex items-center justify-center p-4 overflow-hidden"
        onClick={() => setZoomLevel(1)}
      >
        {media.type === 'video' ? (
          <div className="w-full max-w-2xl max-h-[75vh] flex items-center justify-center">
            <video
              src={media.url}
              controls
              autoPlay
              playsInline
              className="max-h-[75vh] max-w-full rounded-2xl shadow-2xl object-contain"
            />
          </div>
        ) : (
          <div className="relative flex items-center justify-center w-full h-full">
            <img
              src={media.url}
              alt="عرض الوسائط"
              style={{ transform: `scale(${zoomLevel})` }}
              className="max-h-[75vh] max-w-full rounded-2xl object-contain shadow-2xl transition-transform duration-200 cursor-zoom-in"
              onClick={(e) => {
                e.stopPropagation();
                setZoomLevel((z) => (z > 1 ? 1 : 1.6));
              }}
            />
          </div>
        )}
      </div>

      {/* Bottom Bar: Caption & Quick Download */}
      <footer className="p-3 px-4 bg-black/60 backdrop-blur-sm flex flex-col gap-2 z-20 text-center">
        {media.caption && (
          <p className="text-sm text-gray-200 max-w-md mx-auto leading-relaxed">
            {media.caption}
          </p>
        )}

        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#a56a4c] hover:bg-[#915738] active:scale-95 text-white text-xs font-bold shadow-md transition-all"
          >
            <Download size={16} />
            <span>حفظ {media.type === 'video' ? 'الفيديو' : 'الصورة'} على الجهاز</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
