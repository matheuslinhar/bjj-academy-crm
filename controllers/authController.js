const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const { conectar } = require("../database")
const SECRET = process.env.SECRET || "segredo_super_forte"

async function login(req, res) {
  try {
    const { email, senha } = req.body
    const db = await conectar()

    const user = await db.get("SELECT * FROM users WHERE email = ?", [email])
    if (!user) return res.status(404).json({ erro: "Usuário não encontrado" })

    const senhaValida = await bcrypt.compare(senha, user.senha)
    if (!senhaValida) return res.status(401).json({ erro: "Senha inválida" })

    const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: "1d" })
    res.json({ token, role: user.role })
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
}

async function register(req, res) {
  try {
    const { nome, email, senha } = req.body
    const db = await conectar()

    const senhaHash = await bcrypt.hash(senha, 10)

    const result = await db.run(
      "INSERT INTO users (email, senha, role) VALUES (?, ?, ?)",
      [email, senhaHash, "aluno"]
    )

    await db.run(
      "INSERT INTO alunos (nome, status, user_id) VALUES (?, ?, ?)",
      [nome, "ativo", result.lastID]
    )

    res.json({ mensagem: "Aluno criado com login!" })
  } catch (err) {
    if (err.message.includes("UNIQUE")) {
      return res.status(400).json({ erro: "Email já cadastrado." })
    }
    res.status(500).json({ erro: err.message })
  }
}

async function criarUsuario(req, res) {
  try {
    const { email, senha, role } = req.body
    const db = await conectar()

    if (!["professor", "admin"].includes(role)) {
      return res.status(400).json({ erro: "Role inválido." })
    }

    const senhaHash = await bcrypt.hash(senha, 10)

    await db.run(
      "INSERT INTO users (email, senha, role) VALUES (?, ?, ?)",
      [email, senhaHash, role]
    )

    res.json({ mensagem: `Usuário ${role} criado com sucesso!` })
  } catch (err) {
    if (err.message.includes("UNIQUE")) {
      return res.status(400).json({ erro: "Email já cadastrado." })
    }
    res.status(500).json({ erro: err.message })
  }
}

module.exports = { login, register, criarUsuario }