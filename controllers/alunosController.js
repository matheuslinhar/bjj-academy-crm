const { conectar } = require("../database")

async function listar(req, res) {
  try {
    const db = await conectar()

    if (req.user.role === "aluno") {
      const rows = await db.all(
        "SELECT * FROM alunos WHERE user_id = ?",
        [req.user.id]
      )
      return res.json(rows)
    }

    const rows = await db.all("SELECT * FROM alunos")
    res.json(rows)
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
}

async function criar(req, res) {
  try {
    const { nome, faixa, telefone, plano, status, data } = req.body
    const db = await conectar()

    const result = await db.run(
      "INSERT INTO alunos (nome, faixa, telefone, plano, status, data) VALUES (?, ?, ?, ?, ?, ?)",
      [nome, faixa, telefone, plano, status?.toLowerCase().trim(), data]
    )

    res.json({ id: result.lastID })
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
}

async function atualizar(req, res) {
  try {
    const { nome, faixa, telefone, plano, status, data } = req.body
    const db = await conectar()

    await db.run(
      `UPDATE alunos SET nome=?, faixa=?, telefone=?, plano=?, status=?, data=? WHERE id=?`,
      [nome, faixa, telefone, plano, status?.toLowerCase().trim(), data, req.params.id]
    )

    res.json({ mensagem: "Aluno atualizado" })
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
}

async function deletar(req, res) {
  try {
    const db = await conectar()
    await db.run("DELETE FROM alunos WHERE id = ?", [req.params.id])
    res.json({ mensagem: "Aluno removido" })
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
}

async function dashboard(req, res) {
  try {
    const db = await conectar()
    const rows = await db.all("SELECT status FROM alunos")

    const total = rows.length
    const ativos = rows.filter(a => a.status === "ativo").length
    const inativos = rows.filter(a => a.status === "inativo").length

    res.json({ total, ativos, inativos })
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
}

module.exports = { listar, criar, atualizar, deletar, dashboard }