# CLAUDE.md

Claude Code가 이 저장소에서 작업할 때 참고하는 프로젝트 가이드입니다.

## 프로젝트 개요

**KioBridge 해커톤 참가 프로젝트** — 병원(hospital) 환경 대상.
병원 키오스크 앞에서 겪는 정보 입력·탐색·이해·선택의 어려움을 줄이는
**개인화 판단 엔진 + 디지털 트윈 시뮬레이터**를 만든다.

- 팀ID: `LEEKIMIMJUNG`
- 환경: `hospital`
- 제품 버전: `5.1.4` / inputContractVersion: `1.0.0`
- 우리는 **키오스크 자체를 만들지 않는다.** 사용자 접점(프로필 수집 UI, 추천 로직, 승인 UX)만 만들고,
  공식 시뮬레이터가 우리가 만든 "의미 기반 실행계획"을 가상 키오스크 화면에 적용한다.

## 절대 원칙 (SIMULATION_ONLY)

- 실제 키오스크 클릭, 실제 Agent 연결, 실제 결제, 실제 병원 접수 **절대 금지**
- 모든 개발·테스트·시연은 DIGITAL_TWIN 기준
- 출력에 항상 포함: `validationMode: "SIMULATION_ONLY"`, `executionEnvironment: "DIGITAL_TWIN"`, `actualDeviceCommandSent: false`
- 로그인은 선택 기능. **로그인 없이도 핵심 흐름(입력→추천→이유확인→승인→시뮬레이션)이 항상 가능해야 함**
- 실제 개인정보(이름/전화번호/주소/주민번호/환자번호/진료정보) 절대 입력·저장 금지 → 가상·합성 데이터만 사용

## 🚨 병원 환경 전용 금지 규칙 (매우 중요)

`docs/environments/HOSPITAL_PARTICIPANT_GUIDE.md` 기준:

- **증상으로 진료과를 추론하는 것 절대 금지** (의료 판단으로 간주됨)
  - 진료과(`departmentId`)는 **사용자가 직접 말한 것만** 사용
  - "무릎 아프다" → 자동으로 정형외과 매칭 ❌ 금지
  - 모르면 `UNSPECIFIED`(일반 안내) 또는 직원 도움 경로로 안내
- 진단·치료 추천·응급도 판단 금지
- 예약 없는 사용자에게 예약필수 경로 추천 금지
- `departmentId`가 UNKNOWN인데 특정 과 자동 선택 금지
- 실제 접수 완료/환자번호/예약정보 생성 금지

> 이전에 논의한 "정수진(김민준) — 무릎통증 → 정형외과 자동매칭" 시나리오는 이 규칙 위반이므로
> "사용자에게 어느 과인지 직접 묻기" 또는 "모르면 일반 안내/직원 도움 경로"로 수정해야 함.

## 개발 명령어

```bash
npm run participant:doctor                                    # 환경 점검
npm run participant:demo                                      # 샌드박스 왕복 시연
npm run participant:init -- --team LEEKIMIMJUNG --env hospital # 팀 초기화 (완료됨)
npm run participant:progress -- --team LEEKIMIMJUNG            # 9개 함수 구현 진행률 확인
npm run participant:validate -- --file <출력파일> --execute     # 검증 (SIMULATION PASS 목표)
npm run participant:package -- --team LEEKIMIMJUNG --file <파일> # 제출 패키징
```

## 우리가 수정하는 파일

```
workspace/LEEKIMIMJUNG/src/participant.ts   ← 핵심 구현 파일
workspace/LEEKIMIMJUNG/src/config.ts
workspace/LEEKIMIMJUNG/src/types.ts
workspace/LEEKIMIMJUNG/input/raw-user-input.json
```

`packages/`, `apps/`, `environments/`, `schemas/`는 플랫폼 실행용이며 **절대 수정하지 않음**
(`DO_NOT_EDIT_PLATFORM_FILES.md` 참고).

## 구현해야 할 9개 함수 (participant.ts, 순서대로)

| # | 함수 | 역할 | 담당(예정) |
|---|---|---|---|
| 1 | `collectProfile` | 사용자 정보 수집 (UI/음성/QR 자유) | 프론트엔드 |
| 2 | `mapToCanonicalInput` | 수집값 → 공식 UserProfile 형식 변환 | 백엔드 |
| 3 | `createSessionContext` | 이번 이용 맥락(SessionContext) 구성 | 백엔드 |
| 4 | `filterCandidates` | Hard Constraint 위반 후보 제외 | AI/매칭엔진 |
| 5 | `recommend` | 후보 순위 결정 | AI/매칭엔진 |
| 6 | `explainRecommendation` | 추천 이유 설명 (사람이 읽을 수 있게, 최소 1개) | AI/매칭엔진 |
| 7 | `buildAlternatives` | 대안 제시 | AI/매칭엔진 |
| 8 | `collectUserDecision` | 사용자 승인/거절/수정 UX | 프론트엔드 |
| 9 | `buildExecutionPlan` | 의미 기반 실행계획 생성 (승인 후에만) | 백엔드 |

각 함수 상세 스펙(입력/출력/반드시/금지/관련 오류코드)은 `participant-workspace/src/participant.ts` 원본 주석에 이미 다 적혀 있음 — 구현 전 반드시 해당 함수의 JSDoc 주석 정독.

## 데이터 모델 핵심 개념

- **Profile**: 오래 유지되는 정보 (접근성 설정, 선호 입력방식, 언어) — `accessibility.largeText`, `hearingSupport`, `staffAssistancePreferred`, `interaction.preferredInput`, `language: "ko-KR"`
- **SessionContext**: 이번 이용에만 해당하는 정보 (오늘 뭐 하러 왔는지) — 섹션 절대 혼동 금지:
  - `facts`: 확인된 사실 (visitType, appointmentStatus, departmentId, guardianPresent) — 양보 불가
  - `preferences`: 선호 (supportModes) — 불일치는 경고만
  - `hardConstraints`: 절대 조건 (medicalInferenceAllowed: false) — 불일치는 차단
  - `capabilities`: 쓸 수 있는 수단 (canUseSelfCheckIn) — 양보 불가
  - **섹션을 섞으면 `DOMAIN_CONTEXT_MISMATCH` 오류로 거부됨**

## 병원 환경 공식 enum (임의 값 금지)

```
visitType: FIRST_VISIT | REVISIT | HEALTH_SCREENING | EXAM | UNKNOWN
appointmentStatus: HAS_APPOINTMENT | NO_APPOINTMENT | UNKNOWN
departmentId: INTERNAL_MEDICINE | ORTHOPEDICS | ENT | RADIOLOGY | HEALTH_SCREENING | UNSPECIFIED
supportModes: LARGE_TEXT | HEARING_SUPPORT | VISUAL_GUIDANCE | SIMPLE_STEPS | STAFF_HELP | GUARDIAN_MODE
preferredInput: TOUCH | VOICE | KEYBOARD | SWITCH | ASSISTED | MULTIMODAL
```

- 값 표기: enum은 `UPPER_SNAKE_CASE`, JSON 필드는 `camelCase`
- 언어는 반드시 지역 포함 (`ko-KR`, `ko` 는 거부됨)
- 타임스탬프는 UTC ISO 8601 (`2026-08-03T00:11:00Z`)
- 공식 enum에 없는 값은 핵심 필드에 넣지 말고 `UNKNOWN` 또는 `extensions`에 넣기

## UNKNOWN / NO_PREFERENCE / NOT_APPLICABLE 구분 (혼동 금지)

- **누락**(필드 자체 없음): 수집 안 했거나 이번 흐름에 불필요
- **UNKNOWN**: 물어봤지만 모름/신뢰 불가 → hardConstraint에서 이 값이면 정책 위반
- **NO_PREFERENCE**: 사용자가 선호 없음
- **NOT_APPLICABLE**: 현재 환경에서 해당 없음
- Hard Constraint가 UNKNOWN이면 임의 추론 금지 → 재확인 요청 / 안전한 대체경로(직원 도움) / STOP 중 택1
- 음성 등 저신뢰 입력(`confidence < 0.6`)이면서 `confirmedByUser=false`면 재확인 필요

## 실행계획(ExecutionPlan) 통과 조건

- 추천 후보가 `available=true`
- 실행계획에 추천 후보 선택 Action이 **정확히 한 번** 존재, 추천과 일치
- 옵션은 해당 후보가 지원하는 것만, 필수 옵션 모두 충족
- 각 Action의 `expectedBeforeState`/`expectedAfterState`가 실제 상태와 일치
- 검토 경계 상태(review boundary)에서 **필수 verifier(읽기 전용)** 실행
- verifier 이후 추가 Action 없음, **결제/실제처리 Action 없음**
- Action은 `action`/`target.kind`(candidate/option/enum) 기반 — 좌표나 `automationId` 사용 금지 (스키마가 거부함)

## 실제 Fixture 데이터 (확인 완료, localhost:4000/api/v1/environments/hospital/fixture)

**화면 흐름**: `WELCOME → VISIT_TYPE → APPOINTMENT_CHECK → DEPARTMENT_SELECTION → ACCESSIBILITY_SUPPORT → CHECKIN_REVIEW → STOP`

**후보(candidates) 6개** (fixtureVersion: hospital@0.2.0):
| ID | 이름 | 방문유형 | 예약 | 진료과 |
|---|---|---|---|---|
| HOS-001 | 예약 재진 접수 | REVISIT | HAS_APPOINTMENT | INTERNAL_MEDICINE |
| HOS-002 | 예약 초진 접수 | FIRST_VISIT | HAS_APPOINTMENT | ORTHOPEDICS |
| HOS-003 | 비예약 초진 안내 | FIRST_VISIT | NO_APPOINTMENT | UNSPECIFIED |
| HOS-004 | 건강검진 안내 | HEALTH_SCREENING | HAS_APPOINTMENT | HEALTH_SCREENING |
| HOS-005 | 검사 예약 확인 | EXAM | HAS_APPOINTMENT | RADIOLOGY |
| HOS-006 | 직원 도움 요청 | 전체 지원 | NO_APPOINTMENT | UNSPECIFIED |

**허용 Action**: start, select_visit_type, check_appointment, select_department, select_flow, select_support, verify_checkin, request_staff_help
**금지 Action** (서버 레벨 차단): diagnose, triage, recommend_treatment, assign_department_final, complete_checkin, query_patient, select_payment, confirm_payment, submit_payment

**compatibilityRules에 `HOSPITAL_DEPARTMENT_COMPATIBILITY` 규칙명 자체가 "증상 기반 추론 금지"로 명시됨** — departmentId는 facts 섹션의 사용자 응답값과 후보의 supportedOptions.DEPARTMENT가 IN 매칭되어야 함 (BLOCK 심각도, RECONFIRM 정책).

## 병원 시나리오 (5개, 조건 조합으로 처리 — 하드코딩 금지)

같은 매칭 엔진이 조건에 따라 다른 결과를 내야 함. 페르소나별 if문 분기 금지.

1. 시각장애 아동 — 초진, 예약없음, 음성안내, 보호자없음 → 안전장치(직원호출) 필수
2. 청각장애 환자 — 초진, 예약없음, 청각지원 → 화면 시각 알림으로 대체
3. 재진 고령자 — 재진, 예약있음, 큰글씨 → 완료 후 세션 리셋
4. 무릎통증 학생 — 초진, 예약없음 → **진료과는 사용자가 직접 선택** (자동매칭 금지, 위 병원 금지규칙 참고)
5. (자유 창의) 공황장애 환자 — 재진, "천천히 진행 모드" → 화면전환 느리게 + 단계별 재확인 문구 + 조용한 대기공간 안내

## 완료 체크리스트

- [ ] `npm run participant:progress -- --team LEEKIMIMJUNG` 9/9
- [ ] `npm run participant:validate` PASS
- [ ] 경고 발생 시 원인 설명 가능
- [ ] 추천 이유 최소 1개, 사람이 읽을 수 있는 문장
- [ ] 대안·거절·직원 도움 경로 화면에 존재
- [ ] 로그인 없이 기본 기능 동작
- [ ] 실제 개인정보 미저장
- [ ] 키보드만으로 전체 흐름 가능 (수동 확인 필요)
- [ ] 화면 확대 200%에서 사용 가능 (수동 확인 필요)
- [ ] 색상 없이 상태 이해 가능 (수동 확인 필요)

## 마감

1차 산출물 마감: **8월 15일** (서비스 구동 URL + 발표자료)