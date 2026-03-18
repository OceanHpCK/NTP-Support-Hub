# NTP Support Hub

Ứng dụng thống nhất hỗ trợ kỹ thuật chuyên ngành cho khách hàng sử dụng sản phẩm ống nhựa Tiền Phong.

## 🚀 Tính năng chính

- **HDD Pro Calculator**: Tính toán & Thiết kế khoan ngầm định hướng (HDPE) theo chuẩn ASTM F1962.
- **PipeCalc Pro**: Tính toán cơ lý chôn lấp ống theo chuẩn BS EN 1295-1.
- **PolyWeld Pro**: Tra cứu quy trình và tính toán thông số hàn ống HDPE/PPR theo chuẩn ISO 21307.
- **Giao diện thống nhất**: Hệ thống Sidebar linh hoạt, Dashboard tập trung.
- **Hỗ trợ AI**: Tích hợp Gemini AI trợ giúp giải đáp thắc mắc kỹ thuật.

## 🛠️ Công nghệ sử dụng

- **Frontend**: React 19, TypeScript, Vite.
- **Styling**: Tailwind CSS v4.
- **Icons**: Lucide React.
- **AI**: Google Gemini API.
- **Deployment**: Docker & Nginx.

## 📦 Hướng dẫn cài đặt & Chạy ứng dụng

### 1. Chạy với Docker (Khuyên dùng)

Yêu cầu: Đã cài đặt Docker và Docker Compose.

```bash
docker compose up -d --build
```
Ứng dụng sẽ chạy tại: `http://localhost:8080`

### 2. Chạy môi trường Development

Yêu cầu: Node.js 20+.

```bash
npm install
npm run dev
```

## 🌐 Deployment Production

Cấu hình cho tên miền chính thức: `https://hotrokythuat.nhuatienphong.io.vn/`

Sử dụng Docker Compose trong môi trường production để đảm bảo tính ổn định và bảo mật.

## 📝 Bản quyền

© 2026 Nhựa Tiền Phong. Tất cả các công cụ tính toán mang tính chất tham khảo.
