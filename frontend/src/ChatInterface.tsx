import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mic, Send, Volume2, VolumeX, Loader2, Image as ImageIcon, X, MessageSquare, Plus, Trash2, Menu } from 'lucide-react';

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    image?: string; // Base64 image data
}

interface ChatSession {
    id: string;
    title: string;
    updated_at: string;
}

declare global {
    interface Window {
        speechSynthesisTimeout?: any;
    }
}

export default function ChatInterface() {
    const location = useLocation();
    const navigate = useNavigate();
    // Initialize language from localStorage or default to 'en'
    const [language, setLanguage] = useState<'en' | 'hi' | 'te'>(() => {
        return (localStorage.getItem('kisan_lang') as 'en' | 'hi' | 'te') || 'en';
    });

    const updateLanguage = (lang: 'en' | 'hi' | 'te') => {
        setLanguage(lang);
        localStorage.setItem('kisan_lang', lang);
    };

    const [isMuted, setIsMuted] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const processedQuery = useRef<string | null>(null);

    const [messages, setMessages] = useState<Message[]>([]);
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [inputText, setInputText] = useState("");
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showVoiceSettings, setShowVoiceSettings] = useState(false); // Toggle for voice settings
    const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | null>(localStorage.getItem('kisan_voice_uri'));
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const lastSpokenMessageId = useRef<number | null>(null);
    const utteranceRefs = useRef<SpeechSynthesisUtterance[]>([]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Cleanup Audio on Unmount and Visibility Change
    // Cleanup Audio on Unmount and Visibility Change
    useEffect(() => {
        // Pre-load voices (fixes issue where first speak might use default voice)
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                setAvailableVoices(voices);
                console.log("Voices loaded:", voices.length);
            }
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                window.speechSynthesis.cancel();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            // window.speechSynthesis.cancel(); // Commented out to prevent aggressive cancellation during re-renders
            window.speechSynthesis.onvoiceschanged = null;
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // Fetch Sessions on Mount
    useEffect(() => {
        const fetchSessions = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                const res = await fetch('http://localhost:8000/chat/sessions', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setSessions(data);
                    // Automatically select latest session if available
                    if (data.length > 0 && !currentSessionId) {
                        loadSession(data[0].id);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch sessions", err);
            }
        };
        fetchSessions();
    }, []); // Run on mount

    const loadSession = async (sessionId: string) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        setIsLoading(true);
        setCurrentSessionId(sessionId);
        setHasStarted(true); // Assuming if loading a session, we bypassed start screen
        try {
            const res = await fetch(`http://localhost:8000/chat/history/${sessionId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const history = await res.json();
                setMessages(history.map((msg: any) => ({
                    id: new Date(msg.timestamp).getTime(),
                    text: msg.text,
                    sender: msg.sender,
                    timestamp: new Date(msg.timestamp),
                    image: msg.image
                })));
            }
        } catch (err) {
            console.error("Failed to load session history", err);
        } finally {
            setIsLoading(false);
            if (window.innerWidth < 768) setIsSidebarOpen(false); // Close sidebar on mobile
        }
    };

    const createNewChat = async () => {
        window.speechSynthesis.cancel(); // STOP SPEECH IMMEDIATELY
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch('http://localhost:8000/chat/session', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const newSession = await res.json();
                setSessions([newSession, ...sessions]); // Add to top
                setCurrentSessionId(newSession.id);
                setMessages([]);
                setHasStarted(false); // Show welcome screen for new chat
                setInputText("");
                if (window.innerWidth < 768) setIsSidebarOpen(false);
            }
        } catch (err) {
            console.error("Failed to create new session", err);
        }
    };

    const deleteSession = async (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        if (!window.confirm("Delete this chat?")) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            await fetch(`http://localhost:8000/chat/session/${sessionId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const updatedSessions = sessions.filter(s => s.id !== sessionId);
            setSessions(updatedSessions);

            if (currentSessionId === sessionId) {
                if (updatedSessions.length > 0) {
                    loadSession(updatedSessions[0].id);
                } else {
                    setCurrentSessionId(null);
                    setMessages([]);
                    setHasStarted(false);
                }
            }
        } catch (err) {
            console.error("Failed to delete session", err);
        }
    };

    const clearAllSessions = async () => {
        if (!window.confirm("Are you sure you want to delete ALL chat history? This cannot be undone.")) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const res = await fetch('http://localhost:8000/chat/sessions', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setSessions([]);
                setMessages([]);
                setCurrentSessionId(null);
                setHasStarted(false);
            }
        } catch (err) {
            console.error("Failed to clear all sessions", err);
        }
    };


    // Handle Auto-Query from Navigation (Landing Page)
    useEffect(() => {
        const query = location.state?.initialQuery;
        if (query && processedQuery.current !== query) {
            processedQuery.current = query; // Mark as processed

            // If we have a session, send to it. If not, create one first.
            const initQuery = async () => {
                let targetSessionId = currentSessionId;
                if (!targetSessionId) {
                    // Create session manually if none exists
                    await createNewChat();
                    // Wait a tick for state update or use returned ID (better)
                    // Re-fetching logic simplified here:
                    // Ideally createNewChat returns ID, we use it.
                }
                // We rely on state update for now, or improved logic:
                // For simplicity, let's assume if user lands with query, we force a new chat if currently empty
                // But simplified: Just handleSend(query) and let it fail/warn if no session?
                // Actually, handleSend needs a session ID.
                // Let's modify handleSend to auto-create session if null.
                handleSend(query);
            };

            initQuery();

            // Clear state cleanly using React Router
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state]);

    const toggleMute = () => {
        setIsMuted(!isMuted);
        window.speechSynthesis.cancel();
    };

    const speakText = (text: string) => {
        if (isMuted) return;

        // Cancel existing and any pending timeouts
        window.speechSynthesis.cancel();
        if (window.speechSynthesisTimeout) {
            clearTimeout(window.speechSynthesisTimeout);
        }

        const cleanText = text
            .replace(/[*#`_~>]/g, "")
            .replace(/https?:\/\/\S+/g, "link")
            .replace(/\s+/g, " ")
            .trim();

        if (!cleanText) return;

        // 1. Split by natural sentence boundaries (including Hindi/Telugu danda)
        const sentences = cleanText.match(/[^.!?|]+[.!?|]+(\s+|$)|[^.!?|]+$/g) || [cleanText];

        // 2. Accumulate into safety-sized chunks (~200 chars)
        // This is crucial: chunks > 15 seconds (approx 250-300 chars) WILL timeout in Chrome.
        // We stick to ~200 to be safe.
        const chunks: string[] = [];
        let currentBuffer = "";

        sentences.forEach(s => {
            const trimmed = s.trim();
            if (!trimmed) return;

            if (currentBuffer.length + trimmed.length < 220) {
                currentBuffer += trimmed + " ";
            } else {
                if (currentBuffer) chunks.push(currentBuffer.trim());
                currentBuffer = trimmed + " ";
            }
        });
        if (currentBuffer) chunks.push(currentBuffer.trim());

        utteranceRefs.current = [];

        // 3. Keep-Alive Timer (Resume Hack)
        // Chrome stops speech after ~15s. We need to reset this timer.
        const resumeInfinity = () => {
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
            window.speechSynthesisTimeout = setTimeout(resumeInfinity, 8000);
        };

        // 4. Native Queueing
        // Queue all chunks immediately to let the browser handle transitions (minimizes gaps)
        chunks.forEach((chunk, index) => {
            const utterance = new SpeechSynthesisUtterance(chunk);

            // Create a fresh voice instance for ensuring specific language selection
            const loadVoice = () => {
                // Use state voices if available, else try getVoices again
                const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
                let voice = null;

                // 1. Check for User Override first
                if (selectedVoiceURI) {
                    voice = voices.find(v => v.voiceURI === selectedVoiceURI) || null;
                }

                // 2. Fallback to Auto-Select if no override or override not found
                if (!voice) {
                    // Confirmed available voices from user test:
                    // Telugu: 'Microsoft శ్రుతి Online (Natural) - Telugu (India)'
                    // Hindi: 'Microsoft आरव Online (Natural) - Hindi (India)'
                    // English: 'Microsoft David - English (United States)' or any 'en-IN'

                    if (language === 'hi') {
                        // Try specific Microsoft Hindi voice first, then any Hindi
                        // User reported "Aarav" failing, trying "Swara" or "Ananya"
                        voice = voices.find(v => v.name.includes('Microsoft स्वरा') || v.name.includes('Microsoft Swara'))
                            || voices.find(v => v.name.includes('Microsoft अनन्या') || v.name.includes('Microsoft Ananya'))
                            || voices.find(v => v.lang.includes('hi'))
                            || null;
                    } else if (language === 'te') {
                        // Try specific Microsoft Telugu voice first, then any Telugu
                        voice = voices.find(v => v.name.includes('Microsoft శ్రుతి')) || voices.find(v => v.lang.includes('te')) || null;
                    } else {
                        // Try specific Microsoft English voice, then Indian English, then any English
                        voice = voices.find(v => v.name.includes('Microsoft David')) || voices.find(v => v.lang.includes('en-IN')) || voices.find(v => v.lang.includes('en-US')) || voices[0];
                    }
                }

                if (voice) {
                    utterance.voice = voice;
                    console.log(`Speaking chunk ${index + 1}/${chunks.length} with voice: ${voice.name} (${voice.lang})`);
                } else {
                    console.warn(`No specific voice found for language: ${language}. Using browser default.`);
                }
            }
            loadVoice();

            // Language Settings
            if (language === 'hi') {
                utterance.lang = 'hi-IN';
                utterance.rate = 1.0;
            } else if (language === 'te') {
                utterance.lang = 'te-IN';
                utterance.rate = 1.0;
            } else {
                utterance.lang = 'en-IN';
                utterance.rate = 1.1;
            }

            // Handle Timer Start/Stop
            if (index === 0) {
                utterance.onstart = () => {
                    if (window.speechSynthesisTimeout) clearTimeout(window.speechSynthesisTimeout);
                    window.speechSynthesisTimeout = setTimeout(resumeInfinity, 8000);
                };
            }

            // Stop timer on the very last chunk's end or error
            if (index === chunks.length - 1) {
                utterance.onend = () => {
                    if (window.speechSynthesisTimeout) clearTimeout(window.speechSynthesisTimeout);
                };
                utterance.onerror = (e) => {
                    console.error("TTS Error", e);
                    if (window.speechSynthesisTimeout) clearTimeout(window.speechSynthesisTimeout);
                };
            }

            utteranceRefs.current.push(utterance);
            window.speechSynthesis.speak(utterance);
        });
    };

    const handleStart = async () => {
        setHasStarted(true);
        // Ensure we have a session ID
        if (!currentSessionId) {
            await createNewChat();
            // Since createNewChat sets hasStarted to false for welcome screen, we need to override if user clicked Start.
            // But actually, just calling createNewChat is enough, user will see blank screen.
            // Ideally we want to start a session AND show welcome message.

            // Let's manually trigger welcome message flow if it's a fresh start
        }



        // Only add welcome text if messages are empty locally
        // Do not inject message manually. Let Empty State show suggestions.
        // setMessages([initialMsg]);
        // setTimeout(() => speakText(welcomeText), 100);
        // lastSpokenMessageId.current = 1;

        // We do NOT save welcome message to backend usually, or we can.
        // Let's not save it to avoid cluttering history with "Namaste" every time unless strict requirement.

    };

    // Auto-speak when a new bot message arrives
    useEffect(() => {
        if (!hasStarted) return;

        const lastMsg = messages[messages.length - 1];
        if (messages.length > 0 && lastMsg && lastMsg.sender === 'bot') {
            if (lastMsg.id !== lastSpokenMessageId.current) {
                speakText(lastMsg.text);
                lastSpokenMessageId.current = lastMsg.id;
            }
        }
    }, [messages, hasStarted, language]); // Re-run if language changes (though usually message triggers)

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSend = async (manualText?: string) => {
        const textToSend = manualText || inputText;
        if (!textToSend.trim() && !selectedImage) return;

        // Ensure Session Exists
        let targetId = currentSessionId;
        if (!targetId) {
            // Retrieve token to create session
            const token = localStorage.getItem('token');
            if (token) {
                const res = await fetch('http://localhost:8000/chat/session', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const sess = await res.json();
                    targetId = sess.id;
                    setCurrentSessionId(targetId);
                    setSessions(prev => [sess, ...prev]);
                } else {
                    alert("Failed to start chat session.");
                    return;
                }
            } else {
                alert("Please login.");
                return;
            }
        }

        const newMessage: Message = {
            id: Date.now(),
            text: textToSend || (selectedImage ? "[Image Query]" : ""),
            sender: 'user',
            timestamp: new Date(),
            image: selectedImage || undefined
        };
        setMessages(prev => [...prev, newMessage]);
        setInputText("");
        const imageToSend = selectedImage;
        setSelectedImage(null);
        setIsLoading(true);

        try {
            const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            // Save User Message (UPDATED: Path param)
            await fetch(`http://localhost:8000/chat/message/${targetId}`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    text: textToSend,
                    sender: 'user',
                    timestamp: new Date().toISOString(),
                    image: imageToSend
                })
            });

            // Send query to AI
            const response = await fetch('http://localhost:8000/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: textToSend,
                    image: imageToSend,
                    api_key: import.meta.env.VITE_GOOGLE_API_KEY,
                    language: language
                })
            });

            const data = await response.json();

            // Default error, the LLM usually handles errors politely in English if failed totally
            const botText = data.answer || "Support unavailable. Please check connection.";

            const botResponse: Message = {
                id: Date.now() + 1,
                text: botText,
                sender: 'bot',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botResponse]);

            // Save Bot Message (UPDATED: Path param)
            await fetch(`http://localhost:8000/chat/message/${targetId}`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    text: botText,
                    sender: 'bot',
                    timestamp: new Date().toISOString()
                })
            });

            // Refresh sessions to update title if it was "New Chat"
            // Optimization: locally update title or fetch updated list
            // Simple approach: re-fetch sessions quietly
            // fetchSessions(); // Can define fetchSessions outside useEffect to call here

        } catch (error) {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: "Network Error. Please check your internet.",
                sender: 'bot',
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleListening = () => {
        window.speechSynthesis.cancel();
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert("Browser does not support speech recognition.");
            return;
        }
        if (isListening) {
            setIsListening(false);
            return;
        }
        setIsListening(true);
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : 'en-IN';
        recognition.interimResults = false;
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInputText(transcript);
            setIsListening(false);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognition.start();
    };


    if (!hasStarted) {
        return (
            <div className="flex h-screen bg-gray-50 overflow-hidden">
                {/* Mobile Sidebar Toggle (Visible only when sidebar closed and on mobile) */}
                {/* Actually, we are in "Not Started" mode, so full screen is fine. 
                     BUT, we might want sidebar even here? 
                     Let's keep the existing Welcome Screen design but allow accessing history.
                 */}

                {/* Sidebar (Conditional Render or overlay) */}
                {/* For simplicity: User must click "Start" or load from sidebar to enter chat view.
                     Let's add a "History" button on Welcome Screen? 
                     OR just render the sidebar on the left even in welcome screen.
                 */}

                {/* Sidebar */}
                <div className={`fixed inset-y-0 left-0 bg-white shadow-xl z-50 w-64 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:block border-r border-gray-200 flex flex-col`}>
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="font-bold text-gray-700">History</h2>
                        <button onClick={createNewChat} className="p-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100" title="New Chat">
                            <Plus size={18} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {sessions.map(session => (
                            <div key={session.id}
                                onClick={() => loadSession(session.id)}
                                className={`p-3 rounded-lg cursor-pointer group flex justify-between items-center ${currentSessionId === session.id ? 'bg-orange-50 border-orange-200 border' : 'hover:bg-gray-50'}`}>
                                <div className="flex flex-col overflow-hidden">
                                    <span className={`text-sm font-medium truncate ${currentSessionId === session.id ? 'text-orange-900' : 'text-gray-700'}`}>
                                        {session.title || "New Chat"}
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                        {new Date(session.updated_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <button onClick={(e) => deleteSession(e, session.id)} className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                        {sessions.length === 0 && (
                            <div className="text-center text-gray-400 text-sm mt-10">No history yet</div>
                        )}
                    </div>
                    {/* Mobile Close */}
                    <div className="md:hidden p-4 border-t border-gray-100 text-center">
                        <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500 text-sm">Close Menu</button>
                    </div>
                </div>

                {/* Main Content (Welcome Screen) */}
                <div className="flex-1 flex flex-col relative w-full overflow-hidden">
                    {/* Mobile Hamburger */}
                    <div className="md:hidden absolute top-4 left-4 z-40">
                        <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-white shadow-md rounded-lg text-gray-600">
                            <Menu size={24} />
                        </button>
                    </div>

                    {/* Voice Settings Modal (Simple Inline) */}
                    {showVoiceSettings && (
                        <div className="absolute inset-0 bg-white z-50 p-6 overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold">Select Voice</h3>
                                <button onClick={() => setShowVoiceSettings(false)} className="p-2 bg-gray-100 rounded-full"><X size={20} /></button>
                            </div>
                            <button
                                onClick={() => {
                                    const voices = window.speechSynthesis.getVoices();
                                    setAvailableVoices(voices);
                                    if (voices.length === 0) alert("No voices detected. Restart browser?");
                                }}
                                className="mb-4 p-2 bg-blue-100 text-blue-700 rounded w-full"
                            >
                                Refresh Voices
                            </button>
                            <div className="space-y-2">
                                {availableVoices.map(v => (
                                    <div key={v.voiceURI} className={`p-3 border rounded flex justify-between items-center ${selectedVoiceURI === v.voiceURI ? 'bg-green-50 border-green-500' : ''}`}>
                                        <div>
                                            <div className="font-bold text-sm">{v.name}</div>
                                            <div className="text-xs text-gray-500">{v.lang} {v.default ? '(Default)' : ''}</div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    const u = new SpeechSynthesisUtterance("Testing voice 1 2 3");
                                                    u.voice = v;
                                                    window.speechSynthesis.cancel();
                                                    window.speechSynthesis.speak(u);
                                                }}
                                                className="p-1 px-3 bg-yellow-100 text-yellow-700 text-xs rounded"
                                            >
                                                Test
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedVoiceURI(v.voiceURI);
                                                    localStorage.setItem('kisan_voice_uri', v.voiceURI);
                                                    alert(`Selected: ${v.name}`);
                                                }}
                                                className="p-1 px-3 bg-green-100 text-green-700 text-xs rounded"
                                            >
                                                Select
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col h-full w-full items-center justify-center bg-orange-50 text-gray-800 space-y-8 p-4 text-center">
                        <div className="bg-white p-8 rounded-full shadow-2xl border-4 border-orange-500 animate-pulse">
                            <div className="text-8xl">🌾</div>
                        </div>
                        <div>
                            <h1 className="text-5xl font-extrabold text-green-700 tracking-tight">KrishiSahay</h1>
                            <p className="text-xl text-gray-600 mt-3 font-medium">Your AI Agriculture Companion • आपका कृषि साथी • మీ వ్యవసాయ మిత్రుడు</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl w-full">
                            <button onClick={() => { updateLanguage('en'); handleStart(); }} className="p-6 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 border-2 border-green-100 hover:border-green-500 group">
                                <div className="text-3xl mb-2">🇬🇧</div>
                                <div className="text-xl font-bold text-gray-800 group-hover:text-green-700">English</div>
                            </button>
                            <button onClick={() => { updateLanguage('hi'); handleStart(); }} className="p-6 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 border-2 border-orange-100 hover:border-orange-500 group">
                                <div className="text-3xl mb-2">🇮🇳</div>
                                <div className="text-xl font-bold text-gray-800 group-hover:text-orange-700">हिंदी</div>
                            </button>
                            <button onClick={() => { updateLanguage('te'); handleStart(); }} className="p-6 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 border-2 border-blue-100 hover:border-blue-500 group">
                                <div className="text-3xl mb-2">🌾</div>
                                <div className="text-xl font-bold text-gray-800 group-hover:text-blue-700">తెలుగు</div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 bg-white shadow-xl z-50 w-64 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:block border-r border-gray-200 flex flex-col`}>
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div className="flex items-center gap-2 font-bold text-gray-700">
                        <MessageSquare size={18} />
                        <span>History</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={clearAllSessions} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete All History">
                            <Trash2 size={18} />
                        </button>
                        <button onClick={createNewChat} className="p-2 bg-white text-green-700 shadow-sm rounded-lg hover:bg-green-50 border border-gray-200 transition-colors" title="New Chat">
                            <Plus size={18} />
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar bg-white">
                    {sessions.map(session => (
                        <div key={session.id}
                            onClick={() => loadSession(session.id)}
                            className={`p-3 rounded-lg cursor-pointer group flex justify-between items-center border transition-all ${currentSessionId === session.id ? 'bg-orange-50 border-orange-200 shadow-sm' : 'border-transparent hover:bg-gray-50 hover:border-gray-100'}`}>
                            <div className="flex flex-col overflow-hidden w-full">
                                <span className={`text-sm font-medium truncate ${currentSessionId === session.id ? 'text-orange-900' : 'text-gray-700'}`}>
                                    {session.title || "New Chat"}
                                </span>
                                <span className="text-[10px] text-gray-400 mt-0.5">
                                    {new Date(session.updated_at).toLocaleDateString()}
                                </span>
                            </div>
                            <button onClick={(e) => deleteSession(e, session.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded transition-all">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Main Area */}
            <div className="flex-1 flex flex-col h-full w-full relative">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between shadow-sm z-10 shrink-0">
                    <div className="flex items-center space-x-3">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-2 hover:bg-gray-100 rounded-full text-gray-600">
                            <Menu size={20} />
                        </button>
                        <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 hidden md:block">
                            <X size={20} />
                        </button>
                        <div>
                            <h2 className="font-bold text-gray-800 text-lg flex items-center">
                                🌱 KisanMitra
                                <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full animate-pulse">Online</span>
                            </h2>
                            <p className="text-xs text-gray-500">
                                {language === 'hi' ? 'हिंदी मोड' : language === 'te' ? 'తెలుగు మోడ్' : 'English Mode'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {/* Removed redundant New Chat Button in Header since it's in sidebar now, or keep for convenience */}
                        <button
                            onClick={createNewChat}
                            className="p-2 text-sm text-green-600 bg-green-50 hover:bg-green-100 rounded-lg mr-2 transition-colors hidden sm:block"
                        >
                            + New Chat
                        </button>

                        <button
                            onClick={toggleMute}
                            className={`p-2 rounded-full transition-colors ${isMuted ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' : 'bg-green-100 text-green-600 hover:bg-green-200'
                                }`}
                            title={isMuted ? "Unmute Voice" : "Mute Voice"}
                        >
                            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                        </button>

                        <button
                            onClick={() => {
                                console.log("Testing Audio...");
                                window.speechSynthesis.cancel();
                                const u = new SpeechSynthesisUtterance("Audio check one two three");
                                u.lang = 'en-US'; // Force English for test
                                u.onstart = () => console.log("Audio Test Started");
                                u.onend = () => console.log("Audio Test Ended");
                                u.onerror = (e) => console.error("Audio Test Error", e);

                                const voices = window.speechSynthesis.getVoices();
                                const voice = voices.find(v => v.name.includes('Microsoft David')) || voices.find(v => v.lang.includes('en-US'));
                                if (voice) u.voice = voice;

                                window.speechSynthesis.speak(u);
                            }}
                            className="p-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 text-xs font-bold hidden md:block"
                            title="Test System Audio"
                        >
                            Test Audio
                        </button>

                        <button
                            onClick={() => {
                                setShowVoiceSettings(!showVoiceSettings);
                                setAvailableVoices(window.speechSynthesis.getVoices());
                            }}
                            className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-xs font-bold"
                            title="Open Voice Settings"
                        >
                            ⚙️ Voice
                        </button>

                        <select
                            value={language}
                            onChange={(e) => updateLanguage(e.target.value as any)}
                            className="bg-gray-50 border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block p-2 outline-none"
                        >
                            <option value="en">English</option>
                            <option value="hi">हिंदी</option>
                            <option value="te">తెలుగు</option>
                        </select>
                    </div>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50 custom-scrollbar">
                    {messages.length === 0 && !isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-80 animate-fade-in p-4">
                            <div className="bg-white p-6 rounded-full shadow-lg mb-6 border-4 border-orange-100">
                                <span className="text-6xl">🌱</span>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">
                                {language === 'hi' ? 'नमस्ते! मैं आपकी कैसे मदद कर सकता हूँ?' :
                                    language === 'te' ? 'నమస్కారం! నేను మీకు ఎలా సహాయపడగలను?' :
                                        'Namaste! How can I help you?'}
                            </h3>
                            <p className="text-gray-500 max-w-md mb-8">
                                I am your AI Agriculture Assistant. Ask me about crops, weather, or government schemes.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                                {[
                                    { emoji: "🌧️", text: "Weather Forecast", query: "What is the weather forecast for today?" },
                                    { emoji: "🐛", text: "Pest Control", query: "How to control pests in cotton crop?" },
                                    { emoji: "🌾", text: "Crop Advisory", query: "Best time to sow wheat?" },
                                    { emoji: "📜", text: "Govt Schemes", query: "Tell me about PM Kisan Samman Nidhi." }
                                ].map((item, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSend(item.query)}
                                        className="p-4 bg-white border border-gray-200 rounded-xl hover:border-orange-400 hover:shadow-md transition-all text-left flex items-center gap-3 group"
                                    >
                                        <span className="text-2xl group-hover:scale-110 transition-transform">{item.emoji}</span>
                                        <span className="font-medium text-gray-700 group-hover:text-orange-600">{item.text}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-5 rounded-2xl shadow-sm relative text-lg ${msg.sender === 'user' ? 'bg-orange-50 text-gray-900 rounded-tr-none border border-orange-200' : 'bg-white text-gray-800 rounded-tl-none border border-gray-200'}`}>
                                    {msg.image && (
                                        <div className="mb-3 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                                            <img src={msg.image} alt="User Upload" className="max-w-full h-auto max-h-60 object-cover" />
                                        </div>
                                    )}
                                    <p className="leading-relaxed">{msg.text}</p>
                                    <div className={`flex items-center justify-between mt-3 text-xs font-medium ${msg.sender === 'user' ? 'opacity-60 text-orange-800' : 'text-gray-400'}`}>
                                        <span>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        {msg.sender === 'bot' && !isMuted && (
                                            <button onClick={() => speakText(msg.text)} className="ml-2 hover:text-green-600 transition-colors" title="Read Aloud">
                                                <Volume2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )))}

                    {isLoading && (
                        <div className="flex justify-start animate-fade-in">
                            <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-200 flex items-center gap-3 text-gray-500 shadow-sm">
                                <Loader2 className="animate-spin text-orange-500" size={20} />
                                <span className="font-medium text-sm">Processing Query...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] shrink-0">
                    {selectedImage && (
                        <div className="mb-3 flex justify-start items-center gap-2 animate-fade-in px-4">
                            <div className="relative">
                                <img src={selectedImage} alt="Preview" className="h-20 w-20 object-cover rounded-lg border-2 border-orange-500 shadow-md" />
                                <button
                                    onClick={() => setSelectedImage(null)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                            <span className="text-xs font-bold text-orange-600 animate-pulse">IMAGE ATTACHED</span>
                        </div>
                    )}

                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-300 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100 transition-all shadow-inner">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageSelect}
                            accept="image/*"
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className={`p-2 rounded-full transition-all ${selectedImage ? 'text-orange-600 bg-orange-100' : 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'}`}
                            title="Upload Image"
                        >
                            <ImageIcon size={24} />
                        </button>
                        <button
                            onClick={toggleListening}
                            className={`p-3 rounded-full transition-all ${isListening ? 'text-white bg-red-500 animate-pulse shadow-lg' : 'text-gray-500 hover:text-orange-600 hover:bg-orange-50'}`}
                            title="Speak query"
                        >
                            <Mic size={24} />
                        </button>
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => {
                                window.speechSynthesis.cancel();
                                setInputText(e.target.value);
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={isListening ? "Listening..." : "Type or Speak regarding your crop..."}
                            className="flex-1 bg-transparent border-none outline-none text-gray-800 placeholder-gray-400 text-lg"
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!inputText.trim() || isLoading}
                            className="p-3 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                            title="Send Message"
                        >
                            <Send size={24} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
