import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Enviar solicitação de conexão
export const sendConnectionRequest = async (req, res) => {
  try {
    const senderId = req.userId;
    const { receiverId } = req.body;

    // Verificar se já existe conexão
    const existing = await prisma.connection.findFirst({
      where: {
        OR: [
          { senderId, receiverId: parseInt(receiverId) },
          { senderId: parseInt(receiverId), receiverId: senderId }
        ]
      }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Conexão já existe'
      });
    }

    const connection = await prisma.connection.create({
      data: {
        senderId,
        receiverId: parseInt(receiverId),
        status: 'pending'
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
            headline: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            avatar: true,
            headline: true
          }
        }
      }
    });

    res.status(201).json({ success: true, data: connection });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Aceitar solicitação
export const acceptConnection = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const connection = await prisma.connection.findUnique({
      where: { id: parseInt(id) }
    });

    if (!connection || connection.receiverId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Não autorizado'
      });
    }

    const updated = await prisma.connection.update({
      where: { id: parseInt(id) },
      data: { status: 'accepted' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
            headline: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            avatar: true,
            headline: true
          }
        }
      }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Rejeitar solicitação
export const rejectConnection = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const connection = await prisma.connection.findUnique({
      where: { id: parseInt(id) }
    });

    if (!connection || connection.receiverId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Não autorizado'
      });
    }

    await prisma.connection.delete({
      where: { id: parseInt(id) }
    });

    res.json({ success: true, message: 'Solicitação rejeitada' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Listar conexões do usuário
export const getUserConnections = async (req, res) => {
  try {
    const userId = req.userId;
    const { status = 'accepted' } = req.query;

    const connections = await prisma.connection.findMany({
      where: {
        OR: [
          { senderId: userId, status },
          { receiverId: userId, status }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
            headline: true,
            location: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            avatar: true,
            headline: true,
            location: true
          }
        }
      }
    });

    // Formatar para retornar o outro usuário
    const formatted = connections.map(conn => {
      const otherUser = conn.senderId === userId ? conn.receiver : conn.sender;
      return {
        id: conn.id,
        user: otherUser,
        status: conn.status,
        createdAt: conn.createdAt
      };
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Listar solicitações pendentes recebidas
export const getPendingRequests = async (req, res) => {
  try {
    const userId = req.userId;

    const requests = await prisma.connection.findMany({
      where: {
        receiverId: userId,
        status: 'pending'
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
            headline: true,
            location: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Remover conexão
export const removeConnection = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const connection = await prisma.connection.findUnique({
      where: { id: parseInt(id) }
    });

    if (!connection || (connection.senderId !== userId && connection.receiverId !== userId)) {
      return res.status(403).json({
        success: false,
        error: 'Não autorizado'
      });
    }

    await prisma.connection.delete({
      where: { id: parseInt(id) }
    });

    res.json({ success: true, message: 'Conexão removida' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Verificar status de conexão entre dois usuários
export const checkConnectionStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const { otherUserId } = req.params;

    const connection = await prisma.connection.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: parseInt(otherUserId) },
          { senderId: parseInt(otherUserId), receiverId: userId }
        ]
      }
    });

    if (!connection) {
      return res.json({ success: true, data: { status: 'none' } });
    }

    const isRequester = connection.senderId === userId;
    
    res.json({
      success: true,
      data: {
        status: connection.status,
        isRequester,
        connectionId: connection.id
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
