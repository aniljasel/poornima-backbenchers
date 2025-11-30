import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Phone, BookOpen, Calendar, Clock, Shield, Activity, Download, Check } from 'lucide-react';

export default function UserDetailsModal({ isOpen, onClose, user, onUpdateRole }) {
    if (!isOpen || !user) return null;

    const formatDate = (dateString) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleString();
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black-50 backdrop-blur-sm h-screen w-screen">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="glass-card w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-white-10"
                >
                    {/* Header - Fixed at top */}
                    <div className="p-5 border-b border-white-10 flex justify-between items-center bg-black-20 backdrop-blur-md shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center text-black text-xl font-bold shadow-lg shadow-primary/20" style={{ border: '1px solid var(--card-border)' }}>
                                {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white tracking-tight">{user.full_name || 'Unknown User'}</h2>
                                <p className="text-gray-400 text-sm flex items-center gap-2">
                                    <Mail size={12} /> {user.email || 'No Email'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white hover:bg-white-10 p-2 rounded-full transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                            {/* Left Column: Stats & Role */}
                            <div className="md:col-span-2 space-y-6">
                                {/* Status Card */}
                                <div className="bg-white-5 rounded-xl p-4 border border-white-5">
                                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Account Status</p>
                                    <div className="flex items-center justify-between mb-2">
                                        <span 
                                        style={{borderRadius: '4px'}}
                                        className={`px-2 py-1 rounded text-xs font-bold ${user.blocked ? 'bg-red-500-20 text-red-400' : 'bg-green-500-20 text-green-400'}`}>
                                            {user.blocked ? 'BLOCKED' : 'ACTIVE'}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            Joined: {new Date(user.created_at || Date.now()).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                {/* Role Management */}
                                <div className="bg-white-5 rounded-xl p-4 mt-4 border border-white-5">
                                    <h3 className="text-sm font-bold text-gray-200 mb-3 flex items-center gap-2">
                                        <Shield size={14} className="text-purple-400" /> Role Assignment
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['student', 'teacher', 'moderator', 'admin'].map((role) => {
                                            const isActive = user.role === role || (!user.role && role === 'student') || (user.is_admin && role === 'admin');
                                            return (
                                                <button
                                                    key={role}
                                                    onClick={() => onUpdateRole(user.id, role)}
                                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${isActive
                                                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                                        : 'bg-black/20 text-gray-400 hover:bg-white-5 hover:text-gray-200'
                                                        }`}
                                                >
                                                    <span className="capitalize">{role}</span>
                                                    {isActive && <Check size={12} />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Details & Activity */}
                            <div className="md:col-span-2 space-y-6">
                                {/* Personal Details Grid */}
                                <div>
                                    <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Personal Information</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white-5 p-3 rounded-lg border border-white-5">
                                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                                                <BookOpen size={14} /> <span className="text-xs">Course</span>
                                            </div>
                                            <p className="text-sm font-medium text-white truncate">{user.course || 'Not set'}</p>
                                        </div>
                                        <div className="bg-white-5 p-3 rounded-lg border border-white-5">
                                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                                                <Calendar size={14} /> <span className="text-xs">Year</span>
                                            </div>
                                            <p className="text-sm font-medium text-white truncate">{user.year || 'Not set'}</p>
                                        </div>
                                        <div className="bg-white-5 p-3 rounded-lg border border-white-5">
                                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                                                <Phone size={14} /> <span className="text-xs">Phone</span>
                                            </div>
                                            <p className="text-sm font-medium text-white truncate">{user.phone || 'Not set'}</p>
                                        </div>
                                        <div className="bg-white-5 p-3 rounded-lg border border-white-5">
                                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                                                <Shield size={14} /> <span className="text-xs">Enrollment</span>
                                            </div>
                                            <p className="text-sm font-medium text-white truncate">{user.enrollment_no || 'Not set'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Activity Stats */}
                                <div>
                                    <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">System Activity</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gradient-to-br from-blue-500/10 bg-white-5 to-purple-500/10 p-4 rounded-xl border border-white-5">
                                            <div className="flex items-center gap-2 text-blue-400 mb-2">
                                                <Clock size={16} /> <span className="text-xs font-bold">Last Login</span>
                                            </div>
                                            <p className="text-sm font-mono text-gray-200">{formatDate(user.last_login)}</p>
                                            <p className="text-xs text-gray-500 mt-1">Login Count: {user.login_count || 0}</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-green-500/10 bg-white-5 to-teal-500/10 p-4 rounded-xl border border-white-5">
                                            <div className="flex items-center gap-2 text-green-400 mb-2">
                                                <Download size={16} /> <span className="text-xs font-bold">Downloads</span>
                                            </div>
                                            <p className="text-2xl font-bold text-white">{user.download_count || 0}</p>
                                            <p className="text-xs text-gray-500">Total resources accessed</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
