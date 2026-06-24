import { baseURL } from './config';
import { ApiError, messageForCode } from './errors';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  body?: unknown;
  token?: string;
}

/**
 * 백엔드 공통 envelope를 다루는 단일 HTTP 진입점.
 * - 성공(json.success === true): json.data 를 T로 반환
 * - 실패: ApiError(code, 한국어메시지, nextAction) throw
 * - 네트워크 예외(fetch reject): ApiError('NETWORK_ERROR') 로 변환해 throw
 */
export async function request<T>(method: Method, path: string, opts?: RequestOptions): Promise<T> {
  const { body, token } = opts ?? {};

  let response: Response;
  try {
    response = await fetch(`${baseURL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body != null ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('NETWORK_ERROR', '네트워크를 확인해주세요.');
  }

  const json = await response.json();

  if (json?.success === true) {
    return json.data as T;
  }

  throw new ApiError(
    json?.error?.code ?? 'UNKNOWN',
    messageForCode(json?.error?.code, json?.error?.message),
    json?.error?.nextAction,
  );
}

export function get<T>(path: string, opts?: Omit<RequestOptions, 'body'>): Promise<T> {
  return request<T>('GET', path, opts);
}

export function post<T>(path: string, opts?: RequestOptions): Promise<T> {
  return request<T>('POST', path, opts);
}
