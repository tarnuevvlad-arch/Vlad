import type { ReactElement } from 'react'
import { TOOLS } from '../constants/tools'
import type { Tool } from '../types/shape'

/** Иконки инструментов — инлайновые SVG, без внешних зависимостей. */
const TOOL_ICONS: Record<Tool, ReactElement> = {
  select: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d="M5.5 3.2 19 12.4l-6 .9 2.9 5.9-2.4 1.2-3-6-4.9 3.4z" />
    </svg>
  ),
  rectangle: (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <rect x="4.5" y="5.5" width="15" height="13" rx="1.5" />
    </svg>
  ),
  ellipse: (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <circle cx="12" cy="12" r="7.5" />
    </svg>
  ),
}

interface ToolbarProps {
  tool: Tool
  onToolChange: (tool: Tool) => void
}

/** Панель инструментов слева (каркас: три кнопки, активная подсвечена). */
export function Toolbar({ tool, onToolChange }: ToolbarProps) {
  return (
    <aside className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-neutral-800 bg-neutral-800/40 py-3">
      {TOOLS.map((item) => (
        <button
          key={item.id}
          type="button"
          title={`${item.label} (${item.key.toUpperCase()})`}
          aria-pressed={tool === item.id}
          onClick={() => onToolChange(item.id)}
          className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
            tool === item.id
              ? 'bg-sky-600 text-white'
              : 'text-neutral-300 hover:bg-neutral-700/70'
          }`}
        >
          {TOOL_ICONS[item.id]}
        </button>
      ))}
    </aside>
  )
}
