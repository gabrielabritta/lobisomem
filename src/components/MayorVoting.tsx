import { useState } from 'react'
import type { Player, GameConfig } from '../types/game'
import { processVotes } from '../utils/gameUtils'

interface MayorVotingProps {
  players: Player[]
  config: GameConfig
  onVotingComplete: (mayorId: string) => void
}

export default function MayorVoting({ players, config, onVotingComplete }: MayorVotingProps) {
  const [currentVoterIndex, setCurrentVoterIndex] = useState(0)
  const [votes, setVotes] = useState<{ [playerId: string]: string }>({})
  const [showVotes, setShowVotes] = useState(!config.mayorVotingAnonymous)
  const [votingResult, setVotingResult] = useState<{ winner: string | null, tied: boolean, tiedPlayers: string[] } | null>(null)

  const alivePlayers = players.filter(p => p.isAlive)
  const currentVoter = alivePlayers[currentVoterIndex]

  const handleVote = (targetId: string) => {
    const newVotes = { ...votes, [currentVoter.id]: targetId }
    setVotes(newVotes)

    if (currentVoterIndex < alivePlayers.length - 1) {
      setCurrentVoterIndex(prev => prev + 1)
    } else {
      // Processar resultado da votação
      const result = processVotes(newVotes)
      setVotingResult(result)
    }
  }

  const handleContinue = () => {
    if (votingResult?.winner) {
      onVotingComplete(votingResult.winner)
    }
  }

  const getVotingResultText = () => {
    if (!votingResult) return ''

    if (votingResult.tied) {
      return `Empate entre: ${votingResult.tiedPlayers.map(id => {
        const player = players.find(p => p.id === id)
        return player ? player.name : 'Desconhecido'
      }).join(', ')}. Sorteio: ${(() => {
        const winner = players.find(p => p.id === votingResult.winner)
        return winner ? winner.name : 'Desconhecido'
      })()}`
    } else if (votingResult.winner) {
      const winner = players.find(p => p.id === votingResult.winner)
      return winner ? winner.name : 'Desconhecido'
    }
    return 'Nenhum vencedor'
  }

  if (votingResult) {
    return (
      <div className="card">
        <div className="space-y-6 text-center">
          <div className="text-6xl">👑</div>
          <h2 className="text-2xl font-bold">Resultado da Votação para Prefeito</h2>
          
          <div className="bg-primary-900/30 border border-primary-700 rounded-lg p-6">
            <p className="text-lg">
              <strong>Prefeito Eleito:</strong> {getVotingResultText()}
            </p>
            {votingResult.tied && (
              <p className="text-sm text-primary-300 mt-2">
                Houve um empate e o vencedor foi sorteado.
              </p>
            )}
          </div>

          {/* Mostrar detalhes da votação */}
          <div className="bg-dark-700 rounded-lg p-4">
            <h4 className="font-semibold mb-3">📊 Detalhes da Votação:</h4>
            <div className="grid md:grid-cols-2 gap-2 text-sm">
              {Object.entries(votes).map(([voterId, targetId]) => {
                const voter = players.find(p => p.id === voterId)
                const target = players.find(p => p.id === targetId)
                return (
                  <div key={voterId} className="text-dark-300">
                    {voter?.name} → {target?.name}
                  </div>
                )
              })}
            </div>
          </div>

          <button
            onClick={handleContinue}
            className="btn-primary"
          >
            🌙 Começar Primeira Noite
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">👑 Votação para Prefeito</h2>
          <p className="text-dark-300 mb-4">
            Antes de começar o jogo, vocês devem eleger um prefeito.
          </p>
          <p className="text-dark-300 mb-4">
            Vez de: <span className="text-primary-400 font-semibold">{currentVoter.name}</span>
          </p>
          <div className="text-sm text-dark-400">
            Votação {currentVoterIndex + 1} de {alivePlayers.length}
          </div>
        </div>

        {/* Mostrar votos até agora (se não for anônimo) */}
        {showVotes && Object.keys(votes).length > 0 && (
          <div className="bg-dark-700 rounded-lg p-4">
            <h4 className="font-semibold mb-2">📊 Votos até agora:</h4>
            <div className="grid md:grid-cols-2 gap-2 text-sm">
              {Object.entries(votes).map(([voterId, targetId]) => {
                const voter = players.find(p => p.id === voterId)
                const target = players.find(p => p.id === targetId)
                return (
                  <div key={voterId} className="text-dark-300">
                    {voter?.name} → {target?.name}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {alivePlayers.map(player => (
            <button
              key={player.id}
              onClick={() => handleVote(player.id)}
              className="p-4 rounded-lg border bg-dark-700 border-dark-600 hover:bg-dark-600 transition-all"
            >
              <div className="font-medium">{player.name}</div>
              <div className="text-sm text-dark-300 mt-1">
                Eleger Prefeito
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
