// Copie a interface FormData de app/page.tsx para este arquivo
// Isso garante que a função generatePolicy saiba exatamente quais dados esperar.
export interface FormData {
    nomeDoProjeto: string;
    linguagem: string; 
    coletaDadosPessoais: boolean; 
    coletaDadosSensivel: boolean; 
    monetizacaoPorTerceiros: boolean; 
    publicoAlvoCriancas: boolean; 
    licencaCodigo: 'mit' | 'gpl3' | 'proprietaria' | ''; 
    modeloSoftware: 'saas' | 'open_source' | '';
    tipoMonetizacao: 'gratuito' | 'freemium' | 'pago' | ''; 
}

/**
 * Função principal para gerar o texto da Política de Privacidade/Termos de Uso
 * com base nas respostas do usuário.
 * @param data O objeto FormData preenchido pelo usuário.
 * @returns Uma string contendo o documento formatado.
 */
export function generatePolicy(data: FormData): string {
    const policyParts: string[] = [];

    // --- SEÇÃO 1: INTRODUÇÃO E ESCOPO ---
    policyParts.push(`## 📜 Política de Uso e Privacidade para ${data.nomeDoProjeto}`);
    policyParts.push(`\n**Data de Vigência:** ${new Date().toLocaleDateString('pt-BR')}`);
    policyParts.push(`\nEsta política detalha as regras para o uso do software **${data.nomeDoProjeto}**, desenvolvido usando **${data.linguagem || 'tecnologia não especificada'}**.`);
    
    // --- SEÇÃO 2: DADOS PESSOAIS (Baseado na Etapa 2) ---
    policyParts.push(`\n## 🔒 Tratamento de Dados Pessoais`);
    
    if (data.coletaDadosPessoais) {
        policyParts.push(`\nO **${data.nomeDoProjeto}** **COLETA** dados pessoais (como nome, e-mail, IP e/ou dados de navegação) necessários para a prestação dos serviços, em conformidade com a LGPD.`);
        
        if (data.coletaDadosSensivel) {
            policyParts.push(`\n⚠️ **ALERTA:** Também podem ser coletados **Dados Pessoais Sensíveis**. O tratamento destes dados possui um regime legal mais rigoroso e exigirá consentimento explícito.`);
        } else {
            policyParts.push(`\nNão são coletados dados pessoais classificados como sensíveis.`);
        }
    } else {
        policyParts.push(`\nO **${data.nomeDoProjeto}** **NÃO** coleta, armazena ou trata dados de identificação pessoal de forma rotineira, mantendo o máximo de anonimato.`);
    }

    // --- SEÇÃO 3: TERCEIROS E MONETIZAÇÃO (Baseado na Etapa 2 e 3) ---
    policyParts.push(`\n## 🤝 Relação com Terceiros e Monetização`);
    
    if (data.monetizacaoPorTerceiros) {
        policyParts.push(`\nO Projeto utiliza serviços de terceiros (como ferramentas de análise ou publicidade) que podem coletar dados de navegação (cookies) para melhoria do serviço ou monetização.`);
    } else {
        policyParts.push(`\nNenhum dado de usuário é compartilhado com terceiros para fins de publicidade ou análise.`);
    }

    if (data.tipoMonetizacao === 'pago' || data.tipoMonetizacao === 'freemium') {
        policyParts.push(`\nO uso do serviço envolve a modalidade de **${data.tipoMonetizacao.toUpperCase()}**, e os Termos de Serviço detalham as obrigações financeiras.`);
    }

    // --- SEÇÃO 4: LICENÇA E MODELO DE SOFTWARE (Baseado na Etapa 3) ---
    policyParts.push(`\n## 💻 Licença de Uso do Software`);

    if (data.licencaCodigo === 'proprietaria') {
        policyParts.push(`\nO código-fonte do software é **PROPRIETÁRIO** e o uso é concedido por licença não exclusiva. A cópia, modificação ou redistribuição é estritamente proibida.`);
    } else if (data.licencaCodigo === 'mit') {
        policyParts.push(`\nO código é regido pela **Licença MIT** (Open Source), permitindo uso, modificação e distribuição, desde que mantida a notificação de copyright.`);
    } else if (data.licencaCodigo === 'gpl3') {
        policyParts.push(`\nO código é regido pela **Licença GPL v3**, o que exige que qualquer modificação ou software derivado também seja distribuído sob esta licença (copyleft forte).`);
    }

    if (data.modeloSoftware === 'saas') {
        policyParts.push(`\nO software é distribuído como **Serviço (SaaS)**, e o usuário não recebe uma cópia instalável.`);
    }


    // --- SEÇÃO FINAL ---
    policyParts.push(`\n---\n\nEste é um documento preliminar gerado automaticamente. Consulte um advogado para validação legal completa.`);

    return policyParts.join('\n');
}