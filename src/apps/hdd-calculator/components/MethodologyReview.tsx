import React from 'react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const MethodologyReview: React.FC<Props> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-[70] flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-3xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-scale-up border border-gray-100">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur rounded-t-2xl z-20 shadow-sm">
                    <div className="flex items-center space-x-4">
                        <div className="bg-gradient-to-br from-indigo-600 to-blue-500 p-3 rounded-xl text-white shadow-lg">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Thuyết minh Phương pháp Tính toán</h2>
                            <p className="text-sm text-indigo-600 font-medium">Tiêu chuẩn ASTM F1962 (Simplified Method)</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-all duration-200"
                    >
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto space-y-10 bg-gray-50/50">

                    {/* 1. Overview */}
                    <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                            <span className="bg-indigo-100 text-indigo-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">1</span>
                            Tổng quan
                        </h3>
                        <p className="text-gray-600 text-lg leading-relaxed">
                            Ứng dụng này sử dụng <strong>Mô hình Đơn giản hóa (Simplified Model)</strong> theo tiêu chuẩn ASTM F1962.
                            Mục tiêu là ước tính lực kéo thi công (Pulling Load) cần thiết để kéo ống nhựa HDPE qua lỗ khoan ngầm chứa dung dịch khoan Bentonite,
                            đồng thời kiểm tra các điều kiện bền của ống.
                        </p>
                    </section>

                    {/* 2. Segments */}
                    <section>
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center px-2">
                            <span className="bg-indigo-100 text-indigo-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">2</span>
                            Phân tích Lực kéo theo Đoạn (Pulling Segments)
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Segment A */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <span className="text-6xl font-black">A</span>
                                </div>
                                <h4 className="text-lg font-bold text-blue-600 mb-2">Đoạn A: Trên mặt đất (Surface)</h4>
                                <p className="text-gray-500 mb-4 text-sm">Ống nằm trên mặt đất hoặc con lăn dẫn hướng, chịu lực ma sát trượt.</p>
                                <div className="bg-slate-50 p-4 rounded-lg font-mono text-sm text-slate-700 border-l-4 border-blue-500">
                                    T_A = W_pipe × L_surface × μ_surface
                                </div>
                            </div>

                            {/* Segment B */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <span className="text-6xl font-black">B</span>
                                </div>
                                <h4 className="text-lg font-bold text-orange-600 mb-2">Đoạn B: Cung nhập (Entry Arc)</h4>
                                <p className="text-gray-500 mb-4 text-sm">Ống uốn cong đi xuống. Ma sát tăng theo cấp số nhân do hiệu ứng Capstan.</p>
                                <div className="bg-slate-50 p-4 rounded-lg font-mono text-sm text-slate-700 border-l-4 border-orange-500">
                                    T_B = (T_A + Friction) × e^(μ × α)
                                </div>
                            </div>

                            {/* Segment C */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <span className="text-6xl font-black">C</span>
                                </div>
                                <h4 className="text-lg font-bold text-green-600 mb-2">Đoạn C: Đáy phẳng (Bottom)</h4>
                                <p className="text-gray-500 mb-4 text-sm">Đoạn dài nhất. Lực đẩy nổi khiến ống cọ sát vào trần huyệt đạo.</p>
                                <div className="bg-slate-50 p-4 rounded-lg font-mono text-sm text-slate-700 border-l-4 border-green-500">
                                    T_C = T_B + |Net_Buoyancy| × L_B × μ_soil
                                </div>
                            </div>

                            {/* Segment D */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <span className="text-6xl font-black">D</span>
                                </div>
                                <h4 className="text-lg font-bold text-red-600 mb-2">Đoạn D: Cung xuất (Exit Arc)</h4>
                                <p className="text-gray-500 mb-4 text-sm">Ống uốn cong đi lên về phía máy khoan. Hiệu ứng Capstan lần 2.</p>
                                <div className="bg-slate-50 p-4 rounded-lg font-mono text-sm text-slate-700 border-l-4 border-red-500">
                                    T_D = (T_C + Friction) × e^(μ × α)
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 3. Physics */}
                    <section className="bg-white p-8 rounded-2xl shadow-md border-t-4 border-indigo-500">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                            <span className="bg-indigo-100 text-indigo-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">3</span>
                            Cơ chế Vật lý
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h4 className="font-bold text-gray-800 text-lg mb-2">💧 Lực đẩy nổi (Net Buoyancy)</h4>
                                <p className="text-gray-600 mb-4 font-light">
                                    Khác với ống thép (chìm), ống HDPE thường <strong>nhẹ hơn</strong> dung dịch khoan nên sẽ <strong>NỔI</strong> lên trên.
                                    Lực ma sát sinh ra do ống ép lên thành trên của lỗ khoan.
                                </p>
                                <div className="bg-blue-50 p-4 rounded border border-blue-100 font-mono text-sm">
                                    F_buoy = V_pipe × Mud_Density<br />
                                    Net_Weight = Weight_Air - F_buoy
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold text-gray-800 text-lg mb-2">🌀 Hiệu ứng Capstan (Tời quấn)</h4>
                                <p className="text-gray-600 mb-4 font-light">
                                    Lực căng dây tăng theo hàm mũ khi quấn quanh một vật trụ. Trong HDD, đất hoạt động như một cái tời khổng lồ tại các đoạn cong.
                                </p>
                                <div className="bg-yellow-50 p-4 rounded border border-yellow-100 font-mono text-sm">
                                    Factor = e^(μ × Góc_uốn_radian)
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 4. Safety Factors */}
                    <section className="bg-slate-800 text-white p-8 rounded-2xl shadow-lg">
                        <div className="flex items-center mb-6">
                            <div className="bg-yellow-500/20 p-3 rounded-xl mr-4">
                                <svg className="w-8 h-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Hệ số an toàn (Safety Factors)</h3>
                                <p className="text-slate-400 text-sm">Tại sao khuyến cáo SF {'>'} 1.5?</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-slate-700 pb-8 mb-8">
                            <div>
                                <h4 className="text-yellow-400 font-bold mb-2 text-lg">1. Ứng suất kéo (Tensile)</h4>
                                <p className="text-slate-300 text-sm mb-3">Kiểm tra khả năng chịu lực kéo dọc trục của ống.</p>
                                <div className="bg-slate-700/50 p-3 rounded border border-slate-600 font-mono text-center text-lg font-bold text-white">
                                    SF_t = Yield / Stress
                                </div>
                            </div>
                            <div>
                                <h4 className="text-yellow-400 font-bold mb-2 text-lg">2. Áp suất móp (Collapse)</h4>
                                <p className="text-slate-300 text-sm mb-3">Kiểm tra khả năng chịu áp suất thủy tĩnh của dung dịch khoan (tránh bẹp ống).</p>
                                <div className="bg-slate-700/50 p-3 rounded border border-slate-600 font-mono text-center text-lg font-bold text-white">
                                    SF_c = P_crit / P_mud
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-bold text-white text-lg border-l-4 border-red-500 pl-3">Tại sao cần SF {'>'} 1.5 - 2.0?</h4>
                            <ul className="space-y-3 text-slate-300 text-sm leading-relaxed">
                                <li className="flex items-start">
                                    <span className="text-red-400 mr-2 mt-1">•</span>
                                    <span>
                                        <strong>Rủi ro thi công (Construction Risks):</strong> Lực kéo thực tế thường lớn hơn tính toán lý thuyết do sạt lở cục bộ, đá ngầm hoặc ma sát tăng đột biến.
                                    </span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-red-400 mr-2 mt-1">•</span>
                                    <span>
                                        <strong>Xước bề mặt (Surface Scratches):</strong> Ống HDPE bị kéo trượt trong lòng đất sẽ bị xước, làm giảm độ dày thành ống chịu lực (từ 10% - 20%).
                                    </span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-red-400 mr-2 mt-1">•</span>
                                    <span>
                                        <strong>Mỏi vật liệu (Creep & Fatigue):</strong> Nhựa HDPE chịu tải trọng lâu dài hoặc nhiệt độ cao sẽ bị giảm độ bền (hiện tượng rão/mỏi). Hệ số an toàn giúp bù đắp sự suy giảm này.
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all transform hover:scale-105 active:scale-95 text-lg"
                    >
                        Đã hiểu
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MethodologyReview;
