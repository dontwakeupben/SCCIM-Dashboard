import React from 'react';
import { Zap, Database } from 'lucide-react';

const DataSourceBadge = ({ querySource }) => {
    const isOpenSearch = querySource?.includes('OpenSearch');
    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${isOpenSearch
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : 'bg-amber-100 text-amber-800 border border-amber-200'
            }`}>
            {isOpenSearch ? <Zap className="w-3.5 h-3.5" /> : <Database className="w-3.5 h-3.5" />}
            <span>{querySource || 'Unknown'}</span>
            <span className="opacity-75">
                {isOpenSearch ? '⚡ Analytics' : '⚠️ Fallback'}
            </span>
        </div>
    );
};

export default DataSourceBadge;
