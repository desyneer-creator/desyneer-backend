const Proposal = require('../models/Proposal');
const Project = require('../models/Project');
const User = require('../models/User'); // Freelancer'ın yeteneklerini almak için
const { getMatchingScore } = require('../services/aiService'); // AI servisi

// POST /api/proposals - Yeni Teklif Oluşturma
const createProposal = async (req, res) => {
    // protect middleware'inden gelen freelancer ID'si
    const freelancerId = req.user.id; 
    const { projectId, bidAmount, deliveryTimeDays, coverLetter } = req.body;

    // 1. Gerekli Alan Kontrolü
    if (!projectId || !bidAmount || !deliveryTimeDays || !coverLetter) {
        return res.status(400).json({ message: 'Proje ID, teklif tutarı, teslim süresi ve mektup zorunludur.' });
    }

    try {
        // 2. Projenin Var Olup Olmadığını Kontrol Etme
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Teklif verilmek istenen proje bulunamadı.' });
        }

        // 3. Teklifin Çift Olup Olmadığını Kontrol Etme
        const existingProposal = await Proposal.findOne({ freelancerId, projectId });
        if (existingProposal) {
            return res.status(400).json({ message: 'Bu projeye zaten bir teklif verdiniz.' });
        }

        // 4. Freelancer Yeteneklerini ve Rolünü Kontrol Etme (AI için gerekli)
        const freelancer = await User.findById(freelancerId).select('skills role');
        if (!freelancer || freelancer.role !== 'freelancer') {
             // Bu kontrol normalde rol kontrol middleware'i ile yapılır, ancak kontrolcüde ek doğrulama.
            return res.status(403).json({ message: 'Sadece freelancer rolündeki kullanıcılar teklif verebilir.' });
        }

        // 5. AI Eşleştirme Puanını Hesaplama (KRİTİK ADIM)
        const projectDescription = project.description;
        const freelancerSkills = freelancer.skills || []; // Yetenekler yoksa boş dizi kullan

        const aiResult = await getMatchingScore(projectDescription, freelancerSkills);
        
        // 6. Teklifi Oluşturma ve Kaydetme
        const proposal = new Proposal({
            freelancerId,
            projectId,
            bidAmount,
            deliveryTimeDays,
            coverLetter,
            matchingScore: aiResult.matchingScore,
            justification: aiResult.justification,
            status: 'submitted'
        });

        const createdProposal = await proposal.save();

        res.status(201).json({
            message: 'Teklif başarıyla oluşturuldu ve AI puanı hesaplandı.',
            proposal: createdProposal,
        });

    } catch (error) {
        console.error('Teklif oluşturma hatası:', error.message);
        res.status(500).json({ message: 'Teklif oluşturulurken sunucu hatası oluştu.', error: error.message });
    }
};

// Diğer Teklif Rotaları
const getProposalsForProject = (req, res) => res.status(501).json({ message: 'getProposalsForProject not implemented' });
const acceptProposal = (req, res) => res.status(501).json({ message: 'acceptProposal not implemented' });
const getProposalsForFreelancer = (req, res) => res.status(501).json({ message: 'getProposalsForFreelancer not implemented' });

// KRİTİK DÜZELTME: Tüm fonksiyonları tek bir nesne olarak dışa aktar
module.exports = {
    createProposal,
    getProposalsForProject,
    acceptProposal,
    getProposalsForFreelancer,
};