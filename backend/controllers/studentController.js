const asyncHandler = require('express-async-handler');
const Student    = require('../models/Student');
const User       = require('../models/User');
const Attendance = require('../models/Attendance');
const Result     = require('../models/Result');
const { cloudinary } = require('../config/cloudinary');

// GET all students (includes username from User)
const getStudents = asyncHandler(async (req, res) => {
  const { cls, status, search, page = 1, limit = 20 } = req.query;
  const query = {};
  if (cls)    query.class  = cls;
  if (status) query.status = status;
  if (search) query.$or = [
    { name:  { $regex: search, $options: 'i' } },
    { roll:  { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
  ];
  const total    = await Student.countDocuments(query);
  const students = await Student.find(query).skip((page-1)*limit).limit(Number(limit)).sort({ createdAt: -1 });

  // Attach username from User collection
  const studentIds = students.map(s => s._id);
  const userAccounts = await User.find({ studentRef: { $in: studentIds } }).select('studentRef username');
  const usernameMap = {};
  userAccounts.forEach(u => { usernameMap[u.studentRef.toString()] = u.username; });

  const result = students.map(s => ({
    ...s.toObject(),
    _username: usernameMap[s._id.toString()] || '',
  }));

  res.json({ success: true, total, page: Number(page), students: result });
});

// GET single student — also returns their username
const getStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) { res.status(404); throw new Error('Student not found'); }
  const userAcc = await User.findOne({ studentRef: student._id }).select('username isActive lastLogin');
  res.json({ success: true, student, userAccount: userAcc || null });
});

// CREATE student + login account
// Body: name, roll, email, class, phone, address, dob, guardian, username, password
const createStudent = asyncHandler(async (req, res) => {
  const { name, roll, email, class: cls, phone, address, dob, guardian, username, password } = req.body;

  if (!username || username.trim().length < 3) { res.status(400); throw new Error('Username must be at least 3 characters'); }
  if (!password || password.length < 6)        { res.status(400); throw new Error('Password must be at least 6 characters'); }

  const cleanUsername = username.toLowerCase().trim();

  if (await Student.findOne({ $or: [{ roll }, { email }] }))   { res.status(400); throw new Error('Roll number or email already exists'); }
  if (await User.findOne({ username: cleanUsername }))          { res.status(400); throw new Error(`Username "${cleanUsername}" is already taken`); }
  if (await User.findOne({ email }))                            { res.status(400); throw new Error('A login account with that email already exists'); }

  const student = await Student.create({ name, roll, email, class: cls, phone, address, dob, guardian });

  await User.create({
    name, email, username: cleanUsername, password,
    role: 'student',
    rollNo: roll, class: cls, phone: phone || '',
    studentRef: student._id,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, student, username: cleanUsername });
});

// UPDATE student
const updateStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) { res.status(404); throw new Error('Student not found'); }

  const fields = ['name', 'class', 'phone', 'address', 'status', 'dob', 'guardian'];
  fields.forEach(f => { if (req.body[f] !== undefined) student[f] = req.body[f]; });

  if (req.file) {
    if (student.avatarPublicId) await cloudinary.uploader.destroy(student.avatarPublicId);
    student.avatar = req.file.path;
    student.avatarPublicId = req.file.filename;
  }
  await student.save();

  // Sync to User account
  const updateFields = { name: student.name, class: student.class, phone: student.phone || '' };
  if (req.body.username) {
    const uname = req.body.username.toLowerCase().trim();
    const conflict = await User.findOne({ username: uname, studentRef: { $ne: student._id } });
    if (conflict) { res.status(400); throw new Error(`Username "${uname}" is already taken`); }
    updateFields.username = uname;
  }
  await User.findOneAndUpdate({ studentRef: student._id }, { $set: updateFields });

  res.json({ success: true, student });
});

// RESET student password (teacher only)
const resetStudentPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) { res.status(400); throw new Error('Min 6 characters'); }

  const student = await Student.findById(req.params.id);
  if (!student) { res.status(404); throw new Error('Student not found'); }

  const userAccount = await User.findOne({ studentRef: student._id }).select('+password');
  if (!userAccount) { res.status(404); throw new Error('No login account for this student'); }

  userAccount.password = newPassword;
  await userAccount.save();
  res.json({ success: true, message: `Password reset for ${student.name}` });
});

// DELETE student
const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) { res.status(404); throw new Error('Student not found'); }

  if (student.avatarPublicId) await cloudinary.uploader.destroy(student.avatarPublicId);
  await Attendance.deleteMany({ student: student._id });
  await Result.deleteMany({ student: student._id });
  await User.deleteOne({ studentRef: student._id });
  await student.deleteOne();
  res.json({ success: true, message: 'Student deleted' });
});

// GET student stats
const getStudentStats = asyncHandler(async (req, res) => {
  const [total, active, inactive] = await Promise.all([
    Student.countDocuments(),
    Student.countDocuments({ status: 'active' }),
    Student.countDocuments({ status: 'inactive' }),
  ]);
  const byClass = await Student.aggregate([{ $group: { _id: '$class', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]);
  res.json({ success: true, stats: { total, active, inactive, byClass } });
});

module.exports = { getStudents, getStudent, createStudent, updateStudent, resetStudentPassword, deleteStudent, getStudentStats };
