# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cold Chain Dashboard is a React-based IoT monitoring dashboard for tracking temperature-sensitive cargo in transit. It displays real-time telemetry data from AWS API Gateway including temperature, humidity, pressure, door status, and GPS speed.

## Tech Stack

- React 19.2 with Vite 7.2
- Tailwind CSS 4.1 for styling
- Recharts 3.5 for data visualization
- Lucide React for icons
- ESLint 9 for linting

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run ESLint
npm run lint

# Preview production build
npm run preview
```

## Architecture

### Single-File Component Structure

The entire application lives in `src/App.jsx` (731 lines). All components (StatCard, ExportableChart), API logic, and the main ColdChainDashboard component are defined in this single file.

### Data Flow

```
AWS API Gateway → fetchTelemetry() → React State → Components
                     ↓
              Auto-refresh (30s interval)
```

### API Integration

- **Base URL:** `https://bew2bvjbxb.execute-api.ap-southeast-2.amazonaws.com/prod`
- **Endpoint:** `GET /telemetry?deviceId={deviceId}&range={range}`
- **Ranges supported:** `24h`, `7d`
- **Response format:** AWS Lambda proxy format with JSON string in `body` field

The API returns:
- `history`: Array of time-series telemetry points
- `current`: Latest sensor readings
- `metadata`: Device info (driver_name, vehicle_reg, cargo_type, thresholds)
- `alerts`: Alert groups with severity and messages
- `count`: Total readings count

### Key Features

1. **Real-time Monitoring:** Auto-refreshes every 30 seconds
2. **Alert System:**
   - Temperature breach detection (compares against metadata thresholds)
   - Theft risk detection (door open + vehicle moving > 10 km/h)
   - API-driven alerts with severity levels (CRITICAL, WARNING, SECURITY)
3. **Data Visualization:**
   - Temperature trend line chart with threshold reference line
   - Humidity area chart
   - CSV export for both charts
4. **Responsive Layout:** Collapsible sidebar, mobile-friendly grid

### State Management

Uses React useState/useEffect hooks only:
- `telemetryData`: API response data
- `isLoading`: Loading states for UI
- `range`: Selected time range ('24h' or '7d')
- `isSidebarOpen`: Mobile sidebar toggle

### Debug Logging

The codebase has extensive console logging (prefixed with `[DEBUG]`) throughout the data fetching and rendering flow. This is intentional for development but should be considered when debugging.

### Threshold Configuration

Temperature thresholds come from API metadata, with fallbacks:
- Min: `metadata.temp_threshold_min` or `metadata.temp_min` or -25
- Max: `metadata.threshold_max` or `metadata.temp_max` or 8

## File Structure

```
src/
├── App.jsx          # Main application (all components)
├── main.jsx         # React entry point
├── index.css        # Tailwind import
└── assets/          # Static assets
```

## Important Notes

- No test suite is configured
- No environment variables are used; API URL is hardcoded
- The app is designed for a single device ID: `SCCIM_Device_001`
- Charts use Recharts with ResponsiveContainer for responsive sizing
- Tailwind CSS v4 uses `@import "tailwindcss"` syntax in CSS files
