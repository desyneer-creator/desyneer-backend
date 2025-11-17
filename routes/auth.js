const express = require('express');
// 'updateProfile' fonksiyonu 'require' satırına eklendi
const { register, login, updateProfile } = require('../controllers/authController'); // [cite: controllers/authController.js]
// 'protect' middleware'i import edildi
const protect = require('../middleware/auth'); // [cite: auth.js]

const router = express.Router();

router.post('/register', register); 
router.post('/login', login); 

// 'updateProfile' (skills ekleme) [cite: User.js] için YENİ ROTA
router.put('/updateprofile', protect, updateProfile);

module.exports = router;