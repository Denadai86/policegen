// ====================================================================
// app/api/generate/route.ts - Endpoint API (CORREÇÃO DE BUILD)
// ====================================================================

import { NextResponse, type NextRequest } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { FormData, getFormattedDate } from '@/utils/generatePolicy'; // Seu caminho de utils pode variar

// Definição da resposta da API
type Data = {
  policyContent?: string;
  error?: string;
  generatedAt: string;
};

// 1. Inicializa o cliente Gemini
const ai = new GoogleGenAI({});

// Define o prompt de sistema
const SYSTEM_INSTRUCTION = `Você é um gerador de documentos legais (Termos de Uso e Política de Privacidade) especializado em software.
Sua tarefa é criar um documento coeso, profissional e bem estruturado.
**USE A DATA FORNECIDA NO PROMPT DO USUÁRIO COMO A DATA DE "ÚLTIMA ATUALIZAÇÃO", SEMPRE.**
Use o formato Markdown estrito (com títulos #, ##, listas *, negrito **).
Ajuste as cláusulas de conformidade (LGPD, GDPR, CCPA, etc.) com base na jurisdição principal fornecida.
NÃO adicione nenhum texto introdutório, conclusivo ou explicações que não façam parte do corpo do documento legal.
Sua única saída DEVE ser o conteúdo integral do documento em Markdown.`;


export async function POST(req: NextRequest) {
  // Captura a data atual formatada antes de qualquer processamento
  const generatedAt = getFormattedDate();

  try {
    // 2. Recebe e parseia o corpo da requisição
    const formData: FormData = await req.json();

    // 3. Validação básica
    if (!formData.nomeDoProjeto || !formData.jurisdicao) {
        return NextResponse.json(
            { error: 'Dados obrigatórios ausentes no formulário.', generatedAt },
            { status: 400 }
        );
    }

    // 4. Cria o prompt do usuário com os dados do formulário
    const userPrompt = `Gere a Política de Privacidade e Termos de Uso (em PORTUGUÊS) para o seguinte projeto.

- **Data da Última Atualização/Emissão (Obrigatória):** Use estritamente esta data no topo do documento: ${generatedAt}
- **Nome do Projeto:** ${formData.nomeDoProjeto}
- **Responsável/Empresa:** ${formData.nomeDoResponsavel}
- **Jurisdição Principal de Conformidade:** ${formData.jurisdicao}
- **Coleta de Dados Pessoais:** ${formData.coletaDadosPessoais ? 'SIM' : 'NÃO'}
- **Coleta de Dados Sensíveis:** ${formData.coletaDadosSensivel ? 'SIM' : 'NÃO'}
- **Objetivo da Coleta:** ${formData.objetivoDaColeta.trim() || 'Não especificado, usar propósito genérico.'}
- **Público Alvo (Crianças):** ${formData.publicoAlvoCriancas ? 'SIM, exige cláusulas específicas para menores.' : 'NÃO, focado em adultos.'}
- **Transferência Internacional:** Para os seguintes países: ${formData.paisesTransferencia.trim()}
- **Contato DPO/Encarregado:** ${formData.contatoDPO.trim() || 'Não especificado, usar e-mail genérico.'}
- **Incluir Cláusula "AS IS":** ${formData.incluirNaoGarantia ? 'SIM' : 'NÃO'}
- **Modelo/Tecnologia:** SaaS, escrito em ${formData.linguagem}.
`;

    // 5. Chamada real à API Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.3,
          maxOutputTokens: 4096,
      },
    });

    // ⭐️ CORREÇÃO DO ERRO DE BUILD (Linha 72):
    // Garante que 'policyContent' é uma string vazia se 'response.text' for undefined.
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
        { error: 'Erro na API Gemini. Verifique a chave ou o console de logs.', generatedAt },
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