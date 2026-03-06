'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Jangan tampilkan navbar di halaman utama (login/landing)
  if (pathname === '/') {
    return null;
  }

  const navLinks = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Upload Data', href: '/upload' },
    { name: 'Validasi', href: '/validasi' },
    { name: 'Input Event', href: '/event' },
    { name: 'Input Kemitraan', href: '/kemitraan' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-emerald-700 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="font-bold text-lg tracking-wider flex items-center gap-2">
              <span>🌙</span> REF 2026
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href 
                    ? 'bg-emerald-900 text-white shadow-inner' 
                    : 'text-emerald-50 hover:bg-emerald-600'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button (Burger) */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-emerald-100 hover:bg-emerald-600 focus:outline-none transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-emerald-800 shadow-xl border-t border-emerald-700">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-3 rounded-md text-base font-medium transition-colors ${
                  pathname === link.href 
                    ? 'bg-emerald-900 text-white border-l-4 border-emerald-400' 
                    : 'text-emerald-100 hover:bg-emerald-700'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-3 rounded-md text-base font-medium text-red-300 hover:bg-red-800 hover:text-white transition-colors mt-4 border-t border-emerald-700"
            >
              &larr; Halaman Awal
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
