const { conectar } = require("../database")

async function listar(req, res) {
  try {
    const db = await conectar()

    if (req.user.role === "aluno") {
      const aluno = await db.get("SELECT id FROM alunos WHERE user_id = ?", [req.user.id])
      if (!aluno) return res.status(404).json({ erro: "Aluno não encontrado" })

      const rows = await db.all(
        "SELECT * FROM pagamentos WHERE aluno_id = ? ORDER BY ano DESC, mes DESC",
        [aluno.id]
      )
      return res.json(rows)
    }

    const rows = await db.all(
      `SELECT p.*, a.nome as aluno_nome FROM pagamentos p
       JOIN alunos a ON p.aluno_id = a.id
       ORDER BY p.ano DESC, p.mes DESC`
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
}

async function registrar(req, res) {
  try {
    const { aluno_id, mes, ano, status } = req.body
    const data_pagamento = status === "pago" ? new Date().toISOString().split("T")[0] : null
    const db = await conectar()

    await db.run(
      "INSERT OR REPLACE INTO pagamentos (aluno_id, mes, ano, status, data_pagamento) VALUES (?,?,?,?,?)",
      [aluno_id, mes, ano, status, data_pagamento]
    )

    res.json({ mensagem: "Pagamento registrado!" })
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
}

module.exports = { listar, registrar }