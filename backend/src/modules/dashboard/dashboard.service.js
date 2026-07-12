import { Vehicle } from '../vehicle-registry/vehicle.model.js';
import { Driver } from '../driver-safety-profile/driver.model.js';
import { Trip } from '../trip-dispatcher/trip.model.js';
import { MaintenanceLog } from '../maintenance/maintenance.model.js';
import { AuditLog } from '../audit/audit.model.js';

class DashboardService {
  /**
   * Get operational KPIs and active aggregates
   */
  async getDashboardData({ vehicleType, region, status }) {
    // 1. Build dynamic filter for Vehicle queries
    const vehicleFilter = { isActive: true };
    if (vehicleType) vehicleFilter.type = vehicleType;
    if (region) vehicleFilter.region = region;
    if (status) vehicleFilter.status = status;

    // Execute concurrent queries for fast load times
    const [
      activeVehicles,
      availableVehicles,
      inShopVehicles,
      retiredVehicles,
      driversOnDuty,
      activeTrips,
      pendingTrips,
      recentTrips,
      recentMaintenance,
      recentActivities,
      statusCounts,
    ] = await Promise.all([
      // Vehicle counts under filters
      Vehicle.countDocuments({ ...vehicleFilter, status: 'On Trip' }),
      Vehicle.countDocuments({ ...vehicleFilter, status: 'Available' }),
      Vehicle.countDocuments({ ...vehicleFilter, status: 'In Shop' }),
      Vehicle.countDocuments({ ...vehicleFilter, status: 'Retired' }),

      // Drivers on duty (Available or On Trip)
      Driver.countDocuments({ isActive: true, status: { $in: ['Available', 'On Trip'] } }),

      // Trips states
      Trip.countDocuments({ isActive: true, status: 'Dispatched' }),
      Trip.countDocuments({ isActive: true, status: 'Draft' }),

      // Recent lists
      Trip.find({ isActive: true })
        .populate('vehicle', 'registrationNumber vehicleName type')
        .populate('driver', 'name licenseNumber contactNumber')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      MaintenanceLog.find()
        .populate('vehicle', 'registrationNumber vehicleName')
        .sort({ startDate: -1 })
        .limit(5)
        .lean(),

      AuditLog.find()
        .populate('user', 'name email role')
        .sort({ timestamp: -1 })
        .limit(8)
        .lean(),

      // Status aggregation for charts
      Vehicle.aggregate([
        { $match: vehicleFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    // Calculate Fleet Utilization (%) = (Active / (Active + Available)) * 100
    const totalActiveFleet = activeVehicles + availableVehicles;
    const fleetUtilization = totalActiveFleet > 0 ? Math.round((activeVehicles / totalActiveFleet) * 100) : 0;

    // Format status distribution counts
    const statusMetrics = {
      Available: 0,
      'On Trip': 0,
      'In Shop': 0,
      Retired: 0
    };
    statusCounts.forEach((item) => {
      if (item._id in statusMetrics) {
        statusMetrics[item._id] = item.count;
      }
    });

    return {
      kpis: {
        activeVehicles,
        availableVehicles,
        inShopVehicles,
        retiredVehicles,
        activeTrips,
        pendingTrips,
        driversOnDuty,
        fleetUtilization,
      },
      statusDistribution: statusMetrics,
      recentTrips,
      recentMaintenance,
      recentActivities,
    };
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
