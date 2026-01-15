import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Buscar perfil do usuário
export const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.userId;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        name: true,
        email: true,
        headline: true,
        bio: true,
        avatar: true,
        coverImage: true,
        location: true,
        website: true,
        phone: true,
        isVerified: true,
        profileViews: true,
        company: {
          select: {
            id: true,
            name: true,
            logo: true
          }
        },
        experiences: {
          orderBy: { startDate: 'desc' }
        },
        educations: {
          orderBy: { startDate: 'desc' }
        },
        skills: {
          include: {
            skill: true
          }
        },
        posts: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: {
                likes: true,
                comments: true
              }
            }
          }
        },
        _count: {
          select: {
            sentConnections: {
              where: { status: 'accepted' }
            },
            receivedConnections: {
              where: { status: 'accepted' }
            },
            posts: true
          }
        },
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    // Incrementar views se não for o próprio usuário
    if (currentUserId && currentUserId !== parseInt(id)) {
      await prisma.user.update({
        where: { id: parseInt(id) },
        data: { profileViews: { increment: 1 } }
      });
    }

    // Calcular total de conexões
    const totalConnections = user._count.sentConnections + user._count.receivedConnections;

    res.json({
      success: true,
      data: {
        ...user,
        connectionsCount: totalConnections
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Atualizar perfil
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      name,
      headline,
      bio,
      avatar,
      coverImage,
      location,
      website,
      phone,
      companyId
    } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        headline,
        bio,
        avatar,
        coverImage,
        location,
        website,
        phone,
        ...(companyId && { companyId: parseInt(companyId) })
      },
      select: {
        id: true,
        name: true,
        email: true,
        headline: true,
        bio: true,
        avatar: true,
        coverImage: true,
        location: true,
        website: true,
        phone: true,
        company: true
      }
    });

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Adicionar experiência
export const addExperience = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { title, companyName, location, description, startDate, endDate, isCurrent } = req.body;

    const experience = await prisma.experience.create({
      data: {
        title,
        companyName,
        location,
        description,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        isCurrent,
        userId
      }
    });

    res.status(201).json({ success: true, data: experience });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Atualizar experiência
export const updateExperience = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const existing = await prisma.experience.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existing || existing.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Não autorizado' });
    }

    const experience = await prisma.experience.update({
      where: { id: parseInt(id) },
      data: req.body
    });

    res.json({ success: true, data: experience });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Deletar experiência
export const deleteExperience = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const existing = await prisma.experience.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existing || existing.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Não autorizado' });
    }

    await prisma.experience.delete({
      where: { id: parseInt(id) }
    });

    res.json({ success: true, message: 'Experiência deletada' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Adicionar educação
export const addEducation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { school, degree, fieldOfStudy, startDate, endDate, description } = req.body;

    const education = await prisma.education.create({
      data: {
        school,
        degree,
        fieldOfStudy,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        description,
        userId
      }
    });

    res.status(201).json({ success: true, data: education });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Deletar educação
export const deleteEducation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const existing = await prisma.education.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existing || existing.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Não autorizado' });
    }

    await prisma.education.delete({
      where: { id: parseInt(id) }
    });

    res.json({ success: true, message: 'Educação deletada' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Adicionar skill
export const addSkill = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { skillName } = req.body;

    // Buscar ou criar skill
    let skill = await prisma.skill.findFirst({
      where: { name: { equals: skillName, mode: 'insensitive' } }
    });

    if (!skill) {
      skill = await prisma.skill.create({
        data: { name: skillName }
      });
    }

    // Adicionar ao usuário
    const userSkill = await prisma.userSkill.create({
      data: {
        userId,
        skillId: skill.id
      },
      include: {
        skill: true
      }
    });

    res.status(201).json({ success: true, data: userSkill });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Skill já adicionada'
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

// Remover skill
export const removeSkill = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const userSkill = await prisma.userSkill.findUnique({
      where: { id: parseInt(id) }
    });

    if (!userSkill || userSkill.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Não autorizado' });
    }

    await prisma.userSkill.delete({
      where: { id: parseInt(id) }
    });

    res.json({ success: true, message: 'Skill removida' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Buscar usuários (pesquisa)
export const searchUsers = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Query de busca necessária'
      });
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { headline: { contains: q, mode: 'insensitive' } },
          { bio: { contains: q, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        headline: true,
        avatar: true,
        location: true,
        isVerified: true,
        company: {
          select: {
            id: true,
            name: true,
            logo: true
          }
        }
      },
      skip: parseInt(skip),
      take: parseInt(limit)
    });

    const total = await prisma.user.count({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { headline: { contains: q, mode: 'insensitive' } },
          { bio: { contains: q, mode: 'insensitive' } }
        ]
      }
    });

    res.json({
      success: true,
      data: users,
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
