const db = require("./database")
const express = require("express")
const app = express()

app.use(express.json())
app.use(express.static("public"))

/* LISTAR */
app.get("/alunos", (req, res) => {

 db.all("SELECT * FROM alunos", [], (err, rows) => {
  if (err) {
   return res.status(500).json(err)
  }
  res.json(rows)
 })

})

/* CADASTRAR */
app.post("/alunos", (req, res) => {

 const { nome, faixa, telefone, plano, status, data } = req.body

 db.run(
  "INSERT INTO alunos (nome, faixa, telefone, plano, status, data) VALUES (?, ?, ?, ?, ?, ?)",
  [nome, faixa, telefone, plano, status, data],
  function (err) {
   if (err) {
    return res.status(500).json(err)
   }

   res.json({ id: this.lastID })
  }
 )

})

/* DELETAR */
app.delete("/alunos/:id", (req, res) => {

 const id = req.params.id

 db.run("DELETE FROM alunos WHERE id = ?", [id], function (err) {
  if (err) {
   return res.status(500).json(err)
  }

  res.json({ mensagem: "Aluno removido" })
 })

})

/* EDITAR */
app.put("/alunos/:id", (req, res) => {

 const id = req.params.id
 const { nome, faixa, telefone, plano, status, data } = req.body

 db.run(
  `UPDATE alunos 
   SET nome = ?, faixa = ?, telefone = ?, plano = ?, status = ?, data = ?
   WHERE id = ?`,
  [nome, faixa, telefone, plano, status, data, id],
  function (err) {
   if (err) {
    return res.status(500).json(err)
   }

   res.json({ mensagem: "Aluno atualizado" })
  }
 )

})

/* DASHBOARD */
app.get("/dashboard", (req, res) => {

 db.all("SELECT status FROM alunos", [], (err, rows) => {

  if (err) {
   return res.status(500).json(err)
  }

  const total = rows.length

  const ativos = rows.filter(a =>
   a.status?.toLowerCase().trim() === "ativo"
  ).length

  const inativos = rows.filter(a =>
   a.status?.toLowerCase().trim() === "inativo"
  ).length

  res.json({
   total,
   ativos,
   inativos
  })

 })

})

app.listen(3000, () => {
 console.log("Servidor rodando na porta 3000")
})