import { defineConfig } from "vite";

// 정적 파일만 나오는 순수 프론트엔드 빌드. base:"./" 로 상대경로를 써서
// 라즈베리파이의 어떤 서브경로에 올려도(예: /kiobridge/) 그대로 동작합니다.
export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
  },
});
