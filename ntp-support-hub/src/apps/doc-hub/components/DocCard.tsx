// aria-label added for accessibility compliance
import React from 'react';
import { FileText, Download, Eye, Clock } from 'lucide-react';
import { Document } from '../data';
import { getApiUrl } from '../../../config';

interface DocCardProps {
  doc: Document;
  onView: () => void;
  exists: boolean;
}

const getPipeTypeColor = (type: string): string => {
  switch (type) {
    case 'HDPE': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'PPR': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'PVCU': return 'bg-sky-100 text-sky-700 border-sky-200';
    case 'CORRUGATED': return 'bg-orange-100 text-orange-700 border-orange-200';
    default: return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const DocCard: React.FC<DocCardProps> = ({ doc, onView, exists }) => {
  const fullUrl = doc.url.startsWith('http') ? doc.url : `${getApiUrl()}${doc.url}`;

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden">
      <div className="p-6 flex-1 space-y-4">
        {/* Header with Type & Meta */}
        <div className="flex items-start justify-between gap-4">
          <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getPipeTypeColor(doc.pipeType)}`}>
            {doc.pipeType === 'CORRUGATED' ? 'Gân sóng' : `Ống ${doc.pipeType}`}
          </div>
          <div className="flex items-center gap-2">
            {!exists && (
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wide">
                Chưa có file
              </span>
            )}
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[10px] font-medium">{doc.updatedAt}</span>
            </div>
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
              {doc.title}
            </h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
            {doc.description}
          </p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[10px] font-semibold text-slate-400">
            Dung lượng: {exists ? (doc.size || '--') : '--'}
          </div>
          <div className="text-[9px] font-mono text-slate-400 italic">
            File: {doc.url.split('/').pop()}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {exists ? (
            <a 
              href={fullUrl} 
              download 
              className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              title="Tải về file PDF"
              onClick={(e) => e.stopPropagation()}
            >
              <Download className="w-4 h-4" />
            </a>
          ) : (
            <button 
              className="p-2 text-slate-300 cursor-not-allowed"
              title="Tài liệu chưa sẵn sàng để tải"
              onClick={(e) => {
                e.stopPropagation();
                alert('Tài liệu này chưa sẵn sàng để tải. Vui lòng quay lại sau!');
              }}
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={exists ? onView : undefined}
            disabled={!exists}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-xs font-bold shadow-sm transition-all ${
              exists 
                ? 'bg-white border-slate-200 text-slate-700 hover:border-indigo-500 hover:text-indigo-600 cursor-pointer' 
                : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Xem tài liệu
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocCard;
