import { useState } from 'react'
import type {
  GameConfig,
  GameState
} from '../types/game'
import {
  GamePhase,
  CharacterClass,
  CHARACTER_NAMES,
  CHARACTER_DESCRIPTIONS
} from '../types/game'
import { createDefaultConfig, distributeCharacters } from '../utils/gameUtils'

interface GameSetupProps {
  onGameStart: (gameState: GameState) => void
}

export default function GameSetup({ onGameStart }: GameSetupProps) {
  const [config, setConfig] = useState<GameConfig>(createDefaultConfig())
  const [playerNames, setPlayerNames] = useState<string[]>(
    Array.from({ length: 8 }, (_, i) => `Jogador ${i + 1}`)
  )
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handlePlayerCountChange = (count: number) => {
    setConfig(prev => ({ ...prev, numberOfPlayers: count }))
    setPlayerNames(prev => {
      const newNames = [...prev]
      if (count > newNames.length) {
        // Adicionar novos jogadores
        for (let i = newNames.length; i < count; i++) {
          newNames.push(`Jogador ${i + 1}`)
        }
      } else if (count < newNames.length) {
        // Remover jogadores extras
        newNames.splice(count)
      }
      return newNames
    })
  }

  const handlePlayerNameChange = (index: number, name: string) => {
    setPlayerNames(prev => {
      const newNames = [...prev]
      newNames[index] = name
      return newNames
    })
  }

  const handleClassToggle = (characterClass: CharacterClass) => {
    setConfig(prev => {
      const isWerewolfClass = [CharacterClass.LOBISOMEM, CharacterClass.LOBISOMEM_VOODOO, CharacterClass.LOBISOMEM_MORDACA].includes(characterClass)
      const currentWerewolfClasses = prev.allowedClasses.filter(c => 
        [CharacterClass.LOBISOMEM, CharacterClass.LOBISOMEM_VOODOO, CharacterClass.LOBISOMEM_MORDACA].includes(c)
      )
      
      if (prev.allowedClasses.includes(characterClass)) {
        // Tentando remover uma classe
        if (isWerewolfClass && currentWerewolfClasses.length === 1) {
          // Não permitir remover a última classe de lobisomem
          alert('Pelo menos uma classe de lobisomem deve estar habilitada!')
          return prev
        }
        return {
          ...prev,
          allowedClasses: prev.allowedClasses.filter(c => c !== characterClass)
        }
      } else {
        // Adicionando uma classe
        return {
          ...prev,
          allowedClasses: [...prev.allowedClasses, characterClass]
        }
      }
    })
  }

  const handleStartGame = () => {
    if (playerNames.some(name => !name.trim())) {
      alert('Todos os jogadores devem ter nomes válidos!')
      return
    }

    // Verificar se há classes suficientes
    if (config.allowedClasses.length < config.numberOfPlayers) {
      alert('Não há classes suficientes para todos os jogadores!')
      return
    }

    const players = distributeCharacters(playerNames, config)

    const gameState: GameState = {
      id: `game_${Date.now()}`,
      config,
      players,
      currentPhase: GamePhase.CHARACTER_DISTRIBUTION,
      currentNight: 0,
      currentDay: 0,
      actions: [],
      deadPlayers: [],
      winners: [],
      isGameEnded: false
    }

    onGameStart(gameState)
  }

  const allCharacterClasses = Object.values(CharacterClass)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card mb-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Configuração da Partida</h2>

        {/* Configurações Básicas */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Número de Jogadores: {config.numberOfPlayers}
            </label>
            <input
              type="range"
              min="4"
              max="20"
              value={config.numberOfPlayers}
              onChange={(e) => handlePlayerCountChange(Number(e.target.value))}
              className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-dark-400 mt-1">
              <span>4</span>
              <span>20</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Número de Lobisomens: {config.numberOfWerewolves}
            </label>
            <input
              type="range"
              min="1"
              max={Math.floor(config.numberOfPlayers / 2)}
              value={config.numberOfWerewolves}
              onChange={(e) => setConfig(prev => ({ ...prev, numberOfWerewolves: Number(e.target.value) }))}
              className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-dark-400 mt-1">
              <span>1</span>
              <span>{Math.floor(config.numberOfPlayers / 2)}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Classes Más Alternativas: {config.numberOfAlternativeEvil}
            </label>
            <input
              type="range"
              min="0"
              max="3"
              value={config.numberOfAlternativeEvil}
              onChange={(e) => setConfig(prev => ({ ...prev, numberOfAlternativeEvil: Number(e.target.value) }))}
              className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-dark-400 mt-1">
              <span>0</span>
              <span>3</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Tempo de Discussão: {config.discussionTime} min
            </label>
            <input
              type="range"
              min="1"
              max="15"
              value={config.discussionTime}
              onChange={(e) => setConfig(prev => ({ ...prev, discussionTime: Number(e.target.value) }))}
              className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-dark-400 mt-1">
              <span>1 min</span>
              <span>15 min</span>
            </div>
          </div>
        </div>

        {/* Nomes dos Jogadores */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Nomes dos Jogadores</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {playerNames.map((name, index) => (
              <input
                key={index}
                type="text"
                value={name}
                onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                className="input-field text-base" // Evita zoom no iOS
                placeholder={`Jogador ${index + 1}`}
                autoComplete="off"
                autoCapitalize="words"
              />
            ))}
          </div>
        </div>

        {/* Classes Disponíveis */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Classes Disponíveis</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {allCharacterClasses.map((characterClass) => (
              <div
                key={characterClass}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  config.allowedClasses.includes(characterClass)
                    ? 'bg-primary-600 border-primary-500'
                    : 'bg-dark-700 border-dark-600 hover:bg-dark-600'
                }`}
                onClick={() => handleClassToggle(characterClass)}
              >
                <div className="font-medium text-sm">
                  {CHARACTER_NAMES[characterClass]}
                </div>
                <div className="text-xs text-dark-300 mt-1 line-clamp-2">
                  {CHARACTER_DESCRIPTIONS[characterClass]}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Configurações Avançadas */}
        <div className="mb-6">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="btn-secondary mb-4"
          >
            {showAdvanced ? 'Ocultar' : 'Mostrar'} Configurações Avançadas
          </button>

          {showAdvanced && (
            <div className="grid md:grid-cols-2 gap-4 p-4 bg-dark-700 rounded-lg">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.mayorVotingAnonymous}
                  onChange={(e) => setConfig(prev => ({ ...prev, mayorVotingAnonymous: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm">Votação de prefeito anônima</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.expulsionVotingAnonymous}
                  onChange={(e) => setConfig(prev => ({ ...prev, expulsionVotingAnonymous: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm">Votação de expulsão anônima</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.allowNoExpulsionVote}
                  onChange={(e) => setConfig(prev => ({ ...prev, allowNoExpulsionVote: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm">Permitir voto para não expulsar</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.silverBulletKillsWhenExpelled}
                  onChange={(e) => setConfig(prev => ({ ...prev, silverBulletKillsWhenExpelled: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm">Bala de Prata mata quando expulso</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.silverBulletKillsWhenDead}
                  onChange={(e) => setConfig(prev => ({ ...prev, silverBulletKillsWhenDead: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm">Bala de Prata mata quando morto</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.silverBulletIgnoresTalisman}
                  onChange={(e) => setConfig(prev => ({ ...prev, silverBulletIgnoresTalisman: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm">Bala de Prata ignora Talismã</span>
              </label>
            </div>
          )}
        </div>

        <div className="text-center">
          <button
            onClick={handleStartGame}
            className="btn-primary text-lg px-8 py-4"
          >
            🎮 Iniciar Partida
          </button>
        </div>
      </div>
    </div>
  )
}
