import type {
  ExecutionPlan, PublicFixture, Recommendation, UserDecision,
} from "@kiobridge/participant-sdk";

export type RawUserInput = Record<string, unknown>;

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

const GROUP_ID_TO_ACTION: Record<string, string> = {
  "VISIT_TYPE": "select_visit_type",
  "APPOINTMENT": "check_appointment",
  "DEPARTMENT": "select_department",
  "SUPPORT": "select_support",
};

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

  const candidate = candidates.find((c: any) => c && c.candidateId === recommendedCandidateId);
  if (!candidate) {
    return emptyPlan as ExecutionPlan;
  }

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

  const findNextGroupTransition = (filledGroups: Set<string>) => {
    for (const groupId of Object.keys(resolvedOptionValues)) {
      if (filledGroups.has(groupId)) continue;

      // 🔴 FIX #4: g.id → g.groupId
      const group = optionGroups.find((g: any) => g && g.groupId === groupId);
      if (!group) continue;

      const expectedAction = GROUP_ID_TO_ACTION[groupId];
      if (!expectedAction) continue;

      const transition = transitions.find(
        (t: any) => t && t.from === currentState && t.action === expectedAction,
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
  // 🔴 FIX #4: g.id → g.groupId (2곳)
  const requiredGroupIds = optionGroups
    .filter((g: any) => g && g.required && Object.prototype.hasOwnProperty.call(supportedOptions, g.groupId))
    .map((g: any) => g.groupId);

  const reviewBoundaryState: string = manifest.reviewBoundaryState ?? "";
  let safetyCounter = 0;

  while (currentState !== reviewBoundaryState && safetyCounter < 30) {
    safetyCounter++;

    // 1) 옵션 그룹 transition 우선 실행
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

    // 2) 일반 진행 transition (option 그룹 관련 액션 제외)
    const generalTransition = transitions.find(
      (t: any) => t && 
                  t.from === currentState && 
                  !t.optionGroupId && 
                  !Object.values(GROUP_ID_TO_ACTION).includes(t.action ?? ""),
    );

    if (!generalTransition) {
      break;
    }

    // 🔴 FIX #5: select_flow는 { kind: "candidate", id } 형태로
    const target = generalTransition.action === "select_flow"
      ? { kind: "candidate", id: recommendedCandidateId }
      : { kind: "screen", id: generalTransition.to };

    const ok = pushAction(
      generalTransition.action,
      target,
      generalTransition.to,
    );

    if (!ok) {
      return emptyPlan as ExecutionPlan;
    }
  }

  // 필수 옵션 그룹 검증
  for (const groupId of requiredGroupIds) {
    if (!filledGroups.has(groupId)) {
      return emptyPlan as ExecutionPlan;
    }
  }

  if (currentState !== reviewBoundaryState) {
    return emptyPlan as ExecutionPlan;
  }

  // 검토 경계에서 verify_* transition
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