import React from 'react';
import { Download } from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    ReferenceLine
} from 'recharts';
import { exportToCSV } from '../utils/helpers';

const ExportableChart = ({ title, data, type = "line", dataKey, color, unit, threshold, isLoading }) => {
    if (isLoading) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-96 flex flex-col">
                <div className="h-6 w-48 bg-slate-200 animate-pulse rounded mb-6"></div>
                <div className="flex-1 bg-slate-100 animate-pulse rounded"></div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-96 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <button
                        disabled
                        className="flex items-center gap-2 text-sm text-blue-600 px-3 py-1.5 bg-blue-50 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>
                <div className="flex-1 flex items-center justify-center text-slate-400">
                    <p>No data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-96 flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-slate-800">{title}</h3>
                <button
                    onClick={() => exportToCSV(data, title.replace(' ', '_'))}
                    disabled={!data || data.length === 0}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors px-3 py-1.5 bg-blue-50 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download className="w-4 h-4" />
                    Export CSV
                </button>
            </div>
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    {type === "line" ? (
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                                dataKey="time"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                dy={10}
                                interval="preserveStartEnd"
                                minTickGap={30}
                            />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            {threshold && <ReferenceLine y={threshold} stroke="#ef4444" strokeDasharray="5 5" label={`Max ${threshold}°C`} />}
                            <Line
                                type="monotone"
                                dataKey={dataKey}
                                stroke={color}
                                strokeWidth={3}
                                dot={{ r: 3, fill: color, strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    ) : (
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id={`color${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                                dataKey="time"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                dy={10}
                                interval="preserveStartEnd"
                                minTickGap={30}
                            />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Area type="monotone" dataKey={dataKey} stroke={color} fillOpacity={1} fill={`url(#color${dataKey})`} />
                        </AreaChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ExportableChart;
