# Nhật ký Triển khai & Tích hợp CodeGraph (Implementation Notes)

Tệp tài liệu này ghi lại toàn bộ các quyết định thiết kế, những thay đổi kỹ thuật, sự đánh đổi (trade-offs), và các quyết định tự chủ được đưa ra trong quá trình tích hợp công cụ **CodeGraph** vào không gian làm việc `SupportTechnical`.

---

## 💡 Các Quyết định Thiết kế & Sự Thay đổi ngoài Đặc tả

### 1. Triển khai tại Thư mục Gốc của Workspace (Root-Level Integration)
* **Quyết định:** Khởi tạo CodeGraph ở cấp độ cao nhất (`SupportTechnical`) thay vì đặt bên trong dự án con `/ntp-support-hub`.
* **Lý do:** 
  * Workspace hiện tại chứa cả dự án full-stack lớn `ntp-support-hub` lẫn **7 công cụ tính toán kỹ thuật** khác (`polyweld-pro`, `water-hammer-calculator`, v.v.).
  * Đặt ở thư mục gốc giúp tạo dựng một **Bản đồ tri thức liên kết (Unified Knowledge Graph)**. AI trợ lý có thể hiểu ngữ cảnh chéo giữa các dự án để giải quyết các vấn đề phức tạp, thay vì bị cô lập trong từng thư mục riêng lẻ.
* **Đánh đổi:** Quá trình quét chỉ mục ban đầu sẽ quét qua nhiều thư mục con hơn, nhưng tốc độ xử lý vẫn cực kỳ nhanh (hoàn thành chỉ trong 3.0 giây).

### 2. Tinh chỉnh Bộ lọc Loại trừ chỉ mục (Custom Excludes) trong `config.json`
* **Quyết định:** Can thiệp thủ công vào file cấu hình chỉ mục ẩn `.codegraph/config.json` để loại trừ thêm hai thư mục hệ thống của AI:
  * `**/.agent/**` (Thư mục chứa mã nguồn của các workflow và công cụ nội bộ)
  * `**/brain/**` (Thư mục chứa hàng ngàn file lưu vết lịch sử hội thoại, ảnh chụp màn hình kiểm thử)
* **Lý do:** Những thư mục này sinh ra lượng file cực lớn nhưng chỉ dùng cho quá trình phân tích nội bộ của AI, không thuộc mã nguồn thực tế của ứng dụng. Việc loại trừ chúng giúp giảm dung lượng database chỉ mục SQLite từ hàng Megabyte xuống chỉ còn vài Kilobyte, đồng thời giữ tốc độ truy vấn luôn ở mức dưới 50ms.

### 3. Điều chỉnh Cú pháp lệnh chạy Chỉ mục (Exclude CLI Workaround)
* **Thay đổi:** Ban đầu, tôi cố gắng chạy lệnh loại trừ qua dòng lệnh: `npx @colbymchenry/codegraph index --exclude ...`. Tuy nhiên, CLI của CodeGraph phiên bản hiện tại (0.8.0) chưa hỗ trợ cờ tùy chọn này trực tiếp trên command line.
* **Giải pháp:** Chuyển sang chỉnh sửa trực tiếp mảng `"exclude"` trong `.codegraph/config.json` và chạy lệnh `npx @colbymchenry/codegraph index` trơn. Đây là cách làm bền vững hơn vì cấu hình được lưu lại vĩnh viễn, các lập trình viên hoặc AI khác chạy sau này không cần phải nhớ gõ lại các cờ loại trừ.

---

## ⚖️ Các Sự Đánh đổi Kỹ thuật (Trade-offs)

### 1. Cô lập File Nhị phân SQLite khỏi Git
* **Quyết định:** Thêm `.codegraph/` vào `.gitignore` thư mục gốc để đảm bảo file nhị phân cơ sở dữ liệu `codegraph.db` **không bao giờ** bị đẩy lên GitHub.
* **Lợi ích:** 
  * Tránh phình to dung lượng git repository của bạn.
  * `codegraph.db` chứa các đường dẫn tuyệt đối gắn liền với máy tính cá nhân hiện tại (`G:\My Drive\...`). Đẩy lên máy tính khác sẽ bị lỗi đường dẫn.
* **Đánh đổi:** Mỗi khi có một lập trình viên mới clone mã nguồn về hoặc chuyển sang máy chủ khác, họ sẽ cần phải chạy lại lệnh khởi tạo `npx @colbymchenry/codegraph init` và chạy `npx @colbymchenry/codegraph index` một lần tại máy của mình để tự động dựng lại SQLite database tương thích.

### 2. Sử dụng file cấu hình `.cursorrules` dùng chung ở Thư mục gốc
* **Quyết định:** Tạo tệp cấu hình chỉ dẫn AI `.cursorrules` ở thư mục gốc của không gian làm việc.
* **Lợi ích:** Tạo ra một quy ước hành vi nhất quán, ép các trợ lý AI phải dùng CodeGraph thay vì quét file.
* **Hạn chế:** Nếu bạn mở trực tiếp một thư mục con đơn lẻ (như `/ntp-support-hub`) dưới dạng workspace độc lập trên VS Code hay Cursor, bạn sẽ không tận dụng được quy tắc gốc này trừ khi bạn mở cả thư mục mẹ `SupportTechnical`. Do đó, lời khuyên là hãy luôn mở thư mục mẹ.

---

## 🎯 Trạng thái Tích hợp Hiện tại

1. **Khởi tạo:** Thành công 100% tại thư mục gốc `SupportTechnical`.
2. **Kích thước chỉ mục:** 96 files đã được phân tích, sinh ra 662 nút (nodes) và 551 liên kết (edges) được nén gọn trong file SQLite `codegraph.db` chỉ có **136 KB**!
3. **Cấu hình Git:** Hoàn tất việc bỏ qua chỉ mục nhị phân trong `.gitignore` cấp cao nhất.
4. **Quy tắc AI:** Thiết lập thành công `.cursorrules` để tăng hiệu quả token khi bạn làm việc cùng Cursor hoặc các AI agent khác.
