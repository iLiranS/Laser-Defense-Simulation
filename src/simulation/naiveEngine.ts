import { EPSILON, T_SAFETY } from '../types/global'
import type { ActiveMissile } from '../types/simulationTypes'

/**
 * Naive scoring function: considers ONLY time to impact.
 * 
 *   Score = 1 / (TTI + ε)
 * 
 * Lower TTI → higher score. Ignores damage, zone weight, and dwell time.
 * This serves as the baseline comparison against the smart algorithm.
 * - Lost causes (TTI < D_rem + T_safety) still get score 0
 * - Missiles with zero impact damage (SEA zone) are skipped
 */
export function computeNaiveScore(missile: ActiveMissile): number {
    const { impactDamage, TTI, dwellTimeRemaining } = missile

    // Skip missiles that pose no threat (landing in sea / empty area)
    if (impactDamage <= 0) return 0

    // Ensure lost causes still get 0, even with tiny positive TTI
    if (TTI < dwellTimeRemaining + T_SAFETY) {
        return 0
    }

    return 1 / (TTI + EPSILON)
}

/**
 * Sorts missiles by naive score in descending order (lowest TTI first).
 * Returns a new sorted array.
 */
export function sortByNaiveScore(missiles: ActiveMissile[]): ActiveMissile[] {
    return [...missiles].sort((a, b) => b.score - a.score)
}
