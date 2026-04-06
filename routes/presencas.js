const express = require("express")
const router = express.Router()
const { checkin, confirmar, manual, listar } = require("../controllers/presencasController")
const { auth, requireRole } = require("../middlewares/auth")

router.get("/presencas", auth, listar)
router.post("/presencas/checkin", auth, requireRole("aluno"), checkin)
router.put("/presencas/:id/confirmar", auth, requireRole("admin", "professor"), confirmar)
router.post("/presencas/manual", auth, requireRole("admin", "professor"), manual)

module.exports = router