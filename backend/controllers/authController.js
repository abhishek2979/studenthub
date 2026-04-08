const asyncHandler      = require('express-async-handler');
const { OAuth2Client }  = require('google-auth-library');
const User              = require('../models/User');
const { generateToken } = require('../utils/generateToken');

// ── TEACHER: Google OAuth Sign-In / Sign-Up ───────────────────────────────
const googleAuth = asyncHandler(async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    res.status(400); throw new Error('Google credential is required');
  }

  if (!process.env.GOOGLE_CLIENT_ID) {
    res.status(500); throw new Error('Server misconfiguration: GOOGLE_CLIENT_ID is not set in .env');
  }

  // Verify the ID token with Google
  // Create a fresh client per request to avoid any caching issues
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken:  credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (err) {
    // Log the real error on server so you can debug
    console.error('[Google Auth] Token verification failed:', err.message);

    // Give a helpful message based on common causes
    let msg = 'Google sign-in failed — please try again';
    if (err.message?.includes('Token used too late'))  msg = 'Token expired — please sign in again';
    if (err.message?.includes('Invalid token'))        msg = 'Invalid Google token — check GOOGLE_CLIENT_ID in .env matches your Google Console';
    if (err.message?.includes('audience'))             msg = 'Client ID mismatch — make sure VITE_GOOGLE_CLIENT_ID (frontend) and GOOGLE_CLIENT_ID (backend) are identical';

    res.status(401); throw new Error(msg);
  }

  const { sub: googleId, email, name, picture } = payload;

  if (!email) { res.status(400); throw new Error('Google account has no email'); }

  // Block if this email is already a student account
  const existingStudent = await User.findOne({ email, role: 'student' });
  if (existingStudent) {
    res.status(403);
    throw new Error('This email is already registered as a student account');
  }

  // Find or create the teacher
  let teacher = await User.findOne({ googleId });

  if (!teacher) {
    // Check if email exists (first Google login for a previously-created account)
    const byEmail = await User.findOne({ email, role: 'teacher' });
    if (byEmail) {
      byEmail.googleId    = googleId;
      byEmail.googleEmail = email;
      if (picture && !byEmail.avatar) byEmail.avatar = picture;
      byEmail.lastLogin = new Date();
      await byEmail.save();
      teacher = byEmail;
    } else {
      // Brand new teacher — auto-create
      teacher = await User.create({
        name, email, googleId,
        googleEmail: email,
        avatar:   picture || '',
        role:     'teacher',
        lastLogin: new Date(),
      });
      console.log(`[Google Auth] New teacher account created: ${email}`);
    }
  } else {
    // Returning teacher
    teacher.name      = name;
    teacher.lastLogin = new Date();
    if (picture) teacher.avatar = picture;
    await teacher.save();
  }

  if (!teacher.isActive) {
    res.status(403); throw new Error('Account deactivated. Contact admin.');
  }

  const token = generateToken(teacher._id, teacher.role);
  console.log(`[Google Auth] Teacher signed in: ${email}`);
  res.json({ success: true, token, user: sanitize(teacher) });
});

// ── TEACHER: Email + Password Register ───────────────────────────────────
const teacherRegister = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400); throw new Error('Name, email, and password are required');
  }
  if (password.length < 6) {
    res.status(400); throw new Error('Password must be at least 6 characters');
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    res.status(409); throw new Error('An account with this email already exists');
  }

  const teacher = await User.create({
    name:  name.trim(),
    email: email.toLowerCase().trim(),
    password,
    role: 'teacher',
    lastLogin: new Date(),
  });

  console.log(`[Teacher Register] New teacher created via email: ${email}`);
  const token = generateToken(teacher._id, teacher.role);
  res.status(201).json({ success: true, token, user: sanitize(teacher) });
});

// ── TEACHER: Email + Password Sign-In ────────────────────────────────────
const teacherLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400); throw new Error('Email and password are required');
  }

  const teacher = await User.findOne({
    email: email.toLowerCase().trim(),
    role:  'teacher',
  }).select('+password');

  if (!teacher || !teacher.password) {
    res.status(401); throw new Error('Invalid email or password');
  }

  const match = await teacher.matchPassword(password);
  if (!match) {
    res.status(401); throw new Error('Invalid email or password');
  }

  if (!teacher.isActive) {
    res.status(403); throw new Error('Account deactivated. Contact admin.');
  }

  teacher.lastLogin = new Date();
  await teacher.save({ validateBeforeSave: false });

  const token = generateToken(teacher._id, teacher.role);
  console.log(`[Teacher Login] Email sign-in: ${email}`);
  res.json({ success: true, token, user: sanitize(teacher) });
});

// ── STUDENT: Username + Password ─────────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400); throw new Error('Username and password are required');
  }

  const user = await User.findOne({
    username: username.toLowerCase().trim(),
    role: 'student',
  }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    res.status(401); throw new Error('Invalid username or password');
  }
  if (!user.isActive) {
    res.status(403); throw new Error('Account deactivated. Contact your teacher.');
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id, user.role);
  res.json({ success: true, token, user: sanitize(user) });
});

// ── GET ME ────────────────────────────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: sanitize(req.user) });
});

// ── UPDATE PROFILE ────────────────────────────────────────────────────────
const updateProfile = asyncHandler(async (req, res) => {
  ['name', 'phone', 'subject', 'department'].forEach(f => {
    if (req.body[f] !== undefined) req.user[f] = req.body[f];
  });
  if (req.file) {
    req.user.avatar        = req.file.path;
    req.user.avatarPublicId = req.file.filename;
  }
  await req.user.save();
  res.json({ success: true, user: sanitize(req.user) });
});

// ── CHANGE PASSWORD (students only) ──────────────────────────────────────
const changePassword = asyncHandler(async (req, res) => {
  if (req.user.role === 'teacher') {
    res.status(400); throw new Error('Teachers authenticate via Google — no password to change');
  }
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) { res.status(400); throw new Error('Both passwords required'); }
  if (newPassword.length < 6) { res.status(400); throw new Error('Min 6 characters'); }

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) {
    res.status(400); throw new Error('Current password is incorrect');
  }
  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password changed successfully' });
});

// ── Helper ────────────────────────────────────────────────────────────────
const sanitize = u => ({
  _id:       u._id,
  name:      u.name,
  email:     u.email,
  username:  u.username,
  role:      u.role,
  avatar:    u.avatar,
  rollNo:    u.rollNo,
  class:     u.class,
  phone:     u.phone,
  subject:   u.subject,
  department:u.department,
  isActive:  u.isActive,
  lastLogin: u.lastLogin,
  createdAt: u.createdAt,
  googleId:  u.googleId ? true : false,
});

module.exports = { googleAuth, teacherRegister, teacherLogin, login, getMe, updateProfile, changePassword };
