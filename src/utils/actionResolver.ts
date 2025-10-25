import type {
  Player,
  GameAction,
  GameConfig
} from '../types/game'
import {
  ActionType,
  CharacterClass
} from '../types/game'
import { applyLoveDeath, applyBloodBondDeath } from './gameUtils'

export interface ActionResult {
  deadPlayers: string[]
  updatedPlayers: Player[]
  messages: string[]
  investigations: { [playerId: string]: any }
}

export function resolveNightActions(players: Player[], actions: GameAction[]): ActionResult {
  let updatedPlayers = [...players]
  const deadPlayers: string[] = []
  const messages: string[] = []
  const investigations: { [playerId: string]: any } = {}

  console.log('Resolvendo ações noturnas:', {
    totalPlayers: players.length,
    alivePlayers: players.filter(p => p.isAlive).length,
    actions: actions.length
  })

  // Separar ações por tipo para processar na ordem correta
  const protections = actions.filter(a => a.type === ActionType.PROTECT)
  const heals = actions.filter(a => a.type === ActionType.HEAL)
  const kills = actions.filter(a => a.type === ActionType.KILL)
  const poisons = actions.filter(a => a.type === ActionType.POISON)
  const shoots = actions.filter(a => a.type === ActionType.SHOOT)
  const infections = actions.filter(a => a.type === ActionType.INFECT)
  const silences = actions.filter(a => a.type === ActionType.SILENCE)
  const investigations_actions = actions.filter(a => a.type === ActionType.INVESTIGATE)
  const bloodBonds = actions.filter(a => a.type === ActionType.BLOOD_BOND)

  console.log('Ações por tipo:', {
    protections: protections.length,
    heals: heals.length,
    kills: kills.length,
    poisons: poisons.length,
    shoots: shoots.length,
    infections: infections.length,
    silences: silences.length,
    investigations: investigations_actions.length,
    bloodBonds: bloodBonds.length
  })

  // 1. Aplicar proteções
  const protectedPlayers = new Set<string>()
  protections.forEach(action => {
    if (action.targetId) {
      protectedPlayers.add(action.targetId)
      const protector = updatedPlayers.find(p => p.id === action.playerId)
      const target = updatedPlayers.find(p => p.id === action.targetId)
      if (protector && target) {
        messages.push(`${protector.name} protegeu ${target.name} esta noite.`)
      }
    }
  })

  // 2. Aplicar ligações de sangue
  bloodBonds.forEach(action => {
    if (action.targetId) {
      const caster = updatedPlayers.find(p => p.id === action.playerId)
      const target = updatedPlayers.find(p => p.id === action.targetId)

      if (caster && target) {
        updatedPlayers = updatedPlayers.map(p => {
          if (p.id === caster.id) {
            return { ...p, bloodBondPartnerId: target.id }
          }
          if (p.id === target.id) {
            return { ...p, bloodBondPartnerId: caster.id }
          }
          return p
        })
        messages.push(`${caster.name} criou uma ligação de sangue com ${target.name}.`)
      }
    }
  })

  // 3. Processar tentativas de morte
  const killTargets = new Set<string>()
  const healedPlayers = new Set<string>()

  // Coletar todos os alvos de morte
  kills.forEach(action => {
    if (action.targetId) {
      killTargets.add(action.targetId)
    }
  })

  poisons.forEach(action => {
    if (action.targetId) {
      killTargets.add(action.targetId)
    }
  })

  // Aplicar curas
  heals.forEach(action => {
    if (action.targetId && killTargets.has(action.targetId)) {
      healedPlayers.add(action.targetId)
      const healer = updatedPlayers.find(p => p.id === action.playerId)
      const target = updatedPlayers.find(p => p.id === action.targetId)
      if (healer && target) {
        messages.push(`${healer.name} salvou ${target.name} de um ataque.`)
      }
    }
  })

  // Aplicar mortes (considerando proteções, curas e talismãs)
  killTargets.forEach(targetId => {
    const target = updatedPlayers.find(p => p.id === targetId)
    if (!target || !target.isAlive) return

    const isHealed = healedPlayers.has(targetId)
    const isProtected = protectedPlayers.has(targetId)
    const hasTalisman = target.hasProtection && target.character === CharacterClass.TALISMA

    if (!isHealed && !isProtected && !hasTalisman) {
      // Matar o jogador
      updatedPlayers = updatedPlayers.map(p =>
        p.id === targetId ? { ...p, isAlive: false } : p
      )
      deadPlayers.push(targetId)

      // Aplicar mortes por amor e ligação de sangue
      const loveDeath = applyLoveDeath(updatedPlayers, targetId)
      const bloodDeath = applyBloodBondDeath(updatedPlayers, targetId)

      deadPlayers.push(...loveDeath, ...bloodDeath)

    } else if (hasTalisman && !isProtected) {
      // Talismã perde sua proteção apenas se não estiver protegido pelo guardião
      updatedPlayers = updatedPlayers.map(p =>
        p.id === targetId ? { ...p, hasProtection: false } : p
      )
      messages.push(`${target.name} foi protegido por seu Talismã, mas o perdeu.`)
    } else if (hasTalisman && isProtected) {
      // Talismã mantém sua proteção quando protegido pelo guardião
      messages.push(`${target.name} foi protegido pelo Guardião e manteve seu Talismã.`)
    }
  })

  // 4. Processar tiros do Bala de Prata
  shoots.forEach(action => {
    if (action.targetId) {
      const shooter = updatedPlayers.find(p => p.id === action.playerId)
      const target = updatedPlayers.find(p => p.id === action.targetId)
      
      if (shooter && target && target.isAlive) {
        // Verificar se o tiro ignora Talismã baseado na configuração
        const ignoresTalisman = action.data?.ignoresTalisman || false
        const hasTalisman = target.hasProtection && target.character === CharacterClass.TALISMA
        
        if (!hasTalisman || ignoresTalisman) {
          // Matar o alvo
          updatedPlayers = updatedPlayers.map(p =>
            p.id === action.targetId ? { ...p, isAlive: false } : p
          )
          deadPlayers.push(target.id)
          messages.push(`${shooter.name} atirou em ${target.name} com sua Bala de Prata!`)
          
          // Aplicar mortes por amor e ligação de sangue
          const loveDeath = applyLoveDeath(updatedPlayers, target.id)
          const bloodDeath = applyBloodBondDeath(updatedPlayers, target.id)
          deadPlayers.push(...loveDeath, ...bloodDeath)
        } else {
          // Talismã protege
          updatedPlayers = updatedPlayers.map(p =>
            p.id === action.targetId ? { ...p, hasProtection: false } : p
          )
          messages.push(`${target.name} foi protegido por seu Talismã contra a Bala de Prata, mas o perdeu.`)
        }
      }
    }
  })

  // 5. Aplicar infecções
  infections.forEach(action => {
    if (action.targetId) {
      const target = updatedPlayers.find(p => p.id === action.targetId)
      if (target && target.isAlive) {
        updatedPlayers = updatedPlayers.map(p =>
          p.id === action.targetId ? { ...p, isInfected: true } : p
        )
      }
    }
  })

  // 6. Aplicar silenciamentos
  silences.forEach(action => {
    if (action.targetId) {
      const target = updatedPlayers.find(p => p.id === action.targetId)
      if (target && target.isAlive) {
        updatedPlayers = updatedPlayers.map(p =>
          p.id === action.targetId ? { ...p, isSilenced: true } : p
        )
        messages.push(`${target.name} foi silenciado e não poderá falar no próximo dia.`)
      }
    }
  })

  // 7. Processar investigações
  investigations_actions.forEach(action => {
    if (action.targetId) {
      const investigator = updatedPlayers.find(p => p.id === action.playerId)
      const target = updatedPlayers.find(p => p.id === action.targetId)

      if (investigator && target) {
        const investigatorCharacter = investigator.originalCharacter || investigator.character

        if (investigatorCharacter === CharacterClass.VIDENTE) {
          // Vidente vê se é bom ou mau
          const isGood = [
            CharacterClass.ALDEAO, CharacterClass.MEDIUM, CharacterClass.VIDENTE,
            CharacterClass.CUPIDO, CharacterClass.TALISMA, CharacterClass.BRUXA,
            CharacterClass.BALA_DE_PRATA, CharacterClass.GUARDIAO, CharacterClass.HEMOMANTE,
            CharacterClass.HEROI
          ].includes(target.character)

          investigations[investigator.id] = {
            type: 'alignment',
            target: target.name,
            result: isGood ? 'Bom' : 'Mau'
          }

        } else if (investigatorCharacter === CharacterClass.MEDIUM && !target.isAlive) {
          // Médium vê classe de jogador morto
          investigations[investigator.id] = {
            type: 'class',
            target: target.name,
            result: target.character
          }
        }
      }
    }
  })

  // Processar ações especiais de lobisomem voodoo
  const voodooActions = actions.filter(a =>
    a.type === ActionType.KILL &&
    a.data?.guessedClass &&
    updatedPlayers.find(p => p.id === a.playerId)?.character === CharacterClass.LOBISOMEM_VOODOO
  )

  voodooActions.forEach(action => {
    if (action.targetId && action.data?.guessedClass) {
      const voodoo = updatedPlayers.find(p => p.id === action.playerId)
      const target = updatedPlayers.find(p => p.id === action.targetId)

      if (voodoo && target) {
        const guessedCorrectly = target.character === action.data.guessedClass

        if (guessedCorrectly) {
          // Acertou - mata o alvo (ignora proteções)
          if (target.isAlive) {
            updatedPlayers = updatedPlayers.map(p =>
              p.id === action.targetId ? { ...p, isAlive: false } : p
            )
            deadPlayers.push(target.id)
            messages.push(`${voodoo.name} acertou a classe de ${target.name} e o eliminou!`)

            // Aplicar mortes secundárias
            const loveDeath = applyLoveDeath(updatedPlayers, target.id)
            const bloodDeath = applyBloodBondDeath(updatedPlayers, target.id)
            deadPlayers.push(...loveDeath, ...bloodDeath)
          }
        } else {
          // Errou - morre
          updatedPlayers = updatedPlayers.map(p =>
            p.id === voodoo.id ? { ...p, isAlive: false } : p
          )
          deadPlayers.push(voodoo.id)
          messages.push(`${voodoo.name} errou a classe de ${target.name} e morreu!`)

          // Aplicar mortes secundárias
          const loveDeath = applyLoveDeath(updatedPlayers, voodoo.id)
          const bloodDeath = applyBloodBondDeath(updatedPlayers, voodoo.id)
          deadPlayers.push(...loveDeath, ...bloodDeath)
        }
      }
    }
  })

  console.log('Resultado das ações noturnas:', {
    totalPlayers: players.length,
    alivePlayers: players.filter(p => p.isAlive).length,
    deadPlayers: deadPlayers.length,
    messages: messages.length,
    investigations: Object.keys(investigations).length
  })

  return {
    deadPlayers: [...new Set(deadPlayers)], // Remove duplicatas
    updatedPlayers,
    messages,
    investigations
  }
}

// Função específica para processar tiro do Bala de Prata
export function processSilverBulletShot(
  players: Player[], 
  silverBulletPlayerId: string, 
  targetId: string, 
  config: GameConfig
): ActionResult {
  let updatedPlayers = [...players]
  const deadPlayers: string[] = []
  const messages: string[] = []
  const investigations: { [playerId: string]: any } = {}

  const shooter = updatedPlayers.find(p => p.id === silverBulletPlayerId)
  const target = updatedPlayers.find(p => p.id === targetId)

  if (shooter && target && target.isAlive) {
    const hasTalisman = target.hasProtection && target.character === CharacterClass.TALISMA
    
    if (!hasTalisman || config.silverBulletIgnoresTalisman) {
      // Matar o alvo
      updatedPlayers = updatedPlayers.map(p =>
        p.id === targetId ? { ...p, isAlive: false } : p
      )
      deadPlayers.push(targetId)
      messages.push(`${shooter.name} atirou em ${target.name} com sua Bala de Prata!`)
      
      // Aplicar mortes por amor e ligação de sangue
      const loveDeath = applyLoveDeath(updatedPlayers, targetId)
      const bloodDeath = applyBloodBondDeath(updatedPlayers, targetId)
      deadPlayers.push(...loveDeath, ...bloodDeath)
    } else {
      // Talismã protege
      updatedPlayers = updatedPlayers.map(p =>
        p.id === targetId ? { ...p, hasProtection: false } : p
      )
      messages.push(`${target.name} foi protegido por seu Talismã contra a Bala de Prata, mas o perdeu.`)
    }
  }

  return {
    deadPlayers: [...new Set(deadPlayers)],
    updatedPlayers,
    messages,
    investigations
  }
}
