const Project = require('../models/Project'); // Modeli import ettik. KRİTİK!

// GET /api/projects - Tüm projeleri listeleme
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    
    // Projeler boşsa, Postman'de çalıştığını göstermek için test verisi gönderelim:
    if (projects.length === 0) {
        return res.status(200).json([
            { id: 1, title: 'Test Projesi 1', description: 'Bu bir deneme projesidir (Veritabanı boş).' },
            { id: 2, title: 'Test Projesi 2', description: 'Bağlantı başarılı, ancak veri yok.' }
        ]);
    }
    res.status(200).json(projects);
  } catch (error) {
    console.error('getProjects hatası:', error.message);
    res.status(500).json({ message: 'Projeler yüklenirken sunucu hatası oluştu.' });
  }
};

// POST /api/projects - Yeni Proje Oluşturma (AI Çağrısını Kaldırdık)
exports.createProject = async (req, res) => {
  try {
    // KRİTİK GÜNCELLEME: Proje oluşturma rotasına 'protect' middleware'i geri eklendiği için, 
    // clientId artık JWT token'dan gelen req.user.id olmalıdır.
    // req.user.id, protect middleware'i tarafından set edilir.
    if (!req.user || !req.user.id) {
        // Bu hata sadece protect middleware'i atlanırsa veya auth hatalıysa oluşur.
        return res.status(401).json({ message: 'Authorization error: Client ID missing after protection.' });
    }

    const project = new Project({
      ...req.body, // Postman'den gelen tüm veriyi alır
      clientId: req.user.id, // Auth middleware'inden gelen kullanıcı ID'si kullanılıyor
      status: 'open',
    });

    const createdProject = await project.save();
    
    // Başarılı olursa 201 Created döndürülür
    res.status(201).json({
      message: 'Project created successfully. Database entry confirmed.',
      project: createdProject,
    });
  } catch (error) {
    console.error('createProject hatası:', error.message);
    // Mongoose doğrulama hataları genellikle 400 Bad Request'tir.
    res.status(400).json({ message: 'Project creation failed.', error: error.message });
  }
};

exports.getProjectById = (req, res) => res.status(501).json({ message: `getProjectById (${req.params.id}) not implemented yet.` });
exports.getMatchedFreelancers = (req, res) => res.status(501).json({ message: `getMatchedFreelancers (${req.params.projectId}) not implemented yet.` });
exports.submitProposal = (req, res) => res.status(501).json({ message: `submitProposal (${req.params.projectId}) not implemented yet.` });
exports.updateProjectStatus = (req, res) => res.status(501).json({ message: `updateProjectStatus (${req.params.id}) not implemented yet.` });