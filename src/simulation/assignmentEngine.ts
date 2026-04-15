import { SWITCHING_DELTA } from '../types/global'
import type { ActiveMissile, ActiveInterceptor, DefenseAlgorithm } from '../types/simulationTypes'
import { computeSmartScore } from './scoringEngine'
import { computeNaiveScore } from './naiveEngine'

type ScoringFn = (missile: ActiveMissile) => number

function getScoringFunction(algorithm: DefenseAlgorithm): ScoringFn {
    return algorithm === 'smart' ? computeSmartScore : computeNaiveScore
}

/**
 * Greedy interceptor-to-target assignment engine.
 * 
 * Runs every tick to manage the K-interceptors → N-targets mapping.
 * 
 * Steps (from the project spec):
 * 1. Update engaging interceptors (check if targets are destroyed or lost)
 * 2. Score & sort all detected missiles
 * 3. Filter out already-targeted missiles → free target list
 * 4. Assign idle interceptors to top free targets
 * 5. Target switching (smart only): if S_new > S_current + δ → switch
 * 
 * Complexity: O(N log N) dominated by the sort step.
 * 
 * Mutates the missiles and interceptors maps in place for performance.
 */
export function runAssignment(
    missiles: Map<string, ActiveMissile>,
    interceptors: Map<string, ActiveInterceptor>,
    algorithm: DefenseAlgorithm,
): void {
    const scoreFn = getScoringFunction(algorithm)

    // ── Step 1: Update engaging interceptors ──
    for (const interceptor of interceptors.values()) {
        if (interceptor.status !== 'ENGAGING' || !interceptor.currentTargetId) continue

        const target = missiles.get(interceptor.currentTargetId)

        // Target destroyed (D_rem <= 0) — handled by tick, interceptor released
        if (!target || target.status === 'INTERCEPTED' || target.status === 'IMPACTED') {
            interceptor.status = 'IDLE'
            interceptor.currentTargetId = null
            continue
        }

        // Target became lost cause — release interceptor
        if (target.status === 'LOST_CAUSE') {
            interceptor.status = 'IDLE'
            interceptor.currentTargetId = null
            continue
        }
    }

    // ── Step 2: Score & sort all DETECTED missiles ──
    const detectedMissiles: ActiveMissile[] = []
    for (const missile of missiles.values()) {
        if (missile.status === 'DETECTED') {
            missile.score = scoreFn(missile)
            detectedMissiles.push(missile)
        }
    }

    // Sort descending by score (highest priority first)
    detectedMissiles.sort((a, b) => b.score - a.score)

    // ── Step 3: Build set of already-targeted missile IDs ──
    const targetedIds = new Set<string>()
    for (const interceptor of interceptors.values()) {
        if (interceptor.status === 'ENGAGING' && interceptor.currentTargetId) {
            targetedIds.add(interceptor.currentTargetId)
        }
    }

    // Free targets = detected missiles not currently being engaged
    const freeTargets = detectedMissiles.filter(m => !targetedIds.has(m.id) && m.score > 0)

    // ── Step 4: Assign idle interceptors to top free targets ──
    const idleInterceptors: ActiveInterceptor[] = []
    for (const interceptor of interceptors.values()) {
        if (interceptor.status === 'IDLE') {
            idleInterceptors.push(interceptor)
        }
    }

    let freeTargetIdx = 0
    for (const interceptor of idleInterceptors) {
        if (freeTargetIdx >= freeTargets.length) break

        const target = freeTargets[freeTargetIdx]
        interceptor.status = 'ENGAGING'
        interceptor.currentTargetId = target.id
        targetedIds.add(target.id)
        freeTargetIdx++
    }

    // Remove assigned targets from freeTargets (shift the index)
    const remainingFreeTargets = freeTargets.slice(freeTargetIdx)

    // ── Step 5: Target switching (smart algorithm only) ──
    // Only runs if there are free targets remaining (more missiles than interceptors)
    if (algorithm === 'smart' && remainingFreeTargets.length > 0) {
        // Collect engaging interceptors sorted by their current target score (lowest first)
        const engagingInterceptors: ActiveInterceptor[] = []
        for (const interceptor of interceptors.values()) {
            if (interceptor.status === 'ENGAGING' && interceptor.currentTargetId) {
                engagingInterceptors.push(interceptor)
            }
        }

        // Sort by current target score ascending — try to switch lowest-value engagements first
        engagingInterceptors.sort((a, b) => {
            const scoreA = missiles.get(a.currentTargetId!)?.score ?? 0
            const scoreB = missiles.get(b.currentTargetId!)?.score ?? 0
            return scoreA - scoreB
        })

        let freeIdx = 0
        for (const interceptor of engagingInterceptors) {
            if (freeIdx >= remainingFreeTargets.length) break

            const currentTarget = missiles.get(interceptor.currentTargetId!)
            if (!currentTarget) continue

            // Don't switch away from targets that are almost destroyed (>60% dwell time done)
            const dwellProgress = 1 - (currentTarget.dwellTimeRemaining / currentTarget.dwellTimeTotal)
            if (dwellProgress > 0.6) continue

            const currentScore = currentTarget.score
            const candidate = remainingFreeTargets[freeIdx]

            // Switch only if the new target's score exceeds current + penalty
            if (candidate.score > currentScore + SWITCHING_DELTA) {
                // Release old target (returns to free pool, D_rem stays partially reduced)
                targetedIds.delete(currentTarget.id)

                // Assign new target
                interceptor.currentTargetId = candidate.id
                targetedIds.add(candidate.id)
                freeIdx++
            }
        }
    }
}
