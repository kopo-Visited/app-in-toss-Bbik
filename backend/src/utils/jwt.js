import jwt from 'jsonwebtoken';
import { config, requireConfig } from '../config/env.js';

/** 자체 JWT 발급 (BL-001). 토스 토큰이 아닌 우리 서버 토큰. */
export function issueToken(userId, { expiresIn = config.jwt.accessExpiresIn } = {}) {
  const secret = requireConfig('jwt.secret');
  return jwt.sign({ sub: String(userId) }, secret, { expiresIn });
}

export function issueRefreshToken(userId) {
  const secret = requireConfig('jwt.secret');
  return jwt.sign({ sub: String(userId), typ: 'refresh' }, secret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
}

/** 검증 성공 시 payload, 실패 시 null. (미설정/만료/위조 모두 null) */
export function verifyToken(token) {
  if (!config.jwt.secret || !token) return null;
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch {
    return null;
  }
}
