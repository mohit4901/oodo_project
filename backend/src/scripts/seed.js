import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../modules/auth/user.model.js';
import { Role } from '../modules/settings-rbac/role.model.js';
import { Vehicle } from '../modules/vehicle-registry/vehicle.model.js';
import { Driver } from '../modules/driver-safety-profile/driver.model.js';
import { Trip } from '../modules/trip-dispatcher/trip.model.js';
import { MaintenanceLog } from '../modules/maintenance/maintenance.model.js';
import { FuelLog } from '../modules/fuel-expense-management/fuel.model.js';
import { Expense } from '../modules/fuel-expense-management/expense.model.js';
import { AuditLog } from '../modules/audit/audit.model.js';
import bcrypt from 'bcryptjs';

const seedDatabase = async () => {
  try {
    const connStr = process.env.MONGODB_URI;
    if (!connStr) {
      console.error('Error: MONGODB_URI is not defined in your environment.');
      process.exit(1);
    }

    console.log('Connecting to database...');
    await mongoose.connect(connStr);
    console.log('Connected. Cleaning up old records...');

    // Clear existing collections
    await Promise.all([
      User.deleteMany({}),
      Role.deleteMany({}),
      Vehicle.deleteMany({}),
      Driver.deleteMany({}),
      Trip.deleteMany({}),
      MaintenanceLog.deleteMany({}),
      FuelLog.deleteMany({}),
      Expense.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    console.log('Database cleaned. Seeding default roles...');

    // 1. Seed Roles
    const roles = [
      {
        roleName: 'admin',
        description: 'Administrator with full system privileges',
        permissions: ['*'],
      },
      {
        roleName: 'fleet_manager',
        description: 'Oversees fleet vehicle registry, dispatch, and maintenance',
        permissions: [
          'read_vehicles',
          'write_vehicles',
          'read_drivers',
          'read_trips',
          'write_trips',
          'read_maintenance',
          'write_maintenance',
          'read_expenses',
          'write_expenses',
          'read_reports',
        ],
      },
      {
        roleName: 'dispatcher',
        description: 'Manages trip bookings, driver allocations, and active dispatches',
        permissions: [
          'read_vehicles',
          'read_drivers',
          'read_trips',
          'write_trips',
          'read_maintenance',
          'read_expenses',
        ],
      },
      {
        roleName: 'safety_officer',
        description: 'Ensures driver compliance and safety score reviews',
        permissions: [
          'read_vehicles',
          'read_drivers',
          'write_drivers',
          'read_trips',
          'read_maintenance',
          'read_reports',
        ],
      },
      {
        roleName: 'financial_analyst',
        description: 'Reviews operational cash expenses and fuel logging metrics',
        permissions: [
          'read_vehicles',
          'read_drivers',
          'read_trips',
          'read_expenses',
          'write_expenses',
          'read_reports',
        ],
      },
      {
        roleName: 'driver',
        description: 'Vehicle operator with access to assigned routes and fuel logs',
        permissions: ['read_trips', 'read_maintenance', 'write_maintenance', 'write_expenses'],
      },
    ];
    await Role.insertMany(roles);
    console.log('Seeding default users...');

    // 2. Seed Users
    const passwordHash = await bcrypt.hash('transit123', 10);
    const users = [
      {
        name: 'Super Admin',
        email: 'admin@transitops.in',
        password: passwordHash,
        role: 'admin',
      },
      {
        name: 'Karan Sharma',
        email: 'fleet@transitops.in',
        password: passwordHash,
        role: 'fleet_manager',
      },
      {
        name: 'Raven Kumar',
        email: 'dispatcher@transitops.in',
        password: passwordHash,
        role: 'dispatcher',
      },
      {
        name: 'Amit Patel',
        email: 'safety@transitops.in',
        password: passwordHash,
        role: 'safety_officer',
      },
      {
        name: 'Nidhi Singhal',
        email: 'analyst@transitops.in',
        password: passwordHash,
        role: 'financial_analyst',
      },
    ];
    const createdUsers = await User.insertMany(users);
    console.log('Seeding initial vehicles...');

    // 3. Seed Vehicles
    const vehicles = [
      {
        registrationNumber: 'DL-01-GB-4812',
        vehicleName: 'BharatBenz 2823R',
        type: 'Truck',
        maxLoadCapacity: 15000,
        odometer: 45000,
        acquisitionCost: 35000,
        region: 'North',
        status: 'Available',
      },
      {
        registrationNumber: 'MH-12-PQ-9081',
        vehicleName: 'Tata Prima 4925.T',
        type: 'Truck',
        maxLoadCapacity: 25000,
        odometer: 12000,
        acquisitionCost: 52000,
        region: 'West',
        status: 'Available',
      },
      {
        registrationNumber: 'KA-03-HA-3321',
        vehicleName: 'Mahindra Cruzio',
        type: 'Utility',
        maxLoadCapacity: 5000,
        odometer: 28000,
        acquisitionCost: 18000,
        region: 'South',
        status: 'In Shop', // Testing maintenance status
      },
    ];
    const createdVehicles = await Vehicle.insertMany(vehicles);
    console.log('Seeding drivers...');

    // 4. Seed Drivers
    const drivers = [
      {
        name: 'Rajesh Yadav',
        licenseNumber: 'DL1420210087612',
        licenseExpiryDate: new Date('2028-12-31'),
        contactNumber: '+919876543210',
        safetyScore: 92,
        status: 'Available',
      },
      {
        name: 'Sardar Singh',
        licenseNumber: 'PB0220190034123',
        licenseExpiryDate: new Date('2029-05-15'),
        contactNumber: '+919988776655',
        safetyScore: 88,
        status: 'Available',
      },
      {
        name: 'Mohit Mudgil',
        licenseNumber: 'HR2620180056234',
        licenseExpiryDate: new Date('2020-01-01'), // Expired license for testing
        contactNumber: '+918877665544',
        safetyScore: 95,
        status: 'Available',
      },
    ];
    await Driver.insertMany(drivers);

    console.log('======================================================');
    console.log('DATABASE SEED COMPLETED SUCCESSFULLY!');
    console.log('Use the following credentials to test your endpoints:');
    console.log('======================================================');
    console.log('Password (same for all users): transit123');
    createdUsers.forEach((usr) => {
      console.log(`- Email: ${usr.email} | Role: ${usr.role}`);
    });
    console.log('======================================================');

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
