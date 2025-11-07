// ====================================================================
// generatePolicy.ts - DEFINIÇÕES E LÓGICA MOCK DE GERAÇÃO (FINAL)
// ====================================================================

// --- TIPOS DE DADOS ---
export interface FormData {
    nomeDoProjeto: string;
    nomeDoResponsavel: string;
    jurisdicao: 'Brasil' | 'UE' | 'EUA' | 'Japao' | 'Canada'; 
    linguagem: string;
    idiomaDoDocumento: string;
    licencaCodigo: string;
    modeloSoftware: string;
    tipoMonetizacao: string;
    objetivoDaColeta: string;
    coletaDadosPessoais: boolean;
    coletaDadosSensivel: boolean;
    monetizacaoPorTerceiros: boolean;
    publicoAlvoCriancas: boolean;
    incluirNaoGarantia: boolean;
    // NOVOS CAMPOS UNIVERSAIS DE CONFORMIDADE
    contatoDPO: string; 
    paisesTransferencia: string; 
}

// --- FUNÇÃO AUXILIAR PARA DATA ATUAL ---
export const getFormattedDate = (): string => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long', year: 'numeric' };
    
    // Retorna a data no formato "06 de Novembro de 2025" (depende do locale 'pt-BR')
    return today.toLocaleDateString('pt-BR', options);
};

// --- OPÇÕES PARA DROPDOWNS ---
export const languageOptions = [
    { value: 'Typescript', label: 'Typescript/Javascript' },
    { value: 'Python', label: 'Python' },
    { value: 'Go', label: 'Go/Golang' },
    { value: 'Outra', label: 'Outra' },
];

export const idiomOptions = [
    { value: 'pt-br', label: 'Português (Brasil)' },
    { value: 'en-us', label: 'Inglês (EUA)' },
    { value: 'es-es', label: 'Espanhol' },
];

export const jurisdictionOptions = [
    { value: 'Brasil', label: 'Brasil (LGPD)' },
    { value: 'UE', label: 'União Europeia (GDPR)' },
    { value: 'EUA', label: 'Estados Unidos (CCPA/Regulamentos Estaduais)' },
    { value: 'Japao', label: 'Japão (APPI)' },
    { value: 'Canada', label: 'Canadá (PIPEDA)' },
];

// Funções auxiliares 
export const getJurisdicaoLabel = (value: string) => {
    return jurisdictionOptions.find(opt => opt.value === value)?.label || value;
}

export const getIdiomaLabel = (value: string) => {
    return idiomOptions.find(opt => opt.value === value)?.label || value;
}


// --- LÓGICA MOCK DE GERAÇÃO ---
export const generatePolicy = (data: FormData): Promise<string> => {
    const { 
        nomeDoProjeto, 
        nomeDoResponsavel, 
        jurisdicao, 
        idiomaDoDocumento, 
        coletaDadosPessoais, 
        coletaDadosSensivel,
        objetivoDaColeta,
        incluirNaoGarantia,
        contatoDPO, 
        paisesTransferencia 
    } = data;

    const jurisdicaoLabel = getJurisdicaoLabel(jurisdicao);
    const responsavel = nomeDoResponsavel.trim() || '[Nome do Responsável]';
    const dataVigenciaAtual = getFormattedDate();

    // Texto de finalidade da coleta
    const objetivoText = coletaDadosPessoais && objetivoDaColeta.trim()
        ? ` estritamente para os seguintes fins: **${objetivoDaColeta.trim()}**.`
        : coletaDadosPessoais 
        ? ` com a finalidade genérica de prover o serviço e cumprir obrigações legais.`
        : '';

    const coletaDadosText = coletaDadosPessoais 
        ? `coleta e processa dados pessoais de seus usuários` + objetivoText
        : `NÃO coleta dados pessoais diretamente`;
        
    const dadosSensivelText = coletaDadosSensivel
        ? `, incluindo *dados sensíveis* (biometria/saúde).` 
        : ` e não lida com dados sensíveis.`;
        
    const garantiaText = incluirNaoGarantia
        ? `\n\n## 6. CLÁUSULA DE NÃO GARANTIA (AS IS)\nO Serviço é fornecido "no estado em que se encontra" (AS IS). O Projeto (${nomeDoProjeto}) não oferece garantias de desempenho, adequação ou ausência de erros.`
        : '';
        
    const dpoText = contatoDPO.trim() 
        ? `\n\n**Contato do Responsável pela Proteção de Dados (DPO/Encarregado):** ${contatoDPO.trim()}`
        : '';
        
    const paisesTransfText = paisesTransferencia.trim()
        ? paisesTransferencia.trim()
        : '[Países de Destino (Não Informado no Formulário)]';
    
    // Simulação do resultado do Gemini
    const mockPolicy = `# Termos de Uso e Política de Privacidade de ${nomeDoProjeto}

> **Documento Gerado para Jurisdição Principal:** ${jurisdicaoLabel} (${getIdiomaLabel(idiomaDoDocumento).toUpperCase()})
> **Base Legal Principal:** Simulação de cláusulas baseadas em ${jurisdicao} (${jurisdicao === 'UE' ? 'GDPR' : jurisdicao === 'Brasil' ? 'LGPD' : jurisdicao})

## 1. INTRODUÇÃO
O **${nomeDoProjeto}** é um software no modelo SAAS (Software as a Service) operado por **${responsavel}**. Estes Termos e a Política de Privacidade descrevem como o serviço é oferecido e utilizado.

## 2. ACEITAÇÃO
Ao acessar ou usar o Serviço, você concorda em cumprir estes Termos, que são regidos pela legislação de **${jurisdicaoLabel}**.

## 3. USO DO SERVIÇO
...

## 4. PROTEÇÃO DE DADOS PESSOAIS
O ${nomeDoProjeto} ${coletaDadosText}${dadosSensivelText}

${coletaDadosPessoais ? 'As disposições sobre direitos do titular (acesso, correção, exclusão) seguem estritamente as regras da lei de ' + jurisdicaoLabel + '.' : ''}
${dpoText}

## 5. TRANSFERÊNCIA INTERNACIONAL DE DADOS
Dados podem ser transferidos para **${paisesTransfText}**, garantindo o nível de proteção compatível exigido pela jurisdição **${jurisdicaoLabel}**.

${garantiaText}

## 7. DISPOSIÇÕES FINAIS
...

**Data de Vigência:** ${dataVigenciaAtual}.
`;

    return new Promise((resolve) => {
        setTimeout(() => resolve(mockPolicy), 1500); 
    });
};