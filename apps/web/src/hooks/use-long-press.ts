import { useCallback, useRef } from 'react'

interface UseLongPressOptions {
  onLongPress: (e: React.TouchEvent) => void
  delay?: number
}

/**
 * Returns touch event handlers that fire onLongPress after `delay` ms (default 600ms).
 * Move > 10px cancels the press.
 */
export function useLongPress({ onLongPress, delay = 600 }: UseLongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startRef = useRef<{ x: number; y: number } | null>(null)
  const eventRef = useRef<React.TouchEvent | null>(null)

  const start = useCallback(
    (e: React.TouchEvent) => {
      startRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      eventRef.current = e
      timerRef.current = setTimeout(() => {
        if (eventRef.current) onLongPress(eventRef.current)
      }, delay)
    },
    [onLongPress, delay],
  )

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    startRef.current = null
    eventRef.current = null
  }, [])

  const move = useCallback((e: React.TouchEvent) => {
    if (!startRef.current) return
    const dx = e.touches[0].clientX - startRef.current.x
    const dy = e.touches[0].clientY - startRef.current.y
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) cancel()
    else eventRef.current = e
  }, [cancel])

  return {
    onTouchStart: start,
    onTouchEnd: cancel,
    onTouchMove: move,
    onTouchCancel: cancel,
  }
}
