import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_SHAPE_FILL, MIN_DRAW_SIZE } from '../constants/shapes'
import { normalizeRect } from '../utils/geometry'
import type { Point, Shape, ShapeKind } from '../types/shape'

/** Изменяемые поля фигуры (id не трогаем). */
export type ShapePatch = Partial<Omit<Shape, 'id'>>

/** Сколько шагов истории храним. */
const HISTORY_LIMIT = 100

interface HistoryState {
  /** Прошлые срезы списка фигур (для undo). */
  past: Shape[][]
  /** Текущее состояние сцены. */
  present: Shape[]
  /** Отменённые срезы (для redo). */
  future: Shape[][]
}

/** Сессия перетаскивания фигуры. */
interface MoveSession {
  id: string
  /** Точка захвата в координатах канваса. */
  grab: Point
  /** Позиция фигуры на момент захвата. */
  original: { x: number; y: number }
  /** Срез сцены на момент захвата — уйдёт в past одним шагом истории. */
  snapshot: Shape[]
}

interface UseShapesResult {
  shapes: Shape[]
  selectedId: string | null
  /** Черновик — фигура, которая прямо сейчас растягивается мышью. */
  draft: Shape | null
  /** id фигуры, которую перетаскивают прямо сейчас. */
  movingId: string | null
  addShape: (shape: Shape) => void
  updateShape: (id: string, patch: ShapePatch) => void
  select: (id: string | null) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  /** Начать растягивание фигуры из точки канваса. */
  startDraft: (kind: ShapeKind, at: Point) => void
  /** Продолжить растягивание до точки канваса (углы нормализуются). */
  dragDraft: (to: Point) => void
  /** Зафиксировать черновик: слишком мелкая фигура отбрасывается. */
  commitDraft: () => void
  /** Захватить фигуру для перетаскивания (точка — в координатах канваса). */
  moveBegin: (id: string, at: Point) => void
  /** Сдвинуть перетаскиваемую фигуру к точке канваса. */
  moveDrag: (to: Point) => void
  /** Завершить перетаскивание: весь драг — один шаг истории. */
  moveEnd: () => void
}

/**
 * Состояние фигур: создание перетаскиванием, перемещение, список, изменение,
 * выделение, история (undo/redo). Все координаты — канвасные (мировые):
 * экран -> канвас переводит Canvas через utils/geometry.ts с учётом зума
 * и панорамирования.
 */
export function useShapes(): UseShapesResult {
  const [history, setHistory] = useState<HistoryState>({ past: [], present: [], future: [] })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Shape | null>(null)
  const [movingId, setMovingId] = useState<string | null>(null)

  const shapes = history.present

  // Зеркала для обработчиков мыши: читаем актуальное значение без пересоздания подписок.
  const historyRef = useRef(history)
  historyRef.current = history
  const draftRef = useRef<Shape | null>(null)
  const draftStartRef = useRef<Point | null>(null)
  const moveRef = useRef<MoveSession | null>(null)

  /** Коммит изменения: текущий срез уходит в past, будущее сбрасывается. */
  const commit = useCallback((updater: (prev: Shape[]) => Shape[]) => {
    setHistory((h) => ({
      past: [...h.past, h.present].slice(-HISTORY_LIMIT),
      present: updater(h.present),
      future: [],
    }))
  }, [])

  const addShape = useCallback(
    (shape: Shape) => {
      commit((prev) => [...prev, shape])
      setSelectedId(shape.id)
    },
    [commit],
  )

  const updateShape = useCallback(
    (id: string, patch: ShapePatch) => {
      commit((prev) => prev.map((shape) => (shape.id === id ? { ...shape, ...patch } : shape)))
    },
    [commit],
  )

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.past.length === 0) return h
      const previous = h.past[h.past.length - 1]
      return {
        past: h.past.slice(0, -1),
        present: previous,
        future: [h.present, ...h.future],
      }
    })
  }, [])

  const redo = useCallback(() => {
    setHistory((h) => {
      if (h.future.length === 0) return h
      const [next, ...rest] = h.future
      return {
        past: [...h.past, h.present],
        present: next,
        future: rest,
      }
    })
  }, [])

  // --- Создание перетаскиванием (черновик) ---

  const startDraft = useCallback((kind: ShapeKind, at: Point) => {
    const next: Shape = {
      id: crypto.randomUUID(),
      kind,
      x: at.x,
      y: at.y,
      width: 0,
      height: 0,
      fill: DEFAULT_SHAPE_FILL,
    }
    draftRef.current = next
    draftStartRef.current = at
    setDraft(next)
  }, [])

  const dragDraft = useCallback((to: Point) => {
    const start = draftStartRef.current
    const base = draftRef.current
    if (!start || !base) return
    const next: Shape = {
      ...base,
      ...normalizeRect(start.x, start.y, to.x - start.x, to.y - start.y),
    }
    draftRef.current = next
    setDraft(next)
  }, [])

  const commitDraft = useCallback(() => {
    const current = draftRef.current
    draftRef.current = null
    draftStartRef.current = null
    setDraft(null)
    if (current && current.width >= MIN_DRAW_SIZE && current.height >= MIN_DRAW_SIZE) {
      addShape(current)
    }
  }, [addShape])

  // --- Перемещение фигуры мышью ---

  const moveBegin = useCallback((id: string, at: Point) => {
    const shape = historyRef.current.present.find((s) => s.id === id)
    if (!shape) return
    moveRef.current = {
      id,
      grab: at,
      original: { x: shape.x, y: shape.y },
      snapshot: historyRef.current.present,
    }
    setMovingId(id)
  }, [])

  const moveDrag = useCallback((to: Point) => {
    const session = moveRef.current
    if (!session) return
    const dx = to.x - session.grab.x
    const dy = to.y - session.grab.y
    // Двигаем без коммита в историю: весь драг станет одним шагом в moveEnd.
    setHistory((h) => ({
      ...h,
      present: h.present.map((s) =>
        s.id === session.id
          ? { ...s, x: session.original.x + dx, y: session.original.y + dy }
          : s,
      ),
    }))
  }, [])

  const moveEnd = useCallback(() => {
    const session = moveRef.current
    if (!session) return
    moveRef.current = null
    setMovingId(null)
    setHistory((h) => {
      const current = h.present.find((s) => s.id === session.id)
      const moved =
        current !== undefined &&
        (current.x !== session.original.x || current.y !== session.original.y)
      // Клик без сдвига — не засоряем историю.
      if (!moved) return h
      return {
        past: [...h.past, session.snapshot].slice(-HISTORY_LIMIT),
        present: h.present,
        future: [],
      }
    })
  }, [])

  // Сбрасываем выделение, если фигура исчезла из сцены (например, после undo).
  useEffect(() => {
    setSelectedId((id) => (id !== null && !shapes.some((shape) => shape.id === id) ? null : id))
  }, [shapes])

  const select = useCallback((id: string | null) => {
    setSelectedId(id)
  }, [])

  return {
    shapes,
    selectedId,
    draft,
    movingId,
    addShape,
    updateShape,
    select,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    startDraft,
    dragDraft,
    commitDraft,
    moveBegin,
    moveDrag,
    moveEnd,
  }
}
