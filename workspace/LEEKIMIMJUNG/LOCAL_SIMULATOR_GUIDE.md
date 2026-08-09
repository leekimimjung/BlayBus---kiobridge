# KioBridge 공식 시뮬레이터 로컬 실행 가이드

## 1. 왜 두 서버를 따로 띄워야 하는가

`npm run dev` 하나로 API(기본 4000번)와 웹(3000번)을 동시에 띄우는 게 원래 정상이지만, 미리보기 도구로 `npm run dev`를 그대로 실행하면 **PORT 환경변수가 두 프로세스 모두에 3000으로 주입돼 포트 충돌**이 난다 (API가 4000 대신 3000에 붙어버림 → 웹 접속 시 `Cannot GET /` 에러). 그래서 **API와 웹을 분리해서 실행**해야 한다.

## 2. API 서버 실행 (4000번 포트)

```bash
PORT=4000 npm run dev:api > /tmp/kiobridge-api.log 2>&1 &
```

확인:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4000/api/v1/environments/hospital/fixture
```

`200`이 나오면 정상.

## 3. 웹 시뮬레이터 실행 (3000번 포트)

`.claude/launch.json`에 아래처럼 등록해두고,

```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "kiobridge-dev",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev:web"],
      "port": 3000
    }
  ]
}
```

`npm run dev:web`(vite)만 3000번으로 띄운다. `vite.config.ts`에 `/api` → `http://localhost:4000` 프록시가 이미 설정돼 있어서 웹이 API를 자동으로 찾아간다.

> 참고: 화면 상단에 `API 연결 실패`가 떠도 무시해도 된다. 프론트엔드의 `/health` 체크 경로가 프록시 대상(`/api`)에 안 걸려서 뜨는 표시일 뿐, 실제 `/api/*` 호출은 정상 동작한다. (플랫폼 파일이라 우리가 고칠 부분 아님)

## 4. 브라우저에서 흐름 따라가기

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

## 5. 직접 만든 제출 JSON을 넣고 싶을 때 (예: 병원 환경)

- "2. 세션·제출 대기" 화면의 `JSON 붙여넣기` 박스에 직접 붙여넣고 `제출`
- 또는 API로 바로 POST:

```bash
curl -X POST http://localhost:4000/api/v1/sessions/<세션ID>/submission \
  -H "Content-Type: application/json" \
  --data @submission.json
```

- 필수 구조: `profile` → `sessionContext` → `recommendation` → `userDecision` → `executionPlan`
- `executionPlan.actions`는 `fixture.transitions`를 그대로 따라가며 `expectedBeforeState`/`expectedAfterState`를 채우고, 마지막에 `manifest.requiredVerifierAction`(병원은 `verify_checkin`) 액션으로 끝나야 함

## 6. 종료

```bash
# 웹(브라우저 미리보기)은 preview_stop으로, API는:
lsof -nP -iTCP -sTCP:LISTEN | grep -E ':(3000|4000)'   # PID 확인
kill <PID>
```

---

**⚠️ 주의**: `sandbox` 환경은 "평가에 사용되지 않는" 연습 전용이라 자유롭게 테스트해도 되지만, `hospital` 환경에 실제 제출을 넣는 건 우리 9개 함수(`participant.ts`)를 구현해서 우리 서비스가 만든 결과로만 해야 함 (임의 curl 테스트 제출은 자제 — 이번엔 화면 확인 목적으로 예외적으로 했음).
