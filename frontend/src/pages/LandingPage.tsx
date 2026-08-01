import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Sprout, Building2, Sun, FileText, X, BookOpen, Mic, Globe } from 'lucide-react';

export default function LandingPage() {
    const navigate = useNavigate();
    const [isManualOpen, setIsManualOpen] = useState(false);

    const handleServiceClick = (query: string) => {
        navigate('/chat', { state: { initialQuery: query } });
    };

    return (
        <div className="min-h-screen bg-orange-50/30 font-sans text-gray-700 flex flex-col">

            {/* Hero Section */}
            <div className="relative bg-white border-b border-orange-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 grid lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 border border-green-100 text-green-700 text-xs font-bold mb-6">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            AI-POWERED GOVERNMENT ASSISTANT
                        </div>
                        <h2 className="text-4xl sm:text-5xl font-extrabold text-green-900 tracking-tight leading-tight mb-6">
                            Empowering Farmers with <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-700">
                                Digital Intelligence
                            </span>
                        </h2>
                        <p className="text-lg text-green-800/80 mb-8 leading-relaxed max-w-lg font-medium">
                            Access real-time crop advisory, pest control solutions, and government scheme information in your local language.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                to="/chat"
                                className="inline-flex justify-center items-center px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 text-lg border-2 border-white/20"
                            >
                                Launch Assistant <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                            <button
                                onClick={() => setIsManualOpen(true)}
                                className="inline-flex justify-center items-center px-8 py-4 bg-white border-2 border-green-600 text-green-700 font-bold rounded-lg hover:bg-green-50 transition-colors shadow-sm"
                            >
                                <BookOpen className="mr-2 h-5 w-5" />
                                User Manual
                            </button>
                        </div>
                    </div>

                    {/* Hero Image/Graphic */}
                    <div className="relative lg:h-[500px] flex items-center justify-center bg-gradient-to-br from-green-50 to-orange-50 rounded-2xl border-2 border-white shadow-xl p-8 overflow-hidden transform hover:scale-[1.01] transition-transform duration-500">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] opacity-10"></div>
                        <div className="relative text-center">
                            <div className="text-9xl mb-4 opacity-100 drop-shadow-xl animate-bounce-slow">👨‍🌾</div>
                            <div className="text-xl font-bold bg-white/95 px-8 py-3 rounded-full shadow-lg backdrop-blur-sm border border-green-100 flex items-center gap-2">
                                <span className="text-orange-600">Technology for </span>
                                <span className="text-green-700 text-2xl">అన్నదాత</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Services Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-12">
                    <h3 className="text-2xl font-bold text-green-900">Digital Services</h3>
                    <div className="w-16 h-1 bg-gradient-to-r from-orange-400 to-orange-600 mx-auto mt-2 rounded-full"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { icon: <Sprout className="h-8 w-8 text-green-600" />, title: "Crop Advisory", desc: "Scientific sowing and harvesting guide", query: "Give me crop advisory for rice sowing." },
                        { icon: <FileText className="h-8 w-8 text-blue-600" />, title: "Govt Schemes", desc: "PM-KISAN, Fasal Bima Yojna & more", query: "List important government schemes for farmers." },
                        { icon: <Sun className="h-8 w-8 text-orange-500" />, title: "Weather", desc: "District-wise rainfall & temperature", query: "What is the weather forecast for agriculture?" },
                        { icon: <Building2 className="h-8 w-8 text-purple-600" />, title: "Market Prices", desc: "Real-time Mandi rates (e-NAM)", query: "Show me current market prices for crops." }
                    ].map((service, idx) => (
                        <div
                            key={idx}
                            onClick={() => handleServiceClick(service.query)}
                            className="bg-white p-6 rounded-xl border border-green-100 hover:border-orange-400 hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-orange-100 to-transparent -mr-8 -mt-8 rounded-full opacity-50"></div>
                            <div className="mb-4 bg-green-50 p-3 rounded-lg w-fit group-hover:bg-orange-50 transition-colors shadow-sm">
                                {service.icon}
                            </div>
                            <h4 className="font-bold text-green-900 mb-2 text-lg">{service.title}</h4>
                            <p className="text-sm text-gray-500 font-medium">{service.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Stats Section */}
            <div className="bg-gradient-to-b from-orange-50 to-white border-t border-orange-100 py-16">
                <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    <div className="p-6 bg-white rounded-xl shadow-md border-b-4 border-green-500 transform hover:scale-105 transition-transform">
                        <div className="text-4xl font-extrabold text-green-600 mb-1">11 Cr+</div>
                        <div className="text-xs text-green-800 uppercase tracking-widest font-bold">Farmers Registered</div>
                    </div>
                    <div className="p-6 bg-white rounded-xl shadow-md border-b-4 border-orange-500 transform hover:scale-105 transition-transform">
                        <div className="text-4xl font-extrabold text-orange-500 mb-1">24/7</div>
                        <div className="text-xs text-orange-800 uppercase tracking-widest font-bold">AI Support</div>
                    </div>
                    <div className="p-6 bg-white rounded-xl shadow-md border-b-4 border-blue-500 transform hover:scale-105 transition-transform">
                        <div className="text-4xl font-extrabold text-blue-600 mb-1">1000+</div>
                        <div className="text-xs text-blue-800 uppercase tracking-widest font-bold">Mandis Linked</div>
                    </div>
                    <div className="p-6 bg-white rounded-xl shadow-md border-b-4 border-purple-500 transform hover:scale-105 transition-transform">
                        <div className="text-4xl font-extrabold text-purple-600 mb-1">12</div>
                        <div className="text-xs text-purple-800 uppercase tracking-widest font-bold">Languages</div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-green-900 text-green-50 py-10 border-t-4 border-orange-500 mt-auto">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6 text-sm">
                    <div className="text-center md:text-left">
                        <p className="font-bold text-white text-lg mb-2 tracking-wide flex items-center gap-2">
                            🌱 KRISHISAHAY
                        </p>
                        <p className="opacity-80 max-w-xs">National Agriculture Portal dedicated to empowering Indian farmers with technology.</p>
                    </div>
                    <div className="flex gap-8 font-medium">
                        <a href="#" className="hover:text-white hover:text-orange-300 transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-white hover:text-orange-300 transition-colors">Terms of Use</a>
                        <a href="#" className="hover:text-white hover:text-orange-300 transition-colors">Disclaimer</a>
                        <a href="#" className="hover:text-white hover:text-orange-300 transition-colors">Contact Us</a>
                    </div>
                    <div className="text-right opacity-70 text-xs">
                        <p className="font-mono">Last Updated: {new Date().toLocaleDateString()}</p>
                        <p className="text-orange-200">Gov-Edition v2.5</p>
                    </div>
                </div>
            </footer>

            {/* USER MANUAL MODAL */}
            {isManualOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border-4 border-green-500 relative">
                        {/* Header */}
                        <div className="bg-green-600 p-6 flex justify-between items-center text-white">
                            <h3 className="text-2xl font-bold flex items-center gap-2">
                                <BookOpen className="h-6 w-6" /> User Manual & Guide
                            </h3>
                            <button onClick={() => setIsManualOpen(false)} className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                            <div className="space-y-4">
                                <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-xl border border-orange-100">
                                    <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                                        <Globe className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-lg">1. Select Language</h4>
                                        <p className="text-gray-600">Choose your preferred language (English, Hindi, or Telugu) from the top-right corner of the chat or the startup screen.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-4 bg-green-50 rounded-xl border border-green-100">
                                    <div className="bg-green-100 p-2 rounded-lg text-green-600">
                                        <Mic className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-lg">2. Speak or Type</h4>
                                        <p className="text-gray-600">Click the microphone icon to speak instantly in your language, or type your question about crops, weather, or schemes.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                        <Sprout className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-lg">3. Get Expert Advice</h4>
                                        <p className="text-gray-600">Receive instant, AI-verified answers. Audio will auto-play in your selected language for accessibility.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-100 p-4 rounded-lg text-sm text-gray-600 border border-gray-200">
                                <strong>Note:</strong> This portal is optimized for farmers. For emergency helplines, please dial 1551 (Kisan Call Center).
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setIsManualOpen(false)}
                                className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors shadow-md"
                            >
                                Got it, Thanks!
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
