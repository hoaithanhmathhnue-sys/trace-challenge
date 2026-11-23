import { Challenge } from './model';
import { uid } from './text';

export const BUILT_IN_CHALLENGES: Challenge[] = [
  {
    id: 'tc-for-sum-14',
    builtIn: true,
    title: 'Bài 1 (Mẫu chuẩn Tiết 1 / Đề Trước): Theo dõi vòng lặp cộng dồn range(1, 4)',
    category: 'tin10_loop',
    lessonRef: 'Tin 10 KNTT · Bài 20–21 · Mục 3 & 8.2, 8.3',
    purpose: 'Theo dõi biến cộng dồn tong thay đổi qua từng lượt lặp và giải thích vì sao range(1, 4) dừng trước cận trên 4.',
    measureRule: 'Mốc 0 đo ngay sau lệnh gán trước vòng lặp. Các mốc Lượt 1, 2, 3 đo ngay SAU khi thực hiện lệnh tong = tong + i ở mỗi lượt lặp.',
    code: `tong = 0
for i in range(1, 4):
    tong = tong + i
print(tong)`,
    columns: [
      { key: 'i', label: 'i', hint: 'Giá trị biến lặp i ở lượt hiện tại (trước vòng lặp ghi -)' },
      { key: 'tong_truoc', label: 'tong trước', hint: 'Giá trị của biến tong ngay trước khi thực hiện phép cộng ở lượt đó' },
      { key: 'tong_sau', label: 'tong sau', hint: 'Giá trị mới của biến tong sau lệnh tong = tong + i' },
    ],
    steps: [
      {
        id: 's0',
        label: 'Mốc 0: Trước vòng lặp (sau dòng 1)',
        lineNo: 1,
        expected: { i: '-', tong_truoc: '-', tong_sau: '0' },
        guidingQuestion: 'Ở dòng 1 (tong = 0), vòng lặp for đã bắt đầu chạy chưa? Giá trị khởi tạo của tong là bao nhiêu?',
        explanation: 'Dòng 1 gán tong = 0. Vòng lặp chưa bắt đầu nên biến i và tong trước chưa có giá trị (-), tong hiện tại bằng 0.',
      },
      {
        id: 's1',
        label: 'Mốc 1: Sau lượt lặp thứ nhất (i = 1)',
        lineNo: 3,
        expected: { i: '1', tong_truoc: '0', tong_sau: '1' },
        guidingQuestion: 'Giá trị đầu tiên mà range(1, 4) cấp cho i là bao nhiêu? Lệnh tong = tong + i lấy giá trị tong cũ nào để cộng với i?',
        explanation: 'Lượt 1: range(1, 4) bắt đầu từ 1 nên i = 1. Lệnh tong = tong + i lấy tong cũ (0) cộng với i (1), cập nhật tong mới bằng 1.',
      },
      {
        id: 's2',
        label: 'Mốc 2: Sau lượt lặp thứ hai (i = 2)',
        lineNo: 3,
        expected: { i: '2', tong_truoc: '1', tong_sau: '3' },
        guidingQuestion: 'Sang lượt 2, lệnh gán tong = tong + i dùng giá trị tong ban đầu (0) hay giá trị tong vừa cập nhật ở cuối lượt 1?',
        explanation: 'Lượt 2: i tăng lên 2. Phép gán dùng giá trị tong mới nhất từ lượt 1 là 1, cộng thêm i = 2 nên tong sau lượt 2 bằng 3.',
      },
      {
        id: 's3',
        label: 'Mốc 3: Sau lượt lặp thứ ba (i = 3)',
        lineNo: 3,
        expected: { i: '3', tong_truoc: '3', tong_sau: '6' },
        guidingQuestion: 'Ở lượt i = 3, giá trị tong trước khi cộng là bao nhiêu? Vì sao sau lượt này vòng lặp dừng mà không chạy tiếp với i = 4?',
        explanation: 'Lượt 3: i = 3, lấy tong trước là 3 cộng với 3 được tong sau = 6. Hàm range(1, 4) chỉ sinh các số nguyên từ 1 đến 3 (dừng trước cận trên 4) nên vòng lặp kết thúc.',
      },
    ],
    expectedOutput: '6',
    outputGuidingQuestion: 'Lệnh print(tong) ở dòng 4 nằm ngoài vòng lặp (không thụt lề). Nó in ra một giá trị cuối cùng hay in toàn bộ dãy 0, 1, 3, 6?',
    outputExplanation: 'Vì print(tong) nằm ngoài khối lặp for nên chỉ thực hiện 1 lần sau khi vòng lặp kết thúc, in ra giá trị cuối cùng của tong là 6 (không phải dãy giá trị trung gian).',
    variantPrompt: 'Vận dụng (Mục 3 & 8.3): Nếu thay range(1, 4) ở dòng 2 bằng range(1, 5), hãy dự đoán dãy giá trị của tong sau mỗi lượt lặp và kết quả đầu ra mới.',
    variantCode: `tong = 0
for i in range(1, 5):
    tong = tong + i
print(tong)`,
    variantExpectedTrace: '1, 3, 6, 10',
    variantExpectedOutput: '10',
    variantExplanation: 'range(1, 5) tạo các giá trị i lần lượt là 1, 2, 3, 4 (không bao gồm 5). So với bài gốc, có thêm lượt thứ tư với i = 4: tong = 6 + 4 = 10. Đầu ra là 10.',
    teacherNotes:
      'Bài mẫu chuẩn Mục 3 & 8.2. Lỗi phổ biến cần theo dõi: (1) Học sinh tính cả lượt i = 4 vì hiểu nhầm range(1, 4) lấy cả cận trên 4 (ra đáp án 10); (2) Không cộng dồn giá trị cũ mà lấy 0 + i ở mọi lượt; (3) Ghi đầu ra là dãy trung gian "1, 3, 6" thay vì 6.',
  },
  {
    id: 'tc-for-prod-14',
    builtIn: true,
    title: 'Bài 2 (Mẫu chuẩn Tiết 2): Theo dõi phép nhân tích lũy và đổi cận range',
    category: 'tin10_loop',
    lessonRef: 'Tin 10 KNTT · Bài 20–21 · Mục 8.3 (Tiết 2)',
    purpose: 'Củng cố quy tắc lấy giá trị cũ nhân với biến lặp i để cập nhật giá trị mới, đồng thời phân biệt tác động khi dịch cả cận dưới và cận trên.',
    measureRule: 'Mốc 0 đo sau lệnh s = 1 trước vòng lặp. Các mốc Lượt 1, 2, 3 đo ngay sau lệnh s = s * i trong thân vòng lặp.',
    code: `s = 1
for i in range(1, 4):
    s = s * i
print(s)`,
    columns: [
      { key: 'i', label: 'i', hint: 'Giá trị biến lặp i trong từng lượt' },
      { key: 's_truoc', label: 's trước', hint: 'Giá trị biến s trước khi thực hiện phép nhân ở lượt đó' },
      { key: 's_sau', label: 's sau', hint: 'Giá trị biến s ngay sau lệnh s = s * i' },
    ],
    steps: [
      {
        id: 's0',
        label: 'Mốc 0: Trước vòng lặp (sau dòng 1)',
        lineNo: 1,
        expected: { i: '-', s_truoc: '-', s_sau: '1' },
        guidingQuestion: 'Vì sao bài toán tính tích lại khởi tạo s = 1 mà không phải s = 0 như bài tính tổng?',
        explanation: 'Khởi tạo s = 1 trước vòng lặp (nếu khởi tạo bằng 0 thì nhân với số nào cũng bằng 0).',
      },
      {
        id: 's1',
        label: 'Mốc 1: Sau lượt lặp thứ nhất (i = 1)',
        lineNo: 3,
        expected: { i: '1', s_truoc: '1', s_sau: '1' },
        guidingQuestion: 'Ở lượt đầu tiên i = 1, lấy s trước (1) nhân với i (1) thì s sau bằng bao nhiêu?',
        explanation: 'Lượt 1: i = 1, s trước = 1 -> s sau = 1 * 1 = 1.',
      },
      {
        id: 's2',
        label: 'Mốc 2: Sau lượt lặp thứ hai (i = 2)',
        lineNo: 3,
        expected: { i: '2', s_truoc: '1', s_sau: '2' },
        guidingQuestion: 'Sang lượt 2 với i = 2, giá trị s trước khi nhân là bao nhiêu và s sau khi nhân là bao nhiêu?',
        explanation: 'Lượt 2: i = 2, lấy s trước là 1 nhân với 2 được s sau = 2.',
      },
      {
        id: 's3',
        label: 'Mốc 3: Sau lượt lặp thứ ba (i = 3)',
        lineNo: 3,
        expected: { i: '3', s_truoc: '2', s_sau: '6' },
        guidingQuestion: 'Ở lượt 3 với i = 3, lệnh s = s * i thực hiện phép nhân giữa hai số nào?',
        explanation: 'Lượt 3: i = 3, lấy s trước là 2 nhân với i = 3 được s sau = 6. Kết thúc range(1, 4).',
      },
    ],
    expectedOutput: '6',
    outputGuidingQuestion: 'Sau khi kết thúc 3 lượt lặp của range(1, 4), lệnh print(s) in ra kết quả nào?',
    outputExplanation: 'Vết của s sau 3 lượt lần lượt là 1, 2, 6. Lệnh print(s) in ra giá trị cuối cùng là 6.',
    variantPrompt: 'Vận dụng (Mục 8.3 – Tiết 2): Đổi range(1, 4) thành range(2, 5). Hãy dự đoán giá trị s sau mỗi lượt lặp và kết quả đầu ra cuối cùng.',
    variantCode: `s = 1
for i in range(2, 5):
    s = s * i
print(s)`,
    variantExpectedTrace: '2, 6, 24',
    variantExpectedOutput: '24',
    variantExplanation: 'range(2, 5) sinh các giá trị i = 2, 3, 4. Lượt 1 (i=2): s = 1*2 = 2; Lượt 2 (i=3): s = 2*3 = 6; Lượt 3 (i=4): s = 6*4 = 24. Đầu ra là 24.',
    teacherNotes:
      'Dùng cho Tiết 2 (Mục 8.3): Thay đổi điều kiện lặp. Cho các cặp học sinh lí giải vì sao cùng có 3 lượt lặp nhưng đổi từ range(1, 4) sang range(2, 5) lại làm vết s đổi từ (1, 2, 6) sang (2, 6, 24).',
  },
  {
    id: 'tc-for-sum-25',
    builtIn: true,
    title: 'Bài 3 (Đề đánh giá Sau tác động): Vòng lặp cộng dồn với range(2, 5)',
    category: 'tin10_loop',
    lessonRef: 'Tin 10 KNTT · Bài 20–21 · Mục 8.5 (Đề Sau)',
    purpose: 'Đánh giá khả năng chuyển giao tư duy theo dõi vết khi thay đổi cả cận bắt đầu và cận kết thúc của hàm range.',
    measureRule: 'Mốc 0 đo trước vòng lặp. Các mốc Lượt 1, 2, 3 đo ngay sau lệnh s = s + i ở từng lượt.',
    code: `s = 0
for i in range(2, 5):
    s = s + i
print(s)`,
    columns: [
      { key: 'i', label: 'i', hint: 'Giá trị biến lặp i (bắt đầu từ cận dưới của range)' },
      { key: 's_truoc', label: 's trước', hint: 'Giá trị biến s trước lệnh cộng ở lượt hiện tại' },
      { key: 's_sau', label: 's sau', hint: 'Giá trị biến s sau lệnh s = s + i' },
    ],
    steps: [
      {
        id: 's0',
        label: 'Mốc 0: Trước vòng lặp (sau dòng 1)',
        lineNo: 1,
        expected: { i: '-', s_truoc: '-', s_sau: '0' },
        guidingQuestion: 'Trước khi vào vòng lặp, biến s được khởi tạo bằng bao nhiêu?',
        explanation: 'Dòng 1 khởi tạo s = 0 trước khi vào vòng lặp.',
      },
      {
        id: 's1',
        label: 'Mốc 1: Sau lượt lặp thứ nhất',
        lineNo: 3,
        expected: { i: '2', s_truoc: '0', s_sau: '2' },
        guidingQuestion: 'Với range(2, 5), giá trị i ở lượt lặp đầu tiên là 1 hay 2?',
        explanation: 'range(2, 5) bắt đầu từ cận dưới là 2 nên lượt 1 có i = 2. Khi đó s trước = 0, s sau = 0 + 2 = 2.',
      },
      {
        id: 's2',
        label: 'Mốc 2: Sau lượt lặp thứ hai',
        lineNo: 3,
        expected: { i: '3', s_truoc: '2', s_sau: '5' },
        guidingQuestion: 'Ở lượt 2, giá trị cũ của s là bao nhiêu và cộng thêm i tiếp theo sẽ ra bao nhiêu?',
        explanation: 'Lượt 2: i = 3, lấy s trước là 2 cộng thêm 3 được s sau = 5.',
      },
      {
        id: 's3',
        label: 'Mốc 3: Sau lượt lặp thứ ba',
        lineNo: 3,
        expected: { i: '4', s_truoc: '5', s_sau: '9' },
        guidingQuestion: 'Giá trị cuối cùng của i trong range(2, 5) là bao nhiêu? Cận trên 5 có được lặp không?',
        explanation: 'Lượt 3: i = 4 (dừng trước cận trên 5). Lấy s trước là 5 cộng 4 được s sau = 9.',
      },
    ],
    expectedOutput: '9',
    outputGuidingQuestion: 'Sau 3 lượt với i = 2, 3, 4, giá trị cuối cùng được print(s) in ra màn hình là bao nhiêu?',
    outputExplanation: 'Trạng thái biến s sau 3 lượt lần lượt là 2, 5, 9. Kết quả đầu ra là 9.',
    variantPrompt: 'Vận dụng: Nếu giữ nguyên cận dưới là 2 nhưng thay range(2, 5) bằng range(2, 6), hãy dự đoán dãy trạng thái s và đầu ra mới.',
    variantCode: `s = 0
for i in range(2, 6):
    s = s + i
print(s)`,
    variantExpectedTrace: '2, 5, 9, 14',
    variantExpectedOutput: '14',
    variantExplanation: 'range(2, 6) có thêm lượt i = 5. Do đó s tăng từ 9 lên 9 + 5 = 14. Đầu ra là 14.',
    teacherNotes:
      'Đề đánh giá Sau tác động theo Mục 8.5 (tương đương độ khó với Đề Trước range(1, 4) nhưng đổi thành range(2, 5), trạng thái 2, 5, 9, đầu ra 9). Dùng để đối chiếu Trước–Sau cùng rubric 10 điểm.',
  },
  {
    id: 'tc-branch-xy',
    builtIn: true,
    title: 'Bài 4 (Tin 10 – Rẽ nhánh): Theo dõi hai câu lệnh if liên tiếp cập nhật biến',
    category: 'tin10_branch',
    lessonRef: 'Tin 10 KNTT · Bài 19 (Câu lệnh rẽ nhánh if)',
    purpose: 'Phân biệt hai câu lệnh if độc lập liên tiếp và kiểm tra việc sử dụng giá trị biến mới vừa bị thay đổi ở nhánh trước.',
    measureRule: 'Đo giá trị cặp biến (x, y) ngay sau khi khởi tạo và sau khi xét xong từng khối lệnh if.',
    code: `x = 5
y = 3
if x > y:
    x = x - y
if x < y:
    y = y + x
else:
    y = y - x
print(x, y)`,
    columns: [
      { key: 'cond', label: 'Điều kiện đúng/sai', hint: 'Ghi Đúng hoặc Sai cho điều kiện if đang xét (Mốc 0 ghi -)' },
      { key: 'x', label: 'x', hint: 'Giá trị biến x sau khi thực hiện mốc đó' },
      { key: 'y', label: 'y', hint: 'Giá trị biến y sau khi thực hiện mốc đó' },
    ],
    steps: [
      {
        id: 's0',
        label: 'Mốc 0: Sau khởi tạo (dòng 1–2)',
        lineNo: 2,
        expected: { cond: '-', x: '5', y: '3' },
        guidingQuestion: 'Sau hai dòng lệnh gán đầu tiên, giá trị ban đầu của x và y là bao nhiêu?',
        explanation: 'Dòng 1 và 2 khởi tạo x = 5, y = 3.',
      },
      {
        id: 's1',
        label: 'Mốc 1: Sau khối if thứ nhất (dòng 3–4)',
        lineNo: 4,
        expected: { cond: 'Đúng', x: '2', y: '3' },
        guidingQuestion: 'Điều kiện x > y (5 > 3) là Đúng hay Sai? Sau lệnh x = x - y, biến nào thay đổi và bằng bao nhiêu?',
        explanation: 'Vì 5 > 3 là Đúng nên lệnh x = x - y được thực hiện: x mới = 5 - 3 = 2; biến y giữ nguyên bằng 3.',
      },
      {
        id: 's2',
        label: 'Mốc 2: Xét điều kiện if thứ hai (dòng 5–6)',
        lineNo: 6,
        expected: { cond: 'Đúng', x: '2', y: '5' },
        guidingQuestion: 'Khi kiểm tra if x < y ở dòng 5, máy tính dùng giá trị x ban đầu (5) hay giá trị x mới (2) vừa tính ở dòng 4?',
        explanation: 'Máy tính luôn dùng giá trị hiện tại mới nhất của biến: x = 2, y = 3. Vì 2 < 3 là Đúng nên thực hiện nhánh if: y = y + x = 3 + 2 = 5 (bỏ qua nhánh else).',
      },
    ],
    expectedOutput: '2 5',
    outputGuidingQuestion: 'Khi nhánh if ở dòng 5 đã Đúng, nhánh else ở dòng 7–8 có chạy nữa không? Lệnh print(x, y) in ra hai số nào?',
    outputExplanation: 'Nhánh else bị bỏ qua vì điều kiện if x < y đã Đúng. Kết quả in ra màn hình là: 2 5.',
    variantPrompt: 'Vận dụng: Nếu thay giá trị đầu vào ở dòng 1–2 thành x = 4 và y = 4, hãy dự đoán giá trị (x, y) sau khối if thứ nhất và kết quả đầu ra cuối cùng.',
    variantCode: `x = 4
y = 4
if x > y:
    x = x - y
if x < y:
    y = y + x
else:
    y = y - x
print(x, y)`,
    variantExpectedTrace: 'x=4, y=4 -> x=4, y=0',
    variantExpectedOutput: '4 0',
    variantExplanation: 'Với x = 4, y = 4: (1) Điều kiện x > y (4 > 4) Sai nên x vẫn bằng 4; (2) Điều kiện x < y (4 < 4) cũng Sai nên chương trình thực hiện nhánh else: y = y - x = 4 - 4 = 0. Đầu ra là: 4 0.',
    teacherNotes:
      'Bài tập rẽ nhánh điển hình cho Tin 10. Bước sai phổ biến nhất là ở Mốc 2: học sinh vẫn lấy x = 5 ban đầu để so sánh x < y (5 < 3 -> Sai) nên nhảy nhầm sang nhánh else.',
  },
  {
    id: 'tc-while-step',
    builtIn: true,
    title: 'Bài 5 (Tin 10 – Vòng lặp while): Theo dõi điều kiện dừng và biến đếm lượt lặp',
    category: 'tin10_loop',
    lessonRef: 'Tin 10 KNTT · Bài 21 (Câu lệnh lặp while)',
    purpose: 'Theo dõi đồng thời hai biến thay đổi trong thân vòng lặp while và xác định thời điểm điều kiện lặp trở thành Sai.',
    measureRule: 'Mốc 0 đo trước vòng lặp. Các mốc Lượt 1, 2, 3 đo ngay sau khi thực hiện xong hai lệnh trong thân while ở mỗi lượt.',
    code: `n = 7
dem = 0
while n > 1:
    n = n - 2
    dem = dem + 1
print(n, dem)`,
    columns: [
      { key: 'n_truoc', label: 'n trước lượt', hint: 'Giá trị n dùng để kiểm tra điều kiện n > 1 đầu lượt' },
      { key: 'n_sau', label: 'n sau lượt', hint: 'Giá trị n sau lệnh n = n - 2' },
      { key: 'dem', label: 'dem sau lượt', hint: 'Giá trị biến đếm dem sau lệnh dem = dem + 1' },
    ],
    steps: [
      {
        id: 's0',
        label: 'Mốc 0: Trước vòng lặp (sau dòng 1–2)',
        lineNo: 2,
        expected: { n_truoc: '-', n_sau: '7', dem: '0' },
        guidingQuestion: 'Trước khi kiểm tra while n > 1 lần đầu tiên, giá trị khởi tạo của n và dem là bao nhiêu?',
        explanation: 'Khởi tạo n = 7 và dem = 0.',
      },
      {
        id: 's1',
        label: 'Mốc 1: Sau lượt lặp thứ nhất',
        lineNo: 5,
        expected: { n_truoc: '7', n_sau: '5', dem: '1' },
        guidingQuestion: 'Đầu lượt 1, điều kiện 7 > 1 Đúng. Sau khi giảm n đi 2 và tăng dem thêm 1, hai biến nhận giá trị nào?',
        explanation: 'Lượt 1: n trước = 7 (> 1 Đúng) -> n sau = 7 - 2 = 5; dem = 0 + 1 = 1.',
      },
      {
        id: 's2',
        label: 'Mốc 2: Sau lượt lặp thứ hai',
        lineNo: 5,
        expected: { n_truoc: '5', n_sau: '3', dem: '2' },
        guidingQuestion: 'Đầu lượt 2, n đang bằng 5 (> 1 Đúng). Kết thúc lượt 2, n và dem bằng bao nhiêu?',
        explanation: 'Lượt 2: n trước = 5 (> 1 Đúng) -> n sau = 5 - 2 = 3; dem = 1 + 1 = 2.',
      },
      {
        id: 's3',
        label: 'Mốc 3: Sau lượt lặp thứ ba (và kiểm tra dừng)',
        lineNo: 5,
        expected: { n_truoc: '3', n_sau: '1', dem: '3' },
        guidingQuestion: 'Sau khi n giảm từ 3 xuống 1 ở cuối lượt 3, vòng lặp quay lên kiểm tra 1 > 1 thì kết quả Đúng hay Sai? Có chạy lượt 4 không?',
        explanation: 'Lượt 3: n trước = 3 (> 1 Đúng) -> n sau = 3 - 2 = 1; dem = 2 + 1 = 3. Khi quay lên kiểm tra điều kiện 1 > 1 là Sai nên vòng lặp dừng ngay.',
      },
    ],
    expectedOutput: '1 3',
    outputGuidingQuestion: 'Lệnh print(n, dem) in ra giá trị cuối cùng của n và dem cách nhau bởi dấu cách là gì?',
    outputExplanation: 'Khi thoát khỏi vòng lặp while, n = 1 và dem = 3. Đầu ra trên màn hình là: 1 3.',
    variantPrompt: 'Vận dụng: Nếu thay giá trị đầu vào n = 7 ở dòng 1 bằng n = 8, hãy dự đoán dãy giá trị n sau mỗi lượt và kết quả print(n, dem) cuối cùng.',
    variantCode: `n = 8
dem = 0
while n > 1:
    n = n - 2
    dem = dem + 1
print(n, dem)`,
    variantExpectedTrace: '6, 4, 2, 0',
    variantExpectedOutput: '0 4',
    variantExplanation: 'Với n = 8: Lượt 1 -> n=6, dem=1; Lượt 2 -> n=4, dem=2; Lượt 3 -> n=2, dem=3; Lượt 4 (vì 2 > 1 vẫn Đúng) -> n=0, dem=4. Tiếp theo 0 > 1 Sai nên dừng. Đầu ra là: 0 4.',
    teacherNotes:
      'Giúp học sinh phân biệt điều kiện lặp n > 1 và n >= 1. Nhiều học sinh dừng sớm ở n = 3 hoặc chạy thừa 1 lượt khi n = 1.',
  },
  {
    id: 'tc-bin-search',
    builtIn: true,
    title: 'Bài 6 (Tin 11 CS – Tìm kiếm): Dự đoán đường đi của Tìm kiếm nhị phân',
    category: 'tin11_search',
    lessonRef: 'Tin 11 CS (Định hướng Khoa học máy tính) · Thuật toán tìm kiếm nhị phân',
    purpose: 'Theo dõi cách thuật toán tìm kiếm nhị phân thu hẹp biên [left, right] và tính chỉ số giữa mid qua từng bước so sánh.',
    measureRule: 'Mốc 0 đo sau khi khởi tạo left, right. Các mốc Lượt 1, Lượt 2 đo sau khi tính mid và cập nhật biên left hoặc right (hoặc dừng khi tìm thấy).',
    code: `a = [2, 5, 8, 12, 16, 23, 38]
k = 23
left, right = 0, 6
while left <= right:
    mid = (left + right) // 2
    if a[mid] == k: break
    elif a[mid] < k: left = mid + 1
    else: right = mid - 1
print(mid)`,
    columns: [
      { key: 'mid', label: 'mid', hint: 'Chỉ số giữa mid = (left + right) // 2 ở lượt đang xét' },
      { key: 'a_mid', label: 'a[mid]', hint: 'Giá trị phần tử tại vị trí mid của danh sách a (chỉ số tính từ 0)' },
      { key: 'left_sau', label: 'left sau lượt', hint: 'Biên trái left sau khi đối chiếu a[mid] với k' },
      { key: 'right_sau', label: 'right sau lượt', hint: 'Biên phải right sau khi đối chiếu a[mid] với k' },
    ],
    steps: [
      {
        id: 's0',
        label: 'Mốc 0: Khởi tạo vùng tìm kiếm (dòng 1–3)',
        lineNo: 3,
        expected: { mid: '-', a_mid: '-', left_sau: '0', right_sau: '6' },
        guidingQuestion: 'Danh sách a có 7 phần tử được đánh chỉ số từ mấy đến mấy? Trước vòng lặp, left và right bằng bao nhiêu?',
        explanation: 'Danh sách 7 phần tử có chỉ số từ 0 đến 6. Khởi tạo left = 0, right = 6; chưa tính mid (-).',
      },
      {
        id: 's1',
        label: 'Mốc 1: Kết thúc lượt lặp thứ nhất',
        lineNo: 7,
        expected: { mid: '3', a_mid: '12', left_sau: '4', right_sau: '6' },
        guidingQuestion: 'Với left = 0, right = 6 thì mid = (0 + 6) // 2 bằng mấy? Phần tử a[mid] bằng bao nhiêu? Vì a[mid] < 23 nên biên nào thay đổi?',
        explanation: 'Lượt 1: mid = (0 + 6) // 2 = 3 -> a[3] = 12. Vì 12 < 23 (a[mid] < k) nên thuật toán bỏ nửa trái, cập nhật left = mid + 1 = 4; giữ nguyên right = 6.',
      },
      {
        id: 's2',
        label: 'Mốc 2: Kết thúc lượt lặp thứ hai (tìm thấy)',
        lineNo: 6,
        expected: { mid: '5', a_mid: '23', left_sau: '4', right_sau: '6' },
        guidingQuestion: 'Sang lượt 2 với đoạn [4, 6], chỉ số mid mới bằng bao nhiêu và a[mid] có bằng k = 23 không?',
        explanation: 'Lượt 2: Với left = 4, right = 6 -> mid = (4 + 6) // 2 = 5. Ta có a[5] = 23 == k nên gặp lệnh break thoát vòng lặp ngay (left=4, right=6 giữ nguyên).',
      },
    ],
    expectedOutput: '5',
    outputGuidingQuestion: 'Sau khi thoát vòng lặp bởi lệnh break, lệnh print(mid) in ra chỉ số vị trí hay giá trị của phần tử?',
    outputExplanation: 'Lệnh print(mid) in ra chỉ số (vị trí) tìm thấy k = 23 trong danh sách a là 5.',
    variantPrompt: 'Vận dụng (Tin 11 CS): Giữ nguyên danh sách a = [2, 5, 8, 12, 16, 23, 38], nếu đổi giá trị cần tìm thành k = 5 thì dãy chỉ số mid qua các lượt và kết quả đầu ra là gì?',
    variantCode: `a = [2, 5, 8, 12, 16, 23, 38]
k = 5
left, right = 0, 6
while left <= right:
    mid = (left + right) // 2
    if a[mid] == k: break
    elif a[mid] < k: left = mid + 1
    else: right = mid - 1
print(mid)`,
    variantExpectedTrace: '3, 1',
    variantExpectedOutput: '1',
    variantExplanation: 'Lượt 1: left=0, right=6 -> mid=3, a[3]=12 > 5 nên cập nhật right = mid - 1 = 2. Lượt 2: left=0, right=2 -> mid = (0+2)//2 = 1, a[1]=5 == k nên dừng. Đầu ra là 1.',
    teacherNotes:
      'Mở rộng cho Tin học 11 định hướng Khoa học máy tính (Mục Thông tin áp dụng). Lỗi phổ biến: học sinh gán left = mid thay vì mid + 1, hoặc đếm chỉ số danh sách từ 1 thay vì từ 0.',
  },
  {
    id: 'tc-sel-sort',
    builtIn: true,
    title: 'Bài 7 (Tin 11 CS – Sắp xếp): Dự đoán trạng thái mảng qua từng lượt Sắp xếp chọn',
    category: 'tin11_sort',
    lessonRef: 'Tin 11 CS (Định hướng Khoa học máy tính) · Thuật toán sắp xếp chọn (Selection Sort)',
    purpose: 'Theo dõi cách thuật toán sắp xếp chọn tìm vị trí phần tử nhỏ nhất m trong đoạn chưa sắp xếp [i..n-1] và đổi chỗ với a[i] sau mỗi lượt vòng lặp ngoài.',
    measureRule: 'Mốc 0 là mảng ban đầu. Các mốc Lượt 1, 2, 3 đo ngay sau lệnh hoán đổi a[i], a[m] = a[m], a[i] ở cuối mỗi lượt vòng lặp ngoài.',
    code: `a = [29, 10, 14, 37]
for i in range(3):
    m = i
    for j in range(i + 1, 4):
        if a[j] < a[m]: m = j
    a[i], a[m] = a[m], a[i]
print(a)`,
    columns: [
      { key: 'i', label: 'i', hint: 'Chỉ số vòng lặp ngoài i (0, 1, 2)' },
      { key: 'm', label: 'm (vị trí min)', hint: 'Chỉ số của phần tử nhỏ nhất tìm được trong đoạn từ i đến 3' },
      { key: 'arr', label: 'Danh sách a sau hoán đổi', hint: 'Trạng thái danh sách a dạng [x, y, z, t] sau khi đổi chỗ a[i] và a[m]' },
    ],
    steps: [
      {
        id: 's0',
        label: 'Mốc 0: Trước vòng lặp ngoài (sau dòng 1)',
        lineNo: 1,
        expected: { i: '-', m: '-', arr: '[29, 10, 14, 37]' },
        guidingQuestion: 'Trước khi bắt đầu sắp xếp, danh sách a gồm 4 phần tử ở thứ tự nào?',
        explanation: 'Danh sách khởi tạo ban đầu là [29, 10, 14, 37].',
      },
      {
        id: 's1',
        label: 'Mốc 1: Sau lượt ngoài thứ nhất (i = 0)',
        lineNo: 6,
        expected: { i: '0', m: '1', arr: '[10, 29, 14, 37]' },
        guidingQuestion: 'Ở lượt i = 0, phần tử nhỏ nhất trong toàn mảng [29, 10, 14, 37] là số nào, nằm ở chỉ số m bằng mấy? Đổi chỗ a[0] và a[m] ta được mảng nào?',
        explanation: 'Lượt i = 0: Phần tử nhỏ nhất trong đoạn 0..3 là 10 nằm tại chỉ số m = 1. Hoán đổi a[0] (29) với a[1] (10) được [10, 29, 14, 37].',
      },
      {
        id: 's2',
        label: 'Mốc 2: Sau lượt ngoài thứ hai (i = 1)',
        lineNo: 6,
        expected: { i: '1', m: '2', arr: '[10, 14, 29, 37]' },
        guidingQuestion: 'Sang lượt i = 1, xét trên mảng mới [10, 29, 14, 37] từ vị trí 1 đến 3, phần tử nhỏ nhất nằm ở chỉ số m nào?',
        explanation: 'Lượt i = 1: Xét đoạn 1..3 gồm [29, 14, 37], giá trị nhỏ nhất là 14 tại chỉ số m = 2. Hoán đổi a[1] (29) và a[2] (14) được [10, 14, 29, 37].',
      },
      {
        id: 's3',
        label: 'Mốc 3: Sau lượt ngoài thứ ba (i = 2)',
        lineNo: 6,
        expected: { i: '2', m: '2', arr: '[10, 14, 29, 37]' },
        guidingQuestion: 'Ở lượt i = 2, xét đoạn 2..3 gồm [29, 37], chỉ số nhỏ nhất m bằng mấy và mảng có thay đổi vị trí không?',
        explanation: 'Lượt i = 2: Xét đoạn 2..3 gồm [29, 37], phần tử nhỏ nhất là 29 ở ngay vị trí m = 2. Hoán đổi a[2] với chính a[2] nên danh sách giữ nguyên [10, 14, 29, 37].',
      },
    ],
    expectedOutput: '[10, 14, 29, 37]',
    outputGuidingQuestion: 'Sau 3 lượt sắp xếp chọn cho danh sách 4 phần tử, lệnh print(a) in ra danh sách cuối cùng như thế nào?',
    outputExplanation: 'Danh sách đã được sắp xếp tăng dần hoàn chỉnh: [10, 14, 29, 37].',
    variantPrompt: 'Vận dụng (Tin 11 CS): Nếu mảng đầu vào ở dòng 1 là a = [15, 30, 10, 20], hãy dự đoán chỉ số m tìm được ngay ở lượt đầu tiên (i = 0) và trạng thái mảng a ngay sau lượt i = 0.',
    variantCode: `a = [15, 30, 10, 20]
# Xét ngay sau lượt lặp ngoài đầu tiên (i = 0)`,
    variantExpectedTrace: 'm = 2',
    variantExpectedOutput: '[10, 30, 15, 20]',
    variantExplanation: 'Trong mảng [15, 30, 10, 20], phần tử nhỏ nhất là 10 nằm ở chỉ số m = 2. Kết thúc lượt i = 0, thuật toán chỉ đổi chỗ a[0] (15) với a[2] (10) nên mảng trở thành [10, 30, 15, 20].',
    teacherNotes:
      'Giúp học sinh Tin 11 CS phân biệt Sắp xếp chọn (mỗi lượt ngoài chỉ đổi chỗ đúng 1 cặp a[i] và a[m]) với Sắp xếp nổi bọt (đổi chỗ liên tiếp các cặp kề nhau).',
  },
];

export function newCustomChallenge(src?: Challenge): Challenge {
  if (src) {
    return {
      ...src,
      id: uid(),
      builtIn: false,
      title: src.title + ' (Bản sao)',
      columns: src.columns.map((c) => ({ ...c })),
      steps: src.steps.map((s) => ({ ...s, expected: { ...s.expected } })),
    };
  }
  const cols = [
    { key: 'i', label: 'i', hint: 'Giá trị biến lặp hiện tại (trước vòng lặp ghi -)' },
    { key: 's_truoc', label: 's trước', hint: 'Giá trị biến s trước khi thực hiện lệnh gán' },
    { key: 's_sau', label: 's sau', hint: 'Giá trị biến s ngay sau khi thực hiện lệnh gán' },
  ];
  return {
    id: uid(),
    builtIn: false,
    title: '',
    category: 'tin10_loop',
    lessonRef: 'Tin 10 KNTT · Bài 20–21',
    purpose: 'Dự đoán trạng thái biến thay đổi sau từng lượt thực hiện lệnh.',
    measureRule: 'Mốc 0 đo trước vòng lặp; các mốc tiếp theo đo ngay sau khi thực hiện lệnh gán trong thân vòng lặp.',
    code: `s = 0\nfor i in range(1, 4):\n    s = s + i\nprint(s)`,
    columns: cols,
    steps: [
      {
        id: 'step-0',
        label: 'Mốc 0: Trước vòng lặp',
        lineNo: 1,
        expected: { i: '-', s_truoc: '-', s_sau: '0' },
        guidingQuestion: 'Trước khi vào vòng lặp, biến s có giá trị khởi tạo bằng bao nhiêu?',
        explanation: 'Dòng 1 gán giá trị khởi tạo cho biến.',
      },
      {
        id: 'step-1',
        label: 'Mốc 1: Sau lượt 1 (i = 1)',
        lineNo: 3,
        expected: { i: '1', s_truoc: '0', s_sau: '1' },
        guidingQuestion: 'Ở lượt 1, lệnh gán dùng giá trị cũ nào của biến để tính giá trị mới?',
        explanation: 'Lượt 1 lấy giá trị khởi tạo cộng với i = 1.',
      },
      {
        id: 'step-2',
        label: 'Mốc 2: Sau lượt 2 (i = 2)',
        lineNo: 3,
        expected: { i: '2', s_truoc: '1', s_sau: '3' },
        guidingQuestion: 'Sang lượt 2, giá trị trước phép gán lấy từ đâu?',
        explanation: 'Lượt 2 lấy giá trị mới nhất sau lượt 1.',
      },
    ],
    expectedOutput: '3',
    outputGuidingQuestion: 'Lệnh print ở cuối in ra kết quả cuối cùng hay dãy giá trị trung gian?',
    outputExplanation: 'In ra giá trị cuối cùng của biến sau khi kết thúc vòng lặp.',
    variantPrompt: 'Thay đổi cận trên của hàm range và dự đoán kết quả đầu ra mới.',
    variantCode: `s = 0\nfor i in range(1, 5):\n    s = s + i\nprint(s)`,
    variantExpectedTrace: '1, 3, 6, 10',
    variantExpectedOutput: '10',
    variantExplanation: 'Khi tăng cận trên thêm 1 thì vòng lặp thực hiện thêm 1 lượt.',
    teacherNotes: '',
  };
}
