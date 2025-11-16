// database.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // SADECE BAĞLANTI ADRESİNİ GÖNDER, İKİNCİ PARAMETREYİ SİL
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;