import { useState, useEffect, useRef } from 'react'
import type {
  GameConfig,
  GameState
} from '../types/game'
import {
  GamePhase,
  CharacterClass,
  CHARACTER_NAMES
} from '../types/game'
import { 
  createDefaultConfig, 
  distributeCharacters,
  createPlayersWithoutClasses,
  loadConfigFromCache,
  loadPlayerNamesFromCache,
  saveConfigToCache,
  savePlayerNamesToCache,
  clearConfigCache
} from '../utils/gameUtils'

interface GameSetupProps {
  onGameStart: (gameState: GameState) => void
}

export default function GameSetup({ onGameStart }: GameSetupProps) {
  // Função para inicializar configurações com cache
  const initializeConfig = (): GameConfig => {
    const cachedConfig = loadConfigFromCache()
    return cachedConfig || createDefaultConfig()
  }

  // Função para inicializar nomes dos jogadores com cache
  const initializePlayerNames = (numberOfPlayers: number): string[] => {
    const cachedNames = loadPlayerNamesFromCache()
    if (cachedNames && cachedNames.length >= numberOfPlayers) {
      return cachedNames.slice(0, numberOfPlayers)
    }
    
    // Se não há cache ou não há nomes suficientes, gerar nomes padrão
    const names = Array.from({ length: numberOfPlayers }, (_, i) => `Jogador ${i + 1}`)
    
    // Se há alguns nomes em cache, usar eles primeiro
    if (cachedNames) {
      for (let i = 0; i < Math.min(cachedNames.length, numberOfPlayers); i++) {
        if (cachedNames[i] && cachedNames[i].trim()) {
          names[i] = cachedNames[i]
        }
      }
    }
    
    return names
  }

  const initialConfig = initializeConfig()
  const [config, setConfig] = useState<GameConfig>(initialConfig)
  const [playerNames, setPlayerNames] = useState<string[]>(
    initializePlayerNames(initialConfig.numberOfPlayers)
  )
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const touchStateRef = useRef<{ startY: number; startIndex: number } | null>(null)

  // Salvar configurações no cache quando mudarem
  useEffect(() => {
    saveConfigToCache(config)
  }, [config])

  // Salvar nomes dos jogadores no cache quando mudarem
  useEffect(() => {
    savePlayerNamesToCache(playerNames)
  }, [playerNames])

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

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      return
    }

    setPlayerNames(prev => {
      const newNames = [...prev]
      const draggedName = newNames[draggedIndex]
      newNames.splice(draggedIndex, 1)
      newNames.splice(dropIndex, 0, draggedName)
      return newNames
    })

    setDraggedIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  // Handlers de touch para mobile
  useEffect(() => {
    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (!touchStateRef.current) return
      
      e.preventDefault()
      const touch = e.touches[0]
      
      // Encontrar qual elemento está sendo tocado agora
      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY)
      if (elementBelow) {
        const container = elementBelow.closest('[data-player-index]')
        if (container) {
          const dropIndex = parseInt(container.getAttribute('data-player-index') || '-1')
          if (dropIndex >= 0) {
            // Manter o índice arrastado para feedback visual
            setDraggedIndex(touchStateRef.current.startIndex)
          }
        }
      }
    }

    const handleGlobalTouchEnd = (e: TouchEvent) => {
      if (!touchStateRef.current) return

      const touch = e.changedTouches[0]
      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY)
      
      if (elementBelow) {
        const container = elementBelow.closest('[data-player-index]')
        if (container) {
          const dropIndex = parseInt(container.getAttribute('data-player-index') || '-1')
          
          if (dropIndex >= 0 && dropIndex !== touchStateRef.current.startIndex) {
            // Reordenar
            setPlayerNames(prev => {
              const newNames = [...prev]
              const draggedName = newNames[touchStateRef.current!.startIndex]
              newNames.splice(touchStateRef.current!.startIndex, 1)
              newNames.splice(dropIndex, 0, draggedName)
              return newNames
            })
          }
        }
      }

      touchStateRef.current = null
      setDraggedIndex(null)
    }

    // Sempre adicionar listeners, mas só processar quando touchStateRef.current existe
    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false })
    document.addEventListener('touchend', handleGlobalTouchEnd)

    return () => {
      document.removeEventListener('touchmove', handleGlobalTouchMove)
      document.removeEventListener('touchend', handleGlobalTouchEnd)
    }
  }, [])

  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    // Só iniciar drag se tocar no ícone ou no container (não no input)
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT') {
      // Se tocar no input, não iniciar drag
      return
    }
    
    const touch = e.touches[0]
    touchStateRef.current = {
      startY: touch.clientY,
      startIndex: index
    }
    setDraggedIndex(index)
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
          // Se tentar remover a última classe de lobisomem, adicionar automaticamente o lobisomem comum
          // Primeiro remover a classe que foi desselecionada
          const newAllowedClasses = prev.allowedClasses.filter(c => c !== characterClass)
          // Verificar se o lobisomem comum já está na lista, se não, adicionar
          if (!newAllowedClasses.includes(CharacterClass.LOBISOMEM)) {
            newAllowedClasses.push(CharacterClass.LOBISOMEM)
          }
          return {
            ...prev,
            allowedClasses: newAllowedClasses
          }
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

  const handleResetConfig = () => {
    if (confirm('Tem certeza que deseja resetar todas as configurações para os valores padrão?')) {
      clearConfigCache()
      const defaultConfig = createDefaultConfig()
      setConfig(defaultConfig)
      setPlayerNames(initializePlayerNames(defaultConfig.numberOfPlayers))
    }
  }

  const handleStartGame = () => {
    if (playerNames.some(name => !name.trim())) {
      alert('Todos os jogadores devem ter nomes válidos!')
      return
    }

    // Se for modo cartas, criar jogadores sem classes atribuídas
    // Se for modo app, distribuir classes automaticamente
    const players = (config.distributionMethod || 'app') === 'cards'
      ? createPlayersWithoutClasses(playerNames, config)
      : distributeCharacters(playerNames, config)

    // Verificar se há jogadores que precisam de ações iniciais
    const needsInitialActions = players.some(p => 
      p.character === CharacterClass.CUPIDO || 
      p.character === CharacterClass.OCCULT
    );

    const gameState: GameState = {
      id: `game_${Date.now()}`,
      config,
      players,
      currentPhase: config.debugMode 
        ? (needsInitialActions ? GamePhase.SETUP : GamePhase.MAYOR_VOTING)
        : GamePhase.CHARACTER_DISTRIBUTION,
      currentNight: config.debugMode ? 1 : 0,
      currentDay: 0,
      actions: [],
      deadPlayers: [],
      winners: [],
      isGameEnded: false,
      witchPotions: {
        healingPotion: true,
        poisonPotion: true
      }
    }

    onGameStart(gameState)
  }

  // Verificar se será necessário usar classes fallback
  const checkFallbackNeeded = () => {
    const werewolfClasses = config.allowedClasses.filter(cls => 
      [CharacterClass.LOBISOMEM, CharacterClass.LOBISOMEM_VOODOO, CharacterClass.LOBISOMEM_MORDACA].includes(cls)
    );
    const alternativeEvilClasses = config.allowedClasses.filter(cls =>
      [CharacterClass.VAMPIRO, CharacterClass.TRAIDOR, CharacterClass.ZUMBI, CharacterClass.BOBO].includes(cls)
    );
    const goodClasses = config.allowedClasses.filter(cls =>
      cls !== CharacterClass.ALDEAO && 
      [CharacterClass.MEDIUM, CharacterClass.VIDENTE, CharacterClass.CUPIDO, CharacterClass.TALISMA, 
       CharacterClass.BRUXA, CharacterClass.BALA_DE_PRATA, CharacterClass.GUARDIAO, CharacterClass.HEMOMANTE, 
       CharacterClass.HEROI, CharacterClass.OCCULT].includes(cls)
    );

    const warnings: string[] = [];

    // Verificar se lobisomem comum está habilitado
    const isCommonWerewolfEnabled = config.allowedClasses.includes(CharacterClass.LOBISOMEM);
    
    // Verificar lobisomens - não mostrar aviso se lobisomem comum estiver habilitado
    if (!isCommonWerewolfEnabled) {
      if (werewolfClasses.length > 0 && config.numberOfWerewolves > werewolfClasses.length) {
        warnings.push(`Lobisomens: ${config.numberOfWerewolves - werewolfClasses.length} ser${config.numberOfWerewolves - werewolfClasses.length === 1 ? 'á' : 'ão'} Lobisomem comum`);
      } else if (werewolfClasses.length === 0 && config.numberOfWerewolves > 0) {
        warnings.push(`Todos os ${config.numberOfWerewolves} lobisomens serão Lobisomens comuns`);
      }
    }

    // Verificar classes más alternativas - sempre mostrar aviso
    if (alternativeEvilClasses.length > 0 && config.numberOfAlternativeEvil > alternativeEvilClasses.length) {
      warnings.push(`Classes más: ${config.numberOfAlternativeEvil - alternativeEvilClasses.length} ser${config.numberOfAlternativeEvil - alternativeEvilClasses.length === 1 ? 'á' : 'ão'} Traidor(es)`);
    } else if (alternativeEvilClasses.length === 0 && config.numberOfAlternativeEvil > 0) {
      warnings.push(`Todos os ${config.numberOfAlternativeEvil} jogadores maus alternativos serão Traidores`);
    }

    // Verificar se aldeão está habilitado
    const isVillagerEnabled = config.allowedClasses.includes(CharacterClass.ALDEAO);
    
    // Verificar classes do bem - não mostrar aviso se aldeão estiver habilitado
    if (!isVillagerEnabled) {
      const totalGoodSlots = config.numberOfPlayers - config.numberOfWerewolves - config.numberOfAlternativeEvil;
      if (goodClasses.length > 0 && totalGoodSlots > goodClasses.length) {
        warnings.push(`Classes do bem: ${totalGoodSlots - goodClasses.length} ser${totalGoodSlots - goodClasses.length === 1 ? 'á' : 'ão'} Alde${totalGoodSlots - goodClasses.length === 1 ? 'ão' : 'ões'}`);
      } else if (goodClasses.length === 0 && totalGoodSlots > 0) {
        warnings.push(`Todos os ${totalGoodSlots} jogadores do bem serão Aldeões`);
      }
    }

    return warnings;
  }

  const fallbackWarnings = checkFallbackNeeded()

  // Custom order: Werewolves first, then occult, then alternative evil classes
  const allCharacterClasses = [
    CharacterClass.ALDEAO,
    CharacterClass.MEDIUM,
    CharacterClass.VIDENTE,
    CharacterClass.CUPIDO,
    CharacterClass.TALISMA,
    CharacterClass.BRUXA,
    CharacterClass.BALA_DE_PRATA,
    CharacterClass.GUARDIAO,
    CharacterClass.HEMOMANTE,
    CharacterClass.HEROI,
    CharacterClass.LOBISOMEM,
    CharacterClass.LOBISOMEM_VOODOO,
    CharacterClass.LOBISOMEM_MORDACA,
    CharacterClass.OCCULT,
    CharacterClass.VAMPIRO,
    CharacterClass.TRAIDOR,
    CharacterClass.ZUMBI,
    CharacterClass.BOBO
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card mb-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Configuração da Partida</h2>

        {/* Configurações Básicas */}
        <div className="grid md:grid-cols-2 gap-3 md:gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">Modo de Jogo</label>
            <div className="flex gap-2">
              <button
                onClick={() => setConfig(prev => ({ ...prev, gameMode: 'sapatinho' }))}
                className={`px-3 py-2 rounded border ${config.gameMode !== 'classic' ? 'bg-primary-600 border-primary-500' : 'bg-dark-700 border-dark-600 hover:bg-dark-600'}`}
              >
                Só no sapatinho
              </button>
              <button
                onClick={() => setConfig(prev => ({ ...prev, gameMode: 'classic' }))}
                className={`px-3 py-2 rounded border ${config.gameMode === 'classic' ? 'bg-primary-600 border-primary-500' : 'bg-dark-700 border-dark-600 hover:bg-dark-600'}`}
              >
                Modo Clássico
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Método de Distribuição</label>
            <div className="flex gap-2">
              <button
                onClick={() => setConfig(prev => ({ ...prev, distributionMethod: 'app' }))}
                className={`px-3 py-2 rounded border ${(config.distributionMethod || 'app') === 'app' ? 'bg-primary-600 border-primary-500' : 'bg-dark-700 border-dark-600 hover:bg-dark-600'}`}
              >
                Sortear pelo App
              </button>
              <button
                onClick={() => setConfig(prev => ({ ...prev, distributionMethod: 'cards' }))}
                className={`px-3 py-2 rounded border ${config.distributionMethod === 'cards' ? 'bg-primary-600 border-primary-500' : 'bg-dark-700 border-dark-600 hover:bg-dark-600'}`}
              >
                Sortear por Cartas
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
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
            <div className="flex justify-between text-xs text-dark-400 mt-0.5">
              <span>4</span>
              <span>20</span>
            </div>
          </div>

          {/* Sliders apenas visíveis no modo "app" */}
          {(config.distributionMethod || 'app') === 'app' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">
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
                <div className="flex justify-between text-xs text-dark-400 mt-0.5">
                  <span>1</span>
                  <span>{Math.floor(config.numberOfPlayers / 2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
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
                <div className="flex justify-between text-xs text-dark-400 mt-0.5">
                  <span>0</span>
                  <span>3</span>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              Tempo de Discussão: {config.discussionTime % 1 === 0 ? `${config.discussionTime} min` : `${Math.floor(config.discussionTime)}min ${(config.discussionTime % 1) * 60}s`}
            </label>
            <input
              type="range"
              min="2"
              max="8"
              step="1"
              value={config.discussionTime * 2}
              onChange={(e) => setConfig(prev => ({ ...prev, discussionTime: Number(e.target.value) / 2 }))}
              className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-dark-400 mt-0.5">
              <span>1 min</span>
              <span>4 min</span>
            </div>
          </div>
        </div>

        {/* Nomes dos Jogadores */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Nomes dos Jogadores</h3>
          <p className="text-sm text-dark-400 mb-3">Arraste os campos para reordenar os jogadores</p>
          <div className="grid grid-cols-2 gap-3">
            {playerNames.map((name, index) => (
              <div
                key={index}
                data-player-index={index}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                onTouchStart={(e) => handleTouchStart(e, index)}
                className={`flex items-center gap-2 px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg transition-all cursor-move ${
                  draggedIndex === index 
                    ? 'opacity-50 border-primary-500 bg-primary-900/20' 
                    : draggedIndex !== null && draggedIndex !== index
                      ? 'border-primary-400/50 bg-primary-900/10'
                      : 'hover:border-dark-500'
                }`}
              >
                <div 
                  className="text-dark-400 select-none text-lg flex-shrink-0 cursor-move" 
                  title="Arraste para reordenar"
                >
                  ⋮⋮
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                  className="flex-1 bg-transparent border-0 text-white placeholder-dark-400 focus:outline-none focus:ring-0 text-base"
                  placeholder={`Jogador ${index + 1}`}
                  autoComplete="off"
                  autoCapitalize="words"
                  draggable={false}
                  onClick={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  onTouchStart={(e) => {
                    // Se tocar no input, não iniciar drag
                    e.stopPropagation()
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Classes Disponíveis */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Classes Disponíveis</h3>
          <div className="grid grid-cols-2 gap-3">
            {allCharacterClasses.map((characterClass) => {
              const isAlternativeEvil = [CharacterClass.VAMPIRO, CharacterClass.TRAIDOR, CharacterClass.ZUMBI, CharacterClass.BOBO].includes(characterClass)
              const isDisabled = isAlternativeEvil && config.numberOfAlternativeEvil === 0
              
              return (
                <div
                  key={characterClass}
                  className={`p-3 rounded-lg border transition-all ${
                    isDisabled
                      ? 'bg-dark-800 border-dark-700 opacity-50 cursor-not-allowed'
                      : config.allowedClasses.includes(characterClass)
                      ? 'bg-primary-600 border-primary-500 cursor-pointer'
                      : 'bg-dark-700 border-dark-600 hover:bg-dark-600 cursor-pointer'
                  }`}
                  onClick={() => !isDisabled && handleClassToggle(characterClass)}
                >
                  <div className="font-medium text-sm">
                    {CHARACTER_NAMES[characterClass]}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Configurações Avançadas */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-2 md:gap-3 mb-4">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="btn-secondary text-sm py-2 px-4"
            >
              {showAdvanced ? 'Ocultar' : 'Mostrar'} Configurações Avançadas
            </button>
            <button
              onClick={handleResetConfig}
              className="btn-secondary text-red-400 hover:text-red-300 hover:bg-red-900/20 text-sm py-2 px-4"
            >
              🔄 Resetar Configurações
            </button>
          </div>

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

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.debugMode}
                  onChange={(e) => setConfig(prev => ({ ...prev, debugMode: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm">Modo Debug</span>
              </label>
            </div>
          )}
        </div>

        {/* Aviso de preenchimento automático - apenas no modo "app" */}
        {(config.distributionMethod || 'app') === 'app' && fallbackWarnings.length > 0 && (
          <div className="mb-6 p-4 bg-yellow-900/30 border border-yellow-700 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-400 mb-2">
                  Preenchimento Automático de Classes
                </h3>
                <p className="text-sm text-dark-300 mb-2">
                  Não há classes selecionadas suficientes para todos os jogadores. As seguintes classes serão usadas automaticamente:
                </p>
                <ul className="list-disc list-inside text-sm text-dark-300 space-y-1">
                  {fallbackWarnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

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