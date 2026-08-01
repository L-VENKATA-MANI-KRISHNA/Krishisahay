import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Calendar, LogOut, Loader, BadgeCheck } from 'lucide-react';

interface UserProfile {
    id: string; // MongoDB ID
    name: string;
    phone: string;
    created_at: string;
}

export default function ProfilePage() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const response = await fetch('http://localhost:8000/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch profile');
            }

            const data = await response.json();
            setProfile(data);
        } catch (err: any) {
            setError(err.message);
            // If auth fails, may need to login again
            if (err.message.includes('401')) {
                handleLogout();
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user_name');
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader className="animate-spin h-8 w-8 text-green-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-red-500 font-bold">{error}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-green-50/30 p-4 sm:p-8">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-green-100">

                    {/* Header Banner */}
                    <div className="bg-gradient-to-r from-green-700 to-green-800 h-32 relative">
                        <div className="absolute -bottom-12 left-8">
                            <div className="w-24 h-24 bg-white rounded-full p-2 shadow-md">
                                <div className="w-full h-full bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                                    <User size={40} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Profile Content */}
                    <div className="pt-16 pb-8 px-8">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    {profile?.name}
                                    <BadgeCheck className="text-blue-500 h-5 w-5" />
                                </h1>
                                <p className="text-gray-500 text-sm">Valid Registered Farmer</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 bg-red-50 text-red-600 font-bold rounded-lg border border-red-100 hover:bg-red-100 flex items-center gap-2 transition-colors"
                            >
                                <LogOut size={18} /> Logout
                            </button>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 md:col-span-2">
                                <div className="flex items-center gap-3 mb-2 text-gray-500 text-sm font-bold uppercase tracking-wider">
                                    <BadgeCheck size={16} /> Registration ID
                                </div>
                                <div className="text-sm sm:text-lg font-mono font-bold text-gray-800 tracking-wide break-all">
                                    {profile?.id}
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="flex items-center gap-3 mb-2 text-gray-500 text-sm font-bold uppercase tracking-wider">
                                    <Phone size={16} /> Mobile Number
                                </div>
                                <div className="text-lg font-mono font-bold text-gray-800 tracking-wide">
                                    {profile?.phone}
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="flex items-center gap-3 mb-2 text-gray-500 text-sm font-bold uppercase tracking-wider">
                                    <Calendar size={16} /> Member Since
                                </div>
                                <div className="text-lg font-bold text-gray-800">
                                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                                </div>
                            </div>
                        </div>

                        {/* Government ID Card Style Badge */}
                        <div className="mt-8 p-6 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl border border-orange-200 flex items-center gap-4">
                            <img
                                src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
                                alt="Emblem"
                                className="h-12 w-auto opacity-80"
                            />
                            <div>
                                <h3 className="font-bold text-orange-800 text-sm uppercase">KrishiSahay Digital ID</h3>
                                <p className="text-xs text-orange-700/80 max-w-sm">
                                    This digital profile validates your access to national agricultural services and AI advisory.
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
