import { PRESET_COLORS } from '../constants/shapes'
import { SHAPE_KIND_LABELS } from '../constants/tools'
import type { Shape } from '../types/shape'

interface PropertiesPanelProps {
  selectedShape: Shape | null
  /** Смена заливки выбранной фигуры. */
  onChangeFill: (fill: string) => void
}

/** Панель свойств справа: позиция, размер и цвет выделенной фигуры. */
export function PropertiesPanel({ selectedShape, onChangeFill }: PropertiesPanelProps) {
  return (
    <section className="shrink-0 border-b border-neutral-800 p-3">
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
        Свойства
      </h2>
      {selectedShape === null ? (
        <p className="mt-3 text-xs leading-5 text-neutral-500">
          Выделите фигуру — здесь появятся её размеры, позиция и цвет.
        </p>
      ) : (
        <>
          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-neutral-300">
            <dt className="text-neutral-500">Тип</dt>
            <dd>{SHAPE_KIND_LABELS[selectedShape.kind]}</dd>
            <dt className="text-neutral-500">X / Y</dt>
            <dd>
              {Math.round(selectedShape.x)} / {Math.round(selectedShape.y)}
            </dd>
            <dt className="text-neutral-500">Ш × В</dt>
            <dd>
              {Math.round(selectedShape.width)} × {Math.round(selectedShape.height)}
            </dd>
          </dl>

          <div className="mt-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Заливка
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {PRESET_COLORS.map((color) => {
                const active = selectedShape.fill.toLowerCase() === color.toLowerCase()
                return (
                  <button
                    key={color}
                    type="button"
                    title={color}
                    aria-label={`Заливка ${color}`}
                    onClick={() => onChangeFill(color)}
                    className={`h-6 w-6 rounded border transition-transform ${
                      active
                        ? 'scale-110 border-white/60 ring-2 ring-sky-400'
                        : 'border-black/30 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                )
              })}
              {/* Произвольный цвет — нативный color picker под цветным свотчем. */}
              <label
                title="Свой цвет"
                className="relative h-6 w-6 cursor-pointer rounded border border-black/30"
                style={{
                  background:
                    'conic-gradient(#ef4444, #f59e0b, #84cc16, #06b6d4, #6366f1, #d946ef, #ef4444)',
                }}
              >
                <input
                  type="color"
                  value={selectedShape.fill}
                  onChange={(e) => onChangeFill(e.target.value)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </label>
            </div>
            <p className="mt-2 font-mono text-[11px] text-neutral-500">{selectedShape.fill}</p>
          </div>
        </>
      )}
    </section>
  )
}
