import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    BookOpen,
    Calendar,
    Clock,
    Download,
    FileText,
    LayoutDashboard,
    ExternalLink,
    Plus,
    Shield,
    Sparkles,
    TrendingUp,
    User,
    Bell,
    CheckCircle,
    AlertTriangle
} from 'lucide-react';

export default function DashboardFeed() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [recentNotes, setRecentNotes] = useState([]);
    const [recentCourses, setRecentCourses] = useState([]);
    const [reminders, setReminders] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [stats, setStats] = useState({ downloads: 0, joinedDate: null });

    // Reminder Modal State
    const [showReminderModal, setShowReminderModal] = useState(false);
    const [newReminder, setNewReminder] = useState({ title: '', date: '' });
    const [submittingReminder, setSubmittingReminder] = useState(false);

    const navigate = useNavigate();

    const handleDownload = async (note) => {
        const url = note.fileUrl;
        const filename = note.title;

        try {
            // 1. Download Logic
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename || 'download';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);

            // 2. Log History & Update Stats
            if (user) {
                await supabase.from('note_history').insert({
                    user_id: user.id,
                    note_id: note.id,
                    action_type: 'download'
                });

                const { error: updateError } = await supabase.rpc('increment_download_stats', { user_id_param: user.id });

                if (updateError) {
                    console.warn("RPC increment_download_stats failed:", updateError);
                    const { data: profile } = await supabase.from('profiles').select('download_count').eq('id', user.id).single();
                    const currentCount = profile?.download_count || 0;
                    const { error: manualError } = await supabase.from('profiles').update({ download_count: currentCount + 1 }).eq('id', user.id);
                    if (manualError) console.error("Manual profile update failed:", manualError);
                    else console.log("Manual profile update successful");
                } else {
                    console.log("RPC increment_download_stats successful");
                }

                // Update local stats
                setStats(prev => ({ ...prev, downloads: prev.downloads + 1 }));
            }

        } catch (error) {
            console.error('Download failed:', error);
            window.open(url, '_blank');
        }
    };

    const fetchDashboardData = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                setLoading(false);
                return;
            }

            setUser(session.user);

            // 1. Fetch Profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (profileError) throw profileError;
            setProfile(profileData);
            setStats(prev => ({ ...prev, joinedDate: profileData.created_at }));

            // 2. Fetch Recent Notes (Limit 5)
            const { data: notesData } = await supabase
                .from('notes')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            if (notesData) setRecentNotes(notesData);

            // 3. Fetch Recent Courses (Limit 4)
            const { data: coursesData } = await supabase
                .from('courses')
                .select('*, subjects(name)') // Join to get subject name if needed
                .eq('is_published', true)
                .order('created_at', { ascending: false })
                .limit(4);

            if (coursesData) setRecentCourses(coursesData);


            // 4. Fetch Content based on Role
            if (profileData.is_admin) {
                // Fetch Announcements for Admin
                const { data: announcementsData } = await supabase
                    .from('announcements')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(2);

                if (announcementsData) setAnnouncements(announcementsData);
            } else {
                // Fetch Reminders for Student
                const { data: remindersData } = await supabase
                    .from('reminders')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .order('reminder_date', { ascending: true })
                    .gte('reminder_date', new Date().toISOString())
                    .limit(3); // Increased limit to 3

                if (remindersData) setReminders(remindersData);
            }

            // 5. Fetch Download Count (from note_history)
            const { count } = await supabase
                .from('note_history')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', session.user.id)
                .eq('action_type', 'download');

            setStats(prev => ({ ...prev, downloads: count || 0 }));

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const handleAddReminder = async (e) => {
        e.preventDefault();
        if (!newReminder.title || !newReminder.date) return;

        setSubmittingReminder(true);
        try {
            const { error } = await supabase
                .from('reminders')
                .insert([
                    {
                        user_id: user.id,
                        title: newReminder.title,
                        reminder_date: new Date(newReminder.date).toISOString(),
                        type: 'assignment' // Default type
                    }
                ]);

            if (error) throw error;

            // Reset and refresh
            setNewReminder({ title: '', date: '' });
            setShowReminderModal(false);
            fetchDashboardData(); // Refresh data to show new reminder
        } catch (error) {
            console.error('Error adding reminder:', error);
            alert('Failed to add reminder');
        } finally {
            setSubmittingReminder(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    const isAdmin = profile?.is_admin;

    return (
        <div className="container dashboard-container pt-24 pb-12 relative">

            {/* Reminder Modal */}
            {showReminderModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" style={{ backdropFilter: 'blur(10px)' }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        style={{ maxHeight: '320px' }}
                        className="glass-card p-4 rounded-2xl w-full max-w-md shadow-2xl border border-white/10"
                    >
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Bell size={20} className="text-primary" />
                            Set Reminder
                        </h3>
                        <form onSubmit={handleAddReminder} className="space-y-5">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Title</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Submit Assignment"
                                    className="input-field"
                                    value={newReminder.title}
                                    onChange={e => setNewReminder({ ...newReminder, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Date & Time</label>
                                <input
                                    type="datetime-local"
                                    placeholder="Enter date and time..."
                                    className="input-field"
                                    value={newReminder.date}
                                    onChange={e => setNewReminder({ ...newReminder, date: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="flex gap-4 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setShowReminderModal(false)}
                                    className="flex-1 btn-secondary-glass"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingReminder}
                                    className="flex-1 btn-primary-gradient disabled:opacity-50"
                                >
                                    {submittingReminder ? 'Saving...' : 'Set Reminder'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* 1. Dashboard Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="dashboard-welcome-section"
            >
                <div className="welcome-header">
                    <div>
                        <h1 className="welcome-title">
                            Hello, <span className="gradient-text">{profile?.full_name?.split(' ')[0] || 'Student'}</span>! 👋
                        </h1>
                        <p className="welcome-subtitle">
                            {isAdmin
                                ? 'Welcome back to the admin control center.'
                                : `You are doing great! Ready to learn something new?`}
                        </p>
                    </div>

                    {/* Core Stats Badge */}
                    {!isAdmin && (
                        <div className="stats-badge">
                            <span className="flex items-center gap-2">
                                <User size={16} className="text-primary" />
                                {profile?.course || 'BCA'}
                            </span>
                            <div className="stats-divider"></div>
                            <span className="flex items-center gap-2">
                                <Calendar size={16} className="text-primary" />
                                {profile?.year || '1st'} Year
                            </span>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="quick-actions-grid">
                    {isAdmin ? (
                        <>
                            <QuickActionCard
                                icon={<Plus size={24} />}
                                label="Upload Notes"
                                onClick={() => navigate('/admin-dashboard?tab=notes')}
                                color="primary"
                            />
                            <QuickActionCard
                                icon={<FileText size={24} />}
                                label="Review Notes"
                                onClick={() => navigate('/admin-dashboard?tab=notes')}
                                color="blue"
                            />
                            <QuickActionCard
                                icon={<User size={24} />}
                                label="Manage Users"
                                onClick={() => navigate('/admin-dashboard?tab=users')}
                                color="purple"
                            />
                            <QuickActionCard
                                icon={<Bell size={24} />}
                                label="Post Update"
                                onClick={() => navigate('/admin-dashboard?tab=communication')}
                                color="yellow"
                            />
                        </>
                    ) : (
                        <>
                            <QuickActionCard
                                icon={<User size={24} />}
                                label="View Profile"
                                onClick={() => navigate('/user-dashboard?tab=profile')}
                                color="primary"
                            />
                            <QuickActionCard
                                icon={<Plus size={24} />}
                                label="Upload Notes"
                                onClick={() => navigate('/user-dashboard?tab=notes')}
                                color="primary"
                                disabled
                            />
                            <QuickActionCard
                                icon={<BookOpen size={24} />}
                                label="View Syllabus"
                                onClick={() => { }}
                                color="blue"
                                disabled
                            />
                            <QuickActionCard
                                icon={<LayoutDashboard size={24} />}
                                label="My Dashboard"
                                onClick={() => navigate('/user-dashboard?tab=notes')}
                                color="purple"
                            />
                        </>
                    )}
                </div>
            </motion.div>

            {/* 2. Widgets Grid */}
            <div className="dashboard-widgets-grid">

                {/* Widget 1: Reminders / Upcoming */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="widget-card"
                >
                    <div className="widget-header">
                        <h3 className="widget-title">
                            <Bell size={20} className="text-yellow-400" />
                            {isAdmin ? 'System Alerts' : 'Upcoming'}
                        </h3>
                        {!isAdmin ? (
                            <div className="flex items-center gap-3">
                                <button onClick={() => setShowReminderModal(true)} className="text-xs flex items-center gap-1 text-primary hover:underline">
                                    <Plus size={14} /> Add
                                </button>
                                <button onClick={() => navigate('/user-dashboard?tab=productivity')} className="widget-link">View All</button>
                            </div>
                        ) : (
                            <button onClick={() => navigate('/admin-dashboard?tab=communication')} className="widget-link">View All</button>
                        )}
                    </div>

                    <div className="widget-content">
                        {isAdmin ? (
                            // Admin View: Announcements
                            announcements.length > 0 ? (
                                announcements.map(announcement => (
                                    <div key={announcement.id} className="reminder-item">
                                        <div className="flex reminder-icon">
                                            <AlertTriangle size={16} />
                                        </div>
                                        <div className="reminder-info">
                                            <h4>{announcement.title}</h4>
                                            <p>{new Date(announcement.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-state">
                                    <CheckCircle size={32} className="empty-icon" />
                                    <p className="text-sm">No active alerts.</p>
                                </div>
                            )
                        ) : (
                            // Student View: Reminders
                            reminders.length > 0 ? (
                                <div className="space-y-3 overflow-y-auto gap-4">
                                    {reminders.map(reminder => (
                                        <div key={reminder.id} className="reminder-item">
                                            <div className="reminder-icon">
                                                <Calendar size={16} />
                                            </div>
                                            <div className="reminder-info">
                                                <h4>{reminder.title}</h4>
                                                <p>{new Date(reminder.reminder_date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <CheckCircle size={32} className="empty-icon" />
                                    <p className="text-sm">No upcoming reminders.</p>
                                    <button
                                        onClick={() => setShowReminderModal(true)}
                                        className="text-xs text-primary hover:underline mt-2"
                                    >
                                        + Add Reminder
                                    </button>
                                </div>
                            )
                        )}
                    </div>
                </motion.div>

                {/* Widget 2: Notes Feed */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="widget-card widget-span-2"
                >
                    <div className="widget-header">
                        <h3 className="widget-title">
                            <Sparkles size={20} className="text-primary" />
                            Recently Uploaded
                        </h3>
                        <button onClick={() => navigate(isAdmin ? '/admin-dashboard?tab=notes' : '/user-dashboard?tab=notes')} className="widget-link">Browse All</button>
                    </div>

                    <div className="recent-notes-grid">
                        {recentNotes.map(note => (
                            <div key={note.id} className="note-item-compact group" onClick={() => window.open(note.fileUrl, '_blank')}>
                                <div className="note-icon-compact">
                                    <FileText size={20} />
                                </div>
                                <div className="note-info-compact">
                                    <h4 className="note-title-compact">{note.title}</h4>
                                    <div className="note-meta-compact">
                                        <span className="note-tag">{note.subject}</span>
                                        <span>•</span>
                                        <span>{new Date(note.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <button
                                    className="download-btn-compact"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownload(note);
                                    }}
                                >
                                    <Download size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Widget 3: System Status / Personal Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="widget-card"
                >
                    <h3 className="widget-title" style={{ marginBottom: '1.5rem' }}>
                        <TrendingUp size={20} className="text-green-400" />
                        Your Activity
                    </h3>

                    <div className="widget-content">
                        <div className="activity-card">
                            <p className="activity-label">Total Downloads</p>
                            <h4 className="activity-value">{stats.downloads}</h4>
                        </div>

                        <div className="joined-card">
                            <div className="flex joined-icon">
                                <Clock size={16} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Joined Platform</p>
                                <p className="text-sm font-medium">
                                    {stats.joinedDate ? new Date(stats.joinedDate).toLocaleDateString() : 'Recently'}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Widget 4: Recent Courses (New) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="widget-card widget-span-2"
                >
                    <div className="widget-header">
                        <h3 className="widget-title">
                            <BookOpen size={20} className="text-purple-400" />
                            Recent Courses
                        </h3>
                        <button onClick={() => navigate('/courses')} className="widget-link">View All</button>
                    </div>

                    <div className="recent-notes-grid">
                        {recentCourses.map(course => (
                            <div key={course.id} className="course-item bg-white-5 p-4 rounded-xl border border-white-5 flex flex-col md:flex-row gap-4 items-start md:items-center" onClick={() => window.open(course.link, '_blank')}>
                                <div className="h-24 rounded-lg overflow-hidden mb-3 relative">
                                    {course.image_url ? (
                                        <img src={course.image_url} alt={course.title} className="w-16 h-16 rounded-lg border border-white-5 object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                                            <BookOpen size={20} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <h4 className="font-bold text-white text-sm mb-1 line-clamp-1 group-hover:text-primary transition-colors">{course.title}</h4>
                                    <a href={course.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline mt-1 inline-block">
                                        <ExternalLink size={16} style={{marginRight: '5px'}}/>Visit Link
                                    </a>
                                </div>
                            </div>
                        ))}
                        {recentCourses.length === 0 && (
                            <p className="text-gray-500 text-sm col-span-full text-center py-4">No courses available yet.</p>
                        )}
                    </div>
                </motion.div>

            </div>
        </div>
    );
}

function QuickActionCard({ icon, label, onClick, color = 'primary', disabled = false }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`action-card ${color}`}
        >
            <div className="action-icon-wrapper">
                {icon}
            </div>
            <span className="action-label">{label}</span>
        </button>
    );
}
