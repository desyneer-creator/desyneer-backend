// Dosya yolu: server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database'); // [cite: database.js]
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const proposalRoutes = require('./routes/proposals');

const app = express();

// Middleware'ler
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*', // [cite: .env]
  credentials: true,
}));

// ROTALARIN TANIMLANMASI
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/proposals', proposalRoutes);

// Sağlık kontrolü rotası
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

// 404 Hata işleyici
app.use((req, res, next) => {
  const error = new Error('Route not found');
  error.status = 404;
  next(error);
});

// Genel hata işleyici
app.use((err, req, res, next) => {
  const statusCode = err.status || 500;
  
  console.error(err);
  res.status(statusCode).json({ 
    message: err.message,
    status: statusCode 
  });
});

// Sunucuyu başlatma ve MongoDB bağlantısı
const startServer = async () => {
    const PORT = process.env.PORT || 5000; // [cite: .env]
    try {
        await connectDB(); // [cite: database.js]
        
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