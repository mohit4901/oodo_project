import { Vehicle } from '../vehicle-registry/vehicle.model.js';
import { createObjectCsvStringifier } from 'csv-writer';

class ReportService {
  /**
   * Run comprehensive aggregation pipeline to get ROI & Fuel Efficiency reports
   */
  async getPerformanceReport({ type, region }) {
    const matchStage = { isActive: true };
    if (type) matchStage.type = type;
    if (region) matchStage.region = region;

    return await Vehicle.aggregate([
      { $match: matchStage },
      // 1. Join with Expense collection
      {
        $lookup: {
          from: 'expenses',
          localField: '_id',
          foreignField: 'vehicle',
          as: 'expenses',
        },
      },
      // 2. Join with Trip collection
      {
        $lookup: {
          from: 'trips',
          localField: '_id',
          foreignField: 'vehicle',
          as: 'trips',
        },
      },
      // 3. Join with FuelLog collection
      {
        $lookup: {
          from: 'fuellogs',
          localField: '_id',
          foreignField: 'vehicle',
          as: 'fuelLogs',
        },
      },
      // 4. Project metrics
      {
        $project: {
          registrationNumber: 1,
          vehicleName: 1,
          type: 1,
          region: 1,
          acquisitionCost: 1,
          odometer: 1,
          status: 1,
          totalCost: { $sum: '$expenses.cost' },
          totalRevenue: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$trips',
                    as: 't',
                    cond: { $eq: ['$$t.status', 'Completed'] },
                  },
                },
                as: 't',
                in: '$$t.revenue',
              },
            },
          },
          totalDistance: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$trips',
                    as: 't',
                    cond: { $eq: ['$$t.status', 'Completed'] },
                  },
                },
                as: 't',
                in: '$$t.actualDistance',
              },
            },
          },
          totalLiters: { $sum: '$fuelLogs.liters' },
        },
      },
      // 5. Calculate ROI and Efficiency
      {
        $addFields: {
          roi: {
            $cond: [
              { $eq: ['$acquisitionCost', 0] },
              0,
              { $divide: [{ $subtract: ['$totalRevenue', '$totalCost'] }, '$acquisitionCost'] },
            ],
          },
          fuelEfficiency: {
            $cond: [
              { $eq: ['$totalLiters', 0] },
              0,
              { $divide: ['$totalDistance', '$totalLiters'] },
            ],
          },
        },
      },
      {
        $sort: { roi: -1 }, // Default sort by highest ROI
      },
    ]);
  }

  /**
   * Generate CSV format for the Performance report
   */
  async exportPerformanceReportCSV(filters) {
    const reportData = await this.getPerformanceReport(filters);

    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'registrationNumber', title: 'REGISTRATION NUMBER' },
        { id: 'vehicleName', title: 'VEHICLE NAME' },
        { id: 'type', title: 'VEHICLE TYPE' },
        { id: 'region', title: 'REGION' },
        { id: 'acquisitionCost', title: 'ACQUISITION COST ($)' },
        { id: 'totalCost', title: 'OPERATIONAL COST ($)' },
        { id: 'totalRevenue', title: 'TOTAL REVENUE ($)' },
        { id: 'roi', title: 'ROI' },
        { id: 'fuelEfficiency', title: 'FUEL EFFICIENCY (km/L)' },
        { id: 'odometer', title: 'ODOMETER (km)' },
        { id: 'status', title: 'STATUS' },
      ],
    });

    const formattedRecords = reportData.map((record) => ({
      ...record,
      roi: record.roi ? record.roi.toFixed(2) : '0.00',
      fuelEfficiency: record.fuelEfficiency ? record.fuelEfficiency.toFixed(2) : '0.00',
      acquisitionCost: record.acquisitionCost.toFixed(2),
      totalCost: record.totalCost.toFixed(2),
      totalRevenue: record.totalRevenue.toFixed(2),
    }));

    const header = csvStringifier.getHeaderString();
    const rows = csvStringifier.stringifyRecords(formattedRecords);
    return header + rows;
  }
}

export const reportService = new ReportService();
export default reportService;
