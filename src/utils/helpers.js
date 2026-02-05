// --- Helper Functions ---

export function formatTime(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function formatDateTime(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export function formatFullDate(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export function timeAgo(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
}

export function getAlertType(severity) {
    switch (severity) {
        case 'CRITICAL': return 'critical';
        case 'WARNING': return 'warning';
        case 'SECURITY': return 'security';
        default: return 'info';
    }
}

export function isTemperatureBreached(temp, tempMax = 8) {
    return temp > tempMax;
}

export function getTempThresholds(metadata) {
    if (!metadata) return { min: -25, max: 8 };
    return {
        min: metadata.temp_threshold_min ?? metadata.temp_min ?? -25,
        max: metadata.temp_threshold_max ?? metadata.temp_max ?? 8
    };
}

export function isTheftRisk(doorOpen, gpsSpeed) {
    return doorOpen && gpsSpeed > 10;
}

// Calculate statistics from history data
export function calculateStats(history) {
    if (!history || history.length === 0) return { avg: null, min: null, max: null };

    const temps = history.map(h => h.temperature).filter(t => t !== undefined && t !== null);
    if (temps.length === 0) return { avg: null, min: null, max: null };

    const avg = temps.reduce((a, b) => a + b, 0) / temps.length;
    return {
        avg: avg.toFixed(1),
        min: Math.min(...temps).toFixed(1),
        max: Math.max(...temps).toFixed(1)
    };
}

// Get cargo type color
export function getCargoColor(cargoType) {
    const type = cargoType?.toLowerCase() || '';
    if (type.includes('frozen') || type.includes('seafood')) return '#2196F3'; // Blue
    if (type.includes('fresh') || type.includes('produce')) return '#4CAF50'; // Green
    if (type.includes('pharma') || type.includes('pharmaceutical')) return '#FF9800'; // Orange
    if (type.includes('high') || type.includes('risk')) return '#F44336'; // Red
    return '#607D8B'; // Default gray
}

// Get cargo type icon/emoji
export function getCargoEmoji(cargoType) {
    const type = cargoType?.toLowerCase() || '';
    if (type.includes('frozen') || type.includes('seafood')) return '🦟'; // Lobster
    if (type.includes('fresh') || type.includes('produce')) return '🥬'; // Leafy green
    if (type.includes('pharma') || type.includes('pharmaceutical')) return '💊'; // Pill
    if (type.includes('high') || type.includes('risk')) return '⚠️'; // Warning
    return '📦'; // Package
}

// Get temperature status color
export function getTempStatusColor(temp, threshold) {
    if (temp > threshold) return '#F44336'; // Critical - Red
    if (temp > threshold - 2) return '#FF9800'; // Warning - Orange
    return '#4CAF50'; // Normal - Green
}

// Get risk score color
export function getRiskScoreColor(score) {
    switch (score) {
        case 'HIGH': return '#F44336';
        case 'MEDIUM': return '#FF9800';
        case 'LOW': return '#4CAF50';
        default: return '#607D8B';
    }
}

// Export data to CSV
export function exportToCSV(data, filename) {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
