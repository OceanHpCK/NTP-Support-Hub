import React, { forwardRef } from 'react';
import { PipeParams, CalculationResults } from '../lib/calculations';
import { VisualSimulation } from './VisualSimulation';

interface PrintableReportProps {
  params: PipeParams;
  results: CalculationResults;
  projectName: string;
}

export const PrintableReport = forwardRef<HTMLDivElement, PrintableReportProps>(
  ({ params, results, projectName }, ref) => {
    const today = new Date().toLocaleDateString('vi-VN');

    return (
      <div ref={ref} className="p-10 bg-white text-black font-sans w-full h-full text-sm">
        <div className="border-b-2 border-slate-800 pb-4 mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Báo Cáo Tính Toán Đánh Chìm Ống HDPE</h1>
            <p className="text-slate-600 mt-1 text-base">Dự án: {projectName || 'Không tên'}</p>
          </div>
          <div className="text-right text-slate-500">
            <p>Ngày lập: {today}</p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-3 border-b border-slate-200 pb-1">1. Thông Số Đầu Vào (Input Parameters)</h2>
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-slate-50 p-2 rounded">
              <span className="text-slate-500 text-[10px] block">Đường kính ngoài (D)</span>
              <span className="font-medium">{params.outerDiameter} mm</span>
            </div>
            <div className="bg-slate-50 p-2 rounded">
              <span className="text-slate-500 text-[10px] block">SDR</span>
              <span className="font-medium">{params.sdr}</span>
            </div>
            <div className="bg-slate-50 p-2 rounded">
              <span className="text-slate-500 text-[10px] block">Vật liệu</span>
              <span className="font-medium">{params.material}</span>
            </div>
            <div className="bg-slate-50 p-2 rounded">
              <span className="text-slate-500 text-[10px] block">Độ sâu tối đa (H)</span>
              <span className="font-medium">{params.maxDepth} m</span>
            </div>
            <div className="bg-slate-50 p-2 rounded">
              <span className="text-slate-500 text-[10px] block">Tỷ lệ điền đầy khí (aa)</span>
              <span className="font-medium">{params.airFillingRate} %</span>
            </div>
            <div className="bg-slate-50 p-2 rounded">
              <span className="text-slate-500 text-[10px] block">Vận tốc dòng chảy (v)</span>
              <span className="font-medium">{params.vCurrent} m/s</span>
            </div>
            <div className="bg-slate-50 p-2 rounded">
              <span className="text-slate-500 text-[10px] block">Mật độ nước (ρw)</span>
              <span className="font-medium">{params.waterDensity} kg/m³</span>
            </div>
            <div className="bg-slate-50 p-2 rounded">
              <span className="text-slate-500 text-[10px] block">Mật độ bê tông (ρc)</span>
              <span className="font-medium">{params.concreteDensity} kg/m³</span>
            </div>
            <div className="bg-slate-50 p-2 rounded">
              <span className="text-slate-500 text-[10px] block">Mật độ PE (ρPE)</span>
              <span className="font-medium">{params.peDensity} kg/m³</span>
            </div>
            <div className="bg-slate-50 p-2 rounded">
              <span className="text-slate-500 text-[10px] block">Khoảng cách quả tải (Lc)</span>
              <span className="font-medium">{params.weightSpacing} m</span>
            </div>
            <div className="bg-slate-50 p-2 rounded">
              <span className="text-slate-500 text-[10px] block">Hệ số ma sát (μ)</span>
              <span className="font-medium">{params.frictionCoeff}</span>
            </div>
            <div className="bg-slate-50 p-2 rounded">
              <span className="text-slate-500 text-[10px] block">Hệ số cản (C_D) / nâng (C_L)</span>
              <span className="font-medium">{params.cD} / {params.cL}</span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-3 border-b border-slate-200 pb-1">2. Tính Toán Thi Công Đánh Chìm (Sinking Calculation)</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-medium text-slate-700 mb-1">2.1. Kích thước & Lực đơn vị</h3>
              <table className="w-full text-left border-collapse">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-1 text-slate-600 w-2/3">Độ dày thành ống (s) / Đường kính trong (d)</td>
                    <td className="py-1 font-medium">{results.wallThickness.toFixed(2)} mm / {results.innerDiameter.toFixed(2)} mm</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1 text-slate-600">Bán kính uốn cong tối thiểu (R_min)</td>
                    <td className="py-1 font-medium">{results.minBendingRadius.toFixed(2)} m</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1 text-slate-600">w1 (Trọng lượng chìm tịnh đoạn chứa nước)</td>
                    <td className="py-1 font-medium">{results.w1.toFixed(2)} N/m</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1 text-slate-600">w2 (Lực nổi tịnh đoạn chứa khí)</td>
                    <td className="py-1 font-medium">{results.w2.toFixed(2)} N/m</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <h3 className="text-base font-medium text-slate-700 mb-1">2.2. Tính toán quả tải bê tông (Concrete Weights)</h3>
              <table className="w-full text-left border-collapse">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-1 text-slate-600 w-2/3">Trọng lượng ống trong không khí / trong nước</td>
                    <td className="py-1 font-medium">{results.pipeWeightAir.toFixed(2)} N/m / {results.pipeWeightSub.toFixed(2)} N/m</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1 text-slate-600">Quả tải yêu cầu (trong nước / trong không khí)</td>
                    <td className="py-1 font-medium">{results.concreteWeightSubRequired.toFixed(2)} N/m / {results.concreteWeightAirRequired.toFixed(2)} N/m</td>
                  </tr>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <td className="py-1 text-slate-800 font-medium pl-2">Trọng lượng mỗi quả tải (trong không khí)</td>
                    <td className="py-1 font-bold text-indigo-700">{results.concreteWeightPerBlockAir.toFixed(2)} kN</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <h3 className="text-base font-medium text-slate-700 mb-1">2.3. Lực & Áp suất thi công</h3>
              <table className="w-full text-left border-collapse">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-1 text-slate-600 w-2/3">Lực kéo yêu cầu (P)</td>
                    <td className="py-1 font-bold text-indigo-700">{results.pullingForce.toFixed(2)} kN</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1 text-slate-600">Lực căng tối đa (T)</td>
                    <td className="py-1 font-medium">{results.maxTensionForce.toFixed(2)} kN</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1 text-slate-600">Áp suất không khí bên trong (p)</td>
                    <td className="py-1 font-bold text-indigo-700">{results.internalPressureBar.toFixed(2)} bar</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-3 border-b border-slate-200 pb-1">3. Kiểm Tra Ổn Định và Bền (Stability & Strength)</h2>
          <div className="space-y-4">
            <table className="w-full text-left border-collapse">
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-1 text-slate-600 w-2/3">Lực cản dòng chảy (F_D) / Lực nâng (F_L)</td>
                  <td className="py-1 font-medium">{results.fD.toFixed(2)} N/m / {results.fL.toFixed(2)} N/m</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-1 text-slate-600">Lực nén đáy (F_N)</td>
                  <td className="py-1 font-medium">{results.fN.toFixed(2)} N/m</td>
                </tr>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <td className="py-1 text-slate-800 font-medium pl-2">Hệ số an toàn trượt (SF_sliding)</td>
                  <td className={`py-1 font-bold ${results.sfSliding >= 1.1 ? 'text-emerald-600' : 'text-red-600'}`}>{results.sfSliding.toFixed(2)} {results.sfSliding >= 1.1 ? '(Đạt)' : '(Không đạt)'}</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-1 text-slate-600">Áp suất tới hạn móp ống (P_buckling)</td>
                  <td className="py-1 font-medium">{results.pBucklingBar.toFixed(2)} bar</td>
                </tr>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <td className="py-1 text-slate-800 font-medium pl-2">Hệ số an toàn móp ống (SF_buckling)</td>
                  <td className={`py-1 font-bold ${results.sfBuckling >= 2.0 ? 'text-emerald-600' : 'text-red-600'}`}>{results.sfBuckling.toFixed(2)} {results.sfBuckling >= 2.0 ? '(Đạt)' : '(Không đạt)'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-3 border-b border-slate-200 pb-1">4. Phương Án Thi Công Đánh Chìm (Sinking Procedure)</h2>
          <div className="space-y-3 text-slate-700 text-justify">
            <div>
              <h4 className="font-semibold">Giai đoạn 1: Chuẩn bị & Tổ hợp ống</h4>
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li>Hàn nối các ống PE thành từng đoạn dài (thường từ 400m - 600m) trên bờ hoặc khu vực khuất sóng gió.</li>
                <li>Lắp đặt các khối gia tải (quả tải bê tông) vào ống theo khoảng cách đã tính toán ({params.weightSpacing}m). Sử dụng đệm cao su (EPDM) giữa ống và khối bê tông để tránh xước và tăng ma sát.</li>
                <li>Lắp mặt bích mù (blind flange) ở hai đầu đoạn ống. Đầu ngoài cùng lắp thêm hệ thống van xả khí, van cấp nước và kết nối với máy nén khí.</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">Giai đoạn 2: Lai dắt & Định vị</h4>
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li>Bơm khí vào ống để ống nổi hoàn toàn trên mặt nước.</li>
                <li>Dùng tàu kéo (tugboat) lai dắt đoạn ống ra vị trí lắp đặt. Tuyến ống phải được đánh dấu sẵn bằng phao.</li>
                <li>Kết nối đầu trong của ống với hố ga/mặt bích chờ sẵn trên bờ.</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">Giai đoạn 3: Quá trình đánh chìm (Sinking)</h4>
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li>Tác dụng lực kéo (P = {results.pullingForce.toFixed(1)} kN) liên tục ở đầu ngoài cùng của ống bằng tàu kéo để duy trì bán kính uốn cong (R &gt; {results.minBendingRadius.toFixed(1)} m), tránh gập gãy ống.</li>
                <li>Bơm áp suất khí bên trong (p = {results.internalPressureBar.toFixed(2)} bar) tương ứng với độ sâu để cân bằng lực, tránh ống chìm quá nhanh.</li>
                <li>Mở van xả khí từ từ ở đầu ngoài, đồng thời cho nước đi vào từ đầu trong.</li>
                <li>Kiểm soát quá trình đánh chìm tạo thành hình chữ S (S-bend) từ mặt nước xuống đáy.</li>
                <li><span className="font-medium text-red-600">Lưu ý:</span> Quá trình đánh chìm phải diễn ra liên tục. Nếu phải dừng, cần bơm khí ngược lại trong vòng 15 phút để ống nổi lên, tránh mỏi vật liệu.</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">Giai đoạn 4: Tiếp đáy & Hoàn thiện</h4>
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li>Khi đoạn ống cuối cùng chạm đáy, giảm dần lực kéo (P) về 0.</li>
                <li>Thợ lặn tháo mặt bích mù và hệ thống van.</li>
                <li>Tiến hành lấp hào (nếu có) hoặc cố định các vị trí cần thiết.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mb-4 break-before-page">
          <h2 className="text-lg font-semibold text-slate-800 mb-3 border-b border-slate-200 pb-1">5. Mô Phỏng Hình Ảnh (Visual Simulation)</h2>
          <div className="scale-90 origin-top">
            <VisualSimulation params={params} results={results} />
          </div>
        </div>

      </div>
    );
  }
);

PrintableReport.displayName = 'PrintableReport';
