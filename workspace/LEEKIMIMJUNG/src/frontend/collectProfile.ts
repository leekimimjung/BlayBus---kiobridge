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


// 빠른 요약
// 뭘: 사용자 정보 입력 화면
// 어떻게: 폼/버튼으로 접근성·방문유형·진료과 등 입력받고 객체로 반환. 로그인 없이도 동작
export async function collectProfile(): Promise<RawUserInput> {
  return todo("collectProfile", "사용자 정보 수집 채널 구현");
}