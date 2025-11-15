import { useState } from 'react'
import type { Player } from '../types/game'
import { CharacterClass, CHARACTER_NAMES } from '../types/game'
import { getCharacterIcon } from '../utils/gameUtils'

interface InitialActionsProps {
  players: Player[]
  gameMode?: 'classic' | 'sapatinho'
  onActionsComplete: (updatedPlayers: Player[]) => void
  onSaveState: (options: { description: string; componentState?: any }) => void;
}

export default function InitialActions({ players, gameMode, onActionsComplete, onSaveState }: InitialActionsProps) {
  const [occultPlayer, setOccultPlayer] = useState<Player | null>(
    players.find(p => p.character === CharacterClass.OCCULT) || null
  )
  const [cupidPlayer, setCupidPlayer] = useState<Player | null>(
    players.find(p => p.character === CharacterClass.CUPIDO) || null
  )
  
  // Determinar a ação inicial baseada nos jogadores disponíveis
  const getInitialAction = (): 'occult' | 'occult_confirmation' | 'cupid' | 'complete' => {
    if (occultPlayer) return 'occult'
    if (cupidPlayer) return 'cupid'
    return 'complete'
  }
  
  const [currentAction, setCurrentAction] = useState<'occult' | 'occult_confirmation' | 'cupid' | 'complete'>(getInitialAction())
  const [selectedTarget, setSelectedTarget] = useState<string>('')
  const [selectedLovers, setSelectedLovers] = useState<string[]>([])
  const [updatedPlayers, setUpdatedPlayers] = useState<Player[]>(players)
  const [copiedClass, setCopiedClass] = useState<CharacterClass | null>(null)
  const [copiedPlayerId, setCopiedPlayerId] = useState<string | null>(null)

  const handleOccultAction = () => {
    // Salvar estado antes da ação (modo clássico)
    if (gameMode === 'classic' && onSaveState) {
      onSaveState({ description: 'Ação do Ocultista' })
    }

    const targetPlayer = players.find(p => p.id === selectedTarget)
    if (!targetPlayer) return

    const newPlayers = updatedPlayers.map(player => {
      if (player.id === occultPlayer.id) {
        return {
          ...player,
          originalCharacter: player.character,
          character: targetPlayer.character,
          team: targetPlayer.team,
          // Copy special status properties when copying certain classes
          hasProtection: targetPlayer.character === CharacterClass.TALISMA,
          isInfected: targetPlayer.character === CharacterClass.ZUMBI
        }
      }
      return player
    })

    setUpdatedPlayers(newPlayers)
    setCopiedClass(targetPlayer.character)
    setCopiedPlayerId(selectedTarget)
    setCurrentAction('occult_confirmation')
  }

  const handleOccultConfirmationContinue = () => {
    setCurrentAction(cupidPlayer ? 'cupid' : 'complete')
  }

  const handleCupidAction = () => {
    if (!cupidPlayer || selectedLovers.length !== 2) return

    // Salvar estado antes da ação (modo clássico)
    if (gameMode === 'classic' && onSaveState) {
      onSaveState({ description: 'Ação do Cupido' })
    }

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

        {currentAction === 'occult_confirmation' && occultPlayer && copiedClass && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4">
                {getCharacterIcon(CharacterClass.OCCULT)} {occultPlayer.name} - Occult
              </h3>
              <p className="text-dark-300 mb-6">
                Você copiou a classe:
              </p>
              
              <div className="bg-purple-900/30 border-2 border-purple-700 rounded-lg p-8 my-8">
                <div className="text-6xl mb-4">
                  {getCharacterIcon(copiedClass)}
                </div>
                <div className="text-4xl md:text-5xl font-bold text-purple-100">
                  {CHARACTER_NAMES[copiedClass]}
                </div>
              </div>
              
              <p className="text-dark-300 mb-6">
                Você assumirá este papel pelo resto da partida.
              </p>
              
              {gameMode === 'classic' && copiedPlayerId && (
                <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mt-6">
                  <p className="text-blue-200 text-sm md:text-base">
                    <span className="font-semibold">⚠️ Instrução para o Mestre:</span>
                    <br />
                    Toque discretamente <span className="font-bold text-blue-100">
                      {players.find(p => p.id === copiedPlayerId)?.name}
                    </span> para que ele saiba que foi copiado.
                  </p>
                </div>
              )}
            </div>

            <div className="text-center">
              <button
                onClick={handleOccultConfirmationContinue}
                className="btn-primary text-lg"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {currentAction === 'occult' && occultPlayer && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">
                {getCharacterIcon(CharacterClass.OCCULT)} {occultPlayer.name} - Occult
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
