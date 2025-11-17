const express = require('express');
const protect = require('../middleware/auth'); // [cite: auth.js]
// DÜZELTME: 'proposalController'dan [cite: controllers/proposalController.js] fonksiyonları import etmeli
const {
    createProposal,
    getProposalsForProject,
    acceptProposal,
    getProposalsForFreelancer,
} = require('../controllers/proposalController'); // [cite: controllers/proposalController.js]

const router = express.Router();

// === BU DOSYA SADECE /api/proposals ROTALARINI YÖNETİR ===

// POST /api/proposals - Yeni Teklif Oluşturma
router.post('/', protect, createProposal); 

// GET /api/proposals/project/:projectId - Bir projeye ait tüm teklifleri listele
router.get('/project/:projectId', protect, getProposalsForProject);

// GET /api/proposals/freelancer - Freelancer'ın verdiği tüm teklifleri listele
router.get('/freelancer', protect, getProposalsForFreelancer);

// PUT /api/proposals/:proposalId/accept - Teklifi Kabul Etme
router.put('/:proposalId/accept', protect, acceptProposal);

module.exports = router;