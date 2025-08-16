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

  const getTeamColor = (team: Team) => {
    switch (team) {
      case Team.GOOD: return 'border-green-600 bg-green-900/20'
      case Team.EVIL: return 'border-red-600 bg-red-900/20'
      case Team.NEUTRAL: return 'border-purple-600 bg-purple-900/20'
      default: return 'border-dark-600 bg-dark-700'
    }
  }

  const getTeamIcon = (team: Team) => {
    switch (team) {
      case Team.GOOD: return '👼'
      case Team.EVIL: return '😈'
      case Team.NEUTRAL: return '🎭'
      default: return '❓'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-dark-800 rounded-lg max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-dark-800 p-6 border-b border-dark-600">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold">📚 Todas as Classes</h2>
            <button
              onClick={onClose}
              className="text-2xl hover:text-primary-400 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Classes do Bem */}
          <div>
            <h3 className="text-2xl font-bold text-green-400 mb-4 flex items-center gap-2">
              👼 Classes do Bem
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {goodClasses.map(cls => (
                <div
                  key={cls}
                  className={`p-4 rounded-lg border ${getTeamColor(Team.GOOD)}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{getTeamIcon(Team.GOOD)}</span>
                    <h4 className="font-semibold text-green-300">{CHARACTER_NAMES[cls]}</h4>
                  </div>
                  <p className="text-sm text-green-200">{CHARACTER_DESCRIPTIONS[cls]}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Classes do Mal */}
          <div>
            <h3 className="text-2xl font-bold text-red-400 mb-4 flex items-center gap-2">
              😈 Classes do Mal
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {evilClasses.map(cls => (
                <div
                  key={cls}
                  className={`p-4 rounded-lg border ${getTeamColor(Team.EVIL)}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{getTeamIcon(Team.EVIL)}</span>
                    <h4 className="font-semibold text-red-300">{CHARACTER_NAMES[cls]}</h4>
                  </div>
                  <p className="text-sm text-red-200">{CHARACTER_DESCRIPTIONS[cls]}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Classes Neutras */}
          {neutralClasses.length > 0 && (
            <div>
              <h3 className="text-2xl font-bold text-purple-400 mb-4 flex items-center gap-2">
                🎭 Classes Neutras
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {neutralClasses.map(cls => (
                  <div
                    key={cls}
                    className={`p-4 rounded-lg border ${getTeamColor(Team.NEUTRAL)}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getTeamIcon(Team.NEUTRAL)}</span>
                      <h4 className="font-semibold text-purple-300">{CHARACTER_NAMES[cls]}</h4>
                    </div>
                    <p className="text-sm text-purple-200">{CHARACTER_DESCRIPTIONS[cls]}</p>
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
