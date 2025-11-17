const express = require('express');
const {
  createProject,
  getProjects,
  getProjectById,
  getMatchedFreelancers,
  // --- 'submitProposal' buradan (import'tan) silindi (ASIL HATA BURADAYDI) ---
  updateProjectStatus,
} = require('../controllers/projectController'); // [cite: controllers/projectController.js]
const protect = require('../middleware/auth'); // [cite: auth.js]

const router = express.Router();

// === PUBLIC ROTALAR (Giriş Gerekmez) ===
// GET /api/projects - TÜM PROJELERİ LİSTELE
router.get('/', getProjects); 

// GET /api/projects/:id - Tek bir proje detayını gör
router.get('/:id', getProjectById);

// === PRIVATE ROTALAR (Giriş Gerekli) ===
// POST /api/projects - Yeni Proje Oluşturma
router.post('/', protect, createProject); 

// GET /api/projects/:projectId/matches - Projeye gelen teklifleri (eşleşmeleri) gör
router.get('/:projectId/matches', protect, getMatchedFreelancers);

// PUT /api/projects/:id/status - Proje durumunu güncelle
router.put('/:id/status', protect, updateProjectStatus);

module.exports = router;