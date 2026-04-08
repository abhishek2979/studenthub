const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  avatar:   { type: String, default: '' },
  avatarPublicId: { type: String, default: '' },

  role:     { type: String, enum: ['teacher', 'student'], default: 'student' },

  // ── Teacher auth via Google OAuth ──
  googleId:   { type: String, unique: true, sparse: true },
  googleEmail:{ type: String, default: '' },

  // ── Student auth via username + password ──
  username: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  password: { type: String, minlength: 6, select: false },

  // Teacher fields
  subject:    { type: String, default: '' },
  department: { type: String, default: '' },

  // Student fields
  rollNo:     { type: String, default: '' },
  class:      { type: String, default: '' },
  phone:      { type: String, default: '' },
  studentRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  isActive:  { type: Boolean, default: true },
  lastLogin: { type: Date },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
