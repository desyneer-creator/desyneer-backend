const express = require('express');
const protect = require('../middleware/auth'); 
// Tüm kontrolcü modülünü tek bir nesne olarak içe aktar
const proposalController = require('../controllers/proposalController'); 

const router = express.Router();

// POST /api/proposals - Yeni Teklif Oluşturma (proposalController nesnesinden erişim)
router.post('/', protect, proposalController.createProposal); 

// GET /api/proposals/:projectId - Bir projeye ait tüm teklifleri listele
router.get('/project/:projectId', protect, proposalController.getProposalsForProject);

// GET /api/proposals/freelancer - Freelancer'ın verdiği tüm teklifleri listele
router.get('/freelancer', protect, proposalController.getProposalsForFreelancer);

// PUT /api/proposals/:proposalId/accept - Teklifi Kabul Etme
router.put('/:proposalId/accept', protect, proposalController.acceptProposal);

module.exports = router;