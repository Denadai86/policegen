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
// DEFINIÇÃO DO PROMPT DE SISTEMA (SYSTEM_INSTRUCTION) - REVISADO PARA MONOLINGUE
// Define o persona e as regras de formatação/estrutura
// ====================================================================
const SYSTEM_INSTRUCTION = `
Você é um **Especialista em Documentos Legais** especializado em **Softwares, SaaS e Plataformas Digitais**, com foco em **Termos de Uso** e **Políticas de Privacidade**.
Sua função é **gerar um documento jurídico completo, preciso e profissional**, que una **em um único arquivo**:
- **Termos de Uso**
- **Política de Privacidade**

## ⚖️ REGRAS DE GERAÇÃO

1. O documento DEVE ser **estritamente na linguagem solicitada pelo usuário**.
2. A saída DEVE ser **estritamente em formato Markdown válido**.
3. O documento deve conter **apenas o conteúdo legal** — **NENHUMA** explicação, comentário, preâmbulo ou rodapé adicional.
4. O título principal DEVE ser uma única tag de nível 1: \`# [Nome do Documento]\`
5. Use:
   - \`##\` para seções principais (ex.: Termos de Uso, Política de Privacidade)
   - \`###\` para subseções ou cláusulas

## 🧠 CONTEÚDO ESSENCIAL MÍNIMO
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

    // EXTRAI O IDIOMA DO FORMULÁRIO E GARANTE UM PADRÃO
    const idiomaSaida = formData?.idiomaDoDocumento || 'Português (pt-br)';


    // 4. Cria o prompt do usuário com os dados do formulário (ADICIONANDO INSTRUÇÃO DE IDIOMA)
    const userPrompt = `
Gere o documento completo contendo a **Política de Privacidade** e os **Termos de Uso**, conforme as instruções do sistema.
**O idioma de saída DEVE ser: ${idiomaSaida}.**
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
Use linguagem jurídica formal, clara e acessível.
**A saída DEVE ser unicamente em ${idiomaSaida}.**
`;

    // 5. Chamada real à API Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.3,
        // CORREÇÃO CRÍTICA: Reduz o limite de tokens, já que não é mais bilíngue.
        maxOutputTokens: 6150, 
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