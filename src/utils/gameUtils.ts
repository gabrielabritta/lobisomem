import type {
  Player,
  GameState,
  GameConfig
} from '../types/game';
import {
  CharacterClass,
  Team,
  GOOD_CLASSES,
  EVIL_CLASSES,
  WEREWOLF_CLASSES
} from '../types/game';

// Função para determinar o time de uma classe
export function getCharacterTeam(character: CharacterClass): Team {
  if (GOOD_CLASSES.includes(character)) {
    return Team.GOOD;
  }
  if (EVIL_CLASSES.includes(character)) {
    return Team.EVIL;
  }
  return Team.NEUTRAL; // Para Occult antes de copiar
}

// Função para verificar se uma classe é lobisomem
export function isWerewolf(character: CharacterClass): boolean {
  return WEREWOLF_CLASSES.includes(character);
}

// Função para distribuir classes aleatoriamente
export function distributeCharacters(
  playerNames: string[],
  config: GameConfig
): Player[] {
  const players: Player[] = [];
  const availableClasses = [...config.allowedClasses];

  // Garantir que temos lobisomens suficientes
  const werewolfClasses = availableClasses.filter(cls => isWerewolf(cls));
  const nonWerewolfClasses = availableClasses.filter(cls => !isWerewolf(cls));

  // Distribuir classes obrigatórias primeiro
  const selectedClasses: CharacterClass[] = [];

  // Adicionar lobisomens (podem ser repetidos apenas o LOBISOMEM comum)
  for (let i = 0; i < config.numberOfWerewolves; i++) {
    if (werewolfClasses.length > 0) {
      // Se já temos um lobisomem especial, só permitir lobisomem comum
      const alreadyHasSpecialWerewolf = selectedClasses.some(cls => 
        cls === CharacterClass.LOBISOMEM_VOODOO || cls === CharacterClass.LOBISOMEM_MORDACA
      );
      
      if (alreadyHasSpecialWerewolf) {
        // Só pode adicionar lobisomem comum
        selectedClasses.push(CharacterClass.LOBISOMEM);
      } else {
        // Pode escolher qualquer lobisomem disponível
        const availableWerewolves = werewolfClasses.filter(cls => 
          !selectedClasses.includes(cls) || cls === CharacterClass.LOBISOMEM
        );
        
        if (availableWerewolves.length > 0) {
          const randomIndex = Math.floor(Math.random() * availableWerewolves.length);
          selectedClasses.push(availableWerewolves[randomIndex]);
        } else {
          selectedClasses.push(CharacterClass.LOBISOMEM);
        }
      }
    } else {
      selectedClasses.push(CharacterClass.LOBISOMEM); // Fallback
    }
  }

  // Adicionar classes más alternativas (máximo 1 de cada)
  const alternativeEvilClasses = nonWerewolfClasses.filter(cls =>
    [CharacterClass.VAMPIRO, CharacterClass.TRAIDOR, CharacterClass.ZUMBI, CharacterClass.BOBO].includes(cls)
  );

  for (let i = 0; i < config.numberOfAlternativeEvil; i++) {
    const availableAlternatives = alternativeEvilClasses.filter(cls => !selectedClasses.includes(cls));
    if (availableAlternatives.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableAlternatives.length);
      selectedClasses.push(availableAlternatives[randomIndex]);
    }
  }

  // Preencher o restante com classes disponíveis
  const remainingSlots = config.numberOfPlayers - selectedClasses.length;
  
  // Primeiro, adicionar todas as classes únicas disponíveis (exceto aldeão)
  const uniqueClassesNotUsed = nonWerewolfClasses.filter(cls => 
    cls !== CharacterClass.ALDEAO && !selectedClasses.includes(cls)
  );
  
  for (let i = 0; i < remainingSlots && uniqueClassesNotUsed.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * uniqueClassesNotUsed.length);
    const selectedClass = uniqueClassesNotUsed.splice(randomIndex, 1)[0];
    selectedClasses.push(selectedClass);
  }
  
  // Se ainda há slots restantes, preencher com aldeões
  const stillRemainingSlots = config.numberOfPlayers - selectedClasses.length;
  for (let i = 0; i < stillRemainingSlots; i++) {
    selectedClasses.push(CharacterClass.ALDEAO);
  }

  // Embaralhar classes
  for (let i = selectedClasses.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selectedClasses[i], selectedClasses[j]] = [selectedClasses[j], selectedClasses[i]];
  }

  // Criar jogadores
  for (let i = 0; i < playerNames.length; i++) {
    const character = selectedClasses[i];
    players.push({
      id: `player_${i + 1}`,
      name: playerNames[i],
      character,
      team: getCharacterTeam(character),
      isAlive: true,
      isSilenced: false,
      isInfected: character === CharacterClass.ZUMBI, // Zumbi começa infectado
      hasProtection: character === CharacterClass.TALISMA,
      isInLove: false
    });
  }

  return players;
}

// Função para verificar se o Cupido vence (dois apaixonados vivos)
function checkCupidVictory(alivePlayers: Player[], cupidPlayer: Player | undefined): boolean {
  if (!cupidPlayer) return false;
  const loversAlive = alivePlayers.filter(p => p.isInLove);
  return loversAlive.length === 2;
}

// Função para obter os vencedores do Cupido (Cupido + apaixonados vivos)
function getCupidWinners(alivePlayers: Player[], cupidPlayer: Player | undefined): string[] {
  if (!cupidPlayer) return [];
  const loversAlive = alivePlayers.filter(p => p.isInLove);
  if (loversAlive.length === 2) {
    return [cupidPlayer.id, ...loversAlive.map(p => p.id)];
  }
  return [];
}

// Função para verificar condições de vitória
export function checkVictoryConditions(gameState: GameState): {
  hasWinner: boolean;
  winners: string[];
  winningTeam?: Team;
  reason: string;
} {
  const alivePlayers = gameState.players.filter(p => p.isAlive);
  const aliveWerewolves = alivePlayers.filter(p => isWerewolf(p.character));
  const aliveGood = alivePlayers.filter(p => p.team === Team.GOOD);
  const aliveVampire = alivePlayers.find(p => p.character === CharacterClass.VAMPIRO);
  const aliveZombie = alivePlayers.find(p => p.character === CharacterClass.ZUMBI);
  const cupidPlayer = gameState.players.find(p => p.character === CharacterClass.CUPIDO);

  console.log('Verificando condições de vitória:', {
    totalAlive: alivePlayers.length,
    aliveWerewolves: aliveWerewolves.length,
    aliveVampire: aliveVampire ? aliveVampire.name : null,
    aliveZombie: aliveZombie ? aliveZombie.name : null
  })

  // 1. Verificar vitória do Zumbi PRIMEIRO (prioridade máxima - todos infectados)
  if (aliveZombie) {
    const nonZombiePlayers = alivePlayers.filter(p => p.character !== CharacterClass.ZUMBI);
    const allInfected = nonZombiePlayers.every(p => p.isInfected);

    if (allInfected) {
      // Cupido NÃO vence com Zumbi (regra específica)
      return {
        hasWinner: true,
        winners: [aliveZombie.id],
        winningTeam: Team.EVIL,
        reason: 'Zumbi venceu - todos os jogadores foram infectados'
      };
    }
  }

  // 2. Verificar vitória do Vampiro (sobrou apenas ele e mais um)
  if (aliveVampire && alivePlayers.length === 2) {
    console.log('Vampiro venceu!', { aliveVampire: aliveVampire.name, alivePlayers: alivePlayers.length })
    
    let winners = [aliveVampire.id];
    
    // Adicionar vencedores do Cupido (Cupido + apaixonados vivos)
    const cupidWinners = getCupidWinners(alivePlayers, cupidPlayer);
    winners.push(...cupidWinners);
    
    return {
      hasWinner: true,
      winners,
      winningTeam: Team.EVIL,
      reason: 'Vampiro venceu - restaram apenas 2 jogadores'
    };
  }

  // 3. Verificar vitória dos Lobisomens (número >= não-lobisomens)
  if (aliveWerewolves.length >= (alivePlayers.length - aliveWerewolves.length)) {
    const werewolfIds = aliveWerewolves.map(p => p.id);
    const traitorIds = alivePlayers
      .filter(p => p.character === CharacterClass.TRAIDOR)
      .map(p => p.id);

    let winners = [...werewolfIds, ...traitorIds];
    
    // Adicionar vencedores do Cupido (Cupido + apaixonados vivos)
    const cupidWinners = getCupidWinners(alivePlayers, cupidPlayer);
    winners.push(...cupidWinners);

    return {
      hasWinner: true,
      winners,
      winningTeam: Team.EVIL,
      reason: 'Lobisomens venceram - número igual ou superior aos não-lobisomens'
    };
  }

  // Verificar vitória dos Inocentes (não há mais lobisomens ou vampiros)
  if (aliveWerewolves.length === 0 && !aliveVampire && !aliveZombie) {
    let winners = aliveGood.map(p => p.id);
    
    // Adicionar vencedores do Cupido (Cupido + apaixonados vivos)
    const cupidWinners = getCupidWinners(alivePlayers, cupidPlayer);
    winners.push(...cupidWinners);
    
    return {
      hasWinner: true,
      winners,
      winningTeam: Team.GOOD,
      reason: 'Inocentes venceram - eliminaram todas as ameaças'
    };
  }

  return {
    hasWinner: false,
    winners: [],
    reason: 'Jogo continua'
  };
}

// Função para aplicar morte por amor
export function applyLoveDeath(players: Player[], deadPlayerId: string): string[] {
  const deadPlayer = players.find(p => p.id === deadPlayerId);
  const newDeaths: string[] = [];

  if (deadPlayer?.isInLove && deadPlayer.lovePartnerId) {
    const lover = players.find(p => p.id === deadPlayer.lovePartnerId);
    if (lover?.isAlive) {
      lover.isAlive = false;
      newDeaths.push(lover.id);
    }
  }

  return newDeaths;
}

// Função para aplicar morte por ligação de sangue
export function applyBloodBondDeath(players: Player[], deadPlayerId: string): string[] {
  const deadPlayer = players.find(p => p.id === deadPlayerId);
  const newDeaths: string[] = [];

  if (deadPlayer?.bloodBondPartnerId) {
    const bondedPlayer = players.find(p => p.id === deadPlayer.bloodBondPartnerId);
    if (bondedPlayer?.isAlive) {
      bondedPlayer.isAlive = false;
      newDeaths.push(bondedPlayer.id);
    }
  }

  return newDeaths;
}

// Função para processar votos
export function processVotes(votes: { [playerId: string]: string }): {
  winner: string | null;
  tied: boolean;
  tiedPlayers: string[];
} {
  const voteCount: { [targetId: string]: number } = {};

  // Count all votes
  Object.values(votes).forEach(targetId => {
    voteCount[targetId] = (voteCount[targetId] || 0) + 1;
  });

  if (Object.keys(voteCount).length === 0) {
    return { winner: null, tied: false, tiedPlayers: [] };
  }

  // Find the highest vote count
  const maxVotes = Math.max(...Object.values(voteCount));
  
  // Get all candidates (players and 'no_expulsion') with the highest vote count
  const topCandidates = Object.keys(voteCount).filter(id => voteCount[id] === maxVotes);

  // Get the number of votes for 'no_expulsion', defaulting to 0
  const noExpulsionVotes = voteCount['no_expulsion'] || 0;

  // If 'no_expulsion' has the most votes (or is tied for the most), nobody is expelled.
  if (noExpulsionVotes === maxVotes) {
    return { winner: null, tied: false, tiedPlayers: [] };
  }

  // If we reach here, 'no_expulsion' did not have the most votes.
  // The winner must be a player.
  if (topCandidates.length === 1) {
    // A single player had the most votes.
    return { winner: topCandidates[0], tied: false, tiedPlayers: [] };
  } else {
    // A tie between two or more players. Return the tied players and let the caller handle it.
    return {
      winner: null, // No winner yet
      tied: true,
      tiedPlayers: topCandidates
    };
  }
}

// Chaves para o localStorage
const CONFIG_CACHE_KEY = 'lobisomem_game_config';
const PLAYER_NAMES_CACHE_KEY = 'lobisomem_player_names';

// Função para salvar configurações no cache
export function saveConfigToCache(config: GameConfig): void {
  try {
    localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(config));
  } catch (error) {
    console.warn('Erro ao salvar configurações no cache:', error);
  }
}

// Função para salvar nomes dos jogadores no cache
export function savePlayerNamesToCache(playerNames: string[]): void {
  try {
    localStorage.setItem(PLAYER_NAMES_CACHE_KEY, JSON.stringify(playerNames));
  } catch (error) {
    console.warn('Erro ao salvar nomes dos jogadores no cache:', error);
  }
}

// Função para carregar configurações do cache
export function loadConfigFromCache(): GameConfig | null {
  try {
    const cached = localStorage.getItem(CONFIG_CACHE_KEY);
    if (cached) {
      const config = JSON.parse(cached) as GameConfig;
      // Validar se a configuração tem todos os campos necessários
      const defaultConfig = createDefaultConfig();
      return {
        ...defaultConfig,
        ...config,
        // Garantir que allowedClasses seja um array válido
        allowedClasses: Array.isArray(config.allowedClasses) ? config.allowedClasses : defaultConfig.allowedClasses
      };
    }
  } catch (error) {
    console.warn('Erro ao carregar configurações do cache:', error);
  }
  return null;
}

// Função para carregar nomes dos jogadores do cache
export function loadPlayerNamesFromCache(): string[] | null {
  try {
    const cached = localStorage.getItem(PLAYER_NAMES_CACHE_KEY);
    if (cached) {
      const playerNames = JSON.parse(cached) as string[];
      if (Array.isArray(playerNames)) {
        return playerNames;
      }
    }
  } catch (error) {
    console.warn('Erro ao carregar nomes dos jogadores do cache:', error);
  }
  return null;
}

// Função para limpar cache
export function clearConfigCache(): void {
  try {
    localStorage.removeItem(CONFIG_CACHE_KEY);
    localStorage.removeItem(PLAYER_NAMES_CACHE_KEY);
  } catch (error) {
    console.warn('Erro ao limpar cache:', error);
  }
}

// Função para gerar configuração padrão
export function createDefaultConfig(): GameConfig {
  return {
    numberOfPlayers: 8,
    numberOfWerewolves: 2,
    numberOfAlternativeEvil: 1,
    allowedClasses: [
      CharacterClass.ALDEAO,
      CharacterClass.VIDENTE,
      CharacterClass.CUPIDO,
      CharacterClass.GUARDIAO,
      CharacterClass.BRUXA,
      CharacterClass.LOBISOMEM,
      CharacterClass.VAMPIRO
    ],
    discussionTime: 5,
    mayorVotingAnonymous: false,
    expulsionVotingAnonymous: false,
    allowNoExpulsionVote: true,
    silverBulletKillsWhenExpelled: true,
    silverBulletKillsWhenDead: true,
    silverBulletIgnoresTalisman: false,
    werewolfGagMode: 'per_game',
    werewolfGagValue: 1,
    debugMode: false
  };
}