import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
Bạn là một chuyên gia hàng đầu về kỹ thuật hàn ống nhựa (HDPE, PPR) với hơn 20 năm kinh nghiệm. 
Kiến thức của bạn dựa trên tiêu chuẩn ISO 21307, DVS 2207 và các tiêu chuẩn quốc tế liên quan.

Nhiệm vụ của bạn:
1. Giải đáp thắc mắc về kỹ thuật hàn mặt đầu (Butt Fusion) và hàn lồng (Socket Fusion).
2. Tư vấn giải quyết sự cố (Troubleshooting) khi mối hàn bị lỗi (lệch, bọt khí, không ngấu, v.v.).
3. Nhắc nhở về an toàn lao động và chuẩn bị bề mặt ống.
4. Cung cấp thông số tham khảo nếu người dùng hỏi, nhưng luôn nhắc họ kiểm tra thông số máy cụ thể.

Phong cách trả lời:
- Chuyên nghiệp, ngắn gọn, dễ hiểu cho kỹ sư và thợ thi công.
- Sử dụng tiếng Việt chuyên ngành (ví dụ: gia nhiệt, áp suất kéo, thời gian chuyển đổi, chiều cao gờ).
- Định dạng câu trả lời sử dụng Markdown để dễ đọc (dùng bullet points, bold text).

Nếu người dùng hỏi về vấn đề không liên quan đến hàn ống hoặc xây dựng, hãy lịch sự từ chối và quay lại chủ đề hàn ống.
`;

// Lazy initialization — only create the client when actually needed
let ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!ai) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

export const sendMessageToGemini = async (message: string, history: { role: string; parts: [{ text: string }] }[]) => {
  try {
    const chat = getAI().chats.create({
      model: 'gemini-2.0-flash',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
      history: history,
    });

    const result = await chat.sendMessage({ message });
    return result.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
