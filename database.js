const sqlite3 = require("sqlite3").verbose()

const db = new sqlite3.Database("./bjj.db")

db.serialize(() => {

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
  CREATE TABLE IF NOT EXISTS users (
   id INTEGER PRIMARY KEY AUTOINCREMENT,
   email TEXT UNIQUE,
   senha TEXT,
   role TEXT
  )
 `)

})

module.exports = db