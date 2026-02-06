import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Leaf, MessageCircle, Home } from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();

    const navLinks = [
        { name: 'Home', path: '/', icon: <Home size={18} /> },
        { name: 'Chat Assistant', path: '/chat', icon: <MessageCircle size={18} /> },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="min-h-screen bg-neutral-900 text-neutral-100 font-sans selection:bg-green-500 selection:text-white">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-neutral-900/80 backdrop-blur-md border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="p-2 bg-green-600 rounded-lg group-hover:bg-green-500 transition-colors">
                                <Leaf className="text-white" size={24} />
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
                                KrishiSahay
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${isActive(link.path)
                                            ? 'bg-white/10 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]'
                                            : 'text-neutral-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {link.icon}
                                    {link.name}
                                </Link>
                            ))}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 text-neutral-400 hover:text-white transition-colors"
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {isMenuOpen && (
                    <div className="md:hidden bg-neutral-900 border-b border-white/10 animate-in slide-in-from-top-2">
                        <div className="px-4 pt-2 pb-4 space-y-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`block px-4 py-3 rounded-xl text-base font-medium transition-colors flex items-center gap-3 ${isActive(link.path)
                                            ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                                            : 'text-neutral-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {link.icon}
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </nav>

            {/* Main Content */}
            <main className="pt-16 min-h-[calc(100vh-80px)]">
                {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-white/10 bg-neutral-900 py-8 mt-auto">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-neutral-500 text-sm">
                        © {new Date().getFullYear()} KrishiSahay. Empowering Farmers with AI.
                    </p>
                </div>
            </footer>
        </div>
    );
}
