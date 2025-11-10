// ====================================================================
// app/page.tsx - PÁGINA PRINCIPAL, LOCALSTORAGE, CHAMADA API E DOWNLOAD
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
    Home
} from 'lucide-react'; 

// Importação da tipagem e funções utilitárias
import type { FormData } from '@/utils/generatePolicy'; 
import { 
    languageOptions, 
    idiomOptions, 
    getIdiomaLabel,
    jurisdictionOptions, 
    getJurisdicaoLabel
} from '@/utils/generatePolicy'; 

// --- 1. CONFIGURAÇÃO DE DADOS INICIAIS ---
const STEPS = [
    { id: 1, name: 'Início', icon: Home },
    { id: 2, name: 'Identificação', icon: Shield },
    { id: 3, name: 'Dados e Tech', icon: Settings },
    { id: 4, name: 'Legais e Escopo', icon: Target },
    { id: 5, name: 'Revisão e Geração', icon: FileText }
];

const STEP_TITLES = {
    1: 'Bem-vindo ao Gerador de Políticas por IA',
    2: 'Passo 2: Identificação do Projeto',
    3: 'Passo 3: Configurações de Dados e Tecnologia',
    4: 'Passo 4: Escopo Legal e Detalhes',
    5: 'Passo 5: Revisão e Geração Final'
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

const LOCAL_STORAGE_KEY = 'policyGenFormData';

// --- 2. COMPONENTES DE CAMPO AUXILIARES ---

interface InputProps {
    label: string;
    name: keyof FormData;
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    type?: 'text' | 'email';
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

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps {
    label: string;
    name: keyof FormData;
    value: string;
    options: SelectOption[];
    onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
}

const SelectField: React.FC<SelectProps> = ({ label, name, value, options, onChange }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-1">
            {label}
        </label>
        <select
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            className="w-full px-4 py-2 border border-gray-700 rounded-lg bg-gray-900 text-white focus:ring-green-500 focus:border-green-500 transition duration-150 appearance-none"
        >
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    </div>
);

interface CheckboxProps {
    label: string;
    description?: string;
    name: keyof FormData;
    checked: boolean;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

const CheckboxField: React.FC<CheckboxProps> = ({ label, description, name, checked, onChange }) => (
    <div className="flex items-start space-x-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
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
    name: keyof FormData; // Corrigido para usar keyof FormData
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
            onChange={onChange as (e: ChangeEvent<HTMLTextAreaElement>) => void}
            placeholder={placeholder}
            rows={3}
            className="w-full px-4 py-2 border border-gray-700 rounded-lg bg-gray-900 text-white placeholder-gray-500 focus:ring-green-500 focus:border-green-500 transition duration-150"
        />
    </div>
);

// --- 3. COMPONENTE PRINCIPAL ---

export default function PolicyGenPage() {
    const [step, setStep] = useState(STEPS[0].id);
    const [formData, setFormData] = useState<FormData>(EMPTY_FORM_DATA);
    const [policy, setPolicy] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedAt, setGeneratedAt] = useState<string>('');
    const [copySuccess, setCopySuccess] = useState<boolean>(false);

    // --- EFEITOS DE ESTADO (LOCAL STORAGE) ---
    useEffect(() => {
        // Carregar do Local Storage na montagem
        const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedData) {
            try {
                const parsedData = JSON.parse(savedData);
                // Usar a estrutura de '...prev' garante que novos campos tenham o valor padrão
                setFormData(prev => ({ ...prev, ...parsedData }));
            } catch (e) {
                console.error("Erro ao carregar dados do Local Storage:", e);
                localStorage.removeItem(LOCAL_STORAGE_KEY);
            }
        }
    }, []);

    useEffect(() => {
        // Salvar no Local Storage sempre que formData mudar
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formData));
    }, [formData]);


    // --- FUNÇÕES DE NAVEGAÇÃO E INPUT ---
    const nextStep = () => {
        if (step < STEPS.length) {
            setStep(step + 1);
            // Limpa a política se estiver voltando/avançando para forçar nova geração
            if(policy && step < STEPS.length - 1) { 
                setPolicy('');
            }
        }
    };

    const prevStep = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        // Trata a conversão de checkbox para booleano
        const newValue = (type === 'checkbox' && 'checked' in e.target) 
            ? e.target.checked 
            : value;

        setFormData(prev => ({
            ...prev,
            [name]: newValue,
        }));
    };

    // --- FUNÇÃO DE CHAMADA DA API GEMINI ---
    const handleGenerate = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setPolicy('');
        setError(null);
        setGeneratedAt('');

        try {
            // Chamada para a rota de API do Next.js
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

            setPolicy(data.policyContent);
            setGeneratedAt(data.generatedAt);
            setStep(STEPS.length); // Vai para o último passo (Revisão e Geração)

        } catch (err) {
            console.error('Erro na Geração:', err);
            setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido ao gerar a política.');
        } finally {
            setLoading(false);
        }
    };
    
    // --- FUNÇÃO DE DOWNLOAD ---
    const handleDownload = () => {
        if (!policy) return;

        const blob = new Blob([policy], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${formData.nomeDoProjeto.replace(/\s/g, '_')}_Termos_e_Politicas.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // --- FUNÇÃO DE COPIAR ---
    const handleCopy = () => {
        if (!policy) return;
        navigator.clipboard.writeText(policy)
            .then(() => {
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000); // Mostra o feedback por 2s
            })
            .catch(() => alert('Erro ao copiar documento.'));
    };
    
    // --- RENDERIZAÇÃO CONDICIONAL DO CONTEÚDO ---
    const renderStepContent = useMemo(() => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-6">
                        <p className="text-gray-400">
                            Bem-vindo ao Gerador de Documentos Jurídicos utilizando o Gemini. 
                            Responda a cinco passos simples e obtenha seus Termos de Uso e Política de Privacidade unificados, personalizados e com foco na conformidade legal.
                        </p>
                        <ul className="text-gray-300 space-y-3 list-disc list-inside">
                            <li>🎯 Geração de Termos de Uso e Política de Privacidade em um único arquivo.</li>
                            <li>⚖️ Conformidade com LGPD (Brasil), GDPR (UE) e outras jurisdições.</li>
                            <li>✍️ Saída estritamente em formato Markdown, pronta para o seu site.</li>
                        </ul>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-6">
                        <InputField
                            label="Nome do Projeto / Serviço (Obrigatório)"
                            name="nomeDoProjeto"
                            value={formData.nomeDoProjeto}
                            onChange={handleFormChange as (e: ChangeEvent<HTMLInputElement>) => void}
                            placeholder="Ex: Gemini SaaS App"
                        />
                        <InputField
                            label="Nome da Empresa / Pessoa Responsável (Obrigatório)"
                            name="nomeDoResponsavel"
                            value={formData.nomeDoResponsavel}
                            onChange={handleFormChange as (e: ChangeEvent<HTMLInputElement>) => void}
                            placeholder="Ex: Tech Solutions Ltda."
                        />
                        <SelectField
                            label="Modelo de Software"
                            name="modeloSoftware"
                            value={formData.modeloSoftware}
                            options={[
                                { value: 'SAAS', label: 'SaaS (Software as a Service)' },
                                { value: 'OPENSOURCE', label: 'Open Source (Sem Fins Lucrativos)' },
                                { value: 'E-COMMERCE', label: 'E-commerce / Loja Virtual' },
                                { value: 'APP_MOBILE', label: 'App Mobile' }
                            ]}
                            onChange={handleFormChange as (e: ChangeEvent<HTMLSelectElement>) => void}
                        />
                        <SelectField
                            label="Tipo de Monetização"
                            name="tipoMonetizacao"
                            value={formData.tipoMonetizacao}
                            options={[
                                { value: 'FREEMIUM', label: 'Freemium (Grátis com Opções Pagas)' },
                                { value: 'ASSINATURA', label: 'Assinatura Paga (Subscription)' },
                                { value: 'GRATUITO_ADS', label: 'Gratuito com Publicidade (Ads)' },
                                { value: 'PAGO', label: 'Compra Única (Premium)' }
                            ]}
                            onChange={handleFormChange as (e: ChangeEvent<HTMLSelectElement>) => void}
                        />
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-6">
                        <SelectField
                            label="Linguagem de Código Predominante (Influencia a Licença)"
                            name="linguagem"
                            value={formData.linguagem}
                            options={languageOptions}
                            onChange={handleFormChange as (e: ChangeEvent<HTMLSelectElement>) => void}
                        />
                        <SelectField
                            label="Licença de Código (Para Referência em Termos)"
                            name="licencaCodigo"
                            value={formData.licencaCodigo}
                            options={[
                                { value: 'MIT', label: 'MIT (Permissiva, Curta)' },
                                { value: 'GPLv3', label: 'GPLv3 (Copyleft Forte)' },
                                { value: 'APACHE2', label: 'Apache 2.0 (Permissiva, Longa)' },
                                { value: 'PROPRIETARIA', label: 'Proprietária (Default para SaaS)' }
                            ]}
                            onChange={handleFormChange as (e: ChangeEvent<HTMLSelectElement>) => void}
                        />
                        <CheckboxField
                            label="Coleta de Dados Pessoais?"
                            description="Nome, E-mail, IP, etc. (Quase todo serviço coleta)"
                            name="coletaDadosPessoais"
                            checked={formData.coletaDadosPessoais}
                            onChange={handleFormChange as (e: ChangeEvent<HTMLInputElement>) => void}
                        />
                        <CheckboxField
                            label="Coleta de Dados Sensíveis?"
                            description="Saúde, origem racial, dados biométricos. (Requer maior cuidado legal)"
                            name="coletaDadosSensivel"
                            checked={formData.coletaDadosSensivel}
                            onChange={handleFormChange as (e: ChangeEvent<HTMLInputElement>) => void}
                        />
                        <CheckboxField
                            label="Público Alvo Inclui Crianças?"
                            description="Se o seu serviço é voltado ou acessível a menores de 13 anos. (Implica em regras severas como COPPA/GDPR)"
                            name="publicoAlvoCriancas"
                            checked={formData.publicoAlvoCriancas}
                            onChange={handleFormChange as (e: ChangeEvent<HTMLInputElement>) => void}
                        />
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-6">
                        <SelectField
                            label="Jurisdição Legal Principal (Define a Base Legal)"
                            name="jurisdicao"
                            value={formData.jurisdicao}
                            options={jurisdictionOptions}
                            onChange={handleFormChange as (e: ChangeEvent<HTMLSelectElement>) => void}
                        />
                        {/* Campo de IDIOMA */}
                        <SelectField
                            label="Idioma do Documento Gerado"
                            name="idiomaDoDocumento"
                            value={formData.idiomaDoDocumento}
                            options={idiomOptions}
                            onChange={handleFormChange as (e: ChangeEvent<HTMLSelectElement>) => void}
                        />
                         <InputField
                            label="E-mail de Contato do Encarregado de Dados (DPO/POC)"
                            name="contatoDPO"
                            value={formData.contatoDPO}
                            onChange={handleFormChange as (e: ChangeEvent<HTMLInputElement>) => void}
                            placeholder="dpo@empresa.com"
                            type="email"
                        />
                        <TextAreaField
                            label="Finalidade/Objetivo da Coleta de Dados"
                            name="objetivoDaColeta"
                            value={formData.objetivoDaColeta}
                            onChange={handleFormChange as (e: ChangeEvent<HTMLTextAreaElement>) => void}
                            placeholder="Ex: 'Fornecer o serviço, melhorar a experiência do usuário, enviar comunicações de marketing.'"
                        />
                        <TextAreaField
                            label="Países para Transferência Internacional de Dados (Se aplicável)"
                            name="paisesTransferencia"
                            value={formData.paisesTransferencia}
                            onChange={handleFormChange as (e: ChangeEvent<HTMLTextAreaElement>) => void}
                            placeholder="Ex: 'Estados Unidos (AWS), Irlanda (Stripe). Deixe em branco se não transfere.'"
                        />
                    </div>
                );
            case 5:
                return (
                    <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-green-400">Dados para Geração:</h3>
                        <div className="bg-gray-800 p-4 rounded-lg text-sm text-gray-300 space-y-2">
                            <p><strong>Projeto:</strong> {formData.nomeDoProjeto || 'Não informado'}</p>
                            <p><strong>Responsável:</strong> {formData.nomeDoResponsavel || 'Não informado'}</p>
                            <p><strong>Base Legal:</strong> {getJurisdicaoLabel(formData.jurisdicao)}</p>
                            <p><strong>Idioma de Saída:</strong> {getIdiomaLabel(formData.idiomaDoDocumento)}</p>
                            <p><strong>Coleta Dados Pessoais:</strong> {formData.coletaDadosPessoais ? 'Sim' : 'Não'}</p>
                            <p><strong>Dados Sensíveis:</strong> {formData.coletaDadosSensivel ? 'Sim' : 'Não'}</p>
                            <p><strong>DPO:</strong> {formData.contatoDPO || 'Não informado'}</p>
                        </div>

                        {/* Botão de Geração (CRITICAMENTE CORRIGIDO) */}
                        {!policy && (
                            <button
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

                        {/* Área de Erro */}
                        {error && (
                            <div className="p-3 bg-red-800 text-white rounded-lg text-sm">
                                <strong>Erro:</strong> {error}
                            </div>
                        )}

                        {/* Visualizador de Política */}
                        {policy && (
                            <div className="mt-8">
                                <h3 className="text-xl font-semibold text-green-400 mb-4">
                                    Documento Gerado <CheckCircle className="inline h-5 w-5 ml-2" />
                                </h3>
                                
                                <p className="text-gray-400 text-sm mb-4">Última Atualização: {generatedAt}</p>

                                {/* Botões de Ação */}
                                <div className="flex space-x-4 mb-4">
                                    <button
                                        onClick={handleCopy}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition duration-150 ${
                                            copySuccess
                                                ? 'bg-green-600 text-white'
                                                : 'bg-gray-700 hover:bg-gray-600 text-white'
                                        }`}
                                    >
                                        {copySuccess ? (
                                            <span className="flex items-center"><CheckCircle className="h-4 w-4 mr-2" /> Copiado!</span>
                                        ) : (
                                            <span className="flex items-center"><Clipboard className="h-4 w-4 mr-2" /> Copiar Markdown</span>
                                        )}
                                    </button>
                                    <button
                                        onClick={handleDownload}
                                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition duration-150"
                                    >
                                        Baixar (.md)
                                    </button>
                                </div>

                                {/* Conteúdo da Política (Simples) */}
                                <div 
                                    className="p-6 bg-gray-900 border border-gray-700 rounded-lg whitespace-pre-wrap text-sm text-gray-200 overflow-x-auto"
                                    // Renderiza o markdown de forma crua, sem biblioteca externa
                                >
                                    {policy}
                                </div>
                            </div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    }, [step, formData, policy, loading, error, generatedAt, copySuccess, handleFormChange]); // Incluído handleFormChange na dependência

    // --- RENDERIZAÇÃO PRINCIPAL DO LAYOUT ---
    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-8">
            <header className="w-full max-w-4xl text-center mb-8">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-green-500">
                    PolicyGen 
                    <span className="text-xl font-normal text-gray-400"> powered by Gemini</span>
                </h1>
                <p className="text-gray-400 mt-2">Geração de Termos de Uso e Privacidade com foco legal.</p>
            </header>

            <main className="w-full max-w-4xl bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl">
                {/* Indicador de Passo */}
                <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
                    {STEPS.map((s) => {
                        const isCurrent = s.id === step;
                        const isCompleted = s.id < step || (step === STEPS.length && policy);
                        const IconComponent = s.icon;

                        return (
                            <div key={s.id} className="text-center relative flex-1">
                                {/* Círculo e Ícone */}
                                <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center transition duration-300 ${
                                    isCurrent 
                                        ? 'bg-green-600 ring-4 ring-green-800' 
                                        : isCompleted 
                                        ? 'bg-green-500' 
                                        : 'bg-gray-600'
                                }`}>
                                    <IconComponent className="h-5 w-5 text-white" />
                                </div>
                                {/* Linha Divisória (se não for o último) */}
                                {s.id < STEPS.length && (
                                    <div className={`absolute top-1/2 left-[calc(50%+20px)] w-[calc(100%-40px)] h-0.5 transform -translate-y-1/2 z-0 ${
                                        isCompleted ? 'bg-green-500' : 'bg-gray-600'
                                    }`} />
                                )}
                                {/* Nome do Passo */}
                                <p className={`mt-2 text-xs sm:text-sm font-medium ${isCurrent ? 'text-green-400' : 'text-gray-400'} hidden sm:block`}>
                                    {s.name}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Título do Passo */}
                <h2 className="text-2xl font-bold mb-6 text-white">
                    {STEP_TITLES[step as keyof typeof STEP_TITLES]}
                </h2>

                {/* Conteúdo do Passo */}
                <form onSubmit={step === STEPS.length && !policy ? handleGenerate : (e) => e.preventDefault()} className="space-y-8">
                    {renderStepContent}

                    {/* Botões de Navegação */}
                    <div className="flex justify-between border-t border-gray-700 pt-4 mt-8">
                        {step > 1 && step < STEPS.length && (
                            <button
                                type="button"
                                onClick={prevStep}
                                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition duration-150 flex items-center"
                            >
                                <ArrowRight className="h-4 w-4 rotate-180 mr-2" /> Anterior
                            </button>
                        )}
                        
                        {step === 1 && (
                             <button
                                type="button"
                                onClick={nextStep}
                                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition duration-150 flex items-center ml-auto"
                            >
                                Começar <ArrowRight className="h-4 w-4 ml-2" />
                            </button>
                        )}

                        {step > 1 && step < STEPS.length - 1 && (
                             <button
                                type="button"
                                onClick={nextStep}
                                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition duration-150 flex items-center ml-auto"
                            >
                                Próximo <ArrowRight className="h-4 w-4 ml-2" />
                            </button>
                        )}
                        
                        {step === STEPS.length - 1 && !policy && (
                            <button
                                type="submit"
                                // O botão de submit já está definido no renderStepContent, 
                                // mas mantemos este aqui para garantir a navegação. 
                                // O submit fará a chamada handleGenerate se os dados estiverem ok.
                                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition duration-150 flex items-center ml-auto"
                            >
                                Ir para Geração <ArrowRight className="h-4 w-4 ml-2" />
                            </button>
                        )}

                        {step === STEPS.length && policy && (
                            <button
                                type="button"
                                onClick={() => setPolicy('')}
                                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition duration-150 flex items-center ml-auto"
                            >
                                <ArrowRight className="h-4 w-4 rotate-180 mr-2" /> Gerar Nova Política
                            </button>
                        )}
                    </div>
                </form>
            </main>
        </div>
    );
}