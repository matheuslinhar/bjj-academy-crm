let grafico

function normalizarStatus(status) {
 return status?.toLowerCase().trim()
}

/* 🔐 LOGIN */
async function login() {
 const email = document.getElementById("email").value
 const senha = document.getElementById("senha").value

 const res = await fetch("/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, senha })
 })

 const data = await res.json()

 if (data.token) {
  localStorage.setItem("token", data.token)

  document.getElementById("login").style.display = "none"
  document.getElementById("app").style.display = "block"

  carregarTudo()
 } else {
  alert(data.erro || "Erro no login")
 }
}

/* 🆕 REGISTER */
async function register() {
 const nome = prompt("Nome do aluno")
 const email = prompt("Email")
 const senha = prompt("Senha")

 if (!nome || !email || !senha) {
  alert("Preencha tudo")
  return
 }

 const res = await fetch("/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ nome, email, senha })
 })

 const data = await res.json()

 if (res.ok) {
  alert("Aluno criado com login!")
 } else {
  alert(data.erro || "Erro ao criar usuário")
 }
}

/* 🚪 LOGOUT */
function logout() {
 localStorage.removeItem("token")
 location.reload()
}

/* 📡 API COM TOKEN */
function api(url, options = {}) {
 return fetch(url, {
  ...options,
  headers: {
   "Content-Type": "application/json",
   Authorization: localStorage.getItem("token")
  }
 })
}

/* ➕ CADASTRAR ALUNO */
async function cadastrarAluno() {

 const aluno = {
  nome: document.getElementById("nome").value,
  faixa: document.getElementById("faixa").value,
  telefone: document.getElementById("telefone").value,
  plano: document.getElementById("plano").value,
  status: document.getElementById("status").value.trim(),
  data: document.getElementById("data").value
 }

 await api("/alunos", {
  method: "POST",
  body: JSON.stringify(aluno)
 })

 carregarTudo()
 limparCampos()
}

/* 📋 LISTAR ALUNOS */
async function carregarAlunos() {

 const res = await api("/alunos")

 if (res.status === 401) {
  logout()
  return
 }

 const alunos = await res.json()

 const lista = document.getElementById("listaAlunos")
 lista.innerHTML = ""

 alunos.forEach(aluno => {

  const statusNormalizado = normalizarStatus(aluno.status)

  const linha = document.createElement("tr")

  linha.innerHTML = `
   <td>${aluno.nome}</td>
   <td>${aluno.faixa || "-"}</td>
   <td>${aluno.telefone || "-"}</td>
   <td>${aluno.plano || "-"}</td>
   <td class="${statusNormalizado === 'ativo' ? 'ativo' : 'inativo'}">
    ${aluno.status}
   </td>
   <td>${aluno.data || "-"}</td>
   <td>
    <button onclick="editarAluno(${aluno.id})">Editar</button>
    <button onclick="deletarAluno(${aluno.id})">Excluir</button>
   </td>
  `

  lista.appendChild(linha)
 })
}

/* ❌ DELETAR */
async function deletarAluno(id) {

 if (!confirm("Tem certeza?")) return

 const res = await api("/alunos/" + id, { method: "DELETE" })
 const data = await res.json()

 if (!res.ok) {
  alert(data.erro || "Erro ao deletar")
  return
 }

 carregarTudo()
}

/* ✏️ EDITAR */
async function editarAluno(id) {

 const nome = prompt("Novo nome")
 const faixa = prompt("Nova faixa")
 const status = prompt("Status (Ativo/Inativo)")

 await api("/alunos/" + id, {
  method: "PUT",
  body: JSON.stringify({
   nome,
   faixa,
   telefone: "",
   plano: "",
   status: status?.trim(),
   data: ""
  })
 })

 carregarTudo()
}

/* 📊 DASHBOARD */
async function carregarDashboard() {

 const res = await api("/dashboard")
 const d = await res.json()

 document.getElementById("total").innerText = d.total
 document.getElementById("ativos").innerText = d.ativos
 document.getElementById("inativos").innerText = d.inativos
}

/* 📈 GRÁFICO */
async function carregarGrafico() {

 const res = await api("/dashboard")
 const d = await res.json()

 const ctx = document.getElementById("graficoAlunos").getContext("2d")

 if (grafico) grafico.destroy()

 grafico = new Chart(ctx, {
  type: "doughnut",
  data: {
   labels: ["Ativos", "Inativos"],
   datasets: [{
    data: [d.ativos, d.inativos],
    backgroundColor: ["#22c55e", "#ef4444"]
   }]
  }
 })
}

/* 🧹 LIMPAR CAMPOS */
function limparCampos() {
 ["nome","faixa","telefone","plano","status","data"]
  .forEach(id => document.getElementById(id).value = "")
}

/* 🔄 CARREGAR TUDO */
function carregarTudo() {
 carregarAlunos()
 carregarDashboard()
 carregarGrafico()
}

/* 🚀 INIT */
if (localStorage.getItem("token")) {
 document.getElementById("login").style.display = "none"
 document.getElementById("app").style.display = "block"
 carregarTudo()
}

function logout() {
 localStorage.removeItem("token")
 location.reload()
}