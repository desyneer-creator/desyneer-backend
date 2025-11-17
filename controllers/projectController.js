const Project = require('../models/Project'); // [cite: Project.js]
const Proposal = require('../models/Proposal'); // [cite: Proposal.js]

// GET /api/projects - TǬm projeleri listeleme
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    // Bo�Y veritaban�� i��in schema'y�� bozmadan ayn�� cevap d��n��r:
    // Bo�Y liste ��/ ayn�� Mongoose schema
    res.status(200).json(projects);
  } catch (error) {
    console.error('getProjects hatas��:', error.message);
    res.status(500).json({ message: 'Projeler yǬklenirken sunucu hatas�� olu�Ytu.' });
  }
};

// POST /api/projects - Yeni Proje Olu�Yturma
exports.createProject = async (req, res) => {
  try {
    if (!req.user || !req.user.id) { // req.user [cite: auth.js]
        return res.status(401).json({ message: 'Authorization error: Client ID missing after protection.' });
    }

    const project = new Project({
      ...req.body,
      clientId: req.user.id, // Auth middleware'inden gelen kullan��c�� ID'si [cite: auth.js]
      status: 'open', // [cite: Project.js]
    });

    const createdProject = await project.save();
    
    res.status(201).json({
      message: 'Project created successfully. Database entry confirmed.',
      project: createdProject,
    });
  } catch (error) {
    console.error('createProject hatas��:', error.message);
    res.status(400).json({ message: 'Project creation failed.', error: error.message });
  }
};

// @desc    Get a single project by its ID
// @route   GET /api/projects/:id
// @access  Public
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id); // [cite: Project.js]

    if (!project) {
      return res.status(404).json({ success: false, message: 'Proje bulunamad��.' });
    }
    res.status(200).json({
      success: true,
      project: project
    });
  } catch (error) {
    console.error('getProjectById hatas��:', error.message);
    res.status(500).json({ success: false, message: 'Proje getirilirken sunucu hatas�� olu�Ytu.' });
  }
};

// @desc    Get matched freelancers (proposals) for a specific project, sorted by AI score
// @route   GET /api/projects/:projectId/matches
// @access  Private (Client-only)
exports.getMatchedFreelancers = async (req, res) => {
  try {
    const { projectId } = req.params;
    const clientId = req.user.id; // [cite: auth.js]

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Proje bulunamad��.' });
    }

    // GǬvenlik KontrolǬ: Sadece proje sahibi [cite: Project.js]
    if (project.clientId.toString() !== clientId) {
      return res.status(403).json({ success: false, message: 'Bu projeye ait teklifleri g��rme yetkiniz yok.' });
    }

    const proposals = await Proposal.find({ projectId: projectId }) // [cite: Proposal.js]
      .sort({ matchingScore: -1 }) // AI Puan��na g��re s��rala [cite: Proposal.js]
      .populate('freelancerId', 'username email skills'); // Freelancer bilgisini [cite: User.js] ekle

    if (!proposals || proposals.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Bu proje i��in henǬz bir teklif (e�Yle�Yme) bulunmuyor.',
        proposals: []
      });
    }
    res.status(200).json({
      success: true,
      proposals: proposals
    });
  } catch (error) {
    console.error('getMatchedFreelancers hatas��:', error.message);
    res.status(500).json({ success: false, message: 'E�Yle�Ymeler getirilirken sunucu hatas�� olu�Ytu.' });
  }
};

// @desc    Update a project's status (client-only)
// @route   PUT /api/projects/:id/status
// @access  Private (Client-only)
exports.updateProjectStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const projectId = req.params.id;
    const clientId = req.user.id; // [cite: auth.js]

    if (!status) {
      return res.status(400).json({ success: false, message: 'Yeni status de�Yeri zorunludur.' });
    }
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Proje bulunamad��.' });
    }

    // GǬvenlik KontrolǬ: Sadece proje sahibi [cite: Project.js]
    if (project.clientId.toString() !== clientId) {
      return res.status(403).json({ success: false, message: 'Bu projenin durumunu de�Yi�Ytirme yetkiniz yok.' });
    }

    project.status = status; // [cite: Project.js]
    const updatedProject = await project.save();

    res.status(200).json({
      success: true,
      project: updatedProject
    });
  } catch (error) {
    console.error('updateProjectStatus hatas��:', error.message);
    res.status(500).json({ success: false, message: 'Proje durumu gǬncellenirken sunucu hatas�� olu�Ytu.' });
  }
};

