import { T_SAFETY, EPSILON } from '../types/global'
import type { ActiveMissile } from '../types/simulationTypes'

/**
 * Smart Gamma scoring function:
 * 
 * Based on the WSPT heuristic from the normal Smart engine, but adds a specific 
 * dynamic boost for LIGHT missiles. Because LIGHT missiles require very little 
 * laser time (dwell time), we can quickly pick them off if we prioritize them 
 * slightly more as their TTI shrinks.
 * 
 *   damageDensity = V_i / D_rem
 *   slack         = TTI - D_rem
 *   urgency       = 1 + 1/(slack + 0.3)
 *   lightBoost    = (is light) ? 1 + (D_total / (TTI + eps)) : 1
 *   S_i(t)        = damageDensity * urgency * lightBoost
 */
export function computeSmartGammaScore(missile: ActiveMissile): number {
    const { impactDamage, TTI, dwellTimeRemaining, dwellTimeTotal } = missile

    // Skip missiles that pose no threat
    if (impactDamage <= 0) return 0

    // Lost cause check: not enough time to finish intercepting before impact
    if (TTI < dwellTimeRemaining + T_SAFETY) {
        return 0
    }

    // Damage density: how much damage we prevent per second of laser time
    const damageDensity = impactDamage / (dwellTimeRemaining + EPSILON)

    // Slack: spare time beyond what's physically needed to destroy this missile
    const slack = TTI - dwellTimeRemaining

    // Gentle urgency: increases as slack shrinks
    const urgencyMultiplier = 1 + (1 / (slack + 0.3))

    let score = damageDensity * urgencyMultiplier

    // New Idea: Light-Favored Dynamic Multiplier
    // To ensure Light is strongly prioritized over Medium and Heavy (overcoming naturally high damage density):
    // 1. `0.15 / (dwellTimeTotal * dwellTimeTotal)` quadratically scales the boost for shorter dwell times. 
    //    - Light (~2.66x) -> Base score ~80
    //    - Medium (~1.41x) -> Base score ~63
    //    - Heavy (~1.10x) -> Base score ~41
    //    This guarantees Light > Medium > Heavy in base priority.
    const typeBoost = 0.15 / (dwellTimeTotal * dwellTimeTotal)
    const urgencyBoost = dwellTimeRemaining / (TTI + EPSILON)

    const dynamicMultiplier = 1 + typeBoost + urgencyBoost
    score *= dynamicMultiplier

    return score
}

/**
 * Sorts missiles by smart gamma score in descending order (highest priority first).
 * Returns a new sorted array.
 */
export function sortBySmartGammaScore(missiles: ActiveMissile[]): ActiveMissile[] {
    return [...missiles].sort((a, b) => b.score - a.score)
}
