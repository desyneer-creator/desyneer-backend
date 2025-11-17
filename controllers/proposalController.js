const Proposal = require('../models/Proposal'); // [cite: Proposal.js]
const Project = require('../models/Project'); // [cite: Project.js]
const User = require('../models/User'); // [cite: User.js]
const { getMatchingScore } = require('../services/aiService'); // [cite: aiService.js]

// POST /api/proposals - Yeni Teklif Oluşturma
const createProposal = async (req, res) => {
    const freelancerId = req.user.id; // [cite: auth.js]
    const { projectId, bidAmount, deliveryTimeDays, coverLetter } = req.body;

    if (!projectId || !bidAmount || !deliveryTimeDays || !coverLetter) {
        return res.status(400).json({ message: 'Proje ID, teklif tutarı, teslim süresi ve mektup zorunludur.' });
    }

    try {
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Teklif verilmek istenen proje bulunamadı.' });
        }
        
        if (project.clientId.toString() === freelancerId) {
            return res.status(403).json({ message: 'Kendi projenize teklif veremezsiniz.' });
        }

        const existingProposal = await Proposal.findOne({ freelancerId, projectId });
        if (existingProposal) {
            return res.status(400).json({ message: 'Bu projeye zaten bir teklif verdiniz.' });
        }

        const freelancer = await User.findById(freelancerId).select('skills role'); // [cite: User.js]
        if (!freelancer || freelancer.role !== 'freelancer') {
            return res.status(403).json({ message: 'Sadece freelancer rolündeki kullanıcılar teklif verebilir.' });
        }

        // AI Eşleştirme Puanını Hesaplama [cite: aiService.js]
        const projectDescription = project.description;
        const freelancerSkills = freelancer.skills || []; // [cite: User.js]

        const aiResult = await getMatchingScore(projectDescription, freelancerSkills);
        
        const proposal = new Proposal({
            freelancerId,
            projectId,
            bidAmount,
            deliveryTimeDays,
            coverLetter,
            matchingScore: aiResult.matchingScore, // [cite: Proposal.js]
            justification: aiResult.justification, // [cite: Proposal.js]
            status: 'submitted' // [cite: Proposal.js]
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

// @desc    Client'ın bir projeye gelen TÜM teklifleri görmesi
// @route   GET /api/proposals/project/:projectId
// @access  Private
const getProposalsForProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const clientId = req.user.id; // [cite: auth.js]

        const project = await Project.findById(projectId);
        if (!project || project.clientId.toString() !== clientId) {
            return res.status(403).json({ success: false, message: 'Bu projeye ait teklifleri görme yetkiniz yok.' });
        }

        const proposals = await Proposal.find({ projectId: projectId })
            .sort({ matchingScore: -1 })
            .populate('freelancerId', 'username email skills'); // [cite: User.js]

        res.status(200).json({ success: true, proposals: proposals });
    } catch (error) {
        console.error('getProposalsForProject hatası:', error.message);
        res.status(500).json({ success: false, message: 'Teklifler getirilirken hata oluştu.' });
    }
};

// @desc    Freelancer'ın KENDİ gönderdiği tüm teklifleri görmesi
// @route   GET /api/proposals/freelancer
// @access  Private
const getProposalsForFreelancer = async (req, res) => {
    try {
        const freelancerId = req.user.id; // [cite: auth.js]

        const proposals = await Proposal.find({ freelancerId: freelancerId })
            .sort({ createdAt: -1 })
            .populate('projectId', 'title status'); // Proje bilgisini [cite: Project.js] ekle

        res.status(200).json({ success: true, proposals: proposals });
    } catch (error) {
        console.error('getProposalsForFreelancer hatası:', error.message);
        res.status(500).json({ success: false, message: 'Teklifleriniz getirilirken hata oluştu.' });
    }
};

// @desc    Client'ın bir teklifi kabul etmesi
// @route   PUT /api/proposals/:proposalId/accept
// @access  Private
const acceptProposal = async (req, res) => {
    try {
        const { proposalId } = req.params;
        const clientId = req.user.id; // [cite: auth.js]

        const proposal = await Proposal.findById(proposalId);
        if (!proposal) {
            return res.status(404).json({ success: false, message: 'Teklif bulunamadı.' });
        }

        const project = await Project.findById(proposal.projectId);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Teklifin ait olduğu proje bulunamadı.' });
        }

        if (project.clientId.toString() !== clientId) {
            return res.status(403).json({ success: false, message: 'Bu teklifi kabul etme yetkiniz yok.' });
        }
        
        if (project.status !== 'open') { // [cite: Project.js]
             return res.status(400).json({ success: false, message: 'Bu proje zaten kapandı veya bir freelancer ile eşleşti.' });
        }

        // İşlemler:
        project.freelancerId = proposal.freelancerId; // [cite: Project.js]
        project.status = 'matched'; // [cite: Project.js]
        await project.save();

        proposal.status = 'accepted'; // [cite: Proposal.js]
        await proposal.save();
        
        await Proposal.updateMany(
            { projectId: project._id, _id: { $ne: proposalId } }, 
            { status: 'rejected' } // [cite: Proposal.js]
        );

        res.status(200).json({
            success: true,
            message: 'Teklif kabul edildi. Proje ve freelancer eşleştirildi.'
        });
    } catch (error) {
        console.error('acceptProposal hatası:', error.message);
        res.status(500).json({ success: false, message: 'Teklif kabul edilirken sunucu hatası oluştu.' });
    }
};

// Tüm fonksiyonları tek bir nesne olarak dışa aktar
module.exports = {
    createProposal,
    getProposalsForProject,
    acceptProposal,
    getProposalsForFreelancer,
};