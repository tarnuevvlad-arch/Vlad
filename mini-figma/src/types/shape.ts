/**
 * Единый язык проекта: все файлы говорят об этих сущностях одинаково.
 * TypeScript ловит ошибки по этим типам ещё до запуска.
 */

/** Точка: координаты канваса (мировые) или экрана — зависит от контекста. */
export interface Point {
  x: number
  y: number
}

/** Позиция и размер прямоугольной области. */
export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/** Доступные виды фигур. */
export type ShapeKind = 'rectangle' | 'ellipse'

/** Фигура на холсте: прямоугольник или эллипс. */
export interface Shape extends Rect {
  id: string
  kind: ShapeKind
  /** Заливка в CSS-формате (например, '#38bdf8'). */
  fill: string
}

/** Инструменты левой панели. */
export type Tool = 'select' | 'rectangle' | 'ellipse'

/** Камера холста: сдвиг сцены на экране (px) и масштаб (1 = 100%). */
export interface Viewport {
  x: number
  y: number
  zoom: number
}
