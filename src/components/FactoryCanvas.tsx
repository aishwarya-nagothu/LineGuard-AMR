import React, { useState } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { WAREHOUSE, CHARGERS } from '../simulation/factoryLayout';
import {
  AlertTriangle,
  Zap,
  Package,
  Layers,
  Eye,
  Bot,
  Compass,
} from 'lucide-react';

export const FactoryCanvas: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const {
    state,
    setSelectedAmrId,
    selectedAmrId,
    setSelectedStationId,
    selectedStationId,
    setSelectedTaskId,
  } = useSimulation();

  const [showRoutes, setShowRoutes] = useState(true);
  const [showCongestion, setShowCongestion] = useState(true);
  const [showAisleLabels, setShowAisleLabels] = useState(!compact);

  // Height and aspect ratio configuration
  const viewBoxHeight = 620;
  const viewBoxWidth = 1000;

  return (
    <div className="relative bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
      {/* Factory Map Toolbar */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-3 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-mono text-cyan-400 font-bold flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5" />
            2D FACTORY FLOOR TWIN
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">Scale: 1m = 4px</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">Dim: 250m × 155m Hall</span>
        </div>

        {/* Layer View Toggles */}
        <div className="flex items-center space-x-3 text-slate-400">
          <label className="flex items-center space-x-1 cursor-pointer hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={showRoutes}
              onChange={(e) => setShowRoutes(e.target.checked)}
              className="accent-cyan-500 rounded"
            />
            <span>Trajectories</span>
          </label>

          <label className="flex items-center space-x-1 cursor-pointer hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={showCongestion}
              onChange={(e) => setShowCongestion(e.target.checked)}
              className="accent-cyan-500 rounded"
            />
            <span>Aisle Flow</span>
          </label>
        </div>
      </div>

      {/* Main SVG Render Surface */}
      <div className={`w-full overflow-hidden bg-slate-950 relative ${compact ? 'h-[360px]' : 'h-[580px]'}`}>
        <svg
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          className="w-full h-full select-none"
          style={{ background: 'radial-gradient(ellipse at center, #090d16 0%, #030712 100%)' }}
        >
          <defs>
            {/* Grid background pattern */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeOpacity="0.4" />
            </pattern>

            {/* Hazard stripe pattern for blocked aisles */}
            <pattern id="hazardStripe" width="20" height="20" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="20" stroke="#f59e0b" strokeWidth="10" strokeOpacity="0.4" />
              <line x1="10" y1="0" x2="10" y2="20" stroke="#000000" strokeWidth="10" strokeOpacity="0.7" />
            </pattern>

            {/* Glowing marker filters */}
            <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glowRed" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Grid */}
          <rect width="1000" height="620" fill="url(#grid)" />

          {/* AISLES & CORRIDORS */}
          {state.aisles.map((aisle) => {
            const isHorizontal = Math.abs(aisle.start.y - aisle.end.y) < 10;
            const x = Math.min(aisle.start.x, aisle.end.x);
            const y = Math.min(aisle.start.y, aisle.end.y);
            const width = isHorizontal ? Math.abs(aisle.end.x - aisle.start.x) : 50;
            const height = isHorizontal ? 48 : Math.abs(aisle.end.y - aisle.start.y);

            // Congestion color styling
            let aisleFill = 'rgba(30, 41, 59, 0.4)';
            let borderColor = '#334155';
            if (aisle.isBlocked) {
              aisleFill = 'url(#hazardStripe)';
              borderColor = '#f59e0b';
            } else if (showCongestion) {
              if (aisle.congestionLevel > 0.6) {
                aisleFill = 'rgba(239, 68, 68, 0.18)';
                borderColor = 'rgba(239, 68, 68, 0.5)';
              } else if (aisle.congestionLevel > 0.3) {
                aisleFill = 'rgba(245, 158, 11, 0.12)';
                borderColor = 'rgba(245, 158, 11, 0.4)';
              }
            }

            return (
              <g key={aisle.id}>
                <rect
                  x={isHorizontal ? x : x - 25}
                  y={isHorizontal ? y - 24 : y}
                  width={width}
                  height={height}
                  fill={aisleFill}
                  stroke={borderColor}
                  strokeWidth="1.2"
                  rx="6"
                  strokeDasharray={aisle.isBlocked ? '4 2' : 'none'}
                />

                {/* Aisle Label & Congestion Badge */}
                {showAisleLabels && (
                  <text
                    x={isHorizontal ? x + width / 2 : x}
                    y={isHorizontal ? y - 28 : y + height / 2}
                    fill={aisle.isBlocked ? '#f59e0b' : '#64748b'}
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="font-mono select-none"
                  >
                    {aisle.name} {aisle.isBlocked ? '⛔ BLOCKED' : `(${aisle.currentCount}/${aisle.capacity})`}
                  </text>
                )}
              </g>
            );
          })}

          {/* ACTIVE AMR DELIVERY TRAJECTORIES */}
          {showRoutes &&
            state.amrs.map((amr) => {
              if (!amr.targetPosition || amr.health === 'FAILED') return null;
              const isDelivering = amr.state === 'DELIVERING';

              return (
                <line
                  key={`traj-${amr.id}`}
                  x1={amr.position.x}
                  y1={amr.position.y}
                  x2={amr.targetPosition.x}
                  y2={amr.targetPosition.y}
                  stroke={isDelivering ? '#10b981' : '#06b6d4'}
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                  strokeOpacity="0.75"
                />
              );
            })}

          {/* CENTRAL LOGISTICS WAREHOUSE DEPOT */}
          <g transform={`translate(${WAREHOUSE.position.x - 60}, ${WAREHOUSE.position.y - 80})`}>
            <rect
              width="120"
              height="160"
              rx="8"
              fill="#0f172a"
              stroke="#38bdf8"
              strokeWidth="2"
              className="drop-shadow-lg"
            />
            {/* Warehouse Header */}
            <rect width="120" height="28" rx="8" fill="#1e293b" />
            <text x="60" y="18" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle" className="font-mono">
              CENTRAL DEPOT
            </text>

            {/* Warehouse bays */}
            {[0, 1, 2, 3].map((bay) => (
              <g key={`bay-${bay}`} transform={`translate(15, ${38 + bay * 28})`}>
                <rect width="90" height="22" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                <text x="45" y="14" fill="#94a3b8" fontSize="8" textAnchor="middle" className="font-mono">
                  Bay #{bay + 1}: Automated Kitting
                </text>
              </g>
            ))}

            <circle cx="120" cy="80" r="4" fill="#38bdf8" filter="url(#glowCyan)" />
          </g>

          {/* CHARGING STATIONS */}
          {CHARGERS.map((charger) => (
            <g key={charger.id} transform={`translate(${charger.position.x - 30}, ${charger.position.y - 20})`}>
              <rect
                width="60"
                height="40"
                rx="6"
                fill="#0f172a"
                stroke="#a855f7"
                strokeWidth="1.5"
                strokeDasharray="2 1"
              />
              <text x="30" y="16" fill="#c084fc" fontSize="8" fontWeight="bold" textAnchor="middle" className="font-mono">
                {charger.id}
              </text>
              <text x="30" y="30" fill="#94a3b8" fontSize="7" textAnchor="middle">
                800V Ultra-Fast
              </text>
            </g>
          ))}

          {/* ASSEMBLY STATIONS */}
          {state.stations.map((st) => {
            const isSelected = selectedStationId === st.id;
            const isCritical = st.criticality >= 0.9;
            const isStarved = st.isStarved;
            const isAtRisk = st.predictedStockoutSec < 50;

            // Status border and fill
            let stationBorder = '#3b82f6';
            let stationGlow = 'none';
            if (isStarved) {
              stationBorder = '#ef4444';
              stationGlow = 'url(#glowRed)';
            } else if (isAtRisk) {
              stationBorder = '#f59e0b';
            } else if (isCritical) {
              stationBorder = '#ec4899';
            }

            // Inventory fill percentage
            const invPct = Math.min(100, Math.max(0, (st.currentInventory / st.maxBuffer) * 100));

            return (
              <g
                key={st.id}
                transform={`translate(${st.position.x - 70}, ${st.position.y - 45})`}
                onClick={() => setSelectedStationId(st.id)}
                className="cursor-pointer group"
              >
                {/* Station Container Card */}
                <rect
                  width="140"
                  height="90"
                  rx="8"
                  fill="#0b1329"
                  stroke={isSelected ? '#00f0ff' : stationBorder}
                  strokeWidth={isSelected ? '2.5' : '1.5'}
                  filter={stationGlow}
                  className="transition-all"
                />

                {/* Station Header Bar */}
                <rect
                  width="140"
                  height="22"
                  rx="7"
                  fill={isStarved ? '#7f1d1d' : isAtRisk ? '#78350f' : '#1e293b'}
                />
                <text x="8" y="15" fill="#f8fafc" fontSize="9" fontWeight="bold" className="font-mono">
                  {st.code} · {st.name.slice(0, 15)}
                </text>
                <text x="132" y="15" fill="#38bdf8" fontSize="8" fontWeight="bold" textAnchor="end" className="font-mono">
                  c={st.criticality}
                </text>

                {/* Component requirement label */}
                <text x="8" y="36" fill="#94a3b8" fontSize="8" className="font-sans">
                  {st.componentName.slice(0, 22)}
                </text>

                {/* Stockout Countdown & Slack */}
                <g transform="translate(8, 42)">
                  <text
                    x="0"
                    y="10"
                    fill={isStarved ? '#ef4444' : isAtRisk ? '#f59e0b' : '#10b981'}
                    fontSize="10"
                    fontWeight="bold"
                    className="font-mono"
                  >
                    TTS: {Math.round(st.predictedStockoutSec)}s
                  </text>
                  <text x="65" y="10" fill="#64748b" fontSize="8" className="font-mono">
                    Rate: {st.consumptionRate.toFixed(2)}/s
                  </text>
                </g>

                {/* Inventory Buffer Progress Bar */}
                <g transform="translate(8, 62)">
                  <rect width="124" height="6" rx="3" fill="#1e293b" />
                  <rect
                    width={(invPct / 100) * 124}
                    height="6"
                    rx="3"
                    fill={isStarved ? '#ef4444' : invPct < 30 ? '#f59e0b' : '#38bdf8'}
                  />
                  {/* Safety stock notch */}
                  <line
                    x1={(st.safetyStock / st.maxBuffer) * 124}
                    y1="0"
                    x2={(st.safetyStock / st.maxBuffer) * 124}
                    y2="6"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                </g>

                {/* Stock count label */}
                <text x="8" y="80" fill="#cbd5e1" fontSize="8" className="font-mono">
                  Stock: <tspan fontWeight="bold">{st.currentInventory.toFixed(1)}</tspan> / {st.maxBuffer} units
                </text>

                {/* Heavy Payload Requirement Tag */}
                {st.payloadRequirement === 'HEAVY' && (
                  <rect x="85" y="72" width="47" height="12" rx="3" fill="#312e81" stroke="#4f46e5" strokeWidth="0.8" />
                )}
                {st.payloadRequirement === 'HEAVY' && (
                  <text x="108" y="81" fill="#a5b4fc" fontSize="7" fontWeight="bold" textAnchor="middle">
                    HEAVY REQ
                  </text>
                )}
              </g>
            );
          })}

          {/* STRANDED RESCUE CARGO (IF ANY) */}
          {state.tasks
            .filter((t) => t.isRescue && t.status !== 'DELIVERED' && t.rescuePayloadLocation)
            .map((task) => (
              <g
                key={task.id}
                transform={`translate(${task.rescuePayloadLocation!.x}, ${task.rescuePayloadLocation!.y})`}
                onClick={() => setSelectedTaskId(task.id)}
                className="cursor-pointer"
              >
                <circle r="14" fill="rgba(239, 68, 68, 0.2)" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 2" className="animate-ping" />
                <circle r="10" fill="#7f1d1d" stroke="#ef4444" strokeWidth="2" />
                <text x="0" y="3" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">
                  SOS
                </text>
                <text x="0" y="-14" fill="#ef4444" fontSize="8" fontWeight="bold" textAnchor="middle" className="font-mono">
                  RESCUE PICKUP
                </text>
              </g>
            ))}

          {/* AMRs (AUTONOMOUS MOBILE ROBOTS) */}
          {state.amrs.map((amr) => {
            const isSelected = selectedAmrId === amr.id;
            const isHeavy = amr.payloadCapability === 'HEAVY';
            const isFailed = amr.health === 'FAILED';

            // AMR Color status
            let bodyColor = '#3b82f6';
            if (isFailed) bodyColor = '#ef4444';
            else if (amr.state === 'DELIVERING') bodyColor = '#10b981';
            else if (amr.state === 'MOVING_TO_PICKUP') bodyColor = '#06b6d4';
            else if (amr.state === 'LOADING' || amr.state === 'UNLOADING') bodyColor = '#f59e0b';
            else if (amr.state === 'CHARGING') bodyColor = '#a855f7';
            else bodyColor = '#64748b'; // Idle

            return (
              <g
                key={amr.id}
                transform={`translate(${amr.position.x}, ${amr.position.y})`}
                onClick={() => setSelectedAmrId(amr.id)}
                className="cursor-pointer group"
              >
                {/* Selection ring */}
                {isSelected && (
                  <circle r="18" fill="none" stroke="#00f0ff" strokeWidth="2" strokeDasharray="3 2" />
                )}

                {/* AMR Outer Chassis (Heavy has reinforced octagonal ring) */}
                {isHeavy ? (
                  <rect
                    x="-12"
                    y="-12"
                    width="24"
                    height="24"
                    rx="4"
                    fill="#0f172a"
                    stroke={bodyColor}
                    strokeWidth={isSelected ? '2.5' : '2'}
                  />
                ) : (
                  <circle
                    r="11"
                    fill="#0f172a"
                    stroke={bodyColor}
                    strokeWidth={isSelected ? '2.5' : '1.8'}
                  />
                )}

                {/* Inner status core */}
                <circle r="5" fill={bodyColor} />

                {/* Battery Arc / Indicator */}
                <text
                  x="0"
                  y="1"
                  fill="#ffffff"
                  fontSize="6"
                  fontWeight="bold"
                  textAnchor="middle"
                  className="font-mono select-none"
                >
                  {isFailed ? '!' : Math.round(amr.batteryPct)}
                </text>

                {/* AMR ID Label */}
                <text
                  x="0"
                  y="-15"
                  fill={isSelected ? '#00f0ff' : '#cbd5e1'}
                  fontSize="8"
                  fontWeight="bold"
                  textAnchor="middle"
                  className="font-mono select-none"
                >
                  {amr.id}
                </text>

                {/* Payload type icon tag */}
                {isHeavy && (
                  <rect x="-8" y="13" width="16" height="7" rx="2" fill="#312e81" stroke="#4f46e5" strokeWidth="0.5" />
                )}
                {isHeavy && (
                  <text x="0" y="19" fill="#c7d2fe" fontSize="5" fontWeight="bold" textAnchor="middle">
                    HVY
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Legend Overlay */}
        <div className="absolute bottom-2 left-2 bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 text-[11px] text-slate-300 flex flex-wrap gap-4 shadow-xl backdrop-blur-sm pointer-events-none">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Delivering</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
            <span>To Pickup</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span>Charging</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-indigo-600 border border-indigo-400" />
            <span>Heavy Carrier (550kg)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Fault / Failed</span>
          </div>
        </div>
      </div>
    </div>
  );
};
