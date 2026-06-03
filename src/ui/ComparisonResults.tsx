import type { SimulationResult } from '../types/simulationTypes'
import { MissileType, ZoneType } from '../types/global'

type ComparisonResultsProps = {
    runs: { naive: SimulationResult; smart: SimulationResult }[]
    onClose: () => void
}

const TYPE_LABELS: Record<MissileType, string> = {
    [MissileType.LIGHT]: 'Light',
    [MissileType.MEDIUM]: 'Medium',
    [MissileType.HEAVY]: 'Heavy',
}

const ZONE_LABELS: Record<number, { label: string; color: string }> = {
    [ZoneType.CITY]: { label: 'City', color: '#f87171' },
    [ZoneType.RURAL]: { label: 'Rural', color: '#fbbf24' },
    [ZoneType.OPEN]: { label: 'Open', color: '#60a5fa' },
}

/** Average a numeric field across all runs for one algorithm side. */
function avg(runs: SimulationResult[], fn: (r: SimulationResult) => number): number {
    if (runs.length === 0) return 0
    return runs.reduce((sum, r) => sum + fn(r), 0) / runs.length
}

/**
 * Multi-run comparison results panel.
 * Shows per-run damage reduction, average across all runs,
 * and an averaged comparison table.
 */
export default function ComparisonResults({ runs, onClose }: ComparisonResultsProps) {
    const n = runs.length
    const naiveRuns = runs.map(r => r.naive)
    const smartRuns = runs.map(r => r.smart)

    // Per-run damage reduction percentages vs Naive
    const smartReductions = runs.map(({ naive, smart }) =>
        naive.totalDamage > 0 ? ((naive.totalDamage - smart.totalDamage) / naive.totalDamage * 100) : 0
    )

    const avgSmartRed = smartReductions.reduce((s, v) => s + v, 0) / n

    // Averaged metrics
    const getMetrics = (algRuns: SimulationResult[]) => ({
        rate: avg(algRuns, r => r.totalMissiles > 0 ? (r.intercepted / r.totalMissiles) * 100 : 0),
        damage: avg(algRuns, r => r.totalDamage),
        intercepted: avg(algRuns, r => r.intercepted),
        total: avg(algRuns, r => r.totalMissiles),
        impacted: avg(algRuns, r => r.impacted),
        lost: avg(algRuns, r => r.lostCauses),
    })

    const naiveM = getMetrics(naiveRuns)
    const smartM = getMetrics(smartRuns)

    // Use first run for counts (consistent across runs due to same config)
    const refNaive = naiveRuns[0]

    const rows: { label: string; naive: string; smart: string; best: 'naive' | 'smart' }[] = [
        {
            label: 'Interception Rate',
            naive: `${naiveM.rate.toFixed(1)}%`,
            smart: `${smartM.rate.toFixed(1)}%`,
            best: smartM.rate >= naiveM.rate ? 'smart' : 'naive',
        },
        {
            label: 'Total Damage',
            naive: `${naiveM.damage.toFixed(1)}`,
            smart: `${smartM.damage.toFixed(1)}`,
            best: smartM.damage <= naiveM.damage ? 'smart' : 'naive',
        },
        {
            label: 'Intercepted',
            naive: `${naiveM.intercepted.toFixed(1)}`,
            smart: `${smartM.intercepted.toFixed(1)}`,
            best: smartM.intercepted >= naiveM.intercepted ? 'smart' : 'naive',
        },
        {
            label: 'Impacted',
            naive: `${naiveM.impacted.toFixed(1)}`,
            smart: `${smartM.impacted.toFixed(1)}`,
            best: smartM.impacted <= naiveM.impacted ? 'smart' : 'naive',
        },
    ]

    // Per-type averaged breakdown
    for (const type of [MissileType.LIGHT, MissileType.MEDIUM, MissileType.HEAVY]) {
        const nAvg = avg(naiveRuns, r => r.missileBreakdown.find(b => b.type === type)?.intercepted ?? 0)
        const sAvg = avg(smartRuns, r => r.missileBreakdown.find(b => b.type === type)?.intercepted ?? 0)
        const count = avg(naiveRuns, r => r.missileBreakdown.find(b => b.type === type)?.count ?? 0)

        if (count > 0) {
            rows.push({
                label: `${TYPE_LABELS[type]} (Int)`,
                naive: `${nAvg.toFixed(1)}`,
                smart: `${sAvg.toFixed(1)}`,
                best: sAvg >= nAvg ? 'smart' : 'naive',
            })
        }
    }

    return (
        <div style={{
            marginTop: '12px',
            background: 'linear-gradient(135deg, rgba(15,15,20,0.95), rgba(25,25,35,0.95))',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '16px',
            width: '380px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#a0c4ff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    ⚔ Algorithm Comparison ({n} runs)
                </span>
                <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#888', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px' }}>✕</button>
            </div>

            {/* Summary Banners */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <div style={{
                    flex: 1,
                    background: 'rgba(80,200,120,0.08)',
                    borderRadius: '8px',
                    padding: '8px',
                    textAlign: 'center',
                    border: '1px solid rgba(80,200,120,0.15)',
                }}>
                    <div style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', marginBottom: '2px' }}>Smart Red. vs Naive</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'monospace', color: avgSmartRed > 0 ? '#4ade80' : '#f87171' }}>
                        {avgSmartRed > 0 ? '+' : ''}{avgSmartRed.toFixed(1)}%
                    </div>
                </div>
            </div>

            {/* Zone Breakdown (averaged) */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
                {refNaive.zoneBreakdown.map(zb => {
                    const meta = ZONE_LABELS[zb.zone]
                    if (!meta) return null
                    const avgCount = avg(naiveRuns, r => r.zoneBreakdown.find(z => z.zone === zb.zone)?.count ?? 0)
                    if (avgCount === 0) return null
                    return (
                        <div key={zb.zone} style={{ flex: 1, background: `${meta.color}11`, borderRadius: '6px', padding: '6px 8px', textAlign: 'center', border: `1px solid ${meta.color}22` }}>
                            <div style={{ fontSize: '9px', color: `${meta.color}cc`, textTransform: 'uppercase' }}>{meta.label}</div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: meta.color, fontFamily: 'monospace' }}>{avgCount.toFixed(0)}</div>
                        </div>
                    )
                })}
            </div>

            {/* Averaged Comparison Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                    <tr>
                        <th style={thStyle}></th>
                        <th style={{ ...thStyle, color: '#fbbf24' }}>Naive</th>
                        <th style={{ ...thStyle, color: '#4ade80' }}>Smart</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                            <td style={tdStyle}>{row.label}</td>
                            <td style={{ ...tdStyle, textAlign: 'center', fontFamily: 'monospace', color: row.best === 'naive' ? '#fbbf24' : '#666' }}>{row.naive}</td>
                            <td style={{ ...tdStyle, textAlign: 'center', fontFamily: 'monospace', color: row.best === 'smart' ? '#4ade80' : '#666' }}>{row.smart}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

const thStyle: React.CSSProperties = {
    padding: '6px 8px',
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    textAlign: 'center',
    color: '#888',
}

const tdStyle: React.CSSProperties = {
    padding: '5px 8px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
}
