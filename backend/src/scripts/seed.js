import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import { User } from '../modules/auth/auth.model.js';
import { Role } from '../modules/settings-rbac/role.model.js';
import { Vehicle } from '../modules/vehicle-registry/vehicle.model.js';
import { Driver } from '../modules/driver-safety-profile/driver.model.js';
import { Trip } from '../modules/trip-dispatcher/trip.model.js';
import { MaintenanceLog } from '../modules/maintenance/maintenance.model.js';
import { FuelLog } from '../modules/fuel-expense-management/fuel.model.js';
import { Expense } from '../modules/fuel-expense-management/expense.model.js';
import { AuditLog } from '../modules/audit/audit.model.js';

const seedDatabase = async () => {
  try {
    const connStr = process.env.MONGODB_URI;
    if (!connStr) { console.error('MONGODB_URI not set'); process.exit(1); }

    console.log('🔌 Connecting to database...');
    await mongoose.connect(connStr);
    console.log('✅ Connected. Wiping old records...');

    await Promise.all([
      User.deleteMany({}), Role.deleteMany({}), Vehicle.deleteMany({}),
      Driver.deleteMany({}), Trip.deleteMany({}), MaintenanceLog.deleteMany({}),
      FuelLog.deleteMany({}), Expense.deleteMany({}), AuditLog.deleteMany({}),
    ]);

    /* ─── 1. ROLES ───────────────────────────────────────────────── */
    console.log('📋 Seeding roles...');
    await Role.insertMany([
      { roleName: 'admin',            description: 'Administrator — full system access', permissions: ['*'] },
      { roleName: 'fleet_manager',    description: 'Oversees fleet, maintenance, and dispatch', permissions: ['read_vehicles','write_vehicles','read_drivers','read_trips','write_trips','read_maintenance','write_maintenance','read_expenses','write_expenses','read_reports'] },
      { roleName: 'dispatcher',       description: 'Manages trip bookings and active dispatch', permissions: ['read_vehicles','read_drivers','read_trips','write_trips','read_maintenance','read_expenses'] },
      { roleName: 'safety_officer',   description: 'Driver compliance and safety tracking', permissions: ['read_vehicles','read_drivers','write_drivers','read_trips','read_maintenance','read_expenses','read_reports'] },
      { roleName: 'financial_analyst',description: 'Expense review and profitability analysis', permissions: ['read_vehicles','read_drivers','read_trips','read_expenses','write_expenses','read_reports'] },
      { roleName: 'driver',           description: 'Vehicle operator', permissions: ['read_trips','read_maintenance','write_maintenance','write_expenses'] },
    ]);

    /* ─── 2. USERS ───────────────────────────────────────────────── */
    console.log('👥 Seeding users...');
    const hash = await bcrypt.hash('transit123', 10);
    const users = await User.insertMany([
      { name: 'Super Admin',      email: 'admin@transitops.in',      password: hash, role: 'admin' },
      { name: 'Karan Sharma',     email: 'fleet@transitops.in',      password: hash, role: 'fleet_manager' },
      { name: 'Raven Kumar',      email: 'dispatcher@transitops.in', password: hash, role: 'dispatcher' },
      { name: 'Amit Patel',       email: 'safety@transitops.in',     password: hash, role: 'safety_officer' },
      { name: 'Nidhi Singhal',    email: 'analyst@transitops.in',    password: hash, role: 'financial_analyst' },
      { name: 'Harpreet Singh',   email: 'driver@transitops.in',     password: hash, role: 'driver' },
    ]);

    /* ─── 3. VEHICLES ────────────────────────────────────────────── */
    console.log('🚛 Seeding vehicles...');
    const vehicles = await Vehicle.insertMany([
      { registrationNumber: 'DL-01-GB-4812', vehicleName: 'BharatBenz 2823R',       type: 'Truck',   maxLoadCapacity: 15000, odometer: 48200, acquisitionCost: 3500000, region: 'North',   status: 'Available' },
      { registrationNumber: 'MH-12-PQ-9081', vehicleName: 'Tata Prima 4925.T',      type: 'Truck',   maxLoadCapacity: 25000, odometer: 12500, acquisitionCost: 5200000, region: 'West',    status: 'Available' },
      { registrationNumber: 'KA-03-HA-3321', vehicleName: 'Mahindra Cruzio Cargo',  type: 'Utility', maxLoadCapacity: 5000,  odometer: 29800, acquisitionCost: 1800000, region: 'South',   status: 'In Shop'   },
      { registrationNumber: 'GJ-09-ZK-1100', vehicleName: 'Eicher Pro 2095XP',      type: 'Van',     maxLoadCapacity: 8000,  odometer: 65000, acquisitionCost: 2200000, region: 'West',    status: 'Available' },
      { registrationNumber: 'UP-32-AM-7741', vehicleName: 'Ashok Leyland 2518',     type: 'Truck',   maxLoadCapacity: 18000, odometer: 91000, acquisitionCost: 4100000, region: 'North',   status: 'Available' },
      { registrationNumber: 'TN-22-BA-5509', vehicleName: 'Force Traveller T1',     type: 'Utility', maxLoadCapacity: 3500,  odometer: 37500, acquisitionCost: 900000,  region: 'South',   status: 'Retired'   },
      { registrationNumber: 'RJ-14-CK-8823', vehicleName: 'Tata Ace Gold',          type: 'Van',     maxLoadCapacity: 1000,  odometer: 15200, acquisitionCost: 700000,  region: 'Central', status: 'Available' },
      { registrationNumber: 'WB-06-DL-2234', vehicleName: 'BharatBenz 1617R',       type: 'Truck',   maxLoadCapacity: 16000, odometer: 55000, acquisitionCost: 3200000, region: 'East',    status: 'In Shop'   },
    ]);

    /* ─── 4. DRIVERS ─────────────────────────────────────────────── */
    console.log('🧑‍✈️ Seeding drivers...');
    const drivers = await Driver.insertMany([
      { name: 'Rajesh Yadav',   licenseNumber: 'DL1420210087612', licenseCategory: 'Heavy Duty',    licenseExpiryDate: new Date('2028-12-31'), contactNumber: '+919876543210', safetyScore: 92, status: 'Available' },
      { name: 'Sardar Singh',   licenseNumber: 'PB0220190034123', licenseCategory: 'Heavy Duty',    licenseExpiryDate: new Date('2029-05-15'), contactNumber: '+919988776655', safetyScore: 88, status: 'Available' },
      { name: 'Mohit Chauhan',  licenseNumber: 'HR2620220056234', licenseCategory: 'Light Vehicle',  licenseExpiryDate: new Date('2026-04-01'), contactNumber: '+918877665544', safetyScore: 75, status: 'Available' },
      { name: 'Deepak Verma',   licenseNumber: 'UP3220200011871', licenseCategory: 'Commercial',     licenseExpiryDate: new Date('2027-08-20'), contactNumber: '+917766554433', safetyScore: 95, status: 'On Trip'   },
      { name: 'Arjun Nair',     licenseNumber: 'KL0120210098712', licenseCategory: 'Commercial',     licenseExpiryDate: new Date('2028-03-10'), contactNumber: '+916655443322', safetyScore: 83, status: 'Available' },
      { name: 'Suresh Babu',    licenseNumber: 'TN2220190045671', licenseCategory: 'Heavy Duty',    licenseExpiryDate: new Date('2025-01-15'), contactNumber: '+915544332211', safetyScore: 61, status: 'Suspended' },
      { name: 'Harpreet Singh', licenseNumber: 'PB0120230076543', licenseCategory: 'Light Vehicle',  licenseExpiryDate: new Date('2030-11-30'), contactNumber: '+914433221100', safetyScore: 97, status: 'Available' },
      { name: 'Vijay Patil',    licenseNumber: 'MH1220210067891', licenseCategory: 'Commercial',     licenseExpiryDate: new Date('2024-06-30'), contactNumber: '+913322110099', safetyScore: 72, status: 'Available' },
    ]);

    /* ─── 5. TRIPS ───────────────────────────────────────────────── */
    console.log('🗺️ Seeding trips...');
    const tripsData = [
      { tripId: 'TRIP-2026-001', source: 'Gandhinagar Depot', destination: 'Mumbai Hub',     vehicle: vehicles[1]._id, driver: drivers[0]._id, cargoWeight: 12000, plannedDistance: 530, revenue: 45000, status: 'Dispatched', isActive: true  },
      { tripId: 'TRIP-2026-002', source: 'Delhi Yard',        destination: 'Chandigarh WH',  vehicle: vehicles[4]._id, driver: drivers[3]._id, cargoWeight: 17000, plannedDistance: 250, revenue: 32000, status: 'Dispatched', isActive: true  },
      { tripId: 'TRIP-2026-003', source: 'Pune Plant',        destination: 'Nashik Depot',   vehicle: vehicles[3]._id, driver: drivers[4]._id, cargoWeight: 6000,  plannedDistance: 210, revenue: 15000, status: 'Draft',      isActive: true  },
      { tripId: 'TRIP-2026-004', source: 'Bangalore Cold',    destination: 'Chennai Port',   vehicle: vehicles[0]._id, driver: drivers[1]._id, cargoWeight: 3000,  plannedDistance: 350, revenue: 22000, status: 'Draft',      isActive: true  },
      { tripId: 'TRIP-2026-005', source: 'Jaipur Depot',      destination: 'Ajmer City',     vehicle: vehicles[6]._id, driver: drivers[6]._id, cargoWeight: 800,   plannedDistance: 135, revenue: 8000,  status: 'Completed',  isActive: false },
      { tripId: 'TRIP-2026-006', source: 'Kolkata Hub',       destination: 'Siliguri WH',    vehicle: vehicles[7]._id, driver: drivers[1]._id, cargoWeight: 14000, plannedDistance: 560, revenue: 52000, status: 'Completed',  isActive: false },
      { tripId: 'TRIP-2026-007', source: 'Ahmedabad Depo',    destination: 'Surat Plant',    vehicle: vehicles[0]._id, driver: drivers[2]._id, cargoWeight: 9500,  plannedDistance: 260, revenue: 18000, status: 'Cancelled',  isActive: false },
      { tripId: 'TRIP-2026-008', source: 'Lucknow Yard',      destination: 'Varanasi WH',    vehicle: vehicles[4]._id, driver: drivers[7]._id, cargoWeight: 5000,  plannedDistance: 320, revenue: 20000, status: 'Draft',      isActive: true  },
    ];
    const trips = await Trip.insertMany(tripsData);

    /* ─── 6. MAINTENANCE LOGS ────────────────────────────────────── */
    console.log('🔧 Seeding maintenance logs...');
    await MaintenanceLog.insertMany([
      { vehicle: vehicles[2]._id, maintenanceType: 'Repair',       description: 'Engine Overhaul — Full engine teardown and rebuild after 30k km',          cost: 85000, status: 'Active',    startDate: new Date('2026-07-01') },
      { vehicle: vehicles[7]._id, maintenanceType: 'Repair',       description: 'Transmission Repair — Gearbox replacement — syncromesh damaged',               cost: 42000, status: 'Active',    startDate: new Date('2026-07-05') },
      { vehicle: vehicles[0]._id, maintenanceType: 'Repair',       description: 'Tyre Replacement — All 10 tyres replaced with Apollo Milespeed XL',        cost: 28000, status: 'Completed', startDate: new Date('2026-06-10'), endDate: new Date('2026-06-11') },
      { vehicle: vehicles[1]._id, maintenanceType: 'Routine',      description: 'Oil & Filter Change — Scheduled 15,000 km service',                           cost: 4500,  status: 'Completed', startDate: new Date('2026-05-22'), endDate: new Date('2026-05-22') },
      { vehicle: vehicles[3]._id, maintenanceType: 'Repair',       description: 'Brake Pad Replacement — Front and rear brake pads replaced',                    cost: 9200,  status: 'Completed', startDate: new Date('2026-06-28'), endDate: new Date('2026-06-29') },
      { vehicle: vehicles[4]._id, maintenanceType: 'Repair',       description: 'AC Compressor Repair — Cabin AC not working — compressor replaced',            cost: 18000, status: 'Active',    startDate: new Date('2026-07-08') },
      { vehicle: vehicles[6]._id, maintenanceType: 'Inspection',   description: 'Annual Inspection — Govt mandated annual fitness certificate check',         cost: 3000,  status: 'Completed', startDate: new Date('2026-04-15'), endDate: new Date('2026-04-15') },
      { vehicle: vehicles[0]._id, maintenanceType: 'Repair',       description: 'Battery Replacement — Starter battery dead — replaced with 120Ah unit',       cost: 7500,  status: 'Completed', startDate: new Date('2026-03-10'), endDate: new Date('2026-03-10') },
    ]);

    /* ─── 7. FUEL LOGS ───────────────────────────────────────────── */
    console.log('⛽ Seeding fuel logs...');
    const fuelAdmin = users[0]._id;
    await FuelLog.insertMany([
      { vehicle: vehicles[0]._id, liters: 120, cost: 10800, date: new Date('2026-07-10'), loggedBy: fuelAdmin },
      { vehicle: vehicles[1]._id, liters: 200, cost: 18000, date: new Date('2026-07-09'), loggedBy: fuelAdmin },
      { vehicle: vehicles[3]._id, liters: 90,  cost: 8100,  date: new Date('2026-07-08'), loggedBy: fuelAdmin },
      { vehicle: vehicles[4]._id, liters: 180, cost: 16200, date: new Date('2026-07-07'), loggedBy: fuelAdmin },
      { vehicle: vehicles[0]._id, liters: 110, cost: 9900,  date: new Date('2026-07-05'), loggedBy: fuelAdmin },
      { vehicle: vehicles[6]._id, liters: 40,  cost: 3600,  date: new Date('2026-07-04'), loggedBy: fuelAdmin },
      { vehicle: vehicles[1]._id, liters: 220, cost: 19800, date: new Date('2026-07-02'), loggedBy: fuelAdmin },
      { vehicle: vehicles[4]._id, liters: 165, cost: 14850, date: new Date('2026-06-28'), loggedBy: fuelAdmin },
      { vehicle: vehicles[3]._id, liters: 75,  cost: 6750,  date: new Date('2026-06-25'), loggedBy: fuelAdmin },
      { vehicle: vehicles[0]._id, liters: 130, cost: 11700, date: new Date('2026-06-20'), loggedBy: fuelAdmin },
    ]);

    /* ─── 8. EXPENSES ────────────────────────────────────────────── */
    console.log('💰 Seeding expenses...');
    await Expense.insertMany([
      { vehicle: vehicles[0]._id, category: 'Maintenance', cost: 28000, date: new Date('2026-06-11'), description: 'Tyre replacement — 10 units Apollo XL', loggedBy: fuelAdmin },
      { vehicle: vehicles[1]._id, category: 'Fuel',        cost: 18000, date: new Date('2026-07-09'), description: 'Full tank refuel — Mumbai run',         loggedBy: fuelAdmin },
      { vehicle: vehicles[3]._id, category: 'Tolls',       cost: 2400,  date: new Date('2026-07-08'), description: 'NH48 toll charges — Pune–Nashik',       loggedBy: fuelAdmin },
      { vehicle: vehicles[4]._id, category: 'Repair',      cost: 18000, date: new Date('2026-07-08'), description: 'AC compressor replacement',              loggedBy: fuelAdmin },
      { vehicle: vehicles[0]._id, category: 'Fuel',        cost: 10800, date: new Date('2026-07-10'), description: 'Fuel card top-up — Delhi depot',         loggedBy: fuelAdmin },
      { vehicle: vehicles[2]._id, category: 'Maintenance', cost: 85000, date: new Date('2026-07-01'), description: 'Engine overhaul — KA-03',                loggedBy: fuelAdmin },
      { vehicle: vehicles[7]._id, category: 'Repair',      cost: 42000, date: new Date('2026-07-05'), description: 'Gearbox replacement — WB-06',            loggedBy: fuelAdmin },
      { vehicle: vehicles[1]._id, category: 'Insurance',   cost: 65000, date: new Date('2026-06-01'), description: 'Annual comprehensive insurance renewal',  loggedBy: fuelAdmin },
      { vehicle: vehicles[6]._id, category: 'Fuel',        cost: 3600,  date: new Date('2026-07-04'), description: 'Fuel top-up — Jaipur–Ajmer run',        loggedBy: fuelAdmin },
      { vehicle: vehicles[3]._id, category: 'Driver Payout', cost: 12000, date: new Date('2026-06-30'), description: 'June driver payout — Eicher Pro',     loggedBy: fuelAdmin },
      { vehicle: vehicles[4]._id, category: 'Tolls',       cost: 1800,  date: new Date('2026-07-07'), description: 'Lucknow–Kanpur expressway toll',         loggedBy: fuelAdmin },
      { vehicle: vehicles[0]._id, category: 'Driver Payout', cost: 14000, date: new Date('2026-06-30'), description: 'June driver payout — BharatBenz',     loggedBy: fuelAdmin },
    ]);

    console.log('\n======================================================');
    console.log('🎉 DATABASE SEED COMPLETED SUCCESSFULLY!');
    console.log('======================================================');
    console.log('📧 Credentials (Password: transit123 for all):');
    users.forEach(u => console.log(`  ${u.role.padEnd(18)} → ${u.email}`));
    console.log(`\n🚛 Vehicles: ${vehicles.length}  |  🧑‍✈️ Drivers: ${drivers.length}  |  🗺️ Trips: ${trips.length}`);
    console.log('======================================================\n');

    await mongoose.connection.close();
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
};

seedDatabase();
