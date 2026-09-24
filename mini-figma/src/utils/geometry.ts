import type { Point, Rect, Viewport } from '../types/shape'

/**
 * Чистая математика камеры и координат — без React и DOM.
 * Без этого пересчёта фигуры «уезжают» относительно курсора при зуме и сдвиге.
 */

/** Границы зума: 10%..400%. */
export const MIN_ZOOM = 0.1
export const MAX_ZOOM = 4

/** Экранные координаты -> координаты канваса, с учётом зума и панорамирования. */
export function screenToCanvas(screen: Point, viewport: Viewport): Point {
  return {
    x: (screen.x - viewport.x) / viewport.zoom,
    y: (screen.y - viewport.y) / viewport.zoom,
  }
}

/** Координаты канваса -> экранные (обратное преобразование). */
export function canvasToScreen(canvas: Point, viewport: Viewport): Point {
  return {
    x: canvas.x * viewport.zoom + viewport.x,
    y: canvas.y * viewport.zoom + viewport.y,
  }
}

/**
 * Зум вокруг точки экрана: точка канваса под курсором остаётся на месте,
 * камера сдвигается так, чтобы компенсировать изменение масштаба.
 */
export function zoomAt(viewport: Viewport, screenPoint: Point, factor: number): Viewport {
  const zoom = clamp(viewport.zoom * factor, MIN_ZOOM, MAX_ZOOM)
  const canvasPoint = screenToCanvas(screenPoint, viewport)
  return {
    zoom,
    x: screenPoint.x - canvasPoint.x * zoom,
    y: screenPoint.y - canvasPoint.y * zoom,
  }
}

/** Ограничение значения диапазоном [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Приводит прямоугольник, растянутый «в минус», к положительным размерам. */
export function normalizeRect(x: number, y: number, width: number, height: number): Rect {
  return {
    x: width < 0 ? x + width : x,
    y: height < 0 ? y + height : y,
    width: Math.abs(width),
    height: Math.abs(height),
  }
}
