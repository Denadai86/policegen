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
} from 'lucide-react'; 

// Importação CORRIGIDA: Usa o alias @/utils (como definimos) e a sintaxe está correta.
import type { FormData } from '@/utils/generatePolicy'; 
import { 
    generatePolicy, // Mantido para referência, mas não será usado (apenas para type safety)
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
    // ALTERAÇÃO CRÍTICA: PADRONIZANDO O IDIOMA DE SAÍDA PARA PORTUGUÊS (pt-br)
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

    // --- EFEITOS DE ESTADO (LOCAL STORAGE) ---
    useEffect(() => {
        // Carregar do Local Storage na montagem
        const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedData) {
            try {
                const parsedData = JSON.parse(savedData);
                setFormData(prev => ({ ...prev, ...parsedData }));
            } catch (e) {
                console.error("Erro ao carregar dados do Local Storage:", e);
                // Opcional: Limpar dados corrompidos
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
            // Asserção de tipo para garantir que o erro seja tratado como um objeto
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
            .then(() => alert('Documento copiado para a área de transferência!'))
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
                        {/* NOVO CAMPO DE IDIOMA - CRÍTICO PARA A NOVA ESTRUTURA */}
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
                        </div>

                        {!policy && (
                            <button
                                onClick={handleGenerate}
                                disabled={loading || !formData.nomeDoProjeto || !formData.nomeDoResponsavel}
                                className="w-full bg-green-600 hover:bg-green-700 text