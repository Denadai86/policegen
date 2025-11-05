'use client'; 

import { useState } from 'react';

// --- 1. CONFIGURAÇÕES DE DADOS E OPÇÕES ---

// Lista de Linguagens/Tecnologias para o Select da Etapa 1
const languageOptions = [
  { value: 'javascript', label: 'JavaScript / TypeScript (React, Node, Next.js)' },
  { value: 'python', label: 'Python (Django, Flask)' },
  { value: 'java', label: 'Java (Spring, Android)' },
  { value: 'php', label: 'PHP (Laravel, WordPress)' },
  { value: 'go', label: 'Go (GoLang)' },
  { value: 'mobile_nativo', label: 'Mobile Nativo (Swift, Kotlin)' },
  { value: 'outra', label: 'Outra / Não listada' },
];

// Definição do tipo para os dados do formulário (FormData)
interface FormData {
  // ETAPA 1
  nomeDoProjeto: string;
  linguagem: string; 
  // ETAPA 2
  coletaDadosPessoais: boolean; 
  coletaDadosSensivel: boolean; 
  monetizacaoPorTerceiros: boolean; 
  publicoAlvoCriancas: boolean; 
  // ETAPA 3
  licencaCodigo: 'mit' | 'gpl3' | 'proprietaria' | ''; 
  modeloSoftware: 'saas' | 'open_source' | '';
  tipoMonetizacao: 'gratuito' | 'freemium' | 'pago' | ''; 
}

// --- 2. COMPONENTE AUXILIAR PARA CHECKBOX (Sim/Não) ---

interface QuestionCheckboxProps {
  label: string;
  name: keyof FormData; 
  checked: boolean;
  // A função de callback espera apenas um booleano como valor
  onChange: (field: keyof FormData, value: boolean) => void;
}

const QuestionCheckbox: React.FC<QuestionCheckboxProps> = ({ label, name, checked, onChange }) => {
  return (
    <div className="flex items-center justify-between p-4 my-3 bg-white border border-gray-200 rounded-lg shadow-sm">
      <label htmlFor={name} className="flex-1 text-base font-medium text-gray-800">
        {label}
      </label>
      <input
        type="checkbox"
        id={name}
        name={name}
        checked={checked}
        // Inverte o valor booleano ao clicar
        onChange={() => onChange(name, !checked)} 
        className="h-6 w-6 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 ml-4"
      />
    </div>
  );
};

// --- 3. O COMPONENTE PRINCIPAL DO FORMULÁRIO ---

export default function PolicyGenPage() {
  const totalSteps = 4;
  const [currentStep, setCurrentStep] = useState(1);
  
  const [formData, setFormData] = useState<FormData>({
    // Valores Iniciais
    nomeDoProjeto: '',
    linguagem: '',
    coletaDadosPessoais: false,
    coletaDadosSensivel: false,
    monetizacaoPorTerceiros: false,
    publicoAlvoCriancas: false,
    licencaCodigo: '',
    modeloSoftware: '',
    tipoMonetizacao: '',
  });

  // Função para avançar/voltar no formulário
  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Função para atualizar os dados do formulário (Aceita string OU boolean)
  const updateFormData = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Renderização Condicional da Etapa
  const renderStep = () => {
    switch (currentStep) {
      
      // --- ETAPA 1: INFORMAÇÕES BÁSICAS ---
      case 1:
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">Etapa 1: Informações Básicas</h2>
            <p className="text-gray-600 mb-6">Qual o nome do seu projeto e qual a linguagem principal?</p>
            
            {/* Campo Nome do Projeto */}
            <div className="mb-4">
              <label htmlFor="nomeDoProjeto" className="block text-sm font-medium text-gray-700">
                Nome do Projeto
              </label>
              <input
                type="text"
                id="nomeDoProjeto"
                value={formData.nomeDoProjeto}
                onChange={(e) => updateFormData('nomeDoProjeto', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                placeholder="Ex: PolicyGen SaaS"
              />
            </div>

            {/* Campo Linguagem Principal (SELECT) */}
            <div className="mb-4">
              <label htmlFor="linguagem" className="block text-sm font-medium text-gray-700">
                Linguagem / Tecnologia Principal
              </label>
              <select
                id="linguagem"
                value={formData.linguagem}
                onChange={(e) => updateFormData('linguagem', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white"
              >
                <option value="">Selecione a Tecnologia</option> 
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );

      // --- ETAPA 2: ESCOPO DO SERVIÇO E DADOS ---
      case 2:
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">Etapa 2: Escopo do Serviço e Dados</h2>
            <p className="text-gray-600 mb-6">Por favor, responda se o seu projeto realiza as seguintes atividades.</p>

            <QuestionCheckbox
              label="1. O projeto armazena dados de identificação pessoal? (Nome, E-mail, IP, Cookies, CPF, etc.)"
              name="coletaDadosPessoais"
              checked={formData.coletaDadosPessoais}
              // Cast necessário pois QuestionCheckbox espera um callback de 'boolean'
              onChange={updateFormData as (field: keyof FormData, value: boolean) => void}
            />

            <QuestionCheckbox
              label="2. O projeto armazena dados pessoais considerados Sensíveis? (Saúde, Biometria, Crenças, Orientação Sexual, etc.)"
              name="coletaDadosSensivel"
              checked={formData.coletaDadosSensivel}
              onChange={updateFormData as (field: keyof FormData, value: boolean) => void}
            />

            <QuestionCheckbox
              label="3. O projeto faz uso de serviços de terceiros para publicidade ou análise de dados? (Google Ads, Facebook Pixel, Google Analytics, etc.)"
              name="monetizacaoPorTerceiros"
              checked={formData.monetizacaoPorTerceiros}
              onChange={updateFormData as (field: keyof FormData, value: boolean) => void}
            />
            
            <QuestionCheckbox
              label="4. O público principal ou parte significativa do público-alvo são crianças e adolescentes?"
              name="publicoAlvoCriancas"
              checked={formData.publicoAlvoCriancas}
              onChange={updateFormData as (field: keyof FormData, value: boolean) => void}
            />
          </div>
        );

      // --- ETAPA 3: TERMOS DE USO E LICENÇA ---
      case 3:
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">Etapa 3: Termos de Uso e Licença</h2>
            <p className="text-gray-600 mb-6">Defina as condições de uso e o modelo de licenciamento do seu software.</p>
            
            {/* Pergunta 1: Licença de Código */}
            <div className="mb-4">
              <label htmlFor="licencaCodigo" className="block text-sm font-medium text-gray-700 mb-1">
                1. Qual licença se aplica ao código-fonte do projeto?
              </label>
              <select
                id="licencaCodigo"
                value={formData.licencaCodigo}
                onChange={(e) => updateFormData('licencaCodigo', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white"
              >
                <option value="">Selecione a Licença</option>
                <option value="mit">MIT (Permissiva, muito comum para Open Source)</option>
                <option value="gpl3">GPL v3 (Forte copyleft, exige que modificações sejam abertas)</option>
                <option value="proprietaria">Proprietária (Código fechado, uso restrito - comum em SaaS)</option>
              </select>
            </div>

            {/* Pergunta 2: Modelo de Software */}
            <div className="mb-4">
              <label htmlFor="modeloSoftware" className="block text-sm font-medium text-gray-700 mb-1">
                2. Qual o modelo de distribuição do software?
              </label>
              <select
                id="modeloSoftware"
                value={formData.modeloSoftware}
                onChange={(e) => updateFormData('modeloSoftware', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white"
              >
                <option value="">Selecione o Modelo</option>
                <option value="saas">SaaS (Software como Serviço, acesso via web/API)</option>
                <option value="open_source">Open Source Distribuído (Software instalado localmente/server próprio)</option>
              </select>
            </div>

            {/* Pergunta 3: Monetização */}
            <div className="mb-4">
              <label htmlFor="tipoMonetizacao" className="block text-sm font-medium text-gray-700 mb-1">
                3. O PolicyGen será monetizado de que forma?
              </label>
              <select
                id="tipoMonetizacao"
                value={formData.tipoMonetizacao}
                onChange={(e) => updateFormData('tipoMonetizacao', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white"
              >
                <option value="">Selecione o Tipo</option>
                <option value="gratuito">Gratuito (Sem custos futuros)</option>
                <option value="freemium">Freemium (Versão gratuita + recursos pagos)</option>
                <option value="pago">Pago (Assinatura ou Compra Única)</option>
              </select>
            </div>
          </div>
        );

      // --- ETAPA FINAL: REVISÃO E GERAÇÃO ---
      case totalSteps: 
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">Etapa Final: Revisão e Geração</h2>
            <p className="text-gray-600 mb-6">Confira suas respostas e gere sua política.</p>
            <div className="bg-gray-100 p-4 rounded-md">
              <h3 className="font-bold border-b pb-1 mb-2">Resumo (Etapa 1):</h3>
              <p>
                **Nome do Projeto:** {formData.nomeDoProjeto || 'Não fornecido'}
              </p>
              <p>
                **Linguagem:** {languageOptions.find(opt => opt.value === formData.linguagem)?.label || 'Não fornecida'}
              </p>

              <h3 className="font-bold border-b pt-3 pb-1 mb-2">Impacto Legal (Etapa 2):</h3>
              <p>Coleta Dados Pessoais: **{formData.coletaDadosPessoais ? 'SIM' : 'NÃO'}**</p>
              <p>Coleta Dados Sensíveis: **{formData.coletaDadosSensivel ? 'SIM' : 'NÃO'}**</p>
              <p>Usa Terceiros (Ads/Analytics): **{formData.monetizacaoPorTerceiros ? 'SIM' : 'NÃO'}**</p>
              <p>Público Crianças: **{formData.publicoAlvoCriancas ? 'SIM' : 'NÃO'}**</p>

              <h3 className="font-bold border-b pt-3 pb-1 mb-2">Termos e Licença (Etapa 3):</h3>
              <p>Licença de Código: **{formData.licencaCodigo || 'Não Informado'}**</p>
              <p>Modelo Software: **{formData.modeloSoftware || 'Não Informado'}**</p>
              <p>Tipo Monetização: **{formData.tipoMonetizacao || 'Não Informado'}**</p>
            </div>
            <button
              onClick={() => alert('Política Gerada!')}
              className="mt-6 w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              GERAR DOCUMENTO AGORA
            </button>
          </div>
        );
      default:
        return <div>Etapa Inválida</div>;
    }
  };

  // 4. Estrutura de Layout com Navegação
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-2xl bg-white p-8 rounded-xl shadow-2xl">
        <h1 className="text-3xl font-extrabold text-indigo-700 mb-6 border-b pb-2">
          PolicyGen
        </h1>

        {/* Indicador de Progresso */}
        <div className="mb-8">
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Etapa {currentStep} de {totalSteps}
          </p>
        </div>

        {/* Conteúdo da Etapa Atual */}
        <div className="min-h-[300px]">{renderStep()}</div>

        {/* Botões de Navegação */}
        <div className="flex justify-between pt-6 border-t mt-4">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              currentStep === 1
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
            }`}
          >
            &larr; Voltar
          </button>

          {currentStep < totalSteps ? (
            <button
              onClick={nextStep}
              className="py-2 px-4 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-colors"
            >
              Próxima &rarr;
            </button>
          ) : (
            // Espaço vazio para alinhar o botão "Voltar"
            <div /> 
          )}
        </div>
      </div>
    </div>
  );
}