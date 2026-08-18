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
  toOfficialDepartmentId,
} from "./collectUserDecision.ts";
export {
  RECOMMENDED_DEPARTMENT,
  departmentChoiceHTML,
  DEPARTMENTS,
  departmentListScreenHTML,
  toOfficialDepartmentId,
};

/** 무로그인 QR 프로필 — docs/LOGINLESS_QR_PROFILE_GUIDE.md. Mock QR + 기기 내 접근성 설정 저장/조회/삭제. */
import {
  buildMockQrPayload, loadDeviceProfile, saveDeviceProfile, clearDeviceProfile, renderMockQrCodeDataUrl,
  renderUrlQrCodeDataUrl,
} from "./deviceProfile.ts";
import type { MockQrPayload, StoredDeviceProfile } from "./deviceProfile.ts";
export { buildMockQrPayload, loadDeviceProfile, saveDeviceProfile, clearDeviceProfile, renderMockQrCodeDataUrl };

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

/** 실제 현재 날짜/시각으로 헤더 시계를 표시합니다 (예전엔 "6월 15일 3:36" 고정값이었음). */
function formatClock(d: Date): { date: string; time: string } {
  const date = new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric" }).format(d);
  const time = new Intl.DateTimeFormat("ko-KR", { hour: "numeric", minute: "2-digit", hour12: true }).format(d);
  return { date, time };
}

let clockTickingStarted = false;
/** 화면을 다시 그려도(mount.innerHTML 교체) 시계 DOM은 매번 새로 생기므로, 매 tick마다 다시 찾아서 갱신합니다. */
function ensureClockTicking(): void {
  if (clockTickingStarted || typeof document === "undefined") return;
  clockTickingStarted = true;
  const tick = () => {
    const { date, time } = formatClock(new Date());
    const clock = document.querySelector<HTMLElement>(".clock");
    const dateEl = clock?.querySelector<HTMLElement>("small");
    const timeEl = clock?.querySelector<HTMLElement>("strong");
    if (dateEl) dateEl.textContent = date;
    if (timeEl) timeEl.textContent = time;
  };
  tick();
  setInterval(tick, 10_000);
}

const header = () => {
  ensureClockTicking();
  const { date, time } = formatClock(new Date());
  return `
  <header class="status-bar">
    <div class="brand"><span class="brand-mark">${heroMarkSvg}</span><strong>은빛 병원</strong></div>
    <div class="clock"><small>${date}</small> <strong>${time}</strong></div>
  </header>`;
};

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

/** 웰컴 화면 로고 — 모서리가 접힌 "H" 마크. 브랜드 색상 토큰(--brand) 재사용. */
const heroMarkSvg = `
  <svg viewBox="0 0 300 300" role="img" aria-hidden="true" focusable="false">
    <defs>
      <filter id="heroShadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="5" dy="0" stdDeviation="3" flood-opacity="0.2"/>
      </filter>
    </defs>
    <rect x="50" y="40" width="45" height="220" fill="var(--brand)" rx="3" filter="url(#heroShadow)"/>
    <path d="M 205 60 L 250 40 L 250 260 L 205 260 L 205 180 L 95 180 L 95 135 L 205 135 Z" fill="var(--brand)" filter="url(#heroShadow)"/>
  </svg>`;

/**
 * 이 세션이 "내 폰으로 이어서 보기" QR을 스캔해서 열린 건지 확인합니다.
 * 키오스크에서 그대로 쓰는 세션은 위치가 고정돼 있어 "직원이 온다"가 참이지만,
 * QR로 폰에 옮겨 온 세션은 사용자가 어디 있는지 알 방법이 없어 같은 말이 거짓이 됩니다.
 */
function isViaQrSession(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("via") === "qr";
}

/**
 * 직원 호출 안내 오버레이 — 로그인 화면에서 "직원을 호출해주세요"를 누르면 표시됩니다.
 * viaQr=true(QR로 폰에 옮겨온 세션)면 "직원이 찾아온다"고 하지 않고, 위치가 고정된
 * 안내데스크로 가시라고 안내합니다 — 실제로 지킬 수 있는 약속만 하기 위함입니다.
 */
export const staffAlertOverlayHTML = (viaQr = false) => `
  <div class="staff-overlay" role="dialog" aria-modal="true" aria-label="직원 호출 안내">
    <div class="staff-panel">
      <span class="staff-icon" aria-hidden="true">!</span>
      <h2>${viaQr ? "안내데스크로 가시면 도와드려요" : "직원을 호출했어요"}</h2>
      <p>${viaQr
        ? "가까운 1층 종합 안내데스크로 가시면<br />직원이 바로 도와드릴게요"
        : "잠시만 기다려 주시면<br />직원이 도와드릴게요"}</p>
      <button type="button" data-action="staff-close" data-autofocus>확인</button>
    </div>
  </div>`;

/**
 * 메인 화면 — 병원 이니셜(H) + "안아프게 해 드릴게요" 문구. Figma 시안 느낌 적용.
 * siteQrImageDataUrl이 있으면 "다른 기기(폰)로 이어서 보기" QR도 함께 보여줍니다 —
 * 완전 정적 사이트라 이 화면이 열려 있는 기기(키오스크든 폰이든)와 무관하게 동일하게 동작하는
 * 점을 그대로 활용한 것입니다. 새 세션으로 열리며, 진행 중이던 화면이 이어지진 않습니다.
 */
export function loginChoiceScreenHTML(siteQrImageDataUrl: string | null = null): string {
  return `
  <section class="screen welcome-screen">
    <div class="hero-mark" aria-hidden="true">${heroMarkSvg}</div>
    <p class="camera-caption">“안아프게 해 드릴게요”</p>
    ${siteQrImageDataUrl
      ? `<div class="site-qr">
          <img src="${siteQrImageDataUrl}" alt="이 화면을 내 폰으로 열기 위한 QR 코드" width="96" height="96" />
          <p class="site-qr-caption">내 폰으로 이어서 보시려면<br />QR을 스캔해 주세요</p>
        </div>`
      : ""}
    <div class="auth-panel">
      <button type="button" class="auth-login" data-choice="auth">로그인 / 회원가입 하기</button>
      <button type="button" class="guest" data-choice="guest">비회원으로 시작하기</button>
      <button type="button" class="staff-help-link" data-action="staff">${staffIconSmall}도움이 필요하시면 직원을 호출해주세요</button>
    </div>
  </section>`;
}

/**
 * QR 로그인/회원가입 화면 — "로그인 / 회원가입 하기"를 누르면 나옵니다.
 * 실제 카메라 스캔이 아니라 데모용 Mock QR입니다(docs/LOGINLESS_QR_PROFILE_GUIDE.md).
 * QR 인식 영역을 누르면 예시 QR 내용(환경 ID·버전·일회용 값만)을 보여주고,
 * 그걸 확인한 뒤에만 "완료"가 활성화됩니다 — 아무것도 안 눌러도 되고, 눌러도 개인정보는 없습니다.
 */
export function qrAuthScreenHTML(
  payload: MockQrPayload | null = null,
  qrImageDataUrl: string | null = null,
  generating = false,
): string {
  const qrBoxContent = qrImageDataUrl
    ? `<img src="${qrImageDataUrl}" alt="예시 QR 코드 — 카메라로 스캔해 보세요" width="220" height="220" />`
    : generating
      ? "QR 만드는 중…"
      : "예시 QR 읽기";
  return `
  <section class="screen form-screen cp-screen">
    <button type="button" class="back-link" data-action="back" aria-label="메인으로 돌아가기">‹</button>
    <h1 class="title-lg">QR코드로<br />로그인/회원가입</h1>
    <p class="qr-subtitle">로그인과 회원가입이 한번에 가능해요.</p>
    <button type="button" class="qr-box ${qrImageDataUrl ? "has-image" : ""}" data-action="qr-scan" role="img" aria-label="QR 코드 인식 영역 — 눌러서 예시 QR을 만들어 보세요" ${qrImageDataUrl ? "disabled" : ""}>
      ${qrBoxContent}
    </button>
    ${payload
      ? `<pre class="qr-payload" aria-label="QR 내용">${JSON.stringify(payload, null, 2)}</pre>
    <p class="qr-note">진짜로 스캔되는 QR이에요 — 카메라로 찍어보면 위 내용이 그대로 나와요.<br />QR에는 환경 정보와 일회용 값만 들어 있고, 이름·연락처 같은 개인정보는 담지 않아요.</p>`
      : ""}
  </section>${nextButton("완료", !!qrImageDataUrl)}`;
}

/**
 * 나에게 맞는 설정 — 글씨 크게(누르면 보통/크게/아주 크게 3단계 펼침) /
 * 음성 안내 / 보호자 동행 / 공황장애 4개 복수 선택.
 *
 * 로그인 사용자는 "전에 하신 설정이 맞는지 확인해 주세요"로 제목이 바뀝니다.
 * (같은 화면 — 로그인/비회원 여부에 따라 텍스트만 달라집니다.)
 *
 * "이 기기에 저장하기"는 기본값이 꺼짐(이번 한 번만 사용)이며, 켜야만 완료 시 저장됩니다
 * (docs/LOGINLESS_QR_PROFILE_GUIDE.md §3-5: 저장은 선택, 기본값은 저장 안 함).
 * 저장된 설정이 있으면 "저장된 설정 지우기" 버튼이 함께 보입니다(§6: 한 번의 조작으로 삭제).
 */
export function accessibilityScreenHTML(
  state: AccessibilityState = {},
  expanded = false,
  loggedIn = false,
  saveToDevice = false,
  hasStoredProfile = false,
  justForgot = false,
): string {
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
    <div class="device-save-row">
      <button type="button" class="dept-card ${saveToDevice ? "is-selected" : ""}" data-action="toggle-save" aria-pressed="${saveToDevice}">
        <span class="dept-checkbox" aria-hidden="true">${saveToDevice ? "✓" : ""}</span>
        <span class="dept-copy">
          <span class="dept-title">이 기기에 설정 저장하기</span>
          <span class="dept-hint">다음에 다시 올 때 자동으로 불러와요 · 저장 안 해도 지금 흐름은 그대로 이용할 수 있어요</span>
        </span>
      </button>
      ${hasStoredProfile ? '<button type="button" class="secondary-action wide" data-action="forget-device">저장된 설정 지우기</button>' : ""}
      ${justForgot ? '<p class="device-forget-note" role="status">이 기기에 저장된 설정을 지웠습니다.</p>' : ""}
    </div>
  </section>${nextWithSkipButton("완료", ready)}`;
}

/**
 * "이 기기에 저장된 설정이 있어요. 불러올까요?" 확인 모달 — 자동으로 불러온 정보는
 * 반드시 보여주고 확인받아야 합니다(docs/LOGINLESS_QR_PROFILE_GUIDE.md §3-8).
 * 공용 기기일 수 있으므로 "앞사람의 설정일 수 있다"는 안내를 함께 보여줍니다.
 */
export function deviceProfileConfirmOverlayHTML(stored: StoredDeviceProfile): string {
  const activeTitles = ACCESSIBILITY_SETTINGS.filter((s) => !!stored.settings[s.key]).map((s) => s.title);
  const savedDate = stored.savedAt.slice(0, 10);
  return `
  <div class="confirm-overlay" role="dialog" aria-modal="true" aria-label="저장된 설정을 불러올까요?">
    <div class="confirm-panel">
      <h2>이 기기에 저장된<br />설정이 있어요</h2>
      <p class="confirm-note">${savedDate}에 저장한 설정이에요.${
        activeTitles.length > 0 ? `<br />${activeTitles.join(" · ")}` : ""
      }</p>
      <div class="confirm-actions">
        <button type="button" class="confirm-no" data-action="confirm-no">아니요, 새로 고를게요</button>
        <button type="button" class="confirm-yes" data-action="confirm-yes" data-autofocus>네, 불러올게요</button>
      </div>
      <p class="confirm-note">공용 기기라면 이전 사람의 설정일 수 있어요.<br />맞는지 확인하고 골라주세요.</p>
    </div>
  </div>`;
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

// preventScroll — 기본 focus()는 포커스된 요소를 보이는 위치로 스크롤시켜서,
// 목록 아래쪽 항목을 누른 직후에도 화면이 맨 위로 튀어 올라가는 원인이 됩니다.
// 스크롤 위치는 renderWithScrollPreserved()가 따로 복원합니다.
function focusFirst(mount: HTMLElement): void {
  const explicit = mount.querySelector<HTMLElement>("[data-autofocus]");
  if (explicit) {
    explicit.focus({ preventScroll: true });
    return;
  }
  // 화면이 바뀔 때마다 뒤로가기 같은 주변 버튼이 아니라 새 화면 제목으로 포커스를 옮겨서,
  // 키보드/스크린리더 사용자가 지금 어느 화면인지 먼저 알 수 있게 합니다
  // (DOM 순서상 뒤로가기 버튼이 맨 앞이라 예전엔 항상 거기로 포커스가 갔었음).
  const heading = mount.querySelector<HTMLElement>("h1, h2");
  if (heading) {
    if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
    return;
  }
  mount.querySelector<HTMLElement>("button")?.focus({ preventScroll: true });
}

/**
 * mount.innerHTML을 교체하면 스크롤 가능한 .cp-screen이 통째로 새로 생겨서
 * 스크롤 위치가 항상 0으로 리셋됩니다 — 목록 아래쪽 항목을 클릭할 때마다
 * 화면이 맨 위로 튀어 오르는 버그의 원인. 교체 전 스크롤 위치를 저장했다가
 * 교체 후 그대로 복원합니다.
 */
function renderWithScrollPreserved(mount: HTMLElement, html: string): void {
  const prevScroller = mount.querySelector<HTMLElement>(".cp-screen");
  const scrollTop = prevScroller?.scrollTop ?? 0;
  mount.innerHTML = html;
  const nextScroller = mount.querySelector<HTMLElement>(".cp-screen");
  if (nextScroller) nextScroller.scrollTop = scrollTop;
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
  if (!simple) {
    onProceed();
    return;
  }
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
  let qrPayload: MockQrPayload | null = null;
  let qrImageDataUrl: string | null = null;
  let qrGenerating = false;
  let siteQrImageDataUrl: string | null = null;
  return new Promise((resolve) => {
    const draw = () => {
      const content = shell(
        mode === "MAIN" ? loginChoiceScreenHTML(siteQrImageDataUrl) : qrAuthScreenHTML(qrPayload, qrImageDataUrl, qrGenerating),
      );
      renderWithScrollPreserved(mount, staffAlert ? `${content}${staffAlertOverlayHTML(isViaQrSession())}` : content);
      // 첫 화면(로그인/회원가입 하기 · 비회원으로 시작하기)은 특정 버튼에 강조 포커스가
      // 가면 아직 아무것도 안 골랐는데 뭔가 골라진 것처럼 보여서, 여기선 포커스를 옮기지
      // 않습니다. QR 화면·직원 호출 오버레이처럼 실제 화면 전환이 있을 때만 옮깁니다.
      if (mode !== "MAIN" || staffAlert) focusFirst(mount);
    };
    if (typeof window !== "undefined") {
      void renderUrlQrCodeDataUrl(`${window.location.origin}/?via=qr`).then((dataUrl) => {
        siteQrImageDataUrl = dataUrl;
        if (mode === "MAIN") draw();
      });
    }
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
        qrPayload = null;
        qrImageDataUrl = null;
        draw();
        return;
      }
      if (action === "qr-scan" && !qrGenerating && !qrImageDataUrl) {
        qrPayload = buildMockQrPayload();
        qrGenerating = true;
        draw();
        void renderMockQrCodeDataUrl(qrPayload).then((dataUrl) => {
          qrImageDataUrl = dataUrl;
          qrGenerating = false;
          draw();
        });
        return;
      }
      if (mode === "QR") {
        if (action === "next" && qrImageDataUrl) {
          mount.removeEventListener("click", onClick);
          resolve({ loggedIn: true, auth: "QR" });
        }
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
 * "이 기기에 저장된 설정이 있어요. 불러올까요?" 확인 모달을 띄우고 결과를 기다립니다.
 * "네" → true, "아니요" → false.
 */
function askApplyDeviceProfileConfirm(mount: HTMLElement, stored: StoredDeviceProfile): Promise<boolean> {
  const wrap = document.createElement("div");
  wrap.innerHTML = deviceProfileConfirmOverlayHTML(stored);
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
  let state: AccessibilityState = { fontScale: "NORMAL", ...initial };
  let expanded = false;
  let saveToDevice = false;
  let stored = loadDeviceProfile();
  let justForgot = false;

  // 처음 들어왔고(뒤로가기로 온 게 아니고) 저장된 설정이 있으면, 조용히 적용하지 않고 먼저 물어봅니다
  // (docs/LOGINLESS_QR_PROFILE_GUIDE.md §3-8: 자동으로 불러온 정보는 화면에 보여주고 확인받을 것).
  if (Object.keys(initial).length === 0 && stored) {
    const apply = await askApplyDeviceProfileConfirm(mount, stored);
    if (apply) {
      state = { fontScale: "NORMAL", ...stored.settings };
      saveToDevice = true;
    }
  }

  return new Promise((resolve) => {
    const draw = () => {
      setFontScale((state.fontScale ?? "NORMAL") as FontScale);
      setHighContrast(!!state["HIGH_CONTRAST"]);
      renderWithScrollPreserved(mount, shell(accessibilityScreenHTML(state, expanded, loggedIn, saveToDevice, !!stored, justForgot)));
      focusFirst(mount);
    };
    function onClick(event: MouseEvent) {
      const btn = closestButton(event.target);
      if (!btn) return;
      const key = btn.dataset.setting;
      const fontScale = btn.dataset.fontScale;
      const action = btn.dataset.action;
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
      } else if (action === "toggle-save") {
        saveToDevice = !saveToDevice;
        justForgot = false;
        draw();
      } else if (action === "forget-device") {
        clearDeviceProfile();
        stored = null;
        saveToDevice = false;
        justForgot = true;
        draw();
      } else if (action === "back") {
        mount.removeEventListener("click", onClick);
        resolve(BACK);
      } else if (action === "skip") {
        state.fontScale = "NORMAL";
        delete state.LARGE_TEXT;
        delete state.HIGH_CONTRAST;
        setFontScale("NORMAL");
        setHighContrast(false);
        mount.removeEventListener("click", onClick);
        resolve({ fontScale: "NORMAL" });
      } else if (action === "next" && ACCESSIBILITY_SETTINGS.some((s) => !!state[s.key])) {
        proceedIfConfirmed(mount, !!state["SIMPLE_STEPS"], () => {
          if (saveToDevice) saveDeviceProfile(state);
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
      renderWithScrollPreserved(mount, shell(paused ? pauseScreenHTML(staffAsked) : reservationScreenHTML(selected, settings)));
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
      renderWithScrollPreserved(mount, shell(paused ? pauseScreenHTML(staffAsked) : visitTypeScreenHTML(selected, settings)));
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
 * 진료과 선택 화면 — 병원 실제 진료과 목록에서 사용자가 직접 고릅니다.
 * 🚨 STEP1(정보 수집) 시점에는 아직 추천 엔진(STEP4·5)이 돌기 전이라 어떤 과도
 * "추천"이라고 보여줄 근거가 없습니다. 예전엔 정형외과를 기본값으로 미리 보여주는
 * 화면이 있었는데, 실제로는 사용자 입력과 무관하게 항상 정형외과였고 뒤로가기도
 * 없어서 증상 기반 자동매칭처럼 보일 위험이 있었음 — 그래서 뺐습니다. 실제 추천은
 * STEP8(collectUserDecision)에서 recommend()가 계산한 결과로만 보여줍니다.
 */
async function renderDepartmentScreen(settings: AccessibilityState = {}, initial = ""): Promise<{ departmentId: string } | typeof BACK> {
  const mount = resolveMount();
  const simple = !!settings["SIMPLE_STEPS"];
  let selected = initial === "OTHER" ? "" : initial;
  let paused = false;
  let staffAsked = false;
  return new Promise((resolve) => {
    const draw = () => {
      setSimpleSteps(simple);
      renderWithScrollPreserved(mount, shell(paused ? pauseScreenHTML(staffAsked) : departmentListScreenHTML(selected, settings)));
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
        mount.removeEventListener("click", onClick);
        resolve(BACK);
        return;
      }
      if (action === "next" && selected) {
        // 진료과 다음에는 최종 안내 확인(최종적으로 안내 받으시겠어요?)이 이어지므로 진행 확인 모달을 띄우지 않습니다.
        mount.removeEventListener("click", onClick);
        resolve({ departmentId: selected });
      }
    }
    mount.addEventListener("click", onClick);
    draw();
  });
}

/**
 * 화면의 접근성 설정(UPPER_SNAKE_CASE 키)을 공식 supportModes enum 값 배열로 바꿉니다.
 * STEP3(createSessionContext)의 preferences.supportModes 가 이 형태를 기대합니다.
 * HIGH_CONTRAST·EASY_MODE·VOICE_GUIDANCE 는 공식 supportModes enum에 없는 값이라 뺍니다
 * (docs/ENUM_REFERENCE.md 의 6개: LARGE_TEXT/HEARING_SUPPORT/VISUAL_GUIDANCE/SIMPLE_STEPS/STAFF_HELP/GUARDIAN_MODE).
 */
function toSupportModes(accessibility: AccessibilityState): string[] {
  const OFFICIAL_SUPPORT_MODE_KEYS = ["LARGE_TEXT", "VISUAL_GUIDANCE", "SIMPLE_STEPS", "STAFF_HELP", "GUARDIAN_MODE"] as const;
  return OFFICIAL_SUPPORT_MODE_KEYS.filter((key) => !!accessibility[key]);
}

/**
 * 위 화면들에서 모은 값을 하나의 RawUserInput 객체로 합치기.
 * 🚨 STEP2(mapToCanonicalInput)·STEP3(createSessionContext)는 이 함수가 만드는 필드 이름
 * (largeText, supportModes, canUseSelfCheckIn 등)을 그대로 읽습니다 — 화면의 UPPER_SNAKE_CASE
 * 설정 키(LARGE_TEXT 등)를 그 필드로 반드시 옮겨 담아야 실제로 반영됩니다. 그냥 스프레드만
 * 하면(...accessibility) STEP2/3가 기대하는 키와 이름이 달라서 조용히 빈 값으로 넘어갑니다.
 */
export function assembleRawInput(parts: {
  loginChoice?: { loggedIn: boolean; auth: string };
  accessibility: AccessibilityState;
  appointmentStatus: string;
  visitType: string;
  departmentId: string;
}): RawUserInput {
  const a = parts.accessibility;
  return {
    ...(parts.loginChoice ? { loggedIn: parts.loginChoice.loggedIn, auth: parts.loginChoice.auth } : {}),
    ...a,
    guardianPresent: !!a["GUARDIAN_MODE"],
    appointmentStatus: parts.appointmentStatus,
    visitType: parts.visitType,
    // 제출용 departmentId 는 공식 enum 으로 정규화하고,
    // 화면에서 고른 진료과(departmentDisplayId)는 데모 길안내/재선택에 그대로 씁니다.
    departmentId: toOfficialDepartmentId(parts.departmentId),
    departmentDisplayId: parts.departmentId,

    // ── STEP2(mapToCanonicalInput)가 읽는 camelCase 필드 ──
    largeText: !!a["LARGE_TEXT"],
    simpleSteps: !!a["SIMPLE_STEPS"],
    visualGuidance: !!a["VISUAL_GUIDANCE"],
    staffAssistancePreferred: !!a["STAFF_HELP"],
    highContrast: !!a["HIGH_CONTRAST"],
    // 청각 지원(HEARING_SUPPORT)·이동 지원(mobilitySupport)은 화면에 아직 해당 설정이 없어 항상 false —
    // 접근성 설정 화면에 토글이 추가되면 여기도 함께 채워야 함.
    hearingSupport: false,
    mobilitySupport: false,
    preferredInput: "TOUCH",
    personalization: false,

    // ── STEP3(createSessionContext, hospital)가 읽는 필드 ──
    supportModes: toSupportModes(a),
    // 웹폼으로 여기까지 왔다는 것 자체가 셀프 체크인이 가능하다는 뜻이므로 확정값으로 넘김
    // (미지정 시 confidence 0.5로 처리되어 매번 재확인 오류가 남).
    canUseSelfCheckIn: true,
    inputChannel: "WEB_FORM",

    // STEP 2/3 가 fieldMetadata 를 채울 때 쓸 수 있도록 수집 메타 정보를 남깁니다.
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