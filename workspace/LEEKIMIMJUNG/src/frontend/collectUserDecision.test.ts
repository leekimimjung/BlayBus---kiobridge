import test from "node:test";
import assert from "node:assert/strict";

import { DEPARTMENTS, departmentChoiceHTML, departmentListScreenHTML } from "./collectUserDecision.ts";

test("진료과 추천 화면: 기본(확정 추천)이면 '추천 정확도 높음' 필과 확정 문구를 보여준다", () => {
  const html = departmentChoiceHTML("");
  assert.match(html, /추천 정확도 높음/);
  assert.match(html, /정형외과로<br \/>안내해 드릴게요/);
  assert.match(html, /왜 정형외과인가요/);
  assert.doesNotMatch(html, /직접 확인이 필요해요/);
});

test("진료과 추천 화면: uncertain=true(진료과 미확정 → 일반 안내)면 확정 추천처럼 보이지 않는다", () => {
  const recommended = {
    candidateId: "HOS-003",
    title: "비예약 초진 안내",
    department: "일반 안내",
    floor: "1층 · 종합 안내데스크",
    reasons: [],
  };
  const html = departmentChoiceHTML("", {}, recommended, true);
  assert.match(html, /직접 확인이 필요해요/);
  assert.doesNotMatch(html, /추천 정확도 높음/);
  assert.match(html, /어느 과인지<br \/>아직 정하지 않았어요/);
  assert.doesNotMatch(html, /왜 일반 안내인가요/);
  assert.match(html, /안내데스크 직원이 어느 과인지 확인해 드려요/);
});

test("진료과 직접 선택 화면: 공식 departmentId enum 6개(UNSPECIFIED 포함)만 제공한다", () => {
  assert.equal(DEPARTMENTS.length, 6);
  assert.ok(DEPARTMENTS.some((d) => d.value === "UNSPECIFIED"));
  const html = departmentListScreenHTML("");
  for (const d of DEPARTMENTS) {
    assert.match(html, new RegExp(`data-value="${d.value}"`));
  }
});
