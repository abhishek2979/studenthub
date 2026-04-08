const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  student:    { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  subject:    { type: String, required: true },
  marks:      { type: Number, required: true, min: 0 },
  maxMarks:   { type: Number, required: true, default: 100 },
  examType:   { type: String, enum: ['Mid-term', 'Final', 'Unit-test', 'Quiz', 'Assignment'], required: true },
  examDate:   { type: Date, required: true },
  grade:      { type: String },
  remarks:    { type: String, default: '' },
  documentUrl: { type: String, default: '' },
  documentPublicId: { type: String, default: '' },
  createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Auto-compute grade before save
resultSchema.pre('save', function (next) {
  const pct = (this.marks / this.maxMarks) * 100;
  if (pct >= 95)      this.grade = 'A+';
  else if (pct >= 85) this.grade = 'A';
  else if (pct >= 75) this.grade = 'B+';
  else if (pct >= 65) this.grade = 'B';
  else if (pct >= 55) this.grade = 'C+';
  else                this.grade = 'C';
  next();
});

// Virtual: percentage
resultSchema.virtual('percentage').get(function () {
  return parseFloat(((this.marks / this.maxMarks) * 100).toFixed(1));
});

resultSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Result', resultSchema);
