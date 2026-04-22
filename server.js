const express = require("express")
const cors = require("cors")

const { conectar } = require("./database")

const app = express()

const PORT = process.env.PORT || 3000

/* 🔐 MIDDLEWARES */
app.use(cors())
app.use(express.json())
app.use(express.static("public"))

/* 🔎 ROTA DE TESTE (IMPORTANTE PRA DEPLOY) */
app.get("/", (req, res) => {
  res.send("🚀 BJJ CRM rodando!")
})

/* 📦 ROTAS */
app.use("/auth", require("./routes/auth"))
app.use("/alunos", require("./routes/alunos"))
app.use("/horarios", require("./routes/horarios"))
app.use("/presencas", require("./routes/presencas"))
app.use("/pagamentos", require("./routes/pagamentos"))

/* 🧠 INICIAR SERVER */
async function startServer() {
  try {
    await conectar()

    app.listen(PORT, () => {
      console.log(`🔥 Servidor rodando na porta ${PORT}`)
    })

  } catch (err) {
    console.error("❌ Erro ao conectar banco:", err)
    process.exit(1) // força erro → ajuda no Render
  }
}

startServer()