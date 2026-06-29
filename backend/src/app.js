import express from 'express';
import apiRouter from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

/**
 * Express 앱 구성. listen 은 server.js 가 담당(테스트에서 app 만 import 가능하도록 분리).
 * 파이프라인: json/urlencoded → /api 라우터 → notFound → errorHandler(맨 끝).
 */
export function createApp() {
  const app = express();

  // base64 이미지(F-002/F-003 JSON 경로)를 담을 수 있게 한도 상향 (multer 파일 한도 10MB 와 정합).
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true }));

  // 헬스체크 (배포 환경 모니터링용)
  app.get('/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));

  app.use('/api', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
