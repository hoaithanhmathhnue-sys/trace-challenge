# Trace Challenge – Dự đoán đường đi của thuật toán

Webapp bổ trợ cho **Biện pháp 02**: *"Sử dụng thử thách dự đoán trạng thái biến nhằm phát triển tư duy thuật toán trong dạy học lập trình Tin học THPT"*.
- **Tin học 10 (Kết nối tri thức – Bài 19, 20, 21)**: Câu lệnh rẽ nhánh `if-else`, câu lệnh lặp `for` với `range()`, câu lệnh lặp `while`.
- **Tin học 11 định hướng Khoa học máy tính (CS)**: Dự đoán đường đi của thuật toán **Tìm kiếm nhị phân** và **Sắp xếp chọn (Selection Sort)**.

## Đặc điểm sư phạm & Kỹ thuật cốt lõi (Bám sát Biện pháp 02)

1. **Ba màn hình làm việc có kiểm soát (Mục 4)**:
   - **Màn hình 1 – Chọn bài (Thư viện mã)**: Gồm 7 bài mẫu chuẩn (Tiết 1 `range(1, 4)` tính tổng, Tiết 2 tính tích & đổi cận, Đề đánh giá Sau `range(2, 5)`, Rẽ nhánh `if` liên tiếp, Vòng lặp `while`, Tìm kiếm nhị phân Tin 11 CS, Sắp xếp chọn Tin 11 CS) và công cụ để giáo viên tự soạn bài mới.
   - **Màn hình 2 – Điền bảng & Giải thích (Phiếu A + Trao đổi cặp)**: Học sinh điền trạng thái biến tại từng điểm dừng, ghi lí do, khoanh bước khác biệt khi trao đổi cặp, dự đoán đầu ra và giải thích quy tắc trước khi bấm **Khóa bảng dự đoán**.
   - **Màn hình 3 – Xem từng trạng thái & Sửa bước sai (Mở vết + Phiếu B + Vận dụng)**:
     - **Chống lộ đáp án trước khi dự đoán**: Không hiển thị đáp án khi chưa khóa bảng dự đoán ban đầu; bản dự đoán ban đầu được giữ nguyên làm bằng chứng (Mục 8.3).
     - **Mở vết từng bước (hỗ trợ bàn phím `Space` / `Enter`)**: Mở tuần tự từng mốc điểm dừng, đối chiếu tức thì và tự động chỉ ra **bước đầu tiên có sai lệch**.
     - **Phiếu B & Vận dụng**: Học sinh đánh dấu bước sai đầu tiên, tự sửa lại bảng, viết câu giải thích nguyên nhân (hoặc giải thích kiểm chứng nếu dự đoán đúng 100% – không bắt buộc tạo lỗi giả theo Mục 8.4), và dự đoán độc lập khi thay đổi một giá trị đầu vào/cận trên.
2. **Rubric 10 điểm & Đánh giá Trước–Sau (Mục 5, 7, 8.4, 8.5)**:
   - Chia điểm trạng thái theo từng mốc (4 điểm) + Dự đoán đầu ra (2 điểm) + Giải thích thứ tự thực hiện (2 điểm) + Phát hiện và sửa bước sai đầu tiên (2 điểm).
   - Có **Mẫu tổng hợp sau dạy (Mục 7)** khi giáo viên nhập nhiều file `.json` của học sinh trên lớp.
3. **Phương án thay thế không cần máy tính (Mục 4 & 8.6)**:
   - Trang **Tài liệu in & Thẻ vết** cho phép in **Phiếu A, Phiếu B, Rubric 10 điểm** và **Bộ thẻ vết cắt rời (úp và lật từng thẻ trên bàn học)**.
4. **Kiến trúc tĩnh an toàn, sẵn sàng đưa lên GitHub & Deploy qua Vercel**:
   - Không cần backend, không cần tài khoản, không thu thập họ tên thật (chỉ dùng mã học sinh ẩn danh).
   - Lưu tự động vào `localStorage`, xuất phiếu ra **Word (`.docx`)**, **In A4 / PDF**, hoặc **File sao lưu (`.json`)**.
   - Hỗ trợ chạy offline (PWA) sau lần mở đầu tiên.

## Lệnh chạy và kiểm thử

```bash
npm install
npm run dev          # Chạy máy chủ phát triển
npm test             # Chạy kiểm thử đơn vị (Vitest)
npm run typecheck    # Kiểm tra kiểu TypeScript
npm run build        # Đóng gói bản sản xuất vào thư mục dist/
```

## Đưa lên GitHub và Deploy qua Vercel

1. Đẩy thư mục dự án này lên một kho chứa (repository) trên GitHub.
2. Đăng nhập [Vercel](https://vercel.com) → **Add New Project** → Chọn repository GitHub vừa tạo.
3. Vercel tự động nhận diện **Vite** qua file `vercel.json` (`buildCommand: npm run build`, `outputDirectory: dist`) → Bấm **Deploy**.
