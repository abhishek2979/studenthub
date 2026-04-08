const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student:  { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  date:     { type: String, required: true }, // "YYYY-MM-DD"
  status:   { type: String, enum: ['present', 'absent', 'late'], required: true },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  note:     { type: String, default: '' },
  session:  { type: String, default: 'full-day' }, // full-day / morning / afternoon
}, { timestamps: true });

// Compound index: one record per student per date
attendanceSchema.index({ student: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
