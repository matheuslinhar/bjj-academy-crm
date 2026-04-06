const express = require("express")
const router = express.Router()
const { listar, criar, deletar } = require("../controllers/horariosController")
const { auth, requireRole } = require("../middlewares/auth")

router.get("/horarios", auth, listar)
router.post("/horarios", auth, requireRole("admin", "professor"), criar)
router.delete("/horarios/:id", auth, requireRole("admin"), deletar)

module.exports = router