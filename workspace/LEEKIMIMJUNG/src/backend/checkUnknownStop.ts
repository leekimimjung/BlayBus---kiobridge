/**
 * UNKNOWN 상태·수동개입 발생 시 STOP 처리 로직
 *
 * 목적:
 *   createSessionContext() 직후, recommend() 호출 직전에 실행하는 안전 게이트입니다.
 *   확신할 수 없는 값으로 AI가 임의 판단하지 못하게 막습니다.
 *
 * 입력:
 *   SessionContext
 *
 * 반환:
 *   UnknownStopResult
 *     - stop: true 면 recommend()/buildExecutionPlan() 까지 가지 않고 즉시 STOP
 *     - requiresReconfirmation: true 면 계속 진행하되 추천에 재확인 필요 표시
 *     - reasons: STOP/재확인 사유 (설명·로그용)
 *
 * 반드시:
 *   - hardConstraints.medicalInferenceAllowed 가 false 가 아니면 정책 위반으로 STOP
 *   - fieldMetadata 상 confidence 낮고(0.6 미만) confirmedByUser 가 false 인 필드가 있으면
 *     재확인 필요로 표시 (임의로 그 값을 믿고 진행하지 않음)
 *
 * 금지:
 *   - 저신뢰·미확인 값을 그냥 무시하고 정상 진행
 *   - STOP 사유를 기록하지 않고 조용히 멈추기
 *
 * 참고 문서: docs/UNKNOWN_POLICY.md, docs/environments/HOSPITAL_PARTICIPANT_GUIDE.md
 *
 * 완료 확인:
 *   npm run participant:progress
 */

import type {
  AnySessionContext, HospitalSessionContext,
} from "@kiobridge/participant-sdk";

type SessionContext = AnySessionContext;

const LOW_CONFIDENCE_THRESHOLD = 0.6;

export interface UnknownStopResult {
  stop: boolean;
  requiresReconfirmation: boolean;
  reasons: string[];
}

export function checkUnknownStop(ctx: SessionContext): UnknownStopResult {
  const hospitalCtx = ctx as HospitalSessionContext;
  const hardConstraints = hospitalCtx.hardConstraints ?? {};
  const fieldMetadata = hospitalCtx.fieldMetadata ?? {};

  // 1. 정책성 hardConstraint 위반 — medicalInferenceAllowed 는 항상 false 로 고정돼야 함.
  //    다른 값(true/undefined/UNKNOWN 등)이면 세션 자체가 신뢰할 수 없는 상태라 STOP.
  if (hardConstraints.medicalInferenceAllowed !== false) {
    return {
      stop: true,
      requiresReconfirmation: false,
      reasons: ["hardConstraints.medicalInferenceAllowed 가 false 가 아님 (정책 위반)"],
    };
  }

  // 2. 저신뢰 + 사용자 미확인 필드 검사 (예: 음성 입력인데 확인을 안 받은 경우)
  const uncertainFields = Object.entries(fieldMetadata).filter(
    ([, meta]) => (meta?.confidence ?? 1) < LOW_CONFIDENCE_THRESHOLD && meta?.confirmedByUser !== true,
  );

  if (uncertainFields.length > 0) {
    return {
      stop: false,
      requiresReconfirmation: true,
      reasons: uncertainFields.map(([path]) => `${path} — 저신뢰·미확인 값이라 재확인 필요`),
    };
  }

  return { stop: false, requiresReconfirmation: false, reasons: [] };
}
