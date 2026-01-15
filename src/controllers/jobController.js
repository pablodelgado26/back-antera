import { PrismaClient } from '@prisma/client';

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
      companyId,
      expiresAt
    } = req.body;
    const userId = req.user.userId;

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
        companyId: parseInt(companyId),
        postedById: userId,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      },
      include: {
        company: true,
        postedBy: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
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
      search 
    } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      isActive: true,
      ...(jobType && { jobType }),
      ...(workplaceType && { workplaceType }),
      ...(location && { location: { contains: location, mode: 'insensitive' } }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const jobs = await prisma.job.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        company: true,
        postedBy: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    const total = await prisma.job.count({ where });

    res.json({
      success: true,
      data: jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
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
            headline: true
          }
        }
      }
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
    const userId = req.user.userId;
    const updateData = req.body;

    const existingJob = await prisma.job.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingJob || existingJob.postedById !== userId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Não autorizado' 
      });
    }

    const job = await prisma.job.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        company: true
      }
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
    const userId = req.user.userId;

    const existingJob = await prisma.job.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingJob || existingJob.postedById !== userId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Não autorizado' 
      });
    }

    await prisma.job.delete({
      where: { id: parseInt(id) }
    });

    res.json({ success: true, message: 'Vaga deletada com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Desativar vaga
export const deactivateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const existingJob = await prisma.job.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingJob || existingJob.postedById !== userId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Não autorizado' 
      });
    }

    const job = await prisma.job.update({
      where: { id: parseInt(id) },
      data: { isActive: false }
    });

    res.json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
