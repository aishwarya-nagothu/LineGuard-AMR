import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { MetricsSnapshot } from '../../models/types';
import { Activity } from 'lucide-react';

export const MetricsCharts: React.FC<{ history: MetricsSnapshot[] }> = ({ history }) => {
  const data = history.map((h) => ({
    t: `${Math.floor(h.t / 60)}:${Math.floor(h.t % 60)
      .toString()
      .padStart(2, '0')}`,
    starvationSec: Math.round(h.starvationDurationSec * 10) / 10,
    productionLoss: h.productionLossMinutes,
    onTime: h.onTimePct,
  }));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-cyan-400" />
        <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-white">Live Factory Metrics</h3>
      </div>
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="t" stroke="#64748b" fontSize={10} />
            <YAxis stroke="#64748b" fontSize={10} />
            <Tooltip
              contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="starvationSec" name="Starvation (s)" stroke="#ef4444" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="productionLoss" name="Prod. loss (min)" stroke="#f59e0b" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="onTime" name="On-time %" stroke="#10b981" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
