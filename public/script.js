async function cadastrarAluno() {

 const aluno = {
 nome: document.getElementById("nome").value,
 faixa: document.getElementById("faixa").value,
 telefone: document.getElementById("telefone").value,
 plano: document.getElementById("plano").value,
 status: document.getElementById("status").value,
 data: document.getElementById("data").value
}

 await fetch("/alunos", {
  method: "POST",
  headers: {
   "Content-Type": "application/json"
  },
  body: JSON.stringify(aluno)
 })

 carregarAlunos()

 // limpa os campos
 document.getElementById("nome").value = ""
 document.getElementById("faixa").value = ""
 document.getElementById("telefone").value = ""
 document.getElementById("plano").value = ""
 document.getElementById("status").value = ""

}

async function carregarAlunos() {

 const resposta = await fetch("/alunos")

 const alunos = await resposta.json()

 const lista = document.getElementById("listaAlunos")

 lista.innerHTML = ""

 alunos.forEach((aluno, index) => {

  const linha = document.createElement("tr")

  linha.innerHTML = `
 <td>${aluno.nome}</td>
 <td>${aluno.faixa}</td>
 <td>${aluno.telefone}</td>
 <td>${aluno.plano}</td>
 <td>${aluno.status}</td>
<td>${aluno.data || "-"}</td>
 <td>
  <button onclick="editarAluno(${index})">Editar</button>
  <button onclick="deletarAluno(${index})">Excluir</button>
 </td>
`

  lista.appendChild(linha)

 })

} 

async function deletarAluno(index) {

 await fetch("/alunos/" + index, {
  method: "DELETE"
 })

 carregarAlunos()

}

function buscarAluno() {

 const filtro = document.getElementById("busca").value.toLowerCase()

 const linhas = document.querySelectorAll("#listaAlunos tr")

 linhas.forEach(linha => {

  const nome = linha.children[0].innerText.toLowerCase()

  if(nome.includes(filtro)){
   linha.style.display = ""
  } else {
   linha.style.display = "none"
  }

 })

}

carregarAlunos()