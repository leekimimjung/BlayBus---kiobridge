/**
 * STEP 5 — recommend
 *
 * 목적:
 *   남은 후보의 순위를 정하고 1순위를 고릅니다.
 *
 * 입력:
 *   Candidate[] (필터 통과), SessionContext, UserProfile
 *
 * 반환:
 *   Recommendation
 *
 * 반드시:
 *   - 가중치와 점수 설계는 전적으로 여러분의 몫이며 심사 대상입니다
 *   - 확신이 낮으면 requiresReconfirmation 을 true 로
 *   - 사용자 사실과 충돌하지 않는 후보를 고를 것 (Stage A 검증)
 *
 * 금지:
 *   - 사용자가 UNKNOWN 이라고 한 값을 임의로 정해서 고르기
 *   - 병원에서 증상으로 진료과를 추론하기
 *   - 관공서에서 법적 자격을 판단하기
 *
 * 관련 오류:
 *   VISIT_TYPE_MISMATCH · APPOINTMENT_MISMATCH · DEPARTMENT_MISMATCH
 *   AUTH_METHOD_UNAVAILABLE · REQUESTED_SERVICE_MISMATCH
 *   LOW_CONFIDENCE_RECONFIRMATION_REQUIRED
 *
 * 의사코드:
 *   const ranked = survivors.map((c) => ({ c, score: myScore(c, ctx) }))
 *                           .sort((a, b) => b.score - a.score);
 *   return { recommendedCandidateId: ranked[0].c.candidateId, ... };
 *
 * 완료 확인:
 *   npm run participant:progress
 */
import type {
  AnySessionContext, Candidate, Recommendation, UserProfile,
} from "@kiobridge/participant-sdk";

/** 환경마다 스키마가 다르므로 도메인별 SessionContext 를 합집합으로 다룹니다. */
type SessionContext = AnySessionContext;

/** 참가팀 서비스가 수집한 원본 입력 (형식 자유 — 웹폼/음성/QR/챗봇 무엇이든). */
export type RawUserInput = Record<string, unknown>;

const todo = (fn: string, what: string): never => {
  throw new Error(
    `NOT_IMPLEMENTED: ${fn}() 는 참가팀이 구현해야 합니다 — ${what}. ` +
      "진행 상황은 npm run participant:progress 로 확인하세요.",
  );
};

export function recommend(_candidates: Candidate[], _ctx: SessionContext, _profile: UserProfile): Recommendation {
  return todo("recommend", "후보 순위 결정 및 1순위 추천");
}