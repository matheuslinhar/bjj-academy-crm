const db = require("./database")
const express = require("express")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")

const app = express()
const SECRET = "segredo_super_forte"

app.use(express.json())
app.use(express.static("public"))

/* 🔐 AUTH */
function auth(req, res, next) {
  const token = req.headers.authorization
  if (!token) return res.status(401).json({ erro: "Sem token" })
  try {
    req.user = jwt.verify(token, SECRET)
    next()
  } catch {
    return res.status(401).json({ erro: "Token inválido" })
  }
}

/* 🛡️ REQUIRE ROLE */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ erro: "Acesso negado." })
    }
    next()
  }
}

/* 🔑 LOGIN */
app.post("/login", (req, res) => {
  const { email, senha } = req.body
  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if (err) return res.status(500).json(err)
    if (!user) return res.status(404).json({ erro: "Usuário não encontrado" })

    const senhaValida = await bcrypt.compare(senha, user.senha)
    if (!senhaValida) return res.status(401).json({ erro: "Senha inválida" })

    const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: "1d" })
    res.json({ token, role: user.role })
  })
})

/* 🆕 REGISTER */
app.post("/register", async (req, res) => {
  console.log("REGISTER recebido:", req.body)
  
  const { nome, email, senha } = req.body

  try {
    const senhaHash = await bcrypt.hash(senha, 10)
    console.log("Hash gerado OK")

    db.run(
      "INSERT INTO users (email, senha, role) VALUES (?, ?, ?)",
      [email, senhaHash, "aluno"],
      function (err) {
        if (err) {
          console.log("ERRO ao inserir user:", err.message)
          return res.status(500).json({ erro: err.message })
        }

        console.log("User inserido, id:", this.lastID)
        const userId = this.lastID

        db.run(
          "INSERT INTO alunos (nome, status, user_id) VALUES (?, ?, ?)",
          [nome, "ativo", userId],
          function (err) {
            if (err) {
              console.log("ERRO ao inserir aluno:", err.message)
              return res.status(500).json({ erro: err.message })
            }
            console.log("Aluno inserido OK")
            res.json({ mensagem: "Aluno criado com login!" })
          }
        )
      }
    )
  } catch (err) {
    console.log("ERRO geral:", err.message)
    res.status(500).json({ erro: err.message })
  }
})

/* 🆕 CRIAR PROFESSOR/ADMIN — só admin */
app.post("/usuarios", auth, requireRole("admin"), async (req, res) => {
  const { email, senha, role } = req.body
  if (!["professor", "admin"].includes(role)) {
    return res.status(400).json({ erro: "Role inválido." })
  }
  const senhaHash = await bcrypt.hash(senha, 10)
  db.run(
    "INSERT INTO users (email, senha, role) VALUES (?, ?, ?)",
    [email, senhaHash, role],
    function (err) {
      if (err) return res.status(400).json({ erro: "Email já cadastrado." })
      res.json({ mensagem: `Usuário ${role} criado!` })
    }
  )
})

/* 📋 LISTAR ALUNOS */
app.get("/alunos", auth, (req, res) => {
  if (req.user.role === "aluno") {
    db.all("SELECT * FROM alunos WHERE user_id = ?", [req.user.id], (err, rows) => {
      if (err) return res.status(500).json(err)
      res.json(rows)
    })
  } else {
    db.all("SELECT * FROM alunos", [], (err, rows) => {
      if (err) return res.status(500).json(err)
      res.json(rows)
    })
  }
})

/* ➕ CADASTRAR ALUNO — admin e professor */
app.post("/alunos", auth, requireRole("admin", "professor"), (req, res) => {
  const { nome, faixa, telefone, plano, status, data } = req.body
  db.run(
    "INSERT INTO alunos (nome, faixa, telefone, plano, status, data) VALUES (?, ?, ?, ?, ?, ?)",
    [nome, faixa, telefone, plano, status?.toLowerCase().trim(), data],
    function (err) {
      if (err) return res.status(500).json(err)
      res.json({ id: this.lastID })
    }
  )
})

/* ✏️ EDITAR ALUNO — admin e professor */
app.put("/alunos/:id", auth, requireRole("admin", "professor"), (req, res) => {
  const { nome, faixa, telefone, plano, status, data } = req.body
  db.run(
    `UPDATE alunos SET nome=?, faixa=?, telefone=?, plano=?, status=?, data=? WHERE id=?`,
    [nome, faixa, telefone, plano, status?.toLowerCase().trim(), data, req.params.id],
    function (err) {
      if (err) return res.status(500).json(err)
      res.json({ mensagem: "Aluno atualizado" })
    }
  )
})

/* ❌ DELETAR ALUNO — só admin */
app.delete("/alunos/:id", auth, requireRole("admin"), (req, res) => {
  db.run("DELETE FROM alunos WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json(err)
    res.json({ mensagem: "Aluno removido" })
  })
})

/* 📊 DASHBOARD */
app.get("/dashboard", auth, (req, res) => {
  db.all("SELECT status FROM alunos", [], (err, rows) => {
    if (err) return res.status(500).json(err)
    const total = rows.length
    const ativos = rows.filter(a => a.status === "ativo").length
    const inativos = rows.filter(a => a.status === "inativo").length
    res.json({ total, ativos, inativos })
  })
})

/* 📅 LISTAR HORÁRIOS */
app.get("/horarios", auth, (req, res) => {
  db.all("SELECT * FROM horarios ORDER BY id", [], (err, rows) => {
    if (err) return res.status(500).json(err)
    res.json(rows)
  })
})

/* ➕ CRIAR HORÁRIO — admin e professor */
app.post("/horarios", auth, requireRole("admin", "professor"), (req, res) => {
  const { dia_semana, hora_inicio, hora_fim, data_especifica, professor, tipo } = req.body
  db.run(
    "INSERT INTO horarios (dia_semana, hora_inicio, hora_fim, data_especifica, professor, tipo) VALUES (?,?,?,?,?,?)",
    [dia_semana, hora_inicio, hora_fim, data_especifica || null, professor, tipo || "avulso"],
    function (err) {
      if (err) return res.status(500).json(err)
      res.json({ id: this.lastID, mensagem: "Horário criado!" })
    }
  )
})

/* ❌ DELETAR HORÁRIO — só admin */
app.delete("/horarios/:id", auth, requireRole("admin"), (req, res) => {
  db.run("DELETE FROM horarios WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json(err)
    res.json({ mensagem: "Horário removido" })
  })
})

/* ✅ CHECK-IN — aluno faz */
app.post("/presencas/checkin", auth, requireRole("aluno"), (req, res) => {
  const { horario_id } = req.body
  const hoje = new Date().toISOString().split("T")[0]

  // Busca o aluno_id pelo user_id
  db.get("SELECT id FROM alunos WHERE user_id = ?", [req.user.id], (err, aluno) => {
    if (err || !aluno) return res.status(404).json({ erro: "Aluno não encontrado" })

    // Evita check-in duplicado
    db.get(
      "SELECT id FROM presencas WHERE aluno_id=? AND horario_id=? AND data=?",
      [aluno.id, horario_id, hoje],
      (err, existe) => {
        if (existe) return res.status(400).json({ erro: "Check-in já realizado para esta aula." })

        db.run(
          "INSERT INTO presencas (aluno_id, horario_id, data, status) VALUES (?,?,?,?)",
          [aluno.id, horario_id, hoje, "pendente"],
          function (err) {
            if (err) return res.status(500).json(err)
            res.json({ mensagem: "Check-in realizado! Aguardando confirmação." })
          }
        )
      }
    )
  })
})

/* ✅ CONFIRMAR PRESENÇA — professor e admin */
app.put("/presencas/:id/confirmar", auth, requireRole("admin", "professor"), (req, res) => {
  db.run(
    "UPDATE presencas SET status='confirmado' WHERE id=?",
    [req.params.id],
    function (err) {
      if (err) return res.status(500).json(err)
      res.json({ mensagem: "Presença confirmada!" })
    }
  )
})

/* ➕ PRESENÇA MANUAL — professor e admin (aluno esqueceu check-in) */
app.post("/presencas/manual", auth, requireRole("admin", "professor"), (req, res) => {
  const { aluno_id, horario_id, data } = req.body
  db.run(
    "INSERT INTO presencas (aluno_id, horario_id, data, status) VALUES (?,?,?,?)",
    [aluno_id, horario_id, data, "confirmado"],
    function (err) {
      if (err) return res.status(500).json(err)
      res.json({ mensagem: "Presença registrada manualmente!" })
    }
  )
})

/* 📋 LISTAR PRESENÇAS — aluno vê as próprias, admin/professor vê todas */
app.get("/presencas", auth, (req, res) => {
  if (req.user.role === "aluno") {
    db.get("SELECT id FROM alunos WHERE user_id = ?", [req.user.id], (err, aluno) => {
      if (err || !aluno) return res.status(404).json({ erro: "Aluno não encontrado" })
      db.all(
        `SELECT p.*, h.dia_semana, h.hora_inicio, h.hora_fim, h.data_especifica
         FROM presencas p
         JOIN horarios h ON p.horario_id = h.id
         WHERE p.aluno_id = ?
         ORDER BY p.data DESC`,
        [aluno.id],
        (err, rows) => {
          if (err) return res.status(500).json(err)
          res.json(rows)
        }
      )
    })
  } else {
    db.all(
      `SELECT p.*, a.nome as aluno_nome, h.dia_semana, h.hora_inicio, h.data_especifica
       FROM presencas p
       JOIN alunos a ON p.aluno_id = a.id
       JOIN horarios h ON p.horario_id = h.id
       ORDER BY p.data DESC`,
      [],
      (err, rows) => {
        if (err) return res.status(500).json(err)
        res.json(rows)
      }
    )
  }
})

/* 💰 PAGAMENTOS — aluno vê o próprio */
app.get("/pagamentos", auth, (req, res) => {
  if (req.user.role === "aluno") {
    db.get("SELECT id FROM alunos WHERE user_id = ?", [req.user.id], (err, aluno) => {
      if (err || !aluno) return res.status(404).json({ erro: "Aluno não encontrado" })
      db.all(
        "SELECT * FROM pagamentos WHERE aluno_id = ? ORDER BY ano DESC, mes DESC",
        [aluno.id],
        (err, rows) => {
          if (err) return res.status(500).json(err)
          res.json(rows)
        }
      )
    })
  } else {
    db.all(
      `SELECT p.*, a.nome as aluno_nome FROM pagamentos p
       JOIN alunos a ON p.aluno_id = a.id
       ORDER BY p.ano DESC, p.mes DESC`,
      [],
      (err, rows) => {
        if (err) return res.status(500).json(err)
        res.json(rows)
      }
    )
  }
})

/* 💰 REGISTRAR PAGAMENTO — admin e professor */
app.post("/pagamentos", auth, requireRole("admin", "professor"), (req, res) => {
  const { aluno_id, mes, ano, status } = req.body
  const data_pagamento = status === "pago" ? new Date().toISOString().split("T")[0] : null

  db.run(
    "INSERT OR REPLACE INTO pagamentos (aluno_id, mes, ano, status, data_pagamento) VALUES (?,?,?,?,?)",
    [aluno_id, mes, ano, status, data_pagamento],
    function (err) {
      if (err) return res.status(500).json(err)
      res.json({ mensagem: "Pagamento registrado!" })
    }
  )
})

/* 👤 CRIAR ADMIN */
async function criarAdmin() {
  const senhaHash = await bcrypt.hash("123456", 10)
  db.run(
    "INSERT INTO users (email, senha, role) VALUES (?, ?, ?)",
    ["admin@bjj.com", senhaHash, "admin"]
  )
}

 criarAdmin()

app.listen(3000, () => console.log("Servidor rodando na porta 3000"))