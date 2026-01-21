import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Criar post
export const createPost = async (req, res) => {
  try {
    const { content, imageUrl, videoUrl } = req.body;
    const userId = req.userId;

    const post = await prisma.post.create({
      data: {
        content,
        imageUrl,
        videoUrl,
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            headline: true,
          },
        },
        likes: true,
        comments: true,
      },
    });

    res.status(201).json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Listar todos os posts (Feed)
export const getAllPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const posts = await prisma.post.findMany({
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            headline: true,
          },
        },
        likes: {
          select: {
            id: true,
            userId: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 3,
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    const total = await prisma.post.count();

    res.json({
      success: true,
      data: posts,
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

// Buscar post por ID
export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await prisma.post.update({
      where: { id: parseInt(id) },
      data: { viewsCount: { increment: 1 } },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            headline: true,
            bio: true,
          },
        },
        likes: {
          select: {
            id: true,
            userId: true,
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    res.json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Atualizar post
export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, imageUrl, videoUrl } = req.body;
    const userId = req.user.userId;

    // Verificar se o usuário é o autor
    const existingPost = await prisma.post.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingPost || existingPost.authorId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Não autorizado",
      });
    }

    const post = await prisma.post.update({
      where: { id: parseInt(id) },
      data: { content, imageUrl, videoUrl },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            headline: true,
          },
        },
      },
    });

    res.json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Deletar post
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const existingPost = await prisma.post.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingPost || existingPost.authorId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Não autorizado",
      });
    }

    await prisma.post.delete({
      where: { id: parseInt(id) },
    });

    res.json({ success: true, message: "Post deletado com sucesso" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Curtir/Descurtir post
export const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId: parseInt(id),
          userId: userId,
        },
      },
    });

    if (existingLike) {
      await prisma.like.delete({
        where: { id: existingLike.id },
      });
      return res.json({ success: true, liked: false });
    }

    await prisma.like.create({
      data: {
        postId: parseInt(id),
        userId: userId,
      },
    });

    res.json({ success: true, liked: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Adicionar comentário
export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    const comment = await prisma.comment.create({
      data: {
        content,
        postId: parseInt(id),
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Deletar comentário
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.userId;

    const comment = await prisma.comment.findUnique({
      where: { id: parseInt(commentId) },
    });

    if (!comment || comment.authorId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Não autorizado",
      });
    }

    await prisma.comment.delete({
      where: { id: parseInt(commentId) },
    });

    res.json({ success: true, message: "Comentário deletado" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
