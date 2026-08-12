import test from "node:test";
import assert from "node:assert/strict";

import {
  ACCESSIBILITY_SETTINGS,
  APPOINTMENT_STATUSES,
  DEPARTMENTS,
  FONT_SCALES,
  FONT_SCALE_PX,
  RECOMMENDED_DEPARTMENT,
  VISIT_TYPES,
  accessibilityScreenHTML,
  assembleRawInput,
  collectProfile,
  departmentChoiceHTML,
  departmentListScreenHTML,
  loginChoiceScreenHTML,
  reservationScreenHTML,
  visitTypeScreenHTML,
} from "./collectProfile.ts";

test("메인 화면: 병원 이니셜(H) + 로그인/회원가입(펼침) · 비회원 시작 · 직원 호출 링크", () => {
  const html = loginChoiceScreenHTML();
  assert.match(html, /hero-mark/);
  assert.match(html, /안아프게 해 드릴게요/);
  assert.match(html, /로그인 \/ 회원가입 하기/);
  assert.match(html, /data-choice="auth"/);
  assert.match(html, /data-choice="guest"/);
  assert.match(html, /비회원으로 시작하기/);
  assert.match(html, /직원을 호출해주세요/);

  const open = loginChoiceScreenHTML(true);
  assert.match(open, /data-choice="login"/);
  assert.match(open, /data-choice="signup"/);
  assert.match(open, /data-choice="guest"/);
});

test("나에게 맞는 설정: 글씨크기/음성안내/보호자/고대비/공황장애 5개 복수 선택, 최소 1개 선택해야 완료 활성", () => {
  assert.equal(ACCESSIBILITY_SETTINGS.length, 5);
  assert.ok(ACCESSIBILITY_SETTINGS.some((s) => s.key === "LARGE_TEXT" && /글씨/.test(s.title)));
  assert.ok(ACCESSIBILITY_SETTINGS.some((s) => s.key === "VOICE_GUIDANCE" && /음성/.test(s.title)));
  assert.ok(ACCESSIBILITY_SETTINGS.some((s) => s.key === "GUARDIAN_MODE" && /보호자/.test(s.title)));
  assert.ok(ACCESSIBILITY_SETTINGS.some((s) => s.key === "HIGH_CONTRAST" && /고대비/.test(s.title) && /뚜렷/.test(s.desc)));
  assert.ok(ACCESSIBILITY_SETTINGS.some((s) => s.key === "SIMPLE_STEPS" && /공황장애/.test(s.title)));

  assert.match(accessibilityScreenHTML({}), /disabled/);
  assert.doesNotMatch(accessibilityScreenHTML({ LARGE_TEXT: true }), /disabled/);
});

test("글씨 크게: 카드를 누르면 보통/크게/아주 크게 3단계가 펼쳐진다", () => {
  assert.equal(FONT_SCALES.length, 3);
  assert.ok(FONT_SCALES.some((f) => f.value === "NORMAL" && f.label === "보통"));
  assert.ok(FONT_SCALES.some((f) => f.value === "LARGE" && f.label === "크게"));
  assert.ok(FONT_SCALES.some((f) => f.value === "XLARGE" && f.label === "아주 크게"));

  assert.doesNotMatch(accessibilityScreenHTML({}), /data-font-scale/);
  const open = accessibilityScreenHTML({}, true);
  assert.match(open, /data-font-scale="NORMAL"/);
  assert.match(open, /data-font-scale="LARGE"/);
  assert.match(open, /data-font-scale="XLARGE"/);
  assert.match(open, /아주 크게/);
});

test("글자 크기 단계: 보통은 일반 크기, 크게는 조금 더, 아주 크게는 더 크다", () => {
  assert.equal(FONT_SCALE_PX.NORMAL, 15);
  assert.ok(FONT_SCALE_PX.LARGE > FONT_SCALE_PX.NORMAL);
  assert.ok(FONT_SCALE_PX.XLARGE > FONT_SCALE_PX.LARGE);
  const html = accessibilityScreenHTML({ fontScale: "XLARGE", LARGE_TEXT: true }, true);
  assert.match(html, /class="fontsize-chip is-selected" data-font-scale="XLARGE"/);
  assert.match(html, /class="dept-card is-selected" data-setting="LARGE_TEXT" aria-pressed="true"/);
});

test("예약 화면: 예약했어요/안 했어요(모르겠어요 포함), 고른 뒤에만 다음 활성", () => {
  assert.equal(APPOINTMENT_STATUSES.length, 2);
  assert.ok(APPOINTMENT_STATUSES.some((s) => s.value === "HAS_APPOINTMENT" && /예약했어요/.test(s.title)));
  assert.ok(APPOINTMENT_STATUSES.some((s) => s.value === "NO_APPOINTMENT" && /모르겠어요/.test(s.title)));
  assert.match(reservationScreenHTML(""), /disabled/);
  assert.doesNotMatch(reservationScreenHTML("HAS_APPOINTMENT"), /disabled/);
  assert.match(reservationScreenHTML(""), /data-group="appointmentStatus"/);
});

test("방문 유형 화면: 초진/재진 2개, 고른 뒤에만 다음 활성", () => {
  assert.equal(VISIT_TYPES.length, 2);
  assert.ok(VISIT_TYPES.some((v) => v.value === "FIRST_VISIT"));
  assert.ok(VISIT_TYPES.some((v) => v.value === "REVISIT"));
  assert.match(visitTypeScreenHTML(""), /disabled/);
  assert.doesNotMatch(visitTypeScreenHTML("REVISIT"), /disabled/);
  assert.match(visitTypeScreenHTML(""), /data-group="visitType"/);
});

test("진료과(추천) 화면: Figma 시안 구조(추천 카드 + 다른 진료과 카드), 증상을 묻지 않는다", () => {
  assert.equal(RECOMMENDED_DEPARTMENT.value, "ORTHOPEDICS");
  const html = departmentChoiceHTML("");
  assert.match(html, /정형외과로/);
  assert.match(html, /왜 정형외과인가요/);
  assert.match(html, /3층 · 정형외과 접수 데스크/);
  assert.match(html, /다른 진료과를 선택할래요/);
  assert.match(html, /추천 정확도 높음/);
  assert.doesNotMatch(html, /아프|증상/);
});

test("진료과(추천) 화면: 음성 안내 설정 시 음성 안내 모드 필을 보여준다", () => {
  assert.match(departmentChoiceHTML("", { VOICE_GUIDANCE: true }), /음성 안내 모드/);
  assert.doesNotMatch(departmentChoiceHTML(""), /음성 안내 모드/);
});

test("진료과(추천) 화면: 진행 단계가 5칸이고 직원 호출 버튼이 없다", () => {
  const html = departmentChoiceHTML("");
  assert.match(html, /진행 단계 \d+\/5/);
  const bars = html.match(/<span class="active"><\/span>/g) ?? [];
  assert.equal(bars.length, 4); // 5칸 중 4칸 진행됨(현재 화면 포함)
  assert.doesNotMatch(html, /data-action="staff"/);
});

test("진료과 직접 선택: '다른 진료과'는 10개 선택지(내과·신경과·정신건강의학과·외과·정형외과·산부인과·소아청소년과·안과·이비인후과·피부과)를 보여준다", () => {
  assert.equal(DEPARTMENTS.length, 10);
  const titles = DEPARTMENTS.map((d) => d.title);
  assert.deepEqual(titles, [
    "내과",
    "신경과",
    "정신건강의학과",
    "외과",
    "정형외과",
    "산부인과",
    "소아청소년과",
    "안과",
    "이비인후과",
    "피부과",
  ]);
});

test("진료과 직접 선택 화면: 10개 목록을 모두 렌더링하고 증상을 묻지 않는다", () => {
  const html = departmentListScreenHTML("");
  for (const d of DEPARTMENTS) {
    assert.match(html, new RegExp(`data-value="${d.value}"`));
    assert.match(html, new RegExp(d.title));
  }
  assert.match(html, /진료과를/);
  assert.match(html, /data-action="back"/);
  assert.doesNotMatch(html, /아프|증상/);
  assert.match(html, /disabled/);
  assert.doesNotMatch(departmentListScreenHTML("ENT"), /disabled/);
});

test("assembleRawInput: 화면 값을 하나로 합치고 보호자 동행을 설정에서 파생한다", () => {
  const raw = assembleRawInput({
    loginChoice: { loggedIn: false, auth: "GUEST" },
    accessibility: { LARGE_TEXT: true, GUARDIAN_MODE: true, fontScale: "LARGE" },
    appointmentStatus: "HAS_APPOINTMENT",
    visitType: "FIRST_VISIT",
    departmentId: "ORTHOPEDICS",
  });

  assert.equal(raw.loggedIn, false);
  assert.equal(raw.auth, "GUEST");
  assert.equal(raw.LARGE_TEXT, true);
  assert.equal(raw.fontScale, "LARGE");
  assert.equal(raw.VOICE_GUIDANCE, undefined);
  assert.equal(raw.guardianPresent, true);
  assert.equal(raw.appointmentStatus, "HAS_APPOINTMENT");
  assert.equal(raw.visitType, "FIRST_VISIT");
  assert.equal(raw.departmentId, "ORTHOPEDICS");
  assert.equal(raw._confirmedByUser, true);
  assert.equal(raw._collectedVia, "WEB_FORM");
});

test("collectProfile: 브라우저 DOM 이 없는 Node 에서 멈추지 않고 즉시 실패한다 (NOT_IMPLEMENTED 가 아님)", async () => {
  await assert.rejects(collectProfile(), (err: unknown) => {
    const msg = String((err as Error).message);
    return !msg.startsWith("NOT_IMPLEMENTED") && /DOM/.test(msg);
  });
});
