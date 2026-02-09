const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user-model');

const MONGODB_URI = 'mongodb://10.12.19.181:27017/helpdesk';

async function createAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ username: 'superpadde' });
    
    if (existingAdmin) {
      console.log('Admin user "superpadde" already exists');
      
      // Update to admin if not already
      if (!existingAdmin.isAdmin) {
        existingAdmin.isAdmin = true;
        await existingAdmin.save();
        console.log('Updated "superpadde" to admin user');
      }
    } else {
      // Create new admin user
      const adminUser = new User({
        username: 'superpadde',
        password: 'superpadde123', // You should change this password!
        isAdmin: true
      });
      
      await adminUser.save();
      console.log('Admin user "superpadde" created successfully');
      console.log('Username: superpadde');
      console.log('Password: superpadde123');
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();

