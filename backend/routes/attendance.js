const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const {
  markAttendance, getAttendanceByDate,
  getStudentAttendance, getClassAttendanceStats,
} = require('../controllers/attendanceController');

router.use(protect);

router.post('/',          authorize('teacher', 'admin'), markAttendance);
router.get('/by-date',    authorize('teacher', 'admin'), getAttendanceByDate);
router.get('/class-stats',authorize('teacher', 'admin'), getClassAttendanceStats);
router.get('/student/:studentId', getStudentAttendance);

module.exports = router;
