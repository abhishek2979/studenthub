const asyncHandler  = require('express-async-handler');
const Attendance    = require('../models/Attendance');
const Student       = require('../models/Student');

// MARK attendance for a date (bulk – all students at once)
const markAttendance = asyncHandler(async (req, res) => {
  const { date, records } = req.body;
  // records: [{ studentId, status, note }]

  const ops = records.map(r => ({
    updateOne: {
      filter: { student: r.studentId, date },
      update: { $set: { status: r.status, note: r.note || '', markedBy: req.user._id } },
      upsert: true,
    },
  }));

  await Attendance.bulkWrite(ops);
  res.json({ success: true, message: `Attendance saved for ${date}` });
});

// GET attendance for a date (for teacher to mark)
const getAttendanceByDate = asyncHandler(async (req, res) => {
  const { date, cls } = req.query;
  const students = cls ? await Student.find({ class: cls, status: 'active' }) : await Student.find({ status: 'active' });
  const records  = await Attendance.find({ date, student: { $in: students.map(s => s._id) } });

  const map = {};
  records.forEach(r => { map[r.student.toString()] = r.status; });

  const result = students.map(s => ({
    _id: s._id, name: s.name, roll: s.roll, class: s.class,
    avatar: s.avatar, initials: s.initials,
    status: map[s._id.toString()] || null,
  }));

  res.json({ success: true, date, attendance: result });
});

// GET attendance summary for a student (calendar heatmap)
const getStudentAttendance = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { month } = req.query; // "2024-04"

  const query = { student: studentId };
  if (month) {
    query.date = { $gte: `${month}-01`, $lte: `${month}-31` };
  }

  const records = await Attendance.find(query).sort({ date: -1 });

  const total   = records.length;
  const present = records.filter(r => r.status === 'present').length;
  const late    = records.filter(r => r.status === 'late').length;
  const absent  = records.filter(r => r.status === 'absent').length;
  const pct     = total ? parseFloat(((present + late) / total * 100).toFixed(1)) : 0;

  res.json({
    success: true,
    summary: { total, present, late, absent, percentage: pct },
    records,
  });
});

// GET class-wide attendance stats (for teacher overview)
const getClassAttendanceStats = asyncHandler(async (req, res) => {
  const { cls, from, to } = req.query;

  const students = cls ? await Student.find({ class: cls }) : await Student.find();
  const sIds = students.map(s => s._id);

  const match = { student: { $in: sIds } };
  if (from && to) match.date = { $gte: from, $lte: to };

  const agg = await Attendance.aggregate([
    { $match: match },
    { $group: {
        _id: '$status',
        count: { $sum: 1 },
    }},
  ]);

  const stats = { present: 0, absent: 0, late: 0 };
  agg.forEach(a => { stats[a._id] = a.count; });
  const total = stats.present + stats.absent + stats.late;
  stats.percentage = total ? parseFloat((stats.present / total * 100).toFixed(1)) : 0;

  // Daily trend (last 14 days)
  const trend = await Attendance.aggregate([
    { $match: match },
    { $group: { _id: { date: '$date', status: '$status' }, count: { $sum: 1 } } },
    { $sort: { '_id.date': -1 } },
    { $limit: 56 }, // 14 days * 4 statuses
  ]);

  res.json({ success: true, stats, trend });
});

module.exports = { markAttendance, getAttendanceByDate, getStudentAttendance, getClassAttendanceStats };
