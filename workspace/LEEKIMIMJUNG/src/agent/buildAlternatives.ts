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
import { exclusionReasons } from "./filterCandidates.ts";

/** 참가팀 서비스가 수집한 원본 입력 (형식 자유 — 웹폼/음성/QR/챗봇 무엇이든). */
export type RawUserInput = Record<string, unknown>;

const todo = (fn: string, what: string): never => {
throw new Error(
    `NOT_IMPLEMENTED: ${fn}() 는 참가팀이 구현해야 합니다 — ${what}. ` +
    "진행 상황은 npm run participant:progress 로 확인하세요.",
);
};

// 빠른 요약
// 뭘: 대안 후보 뽑기
// 어떻게: recommend에서 뺀 2~3순위 후보 ID만 배열로 반환 (제외된 후보는 다시 살리지 않기)
// 참고 문서: docs/environments/HOSPITAL_PARTICIPANT_GUIDE.md, docs/ERROR_CATALOG.md
export function buildAlternatives(_candidates: Candidate[], _rec: Recommendation): string[] {
  // recommend()가 이미 계산해 둔 정보를 그대로 씁니다 — 방문유형/예약여부/진료과가 안 맞는
  // 후보(excludedCandidates)까지 대안으로 보여주면, 사용자가 뭘 골랐든 같은 후보만 계속
  // 나오는 문제가 생깁니다(실사용 중 발견). scoreBreakdown으로 그중 더 맞는 순서로 정렬합니다.
  const mismatchedIds = new Set((_rec.excludedCandidates ?? []).map((e) => e.candidateId));
  const scoreBreakdown = _rec.scoreBreakdown ?? {};

  const alternatives = _candidates.filter((candidate) => {
    if (!candidate) return false;
    if (candidate.candidateId === _rec.recommendedCandidateId) return false;
    if (exclusionReasons.has(candidate.candidateId)) return false;
    if (candidate.available === false) return false;
    if (mismatchedIds.has(candidate.candidateId)) return false;
    return true;
  });

  alternatives.sort((a, b) => (scoreBreakdown[b.candidateId] ?? 0) - (scoreBreakdown[a.candidateId] ?? 0));

  return alternatives.slice(0, 2).map((c) => c.candidateId);
}