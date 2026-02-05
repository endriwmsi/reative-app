/** biome-ignore-all lint/suspicious/noExplicitAny: false positive */
"use client";

import { useCallback, useEffect, useRef } from "react";

export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
): T {
  const callbackRef = useRef(callback);
  const delayRef = useRef(delay);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keep refs up to date with latest values
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    delayRef.current = delay;
  }, [delay]);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delayRef.current);
    }) as T,
    [], // No dependencies needed - refs are stable
  );
}
