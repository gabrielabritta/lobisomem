import { useState } from 'react'
import { Player, CharacterClass, CHARACTER_NAMES } from '../types/game'

interface InitialActionsProps {
  players: Player[]
  onActionsComplete: (updatedPlayers: Player[]) => void
}

export default function InitialActions({ players, onActionsComplete }: InitialActionsProps) {
  const [occultPlayer, setOccultPlayer] = useState<Player | null>(
    players.find(p => p.character === CharacterClass.OCCULT) || null
  )
  const [cupidPlayer, setCupidPlayer] = useState<Player | null>(
    players.find(p => p.character === CharacterClass.CUPIDO) || null
  )
  
  // Determinar a ação inicial baseada nos jogadores disponíveis
  const getInitialAction = (): 'occult' | 'cupid' | 'complete' => {
    if (occultPlayer) return 'occult'
    if (cupidPlayer) return 'cupid'
    return 'complete'
  }
  
  const [currentAction, setCurrentAction] = useState<'occult' | 'cupid' | 'complete'>(getInitialAction())
  const [selectedTarget, setSelectedTarget] = useState<string>('')
  const [selectedLovers, setSelectedLovers] = useState<string[]>([])
  const [updatedPlayers, setUpdatedPlayers] = useState<Player[]>(players)

  const handleOccultAction = () => {
    if (!occultPlayer || !selectedTarget) return

    const targetPlayer = players.find(p => p.id === selectedTarget)
    if (!targetPlayer) return

    const newPlayers = updatedPlayers.map(player => {
      if (player.id === occultPlayer.id) {
        return {
          ...player,
          originalCharacter: player.character,
          character: targetPlayer.character,
          team: targetPlayer.team
        }
      }
      return player
    })

    setUpdatedPlayers(newPlayers)
    setCurrentAction(cupidPlayer ? 'cupid' : 'complete')
  }

  const handleCupidAction = () => {
    if (!cupidPlayer || selectedLovers.length !== 2) return

    const newPlayers = updatedPlayers.map(player => {
      if (selectedLovers.includes(player.id)) {
        const otherLoverId = selectedLovers.find(id => id !== player.id)
        return {
          ...player,
          isInLove: true,
          lovePartnerId: otherLoverId
        }
      }
      return player
    })

    setUpdatedPlayers(newPlayers)
    setCurrentAction('complete')
  }

  const handleComplete = () => {
    onActionsComplete(updatedPlayers)
  }

  const toggleLoverSelection = (playerId: string) => {
    setSelectedLovers(prev => {
      if (prev.includes(playerId)) {
        return prev.filter(id => id !== playerId)
      } else if (prev.length < 2) {
        return [...prev, playerId]
      }
      return prev
    })
  }

  if (!occultPlayer && !cupidPlayer) {
    // Não há ações iniciais necessárias
    handleComplete()
    return null
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card">
        <h2 className="text-2xl font-bold mb-6 text-center">Ações Iniciais</h2>

        {currentAction === 'occult' && occultPlayer && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">
                🎭 {occultPlayer.name} - Occult
              </h3>
              <p className="text-dark-300 mb-6">
                Escolha um jogador para copiar sua classe. Você assumirá o mesmo papel pelo resto da partida.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {players
                .filter(p => p.id !== occultPlayer.id)
                .map(player => (
                  <button
                    key={player.id}
                    onClick={() => setSelectedTarget(player.id)}
                    className={`px-4 py-2 rounded-lg border transition-all ${
                      selectedTarget === player.id
                        ? 'bg-primary-600 border-primary-500'
                        : 'bg-dark-700 border-dark-600 hover:bg-dark-600'
                    }`}
                  >
                    <div className="font-medium">{player.name}</div>
                  </button>
                ))}
            </div>

            <div className="text-center">
              <button
                onClick={handleOccultAction}
                disabled={!selectedTarget}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✅ Confirmar Escolha
              </button>
            </div>
          </div>
        )}

        {currentAction === 'cupid' && cupidPlayer && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">
                💘 {cupidPlayer.name} - Cupido
              </h3>
              <p className="text-dark-300 mb-6">
                Escolha dois jogadores para se apaixonarem. Se um morrer, o outro também morre.
                Você vence se os dois apaixonados sobreviverem até o final.
              </p>
              <p className="text-sm text-primary-400">
                Selecionados: {selectedLovers.length}/2
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {players
                .filter(p => p.id !== cupidPlayer?.id) // Cupido não pode se apaixonar
                .map(player => (
                  <button
                    key={player.id}
                    onClick={() => toggleLoverSelection(player.id)}
                    disabled={!selectedLovers.includes(player.id) && selectedLovers.length >= 2}
                    className={`px-4 py-2 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedLovers.includes(player.id)
                        ? 'bg-pink-600 border-pink-500'
                        : 'bg-dark-700 border-dark-600 hover:bg-dark-600'
                    }`}
                  >
                    <div className="font-medium">{player.name}</div>
                  </button>
                ))}
            </div>

            <div className="text-center">
              <button
                onClick={handleCupidAction}
                disabled={selectedLovers.length !== 2}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✅ Confirmar Apaixonados
              </button>
            </div>
          </div>
        )}

        {currentAction === 'complete' && (
          <div className="text-center space-y-6">
            <div className="text-green-400 text-6xl">✅</div>
            <h3 className="text-xl font-semibold">Ações Iniciais Concluídas</h3>
            <p className="text-dark-300">
              Todos os jogadores especiais fizeram suas escolhas iniciais.
            </p>
            <button
              onClick={handleComplete}
              className="btn-primary"
            >
              🌙 Começar Primeira Noite
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
