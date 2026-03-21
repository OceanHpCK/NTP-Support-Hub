import React, { useEffect } from 'react';
import { X, Download, Maximize2, Minimize2 } from 'lucide-react';
import { Document } from '../data';

interface PdfViewerProps {
  doc: Document;
  onClose: () => void;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ doc, onClose }) => {
  // Prevent scrolling on body when viewer is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/95 backdrop-blur-md animate-in fade-in duration-200">
      {/* Viewer Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-white/10 text-white">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-sm lg:text-base line-clamp-1">{doc.title}</h2>
            <p className="text-[10px] text-white/50 uppercase tracking-widest font-semibold">
              {doc.pipeType} • {doc.category === 'testing' ? 'Thử áp' : 'Lắp đặt'} • File: {doc.url.split('/').pop()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a 
            href={doc.url} 
            download 
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-all border border-white/5"
          >
            <Download className="w-4 h-4" />
            Tải PDF
          </a>
          <div className="h-8 w-px bg-white/10 mx-2" />
          <button 
            onClick={onClose}
            className="p-2 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Viewer Body */}
      <div className="flex-1 relative bg-slate-800 shadow-inner">
        <iframe
          src={`${doc.url}#toolbar=1&view=FitH`}
          className="w-full h-full border-none"
          title={doc.title}
        />
        
        {/* Placeholder if PDF doesn't load/exist in public folder yet */}
        <div className="absolute inset-0 -z-10 flex flex-col items-center justify-center text-white/20 p-8 text-center">
          <Download className="w-16 h-16 mb-4 animate-pulse" />
          <h3 className="text-xl font-bold">Đang tải tài liệu PDF...</h3>
          <p className="max-w-xs mt-2 text-sm">
            Nếu tài liệu không hiển thị, vui lòng nhấn nút "Tải PDF" ở góc trên bên phải.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PdfViewer;
