/**
 * STEP 3 — createSessionContext
 *
 * 핵심 수정: 모든 환경 분기에서 intent.task 를 채우지 않아 intent: {} 로 나가던 버그 수정.
 *            environmentId → task 매핑을 명시적으로 추가.
 *
 * 여섯 섹션:
 *   intent          - 지금 하려는 목표 (task 필수)
 *   facts           - 확인된 객관적 사실
 *   preferences     - 선호 (불일치해도 BLOCK 아님)
 *   hardConstraints - 위반 시 후보 반드시 제외
 *   capabilities    - 지금 사용 가능한 수단
 *   fieldMetadata   - 각 값의 출처·신뢰도·확인 여부
 */
import type {PublicFixture, AnySessionContext } from "@kiobridge/participant-sdk";

export type RawUserInput = Record<string, unknown>;

function makeMeta(params: {
  source: string;
  confidence: number;
  confirmedByUser: boolean;
  capturedAt?: string;
}): any {
  return {
    source: params.source,
    confidence: Math.max(0, Math.min(1, params.confidence)),
    confirmedByUser: params.confirmedByUser,
    ...(params.capturedAt ? { capturedAt: params.capturedAt } : {}),
  };
}

function nowIso8601Utc(): string {
  return new Date().toISOString();
}

function pick(raw: RawUserInput, key: string, fallback: unknown): unknown {
  const v = raw[key];
  return v === undefined || v === null || v === "" ? fallback : v;
}

/** environmentId → task 고정 매핑 (fixture 마다 task 는 하나로 정해져 있음) */
const ENVIRONMENT_TASK_MAP: Record<string, string> = {
  "chicken-store": "ORDER_FOOD",
  "hospital": "CHECK_IN",
  "public-office": "PUBLIC_SERVICE_GUIDANCE",
  "sandbox": "PRACTICE",
};

export function createSessionContext(
  raw: RawUserInput,
  fixture: PublicFixture,
): AnySessionContext {
  const environmentId: string = (fixture as any)?.manifest?.environmentId
    ?? (fixture as any)?.environmentId
    ?? "";
  const capturedAt = nowIso8601Utc();
  const inputSource = String(pick(raw, "inputChannel", "WEB_FORM"));

  const intent: Record<string, unknown> = {};
  const facts: Record<string, unknown> = {};
  const preferences: Record<string, unknown> = {};
  const hardConstraints: Record<string, unknown> = {};
  const capabilities: Record<string, unknown> = {};
  const fieldMetadata: Record<string, unknown> = {};

  const setField = (
    section: Record<string, unknown>,
    sectionName: string,
    field: string,
    value: unknown,
    meta: { source: string; confidence: number; confirmedByUser: boolean },
  ) => {
    section[field] = value;
    fieldMetadata[`/${sectionName}/${field}`] = makeMeta({
      source: meta.source,
      confidence: meta.confidence,
      confirmedByUser: meta.confirmedByUser,
      capturedAt,
    });
  };

  // ── intent.task 는 모든 환경에서 필수 → 항상 먼저 채운다.
  const task = ENVIRONMENT_TASK_MAP[environmentId] ?? "UNKNOWN";
  setField(intent, "intent", "task", task, {
    source: "DEFAULTED",
    confidence: task === "UNKNOWN" ? 0 : 1,
    confirmedByUser: false,
  });

  // ── 환경별 나머지 필드 매핑 ─────────────────────────────
  if (environmentId === "chicken-store") {
    setField(preferences, "preferences", "serviceType",
      pick(raw, "serviceType", "UNKNOWN"),
      { source: inputSource, confidence: raw.serviceType ? 0.9 : 0, confirmedByUser: !!raw.serviceType });

    setField(preferences, "preferences", "spicyLevel",
      pick(raw, "spicyLevel", "UNKNOWN"),
      { source: inputSource, confidence: raw.spicyLevel ? 0.9 : 0, confirmedByUser: !!raw.spicyLevel });

    setField(preferences, "preferences", "boneType",
      pick(raw, "boneType", "UNKNOWN"),
      { source: inputSource, confidence: raw.boneType ? 0.9 : 0, confirmedByUser: !!raw.boneType });

    setField(preferences, "preferences", "cupOption",
      pick(raw, "cupOption", "UNKNOWN"),
      { source: inputSource, confidence: raw.cupOption ? 0.9 : 0, confirmedByUser: !!raw.cupOption });

    const quantity = Number(pick(raw, "quantity", 1));
    setField(preferences, "preferences", "quantity",
      Number.isFinite(quantity) && quantity >= 1 ? quantity : 1,
      { source: inputSource, confidence: raw.quantity ? 1 : 0.3, confirmedByUser: !!raw.quantity });

    const allergenIds = Array.isArray(raw.allergenIds) ? raw.allergenIds : [];
    setField(hardConstraints, "hardConstraints", "allergenIds",
      allergenIds.length > 0 ? allergenIds : ["UNKNOWN"],
      { source: inputSource, confidence: allergenIds.length > 0 ? 1 : 0, confirmedByUser: allergenIds.length > 0 });

    if (typeof raw.maxPriceKrw === "number" && raw.maxPriceKrw >= 0) {
      setField(hardConstraints, "hardConstraints", "maxPriceKrw", raw.maxPriceKrw,
        { source: inputSource, confidence: 1, confirmedByUser: true });
    }
  } else if (environmentId === "hospital") {
    setField(facts, "facts", "visitType",
      pick(raw, "visitType", "UNKNOWN"),
      { source: inputSource, confidence: raw.visitType ? 0.9 : 0, confirmedByUser: !!raw.visitType });

    setField(facts, "facts", "appointmentStatus",
      pick(raw, "appointmentStatus", "UNKNOWN"),
      { source: inputSource, confidence: raw.appointmentStatus ? 0.9 : 0, confirmedByUser: !!raw.appointmentStatus });

    setField(facts, "facts", "departmentId",
      pick(raw, "departmentId", "UNSPECIFIED"),
      { source: inputSource, confidence: raw.departmentId ? 0.9 : 0, confirmedByUser: !!raw.departmentId });

    setField(facts, "facts", "guardianPresent",
      typeof raw.guardianPresent === "boolean" ? raw.guardianPresent : false,
      { source: inputSource, confidence: raw.guardianPresent !== undefined ? 1 : 0.3, confirmedByUser: raw.guardianPresent !== undefined });

    const supportModes = Array.isArray(raw.supportModes) ? raw.supportModes : [];
    setField(preferences, "preferences", "supportModes", supportModes,
      { source: inputSource, confidence: supportModes.length > 0 ? 0.9 : 0.3, confirmedByUser: supportModes.length > 0 });

    setField(hardConstraints, "hardConstraints", "medicalInferenceAllowed", false,
      { source: "DEFAULTED", confidence: 1, confirmedByUser: true });

    setField(capabilities, "capabilities", "canUseSelfCheckIn",
      typeof raw.canUseSelfCheckIn === "boolean" ? raw.canUseSelfCheckIn : true,
      { source: inputSource, confidence: raw.canUseSelfCheckIn !== undefined ? 1 : 0.5, confirmedByUser: raw.canUseSelfCheckIn !== undefined });
  } else if (environmentId === "public-office") {
    setField(intent, "intent", "requestedServiceId",
      pick(raw, "requestedServiceId", ""),
      { source: inputSource, confidence: raw.requestedServiceId ? 1 : 0, confirmedByUser: !!raw.requestedServiceId });

    setField(facts, "facts", "serviceCategory",
      pick(raw, "serviceCategory", "UNKNOWN"),
      { source: inputSource, confidence: raw.serviceCategory ? 0.9 : 0, confirmedByUser: !!raw.serviceCategory });

    setField(preferences, "preferences", "stepByStep",
      typeof raw.stepByStep === "boolean" ? raw.stepByStep : false,
      { source: inputSource, confidence: raw.stepByStep !== undefined ? 0.9 : 0.3, confirmedByUser: raw.stepByStep !== undefined });

    setField(preferences, "preferences", "simpleLanguage",
      typeof raw.simpleLanguage === "boolean" ? raw.simpleLanguage : false,
      { source: inputSource, confidence: raw.simpleLanguage !== undefined ? 0.9 : 0.3, confirmedByUser: raw.simpleLanguage !== undefined });

    setField(hardConstraints, "hardConstraints", "legalEligibilityInferenceAllowed", false,
      { source: "DEFAULTED", confidence: 1, confirmedByUser: true });

    const availableAuthMethods = Array.isArray(raw.availableAuthMethods) ? raw.availableAuthMethods : ["UNKNOWN"];
    setField(capabilities, "capabilities", "availableAuthMethods", availableAuthMethods,
      { source: inputSource, confidence: availableAuthMethods.includes("UNKNOWN") ? 0 : 0.9,
        confirmedByUser: !availableAuthMethods.includes("UNKNOWN") });
  } else {
    setField(preferences, "preferences", "size",
      pick(raw, "size", "UNKNOWN"),
      { source: inputSource, confidence: raw.size ? 0.9 : 0, confirmedByUser: !!raw.size });
  }

  const sessionContext: any = {
    intent,
    facts,
    preferences,
    hardConstraints,
    capabilities,
    fieldMetadata,
  };

  return sessionContext as AnySessionContext;
}