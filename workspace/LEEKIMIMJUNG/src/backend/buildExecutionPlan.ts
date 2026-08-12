/**
 * STEP 9 — buildExecutionPlan
 *
 * 목적:
 *   승인된 결정을 의미 기반 실행계획으로 바꿉니다.
 *
 * 참고:
 *   selectedOptions 값은 결국 STEP 3(SessionContext.preferences)에서 온 사용자 선호이며,
 *   Soft 불일치는 BLOCK 대상이 아니라 추천 이유 설명 대상입니다 (SESSION_CONTEXT_DICTIONARY).
 *   여기서는 "후보가 그 옵션을 지원하는지"만 검증합니다 (Stage B 실행 가능성 검증).
 *
 * 반드시:
 *   - target 은 { kind, id, groupId? } 의미 대상만 사용
 *   - fixture.transitions 를 따라 expectedBeforeState / expectedAfterState 채움
 *   - manifest.reviewBoundaryState 에서 멈추고 필수 verifier 실행
 *   - 실제로 고른 값이 사용자 맥락과 일치해야 함 (Stage B 검증)
 *
 * 금지:
 *   - 결제 · 본인확인 완료 · 행정처리 확정 Action
 *   - 같은 단일선택 옵션 그룹을 다른 값으로 두 번 선택
 *   - 화면 페이지 이동 Action
 */
import type {
  ExecutionPlan, PublicFixture, Recommendation, UserDecision,
} from "@kiobridge/participant-sdk";

export type RawUserInput = Record<string, unknown>;

const FORBIDDEN_ACTIONS = new Set<string>([
  "make_payment",
  "select_payment",
  "confirm_payment",
  "complete_checkin",
  "submit_application",
  "issue_document",
  "confirm_identity",
  "verify_identity_complete",
]);

export function buildExecutionPlan(
  _decision: UserDecision,
  _rec: Recommendation,
  _fixture: PublicFixture,
): ExecutionPlan {
  const decision: any = _decision;
  const rec: any = _rec;
  const fixture: any = _fixture;

  const emptyPlan: any = { actions: [] };

  if (!decision || decision.approved !== true) {
    return emptyPlan as ExecutionPlan;
  }

  const manifest = fixture?.manifest ?? {};
  const transitions: any[] = fixture?.transitions ?? [];
  const optionGroups: any[] = fixture?.optionGroups ?? [];
  const candidates: any[] = fixture?.candidates ?? [];

  const recommendedCandidateId: string | undefined =
    rec?.recommendedCandidateId ?? rec?.candidateId ?? rec?.selectedCandidateId;

  if (!recommendedCandidateId) {
    return emptyPlan as ExecutionPlan;
  }

  const candidate = candidates.find((c: any) => c && c.id === recommendedCandidateId);
  if (!candidate) {
    return emptyPlan as ExecutionPlan;
  }

  const actions: any[] = [];
  let actionIndex = 0;
  let currentState: string = manifest.initialState ?? "";

  const findTransition = (from: string, action: string) =>
    transitions.find((t: any) => t && t.from === from && t.action === action);

  const pushAction = (action: string, target: Record<string, unknown>): boolean => {
    if (FORBIDDEN_ACTIONS.has(action)) {
      return false;
    }
    const transition = findTransition(currentState, action);
    const expectedBeforeState = currentState;
    const expectedAfterState = transition ? transition.to : currentState;

    actions.push({
      actionIndex: actionIndex++,
      action,
      target,
      expectedBeforeState,
      expectedAfterState,
    });

    currentState = expectedAfterState;
    return true;
  };

  // 1. 추천 후보 선택
  pushAction("select_menu", {
    kind: "candidate",
    id: recommendedCandidateId,
  });

  // 2. 필수 옵션 그룹 채우기 (선택값은 SessionContext.preferences 기반)
  const supportedOptions: any = candidate.supportedOptions ?? {};
  const supportedOptionGroupIds: string[] = Object.keys(supportedOptions);
  const selectedOptions: any =
    decision.selectedOptions ?? rec.selectedOptions ?? {};
  const filledGroups = new Set<string>();

  for (const group of optionGroups) {
    if (!group) continue;
    const groupId: string = group.id;
    if (!supportedOptionGroupIds.includes(groupId)) continue;
    if (filledGroups.has(groupId)) continue;

    const chosenValue = selectedOptions[groupId];

    if (chosenValue == null) {
      if (group.required) {
        return emptyPlan as ExecutionPlan;
      }
      continue;
    }

    const supportedValues: string[] = supportedOptions[groupId] ?? [];
    if (supportedValues.length > 0 && !supportedValues.includes(chosenValue)) {
      return emptyPlan as ExecutionPlan;
    }

    pushAction("select_option", {
      kind: "option",
      groupId,
      id: chosenValue,
    });
    filledGroups.add(groupId);
  }

  for (const group of optionGroups) {
    if (!group) continue;
    if (
      group.required &&
      supportedOptionGroupIds.includes(group.id) &&
      !filledGroups.has(group.id)
    ) {
      return emptyPlan as ExecutionPlan;
    }
  }

  // 3. 검토 경계까지 이동
  const reviewBoundaryState: string = manifest.reviewBoundaryState ?? "";
  let safetyCounter = 0;
  while (currentState !== reviewBoundaryState && safetyCounter < 20) {
    const nextTransition = transitions.find(
      (t: any) => t && t.from === currentState && !FORBIDDEN_ACTIONS.has(t.action),
    );
    if (!nextTransition) break;
    pushAction(nextTransition.action, {
      kind: "screen",
      id: nextTransition.to,
    });
    safetyCounter++;
  }

  if (currentState !== reviewBoundaryState) {
    return emptyPlan as ExecutionPlan;
  }

  // 4. 필수 verifier action
  const verifierTransition = transitions.find(
    (t: any) => t && t.from === currentState && /^verify_/.test(t.action ?? ""),
  );
  const verifierAction: string = verifierTransition ? verifierTransition.action : "verify_checkin";

  pushAction(verifierAction, {
    kind: "screen",
    id: currentState,
  });

  return { actions } as ExecutionPlan;
}