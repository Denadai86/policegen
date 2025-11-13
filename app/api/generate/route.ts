// ====================================================================
// app/api/generate/route.ts - Endpoint API para Geração de Política (Next.js)
// ====================================================================

import { NextResponse, type NextRequest } from 'next/server';
import { GoogleGenAI } from '@google/genai';
// ⭐️ IMPORTAÇÃO NOVA: Para gerar IDs únicos
import { v4 as uuidv4 } from 'uuid'; 
// ⭐️ IMPORTAÇÃO NOVA: Para conectar ao Firestore
import * as admin from 'firebase-admin'; 

// Importação do utils/generatePolicy (ajuste o caminho para a pasta utils na raiz)
import { FormData, getFormattedDate } from '../../../utils/generatePolicy'; 

// Garante que a rota use o ambiente Node.js completo para APIs
export const runtime = 'nodejs'; 

// ----------------------------------------------------
// Inicialização preguiçosa do Firebase Admin (safe)
// - Normaliza a chave privada recebida via env (remove aspas, transforma \n em newlines)
// - Inicializa o admin apenas quando necessário (evita erro em build/prerender)
// ----------------------------------------------------

let db: FirebaseFirestore.Firestore | null = null;

function normalizePrivateKey(key?: string) {
  if (!key) return undefined;
  // Remove aspas que podem ter sido adicionadas ao colar no .env
  let k = key.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
  // Substitui sequências de escape \n por quebras de linha reais
  k = k.replace(/\\n/g, '\n');
  return k;
}

async function ensureFirebaseAdmin() {
  if (admin.apps.length > 0 && db) return db;

  try {
    const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);
    const serviceAccount: any = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };

    if (!serviceAccount.projectId || !serviceAccount.privateKey || !serviceAccount.clientEmail) {
      console.warn('AVISO: Variáveis de ambiente do Firebase incompletas. O logging de uso não funcionará.');
      return null;
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    db = admin.firestore();
    console.log('Firebase Admin inicializado com sucesso.');
    return db;
  } catch (error) {
    console.error('Falha ao inicializar o Firebase Admin:', error);
    return null;
  }
}

/**
 * Registra os dados da geração da política no Firestore.
 */
async function logPolicyGeneration(
    sessionId: string,
    generatedAt: string,
    formData: FormData,
    userPrompt: string,
    policyContent: string,
) {
  // Tenta garantir que o Admin esteja inicializado (lazy init)
  const _db = await ensureFirebaseAdmin();
  if (!_db) {
    // Se o DB não inicializou devido à falta de variáveis, saímos silenciosamente.
    return;
  }

  try {
    const generationLog = {
      sessionId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(), // Timestamp preciso do servidor
      generatedAtString: generatedAt,
      // Metadados importantes para análise rápida
      projectName: formData.nomeDoProjeto,
      jurisdiction: formData.jurisdicao,
      outputLanguage: formData.idiomaDoDocumento,
      // Dados completos
      inputFormData: formData,
      userPrompt,
      policyContent,
      policyLength: policyContent.length,
    };

    // Salva na coleção 'policyGenerations', usando o sessionId como ID do documento
    await _db.collection('policyGenerations').doc(sessionId).set(generationLog);
    // console.log(`Log de geração salvo com sucesso no Firestore: ${sessionId}`); 
  } catch (error) {
    // Logamos o erro, mas não o jogamos para não quebrar a API principal
    console.error('ERRO ao salvar log no Firestore:', error);
  }
}
// ⭐️ ----------------------------------------------------
// FIM DA LÓGICA DE FIRESTORE
// ----------------------------------------------------


// Definição da resposta da API (mantida)
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
// DEFINIÇÃO DO PROMPT DE SISTEMA (SYSTEM_INSTRUCTION) - MONOLÍNGUE
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
  // ⭐️ GERA UM ID DE SESSÃO ÚNICO para uso no log do Firestore
  const sessionId = uuidv4(); 

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


    // 4. Cria o prompt do usuário com os dados do formulário
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
        // O valor máximo para Gemini 2.5 Flash é 8192
        maxOutputTokens: 8192, 
      },
    });

    // ⭐️ TRATAMENTO DE SAÍDA:
    const policyContent = (response.text ?? '').trim();

    if (!policyContent) {
      throw new Error('O modelo Gemini não retornou conteúdo. Tente refinar o prompt.');
    }
    
    // ⭐️ LÓGICA DE LOG: Chamada da função de log com todos os dados
    // Esta chamada é assíncrona, mas não bloqueia o envio da resposta em caso de falha, 
    // graças ao tratamento de erro interno na função logPolicyGeneration.
    await logPolicyGeneration(
        sessionId,
        generatedAt,
        formData,
        userPrompt,
        policyContent
    );


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