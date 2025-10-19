import { useState } from 'react'
import type { GameState, Player, GameAction } from '../types/game'
import { GamePhase, CHARACTER_NAMES, CharacterClass } from '../types/game'
import CharacterDistribution from './CharacterDistribution'
import InitialActions from './InitialActions'
import MayorVoting from './MayorVoting'
import NightPhase from './NightPhase'
import DayPhase from './DayPhase'
import SilverBulletPhase from './SilverBulletPhase'
import GameStatusModal from './GameStatusModal'
import { resolveNightActions, processSilverBulletShot } from '../utils/actionResolver'
import { checkVictoryConditions, applyLoveDeath, applyBloodBondDeath } from '../utils/gameUtils'

interface GameProps {
  gameState: GameState
  onGameReset: () => void
}

export default function Game({ gameState, onGameReset }: GameProps) {
  const [currentGameState, setCurrentGameState] = useState<GameState>(gameState)
  const [nightResults, setNightResults] = useState<{
    deadPlayers: string[]
    messages: string[]
    investigations: { [playerId: string]: any }
  }>({ deadPlayers: [], messages: [], investigations: {} })
  const [showGameStatus, setShowGameStatus] = useState(false)

  const handleDistributionComplete = () => {
    if (currentGameState.config.debugMode) {
      let updatedPlayers = [...currentGameState.players];

      const occultPlayer = updatedPlayers.find(p => p.character === CharacterClass.OCCULT);
      if (occultPlayer) {
        const possibleTargets = updatedPlayers.filter(p => p.id !== occultPlayer.id);
        if (possibleTargets.length > 0) {
          const target = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
          updatedPlayers = updatedPlayers.map(p => 
            p.id === occultPlayer.id 
              ? { ...p, originalCharacter: p.character, character: target.character, team: target.team } 
              : p
          );
        }
      }

      const cupidPlayer = updatedPlayers.find(p => p.character === CharacterClass.CUPIDO);
      if (cupidPlayer) {
        const possibleLovers = updatedPlayers.filter(p => p.id !== cupidPlayer.id);
        if (possibleLovers.length >= 2) {
          const lover1Index = Math.floor(Math.random() * possibleLovers.length);
          const lover1 = possibleLovers[lover1Index];
          possibleLovers.splice(lover1Index, 1);
          const lover2 = possibleLovers[Math.floor(Math.random() * possibleLovers.length)];

          updatedPlayers = updatedPlayers.map(p => {
            if (p.id === lover1.id) {
              return { ...p, isInLove: true, lovePartnerId: lover2.id };
            }
            if (p.id === lover2.id) {
              return { ...p, isInLove: true, lovePartnerId: lover1.id };
            }
            return p;
          });
        }
      }

      handleInitialActionsComplete(updatedPlayers);
    } else {
      setCurrentGameState(prev => ({
        ...prev,
        currentPhase: GamePhase.SETUP // Mover para ações iniciais
      }))
    }
  }

  const handleInitialActionsComplete = (updatedPlayers: Player[]) => {
    setCurrentGameState(prev => ({
      ...prev,
      players: updatedPlayers,
      currentPhase: GamePhase.MAYOR_VOTING
    }))
  }

  const handleMayorVotingComplete = (mayorId: string) => {
    setCurrentGameState(prev => ({
      ...prev,
      mayorId,
      currentPhase: GamePhase.NIGHT,
      currentNight: 1
    }))
  }

  const handleNightComplete = (actions: GameAction[], updatedPlayers: Player[], updatedGameState?: Partial<GameState>) => {
    // Resolver ações da noite
    const results = resolveNightActions(updatedPlayers, actions)

    // Atualizar jogadores mortos
    const finalPlayers = results.updatedPlayers.map(player => ({
      ...player,
      isAlive: player.isAlive && !results.deadPlayers.includes(player.id)
    }))

    // Verificar condições de vitória
    const victoryCheck = checkVictoryConditions({
      ...currentGameState,
      players: finalPlayers
    })

    console.log('Verificação de vitória:', {
      hasWinner: victoryCheck.hasWinner,
      reason: victoryCheck.reason,
      winners: victoryCheck.winners,
      alivePlayers: finalPlayers.filter(p => p.isAlive).length,
      aliveWerewolves: finalPlayers.filter(p => p.character.includes('lobisomem') && p.isAlive).length,
      aliveVampire: finalPlayers.find(p => p.character === 'vampiro' && p.isAlive)
    })

    setNightResults({
      deadPlayers: results.deadPlayers,
      messages: results.messages,
      investigations: results.investigations
    })

    // Verificar se algum Bala de Prata morreu durante a noite
    const deadSilverBullet = results.deadPlayers
      .map(id => finalPlayers.find(p => p.id === id))
      .find(p => p && p.character === CharacterClass.BALA_DE_PRATA && currentGameState.config.silverBulletKillsWhenDead)

    const nextPhase = victoryCheck.hasWinner 
      ? GamePhase.ENDED 
      : deadSilverBullet 
        ? GamePhase.SILVER_BULLET_NIGHT 
        : GamePhase.DAY

    setCurrentGameState(prev => ({
      ...prev,
      players: finalPlayers,
      actions: [...prev.actions, ...actions],
      currentPhase: nextPhase,
      currentDay: prev.currentNight,
      deadPlayers: [...prev.deadPlayers, ...results.deadPlayers.map(id => finalPlayers.find(p => p.id === id)!).filter(Boolean)],
      isGameEnded: victoryCheck.hasWinner,
      winners: victoryCheck.winners,
      winningTeam: victoryCheck.winningTeam,
      usedAbilities: updatedGameState?.usedAbilities ? { ...prev.usedAbilities, ...updatedGameState.usedAbilities } : prev.usedAbilities,
      witchPotions: updatedGameState?.witchPotions || prev.witchPotions
    }))
  }

  const handleDayComplete = (expelledPlayerId?: string, newMayorId?: string, updatedPlayers?: Player[]) => {
    let finalPlayers = updatedPlayers || currentGameState.players
    let newDeadPlayers: string[] = []

    if (expelledPlayerId) {
      // Aplicar expulsão
      finalPlayers = finalPlayers.map(p =>
        p.id === expelledPlayerId ? { ...p, isAlive: false } : p
      )
      newDeadPlayers.push(expelledPlayerId)

      // Verificar se foi o Bobo (vitória do Bobo)
      const expelledPlayer = finalPlayers.find(p => p.id === expelledPlayerId)
      if (expelledPlayer?.character === 'bobo') {
        setCurrentGameState(prev => ({
          ...prev,
          players: finalPlayers,
          mayorId: newMayorId || prev.mayorId,
          currentPhase: GamePhase.ENDED,
          isGameEnded: true,
          winners: [expelledPlayerId],
          winningTeam: 'evil' as any
        }))
        return
      }

      // Aplicar mortes por amor e ligação de sangue
      const loveDeaths = applyLoveDeath(finalPlayers, expelledPlayerId)
      const bloodDeaths = applyBloodBondDeath(finalPlayers, expelledPlayerId)
      newDeadPlayers.push(...loveDeaths, ...bloodDeaths)
    }

    // Limpar silenciamentos
    finalPlayers = finalPlayers.map(p => ({ ...p, isSilenced: false }))

    // Verificar condições de vitória
    const victoryCheck = checkVictoryConditions({
      ...currentGameState,
      players: finalPlayers
    })

    // Verificar se o Bala de Prata foi expulso
    const expelledSilverBullet = expelledPlayerId 
      ? finalPlayers.find(p => p.id === expelledPlayerId && p.character === CharacterClass.BALA_DE_PRATA)
      : null

    const shouldShowSilverBulletPhase = expelledSilverBullet && currentGameState.config.silverBulletKillsWhenExpelled

    const nextPhase = victoryCheck.hasWinner 
      ? GamePhase.ENDED 
      : shouldShowSilverBulletPhase 
        ? GamePhase.SILVER_BULLET_DAY 
        : GamePhase.NIGHT

    setCurrentGameState(prev => ({
      ...prev,
      players: finalPlayers,
      mayorId: newMayorId || prev.mayorId,
      currentPhase: nextPhase,
      currentNight: victoryCheck.hasWinner ? prev.currentNight : prev.currentNight + 1,
      deadPlayers: [...prev.deadPlayers, ...newDeadPlayers.map(id => finalPlayers.find(p => p.id === id)!).filter(Boolean)],
      isGameEnded: victoryCheck.hasWinner,
      winners: victoryCheck.winners,
      winningTeam: victoryCheck.winningTeam
    }))

    // Limpar resultados da noite anterior
    setNightResults({ deadPlayers: [], messages: [], investigations: {} })
  }

  const handleSilverBulletShot = (silverBulletPlayerId: string, targetId: string, trigger: 'night_death' | 'day_expulsion') => {
    if (!targetId) {
      // Bala de Prata decidiu não atirar
      const nextPhase = trigger === 'night_death' ? GamePhase.DAY : GamePhase.NIGHT
      const nextNight = trigger === 'day_expulsion' ? currentGameState.currentNight + 1 : currentGameState.currentNight
      
      setCurrentGameState(prev => ({
        ...prev,
        currentPhase: nextPhase,
        currentNight: nextNight
      }))
      return
    }

    // Processar o tiro
    const results = processSilverBulletShot(
      currentGameState.players,
      silverBulletPlayerId,
      targetId,
      currentGameState.config
    )

    // Atualizar jogadores
    const finalPlayers = results.updatedPlayers.map(player => ({
      ...player,
      isAlive: player.isAlive && !results.deadPlayers.includes(player.id)
    }))

    // Verificar condições de vitória
    const victoryCheck = checkVictoryConditions({
      ...currentGameState,
      players: finalPlayers
    })

    // Adicionar mensagens do tiro aos resultados da noite
    setNightResults(prev => ({
      ...prev,
      messages: [...prev.messages, ...results.messages]
    }))

    const nextPhase = victoryCheck.hasWinner 
      ? GamePhase.ENDED 
      : trigger === 'night_death' 
        ? GamePhase.DAY 
        : GamePhase.NIGHT

    const nextNight = trigger === 'day_expulsion' ? currentGameState.currentNight + 1 : currentGameState.currentNight

    setCurrentGameState(prev => ({
      ...prev,
      players: finalPlayers,
      currentPhase: nextPhase,
      currentNight: nextNight,
      deadPlayers: [...prev.deadPlayers, ...results.deadPlayers.map(id => finalPlayers.find(p => p.id === id)!).filter(Boolean)],
      isGameEnded: victoryCheck.hasWinner,
      winners: victoryCheck.winners,
      winningTeam: victoryCheck.winningTeam
    }))
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header com informações do jogo */}
      <div className="card mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">🐺 Lobisomem</h2>
            <p className="text-dark-300">
              Fase: <span className="text-primary-400 font-semibold">
                {currentGameState.currentPhase === GamePhase.CHARACTER_DISTRIBUTION && 'Distribuição de Classes'}
                {currentGameState.currentPhase === GamePhase.SETUP && 'Ações Iniciais'}
                {currentGameState.currentPhase === GamePhase.MAYOR_VOTING && 'Votação para Prefeito'}
                {currentGameState.currentPhase === GamePhase.NIGHT && `Noite ${currentGameState.currentNight}`}
                {currentGameState.currentPhase === GamePhase.DAY && `Dia ${currentGameState.currentDay}`}
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-dark-300">
              Jogadores: {currentGameState.players.length}
            </p>
            <p className="text-sm text-dark-300">
              Vivos: {currentGameState.players.filter(p => p.isAlive).length}
            </p>
            <div className="flex gap-2 mt-2">
              {/* Botão da planilha para o mestre */}
              <button
                onClick={() => setShowGameStatus(true)}
                className="btn-secondary text-sm px-3 py-1"
                title="Abrir modal com situação geral do jogo"
              >
                📊 Planilha
              </button>
              <button
                onClick={onGameReset}
                className="btn-secondary text-sm px-3 py-1"
              >
                🔄 Nova Partida
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Renderizar fase atual */}
      {currentGameState.currentPhase === GamePhase.CHARACTER_DISTRIBUTION && (
        <CharacterDistribution
          players={currentGameState.players}
          onDistributionComplete={handleDistributionComplete}
        />
      )}

      {currentGameState.currentPhase === GamePhase.SETUP && (
        <InitialActions
          players={currentGameState.players}
          onActionsComplete={handleInitialActionsComplete}
        />
      )}

      {currentGameState.currentPhase === GamePhase.MAYOR_VOTING && (
        <MayorVoting
          players={currentGameState.players}
          config={currentGameState.config}
          onVotingComplete={handleMayorVotingComplete}
        />
      )}

      {currentGameState.currentPhase === GamePhase.NIGHT && (
        <NightPhase
          players={currentGameState.players}
          nightNumber={currentGameState.currentNight}
          gameState={currentGameState}
          onNightComplete={handleNightComplete}
        />
      )}

      {currentGameState.currentPhase === GamePhase.SILVER_BULLET_NIGHT && (
        <SilverBulletPhase
          silverBulletPlayer={currentGameState.players.find(p => 
            p.character === CharacterClass.BALA_DE_PRATA && !p.isAlive
          )!}
          alivePlayers={currentGameState.players.filter(p => p.isAlive)}
          config={currentGameState.config}
          trigger="night_death"
          onShoot={(targetId) => handleSilverBulletShot(
            currentGameState.players.find(p => p.character === CharacterClass.BALA_DE_PRATA && !p.isAlive)!.id,
            targetId,
            'night_death'
          )}
        />
      )}

      {currentGameState.currentPhase === GamePhase.DAY && (
        <DayPhase
          players={currentGameState.players}
          dayNumber={currentGameState.currentDay}
          config={currentGameState.config}
          mayorId={currentGameState.mayorId}
          deadToday={nightResults.deadPlayers}
          nightMessages={nightResults.messages}
          investigations={nightResults.investigations}
          onDayComplete={handleDayComplete}
        />
      )}

      {currentGameState.currentPhase === GamePhase.SILVER_BULLET_DAY && (
        <SilverBulletPhase
          silverBulletPlayer={currentGameState.players.find(p => 
            p.character === CharacterClass.BALA_DE_PRATA && !p.isAlive
          )!}
          alivePlayers={currentGameState.players.filter(p => p.isAlive)}
          config={currentGameState.config}
          trigger="day_expulsion"
          onShoot={(targetId) => handleSilverBulletShot(
            currentGameState.players.find(p => p.character === CharacterClass.BALA_DE_PRATA && !p.isAlive)!.id,
            targetId,
            'day_expulsion'
          )}
        />
      )}

      {currentGameState.currentPhase === GamePhase.ENDED && (
        <div className="card">
          <div className="text-center space-y-6">
            <div className="text-6xl">🎉</div>
            <h3 className="text-3xl font-bold">Fim de Jogo!</h3>

            {currentGameState.winningTeam && (
              <div className={`p-6 rounded-lg ${
                currentGameState.winningTeam === 'good' ? 'bg-blue-900/30 border border-blue-700' : 
                currentGameState.winningTeam === 'evil' ? 'bg-red-900/30 border border-red-700' : 
                'bg-purple-900/30 border border-purple-700'
              }`}>
                <h4 className="text-xl font-semibold mb-4">
                  {currentGameState.winningTeam === 'good' ? '👼 Vitória dos Inocentes!' : 
                   currentGameState.winningTeam === 'evil' ? '😈 Vitória do Mal!' : 
                   '🎭 Vitória Especial!'}
                </h4>

                <div className="space-y-2">
                  <p className="font-semibold">Vencedores:</p>
                  {currentGameState.winners.map(winnerId => {
                    const winner = currentGameState.players.find(p => p.id === winnerId)
                    return winner ? (
                      <div key={winnerId} className="text-lg">
                        🏆 {winner.name} - {CHARACTER_NAMES[winner.character]}
                      </div>
                    ) : null
                  })}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-dark-700 rounded-lg p-4">
                <h5 className="font-semibold mb-3">👥 Jogadores Vivos</h5>
                {currentGameState.players.filter(p => p.isAlive).map(player => (
                  <div key={player.id} className="text-sm mb-1">
                    ✅ {player.name} - {CHARACTER_NAMES[player.character]}
                  </div>
                ))}
              </div>

              <div className="bg-dark-700 rounded-lg p-4">
                <h5 className="font-semibold mb-3">💀 Jogadores Mortos</h5>
                {currentGameState.deadPlayers.map(player => (
                  <div key={player.id} className="text-sm mb-1 text-dark-400">
                    ⚰️ {player.name} - {CHARACTER_NAMES[player.character]}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={onGameReset}
              className="btn-primary text-lg px-8 py-4"
            >
              🎮 Nova Partida
            </button>
          </div>
        </div>
      )}

      <GameStatusModal
        isOpen={showGameStatus}
        onClose={() => setShowGameStatus(false)}
        gameState={currentGameState}
      />
    </div>
  )
}
