import { useState } from 'react'
import { Canvas } from './components/Canvas'
import { LayersPanel } from './components/LayersPanel'
import { PropertiesPanel } from './components/PropertiesPanel'
import { Toolbar } from './components/Toolbar'
import { useHotkeys } from './hooks/useHotkeys'
import { useShapes } from './hooks/useShapes'
import { useViewport } from './hooks/useViewport'
import type { Tool } from './types/shape'

export default function App() {
  const [tool, setTool] = useState<Tool>('select')
  const { viewport, containerRef, isSpacePressed, isPanning, startPan } = useViewport()
  const {
    shapes,
    selectedId,
    select,
    updateShape,
    undo,
    redo,
    draft,
    startDraft,
    dragDraft,
    commitDraft,
    movingId,
    moveBegin,
    moveDrag,
    moveEnd,
  } = useShapes()

  // Горячие клавиши: R / O / V — инструменты, Ctrl+Z / Ctrl+Shift+Z — история.
  useHotkeys({ onToolSelect: setTool, onUndo: undo, onRedo: redo, enabled: true })

  const selectedShape = shapes.find((shape) => shape.id === selectedId) ?? null

  return (
    <div className="flex h-screen w-screen select-none overflow-hidden bg-neutral-900 text-neutral-100">
      <Toolbar tool={tool} onToolChange={setTool} />

      <main className="relative min-w-0 flex-1">
        <Canvas
          containerRef={containerRef}
          viewport={viewport}
          isSpacePressed={isSpacePressed}
          isPanning={isPanning}
          startPan={startPan}
          tool={tool}
          shapes={shapes}
          draft={draft}
          selectedId={selectedId}
          movingId={movingId}
          onSelect={select}
          onDraftStart={startDraft}
          onDraftDrag={dragDraft}
          onDraftCommit={commitDraft}
          onMoveBegin={moveBegin}
          onMoveDrag={moveDrag}
          onMoveEnd={moveEnd}
        />
      </main>

      <aside className="flex w-64 shrink-0 flex-col border-l border-neutral-800 bg-neutral-800/40">
        <PropertiesPanel
          selectedShape={selectedShape}
          onChangeFill={(fill) => {
            if (selectedShape) updateShape(selectedShape.id, { fill })
          }}
        />
        <LayersPanel shapes={shapes} selectedId={selectedId} onSelect={select} />
      </aside>
    </div>
  )
}
