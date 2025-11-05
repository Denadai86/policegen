// Define a interface para garantir que a função generatePolicy receba os dados corretos.
export interface FormData {
    nomeDoProjeto: string;
    nomeDoResponsavel: string;
    linguagem: string; 
    coletaDadosPessoais: boolean; 
    coletaDadosSensivel: boolean; 
    monetizacaoPorTerceiros: boolean; 
    publicoAlvoCriancas: boolean; 
    licencaCodigo: 'mit' | 'gpl3' | 'proprietaria' | ''; 
    modeloSoftware: 'saas' | 'open_source' | '';
    tipoMonetizacao: 'gratuito' | 'freemium' | 'pago' | ''; 
    jurisdicao: 'brasil' | 'eua' | 'europa' | 'global' | ''; 
}

/**
 * Função principal para gerar o texto da Política de Uso e Privacidade
 */
export function generatePolicy(data: FormData): string {
    const policyParts: string[] = [];

    // --- SEÇÃO 1: INTRODUÇÃO E ESCOPO ---
    policyParts.push(`# 📜 Política de Uso e Privacidade para ${data.nomeDoProjeto}`);
    policyParts.push(`\n**Responsável Legal (Controlador):** ${data.nomeDoResponsavel}`);
    policyParts.push(`\n**Data de Vigência:** ${new Date().toLocaleDateString('pt-BR')}`);
    policyParts.push(`\nEsta política detalha as regras para o uso do software **${data.nomeDoProjeto}**, desenvolvido usando **${data.linguagem || 'tecnologia não especificada'}**. Este é um documento preliminar gerado automaticamente.`);
    
    // --- SEÇÃO 2: DADOS PESSOAIS ---
    policyParts.push(`\n## 🔒 Tratamento de Dados Pessoais`);
    
    if (data.coletaDadosPessoais) {
        policyParts.push(`\nO **${data.nomeDoProjeto}** **COLETA** dados pessoais (como nome, e-mail, IP e/ou dados de navegação) necessários para a prestação dos serviços, em conformidade com as leis de proteção de dados.`);
        
        if (data.coletaDadosSensivel) {
            policyParts.push(`\n⚠️ **ALERTA:** Também podem ser coletados **Dados Pessoais Sensíveis**. O tratamento destes dados possui um regime legal mais rigoroso e exigirá consentimento explícito.`);
        } else {
            policyParts.push(`\nNão são coletados dados pessoais classificados como sensíveis.`);
        }
    } else {
        policyParts.push(`\nO **${data.nomeDoProjeto}** **NÃO** coleta, armazena ou trata dados de identificação pessoal de forma rotineira, mantendo o máximo de anonimato.`);
    }

    if (data.publicoAlvoCriancas) {
        policyParts.push(`\n**Público Alvo:** Este serviço é destinado a **crianças e adolescentes**. As cláusulas de proteção e consentimento parental são aplicadas rigorosamente.`);
    }
    

    // --- SEÇÃO 3: TERCEIROS E MONETIZAÇÃO ---
    policyParts.push(`\n## 🤝 Relação com Terceiros e Monetização`);
    
    if (data.monetizacaoPorTerceiros) {
        policyParts.push(`\nO Projeto utiliza serviços de terceiros (como ferramentas de análise ou publicidade - Google Ads, Analytics) que podem coletar dados de navegação (cookies) para melhoria do serviço ou monetização.`);
    } else {
        policyParts.push(`\nNenhum dado de usuário é compartilhado com terceiros para fins de publicidade ou análise.`);
    }

    if (data.tipoMonetizacao === 'pago' || data.tipoMonetizacao === 'freemium') {
        policyParts.push(`\n**Monetização:** O uso do serviço é **${data.tipoMonetizacao.toUpperCase()}**. Os Termos de Serviço detalham as obrigações e políticas de reembolso.`);
    } else {
         policyParts.push(`\n**Monetização:** O serviço é oferecido **GRATUITAMENTE**, podendo ter um custo de operação repassado em futuras versões.`);
    }


    // --- SEÇÃO 4: LICENÇA E MODELO DE SOFTWARE ---
    policyParts.push(`\n## 💻 Termos de Uso e Licença`);

    if (data.licencaCodigo === 'proprietaria') {
        policyParts.push(`\nO código-fonte do software é **PROPRIETÁRIO** e o uso é concedido por licença não exclusiva. A cópia, modificação ou redistribuição é estritamente proibida e passível de ação legal.`);
    } else if (data.licencaCodigo === 'mit') {
        policyParts.push(`\nO código é regido pela **Licença MIT** (Open Source Permissiva). O usuário pode usar, modificar e distribuir o código, desde que mantenha a notificação de copyright.`);
    } else if (data.licencaCodigo === 'gpl3') {
        policyParts.push(`\nO código é regido pela **Licença GPL v3** (Open Source Copyleft). Qualquer modificação ou software derivado também deve ser distribuído sob esta licença.`);
    }

    if (data.modeloSoftware === 'saas') {
        policyParts.push(`\nO software é distribuído como **Serviço (SaaS)**. O usuário acessa o software online, mas não recebe uma cópia instalável do código.`);
    }

    // --- SEÇÃO 5: LEI APLICÁVEL E JURISDIÇÃO ---
    policyParts.push(`\n## ⚖️ Lei Aplicável e Jurisdição`);

    if (data.jurisdicao === 'brasil') {
        policyParts.push(`\nEsta política é regida pelas leis da República Federativa do Brasil, em especial a **Lei Geral de Proteção de Dados (LGPD)**. O foro eleito para solução de controvérsias será o da Comarca da Capital do estado [AQUI VOCÊ DEVE INSERIR O ESTADO], com renúncia a qualquer outro.`);
    } else if (data.jurisdicao === 'europa') {
        policyParts.push(`\nEsta política é regida pelas leis da União Europeia, em especial o **Regulamento Geral sobre a Proteção de Dados (GDPR)**.`);
    } else if (data.jurisdicao === 'eua') {
        policyParts.push(`\nEsta política é regida pelas leis do Estado da Califórnia (**CCPA/CPRA**) e leis federais dos Estados Unidos da América.`);
    } else {
        policyParts.push(`\nEsta política adota um modelo de conformidade global, aplicando as melhores práticas internacionais (GDPR, LGPD, CCPA/CPRA) para a proteção dos dados e direitos dos usuários.`);
    }


    // --- SEÇÃO FINAL ---
    policyParts.push(`\n---\n\n**AVISO LEGAL:** Este documento foi gerado por um algoritmo. Consulte sempre um profissional jurídico qualificado para garantir a conformidade integral com as leis locais e internacionais.`);

    return policyParts.join('\n');
}