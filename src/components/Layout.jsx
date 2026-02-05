import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
    Truck,
    Package,
    AlertTriangle,
    Download,
    MoreHorizontal,
    X,
    LayoutGrid
} from 'lucide-react';

const Layout = ({ children, fleet = [] }) => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    const navItems = [
        { name: 'Fleet Overview', icon: LayoutGrid, path: '/' },
        { name: 'Active Shipments', icon: Package, path: '/shipments' },
        { name: 'Alerts & Issues', icon: AlertTriangle, path: '/alerts' },
        { name: 'Analytics', icon: Download, path: '/analytics' },
        { name: 'Settings', icon: MoreHorizontal, path: '/settings' },
    ];

    return (
        <div className="h-screen w-screen bg-slate-50 flex font-sans text-slate-900 overflow-hidden">
            {/* Sidebar - Desktop: always visible, Mobile: slide-in */}
            <aside
                className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
                    fixed lg:static lg:translate-x-0 inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white 
                    transition-transform duration-200 ease-in-out flex-shrink-0`}
            >
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="p-6 flex items-center justify-between lg:justify-center border-b border-slate-800">
                        <h1 className="text-xl font-bold tracking-wider flex items-center gap-2">
                            <Truck className="text-blue-400" /> SCCIM
                        </h1>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden text-slate-400 hover:text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.name}
                                to={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`
                                }
                            >
                                <item.icon className="w-5 h-5" />
                                {item.name}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Fleet Summary */}
                    <div className="p-4 border-t border-slate-800">
                        <p className="text-xs text-slate-500 mb-2">Fleet Status</p>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">Active</span>
                            <span className="text-green-400 font-medium">
                                {fleet.filter(t => t.status === 'ACTIVE').length}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-1">
                            <span className="text-slate-400">Total</span>
                            <span className="text-white font-medium">{fleet.length}</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile sidebar */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                {children}
            </div>
        </div>
    );
};

export default Layout;
