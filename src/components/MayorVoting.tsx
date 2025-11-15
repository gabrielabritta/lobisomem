import { useState, useEffect } from 'react'
import type { Player, GameConfig } from '../types/game'
import { processVotes } from '../utils/gameUtils'

interface MayorVotingProps {
  players: Player[]
  config: GameConfig
  onVotingComplete: (mayorId: string) => void
  onSaveState: (options: { description: string; componentState?: any }) => void
  restoredState?: any
}

export default function MayorVoting({ players, config, onVotingComplete, onSaveState, restoredState }: MayorVotingProps) {
  const [currentVoterIndex, setCurrentVoterIndex] = useState(restoredState?.currentVoterIndex || 0)
  const [votes, setVotes] = useState(restoredState?.votes || {})
  const [showVotes, setShowVotes] = useState(!config.mayorVotingAnonymous)
  const [votingResult, setVotingResult] = useState(restoredState?.votingResult || null)

  useEffect(() => {
    if (restoredState) {
      setCurrentVoterIndex(restoredState.currentVoterIndex || 0)
      setVotes(restoredState.votes || {})
      setVotingResult(restoredState.votingResult || null)
    }
  }, [restoredState])

  const alivePlayers = players.filter(p => p.isAlive)
  const currentVoter = alivePlayers[currentVoterIndex]

  const getVoteCount = (playerId: string) => {
    return Object.values(votes).filter(targetId => targetId === playerId).length
  }

  const renderVoteIndicators = (count: number) => {
    if (count === 0) return null
    
    if (count <= 5) {
      return (
        <div className="flex justify-center gap-1 mt-1">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
          ))}
        </div>
      )
    }
    
    if (count <= 10) {
      return (
        <>
          <div className="flex justify-center gap-1 mb-1">
            {Array.from({ length: count - 5 }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
            ))}
          </div>
          <div className="flex justify-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
            ))}
          </div>
        </>
      )
    }
    
    return (
      <div className="flex flex-col items-center mt-1">
        <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
        <div className="text-xs text-yellow-400 font-semibold">{count}</div>
      </div>
    )
  }

  const handleVote = (targetId: string) => {
    const newVotes = { ...votes, [currentVoter.id]: targetId }
    
    // Salvar estado ANTES da ação (modo clássico)
    if (config.gameMode === 'classic' && onSaveState) {
      onSaveState({
        description: `Voto Prefeito: ${currentVoter.name}`,
        componentState: {
          mayorVoting: {
            currentVoterIndex,
            votes,
            votingResult,
          },
        },
      })
    }

    setVotes(newVotes)

    if (currentVoterIndex < alivePlayers.length - 1) {
      setCurrentVoterIndex(prev => prev + 1)
    } else {
      // Processar resultado da votação
      const result = processVotes(newVotes)
      // Em caso de empate, sortear um vencedor entre os empatados
      if (result.tied && result.tiedPlayers && result.tiedPlayers.length > 0) {
        const randomIndex = Math.floor(Math.random() * result.tiedPlayers.length)
        const winner = result.tiedPlayers[randomIndex]
        setVotingResult({ ...result, winner })
      } else {
        setVotingResult(result)
      }
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
          <div className="bg-dark-700 rounded-lg p-2">
            <h4 className="font-semibold text-xs mb-1">📊 Votos até agora:</h4>
            <div className="flex gap-2">
              <div className="w-1/2 text-xs">
                {Object.entries(votes).slice(0, Math.ceil(Object.keys(votes).length / 2)).map(([voterId, targetId]) => {
                  const voter = players.find(p => p.id === voterId)
                  const target = players.find(p => p.id === targetId)
                  return (
                    <div key={voterId} className="text-dark-300">
                      {voter?.name} → {target?.name}
                    </div>
                  )
                })}
              </div>
              <div className="w-1/2 text-xs">
                {Object.entries(votes).slice(Math.ceil(Object.keys(votes).length / 2)).map(([voterId, targetId]) => {
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
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          {alivePlayers.map(player => (
            <button
              key={player.id}
              onClick={() => handleVote(player.id)}
              className="px-4 py-2 rounded-lg border bg-dark-700 border-dark-600 hover:bg-dark-600 transition-all"
            >
              <div className="font-medium">{player.name}</div>
              {renderVoteIndicators(getVoteCount(player.id))}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
