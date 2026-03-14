# Hướng dẫn thiết kế và thi công đường ống ngầm HDPE (Pipelife Technical Catalogue)

## 0.0 Giới thiệu
Các loại ứng dụng chôn lấp ngầm dưới biển cho ống PE.
- Ống PE ngầm dưới biển đã được sử dụng để cấp và thoát nước từ những năm 1960. 
- Ống PE ngày nay là vật liệu phổ biến nhất trong các ứng dụng ngầm dưới biển. Sự kết hợp của tính linh hoạt, dẻo dai và sức mạnh làm cho nó vượt trội so với các loại nguyên liệu khác.

## 0.1 Các loại lắp đặt ngầm dưới biển của đường ống
Theo hướng vận chuyển tự nhiên của nước tiêu dùng, chúng ta có thể chia thành 3 loại:
1. **Đường ống cấp nước**: Phục vụ cả ứng dụng dân dụng và công nghiệp. Các nguồn nước có thể là sông, hồ hoặc các vịnh. Độ sâu có thể thay đổi từ 2m -> 250m.
2. **Đường ống vận chuyển**: Băng qua sông hoặc biển để cấp thoát nước cho các thành phố hoặc các hòn đảo.
3. **Đường ống thoát nước**: Nước thải được xử lý thường sẽ được chuyển vào khu vực xả ở độ sâu nhất định và cách xa bờ biển (10-60m).

## 0.2 Làm chìm ống PE
Việc làm chìm đường ống chủ yếu được thực hiện bởi các lực tự nhiên như là trọng lực, lực nổi và áp lực khí.
- **Chuẩn bị**: Hàn nối các ống PE thành từng đoạn dài, lắp đặt các khối gia tải (quả tải bê tông) vào ống theo các khoảng chiều dài nhất định.
- **Lai dắt**: Bơm khí vào ống để ống nổi hoàn toàn trên mặt nước, dùng tàu kéo lai dắt đoạn ống ra vị trí lắp đặt.
- **Đánh chìm**: Mở van khí ở đầu ngoài cùng một cách cẩn thận và kiểm soát áp suất bên trong. Cấu trúc uốn cong hình chữ S thể hiện sự cân bằng giữa các lực tác dụng xuống (trọng lực) và lực đẩy lên (độ nổi).

## A.3 Thiết kế tĩnh
### A.3.1 Áp suất bên trong
Áp suất bên trong sẽ tạo ra ứng suất trên thành của ống theo cả 2 hướng dọc ống và vuông góc với trục ống.
- **Ứng suất vòng (Ring stress)**: $\sigma_r = \frac{p}{2}(SDR - 1)$
- **Lực theo chiều dọc ống**: Áp suất bên trong đường ống sẽ làm biến dạng ống theo chiều dọc nếu đường ống không được gắn cố định.

### A.3.2 Chịu tải ngoài / Biến dạng ống (Buckling)
Hiện tượng biến dạng (buckling) xảy ra khi lực nén theo phương vòng vượt quá độ ổn định của vật liệu.
- **Áp suất buckling cho ống không hỗ trợ**: $p_{buc} = \frac{2 \cdot E}{1 - \nu^2} \cdot \left(\frac{s}{D_m}\right)^3 \cdot k$
- **Hệ số an toàn**: Thường sử dụng hệ số an toàn $F = 2$ để tính toán.

### A.3.3 Hiện tượng búa nước (Water hammer)
Hiện tượng búa nước xảy ra trong đường ống khi dòng chảy bị thay đổi đột ngột (ví dụ: đóng/mở van, khởi động máy bơm).
- Kích thước của hiện tượng búa nước: $\Delta p = \frac{\Delta v \cdot c}{g}$

## A.4 Thiết kế tải trọng bằng khối bê tông
Đường ống nước PE ngầm sẽ trôi nổi hoặc xoay nếu chúng không được lắp các khối bê tông trọng lượng, vì tỷ trọng của PE thấp hơn tỷ trọng của nước xung quanh.
- **Mức độ tải (Độ điền đầy khí - $a_a$)**: Thường nằm trong khoảng 10% - 60%.
- **Các kiểu bê tông trọng lượng**: Hình hộp chữ nhật, Hình tròn, Hình ngôi sao.
- **Sự ổn định trên đáy biển**: Ống phải cân bằng chống lại lực kéo ($F_D$) và lực nâng ($F_L$) từ dòng hải lưu và sóng biển.
  - Điều kiện chống trượt: $\mu \ge \frac{F_D}{F_N}$

## A.5 Tính toán các hệ số cho quá trình làm chìm
- **Áp suất bên trong**: $p = a_a \cdot H$ (với $H$ là độ sâu của nước).
- **Lực kéo**: Lực kéo ở phía cuối đường ống được sử dụng để kiểm soát vị trí của ống và đồng thời làm tăng bán kính cong theo hình chữ S.
- **Vận tốc làm chìm**: Nên để vận tốc làm chìm không lớn hơn 0.3 m/s (khoảng 1 km/h) để tránh tăng lực kéo đột ngột.

---
*Tài liệu được trích xuất từ Pipelife Technical Catalogue - Hướng dẫn thiết kế và thi công đường ống ngầm HDPE.*
