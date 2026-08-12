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

/** 참가팀 서비스가 수집한 원본 입력 (형식 자유 — 웹폼/음성/QR/챗봇 무엇이든). */
export type RawUserInput = Record<string, unknown>;

/** 시작 화면에서 고른 인증 방식 — 회원가입 화면도 개인정보 없이 버튼 선택만 받습니다. */
export type AuthChoice = "LOGIN" | "SIGNUP" | "GUEST";

/** 글자 크기 3단계 — "글씨 크게" 설정에서 고릅니다. */
export type FontScale = "NORMAL" | "LARGE" | "XLARGE";

/** 나에게 맞는 설정 상태 — 설정 bool 값 + 글자 크기 단계(fontScale)를 함께 담습니다. */
export interface AccessibilityState {
  fontScale?: FontScale;
  [key: string]: boolean | FontScale | undefined;
}

// ══════════════════════════════════════════════════════════════
// 선택지 데이터 — 값은 공식 enum(docs/ENUM_REFERENCE.md)을 그대로 씁니다.
// STEP 2(mapToCanonicalInput)가 enum 값으로 옮기기 쉽도록 하기 위함.
// ══════════════════════════════════════════════════════════════

/** 나에게 맞는 설정 — 지원 모드. 공황장애는 쉬운 문장/차분한 안내(SIMPLE_STEPS)로 받습니다. */
export const ACCESSIBILITY_SETTINGS = [
  { key: "LARGE_TEXT", title: "글씨 크기", desc: "보통 · 크게 · 아주 크게", icon: "Aa" },
  { key: "VOICE_GUIDANCE", title: "음성 안내", desc: "음성으로 안내해 드려요", icon: "🔊" },
  { key: "GUARDIAN_MODE", title: "보호자와 함께 왔어요", desc: "보호자 동행 안내를 준비해 드릴게요", icon: "👪" },
  { key: "HIGH_CONTRAST", title: "고대비 모드", desc: "글을 조금 더 뚜렷하게 볼 수 있어요", icon: "◐" },
  { key: "SIMPLE_STEPS", title: "공황장애를 겪고 있어요", desc: "차분하고 천천히 안내해 드릴게요", icon: "💙" },
] as const;

/** 글자 크기 선택지 — "글씨 크게" 카드를 누르면 펼쳐지는 3단계. */
export const FONT_SCALES: { value: FontScale; label: string }[] = [
  { value: "NORMAL", label: "보통" },
  { value: "LARGE", label: "크게" },
  { value: "XLARGE", label: "아주 크게" },
] as const;

/** 글자 크기 단계별 실제 폰트 크기 — 보통은 일반 크기, 크게는 조금 더, 아주 크게는 좀 더. */
export const FONT_SCALE_PX: Record<FontScale, number> = {
  NORMAL: 15,
  LARGE: 17,
  XLARGE: 19,
};

/** 예약 여부 — appointmentStatus enum */
export const APPOINTMENT_STATUSES = [
  { value: "HAS_APPOINTMENT", title: "예약했어요", desc: "예약하신 일정으로 빠르게 안내할게요", icon: "📅" },
  { value: "NO_APPOINTMENT", title: "예약 안 했어요 / 모르겠어요", desc: "접수 데스크에서 확인해 드릴게요", icon: "🚶" },
] as const;

/** 방문 유형 — 초진/재진. visitType enum 값 사용. */
export const VISIT_TYPES = [
  { value: "FIRST_VISIT", title: "초진이에요", desc: "첫 방문이라면 안내를 자세하게 해드려요", icon: "🌱" },
  { value: "REVISIT", title: "재진이에요", desc: "이전 방문 기록을 바탕으로 안내해 드려요", icon: "🔄" },
] as const;

/** 진료과 추천 — 실제 서비스에서는 STEP 4·5(recommend)가 만들어 준 결과를 보여줍니다. */
export const RECOMMENDED_DEPARTMENT = {
  value: "ORTHOPEDICS",
  title: "정형외과",
  desc: "추천 — 방문 정보를 바탕으로 안내했어요",
} as const;

/** 진료과 직접 선택지 — "다른 진료과를 선택할래요"를 고르면 나오는 10개 진료과. 값은 공식 enum 스타일을 따릅니다. */
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
] as const;

// ══════════════════════════════════════════════════════════════
// 공통 UI 헬퍼 — 같은 폴더의 style.css 클래스를 그대로 재사용합니다.
// ══════════════════════════════════════════════════════════════

const header = () => `
  <header class="status-bar">
    <div class="brand"><span class="brand-mark"></span><strong>은빛 병원</strong></div>
    <div class="clock"><small>6월 15일</small> <strong>3:36</strong></div>
  </header>`;

const progress = (current: number) => `
  <div class="progress" aria-label="진행 단계 ${current + 1}/5">
    ${Array.from({ length: 5 }, (_, index) => `<span class="${index <= current ? "active" : ""}"></span>`).join("")}
  </div>`;

/** 단일 선택 카드 (예약 여부 / 초진·재진 / 진료과 목록) — 체크박스 선택 표시. */
const choiceCard = (group: string, value: string, title: string, desc: string, selected: boolean) => `
  <button type="button" class="dept-card ${selected ? "is-selected" : ""}" data-group="${group}" data-value="${value}">
    <span class="dept-checkbox" aria-hidden="true">${selected ? "✓" : ""}</span>
    <span class="dept-copy">
      <span class="dept-title">${title}</span>
      ${desc ? `<span class="dept-hint">${desc}</span>` : ""}
    </span>
  </button>`;

/** 복수 선택 카드 (나에게 맞는 설정) — 체크박스 선택 표시. */
const settingCard = (key: string, title: string, desc: string, checked: boolean) => `
  <button type="button" class="dept-card ${checked ? "is-selected" : ""}" data-setting="${key}" aria-pressed="${checked}">
    <span class="dept-checkbox" aria-hidden="true">${checked ? "✓" : ""}</span>
    <span class="dept-copy">
      <span class="dept-title">${title}</span>
      <span class="dept-hint">${desc}</span>
    </span>
  </button>`;

/** "글씨 크게"를 누르면 펼쳐지는 보통/크게/아주 크게 3단계 선택지. */
const fontScaleRowHTML = (scale: FontScale) => `
  <div class="fontsize-inline block" role="group" aria-label="글자 크기 선택">
    <span class="fontsize-inline-label">글자 크기</span>
    <div class="fontsize-inline-options">
      ${FONT_SCALES.map((o) => `
        <button type="button" class="fontsize-chip ${scale === o.value ? "is-selected" : ""}" data-font-scale="${o.value}">${o.label}</button>
      `).join("")}
    </div>
  </div>`;

const nextButton = (label: string, enabled: boolean) => `
  <footer class="bottom-actions">
    <button type="button" class="primary-action ${enabled ? "" : "is-disabled"}" data-action="next" ${enabled ? "" : "disabled"}>${label}</button>
  </footer>`;

/** 완료 옆에 건너뛰기 버튼을 나란히 배치한 푸터 (접근성 설정 화면). */
const nextWithSkipButton = (label: string, enabled: boolean) => `
  <footer class="bottom-actions">
    <div class="bottom-row">
      <button type="button" class="secondary-action" data-action="skip">건너뛰기</button>
      <button type="button" class="primary-action ${enabled ? "" : "is-disabled"}" data-action="next" ${enabled ? "" : "disabled"}>${label}</button>
    </div>
  </footer>`;

const shell = (content: string) => `${header()}<div class="page">${content}</div>`;

// ══════════════════════════════════════════════════════════════
// 화면 HTML 빌더 (순수 함수 — 테스트에서도 확인 가능)
// ══════════════════════════════════════════════════════════════

const staffIconSmall = `
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M18 16.5c0 .6-.5 1-1 1a13 13 0 0 1-9.3-3.8A13 13 0 0 1 4 4.5c0-.5.4-1 1-1h2.2c.5 0 .9.3 1 .8l.8 3c.1.5 0 .9-.3 1.2l-1.1 1.1a10.4 10.4 0 0 0 4 4l1.1-1.1c.3-.3.7-.4 1.2-.3l3 .8c.5.1.8.5.8 1V16.5z" fill="#868686"/>
  </svg>`;

const staffIconWhite = `
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M18 16.5c0 .6-.5 1-1 1a13 13 0 0 1-9.3-3.8A13 13 0 0 1 4 4.5c0-.5.4-1 1-1h2.2c.5 0 .9.3 1 .8l.8 3c.1.5 0 .9-.3 1.2l-1.1 1.1a10.4 10.4 0 0 0 4 4l1.1-1.1c.3-.3.7-.4 1.2-.3l3 .8c.5.1.8.5.8 1V16.5z" fill="#fff"/>
  </svg>`;

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

/** 메인 화면 — 병원 이니셜(H) + "안아프게 해 드릴게요" 문구. Figma 시안 느낌 적용. */
export function loginChoiceScreenHTML(): string {
  return `
  <section class="screen welcome-screen">
    <div class="hero-mark" aria-hidden="true">H</div>
    <p class="camera-caption">“안아프게 해 드릴게요”</p>
    <div class="auth-panel">
      <button type="button" class="auth-login" data-choice="auth">로그인 / 회원가입 하기</button>
      <button type="button" class="guest" data-choice="guest">비회원으로 시작하기</button>
      <button type="button" class="staff-help-link" data-action="staff">${staffIconSmall}도움이 필요하시면 직원을 호출해주세요</button>
    </div>
  </section>`;
}

/** QR 로그인/회원가입 화면 — "로그인 / 회원가입 하기"를 누르면 나옵니다. */
export function qrAuthScreenHTML(): string {
  return `
  <section class="screen form-screen cp-screen">
    <button type="button" class="back-link" data-action="back" aria-label="메인으로 돌아가기">‹</button>
    <h1 class="title-lg">QR코드로<br />로그인/회원가입</h1>
    <p class="qr-subtitle">로그인과 회원가입이 한번에 가능해요.</p>
    <div class="qr-box" role="img" aria-label="QR 코드 인식 영역"></div>
  </section>
  <footer class="bottom-actions col">
    <button type="button" class="staff-call" data-action="staff">${staffIconWhite}직원 호출</button>
    <button type="button" class="primary-action" data-choice="login">완료</button>
  </footer>`;
}

/**
 * 나에게 맞는 설정 — 글씨 크게(누르면 보통/크게/아주 크게 3단계 펼침) /
 * 음성 안내 / 보호자 동행 / 공황장애 4개 복수 선택.
 */
export function accessibilityScreenHTML(state: AccessibilityState = {}, expanded = false): string {
  const ready = ACCESSIBILITY_SETTINGS.some((s) => !!state[s.key]);
  const scale = (state.fontScale ?? "NORMAL") as FontScale;
  return `
  ${progress(0)}
  <section class="screen form-screen cp-screen">
    <h1 class="title-lg">편하신 방식을<br />골라주세요</h1>
    <p class="subtitle">여러 개를 함께 선택할 수 있어요</p>
    ${ACCESSIBILITY_SETTINGS.map((s) =>
      s.key === "LARGE_TEXT"
        ? `${settingCard(s.key, s.title, s.desc, !!state[s.key])}${expanded ? fontScaleRowHTML(scale) : ""}`
        : settingCard(s.key, s.title, s.desc, !!state[s.key]),
    ).join("")}
  </section>${nextWithSkipButton("완료", ready)}`;
}

/** 예약 여부 확인 화면 */
export function reservationScreenHTML(selected: string, settings: AccessibilityState = {}): string {
  const voice = !!settings["VOICE_GUIDANCE"];
  return `
  ${progress(1)}
  <section class="screen form-screen cp-screen">
    <div class="pill-row">
      ${voice ? '<span class="pill pill-voice">음성 안내 모드</span>' : ""}
    </div>
    <h1 class="title-lg">예약하고<br />오셨나요?</h1>
    <p class="subtitle">예약 여부에 따라 안내가 달라져요</p>
    ${APPOINTMENT_STATUSES.map((o) => choiceCard("appointmentStatus", o.value, o.title, o.desc, selected === o.value)).join("")}
  </section>${nextButton("다음", selected !== "")}`;
}

/** 방문 유형 확인 화면 — 초진/재진 */
export function visitTypeScreenHTML(selected: string): string {
  return `
  ${progress(2)}
  <section class="screen form-screen cp-screen">
    <h1 class="title-lg">오늘 진료,<br />초진인가요 재진인가요?</h1>
    <p class="subtitle">초진이면 안내를 더 자세하게 해드려요</p>
    ${VISIT_TYPES.map((o) => choiceCard("visitType", o.value, o.title, o.desc, selected === o.value)).join("")}
  </section>${nextButton("다음", selected !== "")}`;
}

/**
 * 진료과 선택(추천) 화면 — Figma 시안(진료과 추천) 적용.
 * 추천 진료과 카드 + "다른 진료과를 선택할래요" 카드 2개 선택지.
 * 설정에서 음성 안내를 켰으면 "음성 안내 모드" 필을 표시합니다. 증상은 묻지 않습니다.
 */
export function departmentChoiceHTML(selected: string, settings: AccessibilityState = {}): string {
  const voice = !!settings["VOICE_GUIDANCE"];
  return `
  ${progress(3)}
  <section class="screen form-screen cp-screen">
    <div class="pill-row">
      ${voice ? '<span class="pill pill-voice">음성 안내 모드</span>' : ""}
      <span class="pill pill-acc">추천 정확도 높음</span>
    </div>
    <h1 class="title-lg">정형외과로<br />안내해 드릴게요</h1>
    <div class="q-card">
      <strong>왜 정형외과인가요?</strong>
      <p>재진 기록과 방문 정보를 바탕으로 판단했어요.<br />다르다면 아래에서 직접 선택할 수 있어요.</p>
    </div>
    <button type="button" class="dept-card ${selected === RECOMMENDED_DEPARTMENT.value ? "is-selected" : ""}" data-group="department" data-value="${RECOMMENDED_DEPARTMENT.value}">
      <span class="dept-checkbox" aria-hidden="true">${selected === RECOMMENDED_DEPARTMENT.value ? "✓" : ""}</span>
      <span class="dept-copy">
        <span class="dept-title">${RECOMMENDED_DEPARTMENT.title}</span>
        <span class="dept-floor">3층 · 정형외과 접수 데스크</span>
        <span class="dept-hint">다음으로 넘어가면 길을 안내해 드려요</span>
      </span>
    </button>
    <button type="button" class="dept-card ${selected === "OTHER" ? "is-selected" : ""}" data-group="department" data-value="OTHER">
      <span class="dept-checkbox" aria-hidden="true">${selected === "OTHER" ? "✓" : ""}</span>
      <span class="dept-copy">
        <span class="dept-title">다른 진료과를 선택할래요</span>
        <span class="dept-hint">다음으로 넘어가 직접 진료과를 선택해 주세요</span>
      </span>
    </button>
  </section>${nextButton("다음", selected !== "")}`;
}

/** 진료과 직접 선택 화면 — "다른 진료과를 선택할래요"를 고르면 10개 진료과 목록이 펼쳐집니다. */
export function departmentListScreenHTML(selected: string): string {
  return `
  ${progress(3)}
  <section class="screen form-screen cp-screen">
    <button type="button" class="back-link" data-action="back" aria-label="이전으로 돌아가기">‹</button>
    <h1 class="title-lg">진료과를<br />골라주세요</h1>
    <p class="subtitle">안내받을 진료과를 직접 선택해 주세요</p>
    ${DEPARTMENTS.map((d) => choiceCard("department", d.value, d.title, "", selected === d.value)).join("")}
  </section>${nextButton("다음", selected !== "")}`;
}

// ══════════════════════════════════════════════════════════════
// DOM 연결 헬퍼
// ══════════════════════════════════════════════════════════════

/**
 * 렌더링할 요소를 찾습니다. 브라우저가 아닌 Node(예: participant:progress)에서
 * 호출되면 즉시 에러를 던져 멈추지 않게 합니다.
 */
function resolveMount(): HTMLElement {
  if (typeof document === "undefined") {
    throw new Error(
      "collectProfile: 브라우저 DOM 이 없어 수집 화면을 띄울 수 없습니다. " +
        "(npm run participant:progress 는 Node 에서 함수 실행 여부만 확인합니다. 실제 수집은 브라우저/키오스크에서 실행하세요.)",
    );
  }
  return document.querySelector<HTMLElement>("#app") ?? document.body;
}

function focusFirst(mount: HTMLElement): void {
  const el =
    mount.querySelector<HTMLElement>("[data-autofocus]") ??
    mount.querySelector<HTMLElement>("button");
  if (el) el.focus();
}

function closestButton(target: EventTarget | null): HTMLElement | null {
  return (target as HTMLElement | null)?.closest<HTMLElement>("button[data-value], button[data-setting], button[data-choice], button[data-action], button[data-font-scale]") ?? null;
}

/** 글자 크기 단계에 맞춰 전체 화면 글자를 키웁니다 (보통 15px / 크게 17px / 아주 크게 19px). */
function setFontScale(scale: FontScale): void {
  if (typeof document !== "undefined") {
    document.documentElement.style.fontSize = `${FONT_SCALE_PX[scale]}px`;
  }
}

/** 고대비 모드 — 글자가 더 뚜렷하게 보이도록 문서에 high-contrast 클래스를 켜고 끕니다. */
function setHighContrast(on: boolean): void {
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("high-contrast", on);
  }
}

// ══════════════════════════════════════════════════════════════
// 컴포넌트 함수 — 화면을 띄우고 사용자 입력을 Promise 로 반환합니다.
// ══════════════════════════════════════════════════════════════

/** 메인 화면 — 로그인/회원가입(QR 화면으로 이동) / 비회원 시작 / 직원 호출. 개인정보는 수집하지 않습니다. */
async function renderLoginChoiceScreen(): Promise<{ loggedIn: boolean; auth: AuthChoice }> {
  const mount = resolveMount();
  let mode: "MAIN" | "QR" = "MAIN";
  let staffAlert = false;
  return new Promise((resolve) => {
    const draw = () => {
      const content = shell(mode === "MAIN" ? loginChoiceScreenHTML() : qrAuthScreenHTML());
      mount.innerHTML = staffAlert ? `${content}${staffAlertOverlayHTML()}` : content;
      focusFirst(mount);
    };
    function onClick(event: MouseEvent) {
      const btn = closestButton(event.target);
      if (!btn) return;
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
      const choice = btn.dataset.choice;
      if (!choice) return;
      if (mode === "MAIN") {
        if (choice === "auth") {
          mode = "QR";
          draw();
          return;
        }
        const auth = choice as AuthChoice;
        mount.removeEventListener("click", onClick);
        resolve({ loggedIn: auth !== "GUEST", auth });
        return;
      }
      mount.removeEventListener("click", onClick);
      resolve({ loggedIn: true, auth: "LOGIN" });
    }
    mount.addEventListener("click", onClick);
    draw();
  });
}

/**
 * 나에게 맞는 설정 — 4개 복수 선택.
 * "글씨 크게" 카드를 누르면 보통/크게/아주 크게 3단계가 펼쳐지고, 선택 즉시 글자 크기가 바뀝니다.
 */
async function renderAccessibilityScreen(): Promise<AccessibilityState> {
  const mount = resolveMount();
  const state: AccessibilityState = { fontScale: "NORMAL" };
  let expanded = false;
  return new Promise((resolve) => {
    const draw = () => {
      setFontScale((state.fontScale ?? "NORMAL") as FontScale);
      setHighContrast(!!state["HIGH_CONTRAST"]);
      mount.innerHTML = shell(accessibilityScreenHTML(state, expanded));
      focusFirst(mount);
    };
    function onClick(event: MouseEvent) {
      const btn = closestButton(event.target);
      if (!btn) return;
      const key = btn.dataset.setting;
      const fontScale = btn.dataset.fontScale;
      if (fontScale) {
        state.fontScale = fontScale as FontScale;
        if (fontScale === "NORMAL") delete state.LARGE_TEXT;
        else state.LARGE_TEXT = true;
        draw();
      } else if (key === "LARGE_TEXT") {
        expanded = !expanded;
        draw();
      } else if (key) {
        if (state[key]) delete state[key];
        else state[key] = true;
        draw();
      } else if (btn.dataset.action === "skip") {
        mount.removeEventListener("click", onClick);
        resolve(state);
      } else if (btn.dataset.action === "next" && ACCESSIBILITY_SETTINGS.some((s) => !!state[s.key])) {
        mount.removeEventListener("click", onClick);
        resolve(state);
      }
    }
    mount.addEventListener("click", onClick);
    draw();
  });
}

/** 예약 여부 확인 화면 */
async function renderReservationScreen(): Promise<{ appointmentStatus: string }> {
  const mount = resolveMount();
  let selected = "";
  return new Promise((resolve) => {
    const draw = () => {
      mount.innerHTML = shell(reservationScreenHTML(selected));
      focusFirst(mount);
    };
    function onClick(event: MouseEvent) {
      const btn = closestButton(event.target);
      if (!btn) return;
      const { group, value, action } = btn.dataset;
      if (group === "appointmentStatus" && value) {
        selected = selected === value ? "" : value;
        draw();
      } else if (action === "next" && selected) {
        mount.removeEventListener("click", onClick);
        resolve({ appointmentStatus: selected });
      }
    }
    mount.addEventListener("click", onClick);
    draw();
  });
}

/** 방문 유형 확인 화면 — 초진/재진 */
async function renderVisitTypeScreen(): Promise<{ visitType: string }> {
  const mount = resolveMount();
  let selected = "";
  return new Promise((resolve) => {
    const draw = () => {
      mount.innerHTML = shell(visitTypeScreenHTML(selected));
      focusFirst(mount);
    };
    function onClick(event: MouseEvent) {
      const btn = closestButton(event.target);
      if (!btn) return;
      const { group, value, action } = btn.dataset;
      if (group === "visitType" && value) {
        selected = selected === value ? "" : value;
        draw();
      } else if (action === "next" && selected) {
        mount.removeEventListener("click", onClick);
        resolve({ visitType: selected });
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
async function renderDepartmentScreen(settings: AccessibilityState = {}): Promise<{ departmentId: string }> {
  const mount = resolveMount();
  let mode: "CHOICE" | "LIST" = "CHOICE";
  let selected = "";
  return new Promise((resolve) => {
    const draw = () => {
      mount.innerHTML = shell(
        mode === "CHOICE" ? departmentChoiceHTML(selected, settings) : departmentListScreenHTML(selected),
      );
      focusFirst(mount);
    };
    function onClick(event: MouseEvent) {
      const btn = closestButton(event.target);
      if (!btn) return;
      const { group, value, action } = btn.dataset;
      if (group === "department" && value) {
        selected = selected === value ? "" : value;
        draw();
        return;
      }
      if (action === "back") {
        mode = "CHOICE";
        selected = "";
        draw();
        return;
      }
      if (action === "next" && selected) {
        if (mode === "CHOICE" && selected === "OTHER") {
          mode = "LIST";
          selected = "";
          draw();
          return;
        }
        mount.removeEventListener("click", onClick);
        resolve({ departmentId: selected });
      }
    }
    mount.addEventListener("click", onClick);
    draw();
  });
}

/** 위 화면들에서 모은 값을 하나의 RawUserInput 객체로 합치기 */
export function assembleRawInput(parts: {
  loginChoice: { loggedIn: boolean; auth: AuthChoice };
  accessibility: AccessibilityState;
  appointmentStatus: string;
  visitType: string;
  departmentId: string;
}): RawUserInput {
  return {
    loggedIn: parts.loginChoice.loggedIn,
    auth: parts.loginChoice.auth,
    ...parts.accessibility,
    guardianPresent: !!parts.accessibility["GUARDIAN_MODE"],
    appointmentStatus: parts.appointmentStatus,
    visitType: parts.visitType,
    departmentId: parts.departmentId,
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
export async function collectProfile(): Promise<RawUserInput> {
  const loginChoice = await renderLoginChoiceScreen();
  const accessibility = await renderAccessibilityScreen();
  const { appointmentStatus } = await renderReservationScreen();
  const { visitType } = await renderVisitTypeScreen();
  const { departmentId } = await renderDepartmentScreen(accessibility);
  return assembleRawInput({ loginChoice, accessibility, appointmentStatus, visitType, departmentId });
}