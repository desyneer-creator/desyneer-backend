const User = require('../models/User'); // User modelini dahil et

// JWT token'ı client'a gönderme
const sendTokenResponse = (user, statusCode, res) => {
  // Token'ı User modelindeki metod ile oluşturuyoruz
  const token = user.getSignedJwtToken();

  // JWT'yi çerez olarak göndermek yerine şimdilik sadece JSON olarak gönderiyoruz.
  res.status(statusCode).json({
    success: true,
    token,
    user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
    }
  });
};


// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  const { username, email, password, role } = req.body;

  try {
    // 1. Kullanıcı oluştur (Mongoose pre-save hook şifreyi otomatik hash'ler)
    const user = await User.create({
      username,
      email,
      password,
      role: role || 'client' 
    });

    // 2. Başarı durumunda token gönder
    sendTokenResponse(user, 201, res);

  } catch (err) {
    console.error('Kayıt hatası:', err.message);
    
    // 11000 kodu, benzersiz alan (unique index) hatasıdır (e-posta veya kullanıcı adı zaten kayıtlı)
    if (err.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'This email or username is already registered.' 
      });
    }
    
    // Diğer doğrulama hataları (Mongoose validation errors)
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

  // 1. E-posta ve şifrenin gönderildiğini kontrol et
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide an email and password.' });
  }

  try {
    // 2. Kullanıcıyı e-posta ile bul, şifreyi de çekmek için .select('+password') kullan
    const user = await User.findOne({ email }).select('+password');

    // 3. Kullanıcı yoksa hata döndür
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // 4. Şifreyi karşılaştır (User modelindeki metodu kullan)
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // 5. Giriş başarılıysa token gönder
    sendTokenResponse(user, 200, res);
    
  } catch (err) {
    console.error('Login hatası:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error during login.' });
  }
};