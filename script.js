const form = document.getElementById("formFrete");
const resultado = document.getElementById("resultado");
const mensagem = document.getElementById("mensagem");
const btnLimpar = document.getElementById("btnLimpar");

const moeda = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
});

const numero = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

function lerNumero(id) {
    return Number(document.getElementById(id).value);
}

function obterDados() {
    return {
        cliente: document.getElementById("cliente").value.trim(),
        origem: document.getElementById("origem").value.trim(),
        destino: document.getElementById("destino").value.trim(),
        distancia: lerNumero("distancia"),
        mercadoria: document.getElementById("mercadoria").value.trim(),
        notaFiscal: lerNumero("notaFiscal"),

        volumes: lerNumero("volumes"),
        pesoReal: lerNumero("pesoReal"),
        comprimento: lerNumero("comprimento"),
        largura: lerNumero("largura"),
        altura: lerNumero("altura"),
        fatorCubagem: lerNumero("fatorCubagem"),

        tarifaKg: lerNumero("tarifaKg"),
        freteMinimo: lerNumero("freteMinimo"),
        adValorem: lerNumero("adValorem"),
        gris: lerNumero("gris"),
        pedagio: lerNumero("pedagio"),
        outrasTaxas: lerNumero("outrasTaxas")
    };
}

function validarDados(dados) {
    const erros = [];

    if (!dados.cliente) erros.push("Informe o cliente ou a razão social.");
    if (!dados.origem) erros.push("Informe a cidade de origem.");
    if (!dados.destino) erros.push("Informe a cidade de destino.");
    if (!dados.mercadoria) erros.push("Informe a descrição da mercadoria.");

    if (!Number.isFinite(dados.distancia) || dados.distancia <= 0) {
        erros.push("A distância deve ser um número maior que zero.");
    }

    if (!Number.isFinite(dados.notaFiscal) || dados.notaFiscal <= 0) {
        erros.push("O valor da nota fiscal deve ser maior que zero.");
    }

    if (!Number.isInteger(dados.volumes) || dados.volumes <= 0) {
        erros.push("A quantidade de volumes deve ser um número inteiro maior que zero.");
    }

    if (!Number.isFinite(dados.pesoReal) || dados.pesoReal <= 0) {
        erros.push("O peso real deve ser maior que zero.");
    }

    const dimensoes = [
        ["comprimento", dados.comprimento],
        ["largura", dados.largura],
        ["altura", dados.altura],
        ["fator de cubagem", dados.fatorCubagem]
    ];

    dimensoes.forEach(([nome, valor]) => {
        if (!Number.isFinite(valor) || valor <= 0) {
            erros.push(`O ${nome} deve ser um número maior que zero.`);
        }
    });

    if (!Number.isFinite(dados.tarifaKg) || dados.tarifaKg <= 0) {
        erros.push("A tarifa do frete-peso deve ser maior que zero.");
    }

    if (!Number.isFinite(dados.freteMinimo) || dados.freteMinimo < 0) {
        erros.push("O frete mínimo não pode ser negativo.");
    }

    if (!Number.isFinite(dados.adValorem) || dados.adValorem < 0 || dados.adValorem > 100) {
        erros.push("O Ad Valorem deve estar entre 0% e 100%.");
    }

    if (!Number.isFinite(dados.gris) || dados.gris < 0 || dados.gris > 100) {
        erros.push("O GRIS deve estar entre 0% e 100%.");
    }

    if (!Number.isFinite(dados.pedagio) || dados.pedagio < 0) {
        erros.push("O pedágio não pode ser negativo.");
    }

    if (!Number.isFinite(dados.outrasTaxas) || dados.outrasTaxas < 0) {
        erros.push("As outras taxas não podem ser negativas.");
    }

    return erros;
}

function calcularVolume(dados) {
    return dados.comprimento * dados.largura * dados.altura;
}

function calcularPesoCubadoUnitario(dados) {
    return calcularVolume(dados) * dados.fatorCubagem;
}

function calcularPesoCubadoTotal(dados) {
    return calcularPesoCubadoUnitario(dados) * dados.volumes;
}

function determinarPesoCobranca(dados, pesoCubadoTotal) {
    if (dados.pesoReal >= pesoCubadoTotal) {
        return {
            peso: dados.pesoReal,
            criterio: "Peso real",
            mensagem: "O peso real é maior ou igual ao peso cubado."
        };
    }

    return {
        peso: pesoCubadoTotal,
        criterio: "Peso cubado",
        mensagem: "O peso cubado é maior que o peso real."
    };
}

function calcularFretePeso(pesoCobranca, tarifaKg) {
    return pesoCobranca * tarifaKg;
}

function aplicarFreteMinimo(fretePeso, freteMinimo) {
    if (fretePeso < freteMinimo) {
        return {
            valor: freteMinimo,
            aplicou: true
        };
    }

    return {
        valor: fretePeso,
        aplicou: false
    };
}

function calcularTaxas(dados) {
    const valorAdValorem = dados.notaFiscal * (dados.adValorem / 100);
    const valorGris = dados.notaFiscal * (dados.gris / 100);

    return {
        adValorem: valorAdValorem,
        gris: valorGris,
        pedagio: dados.pedagio,
        outrasTaxas: dados.outrasTaxas
    };
}

function calcularTotal(freteBase, taxas) {
    return freteBase +
        taxas.adValorem +
        taxas.gris +
        taxas.pedagio +
        taxas.outrasTaxas;
}

function mostrarMensagem(erros) {
    mensagem.innerHTML = `<strong>Corrija os seguintes pontos:</strong><br>${erros.join("<br>")}`;
    mensagem.classList.add("visivel");
    mensagem.scrollIntoView({ behavior: "smooth", block: "center" });
}

function limparMensagem() {
    mensagem.innerHTML = "";
    mensagem.classList.remove("visivel");
}

function mostrarResultado(dados, calculos) {
    const freteMinimoTexto = calculos.freteBase.aplicou
        ? `Sim — frete-peso (${moeda.format(calculos.fretePeso)}) ficou abaixo do mínimo.`
        : "Não — o frete-peso já atingiu o mínimo.";

    resultado.innerHTML = `
        <h2>Memória de cálculo</h2>

        <div class="criterio">
            <strong>Cotação:</strong> ${dados.cliente}<br>
            <strong>Rota:</strong> ${dados.origem} → ${dados.destino}<br>
            <strong>Mercadoria:</strong> ${dados.mercadoria}<br>
            <strong>Distância:</strong> ${numero.format(dados.distancia)} km
        </div>

        <div class="resumo">
            <div class="indicador">
                <span>Volumes</span>
                <strong>${dados.volumes}</strong>
            </div>
            <div class="indicador">
                <span>Peso real</span>
                <strong>${numero.format(dados.pesoReal)} kg</strong>
            </div>
            <div class="indicador">
                <span>Peso cubado total</span>
                <strong>${numero.format(calculos.pesoCubadoTotal)} kg</strong>
            </div>
            <div class="indicador">
                <span>Peso de cobrança</span>
                <strong>${numero.format(calculos.pesoCobranca.peso)} kg</strong>
            </div>
        </div>

        <h3>1. Cubagem</h3>
        <table class="memoria">
            <tbody>
                <tr>
                    <td>Volume por unidade</td>
                    <td>${numero.format(calculos.volume)} m³</td>
                </tr>
                <tr>
                    <td>Peso cubado unitário</td>
                    <td>${numero.format(calculos.pesoCubadoUnitario)} kg</td>
                </tr>
                <tr>
                    <td>Peso cubado total</td>
                    <td>${numero.format(calculos.pesoCubadoTotal)} kg</td>
                </tr>
            </tbody>
        </table>

        <div class="criterio">
            <strong>Critério de cobrança:</strong> ${calculos.pesoCobranca.criterio}.<br>
            ${calculos.pesoCobranca.mensagem}
        </div>

        <h3>2. Formação do frete</h3>
        <table class="memoria">
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Valor</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Frete-peso (${numero.format(calculos.pesoCobranca.peso)} kg × ${moeda.format(dados.tarifaKg)}/kg)</td>
                    <td>${moeda.format(calculos.fretePeso)}</td>
                </tr>
                <tr>
                    <td>Frete mínimo</td>
                    <td>${moeda.format(dados.freteMinimo)}</td>
                </tr>
                <tr>
                    <td>Frete-base utilizado</td>
                    <td>${moeda.format(calculos.freteBase.valor)}</td>
                </tr>
                <tr>
                    <td>Ad Valorem (${numero.format(dados.adValorem)}%)</td>
                    <td>${moeda.format(calculos.taxas.adValorem)}</td>
                </tr>
                <tr>
                    <td>GRIS (${numero.format(dados.gris)}%)</td>
                    <td>${moeda.format(calculos.taxas.gris)}</td>
                </tr>
                <tr>
                    <td>Pedágio</td>
                    <td>${moeda.format(calculos.taxas.pedagio)}</td>
                </tr>
                <tr>
                    <td>Outras taxas</td>
                    <td>${moeda.format(calculos.taxas.outrasTaxas)}</td>
                </tr>
            </tbody>
        </table>

        <div class="criterio">
            <strong>Aplicação do frete mínimo:</strong> ${freteMinimoTexto}
        </div>

        <div class="total">
            <span>VALOR TOTAL DA COTAÇÃO</span>
            <strong>${moeda.format(calculos.total)}</strong>
        </div>
    `;

    resultado.hidden = false;
    resultado.scrollIntoView({ behavior: "smooth", block: "start" });
}

form.addEventListener("submit", function (evento) {
    evento.preventDefault();
    limparMensagem();

    const dados = obterDados();
    const erros = validarDados(dados);

    if (erros.length > 0) {
        resultado.hidden = true;
        mostrarMensagem(erros);
        return;
    }

    const volume = calcularVolume(dados);
    const pesoCubadoUnitario = calcularPesoCubadoUnitario(dados);
    const pesoCubadoTotal = calcularPesoCubadoTotal(dados);

    const pesoCobranca = determinarPesoCobranca(dados, pesoCubadoTotal);
    const fretePeso = calcularFretePeso(pesoCobranca.peso, dados.tarifaKg);
    const freteBase = aplicarFreteMinimo(fretePeso, dados.freteMinimo);
    const taxas = calcularTaxas(dados);
    const total = calcularTotal(freteBase.valor, taxas);

    mostrarResultado(dados, {
        volume,
        pesoCubadoUnitario,
        pesoCubadoTotal,
        pesoCobranca,
        fretePeso,
        freteBase,
        taxas,
        total
    });
});

btnLimpar.addEventListener("click", function () {
    form.reset();
    document.getElementById("fatorCubagem").value = 300;
    document.getElementById("adValorem").value = 0;
    document.getElementById("gris").value = 0;
    document.getElementById("pedagio").value = 0;
    document.getElementById("outrasTaxas").value = 0;

    limparMensagem();
    resultado.hidden = true;
    resultado.innerHTML = "";
    document.getElementById("cliente").focus();
});
