// Gọi AI qua backend proxy (cùng origin) — API key được giữ ở server, không lộ trong bundle
export const sendMessageToGemini = async (message: string, history: { role: string; parts: [{ text: string }] }[]) => {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app: 'polyweld', message, history }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    console.error('AI Proxy Error:', data);
    throw new Error(data.message || 'Lỗi khi kết nối với AI');
  }
  return data.text as string;
};
