const db = require("./database")
const express = require("express")
const app = express()

app.use(express.json())
app.use(express.static("public"))

let alunos = []

app.get("/alunos", (req, res) => {

 db.all("SELECT * FROM alunos", [], (err, rows) => {

  if(err){
   return res.status(500).json(err)
  }

  res.json(rows)

 })

})

app.post("/alunos", (req, res) => {

 const { nome, faixa, telefone, plano, status, data } = req.body

 db.run(
  "INSERT INTO alunos (nome, faixa, telefone, plano, status, data) VALUES (?, ?, ?, ?, ?, ?)",
  [nome, faixa, telefone, plano, status, data],
  function(err){
   if(err){
    return res.status(500).json(err)
   }

   res.json({ id: this.lastID })
  }
 )

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