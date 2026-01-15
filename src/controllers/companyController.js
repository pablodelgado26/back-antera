import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Criar empresa
export const createCompany = async (req, res) => {
  try {
    const { name, description, logo, website, industry, size, location } = req.body;

    const company = await prisma.company.create({
      data: {
        name,
        description,
        logo,
        website,
        industry,
        size,
        location
      }
    });

    res.status(201).json({ success: true, data: company });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Listar empresas
export const getAllCompanies = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ]
        }
      : {};

    const companies = await prisma.company.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      include: {
        _count: {
          select: {
            employees: true,
            jobs: true
          }
        }
      }
    });

    const total = await prisma.company.count({ where });

    res.json({
      success: true,
      data: companies,
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

// Buscar empresa por ID
export const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;

    const company = await prisma.company.findUnique({
      where: { id: parseInt(id) },
      include: {
        employees: {
          select: {
            id: true,
            name: true,
            avatar: true,
            headline: true
          },
          take: 10
        },
        jobs: {
          where: { isActive: true },
          take: 5,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            employees: true,
            jobs: true
          }
        }
      }
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Empresa não encontrada'
      });
    }

    res.json({ success: true, data: company });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Atualizar empresa
export const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const company = await prisma.company.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json({ success: true, data: company });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Deletar empresa
export const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.company.delete({
      where: { id: parseInt(id) }
    });

    res.json({ success: true, message: 'Empresa deletada com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
