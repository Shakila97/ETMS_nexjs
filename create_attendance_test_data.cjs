const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Attendance = require('./models/Attendance');
const Employee = require('./models/Employee');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/etms';

// Helper function to create a date with specific time
function createDateTime(daysAgo, hours, minutes) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(hours, minutes, 0, 0);
    return date;
}

// Helper function to get start of day
function getStartOfDay(daysAgo) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(0, 0, 0, 0);
    return date;
}

async function createAttendanceTestData() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get all employees
        console.log('📋 Fetching employees...');
        const employees = await Employee.find().select('_id firstName lastName employeeId');

        if (employees.length === 0) {
            console.log('❌ No employees found in database!');
            console.log('💡 Please create employees first before adding attendance data.');
            process.exit(1);
        }

        console.log(`✅ Found ${employees.length} employees\n`);

        // Clear existing attendance data (optional - comment out if you want to keep existing data)
        console.log('🗑️  Clearing existing attendance data...');
        await Attendance.deleteMany({});
        console.log('✅ Cleared existing attendance data\n');

        const attendanceRecords = [];

        // Create attendance data for the last 30 days
        console.log('📊 Creating attendance test data for the last 30 days...\n');

        for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
            const date = getStartOfDay(daysAgo);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6; // Sunday or Saturday

            for (const employee of employees) {
                // Skip weekends for most employees (90% chance)
                if (isWeekend && Math.random() > 0.1) {
                    continue;
                }

                // 95% attendance rate (5% chance of being absent)
                if (Math.random() < 0.05) {
                    // Create absent record
                    attendanceRecords.push({
                        employee: employee._id,
                        date: date,
                        status: 'absent',
                        totalHours: 0,
                        overtimeHours: 0,
                    });
                    continue;
                }

                // Randomize check-in time (8:00 AM - 9:30 AM)
                const checkInHour = 8;
                const checkInMinute = Math.floor(Math.random() * 90); // 0-90 minutes
                const checkInTime = createDateTime(daysAgo, checkInHour, checkInMinute);

                // Determine if late (after 9:00 AM)
                const isLate = checkInMinute > 60;

                // Randomize check-out time (5:00 PM - 7:00 PM)
                const checkOutHour = 17 + Math.floor(Math.random() * 3); // 17-19 (5 PM - 7 PM)
                const checkOutMinute = Math.floor(Math.random() * 60);
                const checkOutTime = createDateTime(daysAgo, checkOutHour, checkOutMinute);

                // Calculate total hours
                const totalMinutes = (checkOutTime - checkInTime) / (1000 * 60);

                // Random break time (30-60 minutes)
                const breakDuration = 30 + Math.floor(Math.random() * 31);
                const breakStartTime = createDateTime(daysAgo, 12, Math.floor(Math.random() * 60));
                const breakEndTime = new Date(breakStartTime.getTime() + breakDuration * 60000);

                const workMinutes = totalMinutes - breakDuration;
                const totalHours = workMinutes / 60;

                // Calculate overtime (standard is 8 hours)
                const overtimeHours = Math.max(0, totalHours - 8);

                // Determine status
                let status = 'present';
                if (isLate) {
                    status = 'late';
                } else if (totalHours < 4) {
                    status = 'half-day';
                }

                attendanceRecords.push({
                    employee: employee._id,
                    date: date,
                    checkIn: {
                        time: checkInTime,
                        location: {
                            latitude: 6.9271 + (Math.random() - 0.5) * 0.01,
                            longitude: 79.8612 + (Math.random() - 0.5) * 0.01,
                            address: 'Office Location, Colombo',
                        },
                        method: Math.random() > 0.5 ? 'biometric' : 'mobile',
                    },
                    checkOut: {
                        time: checkOutTime,
                        location: {
                            latitude: 6.9271 + (Math.random() - 0.5) * 0.01,
                            longitude: 79.8612 + (Math.random() - 0.5) * 0.01,
                            address: 'Office Location, Colombo',
                        },
                        method: Math.random() > 0.5 ? 'biometric' : 'mobile',
                    },
                    breakTime: [
                        {
                            start: breakStartTime,
                            end: breakEndTime,
                            duration: breakDuration,
                        },
                    ],
                    totalHours: parseFloat(totalHours.toFixed(2)),
                    overtimeHours: parseFloat(overtimeHours.toFixed(2)),
                    status: status,
                });
            }
        }

        // Insert all attendance records
        console.log(`💾 Inserting ${attendanceRecords.length} attendance records...`);
        await Attendance.insertMany(attendanceRecords);
        console.log(`✅ Successfully created ${attendanceRecords.length} attendance records!\n`);

        // Show summary statistics
        console.log('📊 Summary Statistics:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        const stats = await Attendance.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                },
            },
        ]);

        stats.forEach(stat => {
            console.log(`   ${stat._id.toUpperCase()}: ${stat.count} records`);
        });

        const totalStats = await Attendance.aggregate([
            {
                $group: {
                    _id: null,
                    totalRecords: { $sum: 1 },
                    avgHours: { $avg: '$totalHours' },
                    totalOvertime: { $sum: '$overtimeHours' },
                },
            },
        ]);

        if (totalStats.length > 0) {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`   Total Records: ${totalStats[0].totalRecords}`);
            console.log(`   Average Hours/Day: ${totalStats[0].avgHours.toFixed(2)}`);
            console.log(`   Total Overtime Hours: ${totalStats[0].totalOvertime.toFixed(2)}`);
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Show sample records
        console.log('📋 Sample Attendance Records (Last 5):');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        const sampleRecords = await Attendance.find()
            .populate('employee', 'firstName lastName employeeId')
            .sort({ date: -1 })
            .limit(5);

        sampleRecords.forEach(record => {
            const dateStr = record.date.toISOString().split('T')[0];
            const checkIn = record.checkIn?.time ? new Date(record.checkIn.time).toLocaleTimeString() : 'N/A';
            const checkOut = record.checkOut?.time ? new Date(record.checkOut.time).toLocaleTimeString() : 'N/A';

            console.log(`\n   📅 ${dateStr}`);
            console.log(`   👤 ${record.employee.firstName} ${record.employee.lastName} (${record.employee.employeeId})`);
            console.log(`   ⏰ Check-in: ${checkIn} | Check-out: ${checkOut}`);
            console.log(`   ⏱️  Total Hours: ${record.totalHours}h | Overtime: ${record.overtimeHours}h`);
            console.log(`   📊 Status: ${record.status.toUpperCase()}`);
        });

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('🎉 Attendance test data created successfully!');
        console.log('💡 You can now view the attendance data in your frontend application.');
        console.log('💡 Navigate to the Attendance module to see the records.\n');

    } catch (error) {
        console.error('❌ Error creating attendance test data:', error);
        console.error('\n💡 Troubleshooting:');
        console.error('   1. Make sure MongoDB is running');
        console.error('   2. Check your .env file has correct MONGODB_URI');
        console.error('   3. Ensure employees exist in the database');
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
}

createAttendanceTestData();
