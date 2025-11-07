// ====================================================================
// page.tsx - PÁGINA PRINCIPAL, LOCALSTORAGE, CHAMADA API E DOWNLOAD
// ====================================================================

// ESTE DEVE SER A PRIMEIRA LINHA DO ARQUIVO!
'use client'; 

import { useState, useMemo, ChangeEvent, FormEvent, useEffect } from 'react'; 
import { 
    Clipboard, 
    ArrowRight, 
    CheckCircle, 
    Shield, 
    Settings, 
    Target, 
    FileText,
    Loader2,
    Monitor,
    Home
} from 'lucide-react'; // <-- AGORA INSTALADO

// Importação CORRIGIDA: Usa o alias @/utils (como definimos) e a sintaxe está correta.
import type { FormData } from '@/utils/generatePolicy'; 
import { 
    generatePolicy, // Mantido para referência, mas não será usado
    languageOptions, 
    idiomOptions, 
    getIdiomaLabel,
    jurisdictionOptions, 
    getJurisdicaoLabel // <-- CORRIGIDO A SINTAXE DE IMPORTAÇÃO
} from '@/utils/generatePolicy'; 

// --- 1. CONFIGURAÇÃO DE DADOS INICIAIS ---
const STEPS = [
    { id: 1, name: 'Início', icon: Home },
    { id: 2, name: 'Identificação', icon: Shield },
    { id: 3, name: 'Dados e Tech', icon: Settings },
    { id: 4, name: 'Legais e Escopo', icon: Target },
    { id: 5, name: 'Revisão e Geração', icon: FileText },
];

const LOCAL_STORAGE_KEY = 'policyGenFormData'; 

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
    coletaDadosPessoais: false,
    coletaDadosSensivel: false,
    monetizacaoPorTerceiros: false,
    publicoAlvoCriancas: false,
    incluirNaoGarantia: true,
    contatoDPO: '', 
    paisesTransferencia: 'EUA', 
};


// --- 2. COMPONENTE PRINCIPAL ---
export default function PolicyGenPage() {
    
    // Lógica de Inicialização do Estado (Lê o LocalStorage apenas uma vez)
    const [formData, setFormData] = useState<FormData>(() => {
        if (typeof window !== 'undefined') {
            const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
            return savedData ? JSON.parse(savedData) : EMPTY_FORM_DATA;
        }
        return EMPTY_FORM_DATA;
    });

    const [currentStep, setCurrentStep] = useState(1); 
    const [generatedPolicy, setGeneratedPolicy] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

    // Efeito para salvar o formData no localStorage a cada mudança
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formData));
        }
    }, [formData]); 

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        const newValue = type === 'checkbox' 
            ? (e.target as HTMLInputElement).checked 
            : value;

        setFormData(prev => ({
            ...prev,
            [name]: newValue,
        }));
    };

    // Função de Validação para campos obrigatórios
    const validateStep = (step: number): boolean => {
        switch (step) {
            case 2: 
                if (!formData.nomeDoProjeto.trim() || !formData.nomeDoResponsavel.trim()) {
                    alert("⚠️ Por favor, preencha o Nome do Projeto e o Nome do Responsável.");
                    return false;
                }
                break;
            default:
                break;
        }
        return true;
    };

    const nextStep = () => {
        if (currentStep > 1 && !validateStep(currentStep)) {
            return; 
        }

        if (currentStep < STEPS.length) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    // Lógica para gerar a política: Agora CHAMA O ENDPOINT API
    const handleGenerate = async (e: FormEvent) => {
        e.preventDefault();
        if (currentStep !== STEPS.length) return; 

        setIsLoading(true);

        try {
            // CHAMADA À API /api/generate
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                // Se a resposta for 4xx ou 5xx
                const errorData = await response.json();
                throw new Error(errorData.error || `Erro HTTP ${response.status}`);
            }

            const data = await response.json();
            setGeneratedPolicy(data.policyContent); 

        } catch (error) {
            setCopyFeedback(`❌ Falha na geração: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Função para iniciar o download como arquivo .md
    const handleDownloadMarkdown = () => {
        if (generatedPolicy) {
            // Cria um Blob (objeto de arquivo) com o conteúdo Markdown
            const blob = new Blob([generatedPolicy], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            
            // Sanitiza o nome do arquivo
            const filename = `${formData.nomeDoProjeto.replace(/[^a-z0-9]/gi, '_')}_Politica_${new Date().toISOString().slice(0, 10)}.md`;
            
            // Cria um link temporário para forçar o download
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url); // Libera o objeto URL
            
            setCopyFeedback("Download do arquivo Markdown iniciado!");
            setTimeout(() => setCopyFeedback(null), 3000);
        }
    };

    const handleEdit = () => {
        setCurrentStep(2); 
        setGeneratedPolicy(null);
    };

    // ... (restante do código renderStepHeader)
    const renderStepHeader = (step: typeof STEPS[0]) => {
        const Icon = step.icon;
        const isActive = currentStep === step.id;
        const isComplete = currentStep > step.id;
        
        const baseClasses = "flex items-center space-x-2 p-2 rounded-lg transition-colors duration-300";
        const activeClasses = "bg-green-700 text-white font-bold";
        const completeClasses = "bg-gray-700 text-gray-300 hover:bg-gray-600 cursor-pointer";
        const pendingClasses = "text-gray-400";

        const classes = isComplete ? completeClasses : (isActive ? activeClasses : pendingClasses);

        return (
            <div 
                key={step.id} 
                className={`${baseClasses} ${classes}`}
                onClick={() => isComplete ? setCurrentStep(step.id) : null} 
            >
                {isComplete ? <CheckCircle className="w-5 h-5 text-green-400" /> : <Icon className="w-5 h-5" />}
                <span className="text-sm hidden md:inline">{step.name}</span>
            </div>
        );
    };

    // Renderiza o conteúdo da etapa atual
    const renderStepContent = useMemo(() => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6 text-center">
                        <h3 className="text-3xl font-extrabold text-green-400">Bem-vindo ao PolicyGen Mockup</h3>
                        
                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg space-y-4 text-left">
                            <h4 className="text-xl font-semibold text-white flex items-center space-x-2">
                                <Monitor className="w-6 h-6 text-blue-400" />
                                <span>Sobre o PolicyGen</span>
                            </h4>
                            <p className="text-gray-300">
                                Este é um *mockup* (simulação) de um SAAS que gera um esqueleto de políticas de uso e privacidade com base na sua entrada, usando o poder da IA Gemini no backend.
                            </p>
                            <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                                <li>**Objetivo:** Capturar dados essenciais para garantir conformidade em múltiplas jurisdições (LGPD, GDPR, APPI, etc.).</li>
                                <li>**Resultado:** Um esqueleto robusto em Markdown, gerado via API de Backend.</li>
                            </ul>
                            <p className="text-sm font-semibold text-white pt-2">
                                Por favor, comece a configuração do seu projeto.
                            </p>
                        </div>

                        <div className="pt-4">
                            <button 
                                onClick={nextStep} 
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex items-center justify-center space-x-2 transition duration-200"
                            >
                                <span>Iniciar Configuração</span>
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-6">
                        <h3 className="text-2xl font-semibold text-white">2. Identificação do Projeto (Obrigatório)</h3>
                        
                        <InputField label="Nome do Projeto/App *" name="nomeDoProjeto" value={formData.nomeDoProjeto} onChange={handleChange} placeholder="Ex: PolicyGen Mock" />
                        <InputField label="Nome do Responsável/Empresa *" name="nomeDoResponsavel" value={formData.nomeDoResponsavel} onChange={handleChange} placeholder="Ex: Gemini AI" />
                        
                        <SelectField 
                            label="Jurisdição (Lei Aplicável Principal)" 
                            name="jurisdicao" 
                            value={formData.jurisdicao} 
                            options={jurisdictionOptions} 
                            onChange={handleChange} 
                        />

                        <div className="pt-4">
                            <button 
                                onClick={nextStep} 
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex items-center justify-center space-x-2 transition duration-200"
                            >
                                <span>Próxima Etapa</span>
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-6">
                        <h3 className="text-2xl font-semibold text-white">3. Coleta de Dados e Tecnologia</h3>

                        <SelectField label="Linguagem de Código Principal" name="linguagem" value={formData.linguagem} options={languageOptions} onChange={handleChange} />
                        <SelectField label="Modelo de Software" name="modeloSoftware" value={formData.modeloSoftware} options={[{ value: 'SAAS', label: 'SaaS (Software as a Service)' }, { value: 'OPENSOURCE', label: 'Código Aberto (Open Source)' }, { value: 'B2B', label: 'B2B (Business to Business)' }]} onChange={handleChange} />

                        <CheckboxField 
                            label="Coleta Dados Pessoais de Identificação (Ex: Nome, Email)?" 
                            name="coletaDadosPessoais" 
                            checked={formData.coletaDadosPessoais} 
                            onChange={handleChange} 
                        />
                        
                        {/* CAMPO CONDICIONAL PARA OBJETIVO */}
                        {formData.coletaDadosPessoais && (
                            <TextAreaField 
                                label="Detalhe o Objetivo PRINCIPAL da Coleta de Dados" 
                                name="objetivoDaColeta" 
                                value={formData.objetivoDaColeta} 
                                onChange={handleChange}
                                placeholder="Ex: A coleta é necessária para processamento de pagamentos e comunicação de serviço."
                            />
                        )}

                        <CheckboxField 
                            label="Coleta Dados Sensíveis (Ex: Saúde, Biometria, Política)?" 
                            name="coletaDadosSensivel" 
                            checked={formData.coletaDadosSensivel} 
                            onChange={handleChange} 
                        />
                        <CheckboxField 
                            label="Usa serviços de Terceiros para Monetização/Análise (Ex: Google Ads/Analytics)?" 
                            name="monetizacaoPorTerceiros" 
                            checked={formData.monetizacaoPorTerceiros} 
                            onChange={handleChange} 
                        />
                        
                        <div className="flex justify-between pt-4">
                            <button 
                                onClick={prevStep} 
                                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
                            >
                                Voltar
                            </button>
                            <button 
                                onClick={nextStep} 
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition duration-200"
                            >
                                <span>Próxima Etapa</span>
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-6">
                        <h3 className="text-2xl font-semibold text-white">4. Detalhes Legais e Públicos</h3>

                        <SelectField label="Idioma Principal do Documento" name="idiomaDoDocumento" value={formData.idiomaDoDocumento} options={idiomOptions} onChange={handleChange} />
                        
                        <SelectField label="Tipo de Licença do Código (para Open Source)" name="licencaCodigo" value={formData.licencaCodigo} options={[{ value: 'MIT', label: 'MIT' }, { value: 'GPLv3', label: 'GPLv3' }, { value: 'PROPRIETARIO', label: 'Proprietário' }]} onChange={handleChange} />
                        
                        <SelectField label="Tipo de Monetização (Contexto para Cláusula de Terceiros)" name="tipoMonetizacao" value={formData.tipoMonetizacao} options={[{ value: 'FREEMIUM', label: 'Freemium (Gratuito com Pagamento Opcional)' }, { value: 'PAGO', label: 'Somente Pago (Sem Plano Gratuito)' }, { value: 'GRATUITO_TOTAL', label: 'Totalmente Gratuito' }]} onChange={handleChange} />

                        {/* Contato DPO */}
                        <InputField label="E-mail ou Contato do Responsável/DPO" name="contatoDPO" value={formData.contatoDPO} onChange={handleChange} placeholder="Ex: dpo@empresa.com" type="email" />

                        {/* Transferência Internacional */}
                        <InputField label="Lista de Países para onde os dados são transferidos" name="paisesTransferencia" value={formData.paisesTransferencia} onChange={handleChange} placeholder="Ex: EUA, Irlanda, Brasil" />
                        
                        <CheckboxField 
                            label="É primariamente direcionado a Menores (abaixo de 18 anos)?" 
                            name="publicoAlvoCriancas" 
                            checked={formData.publicoAlvoCriancas} 
                            onChange={handleChange} 
                        />
                        <CheckboxField 
                            label="Incluir Cláusula de Não Garantia e Limitação de Responsabilidade ('AS IS')?" 
                            name="incluirNaoGarantia" 
                            checked={formData.incluirNaoGarantia} 
                            onChange={handleChange} 
                            description="Altamente recomendado legalmente."
                        />

                        <div className="flex justify-between pt-4">
                            <button 
                                onClick={prevStep} 
                                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
                            >
                                Voltar
                            </button>
                            <button 
                                onClick={nextStep} 
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition duration-200"
                            >
                                <span>Revisar e Gerar</span>
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                );
            case 5:
                return (
                    <div className="space-y-6">
                        <h3 className="text-2xl font-semibold text-white">5. Revisão e Geração</h3>
                        
                        {!generatedPolicy && (
                            <div className="bg-gray-800 p-4 rounded-lg text-gray-300 space-y-3">
                                <h4 className="font-bold text-lg text-green-400">Resumo dos Requisitos:</h4>
                                <ul className="list-disc list-inside text-sm space-y-1">
                                    <li>**Projeto:** {formData.nomeDoProjeto || 'N/A'}</li>
                                    <li>**Responsável:** {formData.nomeDoResponsavel || 'N/A'}</li>
                                    <li>**Jurisdição:** {getJurisdicaoLabel(formData.jurisdicao)}</li>
                                    <li>**Idioma:** {getIdiomaLabel(formData.idiomaDoDocumento)}</li>
                                    <li>**Coleta Dados Pessoais:** {formData.coletaDadosPessoais ? 'SIM' : 'NÃO'}</li>
                                    <li>**Contato DPO:** {formData.contatoDPO.trim() || 'N/A'}</li>
                                    <li>**Transferência para:** {formData.paisesTransferencia.trim() || 'N/A'}</li>
                                    <li>**Cláusula 'AS IS':** {formData.incluirNaoGarantia ? 'SIM (Recomendado)' : 'NÃO'}</li>
                                </ul>
                            </div>
                        )}

                        {!generatedPolicy && (
                            <button 
                                onClick={handleGenerate} 
                                disabled={isLoading}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex items-center justify-center space-x-2 transition duration-200 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Gerando Política via API...</span>
                                    </>
                                ) : (
                                    <>
                                        <FileText className="w-5 h-5" />
                                        <span>Gerar Documento (Chamar API)</span>
                                    </>
                                )}
                            </button>
                        )}

                        {generatedPolicy && (
                            <div className="space-y-4">
                                <p className="text-lg font-bold text-green-400">
                                    Documento Gerado com Sucesso! (Mock via API)
                                </p>
                                
                                <div className="flex justify-between items-center">
                                    <button 
                                        onClick={handleEdit} 
                                        className="text-sm text-gray-400 hover:text-white"
                                    >
                                        &larr; Voltar e Editar
                                    </button>
                                    <button 
                                        onClick={handleDownloadMarkdown} 
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition duration-200"
                                    >
                                        <FileText className="w-5 h-5" />
                                        <span>Download (.md)</span>
                                    </button>
                                </div>

                                {copyFeedback && (
                                    <p className="text-sm text-center text-blue-400">{copyFeedback}</p>
                                )}

                                {/* Bloco da Política Gerada */}
                                <div
                                    className="bg-gray-900 text-gray-100 p-6 rounded-lg whitespace-pre-wrap font-mono text-base h-96 overflow-y-scroll shadow-inner relative" 
                                >
                                    {generatedPolicy}
                                </div>
                            </div>
                        )}
                        
                        {!generatedPolicy && (
                            <div className="flex justify-start pt-4">
                                <button 
                                    onClick={prevStep} 
                                    className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
                                >
                                    Voltar
                                </button>
                            </div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    }, [currentStep, formData, generatedPolicy, isLoading, copyFeedback]);

    const progress = (currentStep / STEPS.length) * 100;

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-4 md:p-8">
            <header className="text-center mb-10">
                <h1 className="text-4xl font-extrabold text-green-400">PolicyGen Mockup</h1>
                <p className="text-gray-400 mt-2">Gere um rascunho de Termos de Uso e Política de Privacidade em Markdown</p>
            </header>

            <div className="max-w-4xl mx-auto bg-gray-800 p-6 md:p-10 rounded-xl shadow-2xl">
                
                {/* Indicador de Etapa e Progresso */}
                <div className="mb-8 space-y-4">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                        {STEPS.map(renderStepHeader)}
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <div 
                            className="bg-green-500 h-2.5 rounded-full transition-all duration-500" 
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>

                {/* Conteúdo da Etapa */}
                <form onSubmit={handleGenerate}>
                    {renderStepContent}
                </form>
            </div>

            <footer className="text-center text-sm text-gray-600 mt-10">
                Desenvolvido com Next.js, TypeScript e Gemini AI.
            </footer>
        </div>
    );
}

// --- 3. COMPONENTES REUTILIZÁVEIS ---

interface InputProps {
    label: string;
    name: string;
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    placeholder?: string;
    type?: 'text' | 'email' | 'password';
}

const InputField: React.FC<InputProps> = ({ label, name, value, onChange, placeholder, type = 'text' }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-1">
            {label}
        </label>
        <input
            type={type}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full px-4 py-2 border border-gray-700 rounded-lg bg-gray-900 text-white placeholder-gray-500 focus:ring-green-500 focus:border-green-500 transition duration-150"
        />
    </div>
);

const SelectField: React.FC<InputProps & { options: { value: string; label: string }[] }> = ({ label, name, value, onChange, options }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-1">
            {label}
        </label>
        <select
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            className="w-full px-4 py-2 border border-gray-700 rounded-lg bg-gray-900 text-white focus:ring-green-500 focus:border-green-500 transition duration-150 appearance-none cursor-pointer"
        >
            {options.map(option => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    </div>
);

interface CheckboxProps {
    label: string;
    name: string;
    checked: boolean;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    description?: string;
}

const CheckboxField: React.FC<CheckboxProps> = ({ label, name, checked, onChange, description }) => (
    <div className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg">
        <input
            id={name}
            name={name}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className="h-5 w-5 text-green-600 bg-gray-800 border-gray-600 rounded focus:ring-green-500 cursor-pointer"
        />
        <div className="flex-1">
            <label htmlFor={name} className="text-sm font-medium text-white cursor-pointer">
                {label}
            </label>
            {description && (
                <p className="text-xs text-gray-400 mt-0.5">{description}</p>
            )}
        </div>
    </div>
);

interface TextAreaProps {
    label: string;
    name: string;
    value: string;
    onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
}

const TextAreaField: React.FC<TextAreaProps> = ({ label, name, value, onChange, placeholder }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-1">
            {label}
        </label>
        <textarea
            id={name}
            name={name}
            value={value}
            // Garantindo que a tipagem do onChange é aceita
            onChange={onChange as (e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement | HTMLSelectElement>) => void}
            placeholder={placeholder}
            rows={3}
            className="w-full px-4 py-2 border border-gray-700 rounded-lg bg-gray-900 text-white placeholder-gray-500 focus:ring-green-500 focus:border-green-500 transition duration-150 resize-y"
        />
    </div>
);
