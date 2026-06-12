# Kế hoạch triển khai SupportTechnical lên Cloudflare

## Kiến trúc

Một **Cloudflare Worker duy nhất** (`hotrokythuat`) đảm nhận tất cả:

```
https://<domain>/                          → Hub (static asset)
https://<domain>/polyweld-pro/ ...         → 7 app tính toán (static assets)
https://<domain>/documents/...             → Tài liệu PDF kỹ thuật (static assets)
https://<domain>/api/*                     → Express API chạy trong Worker
                                              └── Prisma (driver adapter pg) → Supabase Postgres
```

- Frontend và API **cùng một origin** → không cần CORS, không cần `VITE_API_URL`.
- Chỉ request `/api/*` mới chạy code Worker (`run_worker_first`) — static asset được serve miễn phí, không tốn quota.
- GEMINI_API_KEY nằm trong Worker secret, frontend gọi qua `/api/ai/chat` (đã có rate limit).
- Cron 3 ngày/lần tự ping Supabase để database free tier không bị pause.

## Bước 1 — Tạo database Supabase (một lần)

1. Tạo project tại https://supabase.com (chọn region Singapore cho gần VN).
2. Lấy connection string loại **Transaction pooler, cổng 6543** (Settings → Database → Connection string):
   `postgresql://postgres.<ref>:<password>@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`
   > Bắt buộc dùng pooler 6543 — Worker tạo kết nối mới mỗi request, cổng 5432 trực tiếp sẽ cạn kết nối.
3. Tạo bảng: chạy `ntp-support-hub/server/supabase_setup.sql` trong SQL Editor của Supabase,
   hoặc từ máy local: `cd ntp-support-hub/server` rồi `npx prisma db push` (với DATABASE_URL trỏ Supabase cổng 5432).

## Bước 2 — Đăng nhập Cloudflare và đặt secrets (một lần)

```powershell
cd ntp-support-hub\server
npm install
npx wrangler login

npx wrangler secret put DATABASE_URL      # connection string pooler 6543 ở Bước 1
npx wrangler secret put JWT_SECRET        # chuỗi ngẫu nhiên dài, KHÔNG dùng lại giá trị trong .env cũ
npx wrangler secret put ADMIN_USER
npx wrangler secret put ADMIN_PASS
npx wrangler secret put GEMINI_API_KEY    # key Gemini — giờ chỉ nằm ở server
```

> Sinh JWT_SECRET mới: `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`

## Bước 3 — Build và deploy

```powershell
# Từ thư mục gốc SupportTechnical
powershell -ExecutionPolicy Bypass -File scripts\build-cloudflare.ps1

cd ntp-support-hub\server
npx wrangler deploy
```

Wrangler sẽ in URL dạng `https://hotrokythuat.<account>.workers.dev`. Mở URL kiểm tra:
- `/` → Hub hiển thị
- `/api/health` → `{"status":"ok"}`
- `/polyweld-pro/` → app con + chat AI hoạt động (qua proxy)
- `/documents/instructions/testing/test-hdpe.pdf` → PDF mở được

## Bước 4 — Gắn tên miền riêng (tùy chọn)

Cloudflare Dashboard → Workers & Pages → hotrokythuat → Settings → Domains & Routes → Add custom domain.

## Cập nhật sau này

Mỗi lần sửa code: chạy lại Bước 3 (build + deploy). Khoảng 5–10 phút.

## Giới hạn cần biết

| Hạng mục | Free tier | Ghi chú |
|---|---|---|
| Request Worker | 100.000/ngày | Chỉ tính /api/*, static không tính |
| CPU/request | 10 ms | API hiện tại đều nhẹ, đủ dùng |
| Static assets | 20.000 file, 25 MB/file | PDF nào > 25 MB phải chuyển sang R2 |
| Supabase free | DB 500 MB, pause sau 7 ngày không dùng | Cron của Worker đã tự ping chống pause |

## Khác biệt hành vi khi chạy trên Cloudflare

- **Upload PDF qua trang Admin bị tắt** (Worker không có ổ đĩa). Muốn thêm/thay PDF: bỏ file vào
  `ntp-support-hub/document_technical/instructions/<loại>/` trong repo rồi build + deploy lại.
  Nâng cấp tương lai: chuyển sang Cloudflare R2 nếu cần upload trực tiếp.
- **Rate limit in-memory không hiệu lực** trên Worker (đã chủ động bỏ qua trong code). Nếu cần chặt chẽ,
  bật Cloudflare WAF rate limiting rule cho `/api/*` trên Dashboard (miễn phí 1 rule).

## Chạy local / VPS (không đổi)

Docker Compose vẫn hoạt động như cũ: `docker compose up -d --build` (nginx proxy /api → backend).
Thêm `GEMINI_API_KEY=...` vào file `.env` ở thư mục gốc để chat AI hoạt động ở local.
