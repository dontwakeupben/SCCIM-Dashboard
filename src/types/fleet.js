// --- TypeScript-style JSDoc Types per Technical Specification ---

/**
 * @typedef {Object} Device
 * @property {string} device_id
 * @property {string} driver_name
 * @property {string} vehicle_reg
 * @property {'Frozen Seafood' | 'Fresh Produce' | 'Pharmaceuticals' | 'Dairy' | 'Meat'} cargo_type
 * @property {'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'} cargo_sensitivity
 * @property {number} alert_threshold
 * @property {number} temp_threshold_min
 * @property {number} temp_threshold_max
 * @property {'ACTIVE' | 'DISABLED'} status
 * @property {Object} [current_location]
 * @property {number} current_location.lat
 * @property {number} current_location.lng
 * @property {number} current_location.speed
 * @property {number} current_location.temperature
 * @property {string} current_location.last_updated
 */

/**
 * @typedef {Object} TelemetryPoint
 * @property {string} timestamp
 * @property {number} temperature
 * @property {number} [humidity]
 * @property {number} [pressure]
 * @property {boolean} door_open
 * @property {Object} gps
 * @property {number} gps.lat
 * @property {number} gps.lng
 * @property {number} gps.speed
 * @property {number} thermal_rate
 */

/**
 * @typedef {Object} Alert
 * @property {string} timestamp
 * @property {'CRITICAL' | 'WARNING' | 'SECURITY'} severity
 * @property {string} message
 */

/**
 * @typedef {Object} TelemetryData
 * @property {string} deviceId
 * @property {Object} current
 * @property {number} current.temperature
 * @property {number} current.humidity
 * @property {boolean} current.door_open
 * @property {number} current.gps_speed
 * @property {number} current.thermal_rate
 * @property {Object} current.location
 * @property {number} current.location.lat
 * @property {number} current.location.lng
 * @property {boolean} current.location.is_moving
 * @property {TelemetryPoint[]} history
 * @property {Object} metadata
 * @property {string} metadata.driver_name
 * @property {string} metadata.vehicle_reg
 * @property {string} metadata.cargo_type
 * @property {number} metadata.temp_threshold_max
 * @property {number} metadata.temp_threshold_min
 * @property {'LOW' | 'MEDIUM' | 'HIGH' | 'ELEVATED' | 'UNKNOWN'} risk_score
 * @property {Alert[]} alerts
 */

/**
 * @typedef {Object} FleetLocation
 * @property {string} device_id
 * @property {string} driver_name
 * @property {string} vehicle_reg
 * @property {string} cargo_type
 * @property {Object} location
 * @property {number} location.lat
 * @property {number} location.lng
 * @property {Object} current_status
 * @property {number} current_status.speed_kmh
 * @property {number} current_status.temperature
 * @property {boolean} current_status.door_open
 */

/**
 * @typedef {Object} CargoAnalytics
 * @property {string} cargo_type
 * @property {number} avg_temperature
 * @property {number} alert_violations
 * @property {number} avg_speed
 * @property {'OPTIMAL' | 'REQUIRES_ATTENTION'} status
 */

/**
 * @typedef {Object} TimeSeriesData
 * @property {string} date
 * @property {number|null} frozen
 * @property {number|null} fresh
 * @property {number|null} pharma
 * @property {number|null} dairy
 * @property {number|null} meat
 */

/**
 * @typedef {Object} SearchAlertItem
 * @property {string} type - Alert type (e.g., 'TEMPERATURE_BREACH')
 * @property {'CRITICAL' | 'WARNING'} severity - Alert severity
 * @property {string} message - Alert message
 * @property {string} [recommendation] - Recommended action
 */

/**
 * @typedef {Object} SearchAlertSensorData
 * @property {number} temperature - Temperature reading
 * @property {number} humidity - Humidity percentage
 * @property {number} speed - GPS speed in km/h
 * @property {boolean} door - Door open status
 * @property {Object} location - GPS coordinates
 * @property {number} location.lat - Latitude
 * @property {number} location.lng - Longitude
 */

/**
 * @typedef {Object} SearchAlertRecord
 * @property {string} device_id - Device identifier
 * @property {string} alert_timestamp - ISO timestamp of the alert
 * @property {string} cargo_type - Type of cargo
 * @property {SearchAlertItem[]} alerts - Array of alert details
 * @property {SearchAlertSensorData} sensor_data - Sensor readings at alert time
 * @property {number} ttl - Time-to-live timestamp
 */

/**
 * @typedef {Object} SearchAlertsSummary
 * @property {number} total_records - Total number of alert records
 * @property {Object} severity_breakdown - Count by severity
 * @property {number} [severity_breakdown.CRITICAL]
 * @property {number} [severity_breakdown.WARNING]
 * @property {Object} time_range - Query time range
 * @property {string} time_range.from - Start time (ISO)
 * @property {string} time_range.to - End time (ISO)
 */

/**
 * @typedef {Object} SearchAlertsCriteria
 * @property {string} device_id - Device ID queried
 * @property {number} hours_back - Hours of history queried
 * @property {string|null} cargo_type_filter - Cargo type filter (if applied)
 * @property {number} limit - Maximum records limit
 */

/**
 * @typedef {Object} SearchAlertsResponse
 * @property {string} querySource - Data source (e.g., 'DynamoDB (SCCIM_AlertHistory)')
 * @property {SearchAlertsCriteria} searchCriteria - Query parameters used
 * @property {SearchAlertsSummary} summary - Summary statistics
 * @property {SearchAlertRecord[]} alerts - Array of alert records
 * @property {number} count - Total count of alerts returned
 */

/**
 * @typedef {Object} GPSPoint
 * @property {number} lat
 * @property {number} lng
 * @property {string} timestamp
 * @property {number} speed
 * @property {number} temperature
 * @property {boolean} door_open
 */

/**
 * @typedef {Object} RegistrationData
 * @property {string} device_id
 * @property {string} driver_name
 * @property {string} vehicle_reg
 * @property {string} cargo_type
 * @property {'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'} cargo_sensitivity
 */

// Export empty object to make this a module
export { };
