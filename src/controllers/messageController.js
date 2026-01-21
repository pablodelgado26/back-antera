import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Buscar ou criar conversa
export const getOrCreateConversation = async (req, res) => {
  try {
    const userId = req.userId;
    const { otherUserId } = req.params;
    const otherId = parseInt(otherUserId);

    // Garantir ordem consistente dos IDs
    const [smallerId, biggerId] = userId < otherId ? [userId, otherId] : [otherId, userId];

    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { user1Id: smallerId, user2Id: biggerId },
          { user1Id: biggerId, user2Id: smallerId }
        ]
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            avatar: true,
            headline: true
          }
        },
        user2: {
          select: {
            id: true,
            name: true,
            avatar: true,
            headline: true
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          user1Id: smallerId,
          user2Id: biggerId
        },
        include: {
          user1: {
            select: {
              id: true,
              name: true,
              avatar: true,
              headline: true
            }
          },
          user2: {
            select: {
              id: true,
              name: true,
              avatar: true,
              headline: true
            }
          },
          messages: true
        }
      });
    }

    res.json({ success: true, data: conversation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Listar conversas do usuário
export const getUserConversations = async (req, res) => {
  try {
    const userId = req.userId;

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            avatar: true,
            headline: true
          }
        },
        user2: {
          select: {
            id: true,
            name: true,
            avatar: true,
            headline: true
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        _count: {
          select: {
            messages: {
              where: {
                receiverId: userId,
                isRead: false
              }
            }
          }
        }
      },
      orderBy: {
        lastMessageAt: 'desc'
      }
    });

    // Formatar para incluir o outro usuário
    const formattedConversations = conversations.map(conv => {
      const otherUser = conv.user1Id === userId ? conv.user2 : conv.user1;
      return {
        ...conv,
        otherUser,
        unreadCount: conv._count.messages
      };
    });

    res.json({ success: true, data: formattedConversations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Enviar mensagem
export const sendMessage = async (req, res) => {
  try {
    const userId = req.userId;
    const { conversationId } = req.params;
    const { content, receiverId } = req.body;

    const message = await prisma.message.create({
      data: {
        content,
        conversationId: parseInt(conversationId),
        senderId: userId,
        receiverId: parseInt(receiverId)
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    // Atualizar timestamp da conversa
    await prisma.conversation.update({
      where: { id: parseInt(conversationId) },
      data: { lastMessageAt: new Date() }
    });

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Buscar mensagens de uma conversa
export const getConversationMessages = async (req, res) => {
  try {
    const userId = req.userId;
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const messages = await prisma.message.findMany({
      where: { conversationId: parseInt(conversationId) },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    // Marcar como lidas as mensagens recebidas
    await prisma.message.updateMany({
      where: {
        conversationId: parseInt(conversationId),
        receiverId: userId,
        isRead: false
      },
      data: { isRead: true }
    });

    const total = await prisma.message.count({
      where: { conversationId: parseInt(conversationId) }
    });

    res.json({
      success: true,
      data: messages.reverse(), // Ordem cronológica
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

// Marcar mensagens como lidas
export const markAsRead = async (req, res) => {
  try {
    const userId = req.userId;
    const { conversationId } = req.params;

    await prisma.message.updateMany({
      where: {
        conversationId: parseInt(conversationId),
        receiverId: userId,
        isRead: false
      },
      data: { isRead: true }
    });

    res.json({ success: true, message: 'Mensagens marcadas como lidas' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Contador de mensagens não lidas
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.userId;

    const count = await prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false
      }
    });

    res.json({ success: true, data: { unreadCount: count } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
