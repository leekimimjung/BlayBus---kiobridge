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

// [0단계] 백엔드 팀 완성을 기다리지 않고 테스트하기 위한 Mock 세션 컨텍스트
const mockSessionContext: SessionContext = {
  visitType: "FIRST_VISIT",
  appointment: "NO_APPOINTMENT",
  department: "UNSPECIFIED" // 🚨 주의: 증상으로 진료과를 임의 추론하는 로직 금지!
} as any;

// 제외 사유를 기록하기 위한 저장소 (나중에 설명 문구에 활용)
export const exclusionReasons = new Map<string, string>();

/**
 * Hard Constraint 위반 여부를 검사하는 함수
 */
function violatesHardConstraints(candidate: Candidate, ctx: SessionContext): boolean {
  // TODO: 절대 규칙 위반 시 true 반환
  return false; 
}

// 빠른 요약
// 뭘: 조건 위반 후보 제거
// 어떻게: candidates.filter()로 available=false, hardConstraint 위반 후보 걸러내기
export function filterCandidates(candidates: Candidate[], ctx: SessionContext = mockSessionContext): Candidate[] {
  exclusionReasons.clear();

  // 의사코드 반영 및 available, hardConstraints 검사
  return candidates.filter((c) => {
    // 1. available === false 인 후보는 완전히 제외 (CANDIDATE_UNAVAILABLE)
    if (c.available === false) {
      exclusionReasons.set((c as any).id, "CANDIDATE_UNAVAILABLE");
      return false;
    }

    // 2. Hard Constraint 위반 후보 완전 제거 (감점 아님)
    if (violatesHardConstraints(c, ctx)) {
      exclusionReasons.set((c as any).id, "HARD_CONSTRAINT_VIOLATED");
      return false;
    }

    return true;
  });
}