import React from 'react';

const RiskScoreBadge = ({ score }) => {
    if (!score || score === 'unknown') return null;

    const colors = {
        HIGH: 'bg-red-100 text-red-800 border-red-200',
        MEDIUM: 'bg-orange-100 text-orange-800 border-orange-200',
        LOW: 'bg-green-100 text-green-800 border-green-200'
    };

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colors[score] || colors.LOW}`}>
            Risk: {score}
        </span>
    );
};

export default RiskScoreBadge;
