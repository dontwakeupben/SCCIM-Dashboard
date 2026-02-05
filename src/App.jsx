import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useFleetStore } from './store/fleetStore';
import Layout from './components/Layout';
import FleetOverview from './pages/FleetOverview';
import TruckDashboard from './pages/TruckDashboard';
import Analytics from './pages/Analytics';
import './App.css';

function App() {
  // Use Zustand store for fleet data
  const { devices, fetchDevices, isLoadingDevices } = useFleetStore();

  // Load fleet data once at app level (no auto-refresh)
  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  return (
    <BrowserRouter>
      <Layout fleet={devices}>
        <Routes>
          <Route path="/" element={<FleetOverview />} />
          <Route path="/dashboard/:deviceId" element={<TruckDashboard />} />
          <Route path="/shipments" element={<ShipmentsPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

// Placeholder pages
function ShipmentsPage() {
  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Active Shipments</h1>
      <p className="text-slate-500">This feature is coming soon.</p>
    </div>
  );
}

function AlertsPage() {
  const { devices } = useFleetStore();
  const alertTrucks = devices.filter(t =>
    t.current_location?.temperature > t.alert_threshold
  );

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Alerts & Issues</h1>
      {alertTrucks.length > 0 ? (
        <div className="space-y-4">
          {alertTrucks.map(truck => (
            <div key={truck.device_id} className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="font-medium text-red-800">{truck.device_id}</p>
              <p className="text-red-600">
                Temperature breach: {truck.current_location?.temperature}°C exceeds {truck.alert_threshold}°C
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-500">No active alerts.</p>
      )}
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Settings</h1>
      <p className="text-slate-500">This feature is coming soon.</p>
    </div>
  );
}

export default App;
