import test from "node:test";
import assert from "node:assert/strict";

import { explainRecommendation } from "./explainRecommendation.ts";

const baseCtx: any = {
  facts: { visitType: "FIRST_VISIT", appointmentStatus: "HAS_APPOINTMENT", departmentId: "ORTHOPEDICS", guardianPresent: true },
};

test("explainRecommendation: unmetConditions(supportModes enum 값)을 원본 코드값이 아니라 한국어 라벨로 보여준다", () => {
  const rec: any = {
    recommendedCandidateId: "HOS-002",
    recommendationReasons: [],
    unmetConditions: ["GUARDIAN_MODE", "HEARING_SUPPORT"],
  };
  const reasons = explainRecommendation(rec, baseCtx);
  const unmetLine = reasons.find((r) => r.includes("제공되지 않을 수 있습니다"));
  assert.ok(unmetLine, "unmetConditions 문장이 있어야 함");
  assert.doesNotMatch(unmetLine!, /GUARDIAN_MODE|HEARING_SUPPORT/);
  assert.match(unmetLine!, /보호자 동행/);
  assert.match(unmetLine!, /청각 지원/);
});
