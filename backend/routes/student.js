const express = require('express');
const router = express.Router();
const multer = require('multer');
const { registerStudent } = require('../controllers/studentController');

const upload = multer({ dest: 'uploads/' });

router.post('/register', upload.single('image'), registerStudent);

module.exports = router;
