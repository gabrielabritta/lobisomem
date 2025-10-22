import { useState, useEffect } from 'react'
import type { Player, GameAction, GameState, WitchPotions } from '../types/game'
import { ActionType, CharacterClass, CHARACTER_NAMES } from '../types/game'
import { isWerewolf } from '../utils/gameUtils'
import PassDeviceScreen from './PassDeviceScreen'
import MasterPassScreen from './MasterPassScreen'

interface WitchInterfaceProps {
  witch: Player
  actions: GameAction[]
  players: Player[]
  witchPotions: { healingPotion: boolean; poisonPotion: boolean }
  onWitchAction: (action: 'heal' | 'poison' | 'skip', targetId?: string) => void
}

function WitchInterface({ witch, actions, players, witchPotions, onWitchAction }: WitchInterfaceProps) {
  const [selectedAction, setSelectedAction] = useState<'heal' | 'poison' | null>(null)
  const [selectedTarget, setSelectedTarget] = useState<string>('')

  // Determinar quem morrerá esta noite baseado nas ações
  const killActions = actions.filter(a => a.type === ActionType.KILL || a.type === ActionType.POISON)
  const dyingPlayers = killActions
    .map(action => action.targetId)
    .filter(Boolean)
    .map(targetId => players.find(p => p.id === targetId))
    .filter(Boolean) as Player[]

  // A bruxa só pode ver quem vai morrer se tiver a poção de cura
  const canSeeDeaths = witchPotions.healingPotion
  // A bruxa só pode ver a opção de cura se alguém for morrer E ela tiver a poção
  const canShowHealOption = dyingPlayers.length > 0 && witchPotions.healingPotion

  const handlePotionUse = () => {
    if (selectedAction && selectedTarget) {
      onWitchAction(selectedAction, selectedTarget)
    } else if (selectedAction && !selectedTarget) {
      alert('Selecione um alvo!')
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">
          🧙‍♀️ {witch.name} - Bruxa
        </h3>
        <p className="text-dark-300 mb-4">
          Você pode usar suas poções esta noite. Escolha sabiamente!
        </p>
      </div>

      {/* Mostrar quem morrerá esta noite - apenas se a bruxa tiver poção de cura */}
      {canSeeDeaths && dyingPlayers.length > 0 && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
          <h4 className="font-semibold mb-2 text-red-300">💀 Pessoas que morrerão esta noite:</h4>
          <div className="space-y-1">
            {dyingPlayers.map(player => (
              <div key={player.id} className="text-red-200">
                • {player.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {canSeeDeaths && dyingPlayers.length === 0 && (
        <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
          <p className="text-green-300">🌸 Ninguém morrerá esta noite (ainda).</p>
        </div>
      )}

      {!canSeeDeaths && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
          <p className="text-yellow-300">🔮 Você não possui mais a poção de cura, então não pode ver quem morrerá esta noite.</p>
        </div>
      )}

      {/* Seleção de poção */}
      <div className="grid md:grid-cols-3 gap-4">
        <button
          onClick={() => onWitchAction('skip')}
          className="btn-secondary"
        >
          ⏭️ Não Usar Poções
        </button>
        
        {canShowHealOption && (
          <button
            onClick={() => setSelectedAction(selectedAction === 'heal' ? null : 'heal')}
            className={`btn-primary transition-all ${
              selectedAction === 'heal' 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            💚 Poção de Cura
          </button>
        )}
        
        <button
          onClick={() => setSelectedAction(selectedAction === 'poison' ? null : 'poison')}
          disabled={!witchPotions.poisonPotion}
          className={`btn-primary transition-all ${
            selectedAction === 'poison' 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-red-600 hover:bg-red-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          💀 Poção Venenosa {!witchPotions.poisonPotion && '(Usada)'}
        </button>
      </div>

      {/* Seleção de alvo */}
      {selectedAction && (
        <div className="space-y-4">
          <div className="text-center">
            <h4 className="font-semibold text-lg">
              {selectedAction === 'heal' ? '💚 Escolha quem curar:' : '💀 Escolha quem envenenar:'}
            </h4>
            <p className="text-sm text-dark-400 mt-1">
              {selectedAction === 'heal' 
                ? 'Selecione uma pessoa que morrerá esta noite para salvá-la'
                : 'Selecione uma pessoa para envenenar'
              }
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(selectedAction === 'heal' ? dyingPlayers : players.filter(p => p.id !== witch.id))
              .map(player => (
                <button
                  key={player.id}
                  onClick={() => setSelectedTarget(player.id)}
                  className={`p-4 rounded-lg border transition-all ${
                    selectedTarget === player.id
                      ? selectedAction === 'heal' 
                        ? 'bg-green-600 border-green-500'
                        : 'bg-red-600 border-red-500'
                      : 'bg-dark-700 border-dark-600 hover:bg-dark-600'
                  }`}
                >
                  <div className="font-medium">{player.name}</div>
                  <div className="text-sm text-dark-300 mt-1">
                    {selectedAction === 'heal' ? 'Curar' : 'Envenenar'}
                  </div>
                </button>
              ))}
          </div>

          <div className="text-center">
            <button
              onClick={handlePotionUse}
              disabled={!selectedTarget}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✅ Confirmar {selectedAction === 'heal' ? 'Cura' : 'Envenenamento'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

interface MediumInterfaceProps {
  medium: Player
  allPlayers: Player[]
  usedAbilities: { [playerId: string]: string[] }
  onMediumAction: (useAbility: boolean, targetId?: string) => void
}

function MediumInterface({ medium, allPlayers, usedAbilities, onMediumAction }: MediumInterfaceProps) {
  const [selectedTarget, setSelectedTarget] = useState<string>('')
  const [showTargetSelection, setShowTargetSelection] = useState(false)
  const [investigationResult, setInvestigationResult] = useState<string | null>(null)

  // Jogadores mortos disponíveis para investigação
  const deadPlayers = allPlayers.filter(p => !p.isAlive)
  
  // Verificar se já usou a habilidade
  const hasUsedAbility = usedAbilities[medium.id]?.includes('medium_investigation') || false

  const handleUseAbility = () => {
    if (selectedTarget) {
      const target = allPlayers.find(p => p.id === selectedTarget)
      if (target && !target.isAlive) {
        const resultText = `${target.name} era ${CHARACTER_NAMES[target.character]}`
        setInvestigationResult(resultText)
        setShowTargetSelection(false)
      }
    } else {
      alert('Selecione um jogador morto para investigar!')
    }
  }

  const handleConfirmResult = () => {
    onMediumAction(true, selectedTarget)
  }

  // Se há resultado da investigação, mostrar tela de resultado
  if (investigationResult) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">
            🔮 {medium.name} - Médium
          </h3>
          <p className="text-dark-300 mb-4">
            Resultado da sua investigação:
          </p>
        </div>

        {/* Resultado da investigação */}
        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-6">
          <div className="text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h4 className="text-xl font-bold text-blue-300 mb-2">Investigação Revelada!</h4>
            <p className="text-lg text-blue-200">
              {investigationResult}
            </p>
          </div>
        </div>

        {/* Botão para continuar */}
        <div className="text-center">
          <button
            onClick={handleConfirmResult}
            className="btn-primary bg-blue-600 hover:bg-blue-700"
          >
            ✅ Continuar
          </button>
        </div>
      </div>
    )
  }

  if (!showTargetSelection) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">
            🔮 {medium.name} - Médium
          </h3>
          <p className="text-dark-300 mb-4">
            Você pode usar sua habilidade para ver a classe de alguém que morreu.
          </p>
          <div className={`border rounded-lg p-4 mb-4 ${
            hasUsedAbility 
              ? 'bg-red-900/30 border-red-700'
              : 'bg-blue-900/30 border-blue-700'
          }`}>
            <p className={`font-semibold ${hasUsedAbility ? 'text-red-300' : 'text-blue-300'}`}>
              {hasUsedAbility ? '❌ Habilidade Já Usada' : 'ℹ️ Informação'}
            </p>
            <p className={`text-sm ${hasUsedAbility ? 'text-red-200' : 'text-blue-200'}`}>
              {hasUsedAbility 
                ? 'Você já usou sua habilidade de médium nesta partida.'
                : 'Esta habilidade pode ser usada apenas uma vez por partida. Você descobrirá a classe exata da pessoa morta.'
              }
            </p>
          </div>
        </div>

        {deadPlayers.length === 0 && (
          <div className="bg-gray-900/30 border border-gray-700 rounded-lg p-4">
            <p className="text-gray-300 text-center">
              😇 Ainda não há mortos para investigar.
            </p>
          </div>
        )}

        <div className="flex justify-center space-x-4">
          <button
            onClick={() => onMediumAction(false)}
            className="btn-secondary"
          >
            ❌ Não Usar Habilidade
          </button>
          {deadPlayers.length > 0 && !hasUsedAbility && (
            <button
              onClick={() => setShowTargetSelection(true)}
              className="btn-primary bg-blue-600 hover:bg-blue-700"
            >
              🔮 Usar Habilidade do Médium
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">
          🔮 {medium.name} - Médium
        </h3>
        <p className="text-dark-300 mb-4">
          Escolha qual morto você quer investigar:
        </p>
      </div>

      {/* Mostrar jogadores mortos */}
      <div className="bg-gray-900/30 border border-gray-700 rounded-lg p-4">
        <h4 className="font-semibold mb-2 text-gray-300">💀 Pessoas que morreram:</h4>
        <div className="space-y-1">
          {deadPlayers.map(player => (
            <div key={player.id} className="text-gray-200">
              • {player.name}
            </div>
          ))}
        </div>
      </div>

      {/* Seleção de alvo */}
      <div className="space-y-4">
        <h4 className="font-semibold text-center">🎯 Escolha quem investigar:</h4>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {deadPlayers.map(player => (
            <button
              key={player.id}
              onClick={() => setSelectedTarget(player.id)}
              className={`p-4 rounded-lg border transition-all ${
                selectedTarget === player.id
                  ? 'bg-blue-600 border-blue-500'
                  : 'bg-dark-700 border-dark-600 hover:bg-dark-600'
              }`}
            >
              <div className="font-medium">{player.name}</div>
              <div className="text-sm text-dark-300 mt-1">💀 Investigar</div>
            </button>
          ))}
        </div>
      </div>

      {/* Botões de ação */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => setShowTargetSelection(false)}
          className="btn-secondary"
        >
          ← Voltar
        </button>
        <button
          onClick={handleUseAbility}
          disabled={!selectedTarget}
          className="btn-primary bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          🔮 Investigar Morto
        </button>
      </div>
    </div>
  )
}

interface VidenteInterfaceProps {
  vidente: Player
  alivePlayers: Player[]
  onVidenteAction: (useAbility: boolean, targetId?: string) => void
}

function VidenteInterface({ vidente, alivePlayers, onVidenteAction }: VidenteInterfaceProps) {
  const [selectedTarget, setSelectedTarget] = useState<string>('')
  const [showTargetSelection, setShowTargetSelection] = useState(false)
  const [investigationResult, setInvestigationResult] = useState<string | null>(null)

  // Jogadores disponíveis para investigação (exceto o próprio vidente)
  const availableTargets = alivePlayers.filter(p => p.id !== vidente.id)

  const handleUseAbility = () => {
    if (selectedTarget) {
      const target = alivePlayers.find(p => p.id === selectedTarget)
      if (target) {
        const isGood = [
          CharacterClass.ALDEAO, CharacterClass.MEDIUM, CharacterClass.VIDENTE,
          CharacterClass.CUPIDO, CharacterClass.TALISMA, CharacterClass.BRUXA,
          CharacterClass.BALA_DE_PRATA, CharacterClass.GUARDIAO, CharacterClass.HEMOMANTE,
          CharacterClass.HEROI
        ].includes(target.character)

        const resultText = `${target.name} é ${isGood ? 'BOM' : 'MAU'}`
        setInvestigationResult(resultText)
        setShowTargetSelection(false)
      }
    } else {
      alert('Selecione um jogador para investigar!')
    }
  }

  const handleConfirmResult = () => {
    onVidenteAction(true, selectedTarget)
  }

  // Se há resultado da investigação, mostrar tela de resultado
  if (investigationResult) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">
            👁️ {vidente.name} - Vidente
          </h3>
          <p className="text-dark-300 mb-4">
            Resultado da sua investigação:
          </p>
        </div>

        {/* Resultado da investigação */}
        <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-6">
          <div className="text-center">
            <div className="text-4xl mb-4">👁️</div>
            <h4 className="text-xl font-bold text-purple-300 mb-2">Visão Revelada!</h4>
            <p className="text-lg text-purple-200">
              {investigationResult}
            </p>
          </div>
        </div>

        {/* Botão para continuar */}
        <div className="text-center">
          <button
            onClick={handleConfirmResult}
            className="btn-primary bg-purple-600 hover:bg-purple-700"
          >
            ✅ Continuar
          </button>
        </div>
      </div>
    )
  }

  if (!showTargetSelection) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">
            👁️ {vidente.name} - Vidente
          </h3>
          <p className="text-dark-300 mb-4">
            Você pode usar sua habilidade para ver a índole de um jogador.
          </p>
          <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-4 mb-4">
            <p className="text-purple-300 font-semibold">ℹ️ Informação:</p>
            <p className="text-purple-200 text-sm">
              Você descobrirá se a pessoa é do bem (BOM) ou do mal (MAU).
            </p>
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <button
            onClick={() => onVidenteAction(false)}
            className="btn-secondary"
          >
            ❌ Não Usar Habilidade
          </button>
          <button
            onClick={() => setShowTargetSelection(true)}
            className="btn-primary bg-purple-600 hover:bg-purple-700"
          >
            👁️ Usar Habilidade do Vidente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">
          👁️ {vidente.name} - Vidente
        </h3>
        <p className="text-dark-300 mb-4">
          Escolha quem você quer investigar:
        </p>
      </div>

      {/* Seleção de alvo */}
      <div className="space-y-4">
        <h4 className="font-semibold text-center">🎯 Escolha quem investigar:</h4>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {availableTargets.map(player => (
            <button
              key={player.id}
              onClick={() => setSelectedTarget(player.id)}
              className={`p-4 rounded-lg border transition-all ${
                selectedTarget === player.id
                  ? 'bg-purple-600 border-purple-500'
                  : 'bg-dark-700 border-dark-600 hover:bg-dark-600'
              }`}
            >
              <div className="font-medium">{player.name}</div>
              <div className="text-sm text-dark-300 mt-1">👁️ Investigar</div>
            </button>
          ))}
        </div>
      </div>

      {/* Botões de ação */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => setShowTargetSelection(false)}
          className="btn-secondary"
        >
          ← Voltar
        </button>
        <button
          onClick={handleUseAbility}
          disabled={!selectedTarget}
          className="btn-primary bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          👁️ Investigar Jogador
        </button>
      </div>
    </div>
  )
}

interface VoodooWerewolfInterfaceProps {
  voodooWerewolf: Player
  players: Player[]
  onVoodooAction: (useAbility: boolean, guessedClass?: CharacterClass, targetId?: string) => void
}

function VoodooWerewolfInterface({ voodooWerewolf, players, onVoodooAction }: VoodooWerewolfInterfaceProps) {
  const [selectedTarget, setSelectedTarget] = useState<string>('')
  const [selectedClass, setSelectedClass] = useState<CharacterClass | null>(null)
  const [showTargetSelection, setShowTargetSelection] = useState(false)

  const availableTargets = players.filter(p => p.id !== voodooWerewolf.id && !isWerewolf(p.character))
  
  const allClasses = Object.values(CharacterClass)

  const handleUseAbility = () => {
    if (selectedTarget && selectedClass) {
      onVoodooAction(true, selectedClass, selectedTarget)
    } else {
      alert('Selecione um alvo e uma classe!')
    }
  }

  if (!showTargetSelection) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">
            🐺 {voodooWerewolf.name} - Lobisomem Voodoo
          </h3>
          <p className="text-dark-300 mb-4">
            Deseja usar sua habilidade especial para matar alguém?
          </p>
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 mb-4">
            <p className="text-yellow-300 font-semibold">⚠️ ATENÇÃO:</p>
            <p className="text-yellow-200 text-sm">
              Se você errar a classe da pessoa, você morrerá!
              Esta habilidade ignora proteções de Guardião e Talismã.
            </p>
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <button
            onClick={() => onVoodooAction(false)}
            className="btn-secondary"
          >
            ❌ Não Usar Habilidade
          </button>
          <button
            onClick={() => setShowTargetSelection(true)}
            className="btn-primary bg-purple-600 hover:bg-purple-700"
          >
            ⚡ Usar Habilidade Voodoo
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">
          🐺 {voodooWerewolf.name} - Lobisomem Voodoo
        </h3>
        <p className="text-dark-300 mb-4">
          Escolha seu alvo e adivinhe sua classe:
        </p>
      </div>

      {/* Seleção de alvo */}
      <div className="space-y-4">
        <h4 className="font-semibold text-center">🎯 Escolha seu alvo:</h4>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {availableTargets.map(player => (
            <button
              key={player.id}
              onClick={() => setSelectedTarget(player.id)}
              className={`p-4 rounded-lg border transition-all ${
                selectedTarget === player.id
                  ? 'bg-purple-600 border-purple-500'
                  : 'bg-dark-700 border-dark-600 hover:bg-dark-600'
              }`}
            >
              <div className="font-medium">{player.name}</div>
              <div className="text-sm text-dark-300 mt-1">Selecionar</div>
            </button>
          ))}
        </div>
      </div>

      {/* Seleção de classe */}
      {selectedTarget && (
        <div className="space-y-4">
          <h4 className="font-semibold text-center">🔮 Qual é a classe de {players.find(p => p.id === selectedTarget)?.name}?</h4>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {allClasses.map(characterClass => (
              <button
                key={characterClass}
                onClick={() => setSelectedClass(characterClass)}
                className={`p-3 rounded-lg border transition-all text-left ${
                  selectedClass === characterClass
                    ? 'bg-purple-600 border-purple-500'
                    : 'bg-dark-700 border-dark-600 hover:bg-dark-600'
                }`}
              >
                <div className="font-medium text-sm">
                  {CHARACTER_NAMES[characterClass]}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Botões de ação */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => setShowTargetSelection(false)}
          className="btn-secondary"
        >
          ← Voltar
        </button>
        <button
          onClick={handleUseAbility}
          disabled={!selectedTarget || !selectedClass}
          className="btn-primary bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ⚡ Executar Habilidade Voodoo
        </button>
      </div>
    </div>
  )
}



type NightStep =
  | 'werewolves'
  | 'voodoo_werewolf'
  | 'gag_werewolf'
  | 'occult'
  | 'player_actions'
  | 'pass_device'
  | 'witch'
  | 'master_pass'
  | 'complete'

interface NightPhaseProps {
  players: Player[]
  nightNumber: number
  gameState?: GameState
  onNightComplete: (actions: GameAction[], updatedPlayers: Player[], updatedGameState?: Partial<GameState>) => void
}

export default function NightPhase({ players, nightNumber, gameState, onNightComplete }: NightPhaseProps) {
  const [currentStep, setCurrentStep] = useState<NightStep>('werewolves')
  const [actions, setActions] = useState<GameAction[]>([])
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [selectedTarget, setSelectedTarget] = useState<string>('')
  const [usedAbilities, setUsedAbilities] = useState<{ [playerId: string]: string[] }>(gameState?.usedAbilities || {})
  const [investigationResults, setInvestigationResults] = useState<{ playerId: string, result: string, type: 'vidente' | 'medium' }[]>([])
  const [updatedWitchPotions, setUpdatedWitchPotions] = useState(gameState?.witchPotions || { healingPotion: true, poisonPotion: true })



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
  const playerHasAction = new Set(actionPlayers.map(p => p.id))

  // Lista de jogadores para o loop principal de ações noturnas
  const playersInPlayerActionsStep = alivePlayers

  console.log('Jogadores com ações:', actionPlayers.map(p => ({ name: p.name, character: p.character })))

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

    console.log('Adicionando ação:', {
      playerId,
      type,
      targetId,
      data,
      night: nightNumber
    })

    setActions(prev => [...prev, newAction])
  }

  const advanceToNextPlayerOrStep = () => {
    if (currentPlayerIndex < playersInPlayerActionsStep.length - 1) {
      // Skip PassDeviceScreen in debug mode
      if (gameState?.config.debugMode) {
        setCurrentPlayerIndex(prev => prev + 1)
        setCurrentStep('player_actions')
      } else {
        setCurrentStep('pass_device')
      }
    } else if (witch) {
      setCurrentStep('witch')
    } else {
      // Skip MasterPassScreen in debug mode when no witch
      if (gameState?.config.debugMode) {
        setCurrentStep('complete')
      } else {
        setCurrentStep('master_pass')
      }
    }
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
    } else if (playersInPlayerActionsStep.length > 0) {
      setCurrentStep('player_actions')
    } else if (witch) {
      setCurrentStep('witch')
    } else {
      // Skip MasterPassScreen in debug mode when no witch
      if (gameState?.config.debugMode) {
        setCurrentStep('complete')
      } else {
        setCurrentStep('master_pass')
      }
    }
  }

  const handleVoodooAction = (useAbility: boolean, guessedClass?: CharacterClass, targetId?: string) => {
    if (useAbility && targetId && guessedClass) {
      addAction(voodooWerewolf!.id, ActionType.KILL, targetId, { guessedClass })
    }

    setSelectedTarget('')

    if (gagWerewolf) {
      setCurrentStep('gag_werewolf')
    } else if (occult) {
      setCurrentStep('occult')
    } else if (playersInPlayerActionsStep.length > 0) {
      setCurrentStep('player_actions')
    } else if (witch) {
      setCurrentStep('witch')
    } else {
      // Skip MasterPassScreen in debug mode when no witch
      if (gameState?.config.debugMode) {
        setCurrentStep('complete')
      } else {
        setCurrentStep('master_pass')
      }
    }
  }



  const handleVidenteAction = (useAbility: boolean, targetId?: string) => {
    const currentPlayer = playersInPlayerActionsStep[currentPlayerIndex]
    
    if (useAbility && targetId) {
      addAction(currentPlayer.id, ActionType.INVESTIGATE, targetId)
      
      // Armazenar resultado para exibição elegante no final (opcional)
      const target = alivePlayers.find(p => p.id === targetId)
      if (target) {
        const isGood = [
          CharacterClass.ALDEAO, CharacterClass.MEDIUM, CharacterClass.VIDENTE,
          CharacterClass.CUPIDO, CharacterClass.TALISMA, CharacterClass.BRUXA,
          CharacterClass.BALA_DE_PRATA, CharacterClass.GUARDIAO, CharacterClass.HEMOMANTE,
          CharacterClass.HEROI
        ].includes(target.character)

        const resultText = `${target.name} é ${isGood ? 'BOM' : 'MAU'}`
        setInvestigationResults(prev => [...prev, {
          playerId: currentPlayer.id,
          result: resultText,
          type: 'vidente'
        }])
      }
    }

    setSelectedTarget('')
    advanceToNextPlayerOrStep()
  }

  const handleMediumAction = (useAbility: boolean, targetId?: string) => {
    const currentPlayer = playersInPlayerActionsStep[currentPlayerIndex]
    
    if (useAbility && targetId) {
      addAction(currentPlayer.id, ActionType.INVESTIGATE, targetId)
      
      // Marcar habilidade como usada
      setUsedAbilities(prev => ({
        ...prev,
        [currentPlayer.id]: [...(prev[currentPlayer.id] || []), 'medium_investigation']
      }))
      
      // Armazenar resultado para exibição elegante
      const target = players.find(p => p.id === targetId)
      if (target && !target.isAlive) {
        const resultText = `${target.name} era ${CHARACTER_NAMES[target.character]}`
        setInvestigationResults(prev => [...prev, {
          playerId: currentPlayer.id,
          result: resultText,
          type: 'medium'
        }])
      }
    }

    setSelectedTarget('')
    advanceToNextPlayerOrStep()
  }

  const handlePlayerAction = (actionType: ActionType) => {
    const currentPlayer = playersInPlayerActionsStep[currentPlayerIndex]

    console.log('Processando ação do jogador:', {
      name: currentPlayer.name,
      character: currentPlayer.character,
      actionType,
      targetId: selectedTarget
    })

    if (selectedTarget) {
      addAction(currentPlayer.id, actionType, selectedTarget)

      // Armazenar resultado para o vidente
      if (actionType === ActionType.INVESTIGATE &&
          (currentPlayer.character === CharacterClass.VIDENTE ||
           (currentPlayer.character === CharacterClass.OCCULT && currentPlayer.originalCharacter === CharacterClass.VIDENTE))) {
        const target = alivePlayers.find(p => p.id === selectedTarget)
        if (target) {
          const isGood = [
            CharacterClass.ALDEAO, CharacterClass.MEDIUM, CharacterClass.VIDENTE,
            CharacterClass.CUPIDO, CharacterClass.TALISMA, CharacterClass.BRUXA,
            CharacterClass.BALA_DE_PRATA, CharacterClass.GUARDIAO, CharacterClass.HEMOMANTE,
            CharacterClass.HEROI
          ].includes(target.character)

          const resultText = `${target.name} é ${isGood ? 'BOM' : 'MAU'}`
          setInvestigationResults(prev => [...prev, {
            playerId: currentPlayer.id,
            result: resultText,
            type: 'vidente'
          }])
        }
      }

      // Armazenar resultado para o médium (caso esteja usando a interface antiga)
      if (actionType === ActionType.INVESTIGATE &&
          (currentPlayer.character === CharacterClass.MEDIUM ||
           (currentPlayer.character === CharacterClass.OCCULT && currentPlayer.originalCharacter === CharacterClass.MEDIUM))) {
        const target = players.find(p => p.id === selectedTarget)
        if (target && !target.isAlive) {
          const resultText = `${target.name} era ${CHARACTER_NAMES[target.character]}`
          setInvestigationResults(prev => [...prev, {
            playerId: currentPlayer.id,
            result: resultText,
            type: 'medium'
          }])
        }
      }
    }

    setSelectedTarget('')
    advanceToNextPlayerOrStep()
  }

  const handleContinueFromPassDevice = () => {
    setCurrentPlayerIndex(prev => prev + 1)
    setCurrentStep('player_actions')
  }

  const handleWitchAction = (action: 'heal' | 'poison' | 'skip', targetId?: string) => {
    if (action === 'heal' || action === 'poison') {
      const actionType = action === 'heal' ? ActionType.HEAL : ActionType.POISON
      addAction(witch!.id, actionType, targetId)
      
      // Consumir a poção usada
      if (action === 'heal') {
        setUpdatedWitchPotions((prev: WitchPotions) => ({ ...prev, healingPotion: false }))
      } else if (action === 'poison') {
        setUpdatedWitchPotions((prev: WitchPotions) => ({ ...prev, poisonPotion: false }))
      }
    }

    setSelectedTarget('')
    // Skip MasterPassScreen in debug mode
    if (gameState?.config.debugMode) {
      setCurrentStep('complete')
    } else {
      setCurrentStep('master_pass')
    }
  }

  const handleMasterPassContinue = () => {
    setCurrentStep('complete')
  }

  const handleComplete = () => {
    console.log('Finalizando fase noturna:', {
      totalActions: actions.length,
      actions: actions.map(a => ({
        playerId: a.playerId,
        type: a.type,
        targetId: a.targetId
      }))
    })

    const updatedGameState = {
      usedAbilities,
      witchPotions: updatedWitchPotions
    }

    onNightComplete(actions, players, updatedGameState)
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
          <VoodooWerewolfInterface
            voodooWerewolf={voodooWerewolf}
            players={alivePlayers}
            onVoodooAction={handleVoodooAction}
          />
        )}

        {currentStep === 'pass_device' && (
          <PassDeviceScreen
            nextPlayerName={playersInPlayerActionsStep[currentPlayerIndex + 1].name}
            onContinue={handleContinueFromPassDevice}
          />
        )}

        {currentStep === 'player_actions' && playersInPlayerActionsStep.length > 0 && (
          <>
                        {(() => {
              const currentPlayer = playersInPlayerActionsStep[currentPlayerIndex]
              if (!currentPlayer) return null

              if (playerHasAction.has(currentPlayer.id)) {
                return (
                  <>
                    {(currentPlayer.character === CharacterClass.MEDIUM ||
                      (currentPlayer.character === CharacterClass.OCCULT &&
                        currentPlayer.originalCharacter === CharacterClass.MEDIUM)) ? (
                      <MediumInterface
                        medium={currentPlayer}
                        allPlayers={players}
                        usedAbilities={usedAbilities}
                        onMediumAction={handleMediumAction}
                      />
                    ) : (currentPlayer.character === CharacterClass.VIDENTE ||
                      (currentPlayer.character === CharacterClass.OCCULT &&
                        currentPlayer.originalCharacter === CharacterClass.VIDENTE)) ? (
                      <VidenteInterface
                        vidente={currentPlayer}
                        alivePlayers={alivePlayers}
                        onVidenteAction={handleVidenteAction}
                      />
                    ) : (
                      <div className="space-y-6">
                        <div className="text-center">
                          <h3 className="text-xl font-semibold mb-2">
                            {CHARACTER_NAMES[currentPlayer.character]} - {currentPlayer.name}
                          </h3>
                          <p className="text-dark-300 mb-4">
                            Escolha um jogador para {getActionDescription(currentPlayer)}
                          </p>
                          <div className="text-sm text-primary-400">
                            Jogador {currentPlayerIndex + 1} de {playersInPlayerActionsStep.length}
                          </div>

                          {currentPlayer.character === CharacterClass.VAMPIRO && (
                            <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mt-2">
                              <p className="text-sm text-red-300">
                                🧛‍♂️ Você é o Vampiro! Escolha alguém para matar esta noite.
                              </p>
                            </div>
                          )}
                        </div>

                        {currentPlayer.isSilenced && (
                          <div className="bg-yellow-600 text-yellow-100 p-4 rounded-lg text-center">
                            🤐 Você foi silenciado e não pode falar no próximo dia!
                          </div>
                        )}

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {alivePlayers
                            .filter(p => {
                              // Filtro básico: não pode ser o próprio jogador
                              if (p.id === currentPlayer.id) return false
                              
                              // Se for zumbi, não pode infectar jogadores já infectados
                              const character = currentPlayer.originalCharacter || currentPlayer.character
                              if (character === CharacterClass.ZUMBI && p.isInfected) return false
                              
                              return true
                            })
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
                                  {player.isAlive 
                                    ? (() => {
                                        const character = currentPlayer.originalCharacter || currentPlayer.character
                                        if (character === CharacterClass.ZUMBI && player.isInfected) {
                                          return '🦠 Já Infectado'
                                        }
                                        return 'Selecionar'
                                      })()
                                    : '💀 Morto'
                                  }
                                </div>
                              </button>
                            ))}
                        </div>

                        <div className="text-center space-x-4">
                          <button
                            onClick={() => handlePlayerAction(getPlayerActionType(currentPlayer))}
                            disabled={!selectedTarget}
                            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            ✅ Confirmar Ação
                          </button>
                          <button
                            onClick={() => handlePlayerAction(getPlayerActionType(currentPlayer))}
                            className="btn-secondary"
                          >
                            ⏭️ Pular Ação
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )
              }

              const character = currentPlayer.originalCharacter || currentPlayer.character

              if (isWerewolf(character)) {
                return (
                  <div className="space-y-6 text-center">
                    <h3 className="text-xl font-semibold mb-2">{currentPlayer.name}</h3>
                    <p className="text-dark-300 mb-4">Você é um lobisomem. A alcateia já escolheu a vítima.</p>
                    <button onClick={advanceToNextPlayerOrStep} className="btn-primary">
                      Continuar
                    </button>
                  </div>
                )
              }

              if (character === CharacterClass.BRUXA) {
                return (
                  <div className="space-y-6 text-center">
                    <h3 className="text-xl font-semibold mb-2">{currentPlayer.name}</h3>
                    <p className="text-dark-300 mb-4">Você é a Bruxa. Seu turno será no final da noite.</p>
                    <button onClick={advanceToNextPlayerOrStep} className="btn-primary">
                      Continuar
                    </button>
                  </div>
                )
              }

              if (character === CharacterClass.OCCULT) {
                return (
                  <div className="space-y-6 text-center">
                    <h3 className="text-xl font-semibold mb-2">{currentPlayer.name}</h3>
                    <p className="text-dark-300 mb-4">Você é o Ocultista. Você age em um momento diferente.</p>
                    <button onClick={advanceToNextPlayerOrStep} className="btn-primary">
                      Continuar
                    </button>
                  </div>
                )
              }

              return (
                <div className="space-y-6 text-center">
                  <h3 className="text-xl font-semibold mb-2">
                    {currentPlayer.name}
                  </h3>
                  <p className="text-dark-300 mb-4">
                    Você não tem nenhuma ação para realizar esta noite. Você dorme profundamente.
                  </p>
                  <button
                    onClick={advanceToNextPlayerOrStep}
                    className="btn-primary"
                  >
                    Continuar
                  </button>
                </div>
              )
            })()}
          </>
        )}

        {currentStep === 'witch' && witch && (
          <WitchInterface
            witch={witch}
            actions={actions}
            players={alivePlayers}
            witchPotions={updatedWitchPotions}
            onWitchAction={handleWitchAction}
          />
        )}

        {currentStep === 'master_pass' && (
          <MasterPassScreen
            onContinue={handleMasterPassContinue}
          />
        )}

        {currentStep === 'complete' && (
          <div className="text-center space-y-6">
            <div className="text-blue-400 text-6xl">🌅</div>
            <h3 className="text-xl font-semibold">A Noite Chegou ao Fim</h3>
            <p className="text-dark-300">
              Todas as ações noturnas foram registradas.
              Prepare-se para o amanhecer...
            </p>

            {/* Mostrar resultados das investigações */}
            {investigationResults.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">🔍 Resultados das Investigações</h4>
                {investigationResults.map((result, index) => {
                  const investigator = players.find(p => p.id === result.playerId)
                  return (
                    <div key={index} className={`p-4 rounded-lg border text-left ${
                      result.type === 'vidente' 
                        ? 'bg-purple-900/30 border-purple-700'
                        : 'bg-blue-900/30 border-blue-700'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">
                          {result.type === 'vidente' ? '👁️' : '🔮'}
                        </span>
                        <span className="font-semibold">
                          {investigator?.name} - {result.type === 'vidente' ? 'Vidente' : 'Médium'}
                        </span>
                      </div>
                      <p className={`text-sm ${
                        result.type === 'vidente' ? 'text-purple-200' : 'text-blue-200'
                      }`}>
                        🔍 {result.result}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Mostrar resumo das ações para debug */}
            {actions.length > 0 && (
              <div className="bg-dark-700 rounded-lg p-4 text-left">
                <h4 className="font-semibold mb-2">📋 Resumo das Ações:</h4>
                <div className="space-y-1 text-sm">
                  {actions.map((action, index) => {
                    const player = players.find(p => p.id === action.playerId)
                    const target = action.targetId ? players.find(p => p.id === action.targetId) : null
                    return (
                      <div key={index} className="text-dark-300">
                        • {player?.name} ({action.type}) → {target?.name || 'Nenhum'}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

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