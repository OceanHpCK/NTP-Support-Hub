# Editable Surface Pressure Design

## Mục tiêu

Cho phép người dùng nhập và chỉnh sửa áp suất bề mặt trong công cụ Hàn Mặt Đầu của PolyWeld Pro, thay vì dùng giá trị viết cứng trong mã nguồn.

## Phạm vi

Thay đổi được thực hiện trong module PolyWeld tích hợp tại `src/apps/polyweld`. Bản tĩnh tại `server/public/polyweld-pro` sẽ được tạo lại bằng quy trình build hiện có sau khi triển khai.

Không bổ sung bộ chọn đơn vị và không thay đổi các công thức thời gian, chiều cao gờ hoặc áp suất cản.

## Giao diện và hành vi

- Thêm ô nhập số mang nhãn **Áp suất bề mặt** và đơn vị `N/mm²` trong bảng Thông số đầu vào.
- Ô nhập dùng bước `0,01`.
- Giá trị khuyến nghị của PE100 và PE80 là `0,15 N/mm²`.
- Giá trị khuyến nghị của PP-R là `0,10 N/mm²`.
- Khi người dùng đổi vật liệu, ô nhập được đặt lại về giá trị khuyến nghị của vật liệu mới.
- Người dùng được phép thay đổi giá trị khuyến nghị.
- Khi giá trị khác mức khuyến nghị hiện tại, giao diện hiển thị cảnh báo màu vàng ngay dưới ô nhập: **Giá trị đã khác mức khuyến nghị cho vật liệu này. Hãy kiểm tra tiêu chuẩn và thông số nhà sản xuất trước khi hàn.**
- Cảnh báo không chặn tính toán.
- Khi giá trị trống, bằng 0, âm hoặc không phải số, giao diện hiển thị lỗi và không cập nhật kết quả từ giá trị không hợp lệ.

## Dữ liệu và phép tính

Trạng thái tham số hàn lưu áp suất bề mặt theo đúng đơn vị giao diện là `N/mm²`. Công thức hiện tại sử dụng áp suất theo `bar`, do đó giá trị nhập được chuyển đổi như sau:

`interfacialPressureBar = surfacePressureNPerMm2 * 10`

Áp suất lý thuyết và áp suất đồng hồ tiếp tục được tính theo công thức hiện tại:

`pressureTheory = weldingAreaCm2 * interfacialPressureBar / machineCylinderAreaCm2`

`gaugePressure = dragPressureBar + pressureTheory`

Kết quả `P1/P3` tiếp tục được làm tròn đến một chữ số thập phân.

## Cấu trúc mã

- Bổ sung trường áp suất bề mặt vào kiểu dữ liệu tham số Hàn Mặt Đầu.
- Tách ánh xạ vật liệu sang áp suất khuyến nghị thành một hằng số hoặc hàm thuần để dùng chung cho giá trị khởi tạo, đổi vật liệu và xác định trạng thái cảnh báo.
- Công thức tính nhận giá trị từ trạng thái tham số thay cho hằng số viết cứng theo vật liệu.
- Giữ thay đổi tập trung trong kiểu dữ liệu và component Hàn Mặt Đầu; không tái cấu trúc các phần không liên quan.

## Xử lý lỗi

- Chỉ chấp nhận giá trị hữu hạn lớn hơn 0.
- Giá trị không hợp lệ tạo thông báo lỗi trực tiếp dưới ô nhập.
- Khi đầu vào không hợp lệ, kết quả hợp lệ gần nhất không được ghi đè bằng `NaN`, số âm hoặc giá trị gây hiểu nhầm.
- Cảnh báo sai khác khuyến nghị chỉ áp dụng cho giá trị hợp lệ.

## Kiểm thử và xác minh

Kiểm thử tự động sẽ xác minh các hành vi sau:

1. PE100/PE80 sử dụng giá trị khuyến nghị `0,15 N/mm²`.
2. PP-R sử dụng giá trị khuyến nghị `0,10 N/mm²`.
3. Đổi vật liệu đặt lại giá trị theo khuyến nghị của vật liệu mới.
4. Giá trị người dùng nhập được chuyển đổi đúng sang bar và làm thay đổi `P1/P3` theo công thức.
5. Cảnh báo xuất hiện khi giá trị hợp lệ khác khuyến nghị và biến mất khi trở về mức khuyến nghị.
6. Giá trị trống, bằng 0, âm hoặc không phải số không được đưa vào phép tính.
7. Dự án TypeScript/Vite build thành công và bản tĩnh PolyWeld được cập nhật.

## Tiêu chí hoàn thành

- Người dùng thấy và sửa được ô **Áp suất bề mặt**.
- Giá trị ban đầu và hành vi đổi vật liệu đúng với PE và PP-R.
- Kết quả áp suất hàn sử dụng giá trị người dùng nhập.
- Cảnh báo và lỗi hiển thị đúng nhưng cảnh báo sai khác khuyến nghị không chặn thao tác.
- Kiểm thử và build đều thành công.
