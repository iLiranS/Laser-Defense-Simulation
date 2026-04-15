import { T_SAFETY, EPSILON } from '../types/global'
import type { ActiveMissile } from '../types/simulationTypes'

/**
 * Smart scoring function based on WSPT (Weighted Shortest Processing Time):
 *
 *   damageDensity = V_i / D_rem          (damage prevented per laser-second)
 *   slack         = TTI - D_rem          (spare time beyond what's needed)
 *   urgency       = 1 + 1/(slack + 0.5)  (gentle boost as deadline nears)
 *   S_i(t)        = damageDensity × urgency
 *
 * Why this beats the old formula V / (TTI × D_rem):
 * - Damage density ensures heavy-city missiles (V=45, D_rem=1.2 → 37.5/s)
 *   always outscore light-city missiles (V=9, D_rem=0.3 → 30/s) at equal freshness
 * - The gentle urgency multiplier prevents last-second misses without
 *   letting urgency dominate (which would make smart == naive)
 * - Lost causes (TTI < D_rem + T_safety) still get score 0
 *
 * Higher score = higher priority for interception.
 */
export function computeSmartScore(missile: ActiveMissile): number {
    const { impactDamage, TTI, dwellTimeRemaining } = missile

    // Skip missiles that pose no threat (landing in sea / empty area)
    if (impactDamage <= 0) return 0

    // Lost cause check: not enough time to finish intercepting before impact
    if (TTI < dwellTimeRemaining + T_SAFETY) {
        return 0
    }

    // Damage density: how much damage we prevent per second of laser time
    // This is the core WSPT heuristic from scheduling theory
    const damageDensity = impactDamage / (dwellTimeRemaining + EPSILON)

    // Slack: spare time beyond what's physically needed to destroy this missile
    const slack = TTI - dwellTimeRemaining

    // Gentle urgency: increases as slack shrinks, but doesn't dominate
    // The +0.5 floor prevents division by near-zero and limits max boost to ~3×
    const urgencyMultiplier = 1 + (1 / (slack + 0.5))

    return damageDensity * urgencyMultiplier
}

/**
 * Sorts missiles by smart score in descending order (highest priority first).
 * Returns a new sorted array (does not mutate input).
 * Complexity: O(N log N)
 */
export function sortBySmartScore(missiles: ActiveMissile[]): ActiveMissile[] {
    return [...missiles].sort((a, b) => b.score - a.score)
}
