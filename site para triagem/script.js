document.addEventListener('DOMContentLoaded', function () {
    // Gerenciamento do menu de navegação
    const menuLinks = document.querySelectorAll('#menu a');
    menuLinks.forEach(function (link) {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            mostrarSecao(this.getAttribute('data-section'));
            // Atualizar a classe 'active' nos links
            menuLinks.forEach(function (link) {
                link.classList.remove('active');
            });
            this.classList.add('active');
        });
    });

    function mostrarSecao(id) {
        const sections = document.querySelectorAll('.section');
        sections.forEach(function (section) {
            if (section.id === id) {
                section.style.display = 'block';
            } else {
                section.style.display = 'none';
            }
        });
    }

    // Mostrar a seção 'home' ao carregar a página
    mostrarSecao('home');

    // Carregar templates salvos ao carregar a página
    carregarTemplatesGrupos();

    // Mapeamento de IDs de botões para funções
    const buttonMappings = {
        'adicionar-botao': adicionarBotao,
        'gerar-texto': gerarTexto,
        'copiar-texto-alerta': copiarTextoAlerta,
        'salvar-nota': salvarNota,
        'calcular': calcular
    };

    // Atribuir event listeners aos botões principais
    Object.keys(buttonMappings).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', buttonMappings[id]);
        }
    });

    // Event listeners para o modal
    document.getElementById('close-modal').addEventListener('click', fecharModal);
    document.getElementById('save-changes').addEventListener('click', salvarAlteracoes);
    document.getElementById('delete-button').addEventListener('click', excluirBotao);
    document.getElementById('salvar-template-grupo').addEventListener('click', salvarTemplateGrupo);

    // Carregar anotações
    carregarAnotacoes();
});

// Variáveis globais para o modal
let botaoAtual; // Referência ao container do botão que está sendo editado
let textoOriginal; // Texto original do botão

// Função para adicionar um novo botão
function adicionarBotao() {
    const texto = document.getElementById('input-text').value.trim();

    if (texto === "") {
        alert("Por favor, insira um texto.");
        return;
    }

    criarBotao(texto, texto, gerarCorAleatoria());

    document.getElementById('input-text').value = "";
}

// Função para criar um botão personalizado
function criarBotao(texto, apelido, cor) {
    const botao = document.createElement('button');
    botao.innerText = `Copiar: ${apelido}`;
    botao.className = 'copy-button';
    botao.style.backgroundColor = cor;
    botao.setAttribute('data-texto', texto); // Adiciona o atributo data-texto

    botao.addEventListener('click', function () {
        copiarTexto(texto);
    });

    const botaoEditar = document.createElement('button');
    botaoEditar.innerText = 'Editar';
    botaoEditar.className = 'edit-button';

    botaoEditar.addEventListener('click', function () {
        // Abrir modal para editar
        botaoAtual = this.parentElement; // Container do botão
        textoOriginal = texto;
        const apelidoAtual = obterApelido(botaoAtual);
        abrirModal(botao, apelidoAtual, texto);
    });

    const botaoContainer = document.createElement('div');
    botaoContainer.className = 'botao-container';
    botaoContainer.appendChild(botao);
    botaoContainer.appendChild(botaoEditar);

    document.getElementById('buttons-container').appendChild(botaoContainer);
}

// Helper para obter o apelido atual do botão
function obterApelido(botaoContainer) {
    const botao = botaoContainer.querySelector('.copy-button');
    return botao.innerText.replace('Copiar: ', '');
}

// Função para abrir o modal de edição
function abrirModal(botao, apelido, texto) {
    document.getElementById('edit-apelido').value = apelido;
    document.getElementById('edit-texto').value = texto;
    document.getElementById('edit-modal').style.display = 'block';

    // Salvar referência ao botão e seus dados
    botaoAtual.botao = botao;
    botaoAtual.apelido = apelido;
    botaoAtual.texto = texto;

    // Focar automaticamente no campo de apelido
    document.getElementById('edit-apelido').focus();
}

// Função para fechar o modal
function fecharModal() {
    document.getElementById('edit-modal').style.display = 'none';
}

// Função para salvar alterações do modal
function salvarAlteracoes() {
    const novoApelido = document.getElementById('edit-apelido').value.trim();
    const novoTexto = document.getElementById('edit-texto').value.trim();

    if (novoApelido === "" || novoTexto === "") {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    // Atualizar o botão
    botaoAtual.botao.innerText = `Copiar: ${novoApelido}`;
    botaoAtual.botao.setAttribute('data-texto', novoTexto);
    botaoAtual.texto = novoTexto;

    // Atualizar evento de clique para copiar o novo texto
    botaoAtual.botao.onclick = function () {
        copiarTexto(novoTexto);
    };

    // Atualizar o template se estiver salvo
    atualizarTemplate(botaoAtual.botao.getAttribute('data-texto'), { texto: novoTexto, apelido: novoApelido });

    fecharModal();
}

// Função para excluir o botão
function excluirBotao() {
    if (confirm("Tem certeza de que deseja excluir este botão?")) {
        // Remover do DOM
        botaoAtual.remove();
        // Remover do template salvo, se estiver associado
        removerBotaoDoTemplate(botaoAtual.botao.getAttribute('data-texto'));
        fecharModal();
    }
}

// Função para gerar uma cor aleatória
function gerarCorAleatoria() {
    return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
}

// Função para copiar texto para a área de transferência
function copiarTexto(texto) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(texto).then(() => {
        }).catch(err => {
            console.error('Erro ao copiar texto: ', err);
            alert('Falha ao copiar o texto.');
        });
    } else {
        alert('Seu navegador não suporta a função de cópia automática.');
    }
}

// =================== Gerenciamento de Templates ===================

// Função para salvar um grupo de botões como template
function salvarTemplateGrupo() {
    const nomeTemplate = document.getElementById('nome-template').value.trim();

    if (nomeTemplate === "") {
        alert("Por favor, insira um nome para o template.");
        return;
    }

    const botoes = document.querySelectorAll('#buttons-container .botao-container');
    if (botoes.length === 0) {
        alert("Não há botões para salvar.");
        return;
    }

    const botoesData = Array.from(botoes).map(botao => {
        const copyButton = botao.querySelector('.copy-button');
        const apelido = copyButton.innerText.replace('Copiar: ', '');
        const texto = copyButton.getAttribute('data-texto');
        return { apelido, texto };
    });

    let templatesGrupos = JSON.parse(localStorage.getItem('templatesGrupos')) || [];

    // Verificar duplicidade de nomes de template
    const existe = templatesGrupos.some(template => template.nome.toLowerCase() === nomeTemplate.toLowerCase());
    if (existe) {
        alert("Já existe um template com esse nome. Escolha outro nome.");
        return;
    }

    const templateGrupo = { nome: nomeTemplate, botoes: botoesData };
    templatesGrupos.push(templateGrupo);
    localStorage.setItem('templatesGrupos', JSON.stringify(templatesGrupos));

    exibirTemplateGrupo(templateGrupo);
    document.getElementById('nome-template').value = "";
}

// Função para carregar templates salvos ao abrir a página
function carregarTemplatesGrupos() {
    const templatesGrupos = JSON.parse(localStorage.getItem('templatesGrupos')) || [];
    templatesGrupos.forEach(exibirTemplateGrupo);
}

// Função para exibir um template de grupo de botões na página
function exibirTemplateGrupo(templateGrupo) {
    const lista = document.getElementById('lista-templates-grupo');

    const divTemplateGrupo = document.createElement('div');
    divTemplateGrupo.className = 'template-grupo';
    divTemplateGrupo.setAttribute('data-nome', templateGrupo.nome);

    const titulo = document.createElement('h3');
    titulo.innerText = templateGrupo.nome;

    const botaoCarregar = document.createElement('button');
    botaoCarregar.innerText = 'Carregar Template';
    botaoCarregar.className = 'botao-carregar';
    botaoCarregar.addEventListener('click', function () {
        carregarTemplateEspecifico(templateGrupo);
    });

    const botaoExcluir = document.createElement('button');
    botaoExcluir.innerText = 'Excluir Template';
    botaoExcluir.className = 'botao-excluir';
    botaoExcluir.addEventListener('click', function () {
        excluirTemplateGrupo(templateGrupo.nome, divTemplateGrupo);
    });

    divTemplateGrupo.appendChild(titulo);
    divTemplateGrupo.appendChild(botaoCarregar);
    divTemplateGrupo.appendChild(botaoExcluir);
    lista.appendChild(divTemplateGrupo);
}

// Função para carregar os botões de um template salvo
function carregarTemplateEspecifico(templateGrupo) {
    const substituir = confirm("Deseja substituir os botões atuais pelos do template? Clique em 'OK' para substituir ou 'Cancelar' para mesclar.");

    if (substituir) {
        document.getElementById('buttons-container').innerHTML = '';
    }

    templateGrupo.botoes.forEach(botaoData => {
        criarBotao(botaoData.texto, botaoData.apelido, gerarCorAleatoria());
    });
}

// Função para excluir um template de grupo de botões
function excluirTemplateGrupo(nome, elementoHTML) {
    if (!confirm(`Tem certeza de que deseja excluir o template "${nome}"?`)) {
        return;
    }

    let templatesGrupos = JSON.parse(localStorage.getItem('templatesGrupos')) || [];
    templatesGrupos = templatesGrupos.filter(template => template.nome !== nome);
    localStorage.setItem('templatesGrupos', JSON.stringify(templatesGrupos));

    elementoHTML.remove();
}

// =================== Atualização e Remoção de Botões nos Templates ===================

// Função para atualizar um botão em todos os templates que o utilizam
function atualizarTemplate(textoOriginal, botaoAtualizado) {
    let templatesGrupos = JSON.parse(localStorage.getItem('templatesGrupos')) || [];
    templatesGrupos.forEach(template => {
        template.botoes.forEach(botao => {
            if (botao.texto === textoOriginal) {
                botao.texto = botaoAtualizado.texto;
                botao.apelido = botaoAtualizado.apelido;
            }
        });
    });
    localStorage.setItem('templatesGrupos', JSON.stringify(templatesGrupos));
}

// Função para remover um botão de todos os templates que o utilizam
function removerBotaoDoTemplate(texto) {
    let templatesGrupos = JSON.parse(localStorage.getItem('templatesGrupos')) || [];
    templatesGrupos.forEach(template => {
        template.botoes = template.botoes.filter(botao => botao.texto !== texto);
    });
    localStorage.setItem('templatesGrupos', JSON.stringify(templatesGrupos));
}

// =================== Funções para Anotações ===================

// Função para salvar uma nova anotação
function salvarNota() {
    const titulo = document.getElementById('titulo-nota').value.trim();
    const conteudo = document.getElementById('conteudo-nota').value.trim();

    if (titulo === "" || conteudo === "") {
        alert("Por favor, preencha o título e o conteúdo da anotação.");
        return;
    }

    const anotacao = { id: Date.now(), titulo, conteudo };
    exibirAnotacao(anotacao);

    // Salvar no localStorage
    let anotacoes = JSON.parse(localStorage.getItem('anotacoes')) || [];
    anotacoes.push(anotacao);
    localStorage.setItem('anotacoes', JSON.stringify(anotacoes));

    // Limpar os campos
    document.getElementById('titulo-nota').value = "";
    document.getElementById('conteudo-nota').value = "";
}

// Função para carregar e exibir as anotações salvas
function carregarAnotacoes() {
    const anotacoes = JSON.parse(localStorage.getItem('anotacoes')) || [];
    anotacoes.forEach(exibirAnotacao);
}

// Função para exibir uma anotação na página
function exibirAnotacao(anotacao) {
    const lista = document.getElementById('lista-anotacoes');

    const divAnotacao = document.createElement('div');
    divAnotacao.className = 'anotacao';
    divAnotacao.setAttribute('data-id', anotacao.id);

    const titulo = document.createElement('h3');
    titulo.innerText = anotacao.titulo;

    const conteudo = document.createElement('p');
    conteudo.innerText = anotacao.conteudo;

    const botaoBaixar = document.createElement('button');
    botaoBaixar.innerText = 'Baixar Anotação';
    botaoBaixar.className = 'botao-baixar';

    botaoBaixar.addEventListener('click', function () {
        baixarAnotacao(anotacao);
    });

    const botaoExcluir = document.createElement('button');
    botaoExcluir.innerText = 'Excluir Anotação';
    botaoExcluir.className = 'botao-excluir';

    botaoExcluir.addEventListener('click', function () {
        excluirAnotacao(anotacao.id, divAnotacao);
    });

    divAnotacao.appendChild(titulo);
    divAnotacao.appendChild(conteudo);
    divAnotacao.appendChild(botaoBaixar);
    divAnotacao.appendChild(botaoExcluir);

    lista.appendChild(divAnotacao);
}

// Função para baixar uma anotação como TXT
function baixarAnotacao(anotacao) {
    const texto = `Título: ${anotacao.titulo}\n\n${anotacao.conteudo}`;
    const blob = new Blob([texto], { type: "text/plain;charset=utf-8" });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `${anotacao.titulo}.txt`;
    link.click();
}

// Função para excluir uma anotação
function excluirAnotacao(id, elementoHTML) {
    if (!confirm("Tem certeza de que deseja excluir esta anotação?")) {
        return;
    }

    // Remover do DOM
    elementoHTML.remove();

    // Remover do localStorage
    let anotacoes = JSON.parse(localStorage.getItem('anotacoes')) || [];
    anotacoes = anotacoes.filter(a => a.id !== id);
    localStorage.setItem('anotacoes', JSON.stringify(anotacoes));
}

// =================== Função para Calcular ===================

// Função para calcular o resultado na calculadora
function calcular() {
    const num1 = parseFloat(document.getElementById('num1').value);
    const num2 = parseFloat(document.getElementById('num2').value);
    const operacao = document.getElementById('operacao').value;
    let resultado;

    if (isNaN(num1) || isNaN(num2)) {
        alert("Por favor, insira números válidos.");
        return;
    }

    switch (operacao) {
        case '+':
            resultado = num1 + num2;
            break;
        case '-':
            resultado = num1 - num2;
            break;
        case '*':
            resultado = num1 * num2;
            break;
        case '/':
            if (num2 === 0) {
                alert("Divisão por zero não é permitida.");
                return;
            }
            resultado = num1 / num2;
            break;
        default:
            alert("Operação inválida.");
            return;
    }

    document.getElementById('resultado').innerText = resultado;
}
function copiarTextoAlerta() {
    const texto = document.getElementById('textoGerado').innerText;
    if (texto === "") {
        alert("Não há texto para copiar.");
        return;
    }
    copiarTexto(texto); // Utilize a função existente para copiar
}

function gerarTexto() {
    const alerta = document.getElementById('alerta').value.trim();
    const ic = document.getElementById('ic').value.trim();
    const progresso = document.getElementById('progresso').value.trim();

    if (alerta === "" || ic === "" || progresso === "") {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    const texto = `Alerta: ${alerta}\nIC Afetada: ${ic}\nProgresso: ${progresso}`;
    document.getElementById('textoGerado').innerText = texto;
}


// =================== Carregar Anotações ao Carregar a Página ===================
// (Já está sendo chamado dentro do DOMContentLoaded)
