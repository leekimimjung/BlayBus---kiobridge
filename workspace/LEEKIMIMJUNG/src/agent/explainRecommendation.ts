/**
 * STEP 6 — explainRecommendation
 *
 * 목적:
 *   왜 이것을 추천했는지 사용자의 말로 설명합니다.
 *
 * 입력:
 *   Recommendation, SessionContext
 *
 * 반환:
 *   string[] — 최소 1개 (진행검사에서 확인합니다)
 *
 * 반드시:
 *   - 사용한 사용자 정보를 밝힐 것
 *   - 외부 맥락(날씨 등)을 썼다면 그 이유도 한 줄 포함할 것
 *   - 제외한 조건도 설명할 것
 *
 * 금지 (이런 문장은 설명이 아닙니다):
 *   "AI가 추천했습니다" · "최적의 선택입니다" · "시스템 판단입니다"
 *
 * 권장:
 *   "포장을 선호하셔서 포장 가능한 메뉴를 먼저 보여드렸습니다."
 *   "등록하신 알레르기와 겹치는 메뉴는 제외했습니다."
 *   "지금 비가 내려 따뜻한 메뉴를 앞에 두었습니다."
 *
 * 관련 오류:
 *   (없음 — 하지만 이유가 비어 있으면 진행검사가 경고합니다)
 *
 * 완료 확인:
 *   npm run participant:progress
 */
import type {
  AnySessionContext, HospitalSessionContext, Recommendation
} from "@kiobridge/participant-sdk";
// 주의: @kiobridge/participant-sdk 에서 "값"을 import 하면 Node 24 기본 실행기(strip-only 모드)가
// 이 패키지의 KioBridgeApiError 클래스(parameter property 문법)를 못 읽어 에러가 납니다.
// (packages/ 는 플랫폼 파일이라 못 고침 — 그래서 여기선 리터럴 문자열로 대체합니다.)

/** 환경마다 스키마가 다르므로 도메인별 SessionContext 를 합집합으로 다룹니다. */
type SessionContext = AnySessionContext;

const VISIT_TYPE_LABEL: Record<string, string> = {
  FIRST_VISIT: "초진",
  REVISIT: "재진",
  HEALTH_SCREENING: "건강검진",
  EXAM: "검사",
};

const APPOINTMENT_LABEL: Record<string, string> = {
  HAS_APPOINTMENT: "예약이 있는",
  NO_APPOINTMENT: "예약이 없는",
};

const DEPARTMENT_LABEL: Record<string, string> = {
  INTERNAL_MEDICINE: "내과",
  ORTHOPEDICS: "정형외과",
  ENT: "이비인후과",
  RADIOLOGY: "영상의학과",
  HEALTH_SCREENING: "건강검진센터",
};

/** 참가팀 서비스가 수집한 원본 입력 (형식 자유 — 웹폼/음성/QR/챗봇 무엇이든). */
export type RawUserInput = Record<string, unknown>;

const todo = (fn: string, what: string): never => {
  throw new Error(
    `NOT_IMPLEMENTED: ${fn}() 는 참가팀이 구현해야 합니다 — ${what}. ` +
      "진행 상황은 npm run participant:progress 로 확인하세요.",
  );
};


// 빠른 요약
// 뭘: 추천 이유 문장 만들기
// 어떻게: "왜 이걸 골랐는지" 최소 1문장, 사용한 조건 언급 ("AI가 추천" 같은 문구 금지)
// 참고 문서: docs/EXPLAINABLE_RECOMMENDATION_GUIDE.md
export function explainRecommendation(_rec: Recommendation, _ctx: SessionContext): string[] {
  const ctx = _ctx as HospitalSessionContext;
  const facts = ctx.facts ?? {};
  const reasons: string[] = [];

  if (!_rec.recommendedCandidateId) {
    reasons.push("입력하신 조건에 정확히 맞는 접수 경로를 찾지 못해, 직원 도움을 통한 안내를 권해드립니다.");
    return reasons;
  }

  const visitLabel = VISIT_TYPE_LABEL[facts.visitType ?? ""];
  const apptLabel = APPOINTMENT_LABEL[facts.appointmentStatus ?? ""];
  if (visitLabel && apptLabel) {
    reasons.push(`${visitLabel}이시고 ${apptLabel} 상태에 맞는 접수 경로로 안내해 드렸습니다.`);
  }

  const departmentWasUnclear = !facts.departmentId || facts.departmentId === "UNSPECIFIED";

  const departmentLabel = facts.departmentId ? DEPARTMENT_LABEL[facts.departmentId] : undefined;

  if (departmentWasUnclear) {
    reasons.push("진료과를 직접 말씀하지 않으셔서, 임의로 정하지 않고 일반 안내 경로로 안내해 드립니다.");
  } else if (departmentLabel) {
    reasons.push(`말씀하신 진료과(${departmentLabel})에 맞는 경로로 안내해 드렸습니다.`);
  } else {
    reasons.push("말씀하신 진료과에 맞는 경로로 안내해 드렸습니다.");
  }

  if (facts.guardianPresent === false) {
    reasons.push("보호자 동행 없이 오셔서, 직원 도움을 받을 수 있는 경로를 우선으로 안내해 드렸습니다.");
  }

  if (_rec.unmetConditions && _rec.unmetConditions.length > 0) {
    reasons.push(`요청하신 지원 중 일부(${_rec.unmetConditions.join(", ")})는 이 경로에서 제공되지 않을 수 있습니다.`);
  }

  return reasons;
}