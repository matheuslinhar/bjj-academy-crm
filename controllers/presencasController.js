const { conectar } = require("../database")

async function checkin(req, res) {
  try {
    const { horario_id } = req.body
    const hoje = new Date().toISOString().split("T")[0]
    const db = await conectar()

    const aluno = await db.get("SELECT id FROM alunos WHERE user_id = ?", [req.user.id])
    if (!aluno) return res.status(404).json({ erro: "Aluno não encontrado" })

    const existe = await db.get(
      "SELECT id FROM presencas WHERE aluno_id=? AND horario_id=? AND data=?",
      [aluno.id, horario_id, hoje]
    )
    if (existe) return res.status(400).json({ erro: "Check-in já realizado para esta aula." })

    await db.run(
      "INSERT INTO presencas (aluno_id, horario_id, data, status) VALUES (?,?,?,?)",
      [aluno.id, horario_id, hoje, "pendente"]
    )

    res.json({ mensagem: "Check-in realizado! Aguardando confirmação." })
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
}

async function confirmar(req, res) {
  try {
    const db = await conectar()
    await db.run("UPDATE presencas SET status='confirmado' WHERE id=?", [req.params.id])
    res.json({ mensagem: "Presença confirmada!" })
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
}

async function manual(req, res) {
  try {
    const { aluno_id, horario_id, data } = req.body
    const db = await conectar()

    await db.run(
      "INSERT INTO presencas (aluno_id, horario_id, data, status) VALUES (?,?,?,?)",
      [aluno_id, horario_id, data, "confirmado"]
    )

    res.json({ mensagem: "Presença registrada manualmente!" })
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
}

async function listar(req, res) {
  try {
    const db = await conectar()

    if (req.user.role === "aluno") {
      const aluno = await db.get("SELECT id FROM alunos WHERE user_id = ?", [req.user.id])
      if (!aluno) return res.status(404).json({ erro: "Aluno não encontrado" })

      const rows = await db.all(
        `SELECT p.*, h.dia_semana, h.hora_inicio, h.hora_fim, h.data_especifica
         FROM presencas p
         JOIN horarios h ON p.horario_id = h.id
         WHERE p.aluno_id = ?
         ORDER BY p.data DESC`,
        [aluno.id]
      )
      return res.json(rows)
    }

    const rows = await db.all(
      `SELECT p.*, a.nome as aluno_nome, h.dia_semana, h.hora_inicio, h.data_especifica
       FROM presencas p
       JOIN alunos a ON p.aluno_id = a.id
       JOIN horarios h ON p.horario_id = h.id
       ORDER BY p.data DESC`
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
}

module.exports = { checkin, confirmar, manual, listar }