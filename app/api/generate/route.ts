// ====================================================================
// app/api/generate/route.ts - Endpoint API para Geração de Política (Next.js)
// ====================================================================

import { NextResponse, type NextRequest } from 'next/server';
import { GoogleGenAI } from '@google/genai';
// Importação do utils/generatePolicy (ajuste o caminho se necessário)
import { FormData, getFormattedDate } from '@/utils/generatePolicy'; 

// Adicionar esta linha para garantir que a rota use o ambiente Node.js completo
// onde a SDK do Gemini funciona sem problemas de compatibilidade.
export const runtime = 'nodejs'; 

// Definição da resposta da API
type Data = {
// ... restante do código ...

  policyContent?: string;
  error?: string;
  generatedAt: string;
};

// 1. Inicializa o cliente Gemini
// O GoogleGenAI({}) buscará automaticamente a chave GEMINI_API_KEY do environment
const ai = new GoogleGenAI({});

// ====================================================================
// DEFINIÇÃO DO PROMPT DE SISTEMA (SYSTEM_INSTRUCTION)
// Define o persona e as regras de formatação/estrutura
// ====================================================================
const SYSTEM_INSTRUCTION = `
Você é um **Especialista em Documentos Legais Bilíngues (Português e Inglês)** especializado em **Softwares, SaaS e Plataformas Digitais**, com foco em **Termos de Uso** e **Políticas de Privacidade**.

Sua função é **gerar um documento jurídico completo, preciso e profissional**, que una **em um único arquivo**:
- **Termos de Uso**
- **Política de Privacidade**

---

## ⚖️ REGRAS DE FORMATAÇÃO E ESTRUTURA

1. A saída DEVE ser **estritamente em formato Markdown válido**.
2. O documento deve conter **apenas o conteúdo legal** — **NENHUMA** explicação, comentário, preâmbulo ou rodapé adicional.
3. O título principal DEVE ser uma única tag de nível 1: \`# [Nome do Documento]\`
4. Use:
   - \`##\` para seções principais (ex.: Termos de Uso, Política de Privacidade)
   - \`###\` para subseções ou cláusulas

---

## 🌎 REGRAS BILÍNGUES (CORREÇÃO DE ESTRUTURA)

1. **ORDEM DE SAÍDA OBRIGATÓRIA:**
   a) Conteúdo integral em Português.
   b) Use a **linha divisória Markdown**: \`---\`
   c) Conteúdo integral em Inglês (DEVE começar com o título \`## English Version\`).

2. **Consistência:** Garanta consistência legal e terminológica (ex: "Controlador de Dados" ↔ "Data Controller") entre as duas versões.

---

## 🧠 CONTEÚDO ESSENCIAL MÍNIMO

Cada documento deve incluir, no mínimo, as seções definidas no prompt do usuário.

- **Juridições:** Ajuste a conformidade (LGPD, GDPR, CCPA, etc.) automaticamente conforme a Jurisdição informada.
- **Tons e Estilo:** Linguagem formal, clara e acessível, evitando jargões desnecessários.
`;

// ====================================================================
// FUNÇÃO POST PRINCIPAL
// ====================================================================
export async function POST(req: NextRequest) {
  // Captura a data atual formatada antes de qualquer processamento
  const generatedAt = getFormattedDate();

  try {
    // 2. Recebe e parseia o corpo da requisição
    const formData: FormData = await req.json();

    // 3. Validação básica
    if (!formData.nomeDoProjeto || !formData.jurisdicao) {
      return NextResponse.json(
        { error: 'Dados obrigatórios ausentes no formulário (Nome do Projeto, Jurisdição).', generatedAt },
        { status: 400 }
      );
    }

    // 4. Cria o prompt do usuário com os dados do formulário (SEU BLOCO OTIMIZADO)
    const userPrompt = `
Gere o documento completo contendo a **Política de Privacidade** e os **Termos de Uso**, conforme as instruções do sistema.

Preencha as seções com base nas informações fornecidas abaixo. 
Se algum campo estiver em branco, use exemplos genéricos consistentes com um serviço SaaS.

---

### 📄 Detalhes do Projeto
- **Data da Última Atualização (Obrigatória):** ${generatedAt || 'Data não informada'}
- **Nome do Projeto:** ${formData?.nomeDoProjeto || 'Projeto Sem Nome'}
- **Responsável/Empresa:** ${formData?.nomeDoResponsavel || 'Empresa Genérica Ltda.'}
- **Tipo de Negócio/Modelo:** SaaS desenvolvido em ${formData?.linguagem || 'TypeScript'}
- **Jurisdição Principal de Conformidade:** ${formData?.jurisdicao || 'Brasil (LGPD)'}

---

### 🔒 Coleta e Tratamento de Dados
- **Coleta de Dados Pessoais:** ${formData?.coletaDadosPessoais ? 'SIM' : 'NÃO'}
- **Coleta de Dados Sensíveis:** ${formData?.coletaDadosSensivel ? 'SIM' : 'NÃO'}
- **Finalidade/Objetivo da Coleta:** ${formData?.objetivoDaColeta || 'Fornecer e melhorar os serviços prestados.'}
- **Transferência Internacional de Dados:** ${formData?.paisesTransferencia || 'Não aplicável'}
- **Público-Alvo:** ${
        formData?.publicoAlvoCriancas
          ? 'Inclui crianças; aplicar cláusulas específicas para menores de 13 anos.'
          : 'Público adulto.'
      }

---

### ⚙️ Informações Adicionais
- **Contato do Encarregado (DPO):** ${formData?.contatoDPO || 'privacidade@exemplo.com'}
- **Incluir Cláusula de “Não Garantia / AS IS”:** ${formData?.incluirNaoGarantia ? 'SIM' : 'NÃO'}

---

### 🧠 Instruções Gerais
Use linguagem jurídica formal, clara e acessível. Garanta consistência legal e terminológica entre as versões em português e inglês.
`;


    // 5. Chamada real à API Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.3,
        // CORREÇÃO CRÍTICA: Aumenta o limite para o máximo (8192) para garantir o conteúdo bilíngue completo
        maxOutputTokens: 8192, 
      },
    });

    // ⭐️ TRATAMENTO DE SAÍDA:
    // Garante que 'policyContent' é uma string e remove espaços em branco iniciais/finais.
    const policyContent = (response.text ?? '').trim();

    if (!policyContent) {
      throw new Error('O modelo Gemini não retornou conteúdo. Tente refinar o prompt.');
    }

    // 6. Retorna a política gerada em formato JSON
    return NextResponse.json({
      policyContent,
      generatedAt
    }, { status: 200 });

  } catch (error) {
    console.error('Erro na API de geração (Gemini):', error);
    return NextResponse.json(
      { error: 'Erro na API Gemini. Verifique a chave (GEMINI_API_KEY) ou o console de logs.', generatedAt },
      { status: 500 }
    );
  }
}

// Garante que apenas POST seja o principal método para geração
export async function GET() {
  return NextResponse.json(
    { error: 'Method Not Allowed. Use POST para gerar a política.' },
    { status: 405 }
  );
}

export const dynamic = 'force-dynamic';
