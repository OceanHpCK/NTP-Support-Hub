import React from 'react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const MiniHDDReference: React.FC<Props> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-[70] flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-3xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-scale-up border border-gray-100">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur rounded-t-2xl z-20 shadow-sm">
                    <div className="flex items-center space-x-4">
                        <div className="bg-gradient-to-br from-indigo-700 to-blue-600 p-3 rounded-xl text-white shadow-lg">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Mini-HDD Guidelines (MAB-7)</h2>
                            <p className="text-sm text-indigo-600 font-medium">Placement of HDPE Pipe in Municipal Applications</p>
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
                <div className="p-8 overflow-y-auto space-y-8 bg-gray-50/50">

                    {/* 1. Scope and Definition */}
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <span className="bg-indigo-100 text-indigo-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">1</span>
                            Phạm vi & Định nghĩa (Scope & Definition)
                        </h3>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            Theo tài liệu <strong>MAB-7 Guidelines (PPI)</strong>, Mini-HDD được định nghĩa với các đặc điểm sau:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <p className="text-sm text-slate-500 uppercase font-bold tracking-wider mb-1">Chiều dài khoan</p>
                                <p className="text-xl font-bold text-indigo-700">{'< 600 ft'}</p>
                                <p className="text-xs text-slate-400">({'< 180 m'})</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <p className="text-sm text-slate-500 uppercase font-bold tracking-wider mb-1">Độ sâu lắp đặt</p>
                                <p className="text-xl font-bold text-indigo-700">{'< 15 ft'}</p>
                                <p className="text-xs text-slate-400">({'< 4.5 m'})</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <p className="text-sm text-slate-500 uppercase font-bold tracking-wider mb-1">Đường kính ống</p>
                                <p className="text-xl font-bold text-indigo-700">{'< 12 inch'}</p>
                                <p className="text-xs text-slate-400">({'< 315 mm'})</p>
                            </div>
                        </div>
                        <p className="mt-4 text-sm text-gray-500 italic">
                            *Contrast: Maxi-HDD machines may weigh {'>'} 30 tons and place pipes {'>'} 48 in diameter at depths {'>'} 200 ft.
                        </p>
                    </section>

                    {/* 2. Simplified Tension Formula */}
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <span className="bg-indigo-100 text-indigo-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">2</span>
                            Công thức tính lực kéo nhanh (Simplified Method)
                        </h3>
                        <p className="text-gray-600 mb-4">
                            MAB-7 cung cấp công thức ước tính lực kéo nhanh cho ống HDPE (PE4710), giả sử hệ số ma sát đất là 0.3.
                        </p>

                        <div className="bg-slate-800 text-white p-6 rounded-xl font-mono text-center mb-6 shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
                            <p className="text-lg sm:text-2xl font-bold tracking-wider">
                                Tension (lb) = [ L × w_b × (1/3) ] × (1.6)ⁿ
                            </p>
                            <p className="mt-2 text-xs text-slate-400">
                                (Formula from MAB-7, Page 12)
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                            <div>
                                <h4 className="font-bold text-gray-800 mb-2">Trong đó:</h4>
                                <ul className="list-disc pl-5 space-y-1 text-gray-600">
                                    <li><strong>L</strong>: Chiều dài khoan (ft)</li>
                                    <li><strong>w_b</strong>: Trọng lượng nổi của ống (buoyant weight) (lb/ft)</li>
                                    <li><strong>n</strong>: Số lượng góc uốn 90 độ hiệu dụng (effective 90-degree bends)</li>
                                </ul>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <h4 className="font-bold text-blue-800 mb-2">Tính toán số góc cong n:</h4>
                                <p className="font-mono text-blue-700 mb-2">n = n₁ + n₂</p>
                                <ul className="text-blue-600 space-y-1 text-xs">
                                    <li>• n₁: Số góc cong 90 độ theo thiết kế.</li>
                                    <li>• n₂: Số góc cong do điều chỉnh hướng khoan (steering).</li>
                                    <li>• Guideline: <strong>n₂ = [Length (ft) / 500 ft] × [2 in. / Rod Diam (in.)]</strong></li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* 3. Table 1: Safe Pull Tension */}
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center">
                            <span className="bg-indigo-100 text-indigo-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">3</span>
                            Bảng tra Lực kéo An toàn (Safe Pull Tension)
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Lực kéo tối đa cho phép (lbs) đối với ống HDPE PE4710 (1-Hour Duration).
                        </p>

                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-800 text-white">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-bold uppercase tracking-wider sticky left-0 bg-gray-800">Nominal Size (IPS)</th>
                                        <th className="px-4 py-3 text-center font-bold uppercase tracking-wider">DR 7</th>
                                        <th className="px-4 py-3 text-center font-bold uppercase tracking-wider">DR 9</th>
                                        <th className="px-4 py-3 text-center font-bold uppercase tracking-wider bg-indigo-900">DR 11</th>
                                        <th className="px-4 py-3 text-center font-bold uppercase tracking-wider">DR 13.5</th>
                                        <th className="px-4 py-3 text-center font-bold uppercase tracking-wider">DR 17</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {/* Data from Table 1 in Image 3 */}
                                    <tr className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-bold text-gray-900 sticky left-0 bg-white">2 in.</td>
                                        <td className="px-4 py-3 text-center font-mono">3,038</td>
                                        <td className="px-4 py-3 text-center font-mono">2,450</td>
                                        <td className="px-4 py-3 text-center font-mono font-bold text-indigo-700 bg-indigo-50">--</td>
                                        <td className="px-4 py-3 text-center font-mono">--</td>
                                        <td className="px-4 py-3 text-center font-mono">--</td>
                                    </tr>
                                    <tr className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-bold text-gray-900 sticky left-0 bg-white">3 in.</td>
                                        <td className="px-4 py-3 text-center font-mono">6,597</td>
                                        <td className="px-4 py-3 text-center font-mono">5,321</td>
                                        <td className="px-4 py-3 text-center font-mono font-bold text-indigo-700 bg-indigo-50">--</td>
                                        <td className="px-4 py-3 text-center font-mono">--</td>
                                        <td className="px-4 py-3 text-center font-mono">--</td>
                                    </tr>
                                    <tr className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-bold text-gray-900 sticky left-0 bg-white">4 in.</td>
                                        <td className="px-4 py-3 text-center font-mono">10,906</td>
                                        <td className="px-4 py-3 text-center font-mono">8,796</td>
                                        <td className="px-4 py-3 text-center font-mono font-bold text-indigo-700 bg-indigo-50">7,361</td>
                                        <td className="px-4 py-3 text-center font-mono">6,109</td>
                                        <td className="px-4 py-3 text-center font-mono">4,931</td>
                                    </tr>
                                    <tr className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-bold text-gray-900 sticky left-0 bg-white">6 in.</td>
                                        <td className="px-4 py-3 text-center font-mono">23,638</td>
                                        <td className="px-4 py-3 text-center font-mono">19,066</td>
                                        <td className="px-4 py-3 text-center font-mono font-bold text-indigo-700 bg-indigo-50">15,954</td>
                                        <td className="px-4 py-3 text-center font-mono">13,240</td>
                                        <td className="px-4 py-3 text-center font-mono">10,687</td>
                                    </tr>
                                    <tr className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-bold text-gray-900 sticky left-0 bg-white">8 in.</td>
                                        <td className="px-4 py-3 text-center font-mono">40,064</td>
                                        <td className="px-4 py-3 text-center font-mono">32,315</td>
                                        <td className="px-4 py-3 text-center font-mono font-bold text-indigo-700 bg-indigo-50">27,040</td>
                                        <td className="px-4 py-3 text-center font-mono">22,441</td>
                                        <td className="px-4 py-3 text-center font-mono">18,114</td>
                                    </tr>
                                    <tr className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-bold text-gray-900 sticky left-0 bg-white">10 in.</td>
                                        <td className="px-4 py-3 text-center font-mono">62,237</td>
                                        <td className="px-4 py-3 text-center font-mono">50,200</td>
                                        <td className="px-4 py-3 text-center font-mono font-bold text-indigo-700 bg-indigo-50">42,006</td>
                                        <td className="px-4 py-3 text-center font-mono">34,861</td>
                                        <td className="px-4 py-3 text-center font-mono">28,140</td>
                                    </tr>
                                    <tr className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-bold text-gray-900 sticky left-0 bg-white">12 in.</td>
                                        <td className="px-4 py-3 text-center font-mono">87,549</td>
                                        <td className="px-4 py-3 text-center font-mono">70,616</td>
                                        <td className="px-4 py-3 text-center font-mono font-bold text-indigo-700 bg-indigo-50">59,090</td>
                                        <td className="px-4 py-3 text-center font-mono">49,039</td>
                                        <td className="px-4 py-3 text-center font-mono">39,584</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p className="mt-2 text-xs text-gray-400">
                            Source: MAB-7 Guidelines, Table 1. Values are in pounds (lb).
                        </p>
                    </section>

                    {/* 4. Drill Rig Setup (Setback Distances) */}
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <span className="bg-indigo-100 text-indigo-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">4</span>
                            Khoảng cách đặt máy (Setback Distance)
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Khoảng cách tối thiểu từ máy khoan đến điểm nhập khoan (Entry Point) phụ thuộc vào bán kính cong của cần khoan để đạt được độ sâu mong muốn mà không làm hỏng cần.
                        </p>
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                            <p className="text-sm text-yellow-800">
                                <strong>Figure 5 Rule of Thumb:</strong> Với cần khoan dài 10ft và Bán kính cong 100ft:
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-yellow-700">
                                <li>Để đạt độ sâu 72 inches (6 ft) ở góc nhập 15°: Cần Setback ~35 ft.</li>
                                <li>Khoảng cách Setback càng dài thì càng dễ đạt độ sâu nông mà không gắt góc.</li>
                            </ul>
                        </div>
                    </section>

                    {/* Citations */}
                    <div className="text-xs text-gray-500 text-center pt-4 border-t border-gray-200">
                        <p><strong>Primary Reference:</strong> Slavin, Lawrence M. "Guidelines for Use of Mini-Horizontal Directional Drilling for Placement of High-Density Polyethylene Pipe for Water Applications" (MAB-7), Florida Water Resources Journal, October 2021.</p>
                        <p>Other references: ASTM F1962, CI/ASCE 38.</p>
                    </div>

                </div>
                <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all transform hover:scale-105 active:scale-95"
                    >
                        Đóng cửa sổ
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MiniHDDReference;
