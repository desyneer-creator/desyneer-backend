const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema({
    // Teklifi yapan Freelancer'ın ID'si
    freelancerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // User modeline referans
        required: true,
    },
    // Teklifin yapıldığı Projenin ID'si
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project', // Project modeline referans
        required: true,
    },
    // Freelancer'ın projeye istediği ücret
    bidAmount: {
        type: Number,
        required: [true, 'Teklif tutarı (bidAmount) zorunludur.'],
        min: 1,
    },
    // Freelancer'ın projeyi bitirme tahmini süresi (gün olarak)
    deliveryTimeDays: {
        type: Number,
        required: [true, 'Teslim süresi (deliveryTimeDays) zorunludur.'],
        min: 1,
    },
    // Freelancer'ın proje için yazdığı motivasyon mektubu
    coverLetter: {
        type: String,
        required: [true, 'Motivasyon mektubu (coverLetter) zorunludur.'],
        trim: true,
    },
    // AI tarafından hesaplanan eşleştirme puanı (0-100 arası)
    matchingScore: {
        type: Number,
        default: 0,
    },
    // AI'ın puanı verme gerekçesi
    justification: {
        type: String,
        default: 'Puanlama bekleniyor.',
    },
    // Teklifin durumu: submitted, accepted, rejected
    status: {
        type: String,
        enum: ['submitted', 'accepted', 'rejected'],
        default: 'submitted',
    },
}, {
    timestamps: true // createdAt ve updatedAt alanlarını otomatik ekler
});

// Aynı freelancer'ın aynı projeye birden fazla teklif vermesini engeller
proposalSchema.index({ freelancerId: 1, projectId: 1 }, { unique: true });

module.exports = mongoose.model('Proposal', proposalSchema);