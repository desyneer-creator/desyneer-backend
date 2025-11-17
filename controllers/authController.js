const User = require('../models/User'); // User modelini dahil et [cite: User.js]

// JWT token'ı client'a gönderme
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken(); // [cite: User.js]

  res.status(statusCode).json({
    success: true,
    token,
    user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        skills: user.skills // 'skills' alanını da döndür [cite: User.js]
    }
  });
};


// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  const { username, email, password, role } = req.body;

  try {
    const user = await User.create({
      username,
      email,
      password,
      role: role || 'client' 
    });
    sendTokenResponse(user, 201, res);
  } catch (err) {
    console.error('Kayıt hatası:', err.message);
    if (err.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'This email or username is already registered.' 
      });
    }
    res.status(400).json({ 
        success: false, 
        message: err.message 
    });
  }
};


// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide an email and password.' });
  }

  try {
    const user = await User.findOne({ email }).select('+password'); // [cite: User.js]

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await user.matchPassword(password); // [cite: User.js]

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }
    sendTokenResponse(user, 200, res);
    
  } catch (err) {
    console.error('Login hatası:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error during login.' });
  }
};


// @desc    Update user profile (skills, username, etc.)
// @route   PUT /api/auth/updateprofile
// @access  Private (Giriş gerektirir)
exports.updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id); // req.user [cite: auth.js]

    if (!user) {
      return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' });
    }

    const { username, email, skills } = req.body;

    if (username) user.username = username;
    if (email) user.email = email;
    if (skills && Array.isArray(skills)) {
      user.skills = skills; // 'skills' dizisini güncelle [cite: User.js]
    }

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        skills: updatedUser.skills
      }
    });

  } catch (err) {
    console.error('Profil güncelleme hatası:', err.message);
    res.status(500).json({ success: false, message: 'Profil güncellenirken sunucu hatası oluştu.' });
  }
};