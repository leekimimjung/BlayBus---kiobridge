/**
 * STEP 9 — buildExecutionPlan
 *
 * 핵심 수정:
 *   1. selectedOptions 는 decision/rec 에 없는 필드였음 → candidate.supportedOptions 에서
 *      직접 값을 뽑아서 채움 (그룹당 값 1개인 fixture 전제, [0] 사용).
 *   2. select_menu / select_option 같은 의사코드 action 이름을 전부 제거.
 *      currentState 기준으로 fixture.transitions 에서 실제 action 을 찾아 진행.
 *   3. FORBIDDEN_ACTIONS 를 병원 fixture 실제 금지 액션(diagnose, triage,
 *      assign_department_final, query_patient) 위주로 재구성.
 *
 * 목적:
 *   승인된 결정을 의미 기반 실행계획으로 바꿉니다.
 *
 * 반드시:
 *   - target 은 { kind, id, groupId? } 의미 대상만 사용
 *   - fixture.transitions 를 따라 expectedBeforeState / expectedAfterState 채움
 *   - manifest.reviewBoundaryState 에서 멈추고 필수 verifier 실행
 *
 * 금지:
 *   - 결제 · 본인확인 완료 · 행정처리 확정 · 진단/분류/최종배정/환자조회 Action
 *   - 같은 단일선택 옵션 그룹을 다른 값으로 두 번 선택
 *   - 화면 페이지 이동만을 위한 Action
 */
import type {
  ExecutionPlan, PublicFixture, Recommendation, UserDecision,
} from "@kiobridge/participant-sdk";

export type RawUserInput = Record<string, unknown>;

/**
 * 절대 계획에 포함하면 안 되는 Action.
 * 병원 전용(diagnose, triage, assign_department_final, query_patient) +
 * 도메인 공통 금지(결제/본인확인 완료/행정처리 확정).
 */
const FORBIDDEN_ACTIONS = new Set<string>([
  "diagnose",
  "triage",
  "assign_department_final",
  "query_patient",
  "make_payment",
  "select_payment",
  "confirm_payment",
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

  // ── 옵션 값은 decision/rec 이 아니라 candidate.supportedOptions 에서 직접 가져온다.
  //    그룹당 값이 1개인 fixture 전제이므로 [0] 사용.
  const supportedOptions: any = candidate.supportedOptions ?? {};
  const resolvedOptionValues: Record<string, string> = {};
  for (const groupId of Object.keys(supportedOptions)) {
    const values: unknown[] = supportedOptions[groupId] ?? [];
    if (values.length > 0) {
      resolvedOptionValues[groupId] = String(values[0]);
    }
  }

  const actions: any[] = [];
  let actionIndex = 0;
  let currentState: string = manifest.initialState ?? "";

  // currentState 에서 나가는 transition 중, 아직 채우지 않은 옵션 그룹에 해당하는
  // action 을 찾아서 target 을 만든다. 없으면 null.
  const findNextGroupTransition = (filledGroups: Set<string>) => {
    for (const groupId of Object.keys(resolvedOptionValues)) {
      if (filledGroups.has(groupId)) continue;
      const group = optionGroups.find((g: any) => g && g.id === groupId);
      if (!group) continue;
      const transition = transitions.find(
        (t: any) => t && t.from === currentState && t.optionGroupId === groupId,
      );
      if (transition) {
        return { transition, groupId, group };
      }
    }
    return null;
  };

  const pushAction = (action: string, target: Record<string, unknown>, toState: string) => {
    if (FORBIDDEN_ACTIONS.has(action)) {
      return false;
    }
    actions.push({
      actionIndex: actionIndex++,
      action,
      target,
      expectedBeforeState: currentState,
      expectedAfterState: toState,
    });
    currentState = toState;
    return true;
  };

  const filledGroups = new Set<string>();
  const requiredGroupIds = optionGroups
    .filter((g: any) => g && g.required && Object.prototype.hasOwnProperty.call(supportedOptions, g.id))
    .map((g: any) => g.id);

  const reviewBoundaryState: string = manifest.reviewBoundaryState ?? "";
  let safetyCounter = 0;

  // ── currentState 가 검토 경계에 도달할 때까지, 그때그때 실제 transition 을 찾아 진행.
  while (currentState !== reviewBoundaryState && safetyCounter < 30) {
    safetyCounter++;

    // 1) 아직 안 채운 옵션 그룹에 대한 transition 이 지금 상태에서 나가면 그걸 우선 실행
    const groupMatch = findNextGroupTransition(filledGroups);
    if (groupMatch) {
      const { transition, groupId } = groupMatch;
      const chosenValue = resolvedOptionValues[groupId];
      const ok = pushAction(
        transition.action,
        { kind: "option", groupId, id: chosenValue },
        transition.to,
      );
      if (!ok) {
        return emptyPlan as ExecutionPlan;
      }
      filledGroups.add(groupId);
      continue;
    }

    // 2) 옵션 그룹과 무관한 일반 진행 transition
    const generalTransition = transitions.find(
      (t: any) => t && t.from === currentState && !t.optionGroupId,
    );
    if (!generalTransition) {
      break;
    }
    const ok = pushAction(
      generalTransition.action,
      { kind: "screen", id: generalTransition.to },
      generalTransition.to,
    );
    if (!ok) {
      return emptyPlan as ExecutionPlan;
    }
  }

  // 필수 옵션 그룹을 다 채우지 못했으면 실행 불가
  for (const groupId of requiredGroupIds) {
    if (!filledGroups.has(groupId)) {
      return emptyPlan as ExecutionPlan;
    }
  }

  if (currentState !== reviewBoundaryState) {
    return emptyPlan as ExecutionPlan;
  }

  // ── 필수 verifier action (검토 경계에서 나가는 verify_* transition)
  const verifierTransition = transitions.find(
    (t: any) => t && t.from === currentState && /^verify_/.test(t.action ?? ""),
  );
  if (!verifierTransition) {
    return emptyPlan as ExecutionPlan;
  }

  const verifierOk = pushAction(
    verifierTransition.action,
    { kind: "screen", id: currentState },
    verifierTransition.to,
  );
  if (!verifierOk) {
    return emptyPlan as ExecutionPlan;
  }

  return { actions } as ExecutionPlan;
}