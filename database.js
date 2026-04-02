const sqlite3 = require("sqlite3").verbose()
const db = new sqlite3.Database("./bjj.db")

db.serialize(() => {

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      senha TEXT,
      role TEXT DEFAULT 'aluno'
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS alunos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT,
      faixa TEXT,
      telefone TEXT,
      plano TEXT,
      status TEXT,
      data TEXT,
      user_id INTEGER
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS horarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dia_semana TEXT,
      hora_inicio TEXT,
      hora_fim TEXT,
      data_especifica TEXT,
      professor TEXT,
      tipo TEXT DEFAULT 'fixo'
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS presencas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      aluno_id INTEGER,
      horario_id INTEGER,
      data TEXT,
      status TEXT DEFAULT 'pendente',
      FOREIGN KEY (aluno_id) REFERENCES alunos(id),
      FOREIGN KEY (horario_id) REFERENCES horarios(id)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS pagamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      aluno_id INTEGER,
      mes TEXT,
      ano TEXT,
      status TEXT DEFAULT 'pendente',
      data_pagamento TEXT,
      FOREIGN KEY (aluno_id) REFERENCES alunos(id)
    )
  `)

  // Horários fixos padrão da academia
  db.get("SELECT COUNT(*) as total FROM horarios", [], (err, row) => {
    if (row.total === 0) {
      const fixos = [
        ["Segunda", "21:15", "22:30", null, "Professor", "fixo"],
        ["Quarta",  "21:15", "22:30", null, "Professor", "fixo"],
        ["Sexta",   "21:15", "22:30", null, "Professor", "fixo"]
      ]
      fixos.forEach(h => {
        db.run(
          "INSERT INTO horarios (dia_semana, hora_inicio, hora_fim, data_especifica, professor, tipo) VALUES (?,?,?,?,?,?)",
          h
        )
      })
    }
  })

})

module.exports = db