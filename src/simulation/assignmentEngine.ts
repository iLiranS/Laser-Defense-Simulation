import { SWITCHING_DELTA, T_SAFETY, MAX_INTERCEPTORS_PER_MISSILE } from '../types/global'
import type { ActiveMissile, ActiveInterceptor, DefenseAlgorithm } from '../types/simulationTypes'
import { computeSmartScore } from './scoringEngine'
import { computeNaiveScore } from './naiveEngine'

type ScoringFn = (missile: ActiveMissile) => number

function getScoringFunction(algorithm: DefenseAlgorithm): ScoringFn {
    if (algorithm === 'smart') return computeSmartScore
    return computeNaiveScore
}

/**
 * Greedy interceptor-to-target assignment engine.
 * 
 * Runs every tick to manage the K-interceptors → N-targets mapping.
 */
export function runAssignment(
    missiles: Map<string, ActiveMissile>,
    interceptors: Map<string, ActiveInterceptor>,
    algorithm: DefenseAlgorithm,
): void {
    const scoreFn = getScoringFunction(algorithm)

    // 1. Tally current engagements
    const engagementCounts = new Map<string, number>()
    for (const missile of missiles.values()) engagementCounts.set(missile.id, 0)
    
    for (const interceptor of interceptors.values()) {
        if (interceptor.status === 'ENGAGING' && interceptor.currentTargetId) {
            // Target might be destroyed/lost, handle cleanup
            const target = missiles.get(interceptor.currentTargetId)
            if (!target || target.status === 'INTERCEPTED' || target.status === 'IMPACTED' || target.status === 'LOST_CAUSE') {
                interceptor.status = 'IDLE'
                interceptor.currentTargetId = null
            } else {
                const count = engagementCounts.get(target.id) || 0
                engagementCounts.set(target.id, count + 1)
            }
        }
    }

    // 2. Score and calculate Marginal Value for all valid targets
    interface TargetSlot {
        missile: ActiveMissile
        marginalScore: number
        isHelper: boolean
    }
    const targetSlots: TargetSlot[] = []

    for (const missile of missiles.values()) {
        if (missile.status !== 'DETECTED') continue
        
        missile.score = scoreFn(missile)
        const currentEngagements = engagementCounts.get(missile.id) || 0

        if (currentEngagements < MAX_INTERCEPTORS_PER_MISSILE && missile.score > 0) {
            let marginalScore = missile.score
            let isHelper = false

            // If it already has 1 interceptor, calculate the helper value
            if (currentEngagements === 1) {
                isHelper = true
                const willFirstLaserFail = missile.TTI < (missile.dwellTimeRemaining + T_SAFETY)
                marginalScore = willFirstLaserFail ? (missile.score * 1.5) : (missile.score * 0.2)
            }

            targetSlots.push({ missile, marginalScore, isHelper })
        }
    }

    // Sort slots by highest marginal value
    targetSlots.sort((a, b) => b.marginalScore - a.marginalScore)

    // 3. Assign Idle Interceptors
    for (const interceptor of interceptors.values()) {
        if (interceptor.status !== 'IDLE') continue
        if (targetSlots.length === 0) break

        const bestSlot = targetSlots.shift()! // Take the best available slot
        interceptor.status = 'ENGAGING'
        interceptor.currentTargetId = bestSlot.missile.id
        
        // Update counts so we don't assign 3 interceptors in the same tick
        engagementCounts.set(bestSlot.missile.id, (engagementCounts.get(bestSlot.missile.id) || 0) + 1)
    }

    // 4. Target Switching (Smart Only)
    if (algorithm !== 'naive' && targetSlots.length > 0) {
        // Evaluate current marginal score for each engaging interceptor
        const engagingList: { interceptor: ActiveInterceptor, marginalScore: number, currentTarget: ActiveMissile }[] = []

        for (const interceptor of interceptors.values()) {
            if (interceptor.status !== 'ENGAGING' || !interceptor.currentTargetId) continue

            const currentTarget = missiles.get(interceptor.currentTargetId)
            if (!currentTarget) continue

            const dwellProgress = 1 - (currentTarget.dwellTimeRemaining / currentTarget.dwellTimeTotal)
            if (dwellProgress > 0.6) continue

            const isCurrentlyHelper = (engagementCounts.get(currentTarget.id) || 1) > 1
            const willCurrentFailWithoutMe = currentTarget.TTI < (currentTarget.dwellTimeRemaining + T_SAFETY)
            
            let currentMarginalScore = currentTarget.score
            if (isCurrentlyHelper) {
                currentMarginalScore = willCurrentFailWithoutMe ? (currentTarget.score * 1.5) : (currentTarget.score * 0.2)
            }

            engagingList.push({ interceptor, marginalScore: currentMarginalScore, currentTarget })
        }

        // Sort so we try to switch the least valuable engagements first
        engagingList.sort((a, b) => a.marginalScore - b.marginalScore)

        for (const { interceptor, marginalScore, currentTarget } of engagingList) {
            if (targetSlots.length === 0) break
            const candidateSlot = targetSlots[0]

            if (candidateSlot.marginalScore > marginalScore + SWITCHING_DELTA) {
                // Perform the switch
                engagementCounts.set(currentTarget.id, engagementCounts.get(currentTarget.id)! - 1)
                interceptor.currentTargetId = candidateSlot.missile.id
                engagementCounts.set(candidateSlot.missile.id, (engagementCounts.get(candidateSlot.missile.id) || 0) + 1)
                
                targetSlots.shift() // Remove the taken slot
            }
        }
    }
}

