// ====================================================================
// app/page.tsx - PÁGINA PRINCIPAL, FIREBASE, CHAMADA API E DOWNLOAD
// CORREÇÃO: localStorage REMOVIDO, LÓGICA DE FIREBASE ADICIONADA.
// ====================================================================

'use client'; 

import { useState, useMemo, ChangeEvent, useEffect, useCallback } from 'react';
import { 
    Clipboard, 
    ArrowRight, 
    CheckCircle, 
    Shield, 
    Settings, 
    Target, 
    FileText,
    Loader2,
    Home,
    Smartphone,
    Save, // Novo ícone
    History, // Novo ícone
    Trash2, // Novo ícone
    FileUp // Novo ícone
} from 'lucide-react';

// Importação da tipagem e funções utilitárias do FORM
import type { FormData } from '../utils/generatePolicy';
import type { PolicyDocument } from '../utils/firestore';
import { 
    languageOptions, 
    idiomOptions, 
    getIdiomaLabel,
    jurisdictionOptions, 
    getJurisdicaoLabel
} from '../utils/generatePolicy';

// Importação das funções e hooks do FIREBASE/FIRESTORE
import { useAuth } from '../utils/firebase'; // Hook para autenticação
import { 
    loadDraft,
    saveDraft,
    savePolicy,
    getPoliciesHistory,
    deleteDocument
} from '../utils/firestore'; // Funções do Firestore

// --- UTILITY: HOOK DE DEBOUNCE PARA SALVAR DRAFT ---
// Implementação simples de um hook de debounce
const useDebouncedEffect = (callback: () => void, dependencies: any[], delay: number) => {
    useEffect(() => {
        const handler = setTimeout(() => {
            callback();
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...dependencies, delay]);
};


// --- 1. CONFIGURAÇÃO DE DADOS INICIAIS (Mantido) ---

const STEPS = [
    { id: 1, name: 'Início', icon: Home },
    { id: 2, name: 'Uso do Serviço', icon: Smartphone }, 
    { id: 3, name: 'Identificação', icon: Shield },
    { id: 4, name: 'Dados e Tech', icon: Settings },
    { id: 5, name: 'Legais e Escopo', icon: Target },
    { id: 6, name: 'Revisão e Geração', icon: FileText }
];

const STEP_TITLES = {
    1: 'Bem-vindo ao Gerador de Políticas por IA',
    2: 'Passo 2: Política de Uso e Monetização (Termos de Uso)', 
    3: 'Passo 3: Identificação do Projeto',
    4: 'Passo 4: Configurações de Dados e Tecnologia',
    5: 'Passo 5: Escopo Legal e Detalhes',
    6: 'Passo 6: Revisão e Geração Final'
};

const EMPTY_FORM_DATA: FormData = {
    nomeDoProjeto: '', 
    nomeDoResponsavel: '',
    jurisdicao: 'Brasil', 
    linguagem: languageOptions[0].value, 
    idiomaDoDocumento: 'pt-br', 
    licencaCodigo: 'MIT', 
    modeloSoftware: 'SAAS', 
    tipoMonetizacao: 'FREEMIUM',
    objetivoDaColeta: '',
    coletaDadosPessoais: true,
    coletaDadosSensivel: false,
    monetizacaoPorTerceiros: false,
    publicoAlvoCriancas: false,
    incluirNaoGarantia: true,
    contatoDPO: '', 
    paisesTransferencia: '',
};

// --- 2. COMPONENTES DE CAMPO AUXILIARES (Mantidos - Omitidos para brevidade no corpo da resposta, mas presentes no arquivo real) ---

// InputField, SelectField, CheckboxField, TextAreaField... (Mantidos)

// --- 3. COMPONENTE PRINCIPAL ---

export default function PolicyGenPage() {
    const { user, loading: loadingAuth } = useAuth(); // ⭐️ Novo: Hook de Autenticação
    const userId = user?.uid;

    const [step, setStep] = useState(STEPS[0].id);
    const [formData, setFormData] = useState<FormData>(EMPTY_FORM_DATA);
    const [policy, setPolicy] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedAt, setGeneratedAt] = useState<string>('');
    const [copySuccess, setCopySuccess] = useState<boolean>(false);
    
    // ⭐️ NOVO ESTADO: Histórico de Políticas
    const [history, setHistory] = useState<PolicyDocument[]>([]);
    const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

    // --- FUNÇÕES DE LÓGICA DO FIRESTORE ---

    const fetchHistory = useCallback(async (uid: string) => {
        setLoadingHistory(true);
        try {
            const historyData = await getPoliciesHistory(uid) as PolicyDocument[];
            // Ordena o histórico pelo mais recente
            historyData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setHistory(historyData);
        } catch (e) {
            console.error("Erro ao buscar histórico:", e);
        } finally {
            setLoadingHistory(false);
        }
    }, []);

    const handleLoadDraft = useCallback(async (uid: string) => {
        try {
            const draft = await loadDraft(uid);
            if (draft) {
                setFormData(prev => ({ ...prev, ...draft.data }));
                setError(null);
                setStep(STEPS[0].id); // Volta para o início após carregar
                console.log("Rascunho carregado com sucesso.");
            }
        } catch (e) {
            console.error("Erro ao carregar rascunho:", e);
        }
    }, []);

    const handleLoadPolicy = (policyDoc: PolicyDocument) => {
        setFormData(prev => ({ ...prev, ...policyDoc.data }));
        setPolicy(policyDoc.policyContent);
        setGeneratedAt(policyDoc.generatedAt);
        setStep(STEPS.length); // Vai para o passo de revisão
        setError(null);
    };

    const handleDelete = async (docId: string, isDraft: boolean) => {
        if (!userId) return;
        if (window.confirm(`Tem certeza que deseja deletar este ${isDraft ? 'rascunho' : 'documento'}?`)) {
            try {
                await deleteDocument(userId, docId);
                await fetchHistory(userId); // Recarrega o histórico
                alert(`${isDraft ? 'Rascunho' : 'Documento'} deletado com sucesso!`);
            } catch (e) {
                console.error("Erro ao deletar documento:", e);
                alert("Erro ao deletar. Verifique o console.");
            }
        }
    };

    // --- EFEITOS DE ESTADO (FIRESTORE) ---

    // 1. Efeito para carregar rascunho e histórico ao autenticar
    useEffect(() => {
        if (userId && !loadingAuth) {
            handleLoadDraft(userId);
            fetchHistory(userId);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, loadingAuth]); // Depende do ID de usuário e do estado de loading da autenticação

    // 1.b Efeito para sincronizar o passo com a query string ou hash
    useEffect(() => {
        function syncStepFromUrl() {
            try {
                const params = new URLSearchParams(window.location.search);
                const s = params.get('step');
                if (s) {
                    const n = Number(s);
                    if (!Number.isNaN(n) && n >= 1 && n <= STEPS.length) {
                        setStep(n);
                        // rolar suavemente para a seção de steps quando disponível
                        setTimeout(() => {
                            const el = document.getElementById('steps');
                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 50);
                        return;
                    }
                }

                // se não houver param step mas houver hash '#steps', vamos para o passo 1 por padrão
                if (window.location.hash === '#steps') {
                    setStep(1);
                    setTimeout(() => {
                        const el = document.getElementById('steps');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 50);
                }
            } catch (e) {
                // ignore
            }
        }

        // sincroniza no mount
        syncStepFromUrl();

        // atualiza quando houver navegação no histórico (back/forward) ou hashchange
        window.addEventListener('popstate', syncStepFromUrl);
        window.addEventListener('hashchange', syncStepFromUrl);
        return () => {
            window.removeEventListener('popstate', syncStepFromUrl);
            window.removeEventListener('hashchange', syncStepFromUrl);
        };
    }, []);

    // 2. Efeito de Debounce para Salvar Rascunho
    useDebouncedEffect(() => {
        if (userId && !loadingAuth && step < STEPS.length) {
            saveDraft(userId, formData);
            // Opcional: Feedback visual de "Salvando Rascunho..."
            console.log("Rascunho salvo no Firestore (debounce).");
        }
    }, [formData, userId, loadingAuth, step], 1500); // Salva 1.5s após a última mudança

    // --- FUNÇÕES DE NAVEGAÇÃO E INPUT (Mantidas) ---
    // nextStep, prevStep, handleFormChange...

    const nextStep = () => {
        if (step < STEPS.length) {
            setStep(step + 1);
            if(policy && step < STEPS.length - 1) { 
                setPolicy('');
            }
            setError(null); 
        }
    };

    const prevStep = () => {
        if (step > 1) {
            setStep(step - 1);
            setError(null); 
        }
    };

    const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const newValue = (type === 'checkbox' && 'checked' in e.target) 
            ? e.target.checked 
            : value;
        setFormData(prev => ({
            ...prev,
            [name]: newValue,
        }));
    };

    // --- FUNÇÃO DE CHAMADA DA API GEMINI (CORRIGIDA COM SAVE NO FIRESTORE) ---
    
    const handleGenerate = async () => {
        if (!formData.nomeDoProjeto || !formData.nomeDoResponsavel) {
            setError("O nome do projeto e do responsável são obrigatórios. Por favor, preencha no Passo 3.");
            if(step !== 3) setStep(3);
            return;
        }

        setLoading(true);
        setPolicy('');
        setError(null);
        setGeneratedAt('');
        
        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Erro HTTP: ${response.status}`);
            }

            const policyContent = data.policyContent;
            const generatedTime = data.generatedAt;

            setPolicy(policyContent);
            setGeneratedAt(generatedTime);

            // ⭐️ NOVO: Salvar a política final no Firestore
            if (userId) {
                await savePolicy(userId, {
                    ...formData,
                    policyContent,
                    generatedAt: generatedTime,
                });
                await fetchHistory(userId); // Recarrega o histórico para mostrar a nova política
            }

        } catch (err) {
            console.error('Erro na Geração:', err);
            setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido ao gerar a política.');
        } finally {
            setLoading(false);
        }
    };

    // --- FUNÇÕES DE DOWNLOAD E COPIAR (Mantidas) ---
    // handleDownload, handleCopy...

    const handleDownload = () => { /* ... lógica de download mantida ... */ };
    const handleCopy = () => { /* ... lógica de copy mantida ... */ };
    
    // --- RENDERIZAÇÃO CONDICIONAL DO CONTEÚDO ---
    const renderStepContent = useMemo(() => {
        // ... (Cases 1 a 5 - Conteúdo dos passos de input, mantidos)
        
        switch (step) {
            case 1: // Início (Conteúdo mantido)
                return (
                    <div className="space-y-6">
                        <p className="text-gray-400">
                            Bem-vindo ao Gerador de Documentos Jurídicos utilizando o AI. 
                            Responda a quatro passos simples e obtenha seus Termos de Uso e Política de Privacidade unificados, personalizados e com foco na conformidade legal.
                        </p>
                        <ul className="text-gray-300 space-y-3 list-disc list-inside">
                            <li>🎯 Geração de Termos de Uso e Política de Privacidade em um único arquivo.</li>
                            <li>⚖️ Conformidade com LGPD (Brasil), GDPR (UE) e outras jurisdições.</li>
                            <li>✍️ Saída estritamente em formato Markdown, pronta para o seu site.</li>
                        </ul>
                         {/* ⭐️ NOVO: Indicador de Rascunho Salvo */}
                        <div className="p-4 bg-yellow-900/50 border border-yellow-800 rounded-lg text-sm text-yellow-300 flex items-center space-x-2">
                            <Save className="h-5 w-5" />
                            <p>Seu progresso está sendo **salvo automaticamente na nuvem**.</p>
                        </div>
                    </div>
                );
            case 2: // Uso do Serviço (Conteúdo mantido)
            case 3: // Identificação (Conteúdo mantido)
            case 4: // Dados e Tech (Conteúdo mantido)
            case 5: // Legais e Escopo (Conteúdo mantido)
                // Colocar o código dos casos 2 a 5 aqui (omitido para brevidade)
                return null; // Substituir por renderização real
            case 6: // Revisão e Geração ⭐️ NOVO PONTO DE CHAMADA DA API + HISTÓRICO
                return (
                    <div className="space-y-8">
                        {/* ⭐️ NOVO: Seção de Histórico de Políticas */}
                        <section className="space-y-4">
                            <h3 className="text-xl font-semibold text-blue-400 flex items-center">
                                <History className="h-5 w-5 mr-2" /> Histórico e Rascunhos Salvos
                                <button onClick={() => userId && fetchHistory(userId)} className="ml-4 text-xs text-gray-400 hover:text-gray-300 underline">Atualizar</button>
                            </h3>

                            {(loadingAuth || loadingHistory) && (
                                <div className="p-4 bg-gray-700 rounded-lg text-sm text-white flex items-center justify-center">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando Histórico...
                                </div>
                            )}

                            {(!userId && !loadingAuth) && (
                                <div className="p-4 bg-red-900/50 border border-red-800 rounded-lg text-sm text-red-300">
                                    Falha na Autenticação. Seu histórico não será salvo.
                                </div>
                            )}

                            {(!loadingHistory && userId && history.length === 0) && (
                                <p className="text-gray-400 text-sm italic">Nenhum rascunho ou política salva ainda.</p>
                            )}

                            <div className="space-y-2">
                                {history.map((doc) => (
                                    <div key={doc.id} className={`flex justify-between items-center p-3 rounded-lg border ${doc.type === 'draft' ? 'bg-yellow-900/30 border-yellow-700' : 'bg-green-900/30 border-green-700'}`}>
                                        <div className='flex-1 min-w-0'>
                                            <p className="font-semibold truncate text-white">
                                                {doc.type === 'draft' ? 'Rascunho' : 'Política Gerada'}: {doc.data.nomeDoProjeto || 'Projeto Sem Nome'}
                                            </p>
                                            <p className="text-xs text-gray-400">Salvo em: {new Date(doc.createdAt).toLocaleString()}</p>
                                        </div>
                                        <div className='flex space-x-2 ml-4'>
                                            <button 
                                                onClick={() => doc.type === 'draft' ? handleLoadDraft(userId!) : handleLoadPolicy(doc)}
                                                className={`p-2 rounded-lg text-xs font-medium transition ${doc.type === 'draft' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'} text-white flex items-center`}
                                            >
                                                <FileUp className="h-4 w-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(doc.id, doc.type === 'draft')}
                                                className="p-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-medium transition flex items-center"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                        
                        <hr className="border-gray-700" />
                        
                        <h3 className="text-xl font-semibold text-green-400">Dados para Revisão:</h3>
                        {/* ... (Revisão dos dados - Mantido) ... */}
                        <div className="bg-gray-800 p-4 rounded-lg text-sm text-gray-300 space-y-2">
                             <p><strong>Projeto:</strong> {formData.nomeDoProjeto || 'Não informado'}</p>
                            <p><strong>Responsável:</strong> {formData.nomeDoResponsavel || 'Não informado'}</p>
                            <p><strong>Base Legal:</strong> {getJurisdicaoLabel(formData.jurisdicao)}</p>
                            <p><strong>Idioma de Saída:</strong> {getIdiomaLabel(formData.idiomaDoDocumento)}</p>
                            <p><strong>Coleta Dados Pessoais:</strong> {formData.coletaDadosPessoais ? 'Sim' : 'Não'}</p>
                            <p><strong>Dados Sensíveis:</strong> {formData.coletaDadosSensivel ? 'Sim' : 'Não'}</p>
                            <p><strong>DPO:</strong> {formData.contatoDPO || 'Não informado'}</p>
                            
                            <button 
                                type="button"
                                onClick={() => setStep(3)}
                                className="text-xs text-blue-400 hover:text-blue-300 underline mt-2 block"
                            >
                                Clique aqui para voltar e editar a Identificação
                            </button>
                        </div>

                        {/* Botão de Geração - Mantido */}
                        {!policy && (
                            <button
                                type="button" 
                                onClick={handleGenerate} 
                                disabled={loading || !formData.nomeDoProjeto || !formData.nomeDoResponsavel}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition duration-150 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center">
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Gerando Documento...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center">
                                        Gerar Documento Legal <ArrowRight className="ml-2 h-5 w-5" />
                                    </span>
                                )}
                            </button>
                        )}

                        {/* Área de Erro (Mantido) */}
                        {error && (
                            <div className="p-3 bg-red-800 text-white rounded-lg text-sm">
                                <strong>Erro:</strong> {error}
                            </div>
                        )}

                        {/* Visualizador de Política (Mantido) */}
                        {policy && (
                            <div className="mt-8">
                                {/* ... (Visualizador de Política, botões de cópia/download mantidos) ... */}
                            </div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    }, [step, formData, policy, loading, error, generatedAt, copySuccess, userId, loadingAuth, history, loadingHistory, handleLoadDraft, fetchHistory]);
    
    // --- RENDERIZAÇÃO PRINCIPAL DO LAYOUT (Mantida) ---
    return (
        // ... (Estrutura do Layout mantida) ...
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-8">
            <header className="w-full max-w-4xl text-center mb-8">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-green-500">
                    PolicyGen 
                    <span className="text-xl font-normal text-gray-400"> powered by AçãoLeve</span>
                </h1>
                <p className="text-gray-400 mt-2">Geração de Termos de Uso e Privacidade com foco legal.</p>
            </header>

            <main className="w-full max-w-4xl bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl">
                
                {/* Indicador de Passo (Mantido) */}
                <div id="steps" className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
                    {/* ... (Renderização dos passos mantida) ... */}
                </div>

                {/* Título do Passo (Mantido) */}
                <h2 className="text-2xl font-bold mb-6 text-white">
                    {STEP_TITLES[step as keyof typeof STEP_TITLES]}
                </h2>

                {/* Conteúdo do Passo (Mantido) */}
                <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
                    {renderStepContent}

                    {/* Botões de Navegação */}
                    <div className="flex justify-between border-t border-gray-700 pt-4 mt-8">
                        <div>
                            <button
                                type="button"
                                onClick={prevStep}
                                disabled={step === 1}
                                className="inline-flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium rounded-md transition"
                            >
                                ← Anterior
                            </button>
                        </div>

                        <div className="flex items-center space-x-3">
                            {/* Se não for o último passo, mostra Próximo */}
                            {step < STEPS.length ? (
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-md transition"
                                >
                                    Próximo
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </button>
                            ) : (
                                // Último passo: botão de gerar
                                <button
                                    type="button"
                                    onClick={handleGenerate}
                                    disabled={loading || !formData.nomeDoProjeto || !formData.nomeDoResponsavel}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <span className="flex items-center">
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando...
                                        </span>
                                    ) : (
                                        <span className="flex items-center">Gerar Documento <ArrowRight className="ml-2 h-4 w-4" /></span>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
}
// --------------------------------------------------------------------
// Nota: O código completo inclui as funções de InputField, SelectField,
// CheckboxField e TextAreaField que foram omitidas para focar na lógica principal.
// --------------------------------------------------------------------