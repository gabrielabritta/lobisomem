import { useState } from 'react'
import type { Player, GameConfig } from '../types/game'
import { CharacterClass, CHARACTER_NAMES } from '../types/game'

interface SilverBulletPhaseProps {
  silverBulletPlayer: Player
  alivePlayers: Player[]
  config: GameConfig
  trigger: 'night_death' | 'day_expulsion'
  onShoot: (targetId: string) => void
}

export default function SilverBulletPhase({ 
  silverBulletPlayer, 
  alivePlayers, 
  config, 
  trigger,
  onShoot 
}: SilverBulletPhaseProps) {
  const [selectedTarget, setSelectedTarget] = useState<string>('')

  // Verificar se a configuração permite o tiro baseado no trigger
  const canShoot = trigger === 'night_death' 
    ? config.silverBulletKillsWhenDead 
    : config.silverBulletKillsWhenExpelled

  if (!canShoot) {
    // Se a configuração não permite, pular diretamente
    onShoot('')
    return null
  }

  // Jogadores que podem ser alvejados (todos exceto o próprio Bala de Prata)
  const availableTargets = alivePlayers.filter(p => p.id !== silverBulletPlayer.id)

  const handleShoot = () => {
    if (selectedTarget) {
      onShoot(selectedTarget)
    }
  }

  const handleSkip = () => {
    onShoot('')
  }

  const getTriggerText = () => {
    return trigger === 'night_death' 
      ? 'foi morto durante a noite'
      : 'foi expulso pela vila'
  }

  const getTriggerEmoji = () => {
    return trigger === 'night_death' ? '🌙' : '☀️'
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">{getTriggerEmoji()}</div>
          <h2 className="text-2xl font-bold mb-4">
            🔫 Bala de Prata - Último Tiro
          </h2>
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-lg text-red-300">
              <strong>{silverBulletPlayer.name}</strong> {getTriggerText()} e agora pode atirar em alguém!
            </p>
          </div>
        </div>

        {availableTargets.length === 0 ? (
          <div className="text-center space-y-6">
            <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
              <p className="text-yellow-300">
                Não há ninguém vivo para atirar.
              </p>
            </div>
            <button
              onClick={handleSkip}
              className="btn-primary"
            >
              ⏭️ Continuar
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4">
                Escolha seu alvo final:
              </h3>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableTargets.map(player => (
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
                  <div className="text-sm text-dark-300 mt-1">
                    Alvejar
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={handleSkip}
                className="btn-secondary"
              >
                ⏭️ Não Atirar
              </button>
              <button
                onClick={handleShoot}
                disabled={!selectedTarget}
                className="btn-primary bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🔫 Atirar em {selectedTarget ? availableTargets.find(p => p.id === selectedTarget)?.name : '...'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

