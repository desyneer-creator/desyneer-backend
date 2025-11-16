// Dosya yolu: server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
// connectDB fonksiyonunu import ediyoruz
const connectDB = require('./config/database'); 
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects'); 
const proposalRoutes = require('./routes/proposals'); // Yeni teklif rotasını import ediyoruz

const app = express();

// Middleware'ler (Sıra Önemlidir)
app.use(express.json()); // 1. POST verilerini JSON olarak alabilmek için gerekli
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));


// ROTALARIN TANIMLANMASI (Tüm istekler buraya yönlendirilir)
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/proposals', proposalRoutes); // KRİTİK: Yeni teklif rotası eklendi

// Sağlık kontrolü rotası
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});


// 404 Hata işleyici (Tüm Rotalar DENENDİKTEN SONRA en sonda çalışır)
app.use((req, res, next) => {
  const error = new Error('Route not found');
  error.status = 404;
  next(error);
});

// Genel hata işleyici (Tüm hataları yakalar: 404, 500 vb.)
app.use((err, req, res, next) => {
  const statusCode = err.status || 500;
  
  const errorDetails = process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error';

  console.error(err);
  res.status(statusCode).json({ 
    message: err.message, // Hata mesajını gönder
    status: statusCode 
  });
});

// KRİTİK DÜZELTME: Sunucuyu başlatma ve MongoDB bağlantısını yönetme fonksiyonu
const startServer = async () => {
    const PORT = process.env.PORT || 5000;
    try {
        // MongoDB bağlantısını BEKLİYORUZ 
        await connectDB(); 
        
        // Bağlantı başarılıysa sunucuyu başlatıyoruz
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
};

// Sunucuyu başlat
startServer();