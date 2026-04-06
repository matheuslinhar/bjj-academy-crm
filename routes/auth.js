const express = require("express")
const router = express.Router()
const { login, register, criarUsuario } = require("../controllers/authController")
const { auth, requireRole } = require("../middlewares/auth")

router.post("/login", login)
router.post("/register", register)
router.post("/usuarios", auth, requireRole("admin"), criarUsuario)

module.exports = router