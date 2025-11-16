const express = require('express');
const {
  createProject,
  getProjects,
  getProjectById,
  getMatchedFreelancers,
  submitProposal,
  updateProjectStatus,
} = require('../controllers/projectController');
// protect middleware'i import edildi
const protect = require('../middleware/auth'); 

const router = express.Router();

// GET /api/projects - TÜM PROJELERİ LİSTELE (Public)
router.get('/', getProjects); 

// GET /api/projects/:id
router.get('/:id', getProjectById);

// POST /api/projects - Yeni Proje Oluşturma
// KRİTİK: 'protect' middleware'i yetkilendirmeyi sağlamak için geri eklendi!
router.post('/', protect, createProject); 

// GET /api/projects/:projectId/matches
router.get('/:projectId/matches', getMatchedFreelancers);

// POST /api/projects/:projectId/proposal
router.post('/:projectId/proposal', protect, submitProposal);

// PUT /api/projects/:id/status
router.put('/:id/status', protect, updateProjectStatus);

module.exports = router;