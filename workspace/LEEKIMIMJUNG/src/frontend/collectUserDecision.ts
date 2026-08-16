/**
 * STEP 8 — collectUserDecision
 *
 * 목적:
 *   사용자에게 최종 확인을 받습니다. 자동 추천을 자동 실행으로 잇지 마세요.
 *
 * 입력:
 *   Recommendation
 *
 * 반환:
 *   UserDecision
 *
 * 반드시:
 *   - 수락 / 거절 / 다른 후보 선택 / 다시 입력 경로를 제공할 것
 *   - 거절하면 executionPlan.actions 는 빈 배열
 *   - confirmedAt 을 넣는다면 UTC Z 형식일 것
 *
 * 금지:
 *   - 승인 없이 실행계획 만들기
 *   - "확인" 버튼 없이 바로 진행
 *
 * 관련 오류:
 *   ACTIONS_WITHOUT_APPROVAL · USER_NOT_APPROVED · INVALID_UTC_TIMESTAMP
 *
 * 완료 확인:
 *   npm run participant:progress
 */
import type {
  Recommendation, UserDecision
} from "@kiobridge/participant-sdk";

/** 참가팀 서비스가 수집한 원본 입력 (형식 자유 — 웹폼/음성/QR/챗봇 무엇이든). */
export type RawUserInput = Record<string, unknown>;

// ══════════════════════════════════════════════════════════════
// 진료과 추천(정형외과) 화면 — collectProfile.ts 에서 이동 (디자인 동일)
// ══════════════════════════════════════════════════════════════

/** 글자 크기 3단계 — "글씨 크게" 설정에서 고릅니다. */
export type FontScale = "NORMAL" | "LARGE" | "XLARGE";

/** 나에게 맞는 설정 상태 — 설정 bool 값 + 글자 크기 단계(fontScale)를 함께 담습니다. */
export interface AccessibilityState {
  fontScale?: FontScale;
  [key: string]: boolean | FontScale | undefined;
}

/** 추천 진료과 — 재진 기록과 방문 정보를 바탕으로 추천합니다. */
export const RECOMMENDED_DEPARTMENT = {
  value: "ORTHOPEDICS",
  title: "정형외과",
  desc: "추천 — 방문 정보를 바탕으로 안내했어요",
} as const;

/** 헤더 로고 — 모서리가 접힌 "H" 마크. collectProfile.ts 와 동일. */
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
 * 병원 후보(fixture의 HOS-001~006, 고정값) → 화면에 보여줄 이름/진료과/위치.
 * 🚨 이건 "증상으로 진료과를 추론"하는 게 아니라, 이미 STEP5(recommend)가 고른
 * candidateId를 화면에 예쁘게 보여주기 위한 표시용 참고 데이터입니다 (fixture 자체가 고정값).
 */
const CANDIDATE_DISPLAY: Record<string, { title: string; department: string; floor: string }> = {
  "HOS-001": { title: "예약 재진 접수", department: "내과", floor: "2층 · 내과 접수 데스크" },
  "HOS-002": { title: "예약 초진 접수", department: "정형외과", floor: "2층 · 정형외과 접수 데스크" },
  "HOS-003": { title: "비예약 초진 안내", department: "일반 안내", floor: "1층 · 종합 안내데스크" },
  "HOS-004": { title: "건강검진 안내", department: "건강검진센터", floor: "4층 · 건강검진센터" },
  "HOS-005": { title: "검사 예약 확인", department: "영상의학과", floor: "지하 1층 · 영상의학과" },
  "HOS-006": { title: "직원 도움 요청", department: "안내데스크", floor: "1층 · 종합 안내데스크" },
};

/** candidateId로 표시 정보를 찾습니다. 모르는 값이면 "일반 안내"로 안전하게 대체합니다. */
function resolveCandidateDisplay(candidateId: string | null | undefined): { candidateId: string; title: string; department: string; floor: string } {
  const found = candidateId ? CANDIDATE_DISPLAY[candidateId] : undefined;
  return found
    ? { candidateId: candidateId as string, ...found }
    : { candidateId: candidateId ?? "", title: "일반 안내", department: "일반 안내", floor: "1층 · 종합 안내데스크" };
}

/** 실제 현재 날짜/시각으로 헤더 시계를 표시합니다 (collectProfile.ts와 동일 로직). */
function formatClock(d: Date): { date: string; time: string } {
  const date = new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric" }).format(d);
  const time = new Intl.DateTimeFormat("ko-KR", { hour: "numeric", minute: "2-digit", hour12: true }).format(d);
  return { date, time };
}

let clockTickingStarted = false;
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

const restButton = () => `
  <button type="button" class="rest-btn" data-action="pause">잠시 쉬기</button>`;

const calmPill = (simple: boolean) => (simple ? '<span class="pill pill-calm">💙 차분한 안내</span>' : "");

const calmNote = (simple: boolean) =>
  simple ? '<p class="calm-note">천천히 하셔도 돼요.<br />언제든 잠시 쉬실 수 있어요.</p>' : "";

/** 공황장애 모드에서 pill 행 우측에 붙는 "이전 페이지로 돌아가기" 링크 — 눌러서 이전 화면으로 돌아갑니다. */
const backLink = (simple: boolean) =>
  simple ? '<button type="button" class="back-link-text" data-action="back">이전 페이지로 돌아가기</button>' : "";

const nextButton = (label: string, enabled: boolean, simple = false) => `
  <footer class="bottom-actions">
    ${simple ? restButton() : ""}
    <button type="button" class="primary-action ${enabled ? "" : "is-disabled"}" data-action="next" ${enabled ? "" : "disabled"}>${label}</button>
  </footer>`;

const shell = (content: string) => `${header()}<div class="page">${content}</div>`;

/**
 * 진료과 선택(추천) 화면 — Figma 시안(진료과 추천) 적용.
 * 추천 진료과 카드 + "다른 진료과를 선택할래요" 카드 2개 선택지.
 * 설정에서 음성 안내를 켰으면 "음성 안내 모드" 필을 표시합니다. 증상은 묻지 않습니다.
 */
/**
 * @param recommended STEP5(recommend)/STEP6(explainRecommendation)가 실제로 계산한 결과.
 *   생략하면(예: 데모용 미리보기) RECOMMENDED_DEPARTMENT를 기본값으로 씁니다 — 실제 흐름에서는
 *   반드시 renderRecommendationScreen이 진짜 Recommendation을 여기 넘겨야 합니다.
 * @param uncertain STEP5가 진료과를 확정하지 못해 일반 안내로 보낸 경우(requiresReconfirmation)
 *   true. 확정 추천처럼 보이면 안 되므로 "추천 정확도 높음" 문구 대신 확인이 필요하다는
 *   문구를 보여줍니다 — 병원 환경 금지 규칙(증상으로 진료과 자동매칭 금지)과 짝을 이룹니다.
 */
export function departmentChoiceHTML(
  selected: string,
  settings: AccessibilityState = {},
  recommended: { candidateId: string; title: string; department: string; floor: string; reasons: string[] } = {
    candidateId: RECOMMENDED_DEPARTMENT.value,
    title: RECOMMENDED_DEPARTMENT.title,
    department: RECOMMENDED_DEPARTMENT.title,
    floor: "2층 · 정형외과 접수 데스크",
    reasons: [],
  },
  uncertain = false,
): string {
  const voice = !!settings["VOICE_GUIDANCE"];
  const staff = !!settings["STAFF_HELP"];
  const visual = !!settings["VISUAL_GUIDANCE"];
  const simple = !!settings["SIMPLE_STEPS"];
  const reason = recommended.reasons.length > 0
    ? recommended.reasons.join("<br />") + "<br />다르다면 아래에서 직접 선택할 수 있어요."
    : uncertain
      ? "입력하신 조건에 정확히 맞는 접수 경로를 찾지 못했어요.<br />괜찮으시면 안내데스크에서 확인해 드릴게요."
      : "입력하신 정보를 바탕으로 안내해 드려요.<br />다르다면 아래에서 직접 선택할 수 있어요.";
  return `
  ${progress(3)}
  <section class="screen form-screen cp-screen">
    <div class="pill-row">
      ${voice ? '<span class="pill pill-voice">음성 안내 모드</span>' : ""}
      ${staff ? '<span class="pill pill-staff">직원 도움 안내</span>' : ""}
      ${visual ? '<span class="pill pill-visual">시각 안내 모드</span>' : ""}
      ${calmPill(simple)}
      ${uncertain
        ? '<span class="pill pill-warn">직접 확인이 필요해요</span>'
        : '<span class="pill pill-acc">추천 정확도 높음</span>'}
      ${backLink(simple)}
    </div>
    <h1 class="title-lg">${uncertain
      ? "딱 맞는 접수 경로를<br />찾지 못했어요"
      : `${recommended.department}로<br />안내해 드릴게요`}</h1>
    ${calmNote(simple)}
    <div class="q-card">
      <strong>${uncertain ? "어떻게 도와드릴까요?" : `왜 ${recommended.department}인가요?`}</strong>
      <p>${reason}</p>
    </div>
    <button type="button" class="dept-card ${selected === recommended.candidateId ? "is-selected" : ""}" data-group="department" data-value="${recommended.candidateId}">
      <span class="dept-checkbox" aria-hidden="true">${selected === recommended.candidateId ? "✓" : ""}</span>
      <span class="dept-copy">
        <span class="dept-title">${recommended.title}</span>
        <span class="dept-floor">${recommended.floor}</span>
        <span class="dept-hint">${staff ? "직원이 찾아와서 안내해 드릴게요" : uncertain ? "안내데스크 직원이 직접 확인해 드려요" : "다음으로 넘어가면 길을 안내해 드려요"}</span>
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
] as const;

/** 제출용 공식 departmentId enum 값 (docs/ENUM_REFERENCE.md). 스키마에 없는 값은 UNSPECIFIED 로 폴백합니다. */
export const OFFICIAL_DEPARTMENT_IDS = ["INTERNAL_MEDICINE", "ORTHOPEDICS", "ENT", "RADIOLOGY", "HEALTH_SCREENING", "UNSPECIFIED"] as const;
export function toOfficialDepartmentId(departmentId: string): string {
  return (OFFICIAL_DEPARTMENT_IDS as readonly string[]).includes(departmentId) ? departmentId : "UNSPECIFIED";
}

/** 단일 선택 카드 (예약 여부 / 초진·재진 / 진료과 목록) — 체크박스 선택 표시. */
const choiceCard = (group: string, value: string, title: string, desc: string, selected: boolean) => `
  <button type="button" class="dept-card ${selected ? "is-selected" : ""}" data-group="${group}" data-value="${value}">
    <span class="dept-checkbox" aria-hidden="true">${selected ? "✓" : ""}</span>
    <span class="dept-copy">
      <span class="dept-title">${title}</span>
      ${desc ? `<span class="dept-hint">${desc}</span>` : ""}
    </span>
  </button>`;

/** 진료과 직접 선택 화면 — "다른 진료과를 선택할래요"를 고르면 공식 6개 진료과가 2열로 펼쳐집니다. */
export function departmentListScreenHTML(selected: string, settings: AccessibilityState = {}): string {
  const simple = !!settings["SIMPLE_STEPS"];
  return `
  ${progress(3)}
  <section class="screen form-screen cp-screen">
    <button type="button" class="back-link" data-action="back" aria-label="이전으로 돌아가기">‹</button>
    <div class="pill-row">${calmPill(simple)}</div>
    <h1 class="title-lg">진료과를<br />골라주세요</h1>
    <p class="subtitle">안내받을 진료과를 직접 선택해 주세요</p>
    ${calmNote(simple)}
    <div class="dept-grid">
      ${DEPARTMENTS.map((d) => choiceCard("department", d.value, d.title, "", selected === d.value)).join("")}
    </div>
  </section>${nextButton("다음", selected !== "", simple)}`;
}

/**
 * 렌더링할 요소를 찾습니다. 브라우저가 아닌 Node(예: participant:progress)에서
 * 호출되면 즉시 에러를 던져 멈추지 않게 합니다.
 */
function resolveMount(): HTMLElement {
  if (typeof document === "undefined") {
    throw new Error(
      "collectUserDecision: 브라우저 DOM 이 없어 승인 화면을 띄울 수 없습니다. " +
        "(npm run participant:progress 는 Node 에서 함수 실행 여부만 확인합니다. 실제 승인은 브라우저/키오스크에서 실행하세요.)",
    );
  }
  return document.querySelector<HTMLElement>("#app") ?? document.body;
}

// preventScroll — 안 그러면 목록 아래쪽을 눌러도 포커스가 첫 버튼으로 가면서
// 화면이 맨 위로 튀어 오릅니다. 스크롤 위치는 renderWithScrollPreserved가 복원합니다.
function focusFirst(mount: HTMLElement): void {
  const explicit = mount.querySelector<HTMLElement>("[data-autofocus]");
  if (explicit) {
    explicit.focus({ preventScroll: true });
    return;
  }
  // 뒤로가기 같은 주변 버튼이 아니라 새 화면 제목으로 포커스를 옮깁니다 (collectProfile.ts와 동일).
  const heading = mount.querySelector<HTMLElement>("h1, h2");
  if (heading) {
    if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
    return;
  }
  mount.querySelector<HTMLElement>("button")?.focus({ preventScroll: true });
}

/** mount.innerHTML 교체로 스크롤 위치가 0으로 리셋되는 것을 막습니다 (collectProfile.ts와 동일). */
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

// ══════════════════════════════════════════════════════════════
// 컴포넌트 함수 틀 (조은빛, 여윤우) — 프레임워크 자유. 뼈대만 있고 안은 비어있음.
// ══════════════════════════════════════════════════════════════

/** 추천 결과 + 추천 이유(recommendationReasons) 표시 화면 */
async function renderRecommendationScreen(_rec: Recommendation): Promise<void> {
  const mount = resolveMount();
  const display = resolveCandidateDisplay(_rec.recommendedCandidateId);
  const recommended = {
    candidateId: display.candidateId,
    title: display.title,
    department: display.department,
    floor: display.floor,
    reasons: _rec.recommendationReasons ?? [],
  };
  const uncertain = !!_rec.requiresReconfirmation;
  return new Promise((resolve) => {
    let selected = recommended.candidateId;
    const draw = () => {
      renderWithScrollPreserved(mount, shell(departmentChoiceHTML(selected, {}, recommended, uncertain)));
      focusFirst(mount);
    };
    function onClick(event: MouseEvent) {
      const btn = closestButton(event.target);
      if (!btn) return;
      const { group, value, action } = btn.dataset;
      if (group === "department" && value) {
        selected = value;
        draw();
        return;
      }
      if (action === "next" && selected) {
        mount.removeEventListener("click", onClick);
        resolve();
      }
    }
    mount.addEventListener("click", onClick);
    draw();
  });
}

/** 대안 후보(rec.alternativeCandidateIds) "다른 것 보기" 화면 */
async function renderAlternativesScreen(
  _rec: Recommendation,
): Promise<{ backed: true } | { backed: false; selectedCandidateId: string }> {
  const mount = resolveMount();
  const alternatives = (_rec.alternativeCandidateIds ?? []).map((candidateId) => resolveCandidateDisplay(candidateId));
  let selected = "";
  return new Promise((resolve) => {
    const draw = () => {
      renderWithScrollPreserved(mount, shell(`
      ${progress(3)}
      <section class="screen form-screen cp-screen">
        <button type="button" class="back-link" data-action="back" aria-label="이전으로 돌아가기">‹</button>
        <div class="pill-row"></div>
        <h1 class="title-lg">다른 후보를<br />골라주세요</h1>
        <p class="subtitle">안내받을 후보를 직접 선택해 주세요</p>
        ${
          alternatives.length > 0
            ? alternatives
                .map((c) => choiceCard("department", c.candidateId, c.title, c.floor, selected === c.candidateId))
                .join("")
            : `<p class="subtitle">다른 후보가 없어요. 직원 도움을 요청해 주세요.</p>`
        }
      </section>${nextButton("다음", selected !== "", false)}`));
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
        mount.removeEventListener("click", onClick);
        resolve({ backed: true });
        return;
      }
      if (action === "next" && selected) {
        mount.removeEventListener("click", onClick);
        resolve({ backed: false, selectedCandidateId: selected });
      }
    }
    mount.addEventListener("click", onClick);
    draw();
  });
}

/** 최종 확인 버튼 4종 — 수락 / 거절 / 다른 후보 선택 / 다시 입력 */
async function renderApprovalButtons(_rec: Recommendation): Promise<"APPROVE" | "REJECT" | "PICK_ALTERNATIVE" | "RESTART"> {
  const mount = resolveMount();
  const display = resolveCandidateDisplay(_rec.recommendedCandidateId);
  const uncertain = !!_rec.requiresReconfirmation;
  return new Promise((resolve) => {
    const draw = () => {
      renderWithScrollPreserved(mount, shell(`
      ${progress(4)}
      <section class="screen form-screen cp-screen">
        <div class="pill-row">
          ${uncertain
            ? '<span class="pill pill-warn">직접 확인이 필요해요</span>'
            : '<span class="pill pill-acc">추천 정확도 높음</span>'}
        </div>
        <h1 class="title-lg">${uncertain
          ? "직원에게 진료과를<br />확인받으실래요?"
          : `${display.department}로<br />안내해 드릴까요?`}</h1>
        <p class="subtitle">${uncertain
          ? "입력하신 조건에 딱 맞는 접수 경로를 찾지 못했어요. 안내데스크 직원이 직접 확인해 드려요."
          : "최종 확인이에요. 원하는 선택지를 골라주세요."}</p>
        <button type="button" class="option-card" data-action="approve">
          <span class="checkbox" aria-hidden="true">✓</span>
          <span class="option-copy">
            <strong>${uncertain ? "네, 확인받을게요" : "네, 안내받을게요"}</strong>
            <small>${uncertain ? "수락 — 안내데스크로 이동해요" : `수락 — ${display.department} 안내를 시작해요`}</small>
          </span>
        </button>
        <button type="button" class="option-card" data-action="pick-alternative">
          <span class="checkbox" aria-hidden="true">⋯</span>
          <span class="option-copy">
            <strong>다른 진료과를 볼래요</strong>
            <small>다른 후보에서 직접 고를 수 있어요</small>
          </span>
        </button>
        <button type="button" class="option-card" data-action="restart">
          <span class="checkbox" aria-hidden="true">↺</span>
          <span class="option-copy">
            <strong>처음부터 다시 입력할래요</strong>
            <small>다시 입력 — 처음 화면으로 돌아가요</small>
          </span>
        </button>
        <button type="button" class="option-card" data-action="reject">
          <span class="checkbox" aria-hidden="true">✕</span>
          <span class="option-copy">
            <strong>안내받지 않을게요</strong>
            <small>거절 — 이대로 안내를 마칠게요</small>
          </span>
        </button>
      </section>`));
      focusFirst(mount);
    };
    function onClick(event: MouseEvent) {
      const btn = closestButton(event.target);
      if (!btn) return;
      const { action } = btn.dataset;
      const outcome =
        action === "approve"
          ? "APPROVE"
          : action === "reject"
            ? "REJECT"
            : action === "pick-alternative"
              ? "PICK_ALTERNATIVE"
              : action === "restart"
                ? "RESTART"
                : null;
      if (!outcome) return;
      mount.removeEventListener("click", onClick);
      resolve(outcome);
    }
    mount.addEventListener("click", onClick);
    draw();
  });
}

/** 버튼 클릭 결과를 UserDecision 객체로 조립 */
function buildUserDecision(approved: boolean, decision: string, note?: string): UserDecision {
  const ALLOWED_DECISIONS = ["APPROVE", "REJECT", "MODIFY"] as const;
  if (!(ALLOWED_DECISIONS as readonly string[]).includes(decision)) {
    throw new Error(
      `USER_DECISION_INVALID: decision 은(는) ${ALLOWED_DECISIONS.join("/")} 중 하나여야 합니다. (받은 값: ${JSON.stringify(decision)})`,
    );
  }
  if (approved !== (decision !== "REJECT")) {
    throw new Error(
      `USER_NOT_APPROVED: approved(${approved}) 와 decision(${decision}) 이 서로 어긋납니다. ` +
        "APPROVE/MODIFY 일 때만 approved=true 여야 합니다.",
    );
  }
  const confirmedAt = new Date().toISOString();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(confirmedAt)) {
    throw new Error(`INVALID_UTC_TIMESTAMP: confirmedAt 이 UTC ISO 8601 형식이 아닙니다. (받은 값: ${confirmedAt})`);
  }
  return { approved, decision: decision as UserDecision["decision"], confirmedAt, ...(note ? { note } : {}) };
}

// 빠른 요약
// 뭘: 승인 화면
// 어떻게: 위 컴포넌트 함수들로 추천+이유 보여주고, 버튼 클릭 결과를 UserDecision으로 반환
// 참고 문서: docs/SAFETY_POLICY.md, docs/ERROR_CATALOG.md
export async function collectUserDecision(_rec: Recommendation): Promise<UserDecision> {
  await renderRecommendationScreen(_rec);

  for (;;) {
    const choice = await renderApprovalButtons(_rec);

    if (choice === "PICK_ALTERNATIVE") {
      const alt = await renderAlternativesScreen(_rec);
      if (alt.backed) continue;
      return buildUserDecision(true, "MODIFY", `다른 진료과 선택: ${alt.selectedCandidateId}`);
    }

    if (choice === "RESTART") {
      return buildUserDecision(false, "REJECT", "처음부터 다시 입력");
    }

    return buildUserDecision(choice === "APPROVE", choice);
  }
}
