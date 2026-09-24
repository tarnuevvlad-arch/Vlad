import { SHAPE_KIND_LABELS } from '../constants/tools'
import type { Shape } from '../types/shape'

interface LayersPanelProps {
  shapes: Shape[]
  selectedId: string | null
  onSelect: (id: string) => void
}

/** Панель слоёв справа (каркас: список фигур, клик выделяет). */
export function LayersPanel({ shapes, selectedId, onSelect }: LayersPanelProps) {
  return (
    <section className="flex min-h-0 flex-1 flex-col p-3">
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
        Слои
      </h2>
      {shapes.length === 0 ? (
        <p className="mt-3 text-xs leading-5 text-neutral-500">
          Пока пусто. Нарисуйте фигуру инструментами R или O.
        </p>
      ) : (
        <ul className="mt-2 min-h-0 flex-1 space-y-0.5 overflow-y-auto">
          {shapes.map((shape, index) => (
            <li key={shape.id}>
              <button
                type="button"
                onClick={() => onSelect(shape.id)}
                className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs transition-colors ${
                  shape.id === selectedId
                    ? 'bg-sky-600 text-white'
                    : 'text-neutral-300 hover:bg-neutral-700/60'
                }`}
              >
                <span>
                  {SHAPE_KIND_LABELS[shape.kind]} {index + 1}
                </span>
                <span
                  className="h-3 w-3 rounded-sm border border-black/20"
                  style={{ backgroundColor: shape.fill }}
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
