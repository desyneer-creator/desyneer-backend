const jwt = require('jsonwebtoken'); // JWT kütüphanesini dahil et
const User = require('../models/User'); // Kullanıcı modelini dahil et (gerekirse user objesini çekmek için)

const protect = async (req, res, next) => {
  let token;

  // 1. Authorization header'ından token'ı kontrol et
  // Format: "Bearer <token>"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Token'ı "Bearer" kısmından ayır
    token = req.headers.authorization.split(' ')[1];
  }

  // 2. Token yoksa 401 (Yetkisiz) hatası döndür
  if (!token) {
    return res.status(401).json({ 
        message: 'Not authorized to access this route (No token).' 
    });
  }

  try {
    // 3. Token'ı doğrula
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Opsiyonel: Token'daki ID ile kullanıcıyı veritabanından çek (gerekirse)
    // Bu, kullanıcının güncel bilgilerine her zaman erişimi sağlar
    req.user = await User.findById(decoded.id);

    // Eğer kullanıcı bulunamazsa (örneğin kullanıcı silinmişse)
    if (!req.user) {
        return res.status(401).json({ 
            message: 'Not authorized to access this route (User not found).' 
        });
    }

    // 4. Doğrulama başarılı, sonraki middleware/kontrolcüye geç
    next();

  } catch (err) {
    console.error('Token doğrulama hatası:', err.message);
    return res.status(401).json({ 
        message: 'Not authorized to access this route (Token failed).' 
    });
  }
};

module.exports = protect;