// 이현재, 정세윤 담당
/**
 * STEP 2 — mapToCanonicalInput
 *
 * 목적:
 *   수집한 임의 형식 데이터를 오래 유지되는 CanonicalProfile 로 변환합니다.
 *
 * 입력:
 *   RawUserInput
 *
 * 반환:
 *   UserProfile
 *
 * 반드시:
 *   - language 는 "ko-KR" 처럼 지역까지 포함 ("ko" 는 거부됩니다)
 *   - 접근성 요구는 공식 enum 사용 (docs/ENUM_REFERENCE.md)
 *   - source.collectedAt 은 UTC Z 타임스탬프 (예: 2026-08-03T00:11:00Z)
 *     SDK 의 nowIso8601Utc() 를 쓰면 안전합니다
 *
 * 금지:
 *   - 오늘 주문할 메뉴처럼 이번 세션에만 해당하는 값을 profile 에 저장
 *   - 모르는 정보를 추측해서 채우기 (UNKNOWN 을 쓰거나 필드를 생략)
 *   - 실제 개인식별정보 저장
 *
 * 관련 오류:
 *   DOMAIN_CONTEXT_MISMATCH · INVALID_UTC_TIMESTAMP · SCHEMA_INVALID
 *   ENUM_VALUE_INVALID · PERSONAL_DATA_NOT_ALLOWED
 *
 * 의사코드:
 *   return {
 *     profileId, dataClassification: "SYNTHETIC_PROFILE",
 *     source: { collectionChannel, providerId, collectedAt: nowIso8601Utc() },
 *     accessibility: { largeText, simpleSteps, ... },
 *     interaction: { preferredInput, language: "ko-KR", confirmationRequired },
 *     consent: { personalization, retentionPolicy },
 *   };
 *
 * 완료 확인:
 *   npm run participant:progress
 */

// STEP 2

import type {
  AnySessionContext, UserProfile,
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


export function mapToCanonicalInput(_raw: RawUserInput): UserProfile {
  return todo("mapToCanonicalInput", "원본 입력 → Canonical Profile 변환");
}