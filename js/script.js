/* script.js */

// =================== Inicialização e Configuração ===================

document.addEventListener('DOMContentLoaded', function () {
    inicializarMenu();
    inicializarBotaoPrincipais();
    inicializarModal();
    carregarTemplatesGrupos();
    carregarAnotacoes();
    inicializarChatbot(); 
});

// Variáveis globais para o modal
let botaoAtual; // Referência ao container do botão que está sendo editado
let textoOriginal; // Texto original do botão

// =================== Gerenciamento do Menu de Navegação ===================

function inicializarMenu() {
    const menuLinks = document.querySelectorAll('#menu a');
    menuLinks.forEach(function (link) {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            mostrarSecao(this.getAttribute('data-section'));
            atualizarMenuAtivo(menuLinks, this);
        });
    });

    // Mostrar a seção 'home' ao carregar a página
    mostrarSecao('home');
}

function mostrarSecao(id) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(function (section) {
        section.style.display = (section.id === id) ? 'block' : 'none';
    });
}

function atualizarMenuAtivo(menuLinks, linkAtivo) {
    menuLinks.forEach(function (link) {
        link.classList.remove('active');
    });
    linkAtivo.classList.add('active');
}

// =================== Inicialização dos Botões Principais ===================

function inicializarBotaoPrincipais() {
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
}

// =================== Gerenciamento do Modal ===================

function inicializarModal() {
    // Fechar o modal ao clicar fora do conteúdo
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('edit-modal');
        if (event.target === modal) {
            fecharModal();
        }
    });
}

function abrirModal(botao, apelido, texto) {
    document.getElementById('edit-apelido').value = apelido;
    document.getElementById('edit-texto').value = texto;
    document.getElementById('edit-modal').style.display = 'block';

    // Salvar referência ao botão e seus dados
    botaoAtual = botao.parentElement; // Container do botão
    textoOriginal = texto;

    // Focar automaticamente no campo de apelido
    document.getElementById('edit-apelido').focus();
}

function fecharModal() {
    document.getElementById('edit-modal').style.display = 'none';
}

function salvarAlteracoes() {
    const novoApelido = document.getElementById('edit-apelido').value.trim();
    const novoTexto = document.getElementById('edit-texto').value.trim();

    if (novoApelido === "" || novoTexto === "") {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    // Atualizar o botão
    const botaoCopy = botaoAtual.querySelector('.copy-button');
    botaoCopy.innerText = `Copiar: ${novoApelido}`;
    botaoCopy.setAttribute('data-texto', novoTexto);

    // Atualizar evento de clique para copiar o novo texto
    botaoCopy.onclick = function () {
        copiarTexto(novoTexto);
    };

    // Atualizar o template se estiver salvo
    atualizarTemplate(textoOriginal, { texto: novoTexto, apelido: novoApelido });

    fecharModal();
}

function excluirBotao() {
    if (confirm("Tem certeza de que deseja excluir este botão?")) {
        // Remover do DOM
        botaoAtual.remove();

        // Remover do template salvo, se estiver associado
        const texto = botaoAtual.querySelector('.copy-button').getAttribute('data-texto');
        removerBotaoDoTemplate(texto);

        fecharModal();
    }
}

// =================== Gerenciamento de Botões de Copiar ===================

function adicionarBotao() {
    const texto = document.getElementById('input-text').value.trim();

    if (texto === "") {
        alert("Por favor, insira um texto.");
        return;
    }

    criarBotao(texto, texto, gerarCorAleatoria());

    document.getElementById('input-text').value = "";
}

function criarBotao(texto, apelido, cor) {
    const botaoCopy = document.createElement('button');
    botaoCopy.innerText = `Copiar: ${apelido}`;
    botaoCopy.className = 'copy-button';
    botaoCopy.style.backgroundColor = cor;
    botaoCopy.setAttribute('data-texto', texto);

    botaoCopy.addEventListener('click', function () {
        copiarTexto(texto);
    });

    const botaoEditar = document.createElement('button');
    botaoEditar.innerText = 'Editar';
    botaoEditar.className = 'edit-button';

    botaoEditar.addEventListener('click', function () {
        abrirModal(this, obterApelido(this.parentElement), texto);
    });

    const botaoContainer = document.createElement('div');
    botaoContainer.className = 'botao-container';
    botaoContainer.appendChild(botaoCopy);
    botaoContainer.appendChild(botaoEditar);

    document.getElementById('buttons-container').appendChild(botaoContainer);
}

function obterApelido(botaoContainer) {
    const botao = botaoContainer.querySelector('.copy-button');
    return botao.innerText.replace('Copiar: ', '');
}

function gerarCorAleatoria() {
    return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
}

function copiarTexto(texto) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(texto).then(() => {
            alert("Texto copiado com sucesso!");
        }).catch(err => {
            console.error('Erro ao copiar texto: ', err);
            alert('Falha ao copiar o texto.');
        });
    } else {
        alert('Seu navegador não suporta a função de cópia automática.');
    }
}

// =================== Gerenciamento de Templates ===================

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

function carregarTemplatesGrupos() {
    const templatesGrupos = JSON.parse(localStorage.getItem('templatesGrupos')) || [];
    templatesGrupos.forEach(exibirTemplateGrupo);
}

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

function carregarTemplateEspecifico(templateGrupo) {
    const substituir = confirm("Deseja substituir os botões atuais pelos do template? Clique em 'OK' para substituir ou 'Cancelar' para mesclar.");

    if (substituir) {
        document.getElementById('buttons-container').innerHTML = '';
    }

    templateGrupo.botoes.forEach(botaoData => {
        criarBotao(botaoData.texto, botaoData.apelido, gerarCorAleatoria());
    });
}

function excluirTemplateGrupo(nome, elementoHTML) {
    if (!confirm(`Tem certeza de que deseja excluir o template "${nome}"?`)) {
        return;
    }

    let templatesGrupos = JSON.parse(localStorage.getItem('templatesGrupos')) || [];
    templatesGrupos = templatesGrupos.filter(template => template.nome !== nome);
    localStorage.setItem('templatesGrupos', JSON.stringify(templatesGrupos));

    elementoHTML.remove();
}

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

function removerBotaoDoTemplate(texto) {
    let templatesGrupos = JSON.parse(localStorage.getItem('templatesGrupos')) || [];
    templatesGrupos.forEach(template => {
        template.botoes = template.botoes.filter(botao => botao.texto !== texto);
    });
    localStorage.setItem('templatesGrupos', JSON.stringify(templatesGrupos));
}

// =================== Gerenciamento de Anotações ===================

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

function carregarAnotacoes() {
    const anotacoes = JSON.parse(localStorage.getItem('anotacoes')) || [];
    anotacoes.forEach(exibirAnotacao);
}

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

function baixarAnotacao(anotacao) {
    const texto = `Título: ${anotacao.titulo}\n\n${anotacao.conteudo}`;
    const blob = new Blob([texto], { type: "text/plain;charset=utf-8" });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `${anotacao.titulo}.txt`;
    link.click();
}

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

// =================== Funções para Gerador de Alerta ===================

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

function copiarTextoAlerta() {
    const texto = document.getElementById('textoGerado').innerText;
    if (texto === "") {
        alert("Não há texto para copiar.");
        return;
    }
    copiarTexto(texto);
}

// =================== Função para Calculadora ===================

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
    function inicializarChatbot() {
        const sendButton = document.getElementById('send-message');
        const userInput = document.getElementById('user-input');
        const chatMessages = document.getElementById('chat-messages');
    
        sendButton.addEventListener('click', function () {
            enviarMensagem();
        });
    
        userInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                enviarMensagem();
            }
        });
    
        function enviarMensagem() {
            const mensagem = userInput.value.trim();
            if (mensagem === "") return;
    
            exibirMensagem(mensagem, 'user');
            userInput.value = "";
            // Enviar para o servidor (back-end)
            fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: mensagem })
            })
            .then(response => response.json())
            .then(data => {
                exibirMensagem(data.reply, 'bot');
            })
            .catch(error => {
                console.error('Erro:', error);
                exibirMensagem('Desculpe, ocorreu um erro ao processar sua solicitação.', 'bot');
            });
        }
    
        function exibirMensagem(texto, tipo) {
            const mensagemDiv = document.createElement('div');
            mensagemDiv.classList.add('message', tipo);
    
            const textoSpan = document.createElement('span');
            textoSpan.classList.add('text');
            textoSpan.innerText = texto;
    
            mensagemDiv.appendChild(textoSpan);
            chatMessages.appendChild(mensagemDiv);
    
            // Scroll para a última mensagem
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    document.getElementById('resultado').innerText = resultado;
}
