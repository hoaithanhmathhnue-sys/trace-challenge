# Kiến trúc kỹ thuật – Trace Challenge (Biện pháp 02)

Webapp bổ trợ cho **Biện pháp 02 – Trace Challenge: Dự đoán đường đi của thuật toán** (Tin học 10: Rẽ nhánh, Vòng lặp; Tin học 11 CS: Tìm kiếm, Sắp xếp).

## 1. Quyết định công nghệ

| Hạng mục | Giải pháp | Lý do sư phạm & kỹ thuật |
|---|---|---|
| Framework | Vite + React 19 + TypeScript | Tải nhanh, tĩnh 100%, tương thích hoàn toàn với Vercel mà không cần cấu hình máy chủ |
| Điều hướng | Hash Router (`#/`, `#/challenges`, `#/ws/:id/:tab`, `#/print`) | Không lỗi 404 khi tải lại trang trên bất kỳ dịch vụ lưu trữ tĩnh nào |
| Lưu trữ | `localStorage` (`tc.v1.*`) + `MemoryKV` dự phòng | Lưu cục bộ tức thì, chống mất chữ khi đóng tab, kiểm soát xung đột đa tab bằng `rev` |
| Xuất học liệu | `docx` (nạp muộn) + `@media print` + `.json` | Cho phép học sinh nộp bài qua file `.json` hoặc `.docx`, giáo viên in Phiếu A/B và Bộ thẻ vết úp–lật |
| Offline | `vite-plugin-pwa` (`registerType: 'prompt'`) | Hoạt động ổn định ở phòng máy mạng yếu; không tự tải lại trang làm mất dữ liệu đang gõ |

## 2. Ràng buộc nghiệp vụ từ Biện pháp 02

1. **Không hiện đáp án trước giai đoạn dự đoán (Mục 2, 4, 8.6)**:
   - Khi `predictionLocked === false`, học sinh không thể xem các mốc trạng thái chuẩn ở màn hình 2.
   - Hàm `checkReadyToLockPrediction` yêu cầu điền đủ các ô biến tại mọi điểm dừng, dự đoán đầu ra và câu giải thích trước khi khóa.
2. **Giữ bằng chứng dự đoán ban đầu (Mục 8.3)**:
   - Sau khi bấm khóa dự đoán, các ô ở Phiếu A chuyển sang chỉ đọc kèm dấu thời gian `lockedAt`. Việc sửa lỗi được thực hiện riêng ở Phiếu B (`correctedValues`, `firstWrongStepId`, `wrongCauseExplanation`).
3. **Mở vết từng bước và hỗ trợ bàn phím (Mục 4 & 8.6)**:
   - Các mốc điểm dừng mở tuần tự từ `0` đến `steps.length` thông qua nút bấm hoặc phím `Space` / `Enter`.
   - Chỉ sau khi mở hết các mốc trạng thái mới mở được kết quả đầu ra cuối cùng (`outputRevealed`).
4. **Rubric 10 điểm chia theo từng mốc & Không ép tạo lỗi giả (Mục 5 & 8.4)**:
   - Tiêu chí 1 (4 điểm) tính theo số mốc trạng thái đúng thay vì chấm "tất cả hoặc không có gì".
   - Nếu học sinh dự đoán ban đầu đúng 100% (`actualFirstWrong === 'none'`), học sinh chọn "Không có bước sai" và giải thích quy tắc kiểm chứng để nhận đủ 2 điểm ở tiêu chí 4.
5. **Mẫu tổng hợp sau dạy trung thực (Mục 7 & 8.6)**:
   - Khi chưa có phiếu thực nghiệm hợp lệ, mẫu tổng hợp để trống `[ ]`, tuyệt đối không tự điền số liệu giả định.
