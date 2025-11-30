import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';
import { User, Phone, BookOpen, Calendar, Hash, Save, CheckCircle, AlertCircle, Camera, Lock, Award, Shield, Star, Zap } from 'lucide-react';

export default function UserProfile({ session }) {
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [message, setMessage] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        course: '',
        year: '',
        enrollment_no: '',
    });

    const [passwordData, setPasswordData] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        let isMounted = true;

        async function getProfile() {
            setLoading(true);
            try {
                const { user } = session;

                const { data, error } = await supabase
                    .from('profiles')
                    .select(`full_name, phone, course, year, enrollment_no, avatar_url`)
                    .eq('id', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.warn(error);
                }

                if (isMounted && data) {
                    setFormData({
                        full_name: data.full_name || '',
                        phone: data.phone || '',
                        course: data.course || '',
                        year: data.year || '',
                        enrollment_no: data.enrollment_no || '',
                    });
                    setAvatarUrl(data.avatar_url);
                }
            } catch (error) {
                console.error('Error loading user data!', error);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        getProfile();

        return () => { isMounted = false; };
    }, [session]);

    async function updateProfile(e) {
        e.preventDefault();
        setUpdating(true);
        setMessage(null);

        try {
            const { user } = session;

            const updates = {
                id: user.id,
                ...formData,
                avatar_url: avatarUrl,
                updated_at: new Date(),
            };

            const { error } = await supabase.from('profiles').upsert(updates);

            if (error) {
                throw error;
            }
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setUpdating(false);
        }
    }

    async function uploadAvatar(event) {
        try {
            setUploading(true);
            setMessage(null);

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const { user } = session;
            const filePath = `${user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, {
                    upsert: true
                });

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            setAvatarUrl(data.publicUrl);

            // Auto-save profile with new avatar
            await supabase.from('profiles').upsert({
                id: user.id,
                avatar_url: data.publicUrl,
                updated_at: new Date(),
            });

            setMessage({ type: 'success', text: 'Avatar uploaded successfully!' });
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setUploading(false);
        }
    }

    async function updatePassword(e) {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: "Passwords don't match" });
            return;
        }
        if (passwordData.newPassword.length < 6) {
            setMessage({ type: 'error', text: "Password must be at least 6 characters" });
            return;
        }

        setUpdating(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: passwordData.newPassword
            });

            if (error) throw error;
            setMessage({ type: 'success', text: 'Password updated successfully!' });
            setPasswordData({ newPassword: '', confirmPassword: '' });
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setUpdating(false);
        }
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="profile-container w-full max-w-1xl mx-auto pb-10">
            {/* Profile Header Banner */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="profile-header mb-20"
            >
                {/* Banner Content */}
            </motion.div>

            <div className="px-4">
                <div className="grid grid-cols-1 lg:grid-cols- gap-8">
                    {/* Left Column: Avatar & Badges (1 col) */}
                    <div className="space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center relative"
                        >
                            <div className="profile-avatar-wrapper">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="profile-avatar" />
                                ) : (
                                    <div className="profile-avatar flex items-center justify-center bg-dark text-gray-500">
                                        <User size={64} />
                                    </div>
                                )}
                                <label className="upload-btn">
                                    {uploading ? <div className="animate-spin h-4 w-4 border-2 border-dark border-t-transparent rounded-full" /> : <Camera size={18} />}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={uploadAvatar}
                                        disabled={uploading}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            <h2 className="text-3xl font-bold mb-1">{formData.full_name || 'Student Name'}</h2>
                            <p className="text-primary font-medium mb-4">{formData.course || 'Course'} • {formData.year || 'Year'}</p>

                            <div className="flex justify-center gap-2 mb-6">
                                <span className="status-badge badge-active">Active Student</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Middle Column: Personal Information Form (1 col) */}
                    <div className="space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="premium-card p-4 mt-4 h-full"
                        >
                            <h2 className="section-title">
                                <User className="text-primary" /> Personal Information
                            </h2>

                            <form onSubmit={updateProfile} className="space-y-6">
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="form-group">
                                        <label className="block text-sm font-medium mb-2 text-gray-300">Full Name</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                name="full_name"
                                                value={formData.full_name}
                                                onChange={handleChange}
                                                className="premium-input"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="block text-sm font-medium mb-2 text-gray-300">Phone Number</label>
                                        <div className="relative">
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                className="premium-input"
                                                placeholder="+91 9876543210"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="block text-sm font-medium mb-2 text-gray-300">Course</label>
                                        <div className="relative">
                                            <select
                                                name="course"
                                                value={formData.course}
                                                onChange={handleChange}
                                                className="premium-input appearance-none"
                                            >
                                                <option value="">Select Course</option>
                                                <option value="BCA">BCA</option>
                                                <option value="B.Tech">B.Tech</option>
                                                <option value="BBA">BBA</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="block text-sm font-medium mb-2 text-gray-300">Year</label>
                                        <div className="relative">
                                            <select
                                                name="year"
                                                value={formData.year}
                                                onChange={handleChange}
                                                className="premium-input appearance-none"
                                            >
                                                <option value="">Select Year</option>
                                                <option value="1st Year">1st Year</option>
                                                <option value="2nd Year">2nd Year</option>
                                                <option value="3rd Year">3rd Year</option>
                                                <option value="4th Year">4th Year</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="block text-sm font-medium mb-2 text-gray-300">Enrollment Number</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                name="enrollment_no"
                                                value={formData.enrollment_no}
                                                onChange={handleChange}
                                                className="premium-input"
                                                placeholder="e.g., 2023BCA001"
                                                style={{ marginBottom: "1.5rem" }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        type="submit"
                                        disabled={updating}
                                        className="btn-primary w-full py-3 rounded-lg shadow-lg shadow-primary/20"
                                    >
                                        {updating ? 'Saving Changes...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>

                    {/* Right Column: Security & Status (1 col) */}
                    <div className="space-y-8">
                        {/* <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="premium-card p-6"
                        >
                            <h3 className="section-title">
                                <Award className="text-yellow-400" /> Achievements
                            </h3>
                            <div className="grid grid-cols-2 lg:flex lg:flex-rows gap-4">
                                <div className="badge-premium">
                                    <span className="badge-icon">🎓</span>
                                    <p className="text-xs font-bold text-white">Early Bird</p>
                                    <p className="text-[10px] text-gray-400">Joined Early</p>
                                </div>
                                <div className="badge-premium opacity-50 grayscale">
                                    <span className="badge-icon">📚</span>
                                    <p className="text-xs font-bold text-white">Scholar</p>
                                    <p className="text-[10px] text-gray-400">Top Grades</p>
                                </div>
                                <div className="badge-premium opacity-50 grayscale">
                                    <span className="badge-icon">🔥</span>
                                    <p className="text-xs font-bold text-white">Streak</p>
                                    <p className="text-[10px] text-gray-400">7 Day Streak</p>
                                </div>
                                <div className="badge-premium opacity-50 grayscale">
                                    <span className="badge-icon">⭐</span>
                                    <p className="text-xs font-bold text-white">Elite</p>
                                    <p className="text-[10px] text-gray-400">Top 10%</p>
                                </div>
                            </div>
                        </motion.div> */}

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="premium-card mt-6 p-4"
                        >
                            <h2 className="section-title">
                                <Shield className="text-green-400" /> Security Settings
                            </h2>
                            <form onSubmit={updatePassword} className="space-y-6">
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="form-group">
                                        <label className="block text-sm font-medium mb-2 text-gray-300">New Password</label>
                                        <input
                                            type="password"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            className="premium-input"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="block text-sm font-medium mb-2 text-gray-300">Confirm Password</label>
                                        <input
                                            type="password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            className="premium-input"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end pt-4">
                                    <button
                                        type="submit"
                                        disabled={updating || !passwordData.newPassword}
                                        className="btn-primary w-full py-2 mt-6 rounded-lg shadow-lg shadow-primary/20"
                                    >
                                        Update Password
                                    </button>
                                </div>
                            </form>
                        </motion.div>

                        {message && (
                            <motion.div
                                initial={{ opacity: 0, y: 50, x: 0 }}
                                animate={{ opacity: 1, y: 0, x: 0 }}
                                exit={{ opacity: 0, y: 50 }}
                                className={`fixed bottom-5 right-5 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3 border backdrop-blur-md ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}
                            >
                                {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                <span className="font-medium">{message.text}</span>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
