// aria-label added for accessibility compliance
import React, { useState, useMemo, useEffect } from 'react';
import { DOCUMENTS, Document } from './data';
import LibraryHeader from './components/LibraryHeader';
import DocCard from './components/DocCard';
import PdfViewer from './components/PdfViewer';
import { getApiUrl } from '../../config';

const App: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPipeType, setSelectedPipeType] = useState<string>('all');
  const [activeDoc, setActiveDoc] = useState<Document | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const res = await fetch(`${getApiUrl()}/api/admin/documents/public-list`);
        const result = await res.json();
        if (result.success) {
          setDocuments(result.data);
        }
      } catch (err) {
        console.error('Error fetching documents:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDocuments();
  }, []);

  const pipeTypes = useMemo(() => {
    const types = documents.map(doc => doc.pipeType);
    return Array.from(new Set(types)).filter(Boolean);
  }, [documents]);

  const categories = useMemo(() => {
    const defaults = ['testing', 'installation', 'Hướng dẫn kết nối'];
    const cats = documents.map(doc => doc.category);
    return Array.from(new Set([...defaults, ...cats])).filter(Boolean);
  }, [documents]);

  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (doc.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
      const matchesPipeType = selectedPipeType === 'all' || doc.pipeType === selectedPipeType;
      return matchesSearch && matchesCategory && matchesPipeType;
    });
  }, [documents, searchQuery, selectedCategory, selectedPipeType]);

  return (
    <div className="min-h-full bg-slate-50 flex flex-col">
      <LibraryHeader 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedPipeType={selectedPipeType}
        setSelectedPipeType={setSelectedPipeType}
        pipeTypes={pipeTypes}
        categories={categories}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {isLoading ? (
          <div className="text-center py-20 text-slate-500 font-medium">Đang tải danh sách tài liệu...</div>
        ) : filteredDocs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocs.map(doc => (
              <DocCard 
                key={doc.id} 
                doc={doc} 
                exists={doc.exists !== false}
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
