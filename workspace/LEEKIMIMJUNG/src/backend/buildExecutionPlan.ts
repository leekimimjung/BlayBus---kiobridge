/**
 * STEP 9 — buildExecutionPlan
 *
 * 목적:
 *   승인된 결정을 의미 기반 실행계획으로 바꿉니다.
 *
 * 입력:
 *   UserDecision, Recommendation, PublicFixture
 *
 * 반환:
 *   ExecutionPlan
 *
 * 반드시:
 *   - target 은 { kind, id, groupId? } 의미 대상. 좌표·컨트롤 ID 를 쓰지 않습니다
 *   - fixture.transitions 를 따라 expectedBeforeState / expectedAfterState 를 채울 것
 *   - manifest.reviewBoundaryState 에서 멈추고 필수 verifier 를 실행할 것
 *   - 실제로 고른 값이 사용자 맥락과 맞을 것 (Stage B 검증)
 *
 * 금지:
 *   - 결제 · 본인확인 완료 · 행정처리 확정 Action (계획에 넣기만 해도 FAIL)
 *   - 같은 단일선택 옵션 그룹을 서로 다른 값으로 두 번 선택
 *   - 화면 페이지 이동 Action (Driver 가 알아서 넘깁니다)
 *
 * 관련 오류:
 *   SELECTED_VISIT_TYPE_MISMATCH · SELECTED_APPOINTMENT_MISMATCH
 *   SELECTED_DEPARTMENT_MISMATCH · SELECTED_AUTH_METHOD_UNAVAILABLE
 *   SELECTED_QUANTITY_MISMATCH · EXECUTION_REQUIRED_OPTION_MISSING
 *   EXECUTION_OPTION_DUPLICATE · STATE_MISMATCH · MISSING_VERIFIER
 *   BOUNDARY_NOT_REACHED · FORBIDDEN_ACTION
 *
 * 의사코드:
 *   const actions = [];
 *   actions.push({ actionIndex: 0, action: "select_menu",
 *                  target: { kind: "candidate", id: rec.recommendedCandidateId },
 *                  expectedBeforeState, expectedAfterState });
 *   // ... 필수 옵션 그룹을 사용자 선택대로 채움
 *   // ... 마지막에 verifier action
 *
 * 완료 확인:
 *   npm run participant:validate -- --file <출력 JSON> --execute
 */
import type {
  ExecutionPlan, PublicFixture, Recommendation, UserDecision,
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
// 뭘: 실행계획 만들기
// 어떻게: fixture.transitions 순서대로 액션 나열, 마지막에 verify_checkin
export function buildExecutionPlan(_decision: UserDecision, _rec: Recommendation, _fixture: PublicFixture): ExecutionPlan {
  return todo("buildExecutionPlan", "의미 기반 실행계획 생성 (경계 전 정지 + verifier)");
}