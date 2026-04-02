let grafico

function normalizarStatus(status) {
  return status?.toLowerCase().trim()
}

/* 📡 API */
function api(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: localStorage.getItem("token")
    }
  })
}

/* 🪟 MODAIS */
function abrirModal(id) {
  document.getElementById(id).style.display = "flex"
}

function fecharModal(id) {
  document.getElementById(id).style.display = "none"
}

// Fecha modal clicando fora
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal-overlay")) {
    e.target.style.display = "none"
  }
})

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
    localStorage.setItem("role", data.role)
    iniciarApp()
  } else {
    alert(data.erro || "Erro no login")
  }
}

/* 🆕 REGISTER — agora via modal */
async function submitRegister() {
  const nome = document.getElementById("reg-nome").value.trim()
  const email = document.getElementById("reg-email").value.trim()
  const senha = document.getElementById("reg-senha").value

  if (!nome || !email || !senha) return alert("Preencha todos os campos")

  const res = await fetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome, email, senha })
  })

  const data = await res.json()

  if (res.ok) {
    fecharModal("modal-register")
    document.getElementById("reg-nome").value = ""
    document.getElementById("reg-email").value = ""
    document.getElementById("reg-senha").value = ""
    alert("Aluno criado! Pode fazer login.")
  } else {
    alert(data.erro || "Erro ao criar aluno")
  }
}

/* 🚪 LOGOUT */
function logout() {
  localStorage.removeItem("token")
  localStorage.removeItem("role")
  location.reload()
}

/* 🚀 INICIAR APP */
function iniciarApp() {
  const role = localStorage.getItem("role")

  document.getElementById("login").style.display = "none"
  document.getElementById("app").style.display = "block"

  const cores = { admin: "#f59e0b", professor: "#3b82f6", aluno: "#22c55e" }
  const labelRole = document.getElementById("label-role")
  labelRole.textContent = role?.toUpperCase()
  labelRole.style.color = cores[role] || "#e2e8f0"

  if (role === "aluno") {
    document.getElementById("painel-aluno").style.display = "block"
    carregarPainelAluno()
  } else {
    document.getElementById("painel-gestao").style.display = "block"
    document.getElementById("secao-admin").style.display = role === "admin" ? "block" : "none"
    carregarPainelGestao()
  }
}

/* ========== PAINEL ALUNO ========== */

async function carregarPainelAluno() {
  await carregarPerfilAluno()
  await carregarProximasAulas()
  await carregarPresencasAluno()
  await carregarPagamentosAluno()
}

async function carregarPerfilAluno() {
  const res = await api("/alunos")
  const alunos = await res.json()
  const aluno = alunos[0]
  if (!aluno) return

  document.getElementById("perfil-aluno").innerHTML = `
    <div class="card-info">
      <p><strong>Nome:</strong> ${aluno.nome}</p>
      <p><strong>Faixa:</strong> ${aluno.faixa || "-"}</p>
      <p><strong>Plano:</strong> ${aluno.plano || "-"}</p>
      <p><strong>Status:</strong>
        <span class="${normalizarStatus(aluno.status) === 'ativo' ? 'ativo' : 'inativo'}">
          ${aluno.status || "-"}
        </span>
      </p>
      <p><strong>Matrícula:</strong> ${aluno.data || "-"}</p>
    </div>
  `
}

async function carregarProximasAulas() {
  const res = await api("/horarios")
  const horarios = await res.json()

  const proximas = horarios.filter(h => {
    if (h.tipo === "avulso" && h.data_especifica) {
      return new Date(h.data_especifica) >= new Date()
    }
    return true
  })

  const area = document.getElementById("proximas-aulas")
  const checkinArea = document.getElementById("checkin-area")

  area.innerHTML = proximas.map(h => `
    <div class="card-aula">
      <strong>${h.dia_semana || h.data_especifica}</strong>
      ${h.hora_inicio} – ${h.hora_fim}
      ${h.tipo === "avulso" ? `<span class="badge-avulso">Avulsa</span>` : ""}
    </div>
  `).join("") || "<p>Nenhuma aula cadastrada.</p>"

  checkinArea.innerHTML = proximas.map(h => `
    <button onclick="fazerCheckin(${h.id})">
      Check-in: ${h.dia_semana || h.data_especifica} ${h.hora_inicio}
    </button>
  `).join("")
}

async function fazerCheckin(horario_id) {
  const res = await api("/presencas/checkin", {
    method: "POST",
    body: JSON.stringify({ horario_id })
  })
  const data = await res.json()
  alert(data.mensagem || data.erro)
  carregarPresencasAluno()
}

async function carregarPresencasAluno() {
  const res = await api("/presencas")
  const presencas = await res.json()
  const tbody = document.getElementById("lista-presencas-aluno")

  tbody.innerHTML = presencas.map(p => `
    <tr>
      <td>${p.data}</td>
      <td>${p.dia_semana || "-"}</td>
      <td>${p.hora_inicio} – ${p.hora_fim}</td>
      <td class="${p.status === 'confirmado' ? 'ativo' : 'inativo'}">${p.status}</td>
    </tr>
  `).join("") || "<tr><td colspan='4'>Nenhuma presença registrada.</td></tr>"
}

async function carregarPagamentosAluno() {
  const res = await api("/pagamentos")
  const pagamentos = await res.json()
  const tbody = document.getElementById("lista-pagamentos-aluno")

  tbody.innerHTML = pagamentos.map(p => `
    <tr>
      <td>${p.mes}</td>
      <td>${p.ano}</td>
      <td class="${p.status === 'pago' ? 'ativo' : 'inativo'}">${p.status}</td>
      <td>${p.data_pagamento || "-"}</td>
    </tr>
  `).join("") || "<tr><td colspan='4'>Nenhum pagamento registrado.</td></tr>"
}

/* ========== PAINEL GESTÃO ========== */

async function carregarPainelGestao() {
  await carregarDashboard()
  await carregarGrafico()
  await carregarAlunos()
  await carregarHorarios()
  await carregarPresencasGestao()
  await popularSelects()
}

async function carregarDashboard() {
  const res = await api("/dashboard")
  const d = await res.json()
  document.getElementById("total").innerText = d.total
  document.getElementById("ativos").innerText = d.ativos
  document.getElementById("inativos").innerText = d.inativos
}

async function carregarGrafico() {
  const res = await api("/dashboard")
  const d = await res.json()
  const ctx = document.getElementById("graficoAlunos").getContext("2d")
  if (grafico) grafico.destroy()
  grafico = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Ativos", "Inativos"],
      datasets: [{ data: [d.ativos, d.inativos], backgroundColor: ["#22c55e", "#ef4444"] }]
    }
  })
}

async function carregarAlunos() {
  const res = await api("/alunos")
  const alunos = await res.json()
  const role = localStorage.getItem("role")
  const lista = document.getElementById("listaAlunos")
  lista.innerHTML = ""

  alunos.forEach(aluno => {
    const statusNorm = normalizarStatus(aluno.status)
    const btnExcluir = role === "admin"
      ? `<button class="btn-excluir" onclick="deletarAluno(${aluno.id})">Excluir</button>`
      : ""
    const linha = document.createElement("tr")
    linha.innerHTML = `
      <td>${aluno.nome}</td>
      <td>${aluno.faixa || "-"}</td>
      <td>${aluno.telefone || "-"}</td>
      <td>${aluno.plano || "-"}</td>
      <td class="${statusNorm === 'ativo' ? 'ativo' : 'inativo'}">${aluno.status}</td>
      <td>${aluno.data || "-"}</td>
      <td>
        <button onclick="editarAluno(${aluno.id}, '${aluno.nome}', '${aluno.faixa || ''}', '${aluno.telefone || ''}', '${aluno.plano || ''}', '${aluno.status || ''}', '${aluno.data || ''}')">Editar</button>
        ${btnExcluir}
      </td>
    `
    lista.appendChild(linha)
  })
}

async function cadastrarAluno() {
  const aluno = {
    nome: document.getElementById("nome").value,
    faixa: document.getElementById("faixa").value,
    telefone: document.getElementById("telefone").value,
    plano: document.getElementById("plano").value,
    status: document.getElementById("status").value.trim(),
    data: document.getElementById("data").value
  }
  const res = await api("/alunos", { method: "POST", body: JSON.stringify(aluno) })
  if (!res.ok) {
    const d = await res.json()
    return alert(d.erro || "Sem permissão")
  }
  carregarPainelGestao()
  limparCampos()
}

/* ✏️ EDITAR — abre modal com dados preenchidos */
function editarAluno(id, nome, faixa, telefone, plano, status, data) {
  document.getElementById("edit-id").value = id
  document.getElementById("edit-nome").value = nome
  document.getElementById("edit-faixa").value = faixa
  document.getElementById("edit-telefone").value = telefone
  document.getElementById("edit-plano").value = plano
  document.getElementById("edit-status").value = status
  document.getElementById("edit-data").value = data
  abrirModal("modal-editar")
}

async function submitEditar() {
  const id = document.getElementById("edit-id").value
  const nome = document.getElementById("edit-nome").value
  const faixa = document.getElementById("edit-faixa").value
  const telefone = document.getElementById("edit-telefone").value
  const plano = document.getElementById("edit-plano").value
  const status = document.getElementById("edit-status").value
  const data = document.getElementById("edit-data").value

  const res = await api("/alunos/" + id, {
    method: "PUT",
    body: JSON.stringify({ nome, faixa, telefone, plano, status, data })
  })

  if (!res.ok) {
    const d = await res.json()
    return alert(d.erro || "Erro ao editar")
  }

  fecharModal("modal-editar")
  carregarPainelGestao()
}

async function deletarAluno(id) {
  if (!confirm("Tem certeza?")) return
  const res = await api("/alunos/" + id, { method: "DELETE" })
  const data = await res.json()
  if (!res.ok) return alert(data.erro || "Erro ao deletar")
  carregarPainelGestao()
}

function limparCampos() {
  ["nome","faixa","telefone","plano","status","data"]
    .forEach(id => document.getElementById(id).value = "")
}

/* 📅 HORÁRIOS */
async function carregarHorarios() {
  const res = await api("/horarios")
  const horarios = await res.json()
  const role = localStorage.getItem("role")
  const tbody = document.getElementById("lista-horarios")

  tbody.innerHTML = horarios.map(h => `
    <tr>
      <td>${h.dia_semana || "-"}</td>
      <td>${h.hora_inicio}</td>
      <td>${h.hora_fim}</td>
      <td>${h.professor || "-"}</td>
      <td>${h.tipo}</td>
      <td>${h.data_especifica || "-"}</td>
      <td>
        ${role === "admin"
          ? `<button class="btn-excluir" onclick="deletarHorario(${h.id})">Excluir</button>`
          : ""}
      </td>
    </tr>
  `).join("")
}

async function criarHorario() {
  const dia = document.getElementById("h-dia").value
  const inicio = document.getElementById("h-inicio").value
  const fim = document.getElementById("h-fim").value
  const professor = document.getElementById("h-professor").value
  const dataEsp = document.getElementById("h-data").value
  const tipo = dataEsp ? "avulso" : "fixo"

  const res = await api("/horarios", {
    method: "POST",
    body: JSON.stringify({
      dia_semana: dia || null,
      hora_inicio: inicio,
      hora_fim: fim,
      professor,
      data_especifica: dataEsp || null,
      tipo
    })
  })

  const data = await res.json()
  alert(data.mensagem || data.erro)
  carregarHorarios()
  popularSelects()
}

async function deletarHorario(id) {
  if (!confirm("Remover este horário?")) return
  await api("/horarios/" + id, { method: "DELETE" })
  carregarHorarios()
}

/* ✅ PRESENÇAS GESTÃO */
async function carregarPresencasGestao() {
  const res = await api("/presencas")
  const presencas = await res.json()
  const tbody = document.getElementById("lista-presencas-gestao")
  const pendentes = presencas.filter(p => p.status === "pendente")

  tbody.innerHTML = pendentes.map(p => `
    <tr>
      <td>${p.aluno_nome}</td>
      <td>${p.data}</td>
      <td>${p.dia_semana || p.data_especifica} ${p.hora_inicio}</td>
      <td class="inativo">${p.status}</td>
      <td><button onclick="confirmarPresenca(${p.id})">✔ Confirmar</button></td>
    </tr>
  `).join("") || "<tr><td colspan='5'>Nenhuma presença pendente.</td></tr>"
}

async function confirmarPresenca(id) {
  const res = await api("/presencas/" + id + "/confirmar", { method: "PUT" })
  const data = await res.json()
  alert(data.mensagem || data.erro)
  carregarPresencasGestao()
}

async function presencaManual() {
  const aluno_id = document.getElementById("pm-aluno").value
  const horario_id = document.getElementById("pm-horario").value
  const data = document.getElementById("pm-data").value
  if (!aluno_id || !horario_id || !data) return alert("Preencha todos os campos")

  const res = await api("/presencas/manual", {
    method: "POST",
    body: JSON.stringify({ aluno_id, horario_id, data })
  })
  const d = await res.json()
  alert(d.mensagem || d.erro)
  carregarPresencasGestao()
}

/* 💰 PAGAMENTOS */
async function registrarPagamento() {
  const aluno_id = document.getElementById("pag-aluno").value
  const mes = document.getElementById("pag-mes").value
  const ano = document.getElementById("pag-ano").value
  const status = document.getElementById("pag-status").value
  if (!aluno_id || !mes || !ano) return alert("Preencha todos os campos")

  const res = await api("/pagamentos", {
    method: "POST",
    body: JSON.stringify({ aluno_id, mes, ano, status })
  })
  const data = await res.json()
  alert(data.mensagem || data.erro)
}

/* 🔧 POPULAR SELECTS */
async function popularSelects() {
  const res = await api("/alunos")
  const alunos = await res.json()
  const resH = await api("/horarios")
  const horarios = await resH.json()

  ;["pm-aluno", "pag-aluno"].forEach(id => {
    const el = document.getElementById(id)
    if (el) el.innerHTML = alunos.map(a => `<option value="${a.id}">${a.nome}</option>`).join("")
  })

  const pmHorario = document.getElementById("pm-horario")
  if (pmHorario) {
    pmHorario.innerHTML = horarios.map(h =>
      `<option value="${h.id}">${h.dia_semana || h.data_especifica} ${h.hora_inicio}</option>`
    ).join("")
  }
}

/* 🆕 CRIAR PROFESSOR — agora via modal */
async function submitProfessor() {
  const email = document.getElementById("prof-email").value.trim()
  const senha = document.getElementById("prof-senha").value

  if (!email || !senha) return alert("Preencha todos os campos")

  const res = await api("/usuarios", {
    method: "POST",
    body: JSON.stringify({ email, senha, role: "professor" })
  })
  const data = await res.json()

  if (res.ok) {
    fecharModal("modal-professor")
    document.getElementById("prof-email").value = ""
    document.getElementById("prof-senha").value = ""
    alert(data.mensagem)
  } else {
    alert(data.erro || "Erro ao criar professor")
  }
}

/* 🚀 INIT */
if (localStorage.getItem("token")) {
  iniciarApp()
}