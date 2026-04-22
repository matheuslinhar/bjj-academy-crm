const express = require("express")
const { conectar } = require("./database")

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use(express.static("public"))

app.use(require("./routes/auth"))
app.use(require("./routes/alunos"))
app.use(require("./routes/horarios"))
app.use(require("./routes/presencas"))
app.use(require("./routes/pagamentos"))

conectar().then(() => {
  app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`))
}).catch(err => {
  console.error("Erro ao conectar banco:", err)
})