// app/layout.tsx
import type { Metadata } from "next";
// Importa o componente Script do Next.js para carregar scripts externos
import Script from 'next/script';
// Importa o componente GoogleAnalytics do Next.js
import { GoogleAnalytics } from "@next/third-parties/google";
// Importação das fontes Geist para o projeto
import { Geist, Geist_Mono } from "next/font/google";
// Importação global de CSS
import "./globals.css";

// -------------------------------------------------------------
// CONSTANTES DE CONFIGURAÇÃO
// -------------------------------------------------------------
// Seu ID de Publicador do AdSense
const ADSENSE_PUB_ID = 'ca-pub-9532990788495378';
// Seu ID de Medição do Google Analytics
const GA_MEASUREMENT_ID = 'G-BZ5KYMZ57L';

// Configuração das fontes
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// -------------------------------------------------------------
// METADATA (CORRIGIDO)
// -------------------------------------------------------------
export const metadata: Metadata = {
  title: "Nome do Seu Projeto - Título Personalizado",
  description: "Descrição completa e otimizada para SEO do seu projeto Next.js.",
  
  // ⭐️ CORREÇÃO PARA VERIFICAÇÃO DO SITE:
  // Usa a chave 'verification' do Next.js App Router para injetar a tag no <head>.
  verification: {
    google: ADSENSE_PUB_ID, 
  },
};

// -------------------------------------------------------------
// COMPONENTE ROOTLAYOUT
// -------------------------------------------------------------
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Define o idioma principal e aplica as variáveis das fontes
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable}`}>
      
      {/* 1. Script principal do AdSense para ativar os Anúncios Automáticos */}
      <Script
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUB_ID}`}
        crossOrigin="anonymous"
        strategy="afterInteractive" // Carrega o script após o carregamento inicial da página
      />

      {/* Estrutura de corpo */}
      <body className="antialiased min-h-screen flex flex-col bg-gray-50 text-gray-900">
        
        {/* HEADER */}
        <header className="sticky top-0 z-50 bg-white shadow-md p-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <span className="text-xl font-bold text-indigo-600">Seu Logo</span>
            <nav>
              <a href="#" className="text-gray-600 hover:text-indigo-600 mx-3 transition-colors">Home</a>
              <a href="#" className="text-gray-600 hover:text-indigo-600 mx-3 transition-colors">Sobre</a>
              <a href="#" className="text-gray-600 hover:text-indigo-600 mx-3 transition-colors">Contato</a>
            </nav>
          </div>
        </header>

        {/* CONTEÚDO PRINCIPAL */}
        <main className="flex-grow max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
          {children}
        </main>
        
        {/* FOOTER */}
        <footer className="bg-gray-800 text-white p-6 mt-8">
          <div className="max-w-7xl mx-auto text-center text-sm">
            <p>&copy; {new Date().getFullYear()} Seu Projeto. Todos os direitos reservados.</p>
            <p className="mt-1">Implementado com Next.js e Tailwind CSS.</p>
          </div>
        </footer>

      </body>
      
      {/* 2. Google Analytics (Carregado na parte inferior do <body>) */}
      <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />

    </html>
  );
}