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
  pauseScreenHTML,
  proceedConfirmOverlayHTML,
  qrAuthScreenHTML,
  reservationScreenHTML,
  toOfficialDepartmentId,
  visitTypeScreenHTML,
} from "./collectProfile.ts";

test("메인 화면: 병원 이니셜(H) + 로그인/회원가입 · 비회원 시작 · 직원 호출 링크", () => {
  const html = loginChoiceScreenHTML();
  assert.match(html, /hero-mark/);
  assert.match(html, /안아프게 해 드릴게요/);
  assert.match(html, /로그인 \/ 회원가입 하기/);
  assert.match(html, /data-choice="auth"/);
  assert.match(html, /data-choice="guest"/);
  assert.match(html, /비회원으로 시작하기/);
  assert.match(html, /직원을 호출해주세요/);
  assert.doesNotMatch(html, /data-choice="login"/);
  assert.doesNotMatch(html, /data-choice="signup"/);
});

test("QR 로그인/회원가입 화면: 돌아가기 · 완료 버튼 · QR 인식 영역", () => {
  const html = qrAuthScreenHTML();
  assert.match(html, /QR코드로<br \/>로그인\/회원가입/);
  assert.match(html, /로그인과 회원가입이 한번에 가능해요/);
  assert.match(html, /qr-box/);
  assert.match(html, /data-action="back"/);
  assert.match(html, /data-action="next"/);
  assert.match(html, />완료</);
  assert.doesNotMatch(html, /직원 호출/);
});

test("나에게 맞는 설정: 글씨크기/음성안내/시각안내/보호자/고대비/쉬운모드/공황장애/직원도움 8개 복수 선택, 최소 1개 선택해야 완료 활성", () => {
  assert.equal(ACCESSIBILITY_SETTINGS.length, 8);
  assert.ok(ACCESSIBILITY_SETTINGS.some((s) => s.key === "LARGE_TEXT" && /글씨/.test(s.title)));
  assert.ok(ACCESSIBILITY_SETTINGS.some((s) => s.key === "VOICE_GUIDANCE" && /음성/.test(s.title)));
  assert.ok(ACCESSIBILITY_SETTINGS.some((s) => s.key === "VISUAL_GUIDANCE" && /시각/.test(s.title)));
  assert.ok(ACCESSIBILITY_SETTINGS.some((s) => s.key === "GUARDIAN_MODE" && /보호자/.test(s.title)));
  assert.ok(ACCESSIBILITY_SETTINGS.some((s) => s.key === "HIGH_CONTRAST" && /고대비/.test(s.title) && /뚜렷/.test(s.desc)));
  assert.ok(ACCESSIBILITY_SETTINGS.some((s) => s.key === "EASY_MODE" && /쉬운 모드/.test(s.title) && /설명/.test(s.desc)));
  assert.ok(ACCESSIBILITY_SETTINGS.some((s) => s.key === "SIMPLE_STEPS" && /공황장애/.test(s.title)));
  assert.ok(ACCESSIBILITY_SETTINGS.some((s) => s.key === "STAFF_HELP" && /직원/.test(s.title)));

  assert.match(accessibilityScreenHTML({}), /disabled/);
  assert.doesNotMatch(accessibilityScreenHTML({ LARGE_TEXT: true }), /disabled/);
});

test("로그인 여부: 같은 설정 화면에서 제목만 바뀐다 — 비회원은 '편하신 방식을 골라주세요', 로그인은 '전에 하신 설정이 맞는지 확인해 주세요'", () => {
  assert.match(accessibilityScreenHTML({}), /편하신 방식을/);
  assert.doesNotMatch(accessibilityScreenHTML({}), /전에 하신 설정/);
  assert.match(accessibilityScreenHTML({}, false, true), /전에 하신 설정이 맞는지/);
  assert.doesNotMatch(accessibilityScreenHTML({}, false, true), /편하신 방식을/);
});

test("공황장애 안심 모달: '다음 페이지로 넘어가시겠어요?' + 아니요/네 + 되돌아갈 수 있다는 안심 문구", () => {
  const html = proceedConfirmOverlayHTML();
  assert.match(html, /다음 페이지로/);
  assert.match(html, /잘못 누르더라도/);
  assert.match(html, /이전 페이지로 다시 돌아갈 수 있어요/);
  assert.match(html, /data-action="confirm-close"/);
  assert.match(html, /data-action="confirm-no"/);
  assert.match(html, /data-action="confirm-yes"/);
  assert.match(html, />아니요</);
  assert.match(html, />네</);
});

test("쉬운 모드: 평소엔 선택지 설명을 숨기고, 쉬운 모드를 켜면 설명이 보인다 (설정·예약·초진재진 화면)", () => {
  assert.doesNotMatch(accessibilityScreenHTML({ HIGH_CONTRAST: true }), /글을 조금 더 뚜렷하게 볼 수 있어요/);
  assert.match(accessibilityScreenHTML({ HIGH_CONTRAST: true, EASY_MODE: true }), /글을 조금 더 뚜렷하게 볼 수 있어요/);

  assert.doesNotMatch(reservationScreenHTML(""), /예약하신 일정으로/);
  assert.match(reservationScreenHTML("", { EASY_MODE: true }), /예약하신 일정으로/);

  assert.doesNotMatch(visitTypeScreenHTML(""), /이전 방문 기록을 바탕으로/);
  assert.match(visitTypeScreenHTML("", { EASY_MODE: true }), /이전 방문 기록을 바탕으로/);
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
  assert.match(html, /2층 · 정형외과 접수 데스크/);
  assert.match(html, /다른 진료과를 선택할래요/);
  assert.match(html, /추천 정확도 높음/);
  assert.doesNotMatch(html, /아프|증상/);
});

test("진료과(추천) 화면: 음성 안내 설정 시 음성 안내 모드 필을 보여준다", () => {
  assert.match(departmentChoiceHTML("", { VOICE_GUIDANCE: true }), /음성 안내 모드/);
  assert.doesNotMatch(departmentChoiceHTML(""), /음성 안내 모드/);
});

test("진료과(추천) 화면: 직원 도움 선호 시 직원 도움 안내 필과 동행 문구를 보여준다", () => {
  assert.match(departmentChoiceHTML("", { STAFF_HELP: true }), /직원 도움 안내/);
  assert.match(departmentChoiceHTML("", { STAFF_HELP: true }), /직원이 찾아와서 안내해 드릴게요/);
  assert.doesNotMatch(departmentChoiceHTML(""), /직원 도움 안내/);
});

test("진료과(추천) 화면: 시각 안내 설정 시 시각 안내 모드 필을 보여준다", () => {
  assert.match(departmentChoiceHTML("", { VISUAL_GUIDANCE: true }), /시각 안내 모드/);
  assert.doesNotMatch(departmentChoiceHTML(""), /시각 안내 모드/);
});

test("공황장애 모드: 예약·초진재진·진료과 화면에 차분한 안내 필과 안심 문구를 보여준다", () => {
  for (const html of [
    reservationScreenHTML("", { SIMPLE_STEPS: true }),
    visitTypeScreenHTML("", { SIMPLE_STEPS: true }),
    departmentChoiceHTML("", { SIMPLE_STEPS: true }),
    departmentListScreenHTML("", { SIMPLE_STEPS: true }),
  ]) {
    assert.match(html, /차분한 안내/);
    assert.match(html, /천천히 하셔도 돼요/);
    assert.match(html, /data-action="pause"/);
  }
  assert.doesNotMatch(reservationScreenHTML(""), /차분한 안내/);
  assert.doesNotMatch(visitTypeScreenHTML(""), /천천히 하셔도 돼요/);
  assert.doesNotMatch(departmentChoiceHTML(""), /data-action="pause"/);
});

test("공황장애 모드: 모든 화면(설정·예약·초진재진·진료과 추천·진료과 목록)에 '이전 페이지로 돌아가기' 링크를 보여준다", () => {
  const screens = [
    accessibilityScreenHTML({ SIMPLE_STEPS: true }),
    reservationScreenHTML("", { SIMPLE_STEPS: true }),
    visitTypeScreenHTML("", { SIMPLE_STEPS: true }),
    departmentChoiceHTML("", { SIMPLE_STEPS: true }),
    departmentListScreenHTML("", { SIMPLE_STEPS: true }),
  ];
  for (const html of screens) {
    assert.match(html, /class="back-link-text" data-action="back"/);
    assert.match(html, /이전 페이지로 돌아가기/);
  }
  assert.doesNotMatch(reservationScreenHTML(""), /이전 페이지로 돌아가기/);
  assert.doesNotMatch(visitTypeScreenHTML(""), /back-link-text/);
  assert.doesNotMatch(departmentChoiceHTML(""), /back-link-text/);
  assert.doesNotMatch(accessibilityScreenHTML({}), /back-link-text/);
});

test("잠시 쉬기 화면: 호흡 가이드 + 자발적 직원 호출 선택지를 보여준다", () => {
  const html = pauseScreenHTML();
  assert.match(html, /잠시 쉬어도/);
  assert.match(html, /breathe/);
  assert.match(html, /data-action="staff-ask"/);
  assert.match(html, /괜찮으시면 직원을 부를 수 있어요/);
  assert.match(html, /data-action="resume"/);
  assert.doesNotMatch(html, /직원이 곧 도와드릴게요/);
});

test("잠시 쉬기 화면: 직원 호출을 누르면 안심 문구만 보여준다 (강제 호출 없음)", () => {
  const asked = pauseScreenHTML(true);
  assert.match(asked, /직원이 곧 도와드릴게요/);
  assert.doesNotMatch(asked, /data-action="staff-ask"/);
});

test("진료과(추천) 화면: 진행 단계가 5칸이고 직원 호출 버튼이 없다", () => {
  const html = departmentChoiceHTML("");
  assert.match(html, /진행 단계 \d+\/5/);
  const bars = html.match(/<span class="active"><\/span>/g) ?? [];
  assert.equal(bars.length, 4); // 5칸 중 4칸 진행됨(현재 화면 포함)
  assert.doesNotMatch(html, /data-action="staff"/);
});

test("진료과 직접 선택: 병원 진료과 10개 + 잘 모르겠어요를 2열 그리드로 보여준다", () => {
  assert.equal(DEPARTMENTS.length, 11);
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
    "잘 모르겠어요",
  ]);
  const html = departmentListScreenHTML("");
  assert.match(html, /class="dept-grid"/);
});

test("진료과 직접 선택 화면: 목록 전체를 렌더링하고 증상을 묻지 않는다", () => {
  const html = departmentListScreenHTML("");
  const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  for (const d of DEPARTMENTS) {
    assert.match(html, new RegExp(`data-value="${d.value}"`));
    assert.match(html, new RegExp(escapeRegExp(d.title)));
  }
  assert.match(html, /진료과를/);
  assert.match(html, /data-action="back"/);
  assert.doesNotMatch(html, /아프|증상/);
  assert.match(html, /disabled/);
  assert.doesNotMatch(departmentListScreenHTML("ENT"), /disabled/);
});

test("진료과 직접 선택: 스키마에 없는 진료과(신경과 등)는 제출용 departmentId로 UNSPECIFIED로 매핑된다", () => {
  assert.equal(toOfficialDepartmentId("ORTHOPEDICS"), "ORTHOPEDICS");
  assert.equal(toOfficialDepartmentId("INTERNAL_MEDICINE"), "INTERNAL_MEDICINE");
  assert.equal(toOfficialDepartmentId("ENT"), "ENT");
  assert.equal(toOfficialDepartmentId("NEUROLOGY"), "UNSPECIFIED");
  assert.equal(toOfficialDepartmentId("SURGERY"), "UNSPECIFIED");
  assert.equal(toOfficialDepartmentId("DERMATOLOGY"), "UNSPECIFIED");
  assert.equal(toOfficialDepartmentId("UNSPECIFIED"), "UNSPECIFIED");
  assert.equal(toOfficialDepartmentId(""), "UNSPECIFIED");

  const raw = assembleRawInput({
    accessibility: {},
    appointmentStatus: "HAS_APPOINTMENT",
    visitType: "FIRST_VISIT",
    departmentId: "NEUROLOGY",
  });
  assert.equal(raw.departmentId, "UNSPECIFIED");
  assert.equal(raw.departmentDisplayId, "NEUROLOGY");
});

test("assembleRawInput: 로그인 여부와 화면 값을 하나로 합치고 보호자 동행을 설정에서 파생한다", () => {
  const raw = assembleRawInput({
    loginChoice: { loggedIn: true, auth: "LOGIN" },
    accessibility: { LARGE_TEXT: true, GUARDIAN_MODE: true, fontScale: "LARGE" },
    appointmentStatus: "HAS_APPOINTMENT",
    visitType: "FIRST_VISIT",
    departmentId: "ORTHOPEDICS",
  });

  assert.equal(raw.loggedIn, true);
  assert.equal(raw.auth, "LOGIN");
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

test("assembleRawInput: loginChoice 없이도 동작한다 (비회원 경로)", () => {
  const raw = assembleRawInput({
    accessibility: { fontScale: "NORMAL" },
    appointmentStatus: "NO_APPOINTMENT",
    visitType: "REVISIT",
    departmentId: "ORTHOPEDICS",
  });

  assert.equal(raw.loggedIn, undefined);
  assert.equal(raw.auth, undefined);
  assert.equal(raw.appointmentStatus, "NO_APPOINTMENT");
});

test("collectProfile: 브라우저 DOM 이 없는 Node 에서 멈추지 않고 즉시 실패한다 (NOT_IMPLEMENTED 가 아님)", async () => {
  await assert.rejects(collectProfile(), (err: unknown) => {
    const msg = String((err as Error).message);
    return !msg.startsWith("NOT_IMPLEMENTED") && /DOM/.test(msg);
  });
});
