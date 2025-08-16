import type { GameState } from '../types/game'
import { CHARACTER_NAMES, Team } from '../types/game'

interface GameStatusModalProps {
  isOpen: boolean
  gameState: GameState
  onClose: () => void
}

export default function GameStatusModal({ isOpen, gameState, onClose }: GameStatusModalProps) {
  if (!isOpen) return null

  const alivePlayers = gameState.players.filter(p => p.isAlive)
  const deadPlayers = gameState.deadPlayers

  const getTeamColor = (team: Team) => {
    switch (team) {
      case Team.GOOD: return 'text-green-400'
      case Team.EVIL: return 'text-red-400'
      case Team.NEUTRAL: return 'text-purple-400'
      default: return 'text-dark-300'
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
            <h2 className="text-3xl font-bold">📊 Situação Geral do Jogo</h2>
            <button
              onClick={onClose}
              className="text-2xl hover:text-primary-400 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Estatísticas Gerais */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-dark-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary-400">{gameState.players.length}</div>
              <div className="text-sm text-dark-300">Total de Jogadores</div>
            </div>
            <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{alivePlayers.length}</div>
              <div className="text-sm text-green-300">Jogadores Vivos</div>
            </div>
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{deadPlayers.length}</div>
              <div className="text-sm text-red-300">Jogadores Mortos</div>
            </div>
            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{gameState.actions.length}</div>
              <div className="text-sm text-blue-300">Ações Registradas</div>
            </div>
          </div>

          {/* Informações da Partida */}
          <div className="bg-dark-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">🎮 Informações da Partida</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-dark-300">Fase Atual:</span>
                <span className="ml-2 font-medium">
                  {gameState.currentPhase === 'setup' && 'Ações Iniciais'}
                  {gameState.currentPhase === 'night' && `Noite ${gameState.currentNight}`}
                  {gameState.currentPhase === 'day' && `Dia ${gameState.currentDay}`}
                  {gameState.currentPhase === 'ended' && 'Fim de Jogo'}
                </span>
              </div>
              <div>
                <span className="text-dark-300">Noite:</span>
                <span className="ml-2 font-medium">{gameState.currentNight}</span>
              </div>
              <div>
                <span className="text-dark-300">Dia:</span>
                <span className="ml-2 font-medium">{gameState.currentDay}</span>
              </div>
            </div>
          </div>

          {/* Prefeito */}
          {gameState.mayorId && (
            <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">👑 Prefeito</h3>
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">
                  {gameState.players.find(p => p.id === gameState.mayorId)?.name}
                </span>
                <span className="text-sm text-yellow-300">
                  ({CHARACTER_NAMES[gameState.players.find(p => p.id === gameState.mayorId)?.character || 'aldeao']})
                </span>
              </div>
            </div>
          )}

          {/* Jogadores Vivos */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-green-400">👥 Jogadores Vivos</h3>
            <div className="bg-dark-700 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-dark-600">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark-200">Nome</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark-200">Classe</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark-200">Time</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-dark-200">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-600">
                  {alivePlayers.map((player, index) => (
                    <tr key={player.id} className={index % 2 === 0 ? 'bg-dark-700' : 'bg-dark-800'}>
                      <td className="px-4 py-3 text-sm font-medium">{player.name}</td>
                      <td className="px-4 py-3 text-sm">{CHARACTER_NAMES[player.character]}</td>
                      <td className={`px-4 py-3 text-sm ${getTeamColor(player.team)}`}>
                        {getTeamIcon(player.team)} {player.team === 'good' ? 'Bom' : player.team === 'evil' ? 'Mau' : 'Neutro'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-wrap gap-1">
                          {player.isSilenced && <span className="bg-yellow-600 text-yellow-100 px-2 py-1 rounded text-xs">🤐 Silenciado</span>}
                          {player.isInfected && <span className="bg-green-600 text-green-100 px-2 py-1 rounded text-xs">🦠 Infectado</span>}
                          {player.hasProtection && <span className="bg-blue-600 text-blue-100 px-2 py-1 rounded text-xs">🛡️ Protegido</span>}
                          {player.isInLove && <span className="bg-pink-600 text-pink-100 px-2 py-1 rounded text-xs">💕 Apaixonado</span>}
                          {player.bloodBondPartnerId && <span className="bg-purple-600 text-purple-100 px-2 py-1 rounded text-xs">🩸 Ligação</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Jogadores Mortos */}
          {deadPlayers.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-red-400">💀 Jogadores Mortos</h3>
              <div className="bg-dark-700 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-dark-600">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-dark-200">Nome</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-dark-200">Classe</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-dark-200">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-600">
                    {deadPlayers.map((player, index) => (
                      <tr key={player.id} className={index % 2 === 0 ? 'bg-dark-700' : 'bg-dark-800'}>
                        <td className="px-4 py-3 text-sm font-medium text-dark-400">{player.name}</td>
                        <td className="px-4 py-3 text-sm text-dark-400">{CHARACTER_NAMES[player.character]}</td>
                        <td className={`px-4 py-3 text-sm ${getTeamColor(player.team)}`}>
                          {getTeamIcon(player.team)} {player.team === 'good' ? 'Bom' : player.team === 'evil' ? 'Mau' : 'Neutro'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Ações Recentes */}
          {gameState.actions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-blue-400">🔍 Ações Recentes</h3>
              <div className="bg-dark-700 rounded-lg p-4 max-h-40 overflow-y-auto">
                <div className="space-y-2 text-sm">
                  {gameState.actions.slice(-10).reverse().map((action, index) => {
                    const player = gameState.players.find(p => p.id === action.playerId)
                    const target = action.targetId ? gameState.players.find(p => p.id === action.targetId) : null
                    return (
                      <div key={index} className="flex items-center gap-2 text-dark-300">
                        <span className="text-xs text-dark-400">#{action.night}</span>
                        <span className="font-medium">{player?.name}</span>
                        <span className="text-blue-400">{action.type}</span>
                        {target && (
                          <>
                            <span>→</span>
                            <span className="font-medium">{target.name}</span>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
