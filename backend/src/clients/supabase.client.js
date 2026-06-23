import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env.js';

/**
 * Supabase 커넥션만 제공. service_role 키 사용(서버 전용, RLS 우회) — 클라이언트 노출 금지.
 * repository 계층에서만 import 해서 쓴다. 키 없으면 호출 시점에 에러(키 필요).
 */
let client = null;

export function getSupabase() {
  if (!config.supabase.url || !config.supabase.serviceRoleKey) {
    throw new Error(
      'Supabase 설정 누락: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 필요 (.env 확인)',
    );
  }
  if (!client) {
    client = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
