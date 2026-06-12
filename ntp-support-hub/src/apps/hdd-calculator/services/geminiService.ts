import { GoogleGenAI } from "@google/genai";
import { PipeParams, BorePathParams, CalculationResult, CrossingType, SoilType } from '../types';
import { getApiUrl } from '../../../config';

const buildPrompt = (pipe: PipeParams, path: BorePathParams, result: CalculationResult): string => {
  // Map enum to Vietnamese for better prompting
  const crossingMap = {
    [CrossingType.Standard]: "Thông thường",
    [CrossingType.River]: "Vượt sông/kênh (River Crossing)",
    [CrossingType.Road]: "Vượt đường giao thông (Road Crossing)"
  };

  const soilMap = {
    [SoilType.Clay]: "Đất sét (Clay)",
    [SoilType.Sand]: "Cát (Sand)",
    [SoilType.Gravel]: "Sỏi/Cuội (Gravel)",
    [SoilType.Rock]: "Đá cứng (Rock)"
  };

  return `
    Đóng vai một chuyên gia kỹ thuật khoan ngầm (HDD).
    Hãy phân tích kế hoạch khoan sau đây và đưa ra báo cáo ngắn gọn bằng tiếng Việt (định dạng Markdown):

    **Thông số ống HDPE:**
    - Đường kính ngoài (OD): ${pipe.outerDiameter} mm
    - SDR: ${pipe.sdr}
    - Vật liệu: ${pipe.material} (Yield: ${pipe.yieldStrength} MPa)

    **Thông số tuyến khoan:**
    - Loại công trình: ${crossingMap[path.crossingType]}
    - Địa chất chủ đạo: ${soilMap[path.soilType]}
    - Chiều dài: ${path.totalLength} m
    - Độ sâu tối đa: ${path.depth} m
    - Hệ số ma sát sử dụng: ${path.soilFriction}
    - Dung dịch khoan (Tỷ trọng): ${path.mudDensity} kg/m3

    **Kết quả tính toán sơ bộ:**
    - Lực kéo dự kiến: ${result.estimatedPullForce.toFixed(2)} kN
    - Hệ số an toàn (Kéo): ${result.safetyFactorTensile.toFixed(2)}
    - Hệ số an toàn (Móp/Collapse): ${result.safetyFactorCollapse.toFixed(2)}
    - Cảnh báo từ phần mềm: ${result.warnings.join(', ') || 'Không có'}

    **Kiến nghị thiết bị sơ bộ (đã tính toán):**
    - Đường kính lỗ khoan doạ (Reaming diameter): ${result.recommendedBoreholeDiameter.toFixed(0)} mm
    - Lực kéo máy khoan cần thiết (min): ${result.requiredRigPullback.toFixed(1)} tấn

    **Yêu cầu chuyên sâu:**
    1. Đánh giá rủi ro đặc thù cho loại công trình "${crossingMap[path.crossingType]}" và địa chất "${soilMap[path.soilType]}".
    2. Tư vấn quy trình thi công phù hợp (số bước doa, kiểm soát dung dịch) để tránh sự cố (ví dụ: vỡ thủy lực ở sông, sụt lún ở đường).
    3. Đánh giá sự phù hợp của thiết bị đề xuất.
    4. Trả lời ngắn gọn, tập trung vào giải pháp kỹ thuật.
  `;
};

export const analyzeWithGemini = async (
  pipe: PipeParams,
  path: BorePathParams,
  result: CalculationResult,
  apiKey?: string
): Promise<string> => {
  const prompt = buildPrompt(pipe, path, result);

  // Người dùng tự nhập API key riêng trong phần Cấu hình → gọi Gemini trực tiếp bằng key của họ
  if (apiKey && apiKey !== 'PLACEHOLDER_API_KEY') {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 0 }
        }
      });
      return response.text || "Không thể tạo báo cáo vào lúc này.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "Đã xảy ra lỗi khi kết nối với AI. Vui lòng thử lại sau.";
    }
  }

  // Mặc định: gọi qua backend proxy, API key nằm an toàn ở server
  try {
    const response = await fetch(`${getApiUrl()}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app: 'hdd', message: prompt }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      return data.message || "Đã xảy ra lỗi khi kết nối với AI. Vui lòng thử lại sau.";
    }
    return data.text || "Không thể tạo báo cáo vào lúc này.";
  } catch (error) {
    console.error("AI Proxy Error:", error);
    return "Đã xảy ra lỗi khi kết nối với AI. Vui lòng thử lại sau.";
  }
};
