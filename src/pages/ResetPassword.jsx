import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, Loader, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();
    const { addToast } = useToast();

    useEffect(() => {
        // Check if we have a valid session (link clicked)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                // If no session, redirect to login
                // But sometimes the hash is processed by Supabase client slightly after mount
                // giving it a small delay or check URL hash
                const hash = window.location.hash;
                if (!hash || !hash.includes('type=recovery')) {
                    // navigate('/login');
                }
            }
        });
    }, [navigate]);

    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            addToast("Passwords do not match", 'error');
            return;
        }

        if (password.length < 6) {
            addToast("Password must be at least 6 characters", 'error');
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            setSuccess(true);
            addToast("Password updated successfully!", 'success');

            // Redirect after a short delay
            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (error) {
            addToast(error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="auth-container">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass auth-card text-center"
                >
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                            <CheckCircle className="text-green-500" size={32} />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Password Reset!</h2>
                    <p className="text-gray-400 mb-8">
                        Your password has been successfully updated. You will be redirected to the login page shortly.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="btn-primary w-full"
                    >
                        Go to Login Now
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass auth-card"
            >
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold mb-3 gradient-text">
                        Set New Password
                    </h2>
                    <p className="text-gray-400 text-sm">
                        Enter your new password below to access your account.
                    </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-5">
                    <div className="input-group">
                        <label className="block text-sm font-medium mb-1.5 text-gray-300">New Password</label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-300 transition-colors focus:outline-none"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field pr-10 pl-4 w-full"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="block text-sm font-medium mb-1.5 text-gray-300">Confirm Password</label>
                        <div className="relative">
                            <Lock className="absolute right-3 top-3.5 text-gray-500" size={18} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
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
                                Reset Password
                                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                            </>
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
