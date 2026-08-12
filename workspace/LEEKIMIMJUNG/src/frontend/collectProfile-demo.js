// collectProfile 브라우저 데모 부트스트랩.
// collectProfile.demo.js(컴파일된 모듈)로 정보를 모은 뒤,
// 수집 화면 대신 "해당 진료과 안내 → 대기 번호 발급" 화면으로 이어집니다.
import { collectProfile } from "./collectProfile.demo.js";

const root = document.querySelector("#app");

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

const headerHTML = () => `
  <header class="status-bar">
    <div class="brand"><span class="brand-mark"></span><strong>은빛 병원</strong></div>
    <div class="clock"><small>6월 15일</small> <strong>3:36</strong></div>
  </header>`;

const progressHTML = (current) => `
  <div class="progress" aria-label="진행 단계 ${current + 1}/5">
    ${Array.from({ length: 5 }, (_, index) => `<span class="${index <= current ? "active" : ""}"></span>`).join("")}
  </div>`;

function resetFontScale() {
  document.documentElement.style.fontSize = "15px";
  document.documentElement.classList.remove("high-contrast");
}

function departmentName(departmentId) {
  return DEPARTMENT_NAMES[departmentId] ?? departmentId;
}

function renderRoute(raw, onTicket) {
  const departmentId = raw.departmentId;
  const name = departmentName(departmentId);
  const short = departmentId === "UNSPECIFIED" ? "일반안내" : name.replace("센터", "");
  const voice = !!raw.VOICE_GUIDANCE;
  const steps = departmentId === "UNSPECIFIED"
    ? ['<li><span>1</span>로비 안내데스크로 이동</li>', '<li><span>2</span>직원이 접수부터 도와드릴게요</li>']
    : ['<li><span>1</span>엘리베이터로 3층 이동</li>', `<li><span>2</span>${name} 접수 데스크</li>`];
  root.innerHTML = `
    ${headerHTML()}
    <div class="page">
      ${progressHTML(4)}
      <section class="screen form-screen route-screen cp-screen">
        ${voice ? '<div class="pill-row"><span class="pill pill-voice">음성 안내 모드</span></div>' : ""}
        <h1 class="title-lg">${name}까지<br />안내해 드릴게요</h1>
        <div class="map" role="img" aria-label="병원 3층 ${name} 안내 지도">
          <div class="map-grid"></div><div class="route-line"></div>
          <span class="map-start">1층<br />현재 위치</span>
          <span class="map-end">${short}<br /></span>
          <span class="map-badge">소요<br /><strong>3분</strong></span>
        </div>
        <ol class="directions">${steps.join("")}</ol>
      </section>
      <footer class="bottom-actions">
        <button type="button" class="primary-action" data-action="ticket">번호표 받기</button>
      </footer>
    </div>`;
  root.querySelector('[data-action="ticket"]').addEventListener("click", onTicket);
}

let ticketTimer = null;

function renderTicket(departmentId) {
  const number = Math.floor(Math.random() * 20) + 1;
  root.innerHTML = `
    ${headerHTML()}
    <div class="page">
      <section class="screen completion-screen">
        <div class="complete-icon">✓</div>
        <h1>대기 번호 ${number}번이<br />발급되었어요</h1>
        <p>${departmentName(departmentId)} 접수로<br />번호표가 발급되었어요</p>
      </section>
      <footer class="bottom-actions col">
        <p class="auto-return-note" role="timer">10초 뒤 처음 화면으로 자동으로 넘어가요</p>
        <button type="button" class="secondary-action wide restart-btn" data-action="restart">처음으로</button>
      </footer>
    </div>`;
  root.querySelector('[data-action="restart"]').addEventListener("click", () => {
    clearInterval(ticketTimer);
    ticketTimer = null;
    runFlow();
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

async function runFlow() {
  resetFontScale();
  root.innerHTML = "";
  const raw = await collectProfile();
  renderRoute(raw, () => renderTicket(raw.departmentId));
}

runFlow();
