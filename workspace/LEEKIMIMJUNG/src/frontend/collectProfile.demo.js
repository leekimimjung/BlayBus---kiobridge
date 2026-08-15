// 조은빛, 여윤우 담당
/**
 * STEP 1 — collectProfile
 *
 * 목적:
 *   사용자에게서 정보를 받습니다. 이 단계가 여러분 서비스의 얼굴입니다.
 *
 * 입력:
 *   없음 (여러분의 UI·음성·QR·챗봇이 알아서 수집)
 *
 * 반환:
 *   RawUserInput — 형식 자유. 다음 단계에서 공식 형식으로 옮깁니다.
 *
 * 반드시:
 *   - 로그인 없이도 기본 기능이 동작할 것 (비회원으로 시작 경로 필수)
 *   - 자동으로 불러온 값은 화면에 보여주고 확인받을 것
 *   - "확인" 버튼 없이 자동으로 다음 화면으로 넘어가지 않을 것
 *
 * 금지:
 *   - 회원가입 강제
 *   - 실제 주민등록번호·전화번호·카드번호 수집
 *   - 사용자가 말하지 않은 값을 채워 넣기
 *
 * 관련 오류:
 *   PERSONAL_DATA_NOT_ALLOWED
 *
 * 완료 확인:
 *   npm run participant:progress
 */
// ══════════════════════════════════════════════════════════════
// 선택지 데이터 — 값은 공식 enum(docs/ENUM_REFERENCE.md)을 그대로 씁니다.
// STEP 2(mapToCanonicalInput)가 enum 값으로 옮기기 쉽도록 하기 위함.
// ══════════════════════════════════════════════════════════════
/** 나에게 맞는 설정 — 지원 모드. 공황장애는 쉬운 문장/차분한 안내(SIMPLE_STEPS)로 받습니다. */
export const ACCESSIBILITY_SETTINGS = [
    { key: "LARGE_TEXT", title: "글씨 크게", desc: "글씨를 크게 보여드려요", icon: "Aa" },
    { key: "VOICE_GUIDANCE", title: "음성 안내", desc: "음성으로 안내해 드려요", icon: "🔊" },
    { key: "VISUAL_GUIDANCE", title: "시각 안내", desc: "그림·아이콘으로 알기 쉽게 안내해 드려요", icon: "👁️" },
    { key: "GUARDIAN_MODE", title: "보호자와 함께 왔어요", desc: "보호자 동행 안내를 준비해 드릴게요", icon: "👪" },
    { key: "HIGH_CONTRAST", title: "고대비 모드", desc: "글을 조금 더 뚜렷하게 볼 수 있어요", icon: "◐" },
    { key: "EASY_MODE", title: "쉬운 모드", desc: "선택지마다 쉬운 설명을 보여드려요", icon: "☀️" },
    { key: "SIMPLE_STEPS", title: "공황장애를 겪고 있어요", desc: "차분하고 천천히 안내해 드릴게요", icon: "💙" },
    { key: "STAFF_HELP", title: "직원 도움 선호", desc: "직원이 함께 도와드릴 수 있게 안내해 드려요", icon: "🙋" },
];
/** 글자 크기 선택지 — "글씨 크게" 카드를 누르면 펼쳐지는 3단계. */
export const FONT_SCALES = [
    { value: "NORMAL", label: "보통" },
    { value: "LARGE", label: "크게" },
    { value: "XLARGE", label: "아주 크게" },
];
/** 글자 크기 단계별 실제 폰트 크기 — 보통은 일반 크기, 크게는 조금 더, 아주 크게는 좀 더. */
export const FONT_SCALE_PX = {
    NORMAL: 15,
    LARGE: 17,
    XLARGE: 19,
};
/** 예약 여부 — appointmentStatus enum */
export const APPOINTMENT_STATUSES = [
    { value: "HAS_APPOINTMENT", title: "예약했어요", desc: "예약하신 일정으로 빠르게 안내할게요", icon: "📅" },
    { value: "NO_APPOINTMENT", title: "예약 안 했어요 / 모르겠어요", desc: "접수 데스크에서 확인해 드릴게요", icon: "🚶" },
];
/** 방문 유형 — 초진/재진. visitType enum 값 사용. */
export const VISIT_TYPES = [
    { value: "FIRST_VISIT", title: "초진이에요", desc: "첫 방문이라면 안내를 자세하게 해드려요", icon: "🌱" },
    { value: "REVISIT", title: "재진이에요", desc: "이전 방문 기록을 바탕으로 안내해 드려요", icon: "🔄" },
];
/** 진료과 추천 — 실제 서비스에서는 STEP 4·5(recommend)가 만들어 준 결과를 보여줍니다. */
export const RECOMMENDED_DEPARTMENT = {
    value: "ORTHOPEDICS",
    title: "정형외과",
    desc: "추천 — 방문 정보를 바탕으로 안내했어요",
};
/**
 * 진료과 직접 선택지 — "다른 진료과를 선택할래요"를 고르면 나오는 목록 (2열).
 * 🏥 병원 환경의 실제 진료과 10개를 그대로 보여줍니다.
 * 🚨 단, 제출용 departmentId 스키마는 공식 6개만 허용합니다 (docs/ENUM_REFERENCE.md).
 * 화면 값(예: NEUROLOGY)은 그대로 두고, 제출 직전에 toOfficialDepartmentId() 로
 * 스키마에 없는 과는 UNSPECIFIED(일반 안내)로 매핑합니다 (증상으로 진료과 추론 금지).
 */
export const DEPARTMENTS = [
    { value: "INTERNAL_MEDICINE", title: "내과" },
    { value: "NEUROLOGY", title: "신경과" },
    { value: "PSYCHIATRY", title: "정신건강의학과" },
    { value: "SURGERY", title: "외과" },
    { value: "ORTHOPEDICS", title: "정형외과" },
    { value: "OBSTETRICS_AND_GYNECOLOGY", title: "산부인과" },
    { value: "PEDIATRICS", title: "소아청소년과" },
    { value: "OPHTHALMOLOGY", title: "안과" },
    { value: "ENT", title: "이비인후과" },
    { value: "DERMATOLOGY", title: "피부과" },
    { value: "UNSPECIFIED", title: "잘 모르겠어요" },
];

/** 제출용 공식 departmentId enum 값 (docs/ENUM_REFERENCE.md). 스키마에 없는 값은 UNSPECIFIED 로 폴백합니다. */
export const OFFICIAL_DEPARTMENT_IDS = ["INTERNAL_MEDICINE", "ORTHOPEDICS", "ENT", "RADIOLOGY", "HEALTH_SCREENING", "UNSPECIFIED"];
export function toOfficialDepartmentId(departmentId) {
    return OFFICIAL_DEPARTMENT_IDS.includes(departmentId) ? departmentId : "UNSPECIFIED";
}
// ══════════════════════════════════════════════════════════════
// 공통 UI 헬퍼 — 같은 폴더의 style.css 클래스를 그대로 재사용합니다.
// ══════════════════════════════════════════════════════════════
const header = () => `
  <header class="status-bar">
    <div class="brand"><span class="brand-mark">${heroMarkSvg}</span><strong>은빛 병원</strong></div>
    <div class="clock"><small>6월 15일</small> <strong>3:36</strong></div>
  </header>`;
const progress = (current) => `
  <div class="progress" aria-label="진행 단계 ${current + 1}/5">
    ${Array.from({ length: 5 }, (_, index) => `<span class="${index <= current ? "active" : ""}"></span>`).join("")}
  </div>`;
/** 단일 선택 카드 (예약 여부 / 초진·재진 / 진료과 목록) — 체크박스 선택 표시. */
const choiceCard = (group, value, title, desc, selected) => `
  <button type="button" class="dept-card ${selected ? "is-selected" : ""}" data-group="${group}" data-value="${value}">
    <span class="dept-checkbox" aria-hidden="true">${selected ? "✓" : ""}</span>
    <span class="dept-copy">
      <span class="dept-title">${title}</span>
      ${desc ? `<span class="dept-hint">${desc}</span>` : ""}
    </span>
  </button>`;
/** 복수 선택 카드 (나에게 맞는 설정) — 체크박스 선택 표시. showDesc=false면 작은 설명을 숨깁니다(쉬운 모드). */
const settingCard = (key, title, desc, checked, showDesc = true) => `
  <button type="button" class="dept-card ${checked ? "is-selected" : ""}" data-setting="${key}" aria-pressed="${checked}">
    <span class="dept-checkbox" aria-hidden="true">${checked ? "✓" : ""}</span>
    <span class="dept-copy">
      <span class="dept-title">${title}</span>
      ${showDesc && desc ? `<span class="dept-hint">${desc}</span>` : ""}
    </span>
  </button>`;
/** "글씨 크게"를 누르면 펼쳐지는 보통/크게/아주 크게 3단계 선택지. */
const fontScaleRowHTML = (scale) => `
  <div class="fontsize-inline block" role="group" aria-label="글자 크기 선택">
    <span class="fontsize-inline-label">글자 크기</span>
    <div class="fontsize-inline-options">
      ${FONT_SCALES.map((o) => `
        <button type="button" class="fontsize-chip ${scale === o.value ? "is-selected" : ""}" data-font-scale="${o.value}">${o.label}</button>
      `).join("")}
    </div>
  </div>`;
const nextButton = (label, enabled, simple = false) => `
  <footer class="bottom-actions">
    ${simple ? restButton() : ""}
    <button type="button" class="primary-action ${enabled ? "" : "is-disabled"}" data-action="next" ${enabled ? "" : "disabled"}>${label}</button>
  </footer>`;
const nextWithSkipButton = (label, enabled, simple = false) => `
  <footer class="bottom-actions">
    ${simple ? restButton() : ""}
    <div class="bottom-row">
      <button type="button" class="secondary-action" data-action="skip">건너뛰기</button>
      <button type="button" class="primary-action ${enabled ? "" : "is-disabled"}" data-action="next" ${enabled ? "" : "disabled"}>${label}</button>
    </div>
  </footer>`;
const shell = (content) => `${header()}<div class="page">${content}</div>`;
// ══════════════════════════════════════════════════════════════
// 공황장애(SIMPLE_STEPS) 모드 — 차분한 안내 공통 조각
// ══════════════════════════════════════════════════════════════
/** 공황장애 모드일 때 하단에 항상 붙는 "잠시 쉬기" 버튼. */
const restButton = () => `
  <button type="button" class="rest-btn" data-action="pause">잠시 쉬기</button>`;
/** 공황장애 모드일 때 질문 화면 상단에 표시하는 배지. */
const calmPill = (simple) => (simple ? '<span class="pill pill-calm">💙 차분한 안내</span>' : "");
/** 공황장애 모드일 때 질문 화면에 붙는 안심 문구 — 서두르지 않아도 된다는 메시지. */
const calmNote = (simple) => simple ? '<p class="calm-note">천천히 하셔도 돼요.<br />언제든 잠시 쉬실 수 있어요.</p>' : "";
/** 공황장애 모드에서 pill 행 우측에 붙는 "이전 페이지로 돌아가기" 링크 — 눌러서 이전 화면으로 돌아갑니다. */
const backLink = (simple) => simple ? '<button type="button" class="back-link-text" data-action="back">이전 페이지로 돌아가기</button>' : "";
/** 뒤로가기 시그널 — 화면 함수가 이전 화면으로 돌아가도록 collectProfile(플로우 컨트롤러)에게 알립니다. */
export const BACK = Symbol("BACK");
/**
 * "잠시 쉬기"를 누르면 나오는 차분한 화면.
 * 호흡 가이드 + 안심 문구 + 자발적 직원 호출(강제가 아니라 선택지).
 */
export const pauseScreenHTML = (staffAsked = false) => `
  <section class="screen pause-screen">
    <div class="breathe" aria-hidden="true"></div>
    <h1 class="title-lg">잠시 쉬어도<br />괜찮아요</h1>
    <p class="subtitle">원이 커지면 천천히 들이마시고,<br />작아지면 천천히 내쉬어 보세요.</p>
    ${staffAsked
        ? '<p class="staff-reassure">직원이 곧 도와드릴게요.<br />조금만 기다려 주세요.</p>'
        : '<button type="button" class="secondary-action" data-action="staff-ask">괜찮으시면 직원을 부를 수 있어요</button>'}
  </section>
  <footer class="bottom-actions">
    <button type="button" class="primary-action" data-action="resume">계속하기</button>
  </footer>`;
const staffIconSmall = `
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M18 16.5c0 .6-.5 1-1 1a13 13 0 0 1-9.3-3.8A13 13 0 0 1 4 4.5c0-.5.4-1 1-1h2.2c.5 0 .9.3 1 .8l.8 3c.1.5 0 .9-.3 1.2l-1.1 1.1a10.4 10.4 0 0 0 4 4l1.1-1.1c.3-.3.7-.4 1.2-.3l3 .8c.5.1.8.5.8 1V16.5z" fill="#868686"/>
  </svg>`;
/** 웰컴 화면 로고 — 모서리가 접힌 "H" 마크. 브랜드 색상 토큰(--brand) 재사용. */
export const heroMarkSvg = `
  <svg viewBox="0 0 300 300" role="img" aria-hidden="true" focusable="false">
    <defs>
      <filter id="heroShadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="5" dy="0" stdDeviation="3" flood-opacity="0.2"/>
      </filter>
    </defs>
    <rect x="50" y="40" width="45" height="220" fill="var(--brand)" rx="3" filter="url(#heroShadow)"/>
    <path d="M 205 60 L 250 40 L 250 260 L 205 260 L 205 180 L 95 180 L 95 135 L 205 135 Z" fill="var(--brand)" filter="url(#heroShadow)"/>
  </svg>`;
// ══════════════════════════════════════════════════════════════
// 화면 HTML 빌더 (순수 함수 — 테스트에서도 확인 가능)
// ══════════════════════════════════════════════════════════════
/** 메인 화면 — 병원 이니셜(H) + "안아프게 해 드릴게요" 문구. Figma 시안 느낌 적용. */
export function loginChoiceScreenHTML() {
    return `
  <section class="screen welcome-screen">
    <div class="hero-mark" aria-hidden="true">${heroMarkSvg}</div>
    <p class="camera-caption">“안아프게 해 드릴게요”</p>
    <div class="auth-panel">
      <button type="button" class="auth-login" data-choice="auth">로그인 / 회원가입 하기</button>
      <button type="button" class="guest" data-choice="guest">비회원으로 시작하기</button>
      <button type="button" class="staff-help-link" data-action="staff">${staffIconSmall}도움이 필요하시면 직원을 호출해주세요</button>
    </div>
  </section>`;
}
/** QR 로그인/회원가입 화면 — "로그인 / 회원가입 하기"를 누르면 나옵니다. */
export function qrAuthScreenHTML() {
    return `
  <section class="screen form-screen cp-screen">
    <button type="button" class="back-link" data-action="back" aria-label="메인으로 돌아가기">‹</button>
    <h1 class="title-lg">QR코드로<br />로그인/회원가입</h1>
    <p class="qr-subtitle">로그인과 회원가입이 한번에 가능해요.</p>
    <div class="qr-box" role="img" aria-label="QR 코드 인식 영역"></div>
  </section>${nextButton("완료", true)}`;
}
/** 직원 호출 안내 오버레이 — 로그인 화면에서 "직원을 호출해주세요"를 누르면 표시됩니다. */
export const staffAlertOverlayHTML = () => `
  <div class="staff-overlay" role="dialog" aria-modal="true" aria-label="직원 호출 안내">
    <div class="staff-panel">
      <span class="staff-icon" aria-hidden="true">!</span>
      <h2>직원을 호출했어요</h2>
      <p>잠시만 기다려 주시면<br />직원이 도와드릴게요</p>
      <button type="button" data-action="staff-close" data-autofocus>확인</button>
    </div>
  </div>`;
/**
 * 나에게 맞는 설정 — 글씨 크게(누르면 보통/크게/아주 크게 3단계 펼침) /
 * 음성 안내 / 보호자 동행 / 공황장애 4개 복수 선택.
 * 로그인 사용자는 제목이 "전에 하신 설정이 맞는지 확인해 주세요"로 바뀝니다.
 */
export function accessibilityScreenHTML(state = {}, expanded = false, loggedIn = false) {
    const ready = ACCESSIBILITY_SETTINGS.some((s) => !!state[s.key]);
    const easy = !!state["EASY_MODE"];
    const simple = !!state["SIMPLE_STEPS"];
    const scale = (state.fontScale ?? "NORMAL");
    const title = loggedIn
        ? "전에 하신 설정이 맞는지<br />확인해 주세요"
        : "편하신 방식을<br />골라주세요";
    return `
  ${progress(0)}
  <section class="screen form-screen cp-screen">
    ${simple ? `<div class="pill-row">${backLink(simple)}</div>` : ""}
    <h1 class="title-lg">${title}</h1>
    <p class="subtitle">여러 개를 함께 선택할 수 있어요</p>
    ${ACCESSIBILITY_SETTINGS.map((s) => s.key === "LARGE_TEXT"
        ? `${settingCard(s.key, s.title, s.desc, !!state[s.key], easy)}${expanded ? fontScaleRowHTML(scale) : ""}`
        : settingCard(s.key, s.title, s.desc, !!state[s.key], easy)).join("")}
  </section>${nextWithSkipButton("완료", ready)}`;
}
/**
 * 공황장애 모드에서 "완료"를 누를 때 확인하는 안심 모달.
 * "잘못 누르더라도 이전 페이지로 다시 돌아갈 수 있어요" — 천천히 진행해도 된다는 안내.
 */
export function proceedConfirmOverlayHTML() {
    return `
  <div class="confirm-overlay" role="dialog" aria-modal="true" aria-label="다음 페이지로 넘어가시겠어요?">
    <div class="confirm-panel">
      <button type="button" class="confirm-close" data-action="confirm-close" aria-label="닫기">✕</button>
      <h2>다음 페이지로<br />넘어가시겠어요?</h2>
      <div class="confirm-actions">
        <button type="button" class="confirm-no" data-action="confirm-no">아니요</button>
        <button type="button" class="confirm-yes" data-action="confirm-yes" data-autofocus>네</button>
      </div>
      <p class="confirm-note">잘못 누르더라도<br />이전 페이지로 다시 돌아갈 수 있어요</p>
    </div>
  </div>`;
}
/** 예약 여부 확인 화면 */
export function reservationScreenHTML(selected, settings = {}) {
    const voice = !!settings["VOICE_GUIDANCE"];
    const simple = !!settings["SIMPLE_STEPS"];
    const easy = !!settings["EASY_MODE"];
    return `
  ${progress(1)}
  <section class="screen form-screen cp-screen">
    <div class="pill-row">
      ${voice ? '<span class="pill pill-voice">음성 안내 모드</span>' : ""}
      ${calmPill(simple)}
      ${backLink(simple)}
    </div>
    <h1 class="title-lg">예약하고<br />오셨나요?</h1>
    <p class="subtitle">예약 여부에 따라 안내가 달라져요</p>
    ${calmNote(simple)}
    ${APPOINTMENT_STATUSES.map((o) => choiceCard("appointmentStatus", o.value, o.title, easy ? o.desc : "", selected === o.value)).join("")}
  </section>${nextButton("다음", selected !== "", simple)}`;
}
/** 방문 유형 확인 화면 — 초진/재진 */
export function visitTypeScreenHTML(selected, settings = {}) {
    const simple = !!settings["SIMPLE_STEPS"];
    const easy = !!settings["EASY_MODE"];
    return `
  ${progress(2)}
  <section class="screen form-screen cp-screen">
    <div class="pill-row">${calmPill(simple)}${backLink(simple)}</div>
    <h1 class="title-lg">오늘 진료,<br />초진인가요 재진인가요?</h1>
    <p class="subtitle">초진이면 안내를 더 자세하게 해드려요</p>
    ${calmNote(simple)}
    ${VISIT_TYPES.map((o) => choiceCard("visitType", o.value, o.title, easy ? o.desc : "", selected === o.value)).join("")}
  </section>${nextButton("다음", selected !== "", simple)}`;
}
/**
 * 진료과 선택(추천) 화면 — Figma 시안(진료과 추천) 적용.
 * 추천 진료과 카드 + "다른 진료과를 선택할래요" 카드 2개 선택지.
 * 설정에서 음성 안내를 켰으면 "음성 안내 모드" 필을 표시합니다. 증상은 묻지 않습니다.
 * @param recommended STEP5(recommend)/STEP6(explainRecommendation)가 실제로 계산한 결과.
 *   생략하면 RECOMMENDED_DEPARTMENT를 기본값으로 씁니다.
 */
export function departmentChoiceHTML(selected, settings = {}, recommended = {
    candidateId: RECOMMENDED_DEPARTMENT.value,
    title: RECOMMENDED_DEPARTMENT.title,
    department: RECOMMENDED_DEPARTMENT.title,
    floor: "2층 · 정형외과 접수 데스크",
    reasons: [],
}) {
    const voice = !!settings["VOICE_GUIDANCE"];
    const staff = !!settings["STAFF_HELP"];
    const visual = !!settings["VISUAL_GUIDANCE"];
    const simple = !!settings["SIMPLE_STEPS"];
    const reason = recommended.reasons.length > 0
        ? recommended.reasons.join("<br />") + "<br />다르다면 아래에서 직접 선택할 수 있어요."
        : "입력하신 정보를 바탕으로 안내해 드려요.<br />다르다면 아래에서 직접 선택할 수 있어요.";
    return `
  ${progress(3)}
  <section class="screen form-screen cp-screen">
    <div class="pill-row">
      ${voice ? '<span class="pill pill-voice">음성 안내 모드</span>' : ""}
      ${staff ? '<span class="pill pill-staff">직원 도움 안내</span>' : ""}
      ${visual ? '<span class="pill pill-visual">시각 안내 모드</span>' : ""}
      ${calmPill(simple)}
      <span class="pill pill-acc">추천 정확도 높음</span>
      ${backLink(simple)}
    </div>
    <h1 class="title-lg">${recommended.department}로<br />안내해 드릴게요</h1>
    ${calmNote(simple)}
    <div class="q-card">
      <strong>왜 ${recommended.department}인가요?</strong>
      <p>${reason}</p>
    </div>
    <button type="button" class="dept-card ${selected === recommended.candidateId ? "is-selected" : ""}" data-group="department" data-value="${recommended.candidateId}">
      <span class="dept-checkbox" aria-hidden="true">${selected === recommended.candidateId ? "✓" : ""}</span>
      <span class="dept-copy">
        <span class="dept-title">${recommended.title}</span>
        <span class="dept-floor">${recommended.floor}</span>
        <span class="dept-hint">${staff ? "직원이 찾아와서 안내해 드릴게요" : "다음으로 넘어가면 길을 안내해 드려요"}</span>
      </span>
    </button>
    <button type="button" class="dept-card ${selected === "OTHER" ? "is-selected" : ""}" data-group="department" data-value="OTHER">
      <span class="dept-checkbox" aria-hidden="true">${selected === "OTHER" ? "✓" : ""}</span>
      <span class="dept-copy">
        <span class="dept-title">다른 진료과를 선택할래요</span>
        <span class="dept-hint">다음으로 넘어가 직접 진료과를 선택해 주세요</span>
      </span>
    </button>
  </section>${nextButton("다음", selected !== "", simple)}`;
}
/** 진료과 직접 선택 화면 — "다른 진료과를 선택할래요"를 고르면 공식 6개 진료과가 2열로 펼쳐집니다. */
export function departmentListScreenHTML(selected, settings = {}) {
    const simple = !!settings["SIMPLE_STEPS"];
    return `
  ${progress(3)}
  <section class="screen form-screen cp-screen">
    <button type="button" class="back-link" data-action="back" aria-label="이전으로 돌아가기">‹</button>
    <div class="pill-row">${calmPill(simple)}${backLink(simple)}</div>
    <h1 class="title-lg">진료과를<br />골라주세요</h1>
    <p class="subtitle">안내받을 진료과를 직접 선택해 주세요</p>
    ${calmNote(simple)}
    <div class="dept-grid">
      ${DEPARTMENTS.map((d) => choiceCard("department", d.value, d.title, "", selected === d.value)).join("")}
    </div>
  </section>${nextButton("다음", selected !== "", simple)}`;
}
// ══════════════════════════════════════════════════════════════
// DOM 연결 헬퍼
// ══════════════════════════════════════════════════════════════
/**
 * 렌더링할 요소를 찾습니다. 브라우저가 아닌 Node(예: participant:progress)에서
 * 호출되면 즉시 에러를 던져 멈추지 않게 합니다.
 */
function resolveMount() {
    if (typeof document === "undefined") {
        throw new Error("collectProfile: 브라우저 DOM 이 없어 수집 화면을 띄울 수 없습니다. " +
            "(npm run participant:progress 는 Node 에서 함수 실행 여부만 확인합니다. 실제 수집은 브라우저/키오스크에서 실행하세요.)");
    }
    return document.querySelector("#app") ?? document.body;
}
function focusFirst(mount) {
    const el = mount.querySelector("[data-autofocus]") ??
        mount.querySelector("button");
    if (el)
        el.focus();
}
function closestButton(target) {
    return target?.closest("button[data-value], button[data-setting], button[data-choice], button[data-action], button[data-font-scale]") ?? null;
}
/** 글자 크기 단계에 맞춰 전체 화면 글자를 키웁니다 (보통 15px / 크게 17px / 아주 크게 19px). */
function setFontScale(scale) {
    if (typeof document !== "undefined") {
        document.documentElement.style.fontSize = `${FONT_SCALE_PX[scale]}px`;
    }
}
/** 고대비 모드 — 글자가 더 뚜렷하게 보이도록 문서에 high-contrast 클래스를 켜고 끕니다. */
function setHighContrast(on) {
    if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("high-contrast", on);
    }
}
/** 공황장애 모드 — 화면 전환을 부드럽게(페이드) 하도록 문서에 simple-steps 클래스를 켜고 끕니다. */
function setSimpleSteps(on) {
    if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("simple-steps", on);
    }
}
/**
 * 공황장애(SIMPLE_STEPS) 모드 — "다음/완료"를 누를 때마다 진행 전 확인 모달을 띄웁니다.
 * "네" → true, "아니요"/닫기 → false 를 반환합니다.
 * "잘못 누르더라도 이전 페이지로 다시 돌아갈 수 있어요" — 천천히 진행해도 된다는 안심 안내.
 */
function askProceedConfirm(mount) {
    const wrap = document.createElement("div");
    wrap.innerHTML = proceedConfirmOverlayHTML();
    const overlay = wrap.firstElementChild;
    mount.appendChild(overlay);
    overlay.querySelector("[data-autofocus]")?.focus();
    return new Promise((resolve) => {
        const close = (value) => {
            overlay.remove();
            resolve(value);
        };
        overlay.querySelector('[data-action="confirm-yes"]')?.addEventListener("click", () => close(true));
        overlay.querySelector('[data-action="confirm-no"]')?.addEventListener("click", () => close(false));
        overlay.querySelector('[data-action="confirm-close"]')?.addEventListener("click", () => close(false));
    });
}
/** 공황장애 모드면 안심 확인 모달을 거친 뒤에 진행하고, 아니면 바로 진행합니다. */
function proceedIfConfirmed(mount, simple, onProceed) {
    if (!simple) {
        onProceed();
        return;
    }
    void askProceedConfirm(mount).then((ok) => {
        if (ok)
            onProceed();
    });
}
// ══════════════════════════════════════════════════════════════
// 컴포넌트 함수 — 화면을 띄우고 사용자 입력을 Promise 로 반환합니다.
// ══════════════════════════════════════════════════════════════
/** 메인 화면 — 로그인/회원가입(QR 화면으로 이동) / 비회원 시작 / 직원 호출. 개인정보는 수집하지 않습니다. */
async function renderLoginChoiceScreen() {
    const mount = resolveMount();
    let mode = "MAIN";
    let staffAlert = false;
    return new Promise((resolve) => {
        const draw = () => {
            const content = shell(mode === "MAIN" ? loginChoiceScreenHTML() : qrAuthScreenHTML());
            mount.innerHTML = staffAlert ? `${content}${staffAlertOverlayHTML()}` : content;
            focusFirst(mount);
        };
        function onClick(event) {
            const btn = closestButton(event.target);
            if (!btn)
                return;
            if (btn.dataset.action === "staff") {
                staffAlert = true;
                draw();
                return;
            }
            if (btn.dataset.action === "staff-close") {
                staffAlert = false;
                draw();
                return;
            }
            if (btn.dataset.action === "back") {
                mode = "MAIN";
                draw();
                return;
            }
            if (mode === "QR") {
                mount.removeEventListener("click", onClick);
                resolve({ loggedIn: true, auth: "LOGIN" });
                return;
            }
            const choice = btn.dataset.choice;
            if (!choice)
                return;
            if (choice === "auth") {
                mode = "QR";
                draw();
                return;
            }
            mount.removeEventListener("click", onClick);
            resolve({ loggedIn: false, auth: "GUEST" });
        }
        mount.addEventListener("click", onClick);
        draw();
    });
}
/**
 * 나에게 맞는 설정 — 4개 복수 선택.
 * "글씨 크게" 카드를 누르면 보통/크게/아주 크게 3단계가 펼쳐지고, 선택 즉시 글자 크기가 바뀝니다.
 * 공황장애(SIMPLE_STEPS)를 켠 채 "완료"를 누르면 "다음 페이지로 넘어가시겠어요?" 안심 모달을 먼저 띄웁니다.
 */
async function renderAccessibilityScreen(loggedIn = false, initial = {}) {
    const mount = resolveMount();
    const state = { fontScale: "NORMAL", ...initial };
    let expanded = false;
    return new Promise((resolve) => {
        const draw = () => {
            setFontScale((state.fontScale ?? "NORMAL"));
            setHighContrast(!!state["HIGH_CONTRAST"]);
            mount.innerHTML = shell(accessibilityScreenHTML(state, expanded, loggedIn));
            focusFirst(mount);
        };
        function onClick(event) {
            const btn = closestButton(event.target);
            if (!btn)
                return;
            const key = btn.dataset.setting;
            const fontScale = btn.dataset.fontScale;
            if (fontScale) {
                state.fontScale = fontScale;
                if (fontScale === "NORMAL")
                    delete state.LARGE_TEXT;
                else
                    state.LARGE_TEXT = true;
                draw();
            }
            else if (key === "LARGE_TEXT") {
                expanded = !expanded;
                draw();
            }
            else if (key) {
                if (state[key])
                    delete state[key];
                else
                    state[key] = true;
                draw();
            }
            else if (btn.dataset.action === "back") {
                mount.removeEventListener("click", onClick);
                resolve(BACK);
            }
            else if (btn.dataset.action === "skip") {
                state.fontScale = "NORMAL";
                delete state.LARGE_TEXT;
                delete state.HIGH_CONTRAST;
                setFontScale("NORMAL");
                setHighContrast(false);
                mount.removeEventListener("click", onClick);
                resolve({ fontScale: "NORMAL" });
            }
            else if (btn.dataset.action === "next" && ACCESSIBILITY_SETTINGS.some((s) => !!state[s.key])) {
                proceedIfConfirmed(mount, !!state["SIMPLE_STEPS"], () => {
                    mount.removeEventListener("click", onClick);
                    resolve(state);
                });
            }
        }
        mount.addEventListener("click", onClick);
        draw();
    });
}
/** 예약 여부 확인 화면 */
async function renderReservationScreen(settings = {}, initial = "") {
    const mount = resolveMount();
    const simple = !!settings["SIMPLE_STEPS"];
    let selected = initial;
    let paused = false;
    let staffAsked = false;
    return new Promise((resolve) => {
        const draw = () => {
            setSimpleSteps(simple);
            mount.innerHTML = shell(paused ? pauseScreenHTML(staffAsked) : reservationScreenHTML(selected, settings));
            focusFirst(mount);
        };
        function onClick(event) {
            const btn = closestButton(event.target);
            if (!btn)
                return;
            const { group, value, action } = btn.dataset;
            if (paused) {
                if (action === "resume") {
                    paused = false;
                    draw();
                }
                else if (action === "staff-ask") {
                    staffAsked = true;
                    draw();
                }
                return;
            }
            if (action === "pause") {
                paused = true;
                staffAsked = false;
                draw();
                return;
            }
            if (group === "appointmentStatus" && value) {
                selected = selected === value ? "" : value;
                draw();
            }
            else if (action === "back") {
                mount.removeEventListener("click", onClick);
                resolve(BACK);
            }
            else if (action === "next" && selected) {
                proceedIfConfirmed(mount, simple, () => {
                    mount.removeEventListener("click", onClick);
                    resolve({ appointmentStatus: selected });
                });
            }
        }
        mount.addEventListener("click", onClick);
        draw();
    });
}
/** 방문 유형 확인 화면 — 초진/재진 */
async function renderVisitTypeScreen(settings = {}, initial = "") {
    const mount = resolveMount();
    const simple = !!settings["SIMPLE_STEPS"];
    let selected = initial;
    let paused = false;
    let staffAsked = false;
    return new Promise((resolve) => {
        const draw = () => {
            setSimpleSteps(simple);
            mount.innerHTML = shell(paused ? pauseScreenHTML(staffAsked) : visitTypeScreenHTML(selected, settings));
            focusFirst(mount);
        };
        function onClick(event) {
            const btn = closestButton(event.target);
            if (!btn)
                return;
            const { group, value, action } = btn.dataset;
            if (paused) {
                if (action === "resume") {
                    paused = false;
                    draw();
                }
                else if (action === "staff-ask") {
                    staffAsked = true;
                    draw();
                }
                return;
            }
            if (action === "pause") {
                paused = true;
                staffAsked = false;
                draw();
                return;
            }
            if (group === "visitType" && value) {
                selected = selected === value ? "" : value;
                draw();
            }
            else if (action === "back") {
                mount.removeEventListener("click", onClick);
                resolve(BACK);
            }
            else if (action === "next" && selected) {
                proceedIfConfirmed(mount, simple, () => {
                    mount.removeEventListener("click", onClick);
                    resolve({ visitType: selected });
                });
            }
        }
        mount.addEventListener("click", onClick);
        draw();
    });
}
/**
 * 진료과 선택 화면 — 추천(정형외과) 또는 "다른 진료과" 10개 목록에서 직접 선택.
 * "다른 진료과를 선택할래요"를 고르면 진료과 목록 화면으로 이동해 사용자가 직접 고릅니다.
 */
export async function renderDepartmentScreen(settings = {}, initial = "") {
    const mount = resolveMount();
    const simple = !!settings["SIMPLE_STEPS"];
    // 다시 열 때(✕) 이전에 고른 진료과가 추천 카드(정형외과)가 아니면 목록 화면부터 시작해
    // 선택 상태를 그대로 보여줍니다. 아니면 추천/직접선택 2개 화면에서 시작합니다.
    let mode = initial && initial !== "OTHER" && initial !== RECOMMENDED_DEPARTMENT.value ? "LIST" : "CHOICE";
    let selected = initial;
    let paused = false;
    let staffAsked = false;
    return new Promise((resolve) => {
        const draw = () => {
            setSimpleSteps(simple);
            mount.innerHTML = shell(paused
                ? pauseScreenHTML(staffAsked)
                : mode === "CHOICE"
                    ? departmentChoiceHTML(selected, settings)
                    : departmentListScreenHTML(selected, settings));
            focusFirst(mount);
        };
        function onClick(event) {
            const btn = closestButton(event.target);
            if (!btn)
                return;
            const { group, value, action } = btn.dataset;
            if (paused) {
                if (action === "resume") {
                    paused = false;
                    draw();
                }
                else if (action === "staff-ask") {
                    staffAsked = true;
                    draw();
                }
                return;
            }
            if (action === "pause") {
                paused = true;
                staffAsked = false;
                draw();
                return;
            }
            if (group === "department" && value) {
                selected = selected === value ? "" : value;
                draw();
                return;
            }
            if (action === "back") {
                // 목록 화면의 뒤로가기는 추천 화면(CHOICE)으로, 추천 화면의 뒤로가기는 이전 페이지(초진/재진)로 갑니다.
                if (mode === "LIST") {
                    mode = "CHOICE";
                    selected = "";
                    draw();
                }
                else {
                    mount.removeEventListener("click", onClick);
                    resolve(BACK);
                }
                return;
            }
            if (action === "next" && selected) {
                if (mode === "CHOICE" && selected === "OTHER") {
                    mode = "LIST";
                    selected = "";
                    draw();
                    return;
                }
                // 진료과 다음에는 최종 안내 확인(최종적으로 안내 받으시겠어요?)이 이어지므로 진행 확인 모달을 띄우지 않습니다.
                mount.removeEventListener("click", onClick);
                resolve({ departmentId: selected });
            }
        }
        mount.addEventListener("click", onClick);
        draw();
    });
}
/** 위 화면들에서 모은 값을 하나의 RawUserInput 객체로 합치기 */
export function assembleRawInput(parts) {
    return {
        loggedIn: parts.loginChoice.loggedIn,
        auth: parts.loginChoice.auth,
        ...parts.accessibility,
        guardianPresent: !!parts.accessibility["GUARDIAN_MODE"],
        appointmentStatus: parts.appointmentStatus,
        visitType: parts.visitType,
        // 제출용 departmentId 는 공식 enum 으로 정규화하고,
        // 화면에서 고른 진료과(departmentDisplayId)는 데모 길안내/재선택에 그대로 씁니다.
        departmentId: toOfficialDepartmentId(parts.departmentId),
        departmentDisplayId: parts.departmentId,
        // STEP 2 가 fieldMetadata 를 채울 때 쓸 수 있도록 수집 메타 정보를 남깁니다.
        _confirmedByUser: true,
        _collectedVia: "WEB_FORM",
    };
}
// 빠른 요약
// 뭘: 사용자 정보 입력 화면
// 어떻게: 메인 → 나에게 맞는 설정 → 예약 여부 → 초진/재진 → 진료과 순으로 화면을 넘기고,
//         마지막에 assembleRawInput으로 합쳐서 반환
// 참고 문서: docs/LOGINLESS_QR_PROFILE_GUIDE.md, docs/DATA_CLASSIFICATION.md, docs/environments/HOSPITAL_PARTICIPANT_GUIDE.md
export async function collectProfile() {
    let loginChoice = { loggedIn: false, auth: "GUEST" };
    let accessibility = {};
    let appointmentStatus = "";
    let visitType = "";
    let departmentId = "";

    // 화면별 "이전 페이지로 돌아가기"를 실제로 동작시키는 플로우 컨트롤러.
    // 뒤로가기(BACK)면 이전 단계로 이동하고, 이동 후 선택했던 값을 그대로 보여줍니다.
    let step = 0;
    while (step < 5) {
        if (step === 0) {
            loginChoice = await renderLoginChoiceScreen();
            step = 1;
        }
        else if (step === 1) {
            const result = await renderAccessibilityScreen(loginChoice.loggedIn, accessibility);
            if (result === BACK)
                step = 0;
            else {
                accessibility = result;
                step = 2;
            }
        }
        else if (step === 2) {
            const result = await renderReservationScreen(accessibility, appointmentStatus);
            if (result === BACK)
                step = 1;
            else {
                appointmentStatus = result.appointmentStatus;
                step = 3;
            }
        }
        else if (step === 3) {
            const result = await renderVisitTypeScreen(accessibility, visitType);
            if (result === BACK)
                step = 2;
            else {
                visitType = result.visitType;
                step = 4;
            }
        }
        else {
            const result = await renderDepartmentScreen(accessibility, departmentId);
            if (result === BACK)
                step = 3;
            else {
                departmentId = result.departmentId;
                step = 5;
            }
        }
    }
    return assembleRawInput({ loginChoice, accessibility, appointmentStatus, visitType, departmentId });
}
