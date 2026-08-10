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
  AnySessionContext, Recommendation
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


export function explainRecommendation(_rec: Recommendation, _ctx: SessionContext): string[] {
  return todo("explainRecommendation", "추천 이유 설명 생성");
}