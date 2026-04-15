import { EPSILON } from '../types/global'
import type { ActiveMissile } from '../types/simulationTypes'

/**
 * Naive scoring function: considers ONLY time to impact.
 * 
 *   Score = 1 / (TTI + ε)
 * 
 * Lower TTI → higher score. Ignores damage, zone weight, and dwell time.
 * This serves as the baseline comparison against the smart algorithm.
 * 
 * No lost-cause filtering — naive algorithm doesn't check if interception
 * is physically possible, it just targets whatever is closest to impact.
 * 
 * Missiles with zero impact damage (SEA zone) are skipped — no defense
 * system would waste resources intercepting a missile heading to open sea.
 */
export function computeNaiveScore(missile: ActiveMissile): number {
    // Skip missiles that pose no threat (landing in sea / empty area)
    if (missile.impactDamage <= 0) return 0

    return 1 / (missile.TTI + EPSILON)
}

/**
 * Sorts missiles by naive score in descending order (lowest TTI first).
 * Returns a new sorted array.
 */
export function sortByNaiveScore(missiles: ActiveMissile[]): ActiveMissile[] {
    return [...missiles].sort((a, b) => b.score - a.score)
}
