/**
 * STEP 7 — buildAlternatives
 *
 * 목적:
 *   1순위가 사용자의 뜻과 다를 때 돌아갈 길을 만듭니다.
 *
 * 입력:
 *   Candidate[], Recommendation
 *
 * 반환:
 *   string[] — 대안 후보 ID 목록
 *
 * 반드시:
 *   - 대안도 hardConstraints 를 지킬 것
 *   - 화면에 "다른 것 보기" 를 제공할 것
 *
 * 금지:
 *   - 제외된 후보를 대안으로 되살리기
 *
 * 관련 오류:
 *   EXCLUDED_CANDIDATE_NOT_FOUND
 *
 * 완료 확인:
 *   npm run participant:progress
 */
import type {
    Candidate, Recommendation
} from "@kiobridge/participant-sdk";

/** 참가팀 서비스가 수집한 원본 입력 (형식 자유 — 웹폼/음성/QR/챗봇 무엇이든). */
export type RawUserInput = Record<string, unknown>;

const todo = (fn: string, what: string): never => {
throw new Error(
    `NOT_IMPLEMENTED: ${fn}() 는 참가팀이 구현해야 합니다 — ${what}. ` +
    "진행 상황은 npm run participant:progress 로 확인하세요.",
);
};

export function buildAlternatives(_candidates: Candidate[], _rec: Recommendation): string[] {
  return todo("buildAlternatives", "대안 후보 목록 구성");
}