import React, { useState } from 'react';
import { X, Truck, AlertCircle } from 'lucide-react';
import { registerDevice } from '../services/api';
import { CARGO_TYPES } from '../lib/constants';

const RegisterTruckModal = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        device_id: '',
        driver_name: '',
        vehicle_reg: '',
        cargo_type: '',
        alert_threshold: 5,
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    const validateForm = () => {
        const newErrors = {};
        const required = ['device_id', 'driver_name', 'vehicle_reg', 'cargo_type', 'alert_threshold'];

        required.forEach(field => {
            if (formData[field] === undefined || formData[field] === null || formData[field].toString().trim() === '') {
                newErrors[field] = 'This field is required';
            }
        });

        // Device ID pattern validation (should start with SCCIM_)
        if (formData.device_id && !formData.device_id.startsWith('SCCIM_')) {
            newErrors.device_id = 'Device ID must start with "SCCIM_"';
        }

        if (formData.alert_threshold === '' || formData.alert_threshold === null || formData.alert_threshold === undefined) {
            newErrors.alert_threshold = 'Alert threshold is required';
        } else if (isNaN(formData.alert_threshold) || formData.alert_threshold < -50 || formData.alert_threshold > 50) {
            newErrors.alert_threshold = 'Must be a valid temperature between -50 and 50';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'alert_threshold' ? parseFloat(value) || '' : value,
        }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
        setSubmitError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError(null);

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await registerDevice(formData);
            onSuccess(result);
            // Reset form
            setFormData({
                device_id: '',
                driver_name: '',
                vehicle_reg: '',
                cargo_type: '',
                alert_threshold: 5,
            });
            onClose();
        } catch (error) {
            setSubmitError(error.message || 'Failed to register truck. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setErrors({});
            setSubmitError(null);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto relative z-[10000]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Truck className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Register New Truck</h2>
                            <p className="text-sm text-slate-500">Add a new device to your fleet</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Submit Error */}
                    {submitError && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium text-red-800">Registration Failed</p>
                                <p className="text-sm text-red-600">{submitError}</p>
                            </div>
                        </div>
                    )}

                    {/* Device ID */}
                    <div>
                        <label htmlFor="device_id" className="block text-sm font-medium text-slate-700 mb-1.5">
                            Device ID <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="device_id"
                            name="device_id"
                            value={formData.device_id}
                            onChange={handleChange}
                            placeholder="SCCIM_TRUCK_001"
                            className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.device_id ? 'border-red-300 bg-red-50' : 'border-slate-300'
                                }`}
                        />
                        {errors.device_id && (
                            <p className="mt-1 text-sm text-red-600">{errors.device_id}</p>
                        )}
                        <p className="mt-1 text-xs text-slate-500">
                            Must start with "SCCIM_" (e.g., SCCIM_TRUCK_001)
                        </p>
                    </div>

                    {/* Driver Name */}
                    <div>
                        <label htmlFor="driver_name" className="block text-sm font-medium text-slate-700 mb-1.5">
                            Driver Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="driver_name"
                            name="driver_name"
                            value={formData.driver_name}
                            onChange={handleChange}
                            placeholder="John Doe"
                            className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.driver_name ? 'border-red-300 bg-red-50' : 'border-slate-300'
                                }`}
                        />
                        {errors.driver_name && (
                            <p className="mt-1 text-sm text-red-600">{errors.driver_name}</p>
                        )}
                    </div>

                    {/* Vehicle Registration */}
                    <div>
                        <label htmlFor="vehicle_reg" className="block text-sm font-medium text-slate-700 mb-1.5">
                            Vehicle Registration <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="vehicle_reg"
                            name="vehicle_reg"
                            value={formData.vehicle_reg}
                            onChange={handleChange}
                            placeholder="SG1234A"
                            className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.vehicle_reg ? 'border-red-300 bg-red-50' : 'border-slate-300'
                                }`}
                        />
                        {errors.vehicle_reg && (
                            <p className="mt-1 text-sm text-red-600">{errors.vehicle_reg}</p>
                        )}
                    </div>

                    {/* Cargo Type */}
                    <div>
                        <label htmlFor="cargo_type" className="block text-sm font-medium text-slate-700 mb-1.5">
                            Cargo Type <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="cargo_type"
                            name="cargo_type"
                            value={formData.cargo_type}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.cargo_type ? 'border-red-300 bg-red-50' : 'border-slate-300'
                                }`}
                        >
                            <option value="">Select cargo type...</option>
                            {CARGO_TYPES.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                        {errors.cargo_type && (
                            <p className="mt-1 text-sm text-red-600">{errors.cargo_type}</p>
                        )}
                    </div>

                    {/* Alert Threshold */}
                    <div>
                        <label htmlFor="alert_threshold" className="block text-sm font-medium text-slate-700 mb-1.5">
                            Temperature Alert Threshold (°C) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            id="alert_threshold"
                            name="alert_threshold"
                            value={formData.alert_threshold}
                            onChange={handleChange}
                            step="0.1"
                            min="-50"
                            max="50"
                            className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.alert_threshold ? 'border-red-300 bg-red-50' : 'border-slate-300'
                                }`}
                        />
                        {errors.alert_threshold && (
                            <p className="mt-1 text-sm text-red-600">{errors.alert_threshold}</p>
                        )}
                        <p className="mt-1 text-xs text-slate-500">
                            Alert when temperature exceeds this value
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Registering...
                                </>
                            ) : (
                                'Register Truck'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegisterTruckModal;
