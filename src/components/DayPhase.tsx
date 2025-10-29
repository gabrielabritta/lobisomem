import { useState, useEffect } from 'react'
import type { Player, GameConfig } from '../types/game'
import { CharacterClass, CHARACTER_NAMES } from '../types/game'
import { processVotes } from '../utils/gameUtils'
import PassDeviceScreen from './PassDeviceScreen'
import SilverBulletPhase from './SilverBulletPhase'

interface DayPhaseProps {
  players: Player[]
  dayNumber: number
  config: GameConfig
  mayorId?: string
  deadToday: string[]
  nightMessages: string[]
  investigations: { [playerId: string]: any }
  deathReasons: { [playerId: string]: string }
  needsMayorReelection?: boolean
  previousMayorName?: string
  pendingSilverBulletPlayer?: Player
  onDayComplete: (expelledPlayerId?: string, newMayorId?: string, updatedPlayers?: Player[]) => void
  onSilverBulletShot?: (silverBulletPlayerId: string, targetId: string, trigger: 'night_death' | 'day_expulsion') => void
  onShowGameStatus?: () => void
  onGameReset?: () => void
}

type DayStep = 
  | 'deaths_announcement'
  | 'silver_bullet_shot'
  | 'discussion'
  | 'mayor_reelection'
  | 'mayor_reelection_result'
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
  deathReasons,
  needsMayorReelection = false,
  previousMayorName = '',
  pendingSilverBulletPlayer,
  onDayComplete,
  onSilverBulletShot,
  onShowGameStatus,
  onGameReset
}: DayPhaseProps) {
  const [currentStep, setCurrentStep] = useState<DayStep>('deaths_announcement')
  const [discussionTimeLeft, setDiscussionTimeLeft] = useState(config.discussionTime * 60)
  const [currentVoterIndex, setCurrentVoterIndex] = useState(0)
  const [votes, setVotes] = useState<{ [playerId: string]: string }>({})
  const [newMayorId, setNewMayorId] = useState<string>(mayorId || '')
  const [showVotes] = useState(!config.expulsionVotingAnonymous)
  const [votingResult, setVotingResult] = useState<{ winner: string | null, tied: boolean, tiedPlayers: string[], mayorDecided?: boolean } | null>(null)
  
  // Estados para votação de reeleição do prefeito
  const [mayorReelectionVotes, setMayorReelectionVotes] = useState<{ [playerId: string]: string }>({})
  const [mayorReelectionVoterIndex, setMayorReelectionVoterIndex] = useState(0)
  const [mayorReelectionResult, setMayorReelectionResult] = useState<{ winner: string | null, tied: boolean, tiedPlayers: string[] } | null>(null)

  const alivePlayers = players.filter(p => p.isAlive)
  const currentVoter = alivePlayers[currentVoterIndex]
  const currentMayor = players.find(p => p.id === (newMayorId || mayorId))

  const getVoteCount = (playerId: string) => {
    return Object.values(votes).filter(targetId => targetId === playerId).length
  }

  const getNoExpulsionVoteCount = () => {
    return Object.values(votes).filter(targetId => targetId === 'no_expulsion').length
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

  const renderMayorReelectionVoteIndicators = (count: number) => {
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

  // Timer para discussão
  useEffect(() => {
    if (currentStep === 'discussion' && discussionTimeLeft > 0) {
      const timer = setTimeout(() => {
        setDiscussionTimeLeft(prev => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (currentStep === 'discussion' && discussionTimeLeft === 0) {
      // Após a discussão, verificar se precisa de reeleição do prefeito
      if (needsMayorReelection) {
        setCurrentStep('mayor_reelection')
      } else {
        setCurrentStep('expulsion_voting')
      }
    }
  }, [currentStep, discussionTimeLeft, needsMayorReelection])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleDeathsComplete = () => {
    // Se há um Bala de Prata pendente, ir para a tela dele primeiro
    if (pendingSilverBulletPlayer) {
      setCurrentStep('silver_bullet_shot')
    } else {
      setCurrentStep('discussion')
    }
  }

  const handleSilverBulletComplete = () => {
    // Após o Bala de Prata atirar, continuar para a discussão
    setCurrentStep('discussion')
  }

  const handleSkipDiscussion = () => {
    setDiscussionTimeLeft(0)
  }

  // Funções para votação de reeleição do prefeito
  const handleMayorReelectionVote = (targetId: string) => {
    const newVotes = { ...mayorReelectionVotes, [alivePlayers[mayorReelectionVoterIndex].id]: targetId }
    setMayorReelectionVotes(newVotes)

    if (mayorReelectionVoterIndex < alivePlayers.length - 1) {
      setMayorReelectionVoterIndex(prev => prev + 1)
    } else {
      // Processar resultado da votação de reeleição
      const result = processVotes(newVotes)
      setMayorReelectionResult(result)
      setCurrentStep('mayor_reelection_result')
    }
  }

  const handleMayorReelectionComplete = () => {
    if (mayorReelectionResult?.winner) {
      setNewMayorId(mayorReelectionResult.winner)
    }
    setCurrentStep('expulsion_voting')
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
    onDayComplete(votingResult?.winner || undefined, newMayorId || mayorId, players)
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

  const getMayorReelectionResultText = () => {
    if (!mayorReelectionResult) return ''

    if (mayorReelectionResult.tied) {
      return `Empate entre: ${mayorReelectionResult.tiedPlayers.map(id => {
        const player = players.find(p => p.id === id)
        return player ? player.name : 'Desconhecido'
      }).join(', ')}. Sorteio: ${(() => {
        const winner = players.find(p => p.id === mayorReelectionResult.winner)
        return winner ? winner.name : 'Desconhecido'
      })()}`
    } else if (mayorReelectionResult.winner) {
      const winner = players.find(p => p.id === mayorReelectionResult.winner)
      return winner ? winner.name : 'Desconhecido'
    }
    return 'Nenhum vencedor'
  }

  const getMayorReelectionVoteCount = (playerId: string) => {
    return Object.values(mayorReelectionVotes).filter(targetId => targetId === playerId).length
  }

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

  // Determinar se deve mostrar o cabeçalho
  const shouldShowHeader = currentStep === 'deaths_announcement' || currentStep === 'expulsion_result' || currentStep === 'complete'
  
  return (
    <div className="max-w-4xl mx-auto">
      {shouldShowHeader && (
        <div className="card mb-3">
          <div className="flex flex-col items-center gap-2">
            <div className="flex justify-between items-center w-full">
              <p className="text-dark-300">
                Fase: <span className="text-primary-400 font-semibold">
                  Dia {dayNumber}
                </span>
              </p>
              <span className="text-sm text-dark-400">👥 {players.filter(p => p.isAlive).length} vivos</span>
            </div>
            {onShowGameStatus && onGameReset && (
              <div className="flex gap-3 w-full sm:w-auto justify-center">
                <button
                  onClick={onShowGameStatus}
                  className="btn-secondary text-sm px-6 py-2 flex-1 sm:flex-initial min-w-[140px]"
                  title="Abrir modal com situação geral do jogo"
                >
                  📊 Planilha
                </button>
                <button
                  onClick={() => {
                    if (confirm('Tem certeza que deseja iniciar uma nova partida? Todos os progressos atuais serão perdidos.')) {
                      onGameReset()
                    }
                  }}
                  className="btn-secondary text-sm px-6 py-2 flex-1 sm:flex-initial min-w-[140px]"
                >
                  🔄 Nova Partida
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
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
                      const deathReason = deathReasons[deadId]
                      return deadPlayer ? (
                        <div key={deadId} className="text-lg mb-2">
                          ⚰️ <strong>{deadPlayer.name}</strong>
                          {deathReason ? ` (${deathReason})` : ''}
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
                {pendingSilverBulletPlayer ? '⏭️ Continuar' : '💬 Iniciar Discussão'}
              </button>
            </div>
          </div>
        )}

        {currentStep === 'silver_bullet_shot' && pendingSilverBulletPlayer && onSilverBulletShot && (
          <SilverBulletPhase
            silverBulletPlayer={pendingSilverBulletPlayer}
            alivePlayers={players.filter(p => p.isAlive)}
            config={config}
            trigger="night_death"
            onShoot={(targetId) => {
              onSilverBulletShot(pendingSilverBulletPlayer.id, targetId, 'night_death')
              handleSilverBulletComplete()
            }}
          />
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

        {currentStep === 'mayor_reelection' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4">👑 Nova Eleição de Prefeito</h3>
              <p className="text-dark-300 mb-4">
                O prefeito <span className="text-red-400 font-semibold">{previousMayorName}</span> morreu ou foi expulso.
              </p>
              <p className="text-dark-300 mb-4">
                Vocês devem eleger um novo prefeito antes de continuar.
              </p>
              <p className="text-dark-300 mb-4">
                Vez de: <span className="text-primary-400 font-semibold">{alivePlayers[mayorReelectionVoterIndex].name}</span>
              </p>
              <div className="text-sm text-dark-400">
                Votação {mayorReelectionVoterIndex + 1} de {alivePlayers.length}
              </div>
            </div>

            {/* Mostrar votos até agora (se não for anônimo) */}
            {!config.mayorVotingAnonymous && Object.keys(mayorReelectionVotes).length > 0 && (
              <div className="bg-dark-700 rounded-lg p-2">
                <h4 className="font-semibold text-xs mb-1">📊 Votos até agora:</h4>
                <div className="flex gap-2">
                  <div className="w-1/2 text-xs">
                    {Object.entries(mayorReelectionVotes).slice(0, Math.ceil(Object.keys(mayorReelectionVotes).length / 2)).map(([voterId, targetId]) => {
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
                    {Object.entries(mayorReelectionVotes).slice(Math.ceil(Object.keys(mayorReelectionVotes).length / 2)).map(([voterId, targetId]) => {
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
                  onClick={() => handleMayorReelectionVote(player.id)}
                  className="px-4 py-2 rounded-lg border bg-dark-700 border-dark-600 hover:bg-dark-600 transition-all"
                >
                  <div className="font-medium">{player.name}</div>
                  {renderMayorReelectionVoteIndicators(getMayorReelectionVoteCount(player.id))}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 'mayor_reelection_result' && (
          <div className="space-y-6 text-center">
            <div className="text-6xl">👑</div>
            <h2 className="text-2xl font-bold">Nova Eleição de Prefeito</h2>
            
            <div className="bg-primary-900/30 border border-primary-700 rounded-lg p-6">
              <p className="text-lg">
                <strong>Novo Prefeito Eleito:</strong> {getMayorReelectionResultText()}
              </p>
              {mayorReelectionResult?.tied && (
                <p className="text-sm text-primary-300 mt-2">
                  Houve um empate e o vencedor foi sorteado.
                </p>
              )}
            </div>

            <button
              onClick={handleMayorReelectionComplete}
              className="btn-primary"
            >
              Continuar para Votação de Expulsão
            </button>
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
              <div className="bg-dark-700 rounded-lg p-2">
                <h4 className="font-semibold text-xs mb-1">📊 Votos até agora:</h4>
                <div className="flex gap-2">
                  <div className="w-1/2 text-xs">
                    {Object.entries(votes).slice(0, Math.ceil(Object.keys(votes).length / 2)).map(([voterId, targetId]) => {
                      const voter = players.find(p => p.id === voterId)
                      const target = targetId === 'no_expulsion' ? 'Não expulsar' : players.find(p => p.id === targetId)?.name
                      return (
                        <div key={voterId} className="text-dark-300">
                          {voter?.name} → {target}
                        </div>
                      )
                    })}
                  </div>
                  <div className="w-1/2 text-xs">
                    {Object.entries(votes).slice(Math.ceil(Object.keys(votes).length / 2)).map(([voterId, targetId]) => {
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
              </div>
            )}

            <div className="space-y-3">
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

              {/* Opção de não expulsar (se permitido) */}
              {config.allowNoExpulsionVote && (
                <button
                  onClick={() => handleVote('no_expulsion')}
                  className="w-full px-4 py-2 rounded-lg border bg-green-700 border-green-600 hover:bg-green-600 transition-all"
                >
                  <div className="font-medium">Não Expulsar</div>
                  {renderVoteIndicators(getNoExpulsionVoteCount())}
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
            <div className="grid grid-cols-3 gap-3">
                {votingResult?.tiedPlayers.map(playerId => {
                    const player = players.find(p => p.id === playerId);
                    return player ? (
                        <button
                            key={player.id}
                            onClick={() => handleMayorTieChoice(player.id)}
                            className="px-4 py-2 rounded-lg border bg-red-900/50 border-red-700 hover:bg-red-800/50 transition-all"
                        >
                            <div className="font-medium">{player.name}</div>
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
