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
  const decoded = jwt.verify(token, SECRET)
  req.user = decoded
  next()
 } catch {
  return res.status(401).json({ erro: "Token inválido" })
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

  const token = jwt.sign(
   { id: user.id, role: user.role },
   SECRET,
   { expiresIn: "1d" }
  )

  res.json({ token })
 })
})

/* 🆕 REGISTER (NOVO) */
app.post("/register", async (req, res) => {

 const { nome, email, senha } = req.body

 const senhaHash = await bcrypt.hash(senha, 10)

 db.run(
  "INSERT INTO users (email, senha, role) VALUES (?, ?, ?)",
  [email, senhaHash, "aluno"],
  function (err) {
   if (err) return res.status(500).json(err)

   const userId = this.lastID

   db.run(
    "INSERT INTO alunos (nome, status, user_id) VALUES (?, ?, ?)",
    [nome, "ativo", userId],
    function (err) {
     if (err) return res.status(500).json(err)

     res.json({ mensagem: "Aluno criado com login!" })
    }
   )
  }
 )

})

/* 📋 LISTAR */
app.get("/alunos", auth, (req, res) => {

 if (req.user.role === "aluno") {
  db.all(
   "SELECT * FROM alunos WHERE user_id = ?",
   [req.user.id],
   (err, rows) => {
    if (err) return res.status(500).json(err)
    res.json(rows)
   }
  )
 } else {
  db.all("SELECT * FROM alunos", [], (err, rows) => {
   if (err) return res.status(500).json(err)
   res.json(rows)
  })
 }

})

/* ➕ CADASTRAR */
app.post("/alunos", auth, (req, res) => {

 const { nome, faixa, telefone, plano, status, data } = req.body
 const statusNormalizado = status?.toLowerCase().trim()

 db.run(
  "INSERT INTO alunos (nome, faixa, telefone, plano, status, data) VALUES (?, ?, ?, ?, ?, ?)",
  [nome, faixa, telefone, plano, statusNormalizado, data],
  function (err) {
   if (err) return res.status(500).json(err)
   res.json({ id: this.lastID })
  }
 )

})

/* ❌ DELETE */
app.delete("/alunos/:id", auth, (req, res) => {

 if (req.user.role !== "admin") {
  return res.status(403).json({ erro: "Sem permissão" })
 }

 db.run("DELETE FROM alunos WHERE id = ?", [req.params.id], function (err) {
  if (err) return res.status(500).json(err)
  res.json({ mensagem: "Aluno removido" })
 })

})

/* ✏️ EDITAR */
app.put("/alunos/:id", auth, (req, res) => {

 const { nome, faixa, telefone, plano, status, data } = req.body
 const statusNormalizado = status?.toLowerCase().trim()

 db.run(
  `UPDATE alunos 
   SET nome = ?, faixa = ?, telefone = ?, plano = ?, status = ?, data = ?
   WHERE id = ?`,
  [nome, faixa, telefone, plano, statusNormalizado, data, req.params.id],
  function (err) {
   if (err) return res.status(500).json(err)
   res.json({ mensagem: "Aluno atualizado" })
  }
 )

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

/* 👤 ADMIN */
async function criarAdmin() {
 const senhaHash = await bcrypt.hash("123456", 10)

 db.run(
  "INSERT INTO users (email, senha, role) VALUES (?, ?, ?)",
  ["admin@bjj.com", senhaHash, "admin"]
 )
}

// criarAdmin()

app.listen(3000, () => {
 console.log("Servidor rodando na porta 3000")
})