/**
 * 다국어 지원 (한국어 / English / Tiếng Việt).
 *
 * 대상 범위: 현장 작업자가 쓰는 화면(랜딩·사번 등록·신고·내 이력)만 번역한다.
 * 관리자 대시보드는 한국어로 유지하는데, 이유는 두 가지다.
 *  1) 다국어가 필요한 이유 자체가 "현장 작업자의 언어 장벽"이고, 안전관리자는 한국인이다.
 *  2) 인적 오류 분류(실수/망각/착오/위반)와 배후 요인은 DB에 저장되는 값이므로
 *     번역하면 데이터 일관성이 깨진다.
 */

export type Lang = "ko" | "en" | "vi";

export const LANGUAGES: { code: Lang; label: string }[] = [
  { code: "ko", label: "한국어" },
  { code: "en", label: "English" },
  { code: "vi", label: "Tiếng Việt" },
];

/** Web Speech API에 넘길 BCP-47 언어 코드 */
export const SPEECH_LANG: Record<Lang, string> = {
  ko: "ko-KR",
  en: "en-US",
  vi: "vi-VN",
};

interface Dictionary {
  // 공통
  appEyebrow: string;
  change: string;

  // 랜딩
  landingTitle: string;
  landingSubtitle1: string;
  landingSubtitle2: string;
  workerCardTitle: string;
  workerCardDesc: string;
  adminCardTitle: string;
  adminCardDesc: string;

  // 사번 등록
  registerTitle: string;
  registerDesc1: string;
  registerDesc2: string;
  employeeIdPlaceholder: string;
  namePlaceholder: string;
  start: string;
  checking: string;
  registerFooter: string;
  registerFailed: string;

  // 작업자 바
  reportingAs: string; // "{name} ({id})" 뒤에 붙는 문구
  myReports: string;

  // 신고 화면
  reportTitle: string;
  micUnsupportedTitle: string;
  micUnsupportedDesc: string;
  reportContent: string;
  viaVoiceOrType: string;
  viaTypeOnly: string;
  contentPlaceholder: string;
  recognizing: string;
  pressToSpeak: string;
  listening: string;
  pressHint: string;
  listeningHint: string;
  selectZone: string;
  takePhoto: string;
  retakePhoto: string;
  deletePhoto: string;
  submit: string;
  submitting: string;
  submitFailed: string;
  anonymousLabel: string;
  anonymousOn: string;
  anonymousOff: string;

  // 제출 완료
  submitDone: string;
  receiptNo: string;
  deliveredToManager: string;

  // 내 신고 이력
  backToReport: string;
  myReportsTitle: string;
  notRegistered: string;
  registerFirst: string;
  loading: string;
  totalReports: string;
  resolvedReports: string;
  exemplaryReports: string;
  anonymousExcludedNote: string;
  noReportsYet: string;
  historyLoadFailed: string;
  exemplaryBadge: string;

  // 심각도 / 상태 (내 이력 화면 표시용)
  severityLow: string;
  severityMedium: string;
  severityHigh: string;
  statusUnclassified: string;
  statusAnalyzing: string;
  statusResolved: string;

  // 음성 인식 오류
  errPermission: string;
  errNoSpeech: string;
  errNetwork: string;
  errAudioCapture: string;
  errUnknown: string;
  errNoResult: string;
  errStartFailed: string;
  errUnsupported: string;
}

const ko: Dictionary = {
  appEyebrow: "아차사고 신고",
  change: "변경",

  landingTitle: "아차사고, 놓치지 않습니다",
  landingSubtitle1: "작은 신호가 큰 사고를 막습니다.",
  landingSubtitle2: "역할을 선택해 프로토타입을 확인하세요.",
  workerCardTitle: "작업자 화면",
  workerCardDesc: "3초 음성 리포팅 (모바일)",
  adminCardTitle: "관리자 대시보드",
  adminCardDesc: "분석 · 예측 (데스크탑)",

  registerTitle: "먼저 본인 확인을 해주세요",
  registerDesc1: "신고 건수를 집계해 포상에 반영하기 위해 사번이 필요합니다.",
  registerDesc2: "이 기기에서 한 번만 입력하면 다음부터는 묻지 않습니다.",
  employeeIdPlaceholder: "사번 (예: 10231)",
  namePlaceholder: "이름",
  start: "시작하기",
  checking: "확인 중…",
  registerFooter: "신고 내용은 관리자에게 전달되며, 개별 신고 건마다 익명으로 낼 수도 있습니다.",
  registerFailed: "등록에 실패했습니다.",

  reportingAs: "님으로 신고합니다",
  myReports: "내 신고 이력",

  reportTitle: "지금 본 위험, 3초면 됩니다",
  micUnsupportedTitle: "이 브라우저는 음성 인식을 지원하지 않아요",
  micUnsupportedDesc:
    "Chrome 또는 Edge 브라우저로 열어주시면 음성으로 바로 신고할 수 있습니다. 지금은 아래 칸에 직접 입력해주세요.",
  reportContent: "신고 내용",
  viaVoiceOrType: "(음성 인식 또는 직접 입력)",
  viaTypeOnly: "(직접 입력)",
  contentPlaceholder: "마이크로 말하거나, 여기에 직접 입력하세요",
  recognizing: "인식 중…",
  pressToSpeak: "눌러서 말하기",
  listening: "듣고 있어요…",
  pressHint: "3초면 충분합니다.\n무엇을 보셨는지 편하게 말해주세요.",
  listeningHint: "위험 상황을 말씀해 주세요.\n다시 누르면 종료됩니다.",
  selectZone: "지금 계신 구역을 선택하세요",
  takePhoto: "현장 사진 촬영",
  retakePhoto: "사진 다시 찍기",
  deletePhoto: "사진 삭제",
  submit: "제출하기",
  submitting: "제출 중…",
  submitFailed: "제출 중 오류가 발생했습니다.",
  anonymousLabel: "이번 건은 익명으로 신고",
  anonymousOn: "사번이 저장되지 않습니다. 포상 집계에서 제외됩니다.",
  anonymousOff: "말하기 껄끄러운 내용이라면 익명으로 낼 수 있습니다 (포상 집계 제외).",

  submitDone: "보고 완료",
  receiptNo: "접수번호",
  deliveredToManager: "안전관리자에게 전달되었습니다",

  backToReport: "신고 화면으로",
  myReportsTitle: "내 신고 이력",
  notRegistered: "아직 사번이 등록되지 않았습니다.",
  registerFirst: "신고 화면에서 먼저 본인 확인을 해주세요.",
  loading: "불러오는 중…",
  totalReports: "누적 신고",
  resolvedReports: "조치완료",
  exemplaryReports: "우수 신고",
  anonymousExcludedNote: "익명으로 제출한 신고는 이 목록과 포상 집계에 포함되지 않습니다.",
  noReportsYet: "아직 기명으로 접수한 신고가 없습니다.",
  historyLoadFailed: "이력을 불러오지 못했습니다.",
  exemplaryBadge: "우수 신고",

  severityLow: "경미",
  severityMedium: "주의",
  severityHigh: "위험",
  statusUnclassified: "미분류",
  statusAnalyzing: "분석중",
  statusResolved: "조치완료",

  errPermission:
    "마이크 권한이 거부되었습니다. 브라우저 주소창의 자물쇠/카메라 아이콘에서 마이크 권한을 허용해주세요.",
  errNoSpeech: "음성이 감지되지 않았습니다. 마이크에 조금 더 가까이서 다시 말씀해주세요.",
  errNetwork:
    "네트워크 문제로 음성 인식 서버에 연결하지 못했습니다. 학교/회사 네트워크가 막고 있을 수 있어요. (직접 입력해주세요)",
  errAudioCapture: "마이크를 찾을 수 없습니다. 마이크가 연결되어 있는지 확인해주세요.",
  errUnknown: "음성 인식 중 오류가 발생했습니다. 직접 입력해주세요.",
  errNoResult: "음성을 인식하지 못했습니다. 네트워크 상태를 확인하시거나 아래 칸에 직접 입력해주세요.",
  errStartFailed: "음성 인식을 시작하지 못했습니다. 잠시 후 다시 시도해주세요.",
  errUnsupported: "이 브라우저에서는 음성 인식을 사용할 수 없습니다.",
};

const en: Dictionary = {
  appEyebrow: "Near-miss report",
  change: "Change",

  landingTitle: "Never miss a near-miss",
  landingSubtitle1: "Small signals prevent big accidents.",
  landingSubtitle2: "Choose a role to explore the prototype.",
  workerCardTitle: "Worker screen",
  workerCardDesc: "3-second voice reporting (mobile)",
  adminCardTitle: "Manager dashboard",
  adminCardDesc: "Analysis & prediction (desktop)",

  registerTitle: "Please identify yourself first",
  registerDesc1: "Your employee ID is needed to count your reports for the reward program.",
  registerDesc2: "Enter it once on this device and you won't be asked again.",
  employeeIdPlaceholder: "Employee ID (e.g. 10231)",
  namePlaceholder: "Name",
  start: "Get started",
  checking: "Checking…",
  registerFooter:
    "Reports go to the safety manager. You can still submit any individual report anonymously.",
  registerFailed: "Registration failed.",

  reportingAs: "is reporting",
  myReports: "My reports",

  reportTitle: "Saw a hazard? It takes 3 seconds",
  micUnsupportedTitle: "This browser doesn't support speech recognition",
  micUnsupportedDesc:
    "Open this page in Chrome or Edge to report by voice. For now, please type in the box below.",
  reportContent: "Report",
  viaVoiceOrType: "(speak or type)",
  viaTypeOnly: "(type)",
  contentPlaceholder: "Speak into the mic, or type here",
  recognizing: "Listening…",
  pressToSpeak: "Tap to speak",
  listening: "Listening…",
  pressHint: "Three seconds is enough.\nJust tell us what you saw.",
  listeningHint: "Describe the hazard.\nTap again to stop.",
  selectZone: "Select your current zone",
  takePhoto: "Take a photo",
  retakePhoto: "Retake photo",
  deletePhoto: "Delete photo",
  submit: "Submit",
  submitting: "Submitting…",
  submitFailed: "Something went wrong while submitting.",
  anonymousLabel: "Submit this one anonymously",
  anonymousOn: "Your employee ID will not be saved. Excluded from the reward count.",
  anonymousOff: "If it's hard to speak up, you can report anonymously (not counted for rewards).",

  submitDone: "Report submitted",
  receiptNo: "Ref. no.",
  deliveredToManager: "Sent to the safety manager",

  backToReport: "Back to reporting",
  myReportsTitle: "My reports",
  notRegistered: "No employee ID registered yet.",
  registerFirst: "Please identify yourself on the reporting screen first.",
  loading: "Loading…",
  totalReports: "Total",
  resolvedReports: "Resolved",
  exemplaryReports: "Outstanding",
  anonymousExcludedNote:
    "Reports submitted anonymously are not shown here and are not counted for rewards.",
  noReportsYet: "You haven't submitted any named reports yet.",
  historyLoadFailed: "Could not load your reports.",
  exemplaryBadge: "Outstanding",

  severityLow: "Minor",
  severityMedium: "Caution",
  severityHigh: "Serious",
  statusUnclassified: "Unclassified",
  statusAnalyzing: "In review",
  statusResolved: "Resolved",

  errPermission:
    "Microphone access was denied. Allow the microphone from the lock/camera icon in the address bar.",
  errNoSpeech: "No speech detected. Please move closer to the microphone and try again.",
  errNetwork:
    "Could not reach the speech recognition server. Your network may be blocking it. (Please type instead.)",
  errAudioCapture: "No microphone found. Please check that a microphone is connected.",
  errUnknown: "Speech recognition failed. Please type instead.",
  errNoResult: "Couldn't recognize any speech. Check your connection or type in the box below.",
  errStartFailed: "Couldn't start speech recognition. Please try again in a moment.",
  errUnsupported: "Speech recognition isn't available in this browser.",
};

const vi: Dictionary = {
  appEyebrow: "Báo cáo suýt tai nạn",
  change: "Đổi",

  landingTitle: "Không bỏ sót sự cố suýt xảy ra",
  landingSubtitle1: "Tín hiệu nhỏ ngăn được tai nạn lớn.",
  landingSubtitle2: "Chọn vai trò để xem bản thử nghiệm.",
  workerCardTitle: "Màn hình công nhân",
  workerCardDesc: "Báo cáo bằng giọng nói trong 3 giây (di động)",
  adminCardTitle: "Bảng điều khiển quản lý",
  adminCardDesc: "Phân tích & dự báo (máy tính)",

  registerTitle: "Vui lòng xác nhận danh tính",
  registerDesc1: "Cần mã số nhân viên để tính số lần báo cáo cho chương trình khen thưởng.",
  registerDesc2: "Chỉ cần nhập một lần trên thiết bị này, lần sau sẽ không hỏi lại.",
  employeeIdPlaceholder: "Mã số nhân viên (VD: 10231)",
  namePlaceholder: "Họ và tên",
  start: "Bắt đầu",
  checking: "Đang kiểm tra…",
  registerFooter:
    "Báo cáo sẽ được gửi cho quản lý an toàn. Bạn vẫn có thể gửi ẩn danh từng báo cáo.",
  registerFailed: "Đăng ký không thành công.",

  reportingAs: "đang báo cáo",
  myReports: "Báo cáo của tôi",

  reportTitle: "Thấy nguy hiểm? Chỉ mất 3 giây",
  micUnsupportedTitle: "Trình duyệt này không hỗ trợ nhận dạng giọng nói",
  micUnsupportedDesc:
    "Hãy mở bằng Chrome hoặc Edge để báo cáo bằng giọng nói. Hiện tại, vui lòng nhập vào ô bên dưới.",
  reportContent: "Nội dung báo cáo",
  viaVoiceOrType: "(nói hoặc nhập)",
  viaTypeOnly: "(nhập tay)",
  contentPlaceholder: "Nói vào micro, hoặc nhập tại đây",
  recognizing: "Đang nhận dạng…",
  pressToSpeak: "Nhấn để nói",
  listening: "Đang nghe…",
  pressHint: "Ba giây là đủ.\nHãy kể lại điều bạn vừa thấy.",
  listeningHint: "Hãy mô tả tình huống nguy hiểm.\nNhấn lại để kết thúc.",
  selectZone: "Chọn khu vực bạn đang đứng",
  takePhoto: "Chụp ảnh hiện trường",
  retakePhoto: "Chụp lại ảnh",
  deletePhoto: "Xóa ảnh",
  submit: "Gửi báo cáo",
  submitting: "Đang gửi…",
  submitFailed: "Đã xảy ra lỗi khi gửi.",
  anonymousLabel: "Gửi báo cáo này ẩn danh",
  anonymousOn: "Mã số nhân viên sẽ không được lưu. Không tính vào khen thưởng.",
  anonymousOff: "Nếu khó nói ra, bạn có thể báo cáo ẩn danh (không tính khen thưởng).",

  submitDone: "Đã gửi báo cáo",
  receiptNo: "Mã tiếp nhận",
  deliveredToManager: "Đã chuyển đến quản lý an toàn",

  backToReport: "Quay lại màn hình báo cáo",
  myReportsTitle: "Báo cáo của tôi",
  notRegistered: "Chưa đăng ký mã số nhân viên.",
  registerFirst: "Vui lòng xác nhận danh tính ở màn hình báo cáo trước.",
  loading: "Đang tải…",
  totalReports: "Tổng số",
  resolvedReports: "Đã xử lý",
  exemplaryReports: "Báo cáo xuất sắc",
  anonymousExcludedNote:
    "Báo cáo gửi ẩn danh không hiển thị ở đây và không được tính vào khen thưởng.",
  noReportsYet: "Bạn chưa gửi báo cáo nào có ghi danh.",
  historyLoadFailed: "Không tải được lịch sử báo cáo.",
  exemplaryBadge: "Xuất sắc",

  severityLow: "Nhẹ",
  severityMedium: "Chú ý",
  severityHigh: "Nguy hiểm",
  statusUnclassified: "Chưa phân loại",
  statusAnalyzing: "Đang phân tích",
  statusResolved: "Đã xử lý",

  errPermission:
    "Quyền truy cập micro bị từ chối. Hãy cho phép micro ở biểu tượng ổ khóa/camera trên thanh địa chỉ.",
  errNoSpeech: "Không phát hiện giọng nói. Hãy lại gần micro và thử lại.",
  errNetwork:
    "Không kết nối được máy chủ nhận dạng giọng nói. Mạng của bạn có thể đang chặn. (Vui lòng nhập tay.)",
  errAudioCapture: "Không tìm thấy micro. Hãy kiểm tra micro đã được kết nối chưa.",
  errUnknown: "Nhận dạng giọng nói thất bại. Vui lòng nhập tay.",
  errNoResult: "Không nhận dạng được giọng nói. Kiểm tra kết nối hoặc nhập vào ô bên dưới.",
  errStartFailed: "Không thể bắt đầu nhận dạng giọng nói. Vui lòng thử lại sau.",
  errUnsupported: "Trình duyệt này không dùng được nhận dạng giọng nói.",
};

const DICTIONARIES: Record<Lang, Dictionary> = { ko, en, vi };

export function getDictionary(lang: Lang): Dictionary {
  return DICTIONARIES[lang] ?? ko;
}

/**
 * 공장 구역명 번역.
 * 구역 ID는 DB에 저장되는 값이므로 그대로 두고, 표시용 이름만 언어별로 제공한다.
 * 외국인 작업자가 자기 위치를 정확히 고를 수 있어야 신고 데이터의 품질이 유지된다.
 */
export const ZONE_LABELS: Record<Lang, Record<string, string>> = {
  ko: {
    A1: "A동 · 원자재 하역장",
    A2: "A동 · 프레스 라인",
    A3: "A동 · 용접 구역",
    B1: "B동 · 조립 라인 1",
    B2: "B동 · 조립 라인 2",
    B3: "B동 · 도장 부스",
    C1: "C동 · 물류 통로",
    C2: "C동 · 지게차 동선",
    C3: "C동 · 출하 검수장",
  },
  en: {
    A1: "Bldg A · Raw material unloading",
    A2: "Bldg A · Press line",
    A3: "Bldg A · Welding area",
    B1: "Bldg B · Assembly line 1",
    B2: "Bldg B · Assembly line 2",
    B3: "Bldg B · Paint booth",
    C1: "Bldg C · Logistics aisle",
    C2: "Bldg C · Forklift route",
    C3: "Bldg C · Shipping inspection",
  },
  vi: {
    A1: "Tòa A · Bãi dỡ nguyên liệu",
    A2: "Tòa A · Dây chuyền dập",
    A3: "Tòa A · Khu vực hàn",
    B1: "Tòa B · Dây chuyền lắp ráp 1",
    B2: "Tòa B · Dây chuyền lắp ráp 2",
    B3: "Tòa B · Buồng sơn",
    C1: "Tòa C · Lối đi kho vận",
    C2: "Tòa C · Đường xe nâng",
    C3: "Tòa C · Khu kiểm hàng xuất",
  },
};

export function getZoneLabel(lang: Lang, zoneId: string, fallback: string): string {
  return ZONE_LABELS[lang]?.[zoneId] ?? fallback;
}

/** DB에 저장된 한국어 심각도/상태 값을 화면 표시용으로 번역 */
export function translateSeverity(lang: Lang, severity: string): string {
  const d = getDictionary(lang);
  if (severity === "low") return d.severityLow;
  if (severity === "medium") return d.severityMedium;
  return d.severityHigh;
}

export function translateStatus(lang: Lang, status: string): string {
  const d = getDictionary(lang);
  if (status === "미분류") return d.statusUnclassified;
  if (status === "분석중") return d.statusAnalyzing;
  return d.statusResolved;
}
