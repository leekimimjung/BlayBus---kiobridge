/**
 * STEP 3 — createSessionContext
 *
 * 목적:
 *   이번 키오스크 이용에만 적용되는 SessionContext 를 만듭니다.
 *   (지속 정보는 profile, 이번 이용 정보는 sessionContext)
 *
 * 참고 문서: docs/SESSION_CONTEXT_DICTIONARY.md, docs/SAFETY_POLICY.md,
 *          docs/API_CONTRACT.md, docs/ERROR_CATALOG.md
 *
 * 여섯 섹션:
 *   intent          - 지금 하려는 목표
 *   facts           - 확인된 객관적 사실 (예: 예약 여부) — hardConstraints 아님
 *   preferences     - 선호 (불일치해도 BLOCK 아님)
 *   hardConstraints - 위반 시 후보 반드시 제외 (예: 알레르기)
 *   capabilities    - 지금 사용 가능한 수단 (예: 인증수단)
 *   fieldMetadata   - 각 값의 출처·신뢰도·확인 여부
 *
 * 금지:
 *   - 값을 잘못된 섹션에 넣기 (DOMAIN_CONTEXT_MISMATCH)
 *   - allergenIds 에 UNKNOWN 있는데 임의로 추론해서 채우기 (HARD_CONSTRAINT_UNKNOWN)
 *   - 증상으로 진료과/질병 추론 (병원 환경)
 *   - 자격 여부 임의 추론 (관공서 환경)
 */
import type { PublicFixture, AnySessionContext } from "@kiobridge/participant-sdk";

export type RawUserInput = Record<string, unknown>;

/** fieldMetadata 하나를 만드는 헬퍼 */
function makeMeta(params: {
  source: string;
  confidence: number;
  confirmedByUser: boolean;
  capturedAt?: string;
  normalizerId?: string;
  originalValueHash?: string;
}): any {
  const meta: any = {
    source: params.source,
    confidence: Math.max(0, Math.min(1, params.confidence)),
    confirmedByUser: params.confirmedByUser,
  };
  if (params.capturedAt) meta.capturedAt = params.capturedAt;
  if (params.normalizerId) meta.normalizerId = params.normalizerId;
  if (params.originalValueHash) meta.originalValueHash = params.originalValueHash;
  return meta;
}

function nowIso8601Utc(): string {
  return new Date().toISOString();
}

/**
 * raw 입력에서 값 하나를 안전하게 꺼내되, 없으면 UNKNOWN 계열 기본값을 씀.
 * 추론(임의 채움) 금지 — 없으면 UNKNOWN, DEFAULTED 로 표시.
 */
function pick(raw: RawUserInput, key: string, fallback: unknown): unknown {
  const v = raw[key];
  return v === undefined || v === null || v === "" ? fallback : v;
}

export function createSessionContext(
  raw: RawUserInput,
  fixture: PublicFixture,
): AnySessionContext {
  const environmentId = (fixture as any)?.manifest?.environmentId
    ?? (fixture as any)?.environmentId
    ?? "";
  const capturedAt = nowIso8601Utc();
  const defaultSource = "WEB_FORM"; // raw.inputChannel 이 있으면 아래서 덮어씀
  const inputSource = String(pick(raw, "inputChannel", defaultSource));

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

  // ── 환경별 매핑 ─────────────────────────────────────────────
  if (environmentId === "chicken-store") {
    // preferences (Soft)
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

    // hardConstraints (Hard) — allergenIds 에 UNKNOWN 있으면 그대로 UNKNOWN 유지 (임의 추론 금지)
    const allergenIds = Array.isArray(raw.allergenIds) ? raw.allergenIds : [];
    setField(hardConstraints, "hardConstraints", "allergenIds",
      allergenIds.length > 0 ? allergenIds : ["UNKNOWN"],
      { source: inputSource, confidence: allergenIds.length > 0 ? 1 : 0, confirmedByUser: allergenIds.length > 0 });

    const maxPriceKrw = raw.maxPriceKrw;
    if (typeof maxPriceKrw === "number" && maxPriceKrw >= 0) {
      setField(hardConstraints, "hardConstraints", "maxPriceKrw", maxPriceKrw,
        { source: inputSource, confidence: 1, confirmedByUser: true });
    }
  } else if (environmentId === "hospital") {
    // facts (객관적 사실 — preferences 아님!)
    setField(facts, "facts", "visitType",
      pick(raw, "visitType", "UNKNOWN"),
      { source: inputSource, confidence: raw.visitType ? 0.9 : 0, confirmedByUser: !!raw.visitType });

    setField(facts, "facts", "appointmentStatus",
      pick(raw, "appointmentStatus", "UNKNOWN"),
      { source: inputSource, confidence: raw.appointmentStatus ? 0.9 : 0, confirmedByUser: !!raw.appointmentStatus });

    // 진료과 — 증상으로 추론하지 않음. 없으면 UNSPECIFIED.
    setField(facts, "facts", "departmentId",
      pick(raw, "departmentId", "UNSPECIFIED"),
      { source: inputSource, confidence: raw.departmentId ? 0.9 : 0, confirmedByUser: !!raw.departmentId });

    setField(facts, "facts", "guardianPresent",
      typeof raw.guardianPresent === "boolean" ? raw.guardianPresent : false,
      { source: inputSource, confidence: raw.guardianPresent !== undefined ? 1 : 0.3, confirmedByUser: raw.guardianPresent !== undefined });

    // preferences (Soft)
    const supportModes = Array.isArray(raw.supportModes) ? raw.supportModes : [];
    setField(preferences, "preferences", "supportModes", supportModes,
      { source: inputSource, confidence: supportModes.length > 0 ? 0.9 : 0.3, confirmedByUser: supportModes.length > 0 });

    // hardConstraints (Safety, const false 고정 — 의료추론 금지)
    setField(hardConstraints, "hardConstraints", "medicalInferenceAllowed", false,
      { source: "DEFAULTED", confidence: 1, confirmedByUser: true });

    // capabilities
    setField(capabilities, "capabilities", "canUseSelfCheckIn",
      typeof raw.canUseSelfCheckIn === "boolean" ? raw.canUseSelfCheckIn : true,
      { source: inputSource, confidence: raw.canUseSelfCheckIn !== undefined ? 1 : 0.5, confirmedByUser: raw.canUseSelfCheckIn !== undefined });
  } else if (environmentId === "public-office") {
    // intent
    setField(intent, "intent", "requestedServiceId",
      pick(raw, "requestedServiceId", ""),
      { source: inputSource, confidence: raw.requestedServiceId ? 1 : 0, confirmedByUser: !!raw.requestedServiceId });

    // facts
    setField(facts, "facts", "serviceCategory",
      pick(raw, "serviceCategory", "UNKNOWN"),
      { source: inputSource, confidence: raw.serviceCategory ? 0.9 : 0, confirmedByUser: !!raw.serviceCategory });

    // preferences (Soft)
    setField(preferences, "preferences", "stepByStep",
      typeof raw.stepByStep === "boolean" ? raw.stepByStep : false,
      { source: inputSource, confidence: raw.stepByStep !== undefined ? 0.9 : 0.3, confirmedByUser: raw.stepByStep !== undefined });

    setField(preferences, "preferences", "simpleLanguage",
      typeof raw.simpleLanguage === "boolean" ? raw.simpleLanguage : false,
      { source: inputSource, confidence: raw.simpleLanguage !== undefined ? 0.9 : 0.3, confirmedByUser: raw.simpleLanguage !== undefined });

    // hardConstraints (Safety, const false 고정 — 자격 추론 금지)
    setField(hardConstraints, "hardConstraints", "legalEligibilityInferenceAllowed", false,
      { source: "DEFAULTED", confidence: 1, confirmedByUser: true });

    // capabilities
    const availableAuthMethods = Array.isArray(raw.availableAuthMethods) ? raw.availableAuthMethods : ["UNKNOWN"];
    setField(capabilities, "capabilities", "availableAuthMethods", availableAuthMethods,
      { source: inputSource, confidence: availableAuthMethods.includes("UNKNOWN") ? 0 : 0.9,
        confirmedByUser: !availableAuthMethods.includes("UNKNOWN") });
  } else {
    // sandbox 등 그 외 환경
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