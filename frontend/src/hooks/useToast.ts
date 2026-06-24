import { useCallback, useRef, useState } from 'react';

/**
 * 로컬 토스트 상태. message 가 null이면 표시 안 함.
 * show(msg) 호출 시 duration(ms) 후 자동으로 사라진다.
 */
export function useToast(duration = 2000) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (msg: string) => {
      if (timer.current) clearTimeout(timer.current);
      setMessage(msg);
      timer.current = setTimeout(() => setMessage(null), duration);
    },
    [duration],
  );

  return { message, show };
}
