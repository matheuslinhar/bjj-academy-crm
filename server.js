const express = require("express")
const bcrypt = require("bcrypt")
const { conectar } = require("./database")

const app = express()

app.use(express.json())
app.use(express.static("public"))

// Rotas
app.use(require("./routes/auth"))
app.use(require("./routes/alunos"))
app.use(require("./routes/horarios"))
app.use(require("./routes/presencas"))
app.use(require("./routes/pagamentos"))

async function criarAdmin() {
  const db = await conectar()
  const senhaHash = await bcrypt.hash("123456", 10)
  await db.run(
    "INSERT INTO users (email, senha, role) VALUES (?, ?, ?)",
    ["admin@bjj.com", senhaHash, "admin"]
  )
  console.log("Admin criado!")
}

// Inicializa banco e sobe servidor
conectar().then(() => {
  criarAdmin() // 👈 comenta depois de criar
  app.listen(3000, () => console.log("Servidor rodando na porta 3000"))
}).catch(err => {
  console.error("Erro ao conectar banco:", err)
})