const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    budget: {
      min: Number,
      max: Number,
      currency: {
        type: String,
        default: 'USD',
      },
    },
    timeline: {
      startDate: Date,
      dueDate: Date,
      estimatedDays: Number,
    },
    status: {
      type: String,
      enum: ['open', 'matched', 'in_progress', 'completed', 'cancelled'],
      default: 'open',
    },
    category: String,
    skills: [String],
    complexity: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
    },
    aiMatchingScore: Number,
    proposals: [
      {
        freelancerId: mongoose.Schema.Types.ObjectId,
        proposal: String,
        bidAmount: Number,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    aiGeneratedBrief: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);