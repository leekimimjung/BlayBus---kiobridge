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
  AnySessionContext, Candidate, HospitalSessionContext
} from "@kiobridge/participant-sdk";
// 주의: @kiobridge/participant-sdk 에서 "값"을 import 하면 Node 24 기본 실행기(strip-only 모드)가
// 이 패키지의 KioBridgeApiError 클래스(parameter property 문법)를 못 읽어 에러가 납니다.
// (packages/ 는 플랫폼 파일이라 못 고침 — 그래서 타입만 가져오고 값은 안 씁니다.)

/** 환경마다 스키마가 다르므로 도메인별 SessionContext 를 합집합으로 다룹니다. */
type SessionContext = AnySessionContext;

/** 참가팀 서비스가 수집한 원본 입력 (형식 자유 — 웹폼/음성/QR/챗봇 무엇이든). */
export type RawUserInput = Record<string, unknown>;

/** 제외 사유를 기록하기 위한 저장소 (STEP6 explainRecommendation 설명 문구에 활용 가능). */
export const exclusionReasons = new Map<string, string>();

/**
 * Hard Constraint 위반 여부를 검사합니다.
 *
 * 후보의 requirements(있다면)를 세션의 hardConstraints/capabilities 와 일반적으로 대조합니다.
 * 병원 환경의 현재 6개 후보는 requirements 가 없어서 이 함수는 지금은 항상 false 를 반환하지만,
 * 다른 환경(알레르기·예산·인증수단 있는 requirements)이나 향후 후보 추가에도 그대로 동작하도록
 * 특정 후보 ID를 하드코딩하지 않고 범용으로 짰습니다.
 *
 * 🚨 hardConstraints.medicalInferenceAllowed 같은 "정책성" 값은 특정 후보를 배제하는 값이 아니라
 * "증상으로 진료과를 추론하면 안 된다"는 규칙이라, recommend() 단계에서 지켜야 합니다.
 * 여기서 후보를 걸러서 해결할 문제가 아닙니다.
 */
function violatesHardConstraints(candidate: Candidate, ctx: SessionContext): boolean {
  const hardConstraints = ((ctx as HospitalSessionContext).hardConstraints ?? {}) as Record<string, unknown>;
  const capabilities = ((ctx as HospitalSessionContext).capabilities ?? {}) as Record<string, unknown>;
  const requirements = (candidate.requirements ?? {}) as Record<string, unknown>;

  for (const [key, requiredValue] of Object.entries(requirements)) {
    if (key in hardConstraints && hardConstraints[key] !== requiredValue) return true;
    if (key in capabilities && capabilities[key] !== requiredValue) return true;
  }
  return false;
}

// 빠른 요약
// 뭘: 조건 위반 후보 제거
// 어떻게: candidates.filter()로 available=false, hardConstraint 위반 후보 걸러내기
// 참고 문서: docs/environments/HOSPITAL_PARTICIPANT_GUIDE.md, docs/UNKNOWN_POLICY.md, docs/ERROR_CATALOG.md
export function filterCandidates(candidates: Candidate[], ctx: SessionContext): Candidate[] {
  exclusionReasons.clear();

  return candidates.filter((c) => {
    // 1. available === false 인 후보는 완전히 제외 (CANDIDATE_UNAVAILABLE)
    if (c.available === false) {
      exclusionReasons.set(c.candidateId, "CANDIDATE_UNAVAILABLE");
      return false;
    }

    // 2. Hard Constraint 위반 후보 완전 제거 (감점이 아니라 제거)
    if (violatesHardConstraints(c, ctx)) {
      exclusionReasons.set(c.candidateId, "HARD_CONSTRAINT_VIOLATED");
      return false;
    }

    return true;
  });
}
