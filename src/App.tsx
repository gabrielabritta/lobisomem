import { useState } from 'react'
import GameSetup from './components/GameSetup'
import Game from './components/Game'
import CharacterInfo from './components/CharacterInfo'
import { GameState, GamePhase } from './types/game'

function App() {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [showCharacterInfo, setShowCharacterInfo] = useState(false)

  const handleGameStart = (newGameState: GameState) => {
    setGameState(newGameState)
  }

  const handleGameReset = () => {
    setGameState(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      <div className="container mx-auto px-4 py-4 md:py-8">
        <header className="text-center mb-6 md:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600 mb-2 md:mb-4">
            🐺 Lobisomem
          </h1>
          <p className="text-dark-300 text-sm sm:text-base md:text-lg">
            Jogo de dedução social inspirado em Town of Salem
          </p>

          {/* Botão para ver todas as classes */}
          {!gameState && (
            <div className="mt-6">
              <button
                onClick={() => setShowCharacterInfo(true)}
                className="btn-secondary text-base px-6 py-3"
              >
                📚 Ver Todas as Classes
              </button>
            </div>
          )}
        </header>

        {!gameState ? (
          <GameSetup onGameStart={handleGameStart} />
        ) : (
          <Game gameState={gameState} onGameReset={handleGameReset} />
        )}

        {/* Modal de informações das classes */}
        {showCharacterInfo && (
          <CharacterInfo onClose={() => setShowCharacterInfo(false)} />
        )}
      </div>
    </div>
  )
}

export default App
