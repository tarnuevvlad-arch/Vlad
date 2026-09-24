import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { zoomAt } from '../utils/geometry'
import type { Point, Viewport } from '../types/shape'

/** Насколько быстро колесо меняет масштаб. */
const ZOOM_SENSITIVITY = 0.0015

interface UseViewportResult {
  /** Реф для корневого элемента холста (вешается в Canvas). */
  containerRef: RefObject<HTMLDivElement | null>
  viewport: Viewport
  /** Зажат пробел — включён режим камеры. */
  isSpacePressed: boolean
  /** Идёт панорамирование мышью. */
  isPanning: boolean
  /** Начать панорамирование из точки экрана (относительно холста). */
  startPan: (screen: Point) => void
}

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
  )
}

/**
 * Камера холста: панорамирование (пробел + мышь), зум колесом (10%..400%),
 * центрирование сцены при старте. Логика без интерфейса — компонент остаётся тонким.
 */
export function useViewport(): UseViewportResult {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 })
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  const [isPanning, setIsPanning] = useState(false)

  const viewportRef = useRef(viewport)
  viewportRef.current = viewport
  const panOriginRef = useRef<{ mouse: Point; origin: Viewport } | null>(null)

  /** Текущая позиция мыши относительно холста. */
  const relativeToContainer = (e: MouseEvent): Point | null => {
    const rect = containerRef.current?.getBoundingClientRect()
    return rect ? { x: e.clientX - rect.left, y: e.clientY - rect.top } : null
  }

  // Центрирование при старте: мировая точка (0, 0) — в центре холста.
  useEffect(() => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setViewport({ x: rect.width / 2, y: rect.height / 2, zoom: 1 })
  }, [])

  // Зум колесом. Слушатель не passive — нужен preventDefault.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const screen = { x: e.clientX - rect.left, y: e.clientY - rect.top }
      const factor = Math.exp(-e.deltaY * ZOOM_SENSITIVITY)
      setViewport((prev) => zoomAt(prev, screen, factor))
    }
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [])

  // Пробел — переключение режима камеры.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat || isTypingTarget(e.target)) return
      e.preventDefault()
      setIsSpacePressed(true)
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      setIsSpacePressed(false)
    }
    // Окно потеряло фокус — не зависаем в «зажатом» состоянии.
    const handleBlur = () => {
      setIsSpacePressed(false)
      setIsPanning(false)
      panOriginRef.current = null
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])

  const startPan = useCallback((screen: Point) => {
    panOriginRef.current = { mouse: screen, origin: viewportRef.current }
    setIsPanning(true)
  }, [])

  // Пока идёт панорамирование — двигаем камеру на дельту мыши.
  useEffect(() => {
    if (!isPanning) return
    const handleMove = (e: MouseEvent) => {
      const pan = panOriginRef.current
      const current = relativeToContainer(e)
      if (!pan || !current) return
      setViewport({
        zoom: pan.origin.zoom,
        x: pan.origin.x + (current.x - pan.mouse.x),
        y: pan.origin.y + (current.y - pan.mouse.y),
      })
    }
    const handleUp = () => {
      panOriginRef.current = null
      setIsPanning(false)
    }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [isPanning])

  return { containerRef, viewport, isSpacePressed, isPanning, startPan }
}
