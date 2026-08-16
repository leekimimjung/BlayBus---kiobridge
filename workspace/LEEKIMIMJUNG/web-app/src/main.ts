// 이김임정 병원 무인 접수 안내 — 배포용 진입점.
// STEP1(collectProfile)~STEP9(buildExecutionPlan)를 실제 소스 그대로 브라우저에서 실행합니다.
// 외부 API 없이 동작하도록 hospital fixture를 정적으로 번들링해서 씁니다(순수 정적 사이트).
import "../../src/frontend/style.css";
import { collectProfile } from "../../src/frontend/collectProfile.ts";
import { collectUserDecision } from "../../src/frontend/collectUserDecision.ts";
import { mapToCanonicalInput } from "../../src/backend/mapToCanonicalInput.ts";
import { createSessionContext } from "../../src/backend/createSessionContext.ts";
import { filterCandidates } from "../../src/agent/filterCandidates.ts";
import { recommend } from "../../src/agent/recommend.ts";
import { explainRecommendation } from "../../src/agent/explainRecommendation.ts";
import { buildAlternatives } from "../../src/agent/buildAlternatives.ts";
import { buildExecutionPlan } from "../../src/backend/buildExecutionPlan.ts";
import hospitalFixture from "./hospital.fixture.json";

const TEAM_ID = "LEEKIMIMJUNG";

function completionScreenHTML(approved: boolean): string {
  return `
  <header class="status-bar">
    <div class="brand"><strong>은빛 병원</strong></div>
  </header>
  <div class="page">
    <section class="screen form-screen cp-screen">
      <h1 class="title-lg">${approved ? "안내가 끝났어요" : "다음에 다시 안내해 드릴게요"}</h1>
      <p class="subtitle">${
        approved
          ? "실제 접수·결제는 진행되지 않았습니다 (SIMULATION_ONLY · DIGITAL_TWIN 데모입니다)."
          : "언제든 처음부터 다시 시작하실 수 있어요."
      }</p>
    </section>
    <footer class="bottom-actions">
      <button type="button" class="primary-action" data-action="restart">처음부터 다시 시작하기</button>
    </footer>
  </div>`;
}

async function run(): Promise<void> {
  const raw = await collectProfile();
  const fixture = hospitalFixture as any;

  const profile = mapToCanonicalInput(raw);
  const sessionContext = createSessionContext(raw, fixture);
  const survivors = filterCandidates(fixture.candidates, sessionContext);
  const recommendation = recommend(survivors, sessionContext, profile);
  recommendation.recommendationReasons = explainRecommendation(recommendation, sessionContext);
  recommendation.alternativeCandidateIds = buildAlternatives(survivors, recommendation);

  const userDecision = await collectUserDecision(recommendation);
  // 승인된 경우에만 실행계획을 만듭니다 — 승인 없이 실행계획을 만들지 않습니다.
  const executionPlan = (userDecision as any).approved
    ? buildExecutionPlan(userDecision, recommendation, fixture)
    : { validationMode: "SIMULATION_ONLY", executionEnvironment: "DIGITAL_TWIN", actualDeviceCommandSent: false, actions: [] };

  // eslint-disable-next-line no-console
  console.log("participant-submission (데모, 실제 제출 아님):", {
    inputContractVersion: "1.0.0",
    submissionVersion: "1.0.0",
    teamId: TEAM_ID,
    environmentId: fixture.manifest.environmentId,
    profile,
    sessionContext,
    recommendation,
    userDecision,
    executionPlan,
  });

  const mount = document.querySelector<HTMLElement>("#app")!;
  mount.innerHTML = completionScreenHTML(!!(userDecision as any).approved);
  mount.querySelector<HTMLElement>('[data-action="restart"]')?.addEventListener("click", () => {
    window.location.reload();
  });
}

run().catch((err) => {
  const mount = document.querySelector<HTMLElement>("#app")!;
  mount.innerHTML = `<div class="page"><section class="screen form-screen cp-screen"><h1 class="title-lg">문제가 생겼어요</h1><p class="subtitle">${String((err as Error).message ?? err)}</p></section></div>`;
  // eslint-disable-next-line no-console
  console.error(err);
});
