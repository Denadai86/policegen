'use client'; // Indica que este é um Componente Cliente, necessário para usar hooks como useState

import { useState } from 'react';

// 1. Defina o tipo para os dados do formulário
// Adicione mais campos à medida que o projeto avança
interface FormData {
  nomeDoProjeto: string;
  linguagem: string;
  // Outros campos virão aqui
}

// 2. O Componente Principal da sua página
export default function PolicyGenPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    nomeDoProjeto: '',
    linguagem: '',
  });

  const totalSteps = 4; // Exemplo: 4 etapas no total

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

  // Função para atualizar os dados do formulário
  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // 3. Renderização Condicional da Etapa
  const renderStep = () => {
    switch (currentStep) {
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
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">Etapa 2: Escopo do Serviço</h2>
            <p className="text-gray-600 mb-6">Esta será a próxima etapa de perguntas.</p>
            {/* Aqui virão os campos da Etapa 2 */}
            <div className="mb-4">
              <label htmlFor="linguagem" className="block text-sm font-medium text-gray-700">
                Linguagem Principal
              </label>
              <input
                type="text"
                id="linguagem"
                value={formData.linguagem}
                onChange={(e) => updateFormData('linguagem', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              />
            </div>
          </div>
        );
      case totalSteps: // Última etapa
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">Etapa Final: Revisão e Geração</h2>
            <p className="text-gray-600 mb-6">Confira suas respostas e gere sua política.</p>
            <div className="bg-gray-100 p-4 rounded-md">
              <p>
                **Nome do Projeto:** {formData.nomeDoProjeto || 'Não fornecido'}
              </p>
              <p>
                **Linguagem:** {formData.linguagem || 'Não fornecida'}
              </p>
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
        return <div>Etapa {currentStep}</div>;
    }
  };

  // 4. Estrutura de Layout com Navegação
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-2xl bg-white p-8 rounded-xl shadow-2xl">
        <h1 className="text-3xl font-extrabold text-indigo-700 mb-6 border-b pb-2">
          PolicyGen
        </h1>

        {/* Indicador de Progresso (Opcional, mas útil) */}
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
        <div className="min-h-[250px]">{renderStep()}</div>

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
            // Botão "Gerar" é tratado dentro da Etapa Final
            <div /> 
          )}
        </div>
      </div>
    </div>
  );
}