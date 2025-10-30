// Enums para os tipos básicos
export enum CharacterClass {
  // Classes do Bem
  ALDEAO = 'aldeao',
  MEDIUM = 'medium',
  VIDENTE = 'vidente',
  CUPIDO = 'cupido',
  TALISMA = 'talisma',
  BRUXA = 'bruxa',
  BALA_DE_PRATA = 'bala_de_prata',
  GUARDIAO = 'guardiao',
  HEMOMANTE = 'hemomante',
  HEROI = 'heroi',

  // Classes do Mal
  BOBO = 'bobo',
  TRAIDOR = 'traidor',
  ZUMBI = 'zumbi',
  VAMPIRO = 'vampiro',
  LOBISOMEM = 'lobisomem',
  LOBISOMEM_VOODOO = 'lobisomem_voodoo',
  LOBISOMEM_MORDACA = 'lobisomem_mordaca',

  // Classe Especial
  OCCULT = 'occult'
}

export enum Team {
  GOOD = 'good',
  EVIL = 'evil',
  NEUTRAL = 'neutral'
}

export enum GamePhase {
  SETUP = 'setup',
  CHARACTER_DISTRIBUTION = 'character_distribution',
  MAYOR_VOTING = 'mayor_voting',
  NIGHT = 'night',
  SILVER_BULLET_NIGHT = 'silver_bullet_night', // Quando Bala de Prata morre durante a noite
  DAY = 'day',
  VOTING = 'voting',
  SILVER_BULLET_DAY = 'silver_bullet_day', // Quando Bala de Prata é expulso durante o dia
  ENDED = 'ended'
}

export enum ActionType {
  KILL = 'kill',
  PROTECT = 'protect',
  INVESTIGATE = 'investigate',
  HEAL = 'heal',
  POISON = 'poison',
  INFECT = 'infect',
  SILENCE = 'silence',
  BLOOD_BOND = 'blood_bond',
  COPY_ROLE = 'copy_role',
  SHOOT = 'shoot',
  VOTE = 'vote'
}

// Interfaces principais
export interface Player {
  id: string;
  name: string;
  character: CharacterClass;
  originalCharacter?: CharacterClass; // Para Occult
  team: Team;
  isAlive: boolean;
  isSilenced: boolean;
  isInfected: boolean;
  hasProtection: boolean; // Para Talismã
  isInLove: boolean;
  lovePartnerId?: string;
  bloodBondPartnerId?: string;
}

export interface GameAction {
  id: string;
  playerId: string;
  type: ActionType;
  targetId?: string;
  targetIds?: string[]; // Para ações que afetam múltiplos jogadores
  data?: any; // Dados específicos da ação
  phase: GamePhase;
  night: number;
}

export interface GameConfig {
  numberOfPlayers: number;
  numberOfWerewolves: number;
  numberOfAlternativeEvil: number; // Vampiro, Traidor, Zumbi, Bobo
  allowedClasses: CharacterClass[];
  discussionTime: number; // em minutos
  gameMode?: 'classic' | 'sapatinho';
  mayorVotingAnonymous: boolean;
  expulsionVotingAnonymous: boolean;
  allowNoExpulsionVote: boolean;
  silverBulletKillsWhenExpelled: boolean;
  silverBulletKillsWhenDead: boolean;
  silverBulletIgnoresTalisman: boolean;
  werewolfGagMode: 'per_game' | 'cooldown';
  werewolfGagValue: number; // x vezes por partida ou cooldown de x noites
  debugMode?: boolean;
}

export interface GameState {
  id: string;
  config: GameConfig;
  players: Player[];
  currentPhase: GamePhase;
  currentNight: number;
  currentDay: number;
  mayorId?: string;
  actions: GameAction[];
  deadPlayers: Player[];
  winners: string[]; // IDs dos jogadores vencedores
  winningTeam?: Team;
  isGameEnded: boolean;
  discussionEndTime?: Date;
  witchPotions?: WitchPotions; // Controle das poções da bruxa
  usedAbilities?: { [playerId: string]: string[] }; // Controle de habilidades usadas por jogador
  pendingSilverBulletPlayer?: Player; // Bala de Prata pendente para atirar
}

// Tipos para ações específicas dos personagens
export interface WitchPotions {
  healingPotion: boolean;
  poisonPotion: boolean;
}

export interface VoodooWerewolfAction {
  targetId: string;
  guessedClass: CharacterClass;
}

export interface VotingResult {
  votes: { [playerId: string]: string }; // playerId -> targetId
  result: string; // ID do jogador mais votado
  tied: boolean;
  tiedPlayers: string[];
}

// Constantes úteis
export const GOOD_CLASSES: CharacterClass[] = [
  CharacterClass.ALDEAO,
  CharacterClass.MEDIUM,
  CharacterClass.VIDENTE,
  CharacterClass.CUPIDO,
  CharacterClass.TALISMA,
  CharacterClass.BRUXA,
  CharacterClass.BALA_DE_PRATA,
  CharacterClass.GUARDIAO,
  CharacterClass.HEMOMANTE,
  CharacterClass.HEROI
];

export const EVIL_CLASSES: CharacterClass[] = [
  CharacterClass.BOBO,
  CharacterClass.TRAIDOR,
  CharacterClass.ZUMBI,
  CharacterClass.VAMPIRO,
  CharacterClass.LOBISOMEM,
  CharacterClass.LOBISOMEM_VOODOO,
  CharacterClass.LOBISOMEM_MORDACA
];

export const WEREWOLF_CLASSES: CharacterClass[] = [
  CharacterClass.LOBISOMEM,
  CharacterClass.LOBISOMEM_VOODOO,
  CharacterClass.LOBISOMEM_MORDACA
];

export const CHARACTER_NAMES: { [key in CharacterClass]: string } = {
  [CharacterClass.ALDEAO]: 'Aldeão',
  [CharacterClass.MEDIUM]: 'Médium',
  [CharacterClass.VIDENTE]: 'Vidente',
  [CharacterClass.CUPIDO]: 'Cupido',
  [CharacterClass.TALISMA]: 'Talismã',
  [CharacterClass.OCCULT]: 'Occult',
  [CharacterClass.BRUXA]: 'Bruxa',
  [CharacterClass.BALA_DE_PRATA]: 'Bala de Prata',
  [CharacterClass.GUARDIAO]: 'Guardião',
  [CharacterClass.HEMOMANTE]: 'Hemomante',
  [CharacterClass.HEROI]: 'Herói',
  [CharacterClass.BOBO]: 'Bobo',
  [CharacterClass.TRAIDOR]: 'Traidor',
  [CharacterClass.ZUMBI]: 'Zumbi',
  [CharacterClass.VAMPIRO]: 'Vampiro',
  [CharacterClass.LOBISOMEM]: 'Lobisomem',
  [CharacterClass.LOBISOMEM_VOODOO]: 'Lobisomem Voodoo',
  [CharacterClass.LOBISOMEM_MORDACA]: 'Lobisomem Mordaça'
};

export const CHARACTER_DESCRIPTIONS: { [key in CharacterClass]: string } = {
  [CharacterClass.ALDEAO]: 'Não possui nenhuma habilidade especial',
  [CharacterClass.MEDIUM]: 'Uma vez por partida, pode ver a classe de alguém que morreu',
  [CharacterClass.VIDENTE]: 'Toda noite, pode ver a índole de um jogador (bom ou mau)',
  [CharacterClass.CUPIDO]: 'No início da partida, apaixona dois jogadores. Caso um dos dois apaixonados morra ou seja eliminado, o outro também é. Vence caso os dois apaixonados fiquem vivos até o fim',
  [CharacterClass.TALISMA]: 'Possui um talismã que o protege contra uma tentativa de assassinato. Ainda pode ser expulso normalmente',
  [CharacterClass.OCCULT]: 'No início da partida, escolhe alguém para copiar, e assume o mesmo papel que ele pelo resto da partida',
  [CharacterClass.BRUXA]: 'Possui uma poção de cura, para salvar uma pessoa que foi atacada, e uma poção envenenada, para matar alguém',
  [CharacterClass.BALA_DE_PRATA]: 'Ao morrer ou ser expulso, atira em uma pessoa de sua escolha',
  [CharacterClass.GUARDIAO]: 'Protege uma pessoa por noite contra tentativas de assassinato',
  [CharacterClass.HEMOMANTE]: 'Pode fazer uma ligação de sangue irreversível com uma pessoa uma vez por partida. Se um dos dois for morto, o outro também é',
  [CharacterClass.HEROI]: 'Uma vez por partida, pode matar alguém. Se o alvo não for mau, o herói também morre',
  [CharacterClass.BOBO]: 'Deve ser expulso para vencer',
  [CharacterClass.TRAIDOR]: 'Não possui nenhuma habilidade especial. Deve ajudar os lobisomens a vencer, e vence junto com eles',
  [CharacterClass.ZUMBI]: 'A cada noite, escolhe uma pessoa para infectar (a pessoa não fica sabendo). Vence caso todas as pessoas vivas estejam infectadas (exceto ele mesmo)',
  [CharacterClass.VAMPIRO]: 'Escolhe uma pessoa para matar por noite. Atua sozinho (não faz parte da equipe de lobisomens)',
  [CharacterClass.LOBISOMEM]: 'Escolhe, juntamente aos outros lobisomens (de todos os tipos), uma pessoa para ser devorada por noite',
  [CharacterClass.LOBISOMEM_VOODOO]: 'Escolhe, juntamente aos outros lobisomens (de todos os tipos), uma pessoa para ser devorada por noite. Além disso, pode matar uma pessoa a mais caso saiba sua classe. Se errar, morre. Essa habilidade ignora a proteção do talismã e do guardião',
  [CharacterClass.LOBISOMEM_MORDACA]: 'Escolhe, juntamente aos outros lobisomens (de todos os tipos), uma pessoa para ser devorada por noite. Uma vez por partida, pode amordaçar alguém, que não poderá falar no dia seguinte'
};
