import React, { useState, useMemo } from 'react';
import { DOCUMENTS, Document } from './data';
import LibraryHeader from './components/LibraryHeader';
import DocCard from './components/DocCard';
import PdfViewer from './components/PdfViewer';

const App: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'testing' | 'installation'>('all');
  const [selectedPipeType, setSelectedPipeType] = useState<'all' | Document['pipeType']>('all');
  const [activeDoc, setActiveDoc] = useState<Document | null>(null);

  const filteredDocs = useMemo(() => {
    return DOCUMENTS.filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
      const matchesPipeType = selectedPipeType === 'all' || doc.pipeType === selectedPipeType;
      return matchesSearch && matchesCategory && matchesPipeType;
    });
  }, [searchQuery, selectedCategory, selectedPipeType]);

  return (
    <div className="min-h-full bg-slate-50 flex flex-col">
      <LibraryHeader 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedPipeType={selectedPipeType}
        setSelectedPipeType={setSelectedPipeType}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {filteredDocs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocs.map(doc => (
              <DocCard 
                key={doc.id} 
                doc={doc} 
                onView={() => setActiveDoc(doc)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 max-w-md mx-auto">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-800">Không tìm thấy tài liệu</h3>
              <p className="text-sm text-slate-500 mt-2">Vui lòng thử lại với từ khóa hoặc bộ lọc khác.</p>
              <button 
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setSelectedPipeType('all'); }}
                className="mt-6 text-blue-600 font-semibold text-sm hover:underline"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          </div>
        )}
      </main>

      {/* PDF Viewer Overlay */}
      {activeDoc && (
        <PdfViewer 
          doc={activeDoc} 
          onClose={() => setActiveDoc(null)} 
        />
      )}
    </div>
  );
};

export default App;
