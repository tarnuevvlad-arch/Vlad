import {
  useCallback,
  useEffect,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
} from 'react'
import { TOOL_SHAPE_KIND } from '../constants/tools'
import { screenToCanvas } from '../utils/geometry'
import type { Point, Shape, ShapeKind, Tool, Viewport } from '../types/shape'
import { Shape as ShapeView } from './Shape'

/** Размер ячейки сетки в мировых координатах, px. */
const GRID_SIZE = 24

interface CanvasProps {
  /** Реф на корневой элемент холста — им управляет useViewport (wheel, центрирование). */
  containerRef: RefObject<HTMLDivElement | null>
  viewport: Viewport
  isSpacePressed: boolean
  isPanning: boolean
  startPan: (screen: Point) => void
  tool: Tool
  shapes: Shape[]
  /** Черновик растягиваемой фигуры (рендерится вместе с фигурами). */
  draft: Shape | null
  selectedId: string | null
  /** id фигуры, которую перетаскивают прямо сейчас. */
  movingId: string | null
  onSelect: (id: string | null) => void
  /** Начать растягивание: точка — уже в координатах канваса. */
  onDraftStart: (kind: ShapeKind, at: Point) => void
  /** Продолжить растягивание до точки канваса. */
  onDraftDrag: (to: Point) => void
  /** Зафиксировать черновик (логика — в useShapes). */
  onDraftCommit: () => void
  /** Захватить фигуру: точка — уже в координатах канваса. */
  onMoveBegin: (id: string, at: Point) => void
  /** Сдвинуть фигуру до точки канваса. */
  onMoveDrag: (to: Point) => void
  /** Завершить перетаскивание. */
  onMoveEnd: () => void
}

/**
 * Холст на весь экран: сетка, панорамирование, зум, рисование и перемещение мышью.
 * Камера применяется один раз к контейнеру фигур — все фигуры
 * масштабируются и сдвигаются вместе с канвасом.
 */
export function Canvas({
  containerRef,
  viewport,
  isSpacePressed,
  isPanning,
  startPan,
  tool,
  shapes,
  draft,
  selectedId,
  movingId,
  onSelect,
  onDraftStart,
  onDraftDrag,
  onDraftCommit,
  onMoveBegin,
  onMoveDrag,
  onMoveEnd,
}: CanvasProps) {
  /** Экранные координаты события относительно холста. */
  const toScreen = useCallback(
    (clientX: number, clientY: number): Point => {
      const rect = containerRef.current?.getBoundingClientRect()
      return rect ? { x: clientX - rect.left, y: clientY - rect.top } : { x: 0, y: 0 }
    },
    [containerRef],
  )

  /** Client-координаты события -> координаты канваса. */
  const toCanvas = useCallback(
    (clientX: number, clientY: number): Point =>
      screenToCanvas(toScreen(clientX, clientY), viewport),
    [toScreen, viewport],
  )

  const handleMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    const screen = toScreen(e.clientX, e.clientY)

    // Пробел зажат — панорамируем, а не выделяем/рисуем.
    if (isSpacePressed) {
      startPan(screen)
      return
    }

    if (tool === 'select') {
      onSelect(null)
      return
    }

    const kind = TOOL_SHAPE_KIND[tool]
    if (!kind) return
    // Экран -> канвас: без учёта зума и панорамирования фигуры «уезжают» от курсора.
    onDraftStart(kind, toCanvas(e.clientX, e.clientY))
  }

  // Тянем черновик, пока зажата мышь.
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (draft === null) return
      onDraftDrag(toCanvas(e.clientX, e.clientY))
    }
    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [draft, viewport, toCanvas, onDraftDrag])

  // Отпустили мышь — фиксируем (логика в useShapes: мелкое отбрасывается).
  useEffect(() => {
    const handleUp = () => onDraftCommit()
    window.addEventListener('mouseup', handleUp)
    return () => window.removeEventListener('mouseup', handleUp)
  }, [onDraftCommit])

  // Перетаскиваем выделенную фигуру.
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (movingId === null) return
      onMoveDrag(toCanvas(e.clientX, e.clientY))
    }
    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [movingId, viewport, toCanvas, onMoveDrag])

  // Завершаем перетаскивание по отпусканию мыши и по потере фокуса окна.
  useEffect(() => {
    const handleUp = () => onMoveEnd()
    const handleBlur = () => onMoveEnd()
    window.addEventListener('mouseup', handleUp)
    window.addEventListener('blur', handleBlur)
    return () => {
      window.removeEventListener('mouseup', handleUp)
      window.removeEventListener('blur', handleBlur)
    }
  }, [onMoveEnd])

  const beginMove = useCallback(
    (id: string, client: Point) => onMoveBegin(id, toCanvas(client.x, client.y)),
    [onMoveBegin, toCanvas],
  )

  const cursor = isPanning
    ? 'grabbing'
    : movingId !== null
      ? 'grabbing'
      : isSpacePressed
        ? 'grab'
        : tool === 'select'
          ? 'default'
          : 'crosshair'

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      className="absolute inset-0 overflow-hidden bg-neutral-900"
      style={{
        cursor,
        backgroundImage: 'radial-gradient(circle, rgb(82 82 82) 1px, transparent 1px)',
        backgroundSize: `${GRID_SIZE * viewport.zoom}px ${GRID_SIZE * viewport.zoom}px`,
        backgroundPosition: `${viewport.x}px ${viewport.y}px`,
      }}
    >
      {/* Мировая система координат: камера применяется один раз ко всем фигурам. */}
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})` }}
      >
        {shapes.map((shape) => (
          <ShapeView
            key={shape.id}
            shape={shape}
            selected={shape.id === selectedId}
            interactive={tool === 'select' && !isSpacePressed && !isPanning}
            moving={movingId === shape.id}
            zoom={viewport.zoom}
            onSelect={onSelect}
            onDragStart={beginMove}
          />
        ))}
        {draft !== null && (
          <ShapeView
            shape={draft}
            selected={false}
            interactive={false}
            moving={false}
            zoom={viewport.zoom}
            onSelect={() => {}}
            onDragStart={() => {}}
          />
        )}
      </div>

      {/* Текущий масштаб — как в Figma, в углу холста. */}
      <div className="pointer-events-none absolute bottom-3 left-3 rounded bg-neutral-800/80 px-2 py-1 font-mono text-xs text-neutral-300">
        {Math.round(viewport.zoom * 100)}%
      </div>
    </div>
  )
}
