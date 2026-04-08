const asyncHandler = require('express-async-handler');
const Result   = require('../models/Result');
const Student  = require('../models/Student');
const { cloudinary } = require('../config/cloudinary');

// ADD result
const addResult = asyncHandler(async (req, res) => {
  const { studentId, subject, marks, maxMarks, examType, examDate, remarks } = req.body;

  const student = await Student.findById(studentId);
  if (!student) { res.status(404); throw new Error('Student not found'); }

  const result = await Result.create({
    student: studentId, subject, marks: Number(marks),
    maxMarks: Number(maxMarks) || 100,
    examType, examDate, remarks,
    documentUrl: req.file?.path || '',
    documentPublicId: req.file?.filename || '',
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, result });
});

// GET results for a student
const getStudentResults = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { examType, subject } = req.query;

  const query = { student: studentId };
  if (examType) query.examType = examType;
  if (subject)  query.subject  = subject;

  const results = await Result.find(query).sort({ examDate: -1 });

  // Compute subject averages
  const subjectMap = {};
  results.forEach(r => {
    if (!subjectMap[r.subject]) subjectMap[r.subject] = { total: 0, count: 0 };
    subjectMap[r.subject].total += r.percentage;
    subjectMap[r.subject].count++;
  });
  const subjectAverages = Object.entries(subjectMap).map(([sub, d]) => ({
    subject: sub,
    average: parseFloat((d.total / d.count).toFixed(1)),
  }));

  res.json({ success: true, results, subjectAverages });
});

// GET all results (teacher view – with student info)
const getAllResults = asyncHandler(async (req, res) => {
  const { examType, subject, cls, page = 1, limit = 30 } = req.query;

  // Filter students by class
  let sIds;
  if (cls) {
    const students = await Student.find({ class: cls });
    sIds = students.map(s => s._id);
  }

  const query = {};
  if (sIds)     query.student  = { $in: sIds };
  if (examType) query.examType = examType;
  if (subject)  query.subject  = subject;

  const total   = await Result.countDocuments(query);
  const results = await Result.find(query)
    .populate('student', 'name roll class avatar')
    .sort({ examDate: -1 })
    .skip((page - 1) * limit).limit(Number(limit));

  res.json({ success: true, total, results });
});

// UPDATE result
const updateResult = asyncHandler(async (req, res) => {
  const result = await Result.findById(req.params.id);
  if (!result) { res.status(404); throw new Error('Result not found'); }

  const fields = ['marks', 'maxMarks', 'examType', 'examDate', 'remarks', 'subject'];
  fields.forEach(f => { if (req.body[f] !== undefined) result[f] = req.body[f]; });

  if (req.file) {
    if (result.documentPublicId) await cloudinary.uploader.destroy(result.documentPublicId, { resource_type: 'auto' });
    result.documentUrl = req.file.path;
    result.documentPublicId = req.file.filename;
  }

  await result.save();
  res.json({ success: true, result });
});

// DELETE result
const deleteResult = asyncHandler(async (req, res) => {
  const result = await Result.findById(req.params.id);
  if (!result) { res.status(404); throw new Error('Result not found'); }

  if (result.documentPublicId) await cloudinary.uploader.destroy(result.documentPublicId, { resource_type: 'auto' });
  await result.deleteOne();

  res.json({ success: true, message: 'Result deleted' });
});

// GET performance stats (teacher analytics)
const getPerformanceStats = asyncHandler(async (req, res) => {
  const { cls, examType } = req.query;

  let sIds;
  if (cls) {
    const students = await Student.find({ class: cls });
    sIds = students.map(s => s._id);
  }

  const match = {};
  if (sIds)     match.student  = { $in: sIds };
  if (examType) match.examType = examType;

  const [gradeAgg, subjectAgg, topStudents] = await Promise.all([
    // Grade distribution
    Result.aggregate([
      { $match: match },
      { $group: { _id: '$grade', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    // Subject averages
    Result.aggregate([
      { $match: match },
      { $group: { _id: '$subject', avg: { $avg: { $multiply: [{ $divide: ['$marks', '$maxMarks'] }, 100] } }, count: { $sum: 1 } } },
      { $project: { subject: '$_id', avg: { $round: ['$avg', 1] }, count: 1 } },
      { $sort: { avg: -1 } },
    ]),
    // Top 5 students
    Result.aggregate([
      { $match: match },
      { $group: { _id: '$student', avgPct: { $avg: { $multiply: [{ $divide: ['$marks', '$maxMarks'] }, 100] } } } },
      { $sort: { avgPct: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'students', localField: '_id', foreignField: '_id', as: 'student' } },
      { $unwind: '$student' },
      { $project: { name: '$student.name', roll: '$student.roll', avgPct: { $round: ['$avgPct', 1] } } },
    ]),
  ]);

  res.json({ success: true, gradeDistribution: gradeAgg, subjectAverages: subjectAgg, topStudents });
});

module.exports = { addResult, getStudentResults, getAllResults, updateResult, deleteResult, getPerformanceStats };
