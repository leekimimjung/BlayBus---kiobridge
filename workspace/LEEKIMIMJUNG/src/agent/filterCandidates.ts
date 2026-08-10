/**
 * STEP 4 — filterCandidates
 *
 * 목적:
 *   hardConstraints 를 위반하는 후보를 후보군에서 제거합니다.
 *
 * 입력:
 *   Candidate[] (fixture.candidates), SessionContext
 *
 * 반환:
 *   Candidate[] — 남은 후보
 *
 * 반드시:
 *   - 알레르기·예산·인증수단 위반은 "점수를 깎는" 것이 아니라 "빼는" 것
 *   - available === false 인 후보 제외
 *   - 제외 사유를 기록해 둘 것 (STEP 6 에서 설명에 씁니다)
 *
 * 금지:
 *   - hardConstraint 위반 후보를 낮은 점수로만 처리하고 남겨두기
 *   - UNKNOWN 인 제약을 "없는 것" 으로 간주
 *
 * 관련 오류:
 *   ALLERGEN_CONFLICT · PRICE_LIMIT_EXCEEDED · CANDIDATE_UNAVAILABLE
 *   AUTH_METHOD_UNAVAILABLE
 *
 * 의사코드:
 *   return candidates.filter((c) =>
 *     c.available && !violatesHardConstraints(c, ctx));
 *
 * 완료 확인:
 *   npm run participant:progress
 */

import type {
  AnySessionContext, Candidate
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

export function filterCandidates(_candidates: Candidate[], _ctx: SessionContext): Candidate[] {
  return todo("filterCandidates", "hardConstraint 위반 후보 제외");
}