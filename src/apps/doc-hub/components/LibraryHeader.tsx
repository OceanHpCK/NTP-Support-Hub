import React from 'react';
import { Search, Filter, BookOpen } from 'lucide-react';
import { Document } from '../data';

interface LibraryHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: 'all' | 'testing' | 'installation';
  setSelectedCategory: (cat: 'all' | 'testing' | 'installation') => void;
  selectedPipeType: 'all' | Document['pipeType'];
  setSelectedPipeType: (type: 'all' | Document['pipeType']) => void;
}

const LibraryHeader: React.FC<LibraryHeaderProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedPipeType,
  setSelectedPipeType
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Title Area */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Thư viện kỹ thuật</h1>
              <p className="text-sm text-slate-500">Tra cứu hướng dẫn lắp đặt và thử nghiệm ống Nhựa Tiền Phong</p>
            </div>
          </div>

          {/* Search & Meta */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text"
              placeholder="Tìm kiếm tài liệu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-700"
            />
          </div>
        </div>

        {/* Filters bar */}
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mr-2">
            <Filter className="w-4 h-4" />
            Bộ lọc:
          </div>

          {/* Category Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-lg">
            {(['all', 'testing', 'installation'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                  selectedCategory === cat 
                    ? 'bg-white text-indigo-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {cat === 'all' ? 'Tất cả' : cat === 'testing' ? 'Thử áp/Thử kín' : 'Hướng dẫn lắp đặt'}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block" />

          {/* Pipe Type Select */}
          <select 
            value={selectedPipeType}
            onChange={(e) => setSelectedPipeType(e.target.value as any)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
          >
            <option value="all">Mọi loại ống</option>
            <option value="HDPE">Ống HDPE</option>
            <option value="PPR">Ống PP-R</option>
            <option value="PVCU">Ống PVC-U</option>
            <option value="CORRUGATED">Ống gân sóng</option>
          </select>
        </div>
      </div>
    </header>
  );
};

export default LibraryHeader;
