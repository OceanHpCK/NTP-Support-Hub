// Proxy AI: giữ GEMINI_API_KEY ở phía server, frontend không bao giờ thấy key
import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { env } from '../env';

const router = Router();

const POLYWELD_SYSTEM_INSTRUCTION = `
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

// Cấu hình theo từng app — system instruction nằm ở server, client không tự đổi được
const APP_CONFIGS: Record<string, { model: string; systemInstruction?: string; temperature?: number; thinkingBudget?: number }> = {
  polyweld: {
    model: 'gemini-3-flash-preview',
    systemInstruction: POLYWELD_SYSTEM_INSTRUCTION,
    temperature: 0.7,
  },
  hdd: {
    model: 'gemini-3-flash-preview',
    thinkingBudget: 0,
  },
};

const chatSchema = z.object({
  app: z.enum(['polyweld', 'hdd']),
  message: z.string().min(1).max(16000),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    parts: z.array(z.object({ text: z.string().max(16000) })).max(4),
  })).max(30).optional(),
});

router.post('/chat', async (req: Request, res: Response): Promise<void> => {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ', errors: parsed.error.issues });
    return;
  }

  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(503).json({ success: false, message: 'Máy chủ chưa cấu hình GEMINI_API_KEY' });
    return;
  }

  const { app, message, history } = parsed.data;
  const config = APP_CONFIGS[app];

  try {
    const ai = new GoogleGenAI({ apiKey });

    if (history && history.length > 0) {
      const chat = ai.chats.create({
        model: config.model,
        config: {
          systemInstruction: config.systemInstruction,
          temperature: config.temperature,
        },
        history,
      });
      const result = await chat.sendMessage({ message });
      res.json({ success: true, text: result.text ?? '' });
    } else {
      const result = await ai.models.generateContent({
        model: config.model,
        contents: message,
        config: {
          systemInstruction: config.systemInstruction,
          temperature: config.temperature,
          ...(config.thinkingBudget !== undefined ? { thinkingConfig: { thinkingBudget: config.thinkingBudget } } : {}),
        },
      });
      res.json({ success: true, text: result.text ?? '' });
    }
  } catch (error: any) {
    console.error('[AI Proxy] Gemini API Error:', error);
    res.status(502).json({ success: false, message: 'Lỗi khi gọi Gemini API. Vui lòng thử lại sau.' });
  }
});

export default router;
