import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, User, ArrowRight, Loader } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { addToast } = useToast();

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + '/user-dashboard',
                }
            });
            if (error) throw error;
        } catch (error) {
            addToast(error.message, 'error');
        }
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Domain Restriction Check for Signup
            if (!isLogin) {
                if (!email.endsWith('@gmail.com') && email !== 'schedule.manager4@gmail.com') {
                    throw new Error("Only @gmail.com emails are allowed for students.");
                }
            }

            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;

                // Role Redirect Logic
                if (email === 'schedule.manager4@gmail.com') {
                    navigate('/admin-dashboard');
                } else {
                    navigate('/user-dashboard');
                }
            } else {
                // 1. Sign Up
                // 1. Sign Up
                const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                            email: email,
                        },
                    },
                });
                if (signUpError) throw signUpError;

                // 2. Create Profile
                // Handled automatically by Supabase Trigger (on_auth_user_created)
                // Try to sync email immediately if session is available
                if (data?.session?.user) {
                    await supabase.from('profiles').update({ email: email }).eq('id', data.session.user.id);
                }

                addToast("Signup successful! Please check your email for verification.", 'success');
                setIsLogin(true);
            }
        } catch (error) {
            addToast(error.message, 'error');
        }
        setLoading(false);
    };

    return (
        <div className="auth-container">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass auth-card"
            >
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold mb-3 gradient-text">
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="text-gray-400 text-sm">
                        {isLogin ? 'Enter your credentials to access your account' : 'Join the community of Poornima Backbenchers'}
                    </p>
                </div>

                {/* Google Login Button */}
                <button
                    onClick={handleGoogleLogin}
                    className="google-btn w-full flex items-center justify-center gap-3 bg-white text-black font-medium py-3 rounded-lg mb-6 hover:bg-gray-100 transition-colors"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                    </svg>
                    Continue with Google
                </button>

                <div className="flex items-center justify-center gap-4 mb-6">
                    <div className="h-px bg-white-10 flex-1"></div>
                    <span className="text-gray-500 text-sm">OR</span>
                    <div className="h-px bg-white-10 flex-1"></div>
                </div>

                <form onSubmit={handleAuth} className="space-y-5">
                    {!isLogin && (
                        <div className="input-group">
                            <label className="block text-sm font-medium mb-1.5 text-gray-300">Full Name</label>
                            <div className="relative">
                                <User className="absolute right-3 top-3.5 text-gray-500" size={18} />
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="input-field pr-10 pl-4 w-full"
                                    placeholder="John Doe"
                                    required={!isLogin}
                                />
                            </div>
                        </div>
                    )}

                    <div className="input-group">
                        <label className="block text-sm font-medium mb-1.5 text-gray-300">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute right-3 top-3.5 text-gray-500" size={18} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field pr-10 pl-4 w-full"
                                placeholder="you@example.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="block text-sm font-medium mb-1.5 text-gray-300">Password</label>
                        <div className="relative">
                            <Lock className="absolute right-3 top-3.5 text-gray-500" size={18} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field pr-10 pl-4 w-full"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full flex justify-center items-center gap-2 group mt-6"
                    >
                        {loading ? (
                            <Loader className="animate-spin" size={20} />
                        ) : (
                            <>
                                {isLogin ? 'Sign In' : 'Sign Up'}
                                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-10 text-center pt-6 border-t border-white-10">
                    <p className="text-gray-400 text-sm">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-primary hover-text-primary font-semibold transition-colors ml-1"
                        >
                            {isLogin ? 'Sign Up' : 'Sign In'}
                        </button>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
