import { useState, useEffect } from 'react'
import type { Player, GameConfig } from '../types/game'
import { CharacterClass, CHARACTER_NAMES } from '../types/game'
import { processVotes } from '../utils/gameUtils'
import PassDeviceScreen from './PassDeviceScreen'

interface DayPhaseProps {
  players: Player[]
  dayNumber: number
  config: GameConfig
  mayorId?: string
  deadToday: string[]
  nightMessages: string[]
  investigations: { [playerId: string]: any }
  onDayComplete: (expelledPlayerId?: string, newMayorId?: string, updatedPlayers?: Player[]) => void
}

type DayStep = 
  | 'deaths_announcement'
  | 'discussion'
  | 'mayor_voting'
  | 'mayor_result'
  | 'expulsion_voting'
  | 'mayor_tie_break'
  | 'expulsion_result'
  | 'complete'

export default function DayPhase({
  players,
  dayNumber,
  config,
  mayorId,
  deadToday,
  nightMessages,
  investigations,
  onDayComplete
}: DayPhaseProps) {
  const [currentStep, setCurrentStep] = useState<DayStep>('deaths_announcement')
  const [discussionTimeLeft, setDiscussionTimeLeft] = useState(config.discussionTime * 60)
  const [currentVoterIndex, setCurrentVoterIndex] = useState(0)
  const [votes, setVotes] = useState<{ [playerId: string]: string }>({})
  const [newMayorId] = useState<string>(mayorId || '')
  const [showVotes] = useState(!config.expulsionVotingAnonymous)
  const [votingResult, setVotingResult] = useState<{ winner: string | null, tied: boolean, tiedPlayers: string[], mayorDecided?: boolean } | null>(null)

  const alivePlayers = players.filter(p => p.isAlive)
  const currentVoter = alivePlayers[currentVoterIndex]
  const currentMayor = players.find(p => p.id === (newMayorId || mayorId))

  // Timer para discussão
  useEffect(() => {
    if (currentStep === 'discussion' && discussionTimeLeft > 0) {
      const timer = setTimeout(() => {
        setDiscussionTimeLeft(prev => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
            } else if (currentStep === 'discussion' && discussionTimeLeft === 0) {
      setCurrentStep('expulsion_voting')
    }
  }, [currentStep, discussionTimeLeft])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleDeathsComplete = () => {
    setCurrentStep('discussion')
  }

  const handleSkipDiscussion = () => {
    setDiscussionTimeLeft(0)
  }

  const handleVote = (targetId: string) => {
    const newVotes = { ...votes, [currentVoter.id]: targetId };
    setVotes(newVotes);

    if (currentVoterIndex < alivePlayers.length - 1) {
        setCurrentVoterIndex(prev => prev + 1);
    } else {
        const result = processVotes(newVotes);

        if (result.tied && currentMayor) {
            // Tie occurred and there is a mayor, go to tie break step
            setVotingResult(result);
            setCurrentStep('mayor_tie_break');
        } else if (result.tied) {
            // Tie occurred but NO mayor, fallback to random
            const randomIndex = Math.floor(Math.random() * result.tiedPlayers.length);
            const winner = result.tiedPlayers[randomIndex];
            setVotingResult({ ...result, winner });
            setCurrentStep('expulsion_result');
        } else {
            // Normal result (win or no expulsion)
            setVotingResult(result);
            setCurrentStep('expulsion_result');
        }
    }
};

const handleMayorTieChoice = (expelledPlayerId: string) => {
    setVotingResult(prevResult => ({
        ...(prevResult!),
        winner: expelledPlayerId,
        mayorDecided: true 
    }));
    setCurrentStep('expulsion_result');
};



  const handleExpulsionResultContinue = () => {
    onDayComplete(votingResult?.winner || undefined, newMayorId, players)
  }

  const getPlayerInvestigationResult = (playerId: string) => {
    const investigation = investigations[playerId]
    if (!investigation) return null

    if (investigation.type === 'alignment') {
      return `🔍 Você investigou ${investigation.target}: ${investigation.result}`
    } else if (investigation.type === 'class') {
      return `👻 Você viu a classe de ${investigation.target}: ${CHARACTER_NAMES[investigation.result as CharacterClass]}`
    }
    return null
  }

  const getVotingResultText = () => {
    if (!votingResult) return ''

    if (votingResult.mayorDecided) {
        const winner = players.find(p => p.id === votingResult.winner);
        return `${winner ? winner.name : 'Desconhecido'} (decisão do Prefeito)`
    }

    if (votingResult.tied) {
        // This text is now for the random fallback
        return `Empate entre: ${votingResult.tiedPlayers.map(id => {
            const player = players.find(p => p.id === id);
            return player ? player.name : 'Desconhecido';
        }).join(', ')}. Sorteio: ${(() => {
            const winner = players.find(p => p.id === votingResult.winner);
            return winner ? winner.name : 'Desconhecido';
        })()}`;
    } else if (votingResult.winner) {
        const winner = players.find(p => p.id === votingResult.winner);
        return winner ? winner.name : 'Desconhecido';
    }
    return 'Ninguém foi expulso'; // Changed for clarity
};

  // Função para detectar mortes por amor quando um jogador é expulso
  const getLoveDeaths = (expelledPlayerId: string) => {
    const expelledPlayer = players.find(p => p.id === expelledPlayerId)
    if (!expelledPlayer || !expelledPlayer.isInLove || !expelledPlayer.lovePartnerId) {
      return []
    }
    
    const lover = players.find(p => p.id === expelledPlayer.lovePartnerId)
    if (!lover || !lover.isAlive) {
      return []
    }
    
    return [lover]
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <h2 className="text-2xl font-bold mb-6 text-center">
          ☀️ Dia {dayNumber}
        </h2>

        {currentStep === 'deaths_announcement' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4">🌅 Amanhecer</h3>

              {deadToday.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-red-400 text-lg font-semibold">
                    💀 Mortes da Noite
                  </p>
                  <div className="bg-red-900/30 border border-red-700 rounded-lg p-6">
                    {deadToday.map(deadId => {
                      const deadPlayer = players.find(p => p.id === deadId)
                      return deadPlayer ? (
                        <div key={deadId} className="text-lg mb-2">
                          ⚰️ <strong>{deadPlayer.name}</strong>
                          {/* Não mostrar a classe de quem morreu */}
                        </div>
                      ) : null
                    })}
                  </div>

                  {nightMessages.length > 0 && (
                    <div className="bg-dark-700 rounded-lg p-4">
                      <h4 className="font-semibold mb-2">📰 Eventos da Noite:</h4>
                      {nightMessages.map((message, index) => (
                        <p key={index} className="text-sm text-dark-300 mb-1">
                          • {message}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-green-900/30 border border-green-700 rounded-lg p-6">
                  <p className="text-green-400 text-lg">
                    🌸 Foi uma noite tranquila. Ninguém morreu.
                  </p>
                </div>
              )}

              {/* Mostrar resultados de investigações */}
              {Object.keys(investigations).length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">🔍 Informações Privadas:</h4>
                  <div className="space-y-2">
                    {Object.keys(investigations).map(playerId => {
                      const player = players.find(p => p.id === playerId)
                      const result = getPlayerInvestigationResult(playerId)
                      return player && result ? (
                        <div key={playerId} className="bg-blue-900/30 border border-blue-700 rounded-lg p-3">
                          <p className="font-medium">{player.name}:</p>
                          <p className="text-sm text-blue-300">{result}</p>
                        </div>
                      ) : null
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="text-center">
              <button
                onClick={handleDeathsComplete}
                className="btn-primary"
              >
                💬 Iniciar Discussão
              </button>
            </div>
          </div>
        )}

        {currentStep === 'discussion' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4">💬 Tempo de Discussão</h3>
              <div className="bg-primary-600 text-white rounded-lg p-4 text-2xl font-bold">
                ⏰ {formatTime(discussionTimeLeft)}
              </div>
              <p className="text-dark-300 mt-4">
                Discutam entre si para descobrir quem são os culpados!
              </p>
            </div>

            {/* Mostrar jogadores silenciados */}
            {alivePlayers.some(p => p.isSilenced) && (
              <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
                <h4 className="font-semibold mb-2">🤐 Jogadores Silenciados:</h4>
                {alivePlayers
                  .filter(p => p.isSilenced)
                  .map(player => (
                    <p key={player.id} className="text-yellow-300">
                      • {player.name} não pode falar hoje
                    </p>
                  ))}
              </div>
            )}

            <div className="text-center">
              <button
                onClick={handleSkipDiscussion}
                className="btn-secondary"
              >
                ⏭️ Pular Discussão
              </button>
            </div>
          </div>
        )}




        {currentStep === 'expulsion_voting' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">🗳️ Votação de Expulsão</h3>
              {currentMayor && (
                <p className="text-dark-300 mb-4">
                  Prefeito: <span className="text-primary-400 font-semibold">{currentMayor.name}</span>
                </p>
              )}
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
                    const target = targetId === 'no_expulsion' ? 'Não expulsar' : players.find(p => p.id === targetId)?.name
                    return (
                      <div key={voterId} className="text-dark-300">
                        {voter?.name} → {target}
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
                    Expulsar
                  </div>
                </button>
              ))}

              {/* Opção de não expulsar (se permitido) */}
              {config.allowNoExpulsionVote && (
                <button
                  onClick={() => handleVote('no_expulsion')}
                  className="p-4 rounded-lg border bg-green-700 border-green-600 hover:bg-green-600 transition-all"
                >
                  <div className="font-medium">Não Expulsar</div>
                  <div className="text-sm text-green-300 mt-1">
                    Ninguém será expulso
                  </div>
                </button>
              )}
            </div>
          </div>
        )}

        {currentStep === 'mayor_tie_break' && (
    <div className="space-y-6 text-center">
        <h3 className="text-2xl font-bold">⚖️ Votação Empatada!</h3>
        <p className="text-dark-300">
            A votação terminou em empate. O Prefeito, <span className="font-semibold text-primary-400">{currentMayor?.name}</span>, deve dar o voto de minerva.
        </p>
        <p className="text-dark-300">Prefeito, escolha quem será expulso:</p>
        <div className="bg-dark-700 rounded-lg p-4">
            <h4 className="font-semibold mb-3">Jogadores Empatados:</h4>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {votingResult?.tiedPlayers.map(playerId => {
                    const player = players.find(p => p.id === playerId);
                    return player ? (
                        <button
                            key={player.id}
                            onClick={() => handleMayorTieChoice(player.id)}
                            className="p-4 rounded-lg border bg-red-900/50 border-red-700 hover:bg-red-800/50 transition-all"
                        >
                            <div className="font-medium">{player.name}</div>
                            <div className="text-sm text-red-300 mt-1">Expulsar</div>
                        </button>
                    ) : null;
                })}
            </div>
        </div>
    </div>
)}

        {currentStep === 'expulsion_result' && (
          <div className="space-y-6 text-center">
            <div className="text-6xl">🗳️</div>
            <h3 className="text-2xl font-bold">Resultado da Votação de Expulsão</h3>
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-6">
              {votingResult?.winner ? (
                <p className="text-lg">
                  <strong>Jogador Expulso:</strong> {getVotingResultText()}
                </p>
              ) : (
                <p className="text-lg text-green-400">
                  <strong>Ninguém foi expulso</strong>
                </p>
              )}
              {votingResult?.tied && (
                <p className="text-sm text-red-300 mt-2">
                  {votingResult.mayorDecided ? 'O Prefeito desempatou a votação.' : 'Houve um empate e o vencedor foi sorteado.'}
                </p>
              )}
            </div>

            {/* Mostrar mortes por amor - fora do retângulo vermelho */}
            {votingResult?.winner && (() => {
              const loveDeaths = getLoveDeaths(votingResult.winner!)
              if (loveDeaths.length > 0) {
                return (
                  <div className="bg-pink-900/30 border border-pink-700 rounded-lg p-4">
                    <p className="text-pink-200 text-sm mb-2">
                      💕 <strong>Morte por Amor:</strong>
                    </p>
                    {loveDeaths.map(lover => (
                      <p key={lover.id} className="text-pink-100">
                        {lover.name} estava apaixonado(a) por {getVotingResultText()} e morreu de tristeza
                      </p>
                    ))}
                  </div>
                )
              }
              return null
            })()}

            {/* Mostrar detalhes da votação */}
            <div className="bg-dark-700 rounded-lg p-4">
              <h4 className="font-semibold mb-3">📊 Detalhes da Votação:</h4>
              <div className="grid md:grid-cols-2 gap-2 text-sm">
                {Object.entries(votes).map(([voterId, targetId]) => {
                  const voter = players.find(p => p.id === voterId)
                  const target = targetId === 'no_expulsion' ? 'Não expulsar' : players.find(p => p.id === targetId)?.name
                  return (
                    <div key={voterId} className="text-dark-300">
                      {voter?.name} → {target}
                    </div>
                  )
                })}
              </div>
            </div>

            <button
              onClick={handleExpulsionResultContinue}
              className="btn-primary"
            >
              Continuar para a Próxima Noite
            </button>
          </div>
        )}

        {currentStep === 'complete' && (
          <div className="text-center space-y-6">
            <div className="text-purple-400 text-6xl">🌙</div>
            <h3 className="text-xl font-semibold">O Dia Chegou ao Fim</h3>
            <p className="text-dark-300">
              As votações foram concluídas. Prepare-se para a próxima noite...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
