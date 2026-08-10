/**
 * STEP 8 — collectUserDecision
 *
 * 목적:
 *   사용자에게 최종 확인을 받습니다. 자동 추천을 자동 실행으로 잇지 마세요.
 *
 * 입력:
 *   Recommendation
 *
 * 반환:
 *   UserDecision
 *
 * 반드시:
 *   - 수락 / 거절 / 다른 후보 선택 / 다시 입력 경로를 제공할 것
 *   - 거절하면 executionPlan.actions 는 빈 배열
 *   - confirmedAt 을 넣는다면 UTC Z 형식일 것
 *
 * 금지:
 *   - 승인 없이 실행계획 만들기
 *   - "확인" 버튼 없이 바로 진행
 *
 * 관련 오류:
 *   ACTIONS_WITHOUT_APPROVAL · USER_NOT_APPROVED · INVALID_UTC_TIMESTAMP
 *
 * 완료 확인:
 *   npm run participant:progress
 */
import type {
  Recommendation, UserDecision
} from "@kiobridge/participant-sdk";

/** 참가팀 서비스가 수집한 원본 입력 (형식 자유 — 웹폼/음성/QR/챗봇 무엇이든). */
export type RawUserInput = Record<string, unknown>;

const todo = (fn: string, what: string): never => {
  throw new Error(
    `NOT_IMPLEMENTED: ${fn}() 는 참가팀이 구현해야 합니다 — ${what}. ` +
      "진행 상황은 npm run participant:progress 로 확인하세요.",
  );
};

// 빠른 요약
// 뭘: 승인 화면
// 어떻게: 수락/거절/다른후보/다시입력 버튼, 클릭 결과 반환
// 참고 문서: docs/SAFETY_POLICY.md, docs/ERROR_CATALOG.md
export async function collectUserDecision(_rec: Recommendation): Promise<UserDecision> {
  return todo("collectUserDecision", "사용자 승인/거절 수집");
}