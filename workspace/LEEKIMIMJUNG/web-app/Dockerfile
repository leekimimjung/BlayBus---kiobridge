# 은빛 병원 무인 접수 안내 — 정적 빌드 후 nginx로 서빙.
# 라즈베리파이(arm64)에서도 그대로 빌드/실행됩니다 (node/nginx 공식 이미지 모두 멀티아키텍처 지원).
#
# 🚨 web-app/src/main.ts가 ../../src/frontend/*.ts(workspace/LEEKIMIMJUNG/src)를 그대로 임포트하므로,
# 빌드 컨텍스트는 web-app/ 이 아니라 그 부모 폴더(workspace/LEEKIMIMJUNG/)여야 합니다.
#   docker build -f web-app/Dockerfile -t leekimimjung-web .   (workspace/LEEKIMIMJUNG/ 에서 실행)
# docker-compose.yml 이 이 컨텍스트를 이미 맞춰 놨습니다 — 보통은 그냥 docker compose up 만 하면 됩니다.

FROM node:20-alpine AS build
WORKDIR /workspace
COPY web-app/package.json web-app/package.json
RUN npm install --prefix web-app
COPY src src
COPY web-app web-app
RUN npm run build --prefix web-app

FROM nginx:alpine AS serve
COPY --from=build /workspace/web-app/dist /usr/share/nginx/html
EXPOSE 80
