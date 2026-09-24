import type { ShapeKind, Tool } from '../types/shape'

/**
 * Инструменты и их клавиши. Захотим поменять клавиши или добавить
 * инструмент — правим только этот файл.
 */

/** Описание инструмента левой панели. */
export interface ToolDef {
  id: Tool
  label: string
  /** Горячая клавиша (буква в нижнем регистре). */
  key: string
}

/** Порядок в массиве = порядок кнопок в тулбаре. */
export const TOOLS: ToolDef[] = [
  { id: 'select', label: 'Выбор', key: 'v' },
  { id: 'rectangle', label: 'Прямоугольник', key: 'r' },
  { id: 'ellipse', label: 'Эллипс', key: 'o' },
]

/**
 * Поиск инструмента по физическому коду клавиши (KeyboardEvent.code):
 * работает одинаково на любой раскладке — 'r' -> 'KeyR' -> rectangle.
 */
export const TOOL_BY_CODE: Record<string, Tool> = Object.fromEntries(
  TOOLS.map((tool) => [`Key${tool.key.toUpperCase()}`, tool.id]),
)

/** Код клавиши истории: Ctrl+Z — undo, Ctrl+Shift+Z — redo. */
export const HISTORY_CODE = 'KeyZ'

/** Какой тип фигуры рисует инструмент (у «выбора» — никакого). */
export const TOOL_SHAPE_KIND: Partial<Record<Tool, ShapeKind>> = {
  rectangle: 'rectangle',
  ellipse: 'ellipse',
}

/** Человекочитаемые названия типов фигур (панели свойств и слоёв). */
export const SHAPE_KIND_LABELS: Record<ShapeKind, string> = {
  rectangle: 'Прямоугольник',
  ellipse: 'Эллипс',
}
