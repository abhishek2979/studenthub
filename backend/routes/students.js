const router  = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { uploadProfile } = require('../config/cloudinary');
const {
  getStudents, getStudent, createStudent,
  updateStudent, resetStudentPassword, deleteStudent, getStudentStats,
} = require('../controllers/studentController');

router.use(protect);

router.get('/stats', authorize('teacher'), getStudentStats);

router.route('/')
  .get(authorize('teacher'), getStudents)
  .post(authorize('teacher'), createStudent);

router.route('/:id')
  .get(getStudent)
  .put(authorize('teacher'), uploadProfile.single('avatar'), updateStudent)
  .delete(authorize('teacher'), deleteStudent);

// Teacher resets a student's password
router.put('/:id/reset-password', authorize('teacher'), resetStudentPassword);

module.exports = router;
