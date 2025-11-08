import type { Player } from '../types/game'
import type { ActionResult } from '../utils/actionResolver'
import { CharacterClass, CHARACTER_NAMES } from '../types/game'
import { getCharacterIcon } from '../utils/gameUtils'

interface SilverBulletResultScreenProps {
  result: ActionResult
  targetId: string
  players: Player[]
  onContinue: () => void
}

export default function SilverBulletResultScreen({
  result,
  targetId,
  players,
  onContinue
}: SilverBulletResultScreenProps) {
  const target = players.find(p => p.id === targetId)
  const targetDied = result.deadPlayers.includes(targetId)
  // Verificar se foi protegido pelo Talismã (não morreu e há mensagem sobre proteção)
  const wasProtected = !targetDied && result.messages.some(msg => 
    msg.includes('protegido por seu Talismã') || msg.includes('Talismã')
  )

  // Jogadores que morreram (incluindo secundários)
  const deadPlayersList = result.deadPlayers
    .map(id => players.find(p => p.id === id))
    .filter((p): p is Player => p !== undefined)

  // Separar mortes secundárias (amor/ligação de sangue)
  const secondaryDeaths = deadPlayersList.filter(p => p.id !== targetId)
  const loveDeaths = secondaryDeaths.filter(p => 
    result.deathReasons[p.id]?.includes('amor')
  )
  const bloodBondDeaths = secondaryDeaths.filter(p => 
    result.deathReasons[p.id]?.includes('ligação de sangue')
  )

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">{getCharacterIcon(CharacterClass.BALA_DE_PRATA)}</div>
          <h2 className="text-2xl font-bold mb-4">
            Resultado do Tiro
          </h2>
        </div>

        {/* Resultado principal */}
        <div className="space-y-4 mb-6">
          {target && (
            <div className={`rounded-lg p-4 ${
              targetDied 
                ? 'bg-red-900/30 border border-red-700' 
                : wasProtected
                  ? 'bg-yellow-900/30 border border-yellow-700'
                  : 'bg-dark-700 border border-dark-600'
            }`}>
              <div className="text-center">
                <p className="text-lg font-semibold mb-2">
                  {targetDied ? '💀 Alvo Morto' : wasProtected ? '🛡️ Alvo Protegido' : '❌ Tiro Falhou'}
                </p>
                <p className="text-xl mb-2">
                  <strong>{target.name}</strong>
                </p>
                {wasProtected && (
                  <p className="text-yellow-300 mt-2">
                    O Talismã protegeu {target.name}, mas foi consumido.
                  </p>
                )}
                {targetDied && result.deathReasons[targetId] && (
                  <p className="text-red-300 mt-2">
                    {result.deathReasons[targetId]}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Mortes secundárias por amor */}
          {loveDeaths.length > 0 && (
            <div className="bg-pink-900/30 border border-pink-700 rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-pink-300">💕 Mortes por Amor:</h3>
              <ul className="space-y-1">
                {loveDeaths.map(player => (
                  <li key={player.id} className="text-pink-200">
                    • <strong>{player.name}</strong> {result.deathReasons[player.id] && `(${result.deathReasons[player.id]})`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Mortes secundárias por ligação de sangue */}
          {bloodBondDeaths.length > 0 && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-red-300">🩸 Mortes por Ligação de Sangue:</h3>
              <ul className="space-y-1">
                {bloodBondDeaths.map(player => (
                  <li key={player.id} className="text-red-200">
                    • <strong>{player.name}</strong> {result.deathReasons[player.id] && `(${result.deathReasons[player.id]})`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Resumo de todas as mortes */}
          {deadPlayersList.length > 1 && (
            <div className="bg-dark-700 border border-dark-600 rounded-lg p-4">
              <h3 className="font-semibold mb-2">📊 Resumo:</h3>
              <p className="text-dark-300">
                Total de mortes: <strong>{deadPlayersList.length}</strong>
              </p>
              <ul className="mt-2 space-y-1">
                {deadPlayersList.map(player => (
                  <li key={player.id} className="text-dark-200">
                    • {player.name} {result.deathReasons[player.id] && `- ${result.deathReasons[player.id]}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="text-center">
          <button
            onClick={onContinue}
            className="btn-primary"
          >
            ⏭️ Continuar
          </button>
        </div>
      </div>
    </div>
  )
}

