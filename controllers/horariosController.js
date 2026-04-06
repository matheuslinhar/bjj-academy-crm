const { conectar } = require("../database")

async function listar(req, res) {
  try {
    const db = await conectar()
    const rows = await db.all("SELECT * FROM horarios ORDER BY id")
    res.json(rows)
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
}

async function criar(req, res) {
  try {
    const { dia_semana, hora_inicio, hora_fim, data_especifica, professor, tipo } = req.body
    const db = await conectar()

    const result = await db.run(
      "INSERT INTO horarios (dia_semana, hora_inicio, hora_fim, data_especifica, professor, tipo) VALUES (?,?,?,?,?,?)",
      [dia_semana, hora_inicio, hora_fim, data_especifica || null, professor, tipo || "avulso"]
    )

    res.json({ id: result.lastID, mensagem: "Horário criado!" })
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
}

async function deletar(req, res) {
  try {
    const db = await conectar()
    await db.run("DELETE FROM horarios WHERE id = ?", [req.params.id])
    res.json({ mensagem: "Horário removido" })
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
}

module.exports = { listar, criar, deletar }