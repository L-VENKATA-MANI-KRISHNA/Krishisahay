import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, MessageCircle, Home, LogOut, LogIn, User } from 'lucide-react';
import NewsTicker from './NewsTicker';

// ... imports ...

export default function Layout({ children }: { children: React.ReactNode }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [user, setUser] = useState<{ name: string } | null>(null);
    const location = useLocation();
    const navigate = useNavigate();

    // Check auth on route change
    useEffect(() => {
        const token = localStorage.getItem('token');
        const name = localStorage.getItem('user_name');
        if (token && name) {
            setUser({ name });
        } else {
            setUser(null);
        }
    }, [location]);
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user_name');
        setUser(null);
        navigate('/login');
    };

    const navLinks = user ? [
        { name: 'Home', path: '/home', icon: <Home size={18} /> },
        { name: 'Chat Assistant', path: '/chat', icon: <MessageCircle size={18} /> },
        { name: 'My Profile', path: '/profile', icon: <User size={18} /> }
    ] : [];

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 font-sans selection:bg-green-500 selection:text-white flex flex-col">
            {/* Top Bar - Gov Style */}
            <div className="bg-white border-b border-gray-200 py-1 px-4 sm:px-8 flex justify-between items-center text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-widest z-50 relative">
                <span>Government of India</span>
                <span className="hidden sm:inline">Ministry of Agriculture & Farmers Welfare</span>
                <div className="flex gap-4">
                    <span>Skip to Main Content</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500"></span> Screen Reader Access</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="sticky top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b-4 border-green-600 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <Link to="/home" className="flex items-center gap-3 group">
                            <img
                                src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
                                alt="Emblem"
                                className="h-8 w-auto opacity-90"
                            />
                            <div className="flex flex-col">
                                <span className="text-xl font-bold leading-none">
                                    <span className="text-orange-600">Krishi</span><span className="text-green-600">Sahay</span>
                                </span>
                                <span className="text-[10px] font-bold text-gray-400 tracking-wider">NATIONAL PORTAL</span>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-2">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 flex items-center gap-2 border-2 ${isActive(link.path)
                                        ? 'bg-green-50 text-green-700 border-green-200 shadow-sm'
                                        : 'bg-transparent text-gray-500 border-transparent hover:text-orange-600 hover:bg-orange-50'
                                        }`}
                                >
                                    {link.icon}
                                    {link.name}
                                </Link>
                            ))}
                            <div className="ml-4 pl-4 border-l-2 border-gray-200 flex flex-col items-end">
                                <span className="text-[10px] font-bold text-gray-400">HELPLINE</span>
                                <span className="text-base font-bold text-green-600 leading-none">1551</span>
                            </div>

                            {/* Auth Buttons */}
                            {user ? (
                                <div className="ml-2 flex items-center gap-3">
                                    <div className="flex flex-col items-end hidden lg:flex">
                                        <span className="text-[10px] text-gray-400 font-bold">WELCOME</span>
                                        <span className="text-sm font-bold text-orange-600">{user.name}</span>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                        title="Logout"
                                    >
                                        <LogOut size={20} />
                                    </button>
                                </div>
                            ) : (
                                <Link
                                    to="/login"
                                    className="ml-2 px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm"
                                >
                                    <LogIn size={16} /> Login
                                </Link>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 text-gray-500 hover:text-green-600 transition-colors"
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {isMenuOpen && (
                    <div className="md:hidden bg-white border-b border-gray-100 animate-in slide-in-from-top-2 shadow-lg">
                        <div className="px-4 pt-2 pb-4 space-y-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`block px-4 py-3 rounded-xl text-base font-medium transition-colors flex items-center gap-3 ${isActive(link.path)
                                        ? 'bg-green-50 text-green-700 border border-green-200'
                                        : 'text-gray-500 hover:text-orange-600 hover:bg-orange-50'
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

            {/* News Ticker */}
            <NewsTicker />

            {/* Main Content */}
            <main className="flex-1">
                {children}
            </main>
        </div>
    );
}
