import { useState, useEffect } from 'react'
import { Player, GameAction, ActionType, CharacterClass, CHARACTER_NAMES } from '../types/game'
import { isWerewolf } from '../utils/gameUtils'

interface NightPhaseProps {
  players: Player[]
  nightNumber: number
  onNightComplete: (actions: GameAction[], updatedPlayers: Player[]) => void
}

type NightStep =
  | 'werewolves'
  | 'voodoo_werewolf'
  | 'gag_werewolf'
  | 'occult'
  | 'player_actions'
  | 'witch'
  | 'complete'

export default function NightPhase({ players, nightNumber, onNightComplete }: NightPhaseProps) {
  const [currentStep, setCurrentStep] = useState<NightStep>('werewolves')
  const [actions, setActions] = useState<GameAction[]>([])
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [selectedTarget, setSelectedTarget] = useState<string>('')
  const [selectedTargets, setSelectedTargets] = useState<string[]>([])

  const alivePlayers = players.filter(p => p.isAlive)
  const werewolves = alivePlayers.filter(p => isWerewolf(p.character))
  const voodooWerewolf = alivePlayers.find(p => p.character === CharacterClass.LOBISOMEM_VOODOO)
  const gagWerewolf = alivePlayers.find(p => p.character === CharacterClass.LOBISOMEM_MORDACA)
  const occult = alivePlayers.find(p => p.character === CharacterClass.OCCULT)
  const witch = alivePlayers.find(p => p.character === CharacterClass.BRUXA)

  // Jogadores que fazem ações durante a fase de ações individuais
  const actionPlayers = alivePlayers.filter(player => {
    const actionCharacters = [
      CharacterClass.VIDENTE,
      CharacterClass.GUARDIAO,
      CharacterClass.VAMPIRO,
      CharacterClass.ZUMBI,
      CharacterClass.MEDIUM,
      CharacterClass.HEMOMANTE,
      CharacterClass.HEROI
    ]
    return actionCharacters.includes(player.character) ||
           (player.character === CharacterClass.OCCULT && player.originalCharacter &&
            actionCharacters.includes(player.originalCharacter))
  })

  const addAction = (playerId: string, type: ActionType, targetId?: string, data?: any) => {
    const newAction: GameAction = {
      id: `action_${Date.now()}_${Math.random()}`,
      playerId,
      type,
      targetId,
      data,
      phase: 'night' as any,
      night: nightNumber
    }
    setActions(prev => [...prev, newAction])
  }

  const handleWerewolfAction = () => {
    if (!selectedTarget) return

    // Todos os lobisomens participam da ação
    werewolves.forEach(werewolf => {
      addAction(werewolf.id, ActionType.KILL, selectedTarget)
    })

    setSelectedTarget('')

    // Próximo passo baseado nos lobisomens especiais disponíveis
    if (voodooWerewolf) {
      setCurrentStep('voodoo_werewolf')
    } else if (gagWerewolf) {
      setCurrentStep('gag_werewolf')
    } else if (occult) {
      setCurrentStep('occult')
    } else if (actionPlayers.length > 0) {
      setCurrentStep('player_actions')
    } else if (witch) {
      setCurrentStep('witch')
    } else {
      setCurrentStep('complete')
    }
  }

  const handleVoodooAction = (useAbility: boolean, guessedClass?: CharacterClass) => {
    if (useAbility && selectedTarget && guessedClass) {
      addAction(voodooWerewolf!.id, ActionType.KILL, selectedTarget, { guessedClass })
    }

    setSelectedTarget('')

    if (gagWerewolf) {
      setCurrentStep('gag_werewolf')
    } else if (occult) {
      setCurrentStep('occult')
    } else if (actionPlayers.length > 0) {
      setCurrentStep('player_actions')
    } else if (witch) {
      setCurrentStep('witch')
    } else {
      setCurrentStep('complete')
    }
  }

  const handleGagAction = (useAbility: boolean) => {
    if (useAbility && selectedTarget) {
      addAction(gagWerewolf!.id, ActionType.SILENCE, selectedTarget)
    }

    setSelectedTarget('')

    if (occult) {
      setCurrentStep('occult')
    } else if (actionPlayers.length > 0) {
      setCurrentStep('player_actions')
    } else if (witch) {
      setCurrentStep('witch')
    } else {
      setCurrentStep('complete')
    }
  }

  const handlePlayerAction = (actionType: ActionType) => {
    const currentPlayer = actionPlayers[currentPlayerIndex]

    if (selectedTarget) {
      addAction(currentPlayer.id, actionType, selectedTarget)
    }

    setSelectedTarget('')

    if (currentPlayerIndex < actionPlayers.length - 1) {
      setCurrentPlayerIndex(prev => prev + 1)
    } else if (witch) {
      setCurrentStep('witch')
    } else {
      setCurrentStep('complete')
    }
  }

  const handleWitchAction = (action: 'heal' | 'poison' | 'skip', targetId?: string) => {
    if (action === 'heal' || action === 'poison') {
      const actionType = action === 'heal' ? ActionType.HEAL : ActionType.POISON
      addAction(witch!.id, actionType, targetId)
    }

    setCurrentStep('complete')
  }

  const handleComplete = () => {
    onNightComplete(actions, players)
  }

  const getPlayerActionType = (player: Player): ActionType => {
    const character = player.originalCharacter || player.character

    switch (character) {
      case CharacterClass.VIDENTE: return ActionType.INVESTIGATE
      case CharacterClass.GUARDIAO: return ActionType.PROTECT
      case CharacterClass.VAMPIRO: return ActionType.KILL
      case CharacterClass.ZUMBI: return ActionType.INFECT
      case CharacterClass.MEDIUM: return ActionType.INVESTIGATE
      case CharacterClass.HEMOMANTE: return ActionType.BLOOD_BOND
      case CharacterClass.HEROI: return ActionType.KILL
      default: return ActionType.INVESTIGATE
    }
  }

  const getActionDescription = (player: Player): string => {
    const character = player.originalCharacter || player.character

    switch (character) {
      case CharacterClass.VIDENTE: return 'ver a índole de um jogador'
      case CharacterClass.GUARDIAO: return 'proteger um jogador'
      case CharacterClass.VAMPIRO: return 'matar um jogador'
      case CharacterClass.ZUMBI: return 'infectar um jogador'
      case CharacterClass.MEDIUM: return 'ver a classe de um jogador morto'
      case CharacterClass.HEMOMANTE: return 'fazer ligação de sangue'
      case CharacterClass.HEROI: return 'matar um jogador (cuidado!)'
      default: return 'fazer uma ação'
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card">
        <h2 className="text-2xl font-bold mb-6 text-center">
          🌙 Noite {nightNumber}
        </h2>

        {currentStep === 'werewolves' && werewolves.length > 0 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">🐺 Lobisomens</h3>
              <p className="text-dark-300 mb-4">
                Escolham quem será devorado esta noite.
              </p>
              <div className="text-sm text-dark-400">
                Lobisomens: {werewolves.map(w => w.name).join(', ')}
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {alivePlayers
                .filter(p => !isWerewolf(p.character))
                .map(player => (
                  <button
                    key={player.id}
                    onClick={() => setSelectedTarget(player.id)}
                    className={`p-4 rounded-lg border transition-all ${
                      selectedTarget === player.id
                        ? 'bg-red-600 border-red-500'
                        : 'bg-dark-700 border-dark-600 hover:bg-dark-600'
                    }`}
                  >
                    <div className="font-medium">{player.name}</div>
                    <div className="text-sm text-dark-300 mt-1">Devorar</div>
                  </button>
                ))}
            </div>

            <div className="text-center">
              <button
                onClick={handleWerewolfAction}
                disabled={!selectedTarget}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✅ Confirmar Escolha
              </button>
            </div>
          </div>
        )}

        {currentStep === 'voodoo_werewolf' && voodooWerewolf && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">
                🐺 {voodooWerewolf.name} - Lobisomem Voodoo
              </h3>
              <p className="text-dark-300 mb-4">
                Deseja usar sua habilidade especial para matar alguém?
                Se errar a classe, você morre!
              </p>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => handleVoodooAction(false)}
                className="btn-secondary"
              >
                ❌ Não Usar Habilidade
              </button>
              <button
                onClick={() => {
                  // Aqui implementaríamos uma interface para escolher alvo e classe
                  // Por simplicidade, vamos pular por enquanto
                  handleVoodooAction(false)
                }}
                className="btn-primary"
              >
                ⚡ Usar Habilidade Voodoo
              </button>
            </div>
          </div>
        )}

        {currentStep === 'player_actions' && actionPlayers.length > 0 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">
                {CHARACTER_NAMES[actionPlayers[currentPlayerIndex].character]} - {actionPlayers[currentPlayerIndex].name}
              </h3>
              <p className="text-dark-300 mb-4">
                Escolha um jogador para {getActionDescription(actionPlayers[currentPlayerIndex])}
              </p>
              <div className="text-sm text-primary-400">
                Jogador {currentPlayerIndex + 1} de {actionPlayers.length}
              </div>
            </div>

            {actionPlayers[currentPlayerIndex].isSilenced && (
              <div className="bg-yellow-600 text-yellow-100 p-4 rounded-lg text-center">
                🤐 Você foi silenciado e não pode falar no próximo dia!
              </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {alivePlayers
                .filter(p => p.id !== actionPlayers[currentPlayerIndex].id)
                .map(player => (
                  <button
                    key={player.id}
                    onClick={() => setSelectedTarget(player.id)}
                    className={`p-4 rounded-lg border transition-all ${
                      selectedTarget === player.id
                        ? 'bg-primary-600 border-primary-500'
                        : 'bg-dark-700 border-dark-600 hover:bg-dark-600'
                    }`}
                  >
                    <div className="font-medium">{player.name}</div>
                    <div className="text-sm text-dark-300 mt-1">
                      {player.isAlive ? 'Selecionar' : '💀 Morto'}
                    </div>
                  </button>
                ))}
            </div>

            <div className="text-center space-x-4">
              <button
                onClick={() => handlePlayerAction(getPlayerActionType(actionPlayers[currentPlayerIndex]))}
                disabled={!selectedTarget}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✅ Confirmar Ação
              </button>
              <button
                onClick={() => handlePlayerAction(getPlayerActionType(actionPlayers[currentPlayerIndex]))}
                className="btn-secondary"
              >
                ⏭️ Pular Ação
              </button>
            </div>
          </div>
        )}

        {currentStep === 'witch' && witch && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">
                🧙‍♀️ {witch.name} - Bruxa
              </h3>
              <p className="text-dark-300 mb-4">
                Você pode usar suas poções esta noite?
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <button
                onClick={() => handleWitchAction('skip')}
                className="btn-secondary"
              >
                ⏭️ Não Usar Poções
              </button>
              <button
                onClick={() => handleWitchAction('heal')}
                className="btn-primary bg-green-600 hover:bg-green-700"
              >
                💚 Usar Poção de Cura
              </button>
              <button
                onClick={() => handleWitchAction('poison')}
                className="btn-primary bg-red-600 hover:bg-red-700"
              >
                💀 Usar Poção Venenosa
              </button>
            </div>
          </div>
        )}

        {currentStep === 'complete' && (
          <div className="text-center space-y-6">
            <div className="text-blue-400 text-6xl">🌅</div>
            <h3 className="text-xl font-semibold">A Noite Chegou ao Fim</h3>
            <p className="text-dark-300">
              Todas as ações noturnas foram registradas.
              Prepare-se para o amanhecer...
            </p>
            <button
              onClick={handleComplete}
              className="btn-primary"
            >
              ☀️ Amanhecer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
