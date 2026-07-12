/**
 * Email Reminder Script for Expiring Driver Licenses
 * Run via: node src/scripts/licenseReminder.js
 * In production: schedule as a daily cron job
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { Driver } from '../modules/driver-safety-profile/driver.model.js';

const sendExpiryReminder = async () => {
  try {
    const connStr = process.env.MONGODB_URI;
    if (!connStr) {
      console.error('Error: MONGODB_URI not defined');
      process.exit(1);
    }

    console.log('Connecting to database...');
    await mongoose.connect(connStr);

    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Find drivers whose license expires within next 30 days or already expired
    const expiringDrivers = await Driver.find({
      isActive: true,
      licenseExpiryDate: { $lte: in30Days },
    }).lean();

    if (expiringDrivers.length === 0) {
      console.log('✅ No drivers with expiring licenses found.');
    } else {
      console.log(`⚠ Found ${expiringDrivers.length} driver(s) with expiring/expired licenses:\n`);
      expiringDrivers.forEach((driver) => {
        const expiry = new Date(driver.licenseExpiryDate);
        const daysLeft = Math.ceil((expiry - now) / 86400000);
        const status = daysLeft <= 0 ? '❌ EXPIRED' : `⚠ Expires in ${daysLeft} day(s)`;
        console.log(`  - ${driver.name} | License: ${driver.licenseNumber} | ${status} (${expiry.toDateString()})`);

        // In production with nodemailer configured:
        // await transporter.sendMail({
        //   from: 'noreply@transitops.in',
        //   to: 'safety@transitops.in',
        //   subject: `License Expiry Alert: ${driver.name}`,
        //   text: `Driver ${driver.name} (License: ${driver.licenseNumber}) ${daysLeft <= 0 ? 'has an expired license' : `license expires in ${daysLeft} days`}.`,
        // });
        console.log(`  📧 [EMAIL REMINDER] Would send alert to safety@transitops.in`);
      });
    }

    await mongoose.connection.close();
    console.log('\nReminder check complete.');
  } catch (error) {
    console.error('Error running license reminder:', error);
    process.exit(1);
  }
};

sendExpiryReminder();
