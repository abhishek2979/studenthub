const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for profile pictures
const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'student-management/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
  },
});

// Storage for result documents
const documentStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'student-management/documents',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    resource_type: 'auto',
  },
});

const uploadProfile  = multer({ storage: profileStorage,  limits: { fileSize: 5 * 1024 * 1024 } });
const uploadDocument = multer({ storage: documentStorage, limits: { fileSize: 10 * 1024 * 1024 } });

module.exports = { cloudinary, uploadProfile, uploadDocument };
