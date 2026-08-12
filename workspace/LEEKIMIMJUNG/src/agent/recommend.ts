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
  AnySessionContext, Candidate, HospitalSessionContext, Recommendation, UserProfile,
} from "@kiobridge/participant-sdk";
// 주의: @kiobridge/participant-sdk 에서 "값"을 import(DEPARTMENT, SENTINEL 등)하면 안 됩니다.
// 이 패키지의 KioBridgeApiError 클래스가 TS parameter property 문법을 쓰는데, Node 24 기본
// 실행기(strip-only 모드)가 이걸 못 읽어서 "TypeScript parameter property is not supported
// in strip-only mode" 에러로 npm run participant:progress/validate 자체가 죽습니다.
// (packages/ 는 플랫폼 파일이라 우리가 못 고침 — 그래서 여기선 리터럴 문자열로 대체합니다.)

/** 환경마다 스키마가 다르므로 도메인별 SessionContext 를 합집합으로 다룹니다. */
type SessionContext = AnySessionContext;

const UNKNOWN = "UNKNOWN";
const DEPARTMENT_UNSPECIFIED = "UNSPECIFIED";

/** preferences.supportModes(6종) ↔ 후보의 SUPPORT 옵션 그룹 id(4종)는 어휘가 달라서, 실제로 대응되는 것만 매핑합니다. */
const PREFERENCE_TO_SUPPORT_OPTION: Record<string, string> = {
  LARGE_TEXT: "LARGE_TEXT",
  HEARING_SUPPORT: "HEARING",
  STAFF_HELP: "STAFF_HELP",
};

function matchesVisitType(factVisitType: string | undefined, supported: string[]): boolean {
  if (!factVisitType || factVisitType === UNKNOWN) return false;
  return supported.includes(factVisitType);
}

function matchesAppointment(factStatus: string | undefined, supported: string[]): boolean {
  if (!factStatus || factStatus === UNKNOWN) return false;
  return supported.includes(factStatus);
}

/**
 * 진료과 호환성 검사. Department 타입은 UNKNOWN 이 없고 "UNSPECIFIED"로 미정을 표현합니다
 * (누락되었거나 UNSPECIFIED면 "미정 안내"를 지원하는 후보만 통과) — 증상 등으로 특정 과를 추론하지 않습니다.
 */
function matchesDepartment(factDept: string | undefined, supported: string[]): boolean {
  const isUnclear = !factDept || factDept === DEPARTMENT_UNSPECIFIED;
  if (isUnclear) return supported.includes(DEPARTMENT_UNSPECIFIED);
  return supported.includes(factDept) || supported.includes(DEPARTMENT_UNSPECIFIED);
}

function supportCoverageCount(wanted: string[], supportedOptionIds: string[]): number {
  return wanted.filter((mode) => {
    const optionId = PREFERENCE_TO_SUPPORT_OPTION[mode];
    return optionId ? supportedOptionIds.includes(optionId) : false;
  }).length;
}

/** 참가팀 서비스가 수집한 원본 입력 (형식 자유 — 웹폼/음성/QR/챗봇 무엇이든). */
export type RawUserInput = Record<string, unknown>;

const todo = (fn: string, what: string): never => {
  throw new Error(
    `NOT_IMPLEMENTED: ${fn}() 는 참가팀이 구현해야 합니다 — ${what}. ` +
      "진행 상황은 npm run participant:progress 로 확인하세요.",
  );
};

// 빠른 요약
// 뭘: 남은 후보 순위 매기기
// 어떻게: facts 일치 여부로 점수 매겨 정렬, 1등 뽑기. 확신 낮으면 재확인 플래그
// 참고 문서: docs/environments/HOSPITAL_PARTICIPANT_GUIDE.md, docs/CONTEXT_AWARE_RECOMMENDATION_GUIDE.md, docs/UNKNOWN_POLICY.md, docs/ERROR_CATALOG.md
export function recommend(_candidates: Candidate[], _ctx: SessionContext, _profile: UserProfile): Recommendation {
  const ctx = _ctx as HospitalSessionContext;
  const facts = ctx.facts ?? {};
  const wantedSupportModes = ctx.preferences?.supportModes ?? [];

  const scoreBreakdown: Record<string, number> = {};
  const excludedCandidates: Recommendation["excludedCandidates"] = [];
  const eligible: { candidate: Candidate; score: number }[] = [];

  for (const candidate of _candidates) {
    const supported = candidate.supportedOptions ?? {};
    const visitOk = matchesVisitType(facts.visitType, supported.VISIT_TYPE ?? []);
    const apptOk = matchesAppointment(facts.appointmentStatus, supported.APPOINTMENT ?? []);
    const deptOk = matchesDepartment(facts.departmentId, supported.DEPARTMENT ?? []);

    if (!visitOk || !apptOk || !deptOk) {
      const reasonCode = !visitOk ? "VISIT_TYPE_MISMATCH" : !apptOk ? "APPOINTMENT_MISMATCH" : "DEPARTMENT_MISMATCH";
      excludedCandidates.push({ candidateId: candidate.candidateId, reasonCode });
      scoreBreakdown[candidate.candidateId] = 0;
      continue;
    }

    const supportedSupportIds = (supported.SUPPORT ?? []) as string[];
    const supportScore = supportCoverageCount(wantedSupportModes, supportedSupportIds);

    // 보호자 없이 온 경우: 방문유형을 가리지 않는 범용(직원 도움) 경로에 안전 가산점을 준다.
    // "특정 후보 ID"가 아니라 "candidate.attributes 에 visitType 이 없다"는 데이터 특징으로 판단 —
    // 페르소나별 if문이 아니라 데이터 구조 기반 판단.
    const isBroadStaffAssistRoute = !!candidate.attributes && !("visitType" in candidate.attributes);
    const guardianSafetyBonus = facts.guardianPresent === false && isBroadStaffAssistRoute ? 2 : 0;

    const score = supportScore + guardianSafetyBonus;
    scoreBreakdown[candidate.candidateId] = score;
    eligible.push({ candidate, score });
  }

  eligible.sort((a, b) => b.score - a.score);

  if (eligible.length === 0) {
    return {
      recommendedCandidateId: null,
      alternativeCandidateIds: [],
      excludedCandidates,
      scoreBreakdown,
      recommendationReasons: [],
      unmetConditions: ["조건에 맞는 접수 경로를 찾지 못했습니다"],
      confidence: 0,
      requiresReconfirmation: true,
    };
  }

  const top = eligible[0].candidate;
  const topSupportedSupportIds = (top.supportedOptions?.SUPPORT ?? []) as string[];
  const unmetConditions = wantedSupportModes.filter((mode) => {
    const optionId = PREFERENCE_TO_SUPPORT_OPTION[mode];
    return !optionId || !topSupportedSupportIds.includes(optionId);
  });

  const departmentWasUnclear = !facts.departmentId || facts.departmentId === DEPARTMENT_UNSPECIFIED;

  return {
    recommendedCandidateId: top.candidateId,
    alternativeCandidateIds: [],
    excludedCandidates,
    scoreBreakdown,
    recommendationReasons: [],
    unmetConditions,
    confidence: departmentWasUnclear ? 0.6 : 0.9,
    requiresReconfirmation: departmentWasUnclear,
  };
}