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

/** 진료과 추천(정형외과)·진료과 직접 선택 화면 — collectUserDecision.ts(STEP 8) 로 이동. 여기서는 재내보내기만 합니다. */
import {
  RECOMMENDED_DEPARTMENT,
  departmentChoiceHTML,
  DEPARTMENTS,
  departmentListScreenHTML,
} from "./collectUserDecision.ts";
export { RECOMMENDED_DEPARTMENT, departmentChoiceHTML, DEPARTMENTS, departmentListScreenHTML };

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
  { key: "VISUAL_GUIDANCE", title: "시각 안내", desc: "그림·아이콘으로 알기 쉽게 안내해 드려요", icon: "👁️" },
  { key: "GUARDIAN_MODE", title: "보호자와 함께 왔어요", desc: "보호자 동행 안내를 준비해 드릴게요", icon: "👪" },
  { key: "HIGH_CONTRAST", title: "고대비 모드", desc: "글을 조금 더 뚜렷하게 볼 수 있어요", icon: "◐" },
  { key: "EASY_MODE", title: "쉬운 모드", desc: "선택지마다 쉬운 설명을 보여드려요", icon: "☀️" },
  { key: "SIMPLE_STEPS", title: "공황장애를 겪고 있어요", desc: "차분하고 천천히 안내해 드릴게요", icon: "💙" },
  { key: "STAFF_HELP", title: "직원 도움 선호", desc: "직원이 함께 도와드릴 수 있게 안내해 드려요", icon: "🙋" },
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

/** 복수 선택 카드 (나에게 맞는 설정) — 체크박스 선택 표시. showDesc=false면 작은 설명을 숨깁니다(쉬운 모드). */
const settingCard = (key: string, title: string, desc: string, checked: boolean, showDesc = true) => `
  <button type="button" class="dept-card ${checked ? "is-selected" : ""}" data-setting="${key}" aria-pressed="${checked}">
    <span class="dept-checkbox" aria-hidden="true">${checked ? "✓" : ""}</span>
    <span class="dept-copy">
      <span class="dept-title">${title}</span>
      ${showDesc && desc ? `<span class="dept-hint">${desc}</span>` : ""}
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

const nextButton = (label: string, enabled: boolean, simple = false) => `
  <footer class="bottom-actions">
    ${simple ? restButton() : ""}
    <button type="button" class="primary-action ${enabled ? "" : "is-disabled"}" data-action="next" ${enabled ? "" : "disabled"}>${label}</button>
  </footer>`;

/** 완료 옆에 건너뛰기 버튼을 나란히 배치한 푸터 (접근성 설정 화면). */
const nextWithSkipButton = (label: string, enabled: boolean, simple = false) => `
  <footer class="bottom-actions">
    ${simple ? restButton() : ""}
    <div class="bottom-row">
      <button type="button" class="secondary-action" data-action="skip">건너뛰기</button>
      <button type="button" class="primary-action ${enabled ? "" : "is-disabled"}" data-action="next" ${enabled ? "" : "disabled"}>${label}</button>
    </div>
  </footer>`;

const shell = (content: string) => `${header()}<div class="page">${content}</div>`;

// ══════════════════════════════════════════════════════════════
// 공황장애(SIMPLE_STEPS) 모드 — 차분한 안내 공통 조각
// ══════════════════════════════════════════════════════════════

/** 공황장애 모드일 때 하단에 항상 붙는 "잠시 쉬기" 버튼. */
const restButton = () => `
  <button type="button" class="rest-btn" data-action="pause">잠시 쉬기</button>`;

/** 공황장애 모드일 때 질문 화면 상단에 표시하는 배지. */
const calmPill = (simple: boolean) => (simple ? '<span class="pill pill-calm">💙 차분한 안내</span>' : "");

/** 공황장애 모드일 때 질문 화면에 붙는 안심 문구 — 서두르지 않아도 된다는 메시지. */
const calmNote = (simple: boolean) =>
  simple ? '<p class="calm-note">천천히 하셔도 돼요.<br />언제든 잠시 쉬실 수 있어요.</p>' : "";

/** 공황장애 모드에서 pill 행 우측에 붙는 "이전 페이지로 돌아가기" 링크 — 눌러서 이전 화면으로 돌아갑니다. */
const backLink = (simple: boolean) =>
  simple ? '<button type="button" class="back-link-text" data-action="back">이전 페이지로 돌아가기</button>' : "";

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

// ══════════════════════════════════════════════════════════════
// 화면 HTML 빌더 (순수 함수 — 테스트에서도 확인 가능)
// ══════════════════════════════════════════════════════════════

const staffIconSmall = `
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M18 16.5c0 .6-.5 1-1 1a13 13 0 0 1-9.3-3.8A13 13 0 0 1 4 4.5c0-.5.4-1 1-1h2.2c.5 0 .9.3 1 .8l.8 3c.1.5 0 .9-.3 1.2l-1.1 1.1a10.4 10.4 0 0 0 4 4l1.1-1.1c.3-.3.7-.4 1.2-.3l3 .8c.5.1.8.5.8 1V16.5z" fill="#868686"/>
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
  </section>${nextButton("완료", true)}`;
}

/**
 * 나에게 맞는 설정 — 글씨 크게(누르면 보통/크게/아주 크게 3단계 펼침) /
 * 음성 안내 / 보호자 동행 / 공황장애 4개 복수 선택.
 *
 * 로그인 사용자는 "전에 하신 설정이 맞는지 확인해 주세요"로 제목이 바뀝니다.
 * (같은 화면 — 로그인/비회원 여부에 따라 텍스트만 달라집니다.)
 */
export function accessibilityScreenHTML(state: AccessibilityState = {}, expanded = false, loggedIn = false): string {
  const ready = ACCESSIBILITY_SETTINGS.some((s) => !!state[s.key]);
  const easy = !!state["EASY_MODE"];
  const simple = !!state["SIMPLE_STEPS"];
  const scale = (state.fontScale ?? "NORMAL") as FontScale;
  const title = loggedIn
    ? "전에 하신 설정이 맞는지<br />확인해 주세요"
    : "편하신 방식을<br />골라주세요";
  return `
  ${progress(0)}
  <section class="screen form-screen cp-screen">
    ${simple ? `<div class="pill-row">${backLink(simple)}</div>` : ""}
    <h1 class="title-lg">${title}</h1>
    <p class="subtitle">여러 개를 함께 선택할 수 있어요</p>
    ${ACCESSIBILITY_SETTINGS.map((s) =>
      s.key === "LARGE_TEXT"
        ? `${settingCard(s.key, s.title, s.desc, !!state[s.key], easy)}${expanded ? fontScaleRowHTML(scale) : ""}`
        : settingCard(s.key, s.title, s.desc, !!state[s.key], easy),
    ).join("")}
  </section>${nextWithSkipButton("완료", ready)}`;
}

/**
 * 공황장애 모드에서 "완료"를 누를 때 확인하는 안심 모달.
 * "잘못 누르더라도 이전 페이지로 다시 돌아갈 수 있어요" — 천천히 진행해도 된다는 안내.
 */
export function proceedConfirmOverlayHTML(): string {
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
export function reservationScreenHTML(selected: string, settings: AccessibilityState = {}): string {
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
export function visitTypeScreenHTML(selected: string, settings: AccessibilityState = {}): string {
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

/** 공황장애 모드 — 화면 전환을 부드럽게(페이드) 하도록 문서에 simple-steps 클래스를 켜고 끕니다. */
function setSimpleSteps(on: boolean): void {
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("simple-steps", on);
  }
}

/**
 * 공황장애(SIMPLE_STEPS) 모드 — "다음/완료"를 누를 때마다 진행 전 확인 모달을 띄웁니다.
 * "네" → true, "아니요"/닫기 → false 를 반환합니다.
 * "잘못 누르더라도 이전 페이지로 다시 돌아갈 수 있어요" — 천천히 진행해도 된다는 안심 안내.
 */
function askProceedConfirm(mount: HTMLElement): Promise<boolean> {
  const wrap = document.createElement("div");
  wrap.innerHTML = proceedConfirmOverlayHTML();
  const overlay = wrap.firstElementChild as HTMLElement;
  mount.appendChild(overlay);
  overlay.querySelector<HTMLElement>("[data-autofocus]")?.focus();
  return new Promise((resolve) => {
    const close = (value: boolean) => {
      overlay.remove();
      resolve(value);
    };
    overlay.querySelector<HTMLElement>('[data-action="confirm-yes"]')?.addEventListener("click", () => close(true));
    overlay.querySelector<HTMLElement>('[data-action="confirm-no"]')?.addEventListener("click", () => close(false));
    overlay.querySelector<HTMLElement>('[data-action="confirm-close"]')?.addEventListener("click", () => close(false));
  });
}

/** 공황장애 모드면 안심 확인 모달을 거친 뒤에 진행하고, 아니면 바로 진행합니다. */
function proceedIfConfirmed(mount: HTMLElement, simple: boolean, onProceed: () => void): void {
  void askProceedConfirm(mount).then((ok) => {
    if (ok) onProceed();
  });
}

// ══════════════════════════════════════════════════════════════
// 컴포넌트 함수 — 화면을 띄우고 사용자 입력을 Promise 로 반환합니다.
// ══════════════════════════════════════════════════════════════

/**
 * 메인 화면 — 로그인/회원가입(QR 화면으로 이동) / 비회원 시작 / 직원 호출. 개인정보는 수집하지 않습니다.
 * 비회원이든 로그인이든 다음 설정 화면은 동일하며, 제목 텍스트만 로그인 여부에 따라 달라집니다.
 */
async function renderLoginChoiceScreen(): Promise<{ loggedIn: boolean; auth: string }> {
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
      const { action, choice } = btn.dataset;
      if (action === "staff") {
        staffAlert = true;
        draw();
        return;
      }
      if (action === "staff-close") {
        staffAlert = false;
        draw();
        return;
      }
      if (action === "back") {
        mode = "MAIN";
        draw();
        return;
      }
      if (mode === "QR") {
        mount.removeEventListener("click", onClick);
        resolve({ loggedIn: true, auth: "LOGIN" });
        return;
      }
      if (!choice) return;
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
 * 나에게 맞는 설정 화면 — 글씨 크게(누르면 보통/크게/아주 크게 3단계 펼침) /
 * 음성 안내 / 보호자 동행 / 공황장애 4개 복수 선택.
 * 로그인 사용자는 제목이 "전에 하신 설정이 맞는지 확인해 주세요"로 바뀝니다.
 * 공황장애(SIMPLE_STEPS)를 켠 채 "완료"를 누르면 "다음 페이지로 넘어가시겠어요?" 안심 모달을 먼저 띄웁니다.
 */
async function renderAccessibilityScreen(loggedIn = false, initial: AccessibilityState = {}): Promise<AccessibilityState | typeof BACK> {
  const mount = resolveMount();
  const state: AccessibilityState = { fontScale: "NORMAL", ...initial };
  let expanded = false;
  return new Promise((resolve) => {
    const draw = () => {
      setFontScale((state.fontScale ?? "NORMAL") as FontScale);
      setHighContrast(!!state["HIGH_CONTRAST"]);
      mount.innerHTML = shell(accessibilityScreenHTML(state, expanded, loggedIn));
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
      } else if (btn.dataset.action === "back") {
        mount.removeEventListener("click", onClick);
        resolve(BACK);
      } else if (btn.dataset.action === "skip") {
        state.fontScale = "NORMAL";
        delete state.LARGE_TEXT;
        delete state.HIGH_CONTRAST;
        setFontScale("NORMAL");
        setHighContrast(false);
        mount.removeEventListener("click", onClick);
        resolve({ fontScale: "NORMAL" });
      } else if (btn.dataset.action === "next" && ACCESSIBILITY_SETTINGS.some((s) => !!state[s.key])) {
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
async function renderReservationScreen(settings: AccessibilityState = {}, initial = ""): Promise<{ appointmentStatus: string } | typeof BACK> {
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
    function onClick(event: MouseEvent) {
      const btn = closestButton(event.target);
      if (!btn) return;
      const { group, value, action } = btn.dataset;
      if (paused) {
        if (action === "resume") {
          paused = false;
          draw();
        } else if (action === "staff-ask") {
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
      } else if (action === "back") {
        mount.removeEventListener("click", onClick);
        resolve(BACK);
      } else if (action === "next" && selected) {
        void proceedIfConfirmed(mount, simple, () => {
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
async function renderVisitTypeScreen(settings: AccessibilityState = {}, initial = ""): Promise<{ visitType: string } | typeof BACK> {
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
    function onClick(event: MouseEvent) {
      const btn = closestButton(event.target);
      if (!btn) return;
      const { group, value, action } = btn.dataset;
      if (paused) {
        if (action === "resume") {
          paused = false;
          draw();
        } else if (action === "staff-ask") {
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
      } else if (action === "back") {
        mount.removeEventListener("click", onClick);
        resolve(BACK);
      } else if (action === "next" && selected) {
        void proceedIfConfirmed(mount, simple, () => {
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
async function renderDepartmentScreen(settings: AccessibilityState = {}, initial = ""): Promise<{ departmentId: string } | typeof BACK> {
  const mount = resolveMount();
  const simple = !!settings["SIMPLE_STEPS"];
  let mode: "CHOICE" | "LIST" = "CHOICE";
  let selected = initial;
  let paused = false;
  let staffAsked = false;
  return new Promise((resolve) => {
    const draw = () => {
      setSimpleSteps(simple);
      mount.innerHTML = shell(
        paused
          ? pauseScreenHTML(staffAsked)
          : mode === "CHOICE"
            ? departmentChoiceHTML(selected, settings)
            : departmentListScreenHTML(selected, settings),
      );
      focusFirst(mount);
    };
    function onClick(event: MouseEvent) {
      const btn = closestButton(event.target);
      if (!btn) return;
      const { group, value, action } = btn.dataset;
      if (paused) {
        if (action === "resume") {
          paused = false;
          draw();
        } else if (action === "staff-ask") {
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
        } else {
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
export function assembleRawInput(parts: {
  loginChoice?: { loggedIn: boolean; auth: string };
  accessibility: AccessibilityState;
  appointmentStatus: string;
  visitType: string;
  departmentId: string;
}): RawUserInput {
  return {
    ...(parts.loginChoice ? { loggedIn: parts.loginChoice.loggedIn, auth: parts.loginChoice.auth } : {}),
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
// 어떻게: 메인(로그인/비회원) → 나에게 맞는 설정 → 예약 여부 → 초진/재진 → 진료과 순으로 화면을 넘기고,
//         마지막에 assembleRawInput으로 합쳐서 반환
// 참고 문서: docs/LOGINLESS_QR_PROFILE_GUIDE.md, docs/DATA_CLASSIFICATION.md, docs/environments/HOSPITAL_PARTICIPANT_GUIDE.md
export async function collectProfile(): Promise<RawUserInput> {
  let loginChoice: { loggedIn: boolean; auth: string } = { loggedIn: false, auth: "GUEST" };
  let accessibility: AccessibilityState = {};
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
    } else if (step === 1) {
      const result = await renderAccessibilityScreen(loginChoice.loggedIn, accessibility);
      if (result === BACK) step = 0;
      else {
        accessibility = result;
        step = 2;
      }
    } else if (step === 2) {
      const result = await renderReservationScreen(accessibility, appointmentStatus);
      if (result === BACK) step = 1;
      else {
        appointmentStatus = result.appointmentStatus;
        step = 3;
      }
    } else if (step === 3) {
      const result = await renderVisitTypeScreen(accessibility, visitType);
      if (result === BACK) step = 2;
      else {
        visitType = result.visitType;
        step = 4;
      }
    } else {
      const result = await renderDepartmentScreen(accessibility, departmentId);
      if (result === BACK) step = 3;
      else {
        departmentId = result.departmentId;
        step = 5;
      }
    }
  }
  return assembleRawInput({ loginChoice, accessibility, appointmentStatus, visitType, departmentId });
}