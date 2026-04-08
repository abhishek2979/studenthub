// ─────────────────────────────────────────────────────────────────────────────
// StudentHub — Seed Script
//
// Creates sample STUDENT accounts only.
// Teachers log in via Google OAuth — no seeding needed for them.
// ─────────────────────────────────────────────────────────────────────────────
require('dotenv').config();
const mongoose = require('mongoose');
const User     = require('./models/User');
const Student  = require('./models/Student');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB\n');

  await User.deleteMany({ role: 'student' });
  await Student.deleteMany({});

  const studentsData = [
    { name:'Arjun Sharma',  roll:'CS001', email:'arjun@school.edu',  username:'arjun.sharma',  class:'10-A', phone:'9876543210' },
    { name:'Priya Patel',   roll:'CS002', email:'priya@school.edu',   username:'priya.patel',   class:'10-A', phone:'9876543211' },
    { name:'Ravi Verma',    roll:'CS003', email:'ravi@school.edu',    username:'ravi.verma',    class:'10-B', phone:'9876543212' },
    { name:'Sneha Gupta',   roll:'CS004', email:'sneha@school.edu',   username:'sneha.gupta',   class:'10-B', phone:'9876543213' },
    { name:'Kiran Singh',   roll:'CS005', email:'kiran@school.edu',   username:'kiran.singh',   class:'10-A', phone:'9876543214' },
  ];

  for (const s of studentsData) {
    const student = await Student.create({ name:s.name, roll:s.roll, email:s.email, class:s.class, phone:s.phone });
    await User.create({
      name:s.name, email:s.email, username:s.username,
      password:'Student@123', role:'student',
      rollNo:s.roll, class:s.class, phone:s.phone,
      studentRef:student._id,
    });
    console.log(`  ✅ Student: @${s.username}  /  Student@123`);
  }

  console.log('\n🎉 Seed complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Student logins (all use password: Student@123)');
  console.log('  @arjun.sharma   @priya.patel   @ravi.verma');
  console.log('  @sneha.gupta   @kiran.singh');
  console.log('');
  console.log('Teacher login → use "Sign in with Google" on the login page.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await mongoose.disconnect();
};

seed().catch(err => { console.error(err); process.exit(1); });
