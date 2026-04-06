const jwt = require("jsonwebtoken")
const SECRET = process.env.SECRET || "segredo_super_forte"

function auth(req, res, next) {
  const token = req.headers.authorization
  if (!token) return res.status(401).json({ erro: "Sem token" })

  try {
    req.user = jwt.verify(token, SECRET)
    next()
  } catch {
    return res.status(401).json({ erro: "Token inválido" })
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ erro: "Acesso negado." })
    }
    next()
  }
}

module.exports = { auth, requireRole }