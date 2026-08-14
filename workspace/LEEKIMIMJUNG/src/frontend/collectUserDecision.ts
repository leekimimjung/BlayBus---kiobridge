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

const header = () => `
  <header class="status-bar">
    <div class="brand"><span class="brand-mark">${heroMarkSvg}</span><strong>은빛 병원</strong></div>
    <div class="clock"><small>6월 15일</small> <strong>3:36</strong></div>
  </header>`;

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
export function departmentChoiceHTML(selected: string, settings: AccessibilityState = {}): string {
  const voice = !!settings["VOICE_GUIDANCE"];
  const staff = !!settings["STAFF_HELP"];
  const visual = !!settings["VISUAL_GUIDANCE"];
  const simple = !!settings["SIMPLE_STEPS"];
  const reason = staff
    ? "직원 도움을 선호하셔서, 직원이 찾아와 진료과까지 안내해 드릴게요.<br />다르다면 아래에서 직접 선택할 수 있어요."
    : "재진 기록과 방문 정보를 바탕으로 판단했어요.<br />다르다면 아래에서 직접 선택할 수 있어요.";
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
    <h1 class="title-lg">정형외과로<br />안내해 드릴게요</h1>
    ${calmNote(simple)}
    <div class="q-card">
      <strong>왜 정형외과인가요?</strong>
      <p>${reason}</p>
    </div>
    <button type="button" class="dept-card ${selected === RECOMMENDED_DEPARTMENT.value ? "is-selected" : ""}" data-group="department" data-value="${RECOMMENDED_DEPARTMENT.value}">
      <span class="dept-checkbox" aria-hidden="true">${selected === RECOMMENDED_DEPARTMENT.value ? "✓" : ""}</span>
      <span class="dept-copy">
        <span class="dept-title">${RECOMMENDED_DEPARTMENT.title}</span>
        <span class="dept-floor">2층 · 정형외과 접수 데스크</span>
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

/** 단일 선택 카드 (예약 여부 / 초진·재진 / 진료과 목록) — 체크박스 선택 표시. */
const choiceCard = (group: string, value: string, title: string, desc: string, selected: boolean) => `
  <button type="button" class="dept-card ${selected ? "is-selected" : ""}" data-group="${group}" data-value="${value}">
    <span class="dept-checkbox" aria-hidden="true">${selected ? "✓" : ""}</span>
    <span class="dept-copy">
      <span class="dept-title">${title}</span>
      ${desc ? `<span class="dept-hint">${desc}</span>` : ""}
    </span>
  </button>`;

/** 진료과 직접 선택 화면 — "다른 진료과를 선택할래요"를 고르면 10개 진료과 목록이 펼쳐집니다. */
export function departmentListScreenHTML(selected: string, settings: AccessibilityState = {}): string {
  const simple = !!settings["SIMPLE_STEPS"];
  return `
  ${progress(3)}
  <section class="screen form-screen cp-screen">
    <button type="button" class="back-link" data-action="back" aria-label="이전으로 돌아가기">‹</button>
    <div class="pill-row">${calmPill(simple)}${backLink(simple)}</div>
    <h1 class="title-lg">진료과를<br />골라주세요</h1>
    <p class="subtitle">안내받을 진료과를 직접 선택해 주세요</p>
    ${calmNote(simple)}
    ${DEPARTMENTS.map((d) => choiceCard("department", d.value, d.title, "", selected === d.value)).join("")}
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

function focusFirst(mount: HTMLElement): void {
  const el =
    mount.querySelector<HTMLElement>("[data-autofocus]") ??
    mount.querySelector<HTMLElement>("button");
  if (el) el.focus();
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
  mount.innerHTML = shell(departmentChoiceHTML("", {}));
  focusFirst(mount);
}

/** 대안 후보(rec.alternativeCandidateIds) "다른 것 보기" 화면 */
async function renderAlternativesScreen(_rec: Recommendation): Promise<{ selectedCandidateId: string }> {
  const mount = resolveMount();
  let selected = "";
  return new Promise((resolve) => {
    const draw = () => {
      mount.innerHTML = shell(departmentListScreenHTML(selected, {}));
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
        void renderRecommendationScreen(_rec);
        return;
      }
      if (action === "next" && selected) {
        mount.removeEventListener("click", onClick);
        resolve({ selectedCandidateId: selected });
      }
    }
    mount.addEventListener("click", onClick);
    draw();
  });
}

/** 최종 확인 버튼 4종 — 수락 / 거절 / 다른 후보 선택 / 다시 입력 */
async function renderApprovalButtons(): Promise<"APPROVE" | "REJECT" | "PICK_ALTERNATIVE" | "RESTART"> {
  const mount = resolveMount();
  return new Promise((resolve) => {
    const draw = () => {
      mount.innerHTML = shell(`
      ${progress(4)}
      <section class="screen form-screen cp-screen">
        <div class="pill-row">
          <span class="pill pill-acc">추천 정확도 높음</span>
        </div>
        <h1 class="title-lg">정형외과로<br />안내해 드릴까요?</h1>
        <p class="subtitle">최종 확인이에요. 원하는 선택지를 골라주세요.</p>
        <button type="button" class="option-card" data-action="approve">
          <span class="checkbox" aria-hidden="true">✓</span>
          <span class="option-copy">
            <strong>네, 안내받을게요</strong>
            <small>수락 — 정형외과 안내를 시작해요</small>
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
      </section>`);
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

  const choice = await renderApprovalButtons();

  if (choice === "PICK_ALTERNATIVE") {
    const { selectedCandidateId } = await renderAlternativesScreen(_rec);
    return buildUserDecision(true, "MODIFY", `다른 진료과 선택: ${selectedCandidateId}`);
  }

  if (choice === "RESTART") {
    return buildUserDecision(false, "REJECT", "처음부터 다시 입력");
  }

  return buildUserDecision(choice === "APPROVE", choice);
}
