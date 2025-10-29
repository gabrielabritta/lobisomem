import { CharacterClass, CHARACTER_NAMES, CHARACTER_DESCRIPTIONS, Team } from '../types/game'

interface CharacterInfoProps {
  onClose: () => void
}

export default function CharacterInfo({ onClose }: CharacterInfoProps) {
  const goodClasses = Object.values(CharacterClass).filter(cls =>
    [CharacterClass.ALDEAO, CharacterClass.MEDIUM, CharacterClass.VIDENTE, CharacterClass.CUPIDO,
     CharacterClass.TALISMA, CharacterClass.BRUXA, CharacterClass.BALA_DE_PRATA,
     CharacterClass.GUARDIAO, CharacterClass.HEMOMANTE, CharacterClass.HEROI].includes(cls)
  )

  const evilClasses = Object.values(CharacterClass).filter(cls =>
    [CharacterClass.BOBO, CharacterClass.TRAIDOR, CharacterClass.ZUMBI, CharacterClass.VAMPIRO,
     CharacterClass.LOBISOMEM, CharacterClass.LOBISOMEM_VOODOO, CharacterClass.LOBISOMEM_MORDACA].includes(cls)
  )

  const neutralClasses = Object.values(CharacterClass).filter(cls =>
    cls === CharacterClass.OCCULT
  )

  // Map specific icons for each character class
  const getCharacterIcon = (cls: CharacterClass): string => {
    const iconMap: Record<CharacterClass, string> = {
      // Good classes
      [CharacterClass.ALDEAO]: '👨‍🌾',
      [CharacterClass.MEDIUM]: '👻',
      [CharacterClass.VIDENTE]: '🔮',
      [CharacterClass.CUPIDO]: '💘',
      [CharacterClass.TALISMA]: '🛡️',
      [CharacterClass.BRUXA]: '🧪',
      [CharacterClass.BALA_DE_PRATA]: '⚪',
      [CharacterClass.GUARDIAO]: '🛡️',
      [CharacterClass.HEMOMANTE]: '🩸',
      [CharacterClass.HEROI]: '⚔️',
      // Evil classes
      [CharacterClass.BOBO]: '🎭',
      [CharacterClass.TRAIDOR]: '🗡️',
      [CharacterClass.ZUMBI]: '🧟',
      [CharacterClass.VAMPIRO]: '🧛',
      [CharacterClass.LOBISOMEM]: '🐺',
      [CharacterClass.LOBISOMEM_VOODOO]: '🎯',
      [CharacterClass.LOBISOMEM_MORDACA]: '🔇',
      // Neutral classes
      [CharacterClass.OCCULT]: '❓'
    }
    return iconMap[cls] || '❓'
  }

  const getTeamColor = (team: Team) => {
    switch (team) {
      case Team.GOOD: return 'text-green-400'
      case Team.EVIL: return 'text-red-400'
      case Team.NEUTRAL: return 'text-purple-400'
      default: return 'text-dark-400'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-dark-800 rounded-lg max-w-6xl max-h-[90vh] overflow-y-auto w-full">
        <div className="sticky top-0 bg-dark-800 p-4 md:p-6 border-b border-dark-600">
          <div className="flex justify-between items-center gap-4">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold whitespace-nowrap">📚 Todas as Classes</h2>
            <button
              onClick={onClose}
              className="text-2xl hover:text-primary-400 transition-colors flex-shrink-0"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-6">
          {/* Classes do Bem */}
          <div>
            <h3 className={`text-lg md:text-xl font-bold mb-3 ${getTeamColor(Team.GOOD)}`}>
              👼 Classes do Bem
            </h3>
            <div className="space-y-2">
              {goodClasses.map((cls, idx) => (
                <div key={cls}>
                  <div className="flex items-center gap-3 py-2">
                    <span className="text-xl">{getCharacterIcon(cls)}</span>
                    <div className="flex-1">
                      <h4 className="font-semibold">{CHARACTER_NAMES[cls]}</h4>
                      <p className="text-sm text-dark-300">{CHARACTER_DESCRIPTIONS[cls]}</p>
                    </div>
                  </div>
                  {idx < goodClasses.length - 1 && <hr className="border-dark-600" />}
                </div>
              ))}
            </div>
          </div>

          {/* Classes do Mal */}
          <div>
            <h3 className={`text-lg md:text-xl font-bold mb-3 ${getTeamColor(Team.EVIL)}`}>
              😈 Classes do Mal
            </h3>
            <div className="space-y-2">
              {evilClasses.map((cls, idx) => (
                <div key={cls}>
                  <div className="flex items-center gap-3 py-2">
                    <span className="text-xl">{getCharacterIcon(cls)}</span>
                    <div className="flex-1">
                      <h4 className="font-semibold">{CHARACTER_NAMES[cls]}</h4>
                      <p className="text-sm text-dark-300">{CHARACTER_DESCRIPTIONS[cls]}</p>
                    </div>
                  </div>
                  {idx < evilClasses.length - 1 && <hr className="border-dark-600" />}
                </div>
              ))}
            </div>
          </div>

          {/* Classes Neutras */}
          {neutralClasses.length > 0 && (
            <div>
              <h3 className={`text-lg md:text-xl font-bold mb-3 ${getTeamColor(Team.NEUTRAL)}`}>
                ❔ Classes Neutras
              </h3>
              <div className="space-y-2">
                {neutralClasses.map((cls, idx) => (
                  <div key={cls}>
                    <div className="flex items-center gap-3 py-2">
                      <span className="text-xl">{getCharacterIcon(cls)}</span>
                      <div className="flex-1">
                        <h4 className="font-semibold">{CHARACTER_NAMES[cls]}</h4>
                        <p className="text-sm text-dark-300">{CHARACTER_DESCRIPTIONS[cls]}</p>
                      </div>
                    </div>
                    {idx < neutralClasses.length - 1 && <hr className="border-dark-600" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
