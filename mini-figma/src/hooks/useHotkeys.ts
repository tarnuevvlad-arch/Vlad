import { useEffect } from 'react'
import { HISTORY_CODE, TOOL_BY_CODE } from '../constants/tools'
import type { Tool } from '../types/shape'

interface UseHotkeysOptions {
  /** Вызывается при выборе инструмента клавишей R / O / V. */
  onToolSelect: (tool: Tool) => void
  /** Ctrl+Z — отменить последнее действие. */
  onUndo: () => void
  /** Ctrl+Shift+Z — вернуть отменённое действие. */
  onRedo: () => void
  /** Пока false — хук ничего не делает. */
  enabled?: boolean
}

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
  )
}

/**
 * Горячие клавиши в духе Figma:
 * - R / O / V — инструменты (по физической клавише — работает на любой раскладке);
 * - Ctrl+Z — undo, Ctrl+Shift+Z — redo.
 */
export function useHotkeys({ onToolSelect, onUndo, onRedo, enabled = false }: UseHotkeysOptions) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Не мешаем редактированию текста в полях ввода.
      if (isTypingTarget(e.target)) return
      const withModifier = e.ctrlKey || e.metaKey

      // История: Ctrl+Z / Ctrl+Shift+Z. e.repeat не отсекаем —
      // удержание комбинации отменяет действия подряд, как в редакторах.
      if (withModifier && e.code === HISTORY_CODE) {
        e.preventDefault()
        if (e.shiftKey) onRedo()
        else onUndo()
        return
      }

      // Прочие модификаторы (Alt+..., Ctrl+...) не перехватываем.
      if (withModifier || e.altKey) return
      // Удержание буквы инструмента не должно «дребезжать».
      if (e.repeat) return

      // Инструменты: R / O / V.
      const tool = TOOL_BY_CODE[e.code]
      if (tool) {
        e.preventDefault()
        onToolSelect(tool)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, onToolSelect, onUndo, onRedo])
}
