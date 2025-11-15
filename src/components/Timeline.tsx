import type { GameState } from '../types/game'

interface SavedState {
  gameState: GameState
  description: string
  nightPhaseState?: any
  dayPhaseState?: any
}

interface TimelineProps {
  history: SavedState[]
  currentIndex: number
  onJump: (index: number) => void
  isOpen: boolean
}

export default function Timeline({ history, currentIndex, onJump, isOpen }: TimelineProps) {
  if (!isOpen || history.length === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 card bg-dark-800 border border-dark-600 w-80 max-h-[70vh] overflow-y-auto mb-2">
      <h3 className="text-lg font-semibold mb-3 text-primary-400">Linha do Tempo</h3>
      <ul className="space-y-2">
        {history.map((item, index) => (
          <li key={index}>
            <button
              onClick={() => onJump(index)}
              className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                index === currentIndex
                  ? 'bg-primary-500/30 text-white font-semibold'
                  : 'hover:bg-dark-700'
              }`}
            >
              <span className="font-mono text-xs mr-2">{index}:</span>
              {item.description}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
