// collectProfile 브라우저 데모 부트스트랩.
// collectProfile.demo.js(컴파일된 모듈)로 정보를 모은 뒤,
// 수집 화면 대신 "해당 진료과 안내 → 대기 번호 발급" 화면으로 이어집니다.
import { collectProfile, pauseScreenHTML, renderDepartmentScreen, BACK, heroMarkSvg } from "./collectProfile.demo.js";

const root = document.querySelector("#app");

/** 공황장애 모드 — "잠시 쉬기"를 누르면 열리는 차분한 화면. resume 콜백으로 복귀합니다. */
function openPause(onResume) {
  let staffAsked = false;
  const draw = () => {
    root.innerHTML = `${headerHTML()}<div class="page">${pauseScreenHTML(staffAsked)}</div>`;
    root.querySelector('[data-action="resume"]').addEventListener("click", () => onResume());
    root.querySelector('[data-action="staff-ask"]')?.addEventListener("click", () => {
      staffAsked = true;
      draw();
    });
  };
  draw();
}

const DEPARTMENT_NAMES = {
  ORTHOPEDICS: "정형외과",
  INTERNAL_MEDICINE: "내과",
  NEUROLOGY: "신경과",
  PSYCHIATRY: "정신건강의학과",
  SURGERY: "외과",
  OBSTETRICS_AND_GYNECOLOGY: "산부인과",
  PEDIATRICS: "소아청소년과",
  OPHTHALMOLOGY: "안과",
  ENT: "이비인후과",
  DERMATOLOGY: "피부과",
  RADIOLOGY: "영상의학과",
  HEALTH_SCREENING: "건강검진센터",
  UNSPECIFIED: "일반안내 데스크",
};

/** 층별 진료과 위치 · 도보 시간 안내 데이터. 화면(페르소나)별 분기 없이 이 표만으로 지도를 그립니다. */
const FLOOR_DEPARTMENTS = {
  1: [
    { id: "INTERNAL_MEDICINE", minutes: 2 },
    { id: "NEUROLOGY", minutes: 3 },
    { id: "PSYCHIATRY", minutes: 2 },
  ],
  2: [
    { id: "SURGERY", minutes: 3 },
    { id: "ORTHOPEDICS", minutes: 4 },
    { id: "OBSTETRICS_AND_GYNECOLOGY", minutes: 3 },
  ],
  3: [
    { id: "PEDIATRICS", minutes: 4 },
    { id: "OPHTHALMOLOGY", minutes: 5 },
  ],
  4: [
    { id: "ENT", minutes: 5 },
    { id: "DERMATOLOGY", minutes: 6 },
  ],
};

/** departmentId → { floor, minutes }. 목록에 없는 과(영상의학과·건강검진센터·일반안내)는 undefined — 안내데스크로 폴백. */
const DEPARTMENT_LOCATION = Object.fromEntries(
  Object.entries(FLOOR_DEPARTMENTS).flatMap(([floor, list]) =>
    list.map((dept) => [dept.id, { floor: Number(floor), minutes: dept.minutes }]),
  ),
);

const MAP_PIN_SLOTS = ["top-left", "top-right", "bottom-right"];

/** 선택한 진료과가 있는 층의 길찾기 지도(핀 + 선). 데이터가 없는 과는 null(호출부에서 폴백 처리). */
function floorMapHTML(departmentId) {
  const location = DEPARTMENT_LOCATION[departmentId];
  if (!location) return null;
  const peers = FLOOR_DEPARTMENTS[location.floor];
  const pins = peers
    .map((dept, index) => {
      const slot = MAP_PIN_SLOTS[index];
      const isTarget = dept.id === departmentId;
      return `<span class="map-pin map-pin-${slot}${isTarget ? " is-target" : ""}">
        <small>${departmentName(dept.id)}(${location.floor}층)</small>
        <strong>${dept.minutes}분</strong>
      </span>`;
    })
    .join("");
  const lines = peers
    .map((_, index) => `<span class="map-line map-line-${MAP_PIN_SLOTS[index]}"></span>`)
    .join("");
  return `
    <div class="map-grid"></div>
    ${lines}
    ${pins}
    <span class="map-start">${location.floor}층<br />현재 위치</span>`;
}

const headerHTML = () => `
  <header class="status-bar">
    <div class="brand"><span class="brand-mark">${heroMarkSvg}</span><strong>은빛 병원</strong></div>
    <div class="clock"><small>6월 15일</small> <strong>3:36</strong></div>
  </header>`;

const progressHTML = (current) => `
  <div class="progress" aria-label="진행 단계 ${current + 1}/5">
    ${Array.from({ length: 5 }, (_, index) => `<span class="${index <= current ? "active" : ""}"></span>`).join("")}
  </div>`;

function resetFontScale() {
  document.documentElement.style.fontSize = "15px";
  document.documentElement.classList.remove("high-contrast");
  document.documentElement.classList.remove("simple-steps");
}

function departmentName(departmentId) {
  return DEPARTMENT_NAMES[departmentId] ?? departmentId;
}

const picto = (kind) => {
  const icons = {
    elevator: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="4" y="2" width="10" height="20" rx="1.5" />
      <path d="M9 6 6.5 8.5h5L9 6zM9 18l-2.5-2.5h5L9 18z" />
    </svg>`,
    desk: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M3 8h18v3H3zM5 11v9M19 11v9M5 20h14M9 14h6" />
    </svg>`,
    lobby: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M4 21V6l8-4 8 4v15" />
      <path d="M4 21h16M10 21v-6h4v6" />
    </svg>`,
    help: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-3.5 3.6-5 8-5s8 1.5 8 5" />
    </svg>`,
  };
  return icons[kind] ?? "";
};

/** 두 개 선택지로 구성된 최종 확인 모달(수락/거절, 아니요/네). */
const confirmOverlayHTML = ({ title, noLabel, yesLabel }) => `
  <div class="confirm-overlay" role="dialog" aria-modal="true" aria-label="${title}">
    <div class="confirm-panel">
      <button type="button" class="confirm-close" data-action="confirm-close" aria-label="닫기">✕</button>
      <h2>${title}</h2>
      <div class="confirm-actions">
        <button type="button" class="confirm-no" data-action="confirm-no">${noLabel}</button>
        <button type="button" class="confirm-yes" data-action="confirm-yes">${yesLabel}</button>
      </div>
    </div>
  </div>`;

function openConfirm({ title, noLabel, yesLabel, onNo, onYes, onClose }) {
  const wrap = document.createElement("div");
  wrap.innerHTML = confirmOverlayHTML({ title, noLabel, yesLabel });
  const overlay = wrap.firstElementChild;
  root.appendChild(overlay);
  overlay.querySelector('[data-action="confirm-close"]').addEventListener("click", () => {
    overlay.remove();
    onClose?.();
  });
  overlay.querySelector('[data-action="confirm-no"]').addEventListener("click", () => {
    overlay.remove();
    onNo?.();
  });
  overlay.querySelector('[data-action="confirm-yes"]').addEventListener("click", () => {
    overlay.remove();
    onYes?.();
  });
}

function renderRoute(raw, onTicket) {
  const departmentId = raw.departmentId;
  const name = departmentName(departmentId);
  const location = DEPARTMENT_LOCATION[departmentId];
  const voice = !!raw.VOICE_GUIDANCE;
  const visual = !!raw.VISUAL_GUIDANCE;
  const staff = !!raw.STAFF_HELP;
  const simple = !!raw.SIMPLE_STEPS;
  const step = (num, text, icon) => visual
    ? `<li><span class="dir-ico">${picto(icon)}</span>${text}</li>`
    : `<li><span>${num}</span>${text}</li>`;
  const steps = staff
    ? [step("1", "지금 자리에서 기다려 주시면 직원이 찾아올게요", "help"), step("2", "직원이 진료과 접수까지 도와드릴게요", "desk")]
    : departmentId === "UNSPECIFIED"
      ? [step("1", "로비 안내데스크로 이동", "lobby"), step("2", "직원이 접수부터 도와드릴게요", "desk")]
      : location
        ? [step("1", `엘리베이터로 ${location.floor}층 이동`, "elevator"), step("2", `${name} 접수 데스크`, "desk")]
        : [step("1", "안내데스크에서 위치를 확인해 드릴게요", "desk")];
  const pills = [
    voice ? '<span class="pill pill-voice">음성 안내 모드</span>' : "",
    visual ? '<span class="pill pill-visual">시각 안내 모드</span>' : "",
    staff ? '<span class="pill pill-staff">직원 도움 안내</span>' : "",
    simple ? '<span class="pill pill-calm">💙 차분한 안내</span>' : "",
  ].filter(Boolean).join("");
  const mapIcons = [
    staff ? `<span class="map-ico map-ico-help">${picto("help")}</span>` : "",
    visual ? `<span class="map-ico map-ico-desk">${picto("desk")}</span>` : "",
    visual && !staff ? `<span class="map-ico map-ico-elevator">${picto("elevator")}</span>` : "",
  ].filter(Boolean).join("");
  const floorMap = floorMapHTML(departmentId);
  const mapFallback = `
    <div class="map-grid"></div>
    <span class="map-start">1층<br />현재 위치</span>
    <span class="map-pin map-pin-top-right is-target"><small>${name}</small><strong>안내데스크 문의</strong></span>`;
  root.innerHTML = `
    ${headerHTML()}
    <div class="page">
      ${progressHTML(4)}
      <section class="screen form-screen route-screen cp-screen">
        ${pills ? `<div class="pill-row">${pills}</div>` : ""}
        <h1 class="title-lg">${name}까지<br />안내해 드릴게요</h1>
        <div class="map" role="img" aria-label="병원 ${location ? `${location.floor}층 ` : ""}${name} 안내 지도">
          ${floorMap ?? mapFallback}
          ${mapIcons}
        </div>
        <ol class="directions">${steps.join("")}</ol>
      </section>
      <footer class="bottom-actions">
        ${simple ? '<button type="button" class="rest-btn" data-action="pause">잠시 쉬기</button>' : ""}
        <button type="button" class="primary-action" data-action="ticket">번호표 받기</button>
      </footer>
    </div>`;
  root.querySelector('[data-action="ticket"]').addEventListener("click", onTicket);
  root.querySelector('[data-action="pause"]')?.addEventListener("click", () => openPause(() => renderRoute(raw, onTicket)));
}

let ticketTimer = null;

/** 결과 화면 공통 렌더러 — 대기 번호 발급 / 진료 취소. 10초 뒤 자동으로 처음 화면으로 돌아갑니다. */
function renderOutcome({ icon, title, sub, simple, onResume }) {
  root.innerHTML = `
    ${headerHTML()}
    <div class="page">
      <section class="screen completion-screen">
        ${icon}
        <h1>${title}</h1>
        <p>${sub}</p>
      </section>
      <footer class="bottom-actions col">
        ${simple ? '<button type="button" class="rest-btn" data-action="pause">잠시 쉬기</button>' : ""}
        <p class="auto-return-note" role="timer">10초 뒤 처음 화면으로 자동으로 넘어가요</p>
        <button type="button" class="secondary-action wide restart-btn" data-action="restart">처음으로</button>
      </footer>
    </div>`;
  root.querySelector('[data-action="restart"]').addEventListener("click", () => {
    clearInterval(ticketTimer);
    ticketTimer = null;
    runFlow();
  });
  root.querySelector('[data-action="pause"]')?.addEventListener("click", () => {
    clearInterval(ticketTimer);
    ticketTimer = null;
    openPause(onResume);
  });
  if (ticketTimer) clearInterval(ticketTimer);
  let remaining = 10;
  const note = root.querySelector(".auto-return-note");
  ticketTimer = setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      clearInterval(ticketTimer);
      ticketTimer = null;
      runFlow();
      return;
    }
    if (note) note.textContent = `${remaining}초 뒤 처음 화면으로 자동으로 넘어가요`;
  }, 1000);
}

function renderTicket(departmentId, simple = false) {
  const number = Math.floor(Math.random() * 20) + 1;
  renderOutcome({
    icon: '<div class="complete-icon">✓</div>',
    title: `대기 번호 ${number}번이<br />발급되었어요`,
    sub: `${departmentName(departmentId)} 접수로<br />번호표가 발급되었어요`,
    simple,
    onResume: () => renderTicket(departmentId, simple),
  });
}

function renderCancelled(simple = false) {
  renderOutcome({
    icon: '<div class="cancel-icon">✕</div>',
    title: "진료가 취소되었어요.",
    sub: "진료가 취소되었습니다.<br />안녕히 가십시오.",
    simple,
    onResume: () => renderCancelled(simple),
  });
}

async function runFlow() {
  resetFontScale();
  root.innerHTML = "";
  const raw = await collectProfile();
  const simple = !!raw.SIMPLE_STEPS;

  // 진료과 선택 화면을 다시 띄워 최종 확인을 닫아도(✕) 다른 진료과를 다시 고를 수 있게 합니다.
  const openDepartmentScreen = async () => {
    const result = await renderDepartmentScreen(raw);
    if (result === BACK) {
      openDepartmentScreen();
      return;
    }
    const { departmentId } = result;
    raw.departmentId = departmentId;
    askFinalConfirm();
  };

  const askFinalConfirm = () => openConfirm({
    title: "최종적으로<br />안내를 받으시겠어요?",
    noLabel: "거절",
    yesLabel: "수락",
    onNo: () => openConfirm({
      title: "처음부터<br />다시 입력하시겠어요?",
      noLabel: "아니요",
      yesLabel: "네",
      onNo: () => renderCancelled(simple),
      onYes: () => runFlow(),
      onClose: () => void openDepartmentScreen(),
    }),
    onYes: () => renderRoute(raw, () => renderTicket(raw.departmentId, simple)),
    onClose: () => void openDepartmentScreen(),
  });

  openDepartmentScreen();
}

runFlow();
