import React from 'react';

const StatCard = ({ title, value, subtext, icon: Icon, trend, isLoading, alert, children }) => (
    <div className={`bg-white p-5 rounded-xl shadow-sm border ${alert ? 'border-red-200 bg-red-50' : 'border-slate-100'} flex items-start justify-between h-full gap-4`}>
        <div className="flex-1 min-w-0 overflow-hidden">
            <p className="text-sm font-medium text-slate-500 mb-2 truncate">{title}</p>
            {isLoading ? (
                <div className="h-8 w-24 bg-slate-200 animate-pulse rounded"></div>
            ) : (
                <h3 className={`text-xl sm:text-2xl font-bold break-words leading-tight ${alert ? 'text-red-700' : 'text-slate-800'}`}>{value}</h3>
            )}
            <p className={`text-sm mt-2 truncate ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : alert ? 'text-red-600 font-medium' : 'text-slate-400'}`}>
                {subtext}
            </p>
            {children}
        </div>
        <div className={`p-2.5 rounded-xl shrink-0 ${alert ? 'bg-red-100' : 'bg-blue-50'}`}>
            <Icon className={`w-6 h-6 ${alert ? 'text-red-600' : 'text-blue-600'}`} />
        </div>
    </div>
);

export default StatCard;
