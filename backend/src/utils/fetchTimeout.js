/**
 * 타임아웃 있는 fetch. 외부 API(Gemini/DeepL 등)가 응답을 안 주면 무한 대기로 요청이
 * "안 넘어가는" 것을 막는다. 시간 초과 시 AbortError 를 던져 각 client 의 catch 로 매핑된다.
 *
 * @param {string|URL} url
 * @param {RequestInit} [options]
 * @param {number} [timeoutMs=10000]
 * @returns {Promise<Response>}
 */
export async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
