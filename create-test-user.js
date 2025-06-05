//create-test-user

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const { hydrate } = require('./models/SessionLog');

async function createTestUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('bcryptjs version:', require('bcryptjs').version); // should print a version string

    // Step 1: Cleanup BEFORE hashing
    // await User.deleteMany({ username: { $in: ['admin', 'client1', 'client2'] } });
    // console.log('🧹 Deleted existing test users (admin, client1, client2)');
    const hashedPassword = await bcrypt.hash('Netcall$123', 10);

    // Step 2: Prepare test users with hashed passwords
    const testUsers = [
    {
      username: 'admin.tracker@netcall',
      password: await bcrypt.hash('Netcall$5522', 10),
      role: 'admin',
    },
    { username: 'arijit.banerjee@netcallservices.com', password: hashedPassword, role: 'user' },
    { username: 'krishnendu.ray@netcallservices.com', password: hashedPassword, role: 'user' },
    { username: 'dipayan.ghosh@netcallservices.com', password: hashedPassword, role: 'user' },
    { username: 'danish.alam@netcallservices.com', password: hashedPassword, role: 'user' },
    { username: 'sahil.thakur@netcallservices.com', password: hashedPassword, role: 'user' },
    { username: 'shankadwip.talukdar@netcallservices.com', password: await bcrypt.hash('Netcall$1', 10), role: 'user' },
    { username: 'hr.kolkata@netcallservices.com', password: hashedPassword, role: 'user' }
  ];


    // Step 3: Create users
    const createdUsers = await User.insertMany(testUsers);
    console.log('✅ Test users created:', createdUsers.map(u => u.username));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    process.exit(1);
  }
}

module.exports = createTestUser;

// createTestUser();