/**
 * STEP 3 — createSessionContext
 *
 * 목적:
 *   이번 이용에만 해당하는 맥락을 만듭니다.
 *
 * 입력:
 *   RawUserInput, PublicFixture
 *
 * 반환:
 *   SessionContext
 *
 * 반드시:
 *   - 섹션을 구분할 것. 의미가 다릅니다:
 *       intent          무엇을 하러 왔는가
 *       facts           확인된 사실 (재진이다, 예약이 있다)
 *       preferences     선호 — 양보 가능
 *       hardConstraints 절대 조건 — 양보 불가 (알레르기, 예산)
 *       capabilities    가능한 수단 (쓸 수 있는 인증수단)
 *       fieldMetadata   각 값의 출처·신뢰도·확인 여부
 *   - 외부 맥락(날씨·혼잡도)은 extensions 에 팀 namespace 로 넣을 것
 *
 * 금지:
 *   - 선호를 hardConstraints 에 넣기 (반대도 마찬가지)
 *   - 외부 맥락으로 hardConstraints 를 덮어쓰기
 *   - capturedAt 에 로컬 시각이나 +09:00 넣기
 *
 * 관련 오류:
 *   DOMAIN_CONTEXT_MISMATCH · INVALID_UTC_TIMESTAMP · UNKNOWN_FIELD
 *
 * 의사코드:
 *   return {
 *     intent: { task },
 *     facts: {}, preferences: {}, hardConstraints: {}, capabilities: {},
 *     fieldMetadata: { "/preferences/x": { source, confidence, confirmedByUser } },
 *     extensions: { "TEAM_001.contextSignals": [...] },
 *   };
 *
 * 완료 확인:
 *   npm run participant:progress
 */

import type {
  AnySessionContext, PublicFixture
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

export function createSessionContext(_raw: RawUserInput, _fixture: PublicFixture): SessionContext {
  return todo("createSessionContext", "세션 맥락(intent/facts/preferences/hardConstraints) 구성");
}