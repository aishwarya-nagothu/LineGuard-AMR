import React, { useState } from 'react';
import { useSimulation } from '../context/SimulationContext';
import {
  ListOrdered,
  Search,
  AlertTriangle,
  CheckCircle2,
  Info,
  Clock,
  Filter,
} from 'lucide-react';

export const EventTimelinePage: React.FC = () => {
  const { state } = useSimulation();
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const formatSimTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredEvents = state.events.filter((evt) => {
    if (filterSeverity !== 'ALL' && evt.severity !== filterSeverity) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchTitle = evt.title.toLowerCase().includes(q);
      const matchDesc = evt.description.toLowerCase().includes(q);
      const matchAmr = evt.amrId?.toLowerCase().includes(q);
      const matchTask = evt.taskId?.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchAmr || matchTask;
    }
    return true;
  });

  return (
    <div className="p-4 space-y-5 max-w-[1600px] mx-auto text-slate-100 select-none">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
        <div>
          <h2 className="text-sm font-bold font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <ListOrdered className="w-4 h-4" />
            Decentralized Event Audit & Execution Timeline
          </h2>
          <p className="text-xs text-slate-400">
            Real-time audit log of lease lifecycles, heartbeat timeouts, dynamic failovers, and consensus auctions.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search events, AMR, Task..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none font-mono"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical & Faults</option>
            <option value="WARNING">Warnings</option>
            <option value="SUCCESS">Success / Completions</option>
            <option value="INFO">Informational</option>
          </select>
        </div>
      </div>

      {/* Timeline List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No events match the current filter criteria.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEvents.map((evt) => {
              let badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
              let icon = <Info className="w-4 h-4 text-cyan-400 shrink-0" />;

              if (evt.severity === 'CRITICAL') {
                badgeColor = 'bg-rose-950/60 text-rose-300 border-rose-800/80';
                icon = <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />;
              } else if (evt.severity === 'WARNING') {
                badgeColor = 'bg-amber-950/60 text-amber-300 border-amber-800/80';
                icon = <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
              } else if (evt.severity === 'SUCCESS') {
                badgeColor = 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80';
                icon = <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
              }

              return (
                <div
                  key={evt.id}
                  className={`p-3.5 rounded-xl border text-xs font-mono transition-all flex items-start justify-between gap-4 ${badgeColor}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{icon}</div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{evt.title}</span>
                        {evt.amrId && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-cyan-300 border border-slate-700">
                            {evt.amrId}
                          </span>
                        )}
                        {evt.taskId && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-300 border border-slate-700">
                            {evt.taskId}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-300 font-sans text-xs leading-relaxed">
                        {evt.description}
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-slate-400 shrink-0">
                    <span className="flex items-center gap-1 font-bold text-slate-300">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      {formatSimTime(evt.timestampSec)}
                    </span>
                    <span className="text-[10px] text-slate-500">T+{Math.round(evt.timestampSec)}s</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
