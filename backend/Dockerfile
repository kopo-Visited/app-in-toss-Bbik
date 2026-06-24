# syntax=docker/dockerfile:1
# 삑 백엔드(Express, ESM) — Fly.io 배포용 이미지
FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

# 1) 의존성 먼저 (레이어 캐시). 런타임 의존성은 전부 dependencies 라 dev 제외 가능.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# 2) 앱 소스만 복사 (.env·키 파일은 .dockerignore 로 이중 차단, CLAUDE.md §8)
COPY src ./src

EXPOSE 3000
CMD ["node", "src/server.js"]
