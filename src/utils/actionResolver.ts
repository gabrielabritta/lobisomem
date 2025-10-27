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

// Helper function to recursively register death reasons for all secondary deaths
function registerAllSecondaryDeaths(
  deathReasons: { [playerId: string]: string },
  updatedPlayers: Player[],
  deadId: string,
  originalDeadName: string,
  processed: Set<string> = new Set()
) {
  if (processed.has(deadId)) return
  processed.add(deadId)

  const deadPlayer = updatedPlayers.find(p => p.id === deadId)
  if (!deadPlayer) return

  // Check for lover
  if (deadPlayer.isInLove && deadPlayer.lovePartnerId) {
    const lover = updatedPlayers.find(p => p.id === deadPlayer.lovePartnerId)
    if (lover && !lover.isAlive && !deathReasons[lover.id]) {
      deathReasons[lover.id] = `morreu de amor por ${deadPlayer.name}`
      registerAllSecondaryDeaths(deathReasons, updatedPlayers, lover.id, deadPlayer.name, processed)
    }
  }

  // Check for blood bond partner
  if (deadPlayer.bloodBondPartnerId) {
    const bonded = updatedPlayers.find(p => p.id === deadPlayer.bloodBondPartnerId)
    if (bonded && !bonded.isAlive && !deathReasons[bonded.id]) {
      deathReasons[bonded.id] = `morreu pela ligação de sangue com ${deadPlayer.name}`
      registerAllSecondaryDeaths(deathReasons, updatedPlayers, bonded.id, deadPlayer.name, processed)
    }
  }
}

export interface ActionResult {
  deadPlayers: string[]
  updatedPlayers: Player[]
  messages: string[]
  investigations: { [playerId: string]: any }
  deathReasons: { [playerId: string]: string }
}

export function resolveNightActions(players: Player[], actions: GameAction[]): ActionResult {
  let updatedPlayers = [...players]
  const deadPlayers: string[] = []
  const messages: string[] = []
  const investigations: { [playerId: string]: any } = {}
  const deathReasons: { [playerId: string]: string } = {}

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
  const killActionsByTarget = new Map<string, GameAction>() // To track who killed whom

  // Coletar todos os alvos de morte
  kills.forEach(action => {
    if (action.targetId) {
      killTargets.add(action.targetId)
      killActionsByTarget.set(action.targetId, action)
    }
  })

  poisons.forEach(action => {
    if (action.targetId) {
      killTargets.add(action.targetId)
      killActionsByTarget.set(action.targetId, action)
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

      // Register death reason
      const killAction = killActionsByTarget.get(targetId)
      if (killAction) {
        const killer = updatedPlayers.find(p => p.id === killAction.playerId)
        if (killer) {
          if (killAction.type === ActionType.POISON) {
            deathReasons[targetId] = 'envenenado pela bruxa'
          } else if (killer.character === CharacterClass.VAMPIRO) {
            deathReasons[targetId] = 'morto pelo vampiro'
          } else if (killer.character === CharacterClass.HEROI) {
            deathReasons[targetId] = 'morto pelo herói'
          } else {
            deathReasons[targetId] = 'morto pelos lobisomens'
          }
        }
      }

      // Aplicar mortes por amor e ligação de sangue
      const loveDeath = applyLoveDeath(updatedPlayers, targetId)
      const bloodDeath = applyBloodBondDeath(updatedPlayers, targetId)
      deadPlayers.push(...loveDeath, ...bloodDeath)
      
      // Register all secondary death reasons recursively
      registerAllSecondaryDeaths(deathReasons, updatedPlayers, targetId, target.name)

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

  // 4. Processar morte do Herói se matou alguém bom
  kills.forEach(action => {
    if (action.targetId) {
      const killer = updatedPlayers.find(p => p.id === action.playerId)
      const target = updatedPlayers.find(p => p.id === action.targetId)
      
      // Verificar se o assassino é o Herói e se o alvo morreu
      if (killer && target && killer.character === CharacterClass.HEROI && !target.isAlive && killer.isAlive) {
        // Verificar se o alvo era bom
        const isTargetGood = [
          CharacterClass.ALDEAO, CharacterClass.MEDIUM, CharacterClass.VIDENTE,
          CharacterClass.CUPIDO, CharacterClass.TALISMA, CharacterClass.BRUXA,
          CharacterClass.BALA_DE_PRATA, CharacterClass.GUARDIAO, CharacterClass.HEMOMANTE,
          CharacterClass.HEROI
        ].includes(target.character)
        
        if (isTargetGood) {
          // Matar o Herói
          updatedPlayers = updatedPlayers.map(p =>
            p.id === killer.id ? { ...p, isAlive: false } : p
          )
          deadPlayers.push(killer.id)
          deathReasons[killer.id] = 'morreu por matar um inocente'
          messages.push(`${killer.name} matou ${target.name}, que era inocente, e morreu!`)
          
          // Aplicar mortes secundárias do Herói
          const loveDeath = applyLoveDeath(updatedPlayers, killer.id)
          const bloodDeath = applyBloodBondDeath(updatedPlayers, killer.id)
          deadPlayers.push(...loveDeath, ...bloodDeath)
          
          // Register all secondary death reasons recursively
          registerAllSecondaryDeaths(deathReasons, updatedPlayers, killer.id, killer.name)
        }
      }
    }
  })

  // 5. Processar tiros do Bala de Prata
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
          
          // Register death reason
          deathReasons[target.id] = 'morto pela bala de prata'
          
          // Aplicar mortes por amor e ligação de sangue
          const loveDeath = applyLoveDeath(updatedPlayers, target.id)
          const bloodDeath = applyBloodBondDeath(updatedPlayers, target.id)
          deadPlayers.push(...loveDeath, ...bloodDeath)
          
          // Register all secondary death reasons recursively
          registerAllSecondaryDeaths(deathReasons, updatedPlayers, target.id, target.name)
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

  // 6. Aplicar infecções
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

  // 7. Aplicar silenciamentos
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

  // 8. Processar investigações
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
            
            // Register death reason
            deathReasons[target.id] = 'enfeitiçado pelo lobisomem voodoo'

            // Aplicar mortes secundárias
            const loveDeath = applyLoveDeath(updatedPlayers, target.id)
            const bloodDeath = applyBloodBondDeath(updatedPlayers, target.id)
            deadPlayers.push(...loveDeath, ...bloodDeath)
            
            // Register all secondary death reasons recursively
            registerAllSecondaryDeaths(deathReasons, updatedPlayers, target.id, target.name)
          }
        } else {
          // Errou - morre
          updatedPlayers = updatedPlayers.map(p =>
            p.id === voodoo.id ? { ...p, isAlive: false } : p
          )
          deadPlayers.push(voodoo.id)
          messages.push(`${voodoo.name} errou a classe de ${target.name} e morreu!`)
          
          // Register death reason
          deathReasons[voodoo.id] = 'morreu ao errar o feitiço voodoo'

          // Aplicar mortes secundárias
          const loveDeath = applyLoveDeath(updatedPlayers, voodoo.id)
          const bloodDeath = applyBloodBondDeath(updatedPlayers, voodoo.id)
          deadPlayers.push(...loveDeath, ...bloodDeath)
          
          // Register all secondary death reasons recursively
          registerAllSecondaryDeaths(deathReasons, updatedPlayers, voodoo.id, voodoo.name)
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
    investigations,
    deathReasons
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
  const deathReasons: { [playerId: string]: string } = {}

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
      
      // Register death reason
      deathReasons[targetId] = 'morto pela bala de prata'
      
      // Aplicar mortes por amor e ligação de sangue
      const loveDeath = applyLoveDeath(updatedPlayers, targetId)
      const bloodDeath = applyBloodBondDeath(updatedPlayers, targetId)
      deadPlayers.push(...loveDeath, ...bloodDeath)
      
      // Register all secondary death reasons recursively
      registerAllSecondaryDeaths(deathReasons, updatedPlayers, targetId, target.name)
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
    investigations,
    deathReasons
  }
}
