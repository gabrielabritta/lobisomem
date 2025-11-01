import { useState } from 'react'
import type { Player, GameConfig } from '../types/game'
import { CharacterClass, CHARACTER_NAMES, CHARACTER_DESCRIPTIONS } from '../types/game'
import { getCharacterIcon, getCharacterTeam } from '../utils/gameUtils'

interface CharacterDistributionProps {
  players: Player[]
  config?: GameConfig
  onPlayerCharacterUpdate?: (playerId: string, character: CharacterClass) => void
  onDistributionComplete: () => void
}

export default function CharacterDistribution({ players, config, onPlayerCharacterUpdate, onDistributionComplete }: CharacterDistributionProps) {
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [showCharacter, setShowCharacter] = useState(false)
  const [hasSeenCharacter, setHasSeenCharacter] = useState(false)
  const [selectedClass, setSelectedClass] = useState<CharacterClass | null>(null)

  const currentPlayer = players[currentPlayerIndex]
  const isLastPlayer = currentPlayerIndex === players.length - 1
  const isCardsMode = config?.distributionMethod === 'cards'

  const handleRevealCharacter = () => {
    setShowCharacter(true)
    setHasSeenCharacter(true)
  }

  const handleClassSelection = (characterClass: CharacterClass) => {
    setSelectedClass(characterClass)
    if (onPlayerCharacterUpdate && currentPlayer) {
      onPlayerCharacterUpdate(currentPlayer.id, characterClass)
    }
    setShowCharacter(true)
    setHasSeenCharacter(true)
  }

  const handleNextPlayer = () => {
    if (isLastPlayer) {
      onDistributionComplete()
    } else {
      setCurrentPlayerIndex(prev => prev + 1)
      setShowCharacter(false)
      setHasSeenCharacter(false)
      setSelectedClass(null)
    }
  }

  const getCharacterColor = (character: CharacterClass): string => {
    if ([
      CharacterClass.ALDEAO, CharacterClass.MEDIUM, CharacterClass.VIDENTE,
      CharacterClass.CUPIDO, CharacterClass.TALISMA, CharacterClass.BRUXA,
      CharacterClass.BALA_DE_PRATA, CharacterClass.GUARDIAO, CharacterClass.HEMOMANTE,
      CharacterClass.HEROI
    ].includes(character)) {
      return 'from-blue-500 to-blue-700'
    }

    if ([
      CharacterClass.BOBO, CharacterClass.TRAIDOR, CharacterClass.ZUMBI,
      CharacterClass.VAMPIRO, CharacterClass.LOBISOMEM, CharacterClass.LOBISOMEM_VOODOO,
      CharacterClass.LOBISOMEM_MORDACA
    ].includes(character)) {
      return 'from-red-500 to-red-700'
    }

    return 'from-purple-500 to-purple-700' // Occult
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card text-center">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Distribuição de Classes</h2>
          <p className="text-dark-300">
            Jogador {currentPlayerIndex + 1} de {players.length}
          </p>
          <div className="w-full bg-dark-700 rounded-full h-2 mt-4">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentPlayerIndex + 1) / players.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="mb-8">
          <div className="bg-dark-700 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold mb-2">
              🎭 {currentPlayer.name}
            </h3>
            <p className="text-dark-300">
              {isCardsMode 
                ? 'Selecione a classe que você tirou na carta física.'
                : 'É a sua vez de descobrir sua classe!'}
            </p>
          </div>

          {!showCharacter ? (
            isCardsMode ? (
              <div>
                <p className="text-dark-300 mb-6">
                  🃏 Selecione abaixo a classe da carta que você tirou.<br/>
                  ⚠️ Mantenha em segredo dos outros jogadores!
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {(config?.allowedClasses || []).map((characterClass) => (
                    <button
                      key={characterClass}
                      onClick={() => handleClassSelection(characterClass)}
                      className={`px-4 py-3 rounded-lg border transition-all ${
                        selectedClass === characterClass
                          ? 'bg-primary-600 border-primary-500'
                          : 'bg-dark-700 border-dark-600 hover:bg-dark-600'
                      }`}
                    >
                      <div className="text-2xl mb-1">{getCharacterIcon(characterClass)}</div>
                      <div className="text-sm font-medium">{CHARACTER_NAMES[characterClass]}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-dark-300 mb-6">
                  📱 Clique no botão abaixo para revelar sua classe.<br/>
                  ⚠️ Mantenha em segredo dos outros jogadores!
                </p>
                <button
                  onClick={handleRevealCharacter}
                  className="btn-primary text-xl px-8 py-4"
                >
                  🔍 Revelar Minha Classe
                </button>
              </div>
            )
          ) : (
            <div className="space-y-6">
              <div className={`bg-gradient-to-r ${getCharacterColor(isCardsMode && selectedClass ? selectedClass : currentPlayer.character)} rounded-xl p-8 text-white shadow-2xl`}>
                <div className="text-6xl mb-4">
                  {getCharacterIcon(isCardsMode && selectedClass ? selectedClass : currentPlayer.character)}
                </div>
                <h3 className="text-3xl font-bold mb-2">
                  {CHARACTER_NAMES[isCardsMode && selectedClass ? selectedClass : currentPlayer.character]}
                </h3>
                <p className="text-lg opacity-90">
                  {CHARACTER_DESCRIPTIONS[isCardsMode && selectedClass ? selectedClass : currentPlayer.character]}
                </p>
              </div>

              {hasSeenCharacter && (
                <button
                  onClick={handleNextPlayer}
                  className="btn-primary text-lg px-6 py-3"
                >
                  {isLastPlayer ? '✅ Finalizar Distribuição' : '➡️ Próximo Jogador'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Mensagem de passar dispositivo removida conforme solicitado */}
      </div>
    </div>
  )
}
