const express = require("express")
const app = express()

app.use(express.json())
app.use(express.static("public"))

let alunos = []

app.get("/", (req, res) => {
  res.send("BJJ Academy CRM funcionando")
})

app.post("/alunos", (req, res) => {
  const aluno = req.body
  alunos.push(aluno)
  res.json(aluno)
})

app.get("/alunos", (req, res) => {
  res.json(alunos)
})

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000")
})

app.delete("/alunos/:index", (req, res) => {
  const index = req.params.index

  alunos.splice(index, 1)

  res.json({ mensagem: "Aluno removido" })
})

app.put("/alunos/:index", (req, res) => {
  const index = req.params.index
  const novoAluno = req.body

  alunos[index] = novoAluno

  res.json(novoAluno)
})