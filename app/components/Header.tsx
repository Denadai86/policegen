"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    // set initial
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg transition-all duration-300 ${scrolled ? 'backdrop-blur-sm' : ''}`}>
      <div className={`max-w-7xl mx-auto flex justify-between items-center transition-all duration-300 ${scrolled ? 'py-2 px-3' : 'py-4 px-4'}`}>
        <Link href="/" className="flex items-center space-x-3">
          <span className={`inline-block rounded-md bg-white/20 flex items-center justify-center text-white font-bold transition-all duration-300 ${scrolled ? 'w-7 h-7 text-sm' : 'w-8 h-8 text-base'}`}>
            AL
          </span>
          <span className={`font-semibold text-white transition-all duration-300 ${scrolled ? 'text-lg' : 'text-xl'}`}>AçãoLeve</span>
        </Link>

        <nav>
          <a href="https://acaoleve.com" className="text-white hover:text-indigo-200 mx-2 transition-colors">Home</a>
        </nav>
      </div>
    </header>
  );
}
