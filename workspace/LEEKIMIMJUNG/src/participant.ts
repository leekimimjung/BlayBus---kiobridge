/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  참가팀이 구현하는 9개 단계                                                ║
 * ║                                                                          ║
 * ║  이 파일이 여러분의 시작점입니다. 아홉 개 함수가 모두 NOT_IMPLEMENTED      ║
 * ║  이며, KioBridge 는 이 중 어느 것도 대신 만들어 주지 않습니다.             ║
 * ║                                                                          ║
 * ║  진행 확인:  npm run participant:progress                                 ║
 * ║  제출 검증:  npm run participant:validate -- --file <내 제출.json>         ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * 용어 (처음 보는 경우)
 *   Canonical Profile   수집 방식과 무관하게 KioBridge 가 공통으로 이해하는
 *                       사용자 정보 형식
 *   SessionContext      이번 이용에만 해당하는 맥락 (오늘 무엇을 하러 왔는가)
 *   Fixture             환경의 후보·옵션·화면·상태전환이 든 공개 데이터
 *   Semantic Plan       좌표가 아니라 "무엇을 어떤 순서로 고를지" 를 적은 계획
 *   Evidence            서버가 만든 시뮬레이션 실행 증거
 *
 * 참고 문서
 *   docs/environments/<환경>_PARTICIPANT_GUIDE.md   환경별 수집 항목
 *   docs/ERROR_CATALOG.md                           오류코드 → 고칠 파일
 *   docs/PROFILE_DATA_DICTIONARY.md                 Profile 필드 사전
 *   docs/SESSION_CONTEXT_DICTIONARY.md              SessionContext 필드 사전
 *   docs/UNKNOWN_POLICY.md                          모르는 값을 추론하지 않는 규칙
 *   examples/annotated/                             주석 달린 예제 (제출 불가)
 */
import type {
  ParticipantSubmission, PublicFixture
} from "@kiobridge/participant-sdk";

/* ═══════════════════════════ 1. 수집 ═══════════════════════════ */
import { collectProfile } from "./frontend/collectProfile.ts";
import { mapToCanonicalInput } from "./backend/mapToCanonicalInput.ts"
import { createSessionContext } from "./backend/createSessionContext.ts";

/* ═══════════════════════════ 2. 추천 ═══════════════════════════ */
import { filterCandidates } from "./agent/filterCandidates.ts";
import { recommend } from "./agent/recommend.ts";
import { explainRecommendation } from "./agent/explainRecommendation.ts";
import { buildAlternatives } from "./agent/buildAlternatives.ts";

/* ═══════════════════════ 3. 승인과 실행계획 ═══════════════════════ */
import { collectUserDecision } from "./frontend/collectUserDecision.ts";



/* ═══════════════════════════ 조립 ═══════════════════════════ */
import { buildExecutionPlan } from "./backend/buildExecutionPlan.ts";

/** 위 9단계를 순서대로 엮어 제출물을 만듭니다. 구현 전에는 STEP 1 에서 멈춥니다. */
export async function buildSubmission(fixture: PublicFixture, teamId: string): Promise<ParticipantSubmission> {
  const raw = await collectProfile();
  const profile = mapToCanonicalInput(raw);
  const sessionContext = createSessionContext(raw, fixture);

  const survivors = filterCandidates(fixture.candidates, sessionContext);
  const recommendation = recommend(survivors, sessionContext, profile);
  recommendation.recommendationReasons = explainRecommendation(recommendation, sessionContext);
  recommendation.alternativeCandidateIds = buildAlternatives(survivors, recommendation);

  const userDecision = await collectUserDecision(recommendation);
  const executionPlan = buildExecutionPlan(userDecision, recommendation, fixture);

  return {
    inputContractVersion: "1.0.0",
    submissionVersion: "1.0.0",
    teamId,
    environmentId: fixture.manifest.environmentId,
    profile, sessionContext, recommendation, userDecision, executionPlan,
  } as ParticipantSubmission;
}
