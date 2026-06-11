import { useState } from 'react'
import { useSimulationStore } from '../store/simulationStore'
import { useGameManagerStore } from '../store/gameManagerStore'
import type { DefenseAlgorithm, MissileSnapshot } from '../types/simulationTypes'
import { generateWaveSnapshots } from '../simulation/simulationLoop'
import { runHeadlessSimulation } from '../simulation/headlessSimulation'
import ComparisonResults from './ComparisonResults'

/**
 * HTML overlay panel for simulation controls and live stats.
 * Rendered outside the Canvas in main.tsx.
 */
export default function SimulationPanel() {
    const phase = useSimulationStore(s => s.phase)
    const algorithm = useSimulationStore(s => s.algorithm)
    const activeMissiles = useSimulationStore(s => s.activeMissiles)
    const elapsedTime = useSimulationStore(s => s.elapsedTime)
    const results = useSimulationStore(s => s.results)
    const comparisonResults = useSimulationStore(s => s.comparisonResults)
    const waveConfig = useSimulationStore(s => s.waveConfig)
    const currentWave = useSimulationStore(s => s.currentWave)
    const totalWaves = useSimulationStore(s => s.totalWaves)

    const interceptorsCount = useGameManagerStore(s => s.interceptorsCount)
    const setInterceptorsCount = useGameManagerStore(s => s.setInterceptorsCount)

    const setAlgorithm = useSimulationStore(s => s.setAlgorithm)
    const startSimulation = useSimulationStore(s => s.startSimulation)
    const reset = useSimulationStore(s => s.reset)
    const setWaveConfig = useSimulationStore(s => s.setWaveConfig)
    const setTotalWaves = useSimulationStore(s => s.setTotalWaves)
    const setComparisonResults = useSimulationStore(s => s.setComparisonResults)

    // Live stats
    let detected = 0, intercepted = 0, impacted = 0, lostCauses = 0, totalDamage = 0, missed = 0
    for (const m of activeMissiles.values()) {
        // SEA-zone missiles — not threats
        if (m.impactDamage <= 0 && m.status !== 'FLYING') { missed++; continue }
        if (m.status === 'DETECTED') detected++
        if (m.status === 'INTERCEPTED') intercepted++
        if (m.status === 'IMPACTED') { impacted++; totalDamage += m.impactDamage }
        if (m.status === 'LOST_CAUSE') { lostCauses++; totalDamage += m.impactDamage }
    }

    const [comparisonRuns, setComparisonRuns] = useState(5)

    const handleStart = () => {
        useSimulationStore.setState({ scenarioSnapshot: null, comparisonResults: null })
        startSimulation()
    }

    const handleReset = () => {
        useSimulationStore.setState({ scenarioSnapshot: null, comparisonResults: null })
        reset()
    }

    /**
     * Headless multi-run comparison:
     * Generates N different random scenarios and runs both algorithms
     * on each one synchronously. Results are displayed as averaged stats.
     */
    const handleComparison = () => {
        const store = useSimulationStore.getState()
        const { radius, missileSpeed, gravity } = useGameManagerStore.getState()

        const interceptorPositions = [...store.activeInterceptors.values()]
            .map(i => i.position.clone())

        const runs: { naive: ReturnType<typeof runHeadlessSimulation>; smart: ReturnType<typeof runHeadlessSimulation> }[] = []

        for (let run = 0; run < comparisonRuns; run++) {
            // Generate fresh random scenario for this run
            const allSnapshots: MissileSnapshot[] = []
            for (let w = 0; w < store.totalWaves; w++) {
                allSnapshots.push(
                    ...generateWaveSnapshots(store.waveConfig, w, radius, store.radarCenter)
                )
            }

            const baseConfig = {
                missiles: allSnapshots,
                waveConfig: { ...store.waveConfig },
                totalWaves: store.totalWaves,
                interceptorPositions,
                radarCenter: store.radarCenter.clone(),
                radarRadius: store.radarRadius,
                speed: missileSpeed,
                gravity,
                maxInterceptorsPerMissile: store.maxInterceptorsPerMissile,
            }

            const naiveResult = runHeadlessSimulation({ ...baseConfig, algorithm: 'naive' })
            const smartResult = runHeadlessSimulation({ ...baseConfig, algorithm: 'smart' })

            runs.push({ naive: naiveResult, smart: smartResult })
        }

        setComparisonResults({ runs })
    }

    const handleAlgorithmChange = (alg: DefenseAlgorithm) => {
        if (phase === 'IDLE') setAlgorithm(alg)
    }

    return (
        <div style={{
            position: 'absolute',
            right: '16px',
            bottom: '16px',
            zIndex: 100,
            pointerEvents: 'auto',
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            color: '#e0e0e0',
            userSelect: 'none',
        }}>
            {/* Main Panel */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(15,15,20,0.92), rgba(25,25,35,0.92))',
                backdropFilter: 'blur(12px)',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '16px',
                width: '280px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}>
                {/* Title */}
                <div style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                    color: '#a0c4ff',
                    marginBottom: '12px',
                    textTransform: 'uppercase',
                }}>
                    🛡️ Defense Simulation
                </div>

                {/* Algorithm Toggle */}
                <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Algorithm
                    </label>
                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                        {(['naive', 'smart'] as DefenseAlgorithm[]).map(alg => (
                            <button
                                key={alg}
                                onClick={() => handleAlgorithmChange(alg)}
                                disabled={phase !== 'IDLE'}
                                style={{
                                    flex: 1,
                                    padding: '6px 10px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: phase === 'IDLE' ? 'pointer' : 'default',
                                    transition: 'all 0.2s',
                                    background: algorithm === alg
                                        ? (alg === 'smart' ? 'rgba(80,200,120,0.3)' : 'rgba(200,160,80,0.3)')
                                        : 'rgba(255,255,255,0.05)',
                                    color: algorithm === alg ? '#fff' : '#666',
                                    outline: algorithm === alg ? `1px solid ${alg === 'smart' ? 'rgba(80,200,120,0.5)' : 'rgba(200,160,80,0.5)'}` : '1px solid transparent',
                                }}
                            >
                                {alg === 'naive' ? 'Naive' : 'Smart'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Wave Config */}
                {phase === 'IDLE' && (
                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Wave Config
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '6px', marginTop: '4px' }}>
                            <div>
                                <div style={{ fontSize: '9px', color: '#666' }}>Count</div>
                                <input
                                    type="number"
                                    value={waveConfig.missileCount}
                                    onChange={e => setWaveConfig({ missileCount: Number(e.target.value) })}
                                    style={inputStyle}
                                    min={1} max={50}
                                />
                            </div>
                            <div>
                                <div style={{ fontSize: '9px', color: '#666' }}>Interval</div>
                                <input
                                    type="number"
                                    value={waveConfig.interval}
                                    onChange={e => setWaveConfig({ interval: Number(e.target.value) })}
                                    style={inputStyle}
                                    min={1} max={30} step={0.5}
                                />
                            </div>
                            <div>
                                <div style={{ fontSize: '9px', color: '#666' }}>Waves</div>
                                <input
                                    type="number"
                                    value={totalWaves}
                                    onChange={e => setTotalWaves(Number(e.target.value))}
                                    style={inputStyle}
                                    min={1} max={10}
                                />
                            </div>
                            <div>
                                <div style={{ fontSize: '9px', color: '#666' }}>🛡️ Lasers</div>
                                <input
                                    type="number"
                                    value={interceptorsCount}
                                    onChange={e => setInterceptorsCount(Number(e.target.value))}
                                    style={inputStyle}
                                    min={1} max={30}
                                />
                            </div>
                        </div>

                        {/* Missile Type Ratio Slider */}
                        <div style={{ marginTop: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontSize: '9px', color: '#60a5fa', fontWeight: 600 }}>Light: {Math.round(waveConfig.ratios.light * 100)}%</span>
                                <span style={{ fontSize: '9px', color: '#fbbf24', fontWeight: 600 }}>Med: {Math.round(waveConfig.ratios.medium * 100)}%</span>
                                <span style={{ fontSize: '9px', color: '#f87171', fontWeight: 600 }}>Heavy: {Math.round(waveConfig.ratios.heavy * 100)}%</span>
                            </div>
                            <RatioSlider
                                ratios={[waveConfig.ratios.light, waveConfig.ratios.medium, waveConfig.ratios.heavy]}
                                colors={['#60a5fa', '#fbbf24', '#f87171']}
                                onChange={([l, m, h]) => setWaveConfig({ ratios: { light: l, medium: m, heavy: h } })}
                            />
                        </div>

                        {/* Zone Target Ratio Slider */}
                        <div style={{ marginTop: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontSize: '9px', color: '#f87171', fontWeight: 600 }}>City: {Math.round(waveConfig.zoneRatios.city * 100)}%</span>
                                <span style={{ fontSize: '9px', color: '#fbbf24', fontWeight: 600 }}>Rural: {Math.round(waveConfig.zoneRatios.rural * 100)}%</span>
                                <span style={{ fontSize: '9px', color: '#60a5fa', fontWeight: 600 }}>Open: {Math.round(waveConfig.zoneRatios.open * 100)}%</span>
                            </div>
                            <RatioSlider
                                ratios={[waveConfig.zoneRatios.city, waveConfig.zoneRatios.rural, waveConfig.zoneRatios.open]}
                                colors={['#f87171', '#fbbf24', '#60a5fa']}
                                onChange={([c, r, o]) => setWaveConfig({ zoneRatios: { city: c, rural: r, open: o } })}
                            />
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                    {phase === 'IDLE' && (
                        <>
                            <button onClick={handleStart} style={btnPrimary}>
                                ▶ Start
                            </button>
                            <button onClick={handleComparison} style={btnSecondary}>
                                ⚔ Compare
                            </button>
                            <input
                                type="number"
                                value={comparisonRuns}
                                onChange={e => setComparisonRuns(Math.max(1, Math.min(20, Number(e.target.value))))}
                                title="Number of comparison runs"
                                style={{
                                    width: '44px',
                                    flexShrink: 0,
                                    boxSizing: 'border-box',
                                    padding: '6px 2px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    background: 'rgba(96,165,250,0.12)',
                                    border: '1px solid rgba(96,165,250,0.25)',
                                    borderRadius: '8px',
                                    color: '#60a5fa',
                                    textAlign: 'center',
                                    fontFamily: 'monospace',
                                    outline: 'none',
                                }}
                                min={1} max={20}
                            />
                        </>
                    )}
                    {(phase === 'RUNNING' || phase === 'FINISHED' || phase === 'COMPARING') && (
                        <button onClick={handleReset} style={btnDanger}>
                            ↺ Reset
                        </button>
                    )}
                </div>

                {/* Live Stats */}
                {phase !== 'IDLE' && (
                    <div style={{
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: '8px',
                        padding: '10px',
                        fontSize: '11px',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ color: '#888' }}>Time</span>
                            <span style={{ fontFamily: 'monospace' }}>{elapsedTime.toFixed(1)}s</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ color: '#888' }}>Wave</span>
                            <span style={{ fontFamily: 'monospace' }}>{currentWave}/{totalWaves}</span>
                        </div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1fr',
                            gap: '4px',
                            marginTop: '8px',
                        }}>
                            <StatBox label="Active" value={detected} color="#60a5fa" />
                            <StatBox label="Intercepted" value={intercepted} color="#4ade80" />
                            <StatBox label="Impacted" value={impacted} color="#f87171" />
                            <StatBox label="Lost Cause" value={lostCauses} color="#fbbf24" />
                            <StatBox label="Missed" value={missed} color="#888" />
                        </div>
                        <div style={{
                            marginTop: '8px',
                            padding: '6px',
                            background: 'rgba(248,113,113,0.1)',
                            borderRadius: '6px',
                            textAlign: 'center',
                        }}>
                            <span style={{ fontSize: '9px', color: '#f87171', textTransform: 'uppercase' }}>
                                Total Damage
                            </span>
                            <div style={{ fontSize: '18px', fontWeight: 700, color: '#f87171', fontFamily: 'monospace' }}>
                                {totalDamage.toFixed(2)}
                            </div>
                        </div>
                    </div>
                )}

                {/* Single Run Results */}
                {phase === 'FINISHED' && results && !comparisonResults && (
                    <div style={{
                        marginTop: '10px',
                        padding: '8px',
                        background: 'rgba(80,200,120,0.08)',
                        borderRadius: '8px',
                        border: '1px solid rgba(80,200,120,0.2)',
                        fontSize: '11px',
                        textAlign: 'center',
                    }}>
                        <div style={{ color: '#4ade80', fontWeight: 600, marginBottom: '4px' }}>
                            ✓ Simulation Complete ({results.algorithm})
                        </div>
                        <div style={{ color: '#aaa' }}>
                            {results.intercepted}/{results.totalMissiles} intercepted
                            ({((results.intercepted / results.totalMissiles) * 100).toFixed(2)}%)
                        </div>
                    </div>
                )}
            </div>

            {/* Comparison Results Modal */}
            {comparisonResults && (
                <ComparisonResults
                    runs={comparisonResults.runs}
                    onClose={() => handleReset()}
                />
            )}
        </div>
    )
}


// ── Sub-components ──

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div style={{
            background: `${color}11`,
            borderRadius: '6px',
            padding: '6px',
            textAlign: 'center',
        }}>
            <div style={{ fontSize: '9px', color: `${color}aa`, textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color, fontFamily: 'monospace' }}>{value}</div>
        </div>
    )
}

function RatioSlider({ ratios, colors, onChange }: {
    ratios: [number, number, number],
    colors: [string, string, string],
    onChange: (ratios: [number, number, number]) => void
}) {
    const handleMouseDown = (e: React.MouseEvent, handleIdx: number) => {
        const track = e.currentTarget.parentElement!
        const startX = e.clientX
        const trackRect = track.getBoundingClientRect()
        const initial0 = ratios[0]
        const initial1 = ratios[1]

        const onMouseMove = (moveE: MouseEvent) => {
            const deltaX = moveE.clientX - startX
            const deltaPercent = deltaX / trackRect.width

            let n0 = ratios[0]
            let n1 = ratios[1]
            let n2 = ratios[2]

            if (handleIdx === 0) {
                n0 = Math.max(0.05, Math.min(0.9, initial0 + deltaPercent))
                n1 = Math.max(0.05, initial0 + initial1 - n0)
                n2 = 1 - n0 - n1
            } else {
                n1 = Math.max(0.05, Math.min(1 - initial0 - 0.05, initial1 + deltaPercent))
                n2 = 1 - initial0 - n1
            }

            onChange([n0, n1, n2])
        }

        const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onMouseUp)
        }

        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)
    }

    return (
        <div style={{
            height: '10px',
            width: '100%',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '5px',
            position: 'relative',
            display: 'flex',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)',
        }}>
            {/* Segments */}
            <div style={{ flex: ratios[0], background: colors[0], filter: 'brightness(0.9)', transition: 'flex 0.05s' }} />
            <div style={{ flex: ratios[1], background: colors[1], filter: 'brightness(0.9)', transition: 'flex 0.05s' }} />
            <div style={{ flex: ratios[2], background: colors[2], filter: 'brightness(0.9)', transition: 'flex 0.05s' }} />

            {/* Handles */}
            <div
                onMouseDown={(e) => handleMouseDown(e, 0)}
                style={{
                    position: 'absolute',
                    left: `${ratios[0] * 100}%`,
                    top: 0,
                    bottom: 0,
                    width: '12px',
                    marginLeft: '-6px',
                    background: '#fff',
                    boxShadow: '0 0 10px rgba(0,0,0,0.5)',
                    cursor: 'ew-resize',
                    zIndex: 2,
                    borderRadius: '2px',
                    opacity: 0.8,
                    border: '1px solid #444',
                }}
            />
            <div
                onMouseDown={(e) => handleMouseDown(e, 1)}
                style={{
                    position: 'absolute',
                    left: `${(ratios[0] + ratios[1]) * 100}%`,
                    top: 0,
                    bottom: 0,
                    width: '12px',
                    marginLeft: '-6px',
                    background: '#fff',
                    boxShadow: '0 0 10px rgba(0,0,0,0.5)',
                    cursor: 'ew-resize',
                    zIndex: 2,
                    borderRadius: '2px',
                    opacity: 0.8,
                    border: '1px solid #444',
                }}
            />
        </div>
    )
}

// ── Styles ──

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '4px 6px',
    fontSize: '11px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '4px',
    color: '#ddd',
    outline: 'none',
    fontFamily: 'monospace',
}

const btnBase: React.CSSProperties = {
    flex: 1,
    padding: '8px 12px',
    fontSize: '11px',
    fontWeight: 700,
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    letterSpacing: '0.3px',
}

const btnPrimary: React.CSSProperties = {
    ...btnBase,
    background: 'linear-gradient(135deg, rgba(80,200,120,0.35), rgba(60,160,100,0.35))',
    color: '#4ade80',
    outline: '1px solid rgba(80,200,120,0.3)',
}

const btnSecondary: React.CSSProperties = {
    ...btnBase,
    background: 'linear-gradient(135deg, rgba(96,165,250,0.25), rgba(60,120,200,0.25))',
    color: '#60a5fa',
    outline: '1px solid rgba(96,165,250,0.3)',
}

const btnDanger: React.CSSProperties = {
    ...btnBase,
    background: 'linear-gradient(135deg, rgba(248,113,113,0.25), rgba(200,80,80,0.25))',
    color: '#f87171',
    outline: '1px solid rgba(248,113,113,0.3)',
}
