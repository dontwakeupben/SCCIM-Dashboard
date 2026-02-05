// --- Constants & Configuration per Technical Specification ---

export const CARGO_CONFIG = {
    'Frozen Seafood': {
        color: '#2196F3',
        icon: '🐟',
        gradient: ['#E3F2FD', '#2196F3'],
        threshold: -18
    },
    'Fresh Produce': {
        color: '#4CAF50',
        icon: '🥬',
        gradient: ['#E8F5E9', '#4CAF50'],
        threshold: 4
    },
    'Pharmaceuticals': {
        color: '#FF9800',
        icon: '💊',
        gradient: ['#FFF3E0', '#FF9800'],
        threshold: 2
    },
    'Dairy': {
        color: '#9C27B0',
        icon: '🥛',
        gradient: ['#F3E5F5', '#9C27B0'],
        threshold: 4
    },
    'Meat': {
        color: '#F44336',
        icon: '🥩',
        gradient: ['#FFEBEE', '#F44336'],
        threshold: -15
    }
};

export const RISK_COLORS = {
    LOW: '#4CAF50',
    ELEVATED: '#FFEB3B',
    MEDIUM: '#FF9800',
    HIGH: '#F44336',
    UNKNOWN: '#9E9E9E'
};

export const MAP_CONFIG = {
    center: [1.3521, 103.8198], // Singapore
    zoom: 12,
    bounds: {
        latMin: 1.15,
        latMax: 1.47,
        lngMin: 103.6,
        lngMax: 104.1
    }
};

export const REFRESH_RATES = {
    fleet: 30000,      // 30s
    telemetry: 10000,  // 10s
    locations: 30000,  // 30s
    analytics: 300000  // 5min
};

export const CARGO_TYPES = [
    'Frozen Seafood',
    'Fresh Produce',
    'Pharmaceuticals',
    'Dairy',
    'Meat'
];

export const CARGO_SENSITIVITY_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const STATUS_COLORS = {
    ACTIVE: 'bg-green-100 text-green-800 border-green-200',
    DISABLED: 'bg-gray-100 text-gray-800 border-gray-200',
    OFFLINE: 'bg-red-100 text-red-800 border-red-200',
    MAINTENANCE: 'bg-yellow-100 text-yellow-800 border-yellow-200'
};

export const API_BASE_URL = 'https://bew2bvjbxb.execute-api.ap-southeast-2.amazonaws.com/prod';
