const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { uploadDocument } = require('../config/cloudinary');
const {
  addResult, getStudentResults, getAllResults,
  updateResult, deleteResult, getPerformanceStats,
} = require('../controllers/resultController');

router.use(protect);

router.get('/performance-stats', authorize('teacher', 'admin'), getPerformanceStats);
router.get('/all',               authorize('teacher', 'admin'), getAllResults);
router.post('/',                 authorize('teacher', 'admin'), uploadDocument.single('document'), addResult);

router.get('/student/:studentId', getStudentResults);

router.route('/:id')
  .put(authorize('teacher', 'admin'), uploadDocument.single('document'), updateResult)
  .delete(authorize('teacher', 'admin'), deleteResult);

module.exports = router;
