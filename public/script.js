let grafico

function normalizarStatus(status) {
 return status?.toLowerCase().trim()
}

/* CADASTRAR */
async function cadastrarAluno() {

 const aluno = {
  nome: document.getElementById("nome").value,
  faixa: document.getElementById("faixa").value,
  telefone: document.getElementById("telefone").value,
  plano: document.getElementById("plano").value,
  status: document.getElementById("status").value.trim(),
  data: document.getElementById("data").value
 }

 await fetch("/alunos", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(aluno)
 })

 carregarTudo()
 limparCampos()
}

/* LISTAR */
async function carregarAlunos() {

 const res = await fetch("/alunos")
 const alunos = await res.json()

 const lista = document.getElementById("listaAlunos")
 lista.innerHTML = ""

 alunos.forEach(aluno => {

  const statusNormalizado = normalizarStatus(aluno.status)

  const linha = document.createElement("tr")

  linha.innerHTML = `
   <td>${aluno.nome}</td>
   <td>${aluno.faixa}</td>
   <td>${aluno.telefone}</td>
   <td>${aluno.plano}</td>
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

/* DELETAR */
async function deletarAluno(id) {

 if (!confirm("Tem certeza?")) return

 await fetch("/alunos/" + id, { method: "DELETE" })

 carregarTudo()
}

/* EDITAR */
async function editarAluno(id) {

 const nome = prompt("Novo nome")
 const faixa = prompt("Nova faixa")
 const status = prompt("Status (Ativo/Inativo)")

 await fetch("/alunos/" + id, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
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

/* DASHBOARD */
async function carregarDashboard() {

 const res = await fetch("/dashboard")
 const d = await res.json()

 document.getElementById("total").innerText = d.total
 document.getElementById("ativos").innerText = d.ativos
 document.getElementById("inativos").innerText = d.inativos
}

/* GRÁFICO */
async function carregarGrafico() {

 const res = await fetch("/dashboard")
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
  },
  options: {
   responsive: true,
   maintainAspectRatio: false
  }
 })
}

/* HELPERS */
function limparCampos() {
 ["nome","faixa","telefone","plano","status","data"]
  .forEach(id => document.getElementById(id).value = "")
}

function carregarTudo() {
 carregarAlunos()
 carregarDashboard()
 carregarGrafico()
}

/* INIT */
carregarTudo()