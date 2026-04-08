const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  roll:     { type: String, required: true, unique: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  class:    { type: String, required: true },
  phone:    { type: String, default: '' },
  avatar:   { type: String, default: '' },
  avatarPublicId: { type: String, default: '' },
  status:   { type: String, enum: ['active', 'inactive', 'graduated'], default: 'active' },
  userRef:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  address:  { type: String, default: '' },
  dob:      { type: Date },
  guardian: { name: String, phone: String, relation: String },
}, { timestamps: true });

// Virtual: initials
studentSchema.virtual('initials').get(function () {
  return this.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
});

studentSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Student', studentSchema);
