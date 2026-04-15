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

    // Per-run damage reduction percentages
    const perRunReductions = runs.map(({ naive, smart }) =>
        naive.totalDamage > 0
            ? ((naive.totalDamage - smart.totalDamage) / naive.totalDamage * 100)
            : 0
    )
    const avgReduction = perRunReductions.reduce((s, v) => s + v, 0) / n

    // Averaged metrics
    const avgNaiveRate = avg(naiveRuns, r => r.totalMissiles > 0 ? (r.intercepted / r.totalMissiles) * 100 : 0)
    const avgSmartRate = avg(smartRuns, r => r.totalMissiles > 0 ? (r.intercepted / r.totalMissiles) * 100 : 0)
    const avgNaiveDamage = avg(naiveRuns, r => r.totalDamage)
    const avgSmartDamage = avg(smartRuns, r => r.totalDamage)
    const avgNaiveIntercepted = avg(naiveRuns, r => r.intercepted)
    const avgSmartIntercepted = avg(smartRuns, r => r.intercepted)
    const avgNaiveTotal = avg(naiveRuns, r => r.totalMissiles)
    const avgSmartTotal = avg(smartRuns, r => r.totalMissiles)
    const avgNaiveImpacted = avg(naiveRuns, r => r.impacted)
    const avgSmartImpacted = avg(smartRuns, r => r.impacted)
    const avgNaiveLost = avg(naiveRuns, r => r.lostCauses)
    const avgSmartLost = avg(smartRuns, r => r.lostCauses)

    // Use first run for counts (consistent across runs due to same config)
    const refNaive = naiveRuns[0]

    const rows: { label: string; naive: string; smart: string; smartBetter: boolean }[] = [
        {
            label: 'Avg Interception Rate',
            naive: `${avgNaiveRate.toFixed(1)}%`,
            smart: `${avgSmartRate.toFixed(1)}%`,
            smartBetter: avgSmartRate > avgNaiveRate,
        },
        {
            label: 'Avg Total Damage',
            naive: `${avgNaiveDamage.toFixed(1)}`,
            smart: `${avgSmartDamage.toFixed(1)}`,
            smartBetter: avgSmartDamage < avgNaiveDamage,
        },
        {
            label: 'Avg Intercepted',
            naive: `${avgNaiveIntercepted.toFixed(1)}/${avgNaiveTotal.toFixed(0)}`,
            smart: `${avgSmartIntercepted.toFixed(1)}/${avgSmartTotal.toFixed(0)}`,
            smartBetter: avgSmartIntercepted > avgNaiveIntercepted,
        },
        {
            label: 'Avg Impacted',
            naive: `${avgNaiveImpacted.toFixed(1)}`,
            smart: `${avgSmartImpacted.toFixed(1)}`,
            smartBetter: avgSmartImpacted < avgNaiveImpacted,
        },
        {
            label: 'Avg Lost Causes',
            naive: `${avgNaiveLost.toFixed(1)}`,
            smart: `${avgSmartLost.toFixed(1)}`,
            smartBetter: avgSmartLost < avgNaiveLost,
        },
    ]

    // Per-type averaged breakdown
    for (const type of [MissileType.LIGHT, MissileType.MEDIUM, MissileType.HEAVY]) {
        const naiveAvgInt = avg(naiveRuns, r => {
            const bd = r.missileBreakdown.find(b => b.type === type)
            return bd ? bd.intercepted : 0
        })
        const smartAvgInt = avg(smartRuns, r => {
            const bd = r.missileBreakdown.find(b => b.type === type)
            return bd ? bd.intercepted : 0
        })
        const avgCount = avg(naiveRuns, r => {
            const bd = r.missileBreakdown.find(b => b.type === type)
            return bd ? bd.count : 0
        })
        if (avgCount > 0) {
            rows.push({
                label: `${TYPE_LABELS[type]} intercepted`,
                naive: `${naiveAvgInt.toFixed(1)}/${avgCount.toFixed(0)}`,
                smart: `${smartAvgInt.toFixed(1)}/${avgCount.toFixed(0)}`,
                smartBetter: smartAvgInt > naiveAvgInt,
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
            width: '340px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
            }}>
                <span style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#a0c4ff',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                }}>
                    ⚔ Comparison ({n} runs)
                </span>
                <button
                    onClick={onClose}
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: 'none',
                        color: '#888',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        fontSize: '11px',
                    }}
                >
                    ✕
                </button>
            </div>

            {/* Summary Banner — Average */}
            <div style={{
                background: avgReduction > 0
                    ? 'rgba(80,200,120,0.1)'
                    : avgReduction < 0 ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.05)',
                borderRadius: '8px',
                padding: '10px',
                marginBottom: '10px',
                textAlign: 'center',
                border: `1px solid ${avgReduction > 0 ? 'rgba(80,200,120,0.2)' : avgReduction < 0 ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.1)'}`,
            }}>
                <div style={{
                    fontSize: '10px',
                    color: '#888',
                    textTransform: 'uppercase',
                    marginBottom: '2px',
                }}>
                    Smart Avg Damage Reduction
                </div>
                <div style={{
                    fontSize: '22px',
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    color: avgReduction > 0 ? '#4ade80' : avgReduction < 0 ? '#f87171' : '#eee',
                }}>
                    {avgReduction > 0 ? '+' : ''}{avgReduction.toFixed(2)}%
                </div>
            </div>

            {/* Per-Run Strip */}
            <div style={{
                display: 'flex',
                gap: '3px',
                marginBottom: '10px',
                flexWrap: 'wrap',
            }}>
                {perRunReductions.map((pct, i) => (
                    <div key={i} style={{
                        flex: '1 0 auto',
                        minWidth: '42px',
                        padding: '3px 5px',
                        borderRadius: '4px',
                        fontSize: '9px',
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        textAlign: 'center',
                        background: pct > 0 ? 'rgba(80,200,120,0.12)' : pct < 0 ? 'rgba(248,113,113,0.12)' : 'rgba(255,255,255,0.05)',
                        color: pct > 0 ? '#4ade80' : pct < 0 ? '#f87171' : '#aaa',
                        border: `1px solid ${pct > 0 ? 'rgba(80,200,120,0.2)' : pct < 0 ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.08)'}`,
                    }}>
                        {pct > 0 ? '+' : ''}{pct.toFixed(1)}%
                    </div>
                ))}
            </div>


            {/* Zone Breakdown (averaged) */}
            <div style={{
                display: 'flex',
                gap: '6px',
                marginBottom: '14px',
            }}>
                {refNaive.zoneBreakdown.map(zb => {
                    const meta = ZONE_LABELS[zb.zone]
                    if (!meta) return null
                    const avgCount = avg(naiveRuns, r => {
                        const z = r.zoneBreakdown.find(z => z.zone === zb.zone)
                        return z ? z.count : 0
                    })
                    if (avgCount === 0) return null
                    return (
                        <div key={zb.zone} style={{
                            flex: 1,
                            background: `${meta.color}11`,
                            borderRadius: '6px',
                            padding: '6px 8px',
                            textAlign: 'center',
                            border: `1px solid ${meta.color}22`,
                        }}>
                            <div style={{ fontSize: '9px', color: `${meta.color}cc`, textTransform: 'uppercase' }}>
                                {meta.label}
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: meta.color, fontFamily: 'monospace' }}>
                                {avgCount.toFixed(0)}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Averaged Comparison Table */}
            <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '11px',
            }}>
                <thead>
                    <tr>
                        <th style={thStyle}></th>
                        <th style={{ ...thStyle, color: '#fbbf24' }}>Naive</th>
                        <th style={{ ...thStyle, color: '#4ade80' }}>Smart</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => {
                        const isTie = row.naive === row.smart
                        let naiveColor: string
                        let smartColor: string

                        if (isTie) {
                            naiveColor = '#eee'
                            smartColor = '#eee'
                        } else {
                            naiveColor = !row.smartBetter ? '#4ade80' : '#666'
                            smartColor = row.smartBetter ? '#4ade80' : '#666'
                        }

                        return (
                            <tr key={i} style={{
                                background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                            }}>
                                <td style={tdStyle}>{row.label}</td>
                                <td style={{
                                    ...tdStyle,
                                    textAlign: 'center',
                                    fontFamily: 'monospace',
                                    color: naiveColor,
                                    opacity: isTie ? 0.8 : 1,
                                }}>
                                    {row.naive}
                                </td>
                                <td style={{
                                    ...tdStyle,
                                    textAlign: 'center',
                                    fontFamily: 'monospace',
                                    color: smartColor,
                                    opacity: isTie ? 0.8 : 1,
                                }}>
                                    {row.smart}
                                </td>
                            </tr>
                        )
                    })}
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
