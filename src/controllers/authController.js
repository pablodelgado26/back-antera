import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

class AuthController {

    // Listar todos os usuários
    async getAllUsers(req, res) {
        try {
            const users = await prisma.user.findMany({
                select: {
                    id: true,
                    name: true,
                    email: true,
                    headline: true,
                    avatar: true,
                    location: true,
                    createdAt: true,
                }
            });
            res.json(users);
        } catch (error) {
            console.error("Erro ao listar usuários:", error);
            res.status(500).json({ error: "Erro ao listar usuários" });
        }
    }

    //Registrar um novo usuário
    async register(req, res) {
        try {
            const { name, email, password } = req.body;

            // Validação básica
            if (!name || !email || !password) {
                return res.status(400).json({ error: "Os campos nome, email ou senha são obrigatórios" });
            }

            //Verificar se o usuário ja existe 
            const userExists = await prisma.user.findUnique({
                where: { email }
            });

            if (userExists) {
                return res.status(400).json({ error: "Este email já está em uso!" })
            }

            //hash da senha
            const hashedPassword = await bcrypt.hash(password, 10);

            //Criar usuário 
            const user = await prisma.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    headline: true,
                    avatar: true,
                    createdAt: true,
                }
            });

            //Gerar Token JWT
            const token = jwt.sign(
                {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "24h",
                }
            );

            return res.status(201).json({
                message: "Usuário criado com sucesso!",
                data: {
                    token,
                    user,
                },
            });
        } catch (error) {
            console.error("Erro ao criar novo usuario: ", error)
            res.status(500).json({ error: "Erro ao criar novo usuário" })
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body

            // Validação básica
            if (!email || !password) {
                return res.status(400).json({ error: "Os campos email e senha são obrigatórios" });
            }

            //Verificar se o usuário existe 
            const user = await prisma.user.findUnique({
                where: { email }
            });
            
            if (!user) {
                return res.status(401).json({ error: "Credenciais inválidas!" })
            }

            //Verificar senha 
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ error: "Credenciais inválidas!" })
            }

            //Gerar Token JWT
            const token = jwt.sign(
                {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "24h",
                }
            );

            // Remover senha do retorno
            const { password: _, ...userWithoutPassword } = user;

            return res.json({
                message: "Login realizado com sucesso!",
                data: {
                    token,
                    user: userWithoutPassword,
                },
            });
        } catch (error) {
            console.error("Erro ao fazer login: ", error)
            res.status(500).json({message: "Erro ao fazer login!"})
        }
    }

}

export default new AuthController();