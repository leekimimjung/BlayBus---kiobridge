// 조은빛, 여윤우 담당
/**
 * STEP 1 — collectProfile
 *
 * 목적:
 *   사용자에게서 정보를 받습니다. 이 단계가 여러분 서비스의 얼굴입니다.
 *
 * 입력:
 *   없음 (여러분의 UI·음성·QR·챗봇이 알아서 수집)
 *
 * 반환:
 *   RawUserInput — 형식 자유. 다음 단계에서 공식 형식으로 옮깁니다.
 *
 * 반드시:
 *   - 로그인 없이도 기본 기능이 동작할 것
 *   - 사용자가 "이번 한 번만" 을 고를 수 있을 것
 *   - 자동으로 불러온 값은 화면에 보여주고 확인받을 것
 *
 * 금지:
 *   - 회원가입 강제
 *   - 실제 주민등록번호·전화번호·카드번호 수집
 *   - 사용자가 말하지 않은 값을 채워 넣기
 *
 * 관련 오류:
 *   PERSONAL_DATA_NOT_ALLOWED
 *
 * 의사코드:
 *   const answers = await myUi.ask();      // 웹폼 / 음성 / QR 무엇이든
 *   return { ...answers, collectedVia: "VOICE" };
 *
 * 완료 확인:
 *   npm run participant:progress
 */

/** 참가팀 서비스가 수집한 원본 입력 (형식 자유 — 웹폼/음성/QR/챗봇 무엇이든). */
export type RawUserInput = Record<string, unknown>;

const todo = (fn: string, what: string): never => {
  throw new Error(
    `NOT_IMPLEMENTED: ${fn}() 는 참가팀이 구현해야 합니다 — ${what}. ` +
      "진행 상황은 npm run participant:progress 로 확인하세요.",
  );
};


// ══════════════════════════════════════════════════════════════
// 컴포넌트 함수 틀 (조은빛, 여윤우) — 프레임워크(React/Vue/바닐라JS) 자유.
// 아래 이름으로 화면 단위 함수를 채우면 됩니다. 지금은 뼈대만 있고 안은 비어있음.
// ══════════════════════════════════════════════════════════════

/** 로그인 여부 선택 화면 — "로그인" 버튼 + "로그인 없이 이번만 이용" 버튼 둘 다 있어야 함 */
async function renderLoginChoiceScreen(): Promise<{ loggedIn: boolean }> {
  // TODO: 조은빛/여윤우 구현
  throw new Error("NOT_IMPLEMENTED: renderLoginChoiceScreen");
}

/** 서비스 유형 선택 화면 — 방문유형(초진/재진/건강검진/검사/모름), 예약여부(있음/없음/모름) */
async function renderVisitTypeScreen(): Promise<{ visitType: string; appointmentStatus: string }> {
  // TODO: 조은빛/여윤우 구현
  throw new Error("NOT_IMPLEMENTED: renderVisitTypeScreen");
}

/** 접근성 설정 입력 화면 — 큰글씨/쉬운문장/시각안내/청각지원/이동지원/고대비/직원도움선호 */
async function renderAccessibilityScreen(): Promise<Record<string, boolean>> {
  // TODO: 조은빛/여윤우 구현
  throw new Error("NOT_IMPLEMENTED: renderAccessibilityScreen");
}

/**
 * 진료과 직접 선택 화면.
 * 🚨 증상을 묻지 마세요 ("어디가 아프세요?" 금지). "어느 과로 오셨어요? 모르시면 일반안내로
 * 도와드릴게요"처럼 물어야 함. 사용자가 모른다고 하면 담을 값은 "UNSPECIFIED".
 */
async function renderDepartmentScreen(): Promise<{ departmentId: string }> {
  // TODO: 조은빛/여윤우 구현
  throw new Error("NOT_IMPLEMENTED: renderDepartmentScreen");
}

/** 보호자 동행 여부 확인 화면 */
async function renderGuardianScreen(): Promise<{ guardianPresent: boolean }> {
  // TODO: 조은빛/여윤우 구현
  throw new Error("NOT_IMPLEMENTED: renderGuardianScreen");
}

/** 위 화면들에서 모은 값을 하나의 RawUserInput 객체로 합치기 */
function assembleRawInput(parts: {
  loginChoice: { loggedIn: boolean };
  visitType: { visitType: string; appointmentStatus: string };
  accessibility: Record<string, boolean>;
  department: { departmentId: string };
  guardian: { guardianPresent: boolean };
}): RawUserInput {
  // TODO: 조은빛/여윤우 구현 — 위 값들을 그대로 합치면 됨 (STEP2가 공식 형식으로 변환)
  return { ...parts.visitType, ...parts.accessibility, ...parts.department, ...parts.guardian };
}

// 빠른 요약
// 뭘: 사용자 정보 입력 화면
// 어떻게: 위 컴포넌트 함수들을 순서대로 호출해서 화면을 넘기고, 마지막에 assembleRawInput으로 합쳐서 반환
// 참고 문서: docs/LOGINLESS_QR_PROFILE_GUIDE.md, docs/DATA_CLASSIFICATION.md, docs/environments/HOSPITAL_PARTICIPANT_GUIDE.md
export async function collectProfile(): Promise<RawUserInput> {
  // TODO: 아래 주석 순서대로 컴포넌트 함수 호출해서 조립하면 됩니다.
  // const loginChoice = await renderLoginChoiceScreen();
  // const visitType = await renderVisitTypeScreen();
  // const accessibility = await renderAccessibilityScreen();
  // const department = await renderDepartmentScreen();
  // const guardian = await renderGuardianScreen();
  // return assembleRawInput({ loginChoice, visitType, accessibility, department, guardian });
  return todo("collectProfile", "사용자 정보 수집 채널 구현");
}