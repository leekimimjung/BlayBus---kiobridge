# KioBridge 공식 시뮬레이터 로컬 실행 가이드

## 1. 실행 (터미널에서 이렇게만 하면 됨)

```bash
npm install       # 최초 1회만
npm run dev
```

정상적으로 뜨면:

| 서비스 | 주소 |
| --- | --- |
| Simulator Web (공식 UI) | http://localhost:3000 |
| Simulation API | http://localhost:4000 |

`npm run dev`는 API(4000번)와 웹(3000번)을 `concurrently`로 동시에 띄워줍니다. 터미널에 `[api]`, `[web]` 로그가 같이 찍히면 정상.

## 2. 브라우저에서 흐름 따라가기

1. `http://localhost:3000` 접속 → **"환경을 선택하세요"** 화면
2. **연습용 Sandbox** 카드 → `세션 생성 →` 클릭
   - **2. 세션·제출 대기** 탭으로 이동, 세션 ID(`SIM-...`)와 제출 주소(`/api/v1/sessions/{id}/submission`)가 보임
3. `형식 예제 제출 불러오기` 클릭 → 공식 예제 제출이 자동으로 로드·제출됨 (1초 폴링으로 자동 감지)
   - **3. 제출 검토·검증** 탭으로 자동 이동 (프로필/추천/사용자결정/실행계획 요약 표시)
4. `검증 실행` 클릭 → 서버 dry-run 결과 (`PASS`/`FAIL` + 규칙별 배지)
5. `디지털 트윈 재생 →` 클릭 → **4. 디지털 트윈 재생** 탭으로 이동
6. `전체 자동재생` 클릭 → 실행계획의 Action을 순서대로 재생하며 가상 키오스크 화면이 바뀜
   - 화면 하단에 항상 `SIMULATED UI · NO ACTUAL DEVICE CONNECTION · actualDeviceCommandSent: false` 표시
   - 마지막엔 `RUN_STOPPED / NORMAL_BOUNDARY_STOP` — 검토 경계 도달 + verifier 실행 후 정지 (결제·실제처리 없음)
7. `Evidence →` 클릭하면 **5. Evidence** 탭에서 서버가 만든 실행 증거 확인 가능

## 3. 직접 만든 제출 JSON을 넣고 싶을 때 (예: 병원 환경)

- "2. 세션·제출 대기" 화면의 `JSON 붙여넣기` 박스에 직접 붙여넣고 `제출`
- 또는 API로 바로 POST:

```bash
curl -X POST http://localhost:4000/api/v1/sessions/<세션ID>/submission \
  -H "Content-Type: application/json" \
  --data @submission.json
```

- 필수 구조: `profile` → `sessionContext` → `recommendation` → `userDecision` → `executionPlan`
- `executionPlan.actions`는 `fixture.transitions`를 그대로 따라가며 `expectedBeforeState`/`expectedAfterState`를 채우고, 마지막에 `manifest.requiredVerifierAction`(병원은 `verify_checkin`) 액션으로 끝나야 함

## 4. 종료

터미널에서 `Ctrl + C`

---

**⚠️ 주의**: `sandbox` 환경은 "평가에 사용되지 않는" 연습 전용이라 자유롭게 테스트해도 되지만, `hospital` 환경에 실제 제출을 넣는 건 우리 9개 함수(`participant.ts`)를 구현해서 우리 서비스가 만든 결과로만 해야 함.
