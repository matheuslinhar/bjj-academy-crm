const express = require("express")
const router = express.Router()
const { listar, registrar } = require("../controllers/pagamentosController")
const { auth, requireRole } = require("../middlewares/auth")

router.get("/pagamentos", auth, listar)
router.post("/pagamentos", auth, requireRole("admin", "professor"), registrar)

module.exports = router