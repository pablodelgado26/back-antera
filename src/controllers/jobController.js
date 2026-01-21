import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Criar vaga
export const createJob = async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      jobType,
      workplaceType,
      salaryRange,
      requirements,
      benefits,
      externalApplicationUrl,
      expiresAt,
    } = req.body;
    const userId = req.userId;

    const job = await prisma.job.create({
      data: {
        title,
        description,
        location,
        jobType,
        workplaceType,
        salaryRange,
        requirements,
        benefits,
        externalApplicationUrl,
        companyId: null, // Sem empresa, vaga associada ao usuário
        postedById: userId,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        company: true,
        postedBy: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    res.status(201).json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Listar vagas
export const getAllJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      jobType,
      workplaceType,
      location,
      search,
    } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      isActive: true,
      ...(jobType && { jobType }),
      ...(workplaceType && { workplaceType }),
      ...(location && {
        location: { contains: location, mode: "insensitive" },
      }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const jobs = await prisma.job.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { createdAt: "desc" },
      include: {
        company: true,
        postedBy: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    const total = await prisma.job.count({ where });

    res.json({
      success: true,
      data: jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Buscar vaga por ID
export const getJobById = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await prisma.job.update({
      where: { id: parseInt(id) },
      data: { viewsCount: { increment: 1 } },
      include: {
        company: true,
        postedBy: {
          select: {
            id: true,
            name: true,
            avatar: true,
            headline: true,
          },
        },
      },
    });

    res.json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Atualizar vaga
export const updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const updateData = req.body;

    const existingJob = await prisma.job.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingJob || existingJob.postedById !== userId) {
      return res.status(403).json({
        success: false,
        error: "Não autorizado",
      });
    }

    const job = await prisma.job.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        company: true,
      },
    });

    res.json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Deletar vaga
export const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const existingJob = await prisma.job.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingJob || existingJob.postedById !== userId) {
      return res.status(403).json({
        success: false,
        error: "Não autorizado",
      });
    }

    await prisma.job.delete({
      where: { id: parseInt(id) },
    });

    res.json({ success: true, message: "Vaga deletada com sucesso" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Desativar vaga
export const deactivateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const existingJob = await prisma.job.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingJob || existingJob.postedById !== userId) {
      return res.status(403).json({
        success: false,
        error: "Não autorizado",
      });
    }

    const job = await prisma.job.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
    });

    res.json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Candidatar-se a uma vaga
export const applyToJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, resumeUrl, education } = req.body;

    // Verificar se a vaga existe e está ativa
    const job = await prisma.job.findUnique({
      where: { id: parseInt(id) },
    });

    if (!job || !job.isActive) {
      return res.status(404).json({
        success: false,
        error: "Vaga não encontrada ou não está mais ativa",
      });
    }

    // Verificar se já existe candidatura com este email para esta vaga
    const existingApplication = await prisma.jobApplication.findFirst({
      where: {
        jobId: parseInt(id),
        email: email,
      },
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        error: "Você já se candidatou para esta vaga",
      });
    }

    // Criar candidatura
    const application = await prisma.jobApplication.create({
      data: {
        jobId: parseInt(id),
        name,
        email,
        phone,
        resumeUrl: resumeUrl || null,
        education: JSON.stringify(education),
      },
    });

    // Incrementar contador de candidatos
    await prisma.job.update({
      where: { id: parseInt(id) },
      data: { applicantsCount: { increment: 1 } },
    });

    res.status(201).json({
      success: true,
      data: application,
      message: "Candidatura enviada com sucesso!",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Listar candidaturas de uma vaga (apenas para quem postou a vaga)
export const getJobApplications = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;

    // Verificar se o usuário é o dono da vaga
    const job = await prisma.job.findUnique({
      where: { id: parseInt(id) },
    });

    if (!job || job.postedById !== userId) {
      return res.status(403).json({
        success: false,
        error: "Não autorizado",
      });
    }

    const where = {
      jobId: parseInt(id),
      ...(status && { status }),
    };

    const applications = await prisma.jobApplication.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { createdAt: "desc" },
    });

    // Parse education JSON
    const applicationsWithParsedData = applications.map((app) => ({
      ...app,
      education: JSON.parse(app.education),
    }));

    const total = await prisma.jobApplication.count({ where });

    res.json({
      success: true,
      data: applicationsWithParsedData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Atualizar status de uma candidatura
export const updateApplicationStatus = async (req, res) => {
  try {
    const { jobId, applicationId } = req.params;
    const userId = req.userId;
    const { status, notes } = req.body;

    // Verificar se o usuário é o dono da vaga
    const job = await prisma.job.findUnique({
      where: { id: parseInt(jobId) },
    });

    if (!job || job.postedById !== userId) {
      return res.status(403).json({
        success: false,
        error: "Não autorizado",
      });
    }

    const application = await prisma.jobApplication.update({
      where: { id: parseInt(applicationId) },
      data: {
        status,
        notes: notes || undefined,
      },
    });

    res.json({
      success: true,
      data: application,
      message: "Status atualizado com sucesso",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
