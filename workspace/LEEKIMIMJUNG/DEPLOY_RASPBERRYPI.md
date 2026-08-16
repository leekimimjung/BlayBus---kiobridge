# 라즈베리파이 배포 가이드 — 은빛 병원 무인 접수 안내 (LEEKIMIMJUNG)

`web-app/`은 완전히 정적인 사이트로 빌드됩니다 (외부 API·백엔드 서버 없음).
hospital fixture(`web-app/src/hospital.fixture.json`)를 번들에 정적으로 포함해서,
빌드된 결과물만 있으면 인터넷 연결 없이도 전체 흐름(입력→추천→이유확인→승인)이 동작합니다.

두 가지 방법 중 편한 걸 쓰면 됩니다.

## 방법 A — Docker (추천)

라즈베리파이에 Docker만 설치되어 있으면 됩니다 (Node 설치 불필요).

```bash
git clone <이 저장소 URL>
cd kiobridge-simulation-kit-v5.1.4/workspace/LEEKIMIMJUNG
docker compose up -d --build
```

- 접속: `http://<라즈베리파이 IP>:1001`
- 끄기: `docker compose down`
- 다시 켜기: `docker compose up -d` (재빌드 필요 없으면 `--build` 생략)
- 코드 바뀐 뒤 반영: `docker compose up -d --build`
- 로그 보기: `docker compose logs -f`

`docker-compose.yml`이 `restart: unless-stopped`로 되어 있어서, 라즈베리파이가
재부팅돼도 자동으로 다시 켜집니다.

### 포트가 겹칠 때
1001번이 이미 쓰이고 있으면 `docker-compose.yml`의 `"1001:80"`을 `"1002:80"`으로
바꾸고 다시 `docker compose up -d --build` 하면 됩니다.

### 아키텍처 참고
`node:20-alpine`·`nginx:alpine` 모두 공식 이미지가 arm64를 지원해서, 라즈베리파이
4/5(64비트 OS)에서 별도 설정 없이 그대로 빌드됩니다. 32비트 OS를 쓰고 있다면
64비트 Raspberry Pi OS로 다시 설치하는 걸 권장합니다.

## 방법 B — Node로 직접 빌드 후 아무 정적 서버로 서빙

Docker를 쓰기 싫거나 이미 Node가 깔려 있으면:

```bash
git clone <이 저장소 URL>
cd kiobridge-simulation-kit-v5.1.4/workspace/LEEKIMIMJUNG/web-app
npm install
npm run build
```

`dist/` 폴더가 배포용 결과물입니다. 아무 정적 파일 서버로 서빙하면 됩니다. 예:

```bash
# 가장 간단한 방법 (Node 있으면 별도 설치 없이)
npx serve dist -l 1001

# 또는 Python이 있으면
cd dist && python3 -m http.server 1001
```

## 외부(심사위원)에게 공개하기

같은 와이파이가 아니면 라즈베리파이의 사설 IP로는 접속이 안 됩니다. 아래 중 하나를 쓰세요.

- **공유기 포트포워딩**: 라즈베리파이 IP:1001 → 공유기 외부 포트로 포워딩 (가장 직접적, 네트워크 환경에 따라 막힐 수 있음)
- **Cloudflare Tunnel**(추천, 무료, 포트포워딩 불필요):
  ```bash
  # 라즈베리파이에서
  curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64 -o cloudflared
  chmod +x cloudflared
  ./cloudflared tunnel --url http://localhost:1001
  ```
  실행하면 `https://xxxx.trycloudflare.com` 같은 임시 공개 URL이 바로 나옵니다 — 발표자료의 "배포 링크"에 이 주소를 쓰면 됩니다.

## 테스트 계정 / 시나리오

로그인이 필수가 아니므로 실제 계정은 필요 없습니다. 발표 제출란의 "테스트 계정 정보"에는
아래처럼 적으면 됩니다.

> 로그인 불필요 — 접속 후 "비회원으로 시작하기"를 누르면 바로 전체 흐름을 체험할 수 있습니다.
> (예시 시나리오: 초진 · 예약 없음 · 진료과 "정형외과" 선택 → 정형외과 접수 안내로 연결됩니다.)

## 확인 체크리스트 (배포 후)

- [ ] `http://<IP>:1001` (또는 Cloudflare Tunnel 주소) 접속 시 "은빛 병원" 첫 화면이 뜬다
- [ ] "비회원으로 시작하기" → 접근성 설정 → 예약여부 → 초진/재진 → 진료과 → 승인까지 끝까지 진행된다
- [ ] 승인 후 "안내가 끝났어요" 완료 화면이 뜨고, "처음부터 다시 시작하기"로 세션이 리셋된다
- [ ] 브라우저 개발자도구 콘솔에 `participant-submission (데모, 실제 제출 아님)` 로그가 찍힌다 (실제 데이터가 만들어지는지 확인용 — 제출용 JSON은 이 데모가 아니라 `npm run participant:validate`로 별도 생성)
