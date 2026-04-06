const express = require("express")
const router = express.Router()
const { listar, criar, atualizar, deletar, dashboard } = require("../controllers/alunosController")
const { auth, requireRole } = require("../middlewares/auth")

router.get("/alunos", auth, listar)
router.post("/alunos", auth, requireRole("admin", "professor"), criar)
router.put("/alunos/:id", auth, requireRole("admin", "professor"), atualizar)
router.delete("/alunos/:id", auth, requireRole("admin"), deletar)
router.get("/dashboard", auth, dashboard)

module.exports = router