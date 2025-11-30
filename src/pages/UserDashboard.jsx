import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';
import { FileText, Download, Loader, LogOut, Search, User, LayoutDashboard, Bookmark, Clock, Sparkles, Heart, CheckSquare, AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UserProfile from '../components/UserProfile';
import ConfirmationModal from '../components/ConfirmationModal';
import NoteCard from '../components/NoteCard';
import TodoList from '../components/TodoList';
import ReminderList from '../components/ReminderList';
import StudyPlanner from '../components/StudyPlanner';

export default function UserDashboard() {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubject, setSelectedSubject] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('home'); // 'home', 'library', 'saved', 'productivity', 'profile'
    const [userSession, setUserSession] = useState(null);
    const [userName, setUserName] = useState('');
    const [userProfile, setUserProfile] = useState(null);
    const [bookmarks, setBookmarks] = useState(new Set());
    const [recentNotes, setRecentNotes] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const navigate = useNavigate();

    const [modalOpen, setModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState({
        title: '',
        message: '',
        onConfirm: () => { },
        isDanger: false,
        confirmText: 'Logout',
        cancelText: 'Cancel'
    });

    useEffect(() => {
        const getInitialData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUserSession(session);

            if (session?.user) {
                // Fetch Profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (profile) {
                    // Sync email if missing or changed
                    if (!profile.email && session.user.email) {
                        const { error: updateError } = await supabase
                            .from('profiles')
                            .update({ email: session.user.email })
                            .eq('id', session.user.id);

                        if (!updateError) {
                            profile.email = session.user.email;
                        }
                    }

                    setUserName(profile.full_name);
                    setUserProfile(profile);
                }

                // Fetch Bookmarks
                const { data: bookmarkData } = await supabase
                    .from('bookmarks')
                    .select('note_id')
                    .eq('user_id', session.user.id);

                if (bookmarkData) {
                    setBookmarks(new Set(bookmarkData.map(b => b.note_id)));
                }

                // Fetch History (Recently Viewed)
                const { data: historyData } = await supabase
                    .from('note_history')
                    .select('note_id, created_at')
                    .eq('user_id', session.user.id)
                    .order('created_at', { ascending: false })
                    .limit(5);
            }
        };
        getInitialData();

        const fetchNotes = async () => {
            try {
                const { data, error } = await supabase
                    .from('notes')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setNotes(data);
            } catch (error) {
                console.error("Error fetching notes:", error);
            } finally {
                setLoading(false);
            }
        };

        const fetchAnnouncements = async () => {
            try {
                const { data, error } = await supabase
                    .from('announcements')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(3);

                if (error) throw error;
                setAnnouncements(data);
            } catch (error) {
                console.error("Error fetching announcements:", error);
            }
        };

        fetchNotes();
        fetchAnnouncements();
    }, []);

    // Process recent notes once notes are loaded
    useEffect(() => {
        if (notes.length > 0 && userSession?.user) {
            const fetchHistory = async () => {
                const { data: historyData } = await supabase
                    .from('note_history')
                    .select('note_id')
                    .eq('user_id', userSession.user.id)
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (historyData) {
                    const historyIds = historyData.map(h => h.note_id);
                    // Filter notes that are in history, preserving order
                    const recent = historyIds
                        .map(id => notes.find(n => n.id === id))
                        .filter(Boolean);
                    // Remove duplicates
                    const uniqueRecent = [...new Map(recent.map(item => [item.id, item])).values()];
                    setRecentNotes(uniqueRecent);
                }
            };
            fetchHistory();
        }
    }, [notes, userSession]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const handleLogoutClick = () => {
        setModalConfig({
            title: 'Confirm Logout',
            message: 'Are you sure you want to log out of your account?',
            onConfirm: handleLogout,
            isDanger: true,
            confirmText: 'Logout',
            cancelText: 'Cancel'
        });
        setModalOpen(true);
    };

    const toggleBookmark = async (note) => {
        if (!userSession?.user) return;

        const isBookmarked = bookmarks.has(note.id);
        const newBookmarks = new Set(bookmarks);

        // Optimistic update
        if (isBookmarked) {
            newBookmarks.delete(note.id);
        } else {
            newBookmarks.add(note.id);
        }
        setBookmarks(newBookmarks);

        try {
            if (isBookmarked) {
                await supabase
                    .from('bookmarks')
                    .delete()
                    .eq('user_id', userSession.user.id)
                    .eq('note_id', note.id);
            } else {
                await supabase
                    .from('bookmarks')
                    .insert({ user_id: userSession.user.id, note_id: note.id });
            }
        } catch (error) {
            console.error("Error toggling bookmark:", error);
            // Revert on error
            setBookmarks(bookmarks);
        }
    };

    const handleDownload = async (note) => {
        if (!userSession?.user) return;

        try {
            await supabase
                .from('note_history')
                .insert({
                    user_id: userSession.user.id,
                    note_id: note.id,
                    action_type: 'download'
                });
        } catch (error) {
            console.error("Error logging history:", error);
        }
    };

    const filteredNotes = notes.filter(note => {
        const matchesSubject = selectedSubject === 'ALL' || note.subject === selectedSubject;
        const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSubject && matchesSearch;
    });

    const savedNotesList = notes.filter(note => bookmarks.has(note.id));

    // Recommendation logic: simple match by course/subject if available
    // For now, just showing notes that match the user's course if set, or random
    const recommendedNotes = userProfile?.course
        ? notes.filter(n => n.subject.includes(userProfile.course) || n.title.includes(userProfile.course)).slice(0, 3)
        : notes.slice(0, 3); // Fallback to newest

    if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader className="animate-spin text-primary" /></div>;

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <div className="container dashboard-container dashboard-layout">
            {/* Sidebar */}
            <aside className="dashboard-sidebar">
                <div className="sidebar-profile">
                    <div className="profile-avatar-container">
                        {userProfile?.avatar_url ? (
                            <img src={userProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" style={{ borderRadius: '50%' }} />
                        ) : (
                            <User size={32} className="text-primary" />
                        )}
                    </div>
                    <h2 className="font-bold text-lg truncate">{userSession?.user?.email}</h2>
                    <p className="text-sm text-gray-400">{userName || 'Student'}</p>
                </div>

                <nav className="sidebar-nav">
                    <button
                        onClick={() => setActiveTab('home')}
                        className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`}
                    >
                        <LayoutDashboard size={20} />
                        Home
                    </button>
                    <button
                        onClick={() => setActiveTab('library')}
                        className={`nav-btn ${activeTab === 'library' ? 'active' : ''}`}
                    >
                        <FileText size={20} />
                        Library
                    </button>
                    <button
                        onClick={() => setActiveTab('saved')}
                        className={`nav-btn ${activeTab === 'saved' ? 'active' : ''}`}
                    >
                        <Bookmark size={20} />
                        Saved
                    </button>
                    <button
                        onClick={() => setActiveTab('productivity')}
                        className={`nav-btn ${activeTab === 'productivity' ? 'active' : ''}`}
                    >
                        <CheckSquare size={20} />
                        Productivity
                    </button>
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
                    >
                        <User size={20} />
                        Profile
                    </button>
                    <button
                        onClick={handleLogoutClick}
                        className="nav-btn logout"
                    >
                        <LogOut size={20} />
                        Logout
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 w-full overflow-y-auto">
                <div className="dashboard-header mb-6">
                    <h1 className="dashboard-title text-3xl font-bold">
                        {activeTab === 'home' && 'Dashboard'}
                        {activeTab === 'library' && 'Study Library'}
                        {activeTab === 'saved' && 'Saved Notes'}
                        {activeTab === 'productivity' && 'Productivity Hub'}
                        {activeTab === 'profile' && 'My Profile'}
                    </h1>
                </div>

                {activeTab === 'home' && (
                    <div className="space-y-8 animate-fade-in">
                        {/* Hero Section */}
                        <div className="glass p-8 rounded-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                            <div className="relative z-10">
                                <h2 className="text-4xl font-bold mb-2 gradient-text">{getGreeting()}, {userName?.split(' ')[0] || 'Student'}!</h2>
                                <p className="text-gray-300 text-lg max-w-2xl">
                                    "Success is not final, failure is not fatal: it is the courage to continue that counts."
                                </p>
                                <div className="mt-6 flex gap-4">
                                    <button onClick={() => setActiveTab('library')} className="btn-primary flex items-center gap-2">
                                        Start Studying <ArrowRight size={18} />
                                    </button>
                                    <button onClick={() => setActiveTab('productivity')} className="px-6 py-2.5 rounded-lg font-semibold bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2">
                                        View Tasks
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="glass p-4 rounded-xl flex items-center gap-4 hover:bg-white/5 transition-colors">
                                <div className="bg-blue-500/20 p-3 rounded-lg text-blue-400">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Total Notes</p>
                                    <h3 className="text-2xl font-bold">{notes.length}</h3>
                                </div>
                            </div>
                            <div className="glass p-4 rounded-xl flex items-center gap-4 hover:bg-white/5 transition-colors">
                                <div className="bg-purple-500/20 p-3 rounded-lg text-purple-400">
                                    <Bookmark size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Saved Notes</p>
                                    <h3 className="text-2xl font-bold">{bookmarks.size}</h3>
                                </div>
                            </div>
                            <div className="glass p-4 rounded-xl flex items-center gap-4 hover:bg-white/5 transition-colors">
                                <div className="bg-green-500/20 p-3 rounded-lg text-green-400">
                                    <CheckSquare size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Pending Tasks</p>
                                    <h3 className="text-2xl font-bold">--</h3> {/* Placeholder for tasks count */}
                                </div>
                            </div>
                            <div className="glass p-4 rounded-xl flex items-center gap-4 hover:bg-white/5 transition-colors">
                                <div className="bg-orange-500/20 p-3 rounded-lg text-orange-400">
                                    <Clock size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Study Hours</p>
                                    <h3 className="text-2xl font-bold">0h</h3> {/* Placeholder */}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Recent Activity / Continue Reading */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <Clock size={20} className="text-primary" /> Continue Reading
                                    </h3>
                                    <button onClick={() => setActiveTab('library')} className="text-sm text-primary hover:underline">View All</button>
                                </div>

                                {recentNotes.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {recentNotes.slice(0, 4).map(note => (
                                            <div key={note.id} onClick={() => window.open(note.fileUrl, '_blank')} className="glass p-4 rounded-xl cursor-pointer hover:scale-[1.02] transition-transform group">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="bg-white/10 p-2 rounded-lg">
                                                        <FileText size={20} className="text-primary" />
                                                    </div>
                                                    <span className="text-xs font-medium px-2 py-1 rounded bg-white/5 text-gray-400">{note.subject}</span>
                                                </div>
                                                <h4 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors line-clamp-1">{note.title}</h4>
                                                <p className="text-sm text-gray-400 line-clamp-2">{note.description || 'No description available.'}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="glass p-8 rounded-xl text-center text-gray-500">
                                        <p>No recent activity. Start exploring the library!</p>
                                    </div>
                                )}
                            </div>

                            {/* Right Column: Announcements & Quick Actions */}
                            <div className="space-y-6">
                                {/* Announcements */}
                                {announcements.length > 0 && (
                                    <div className="glass p-5 rounded-xl">
                                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                            <AlertTriangle size={18} className="text-yellow-400" /> Updates
                                        </h3>
                                        <div className="space-y-4">
                                            {announcements.map(ann => (
                                                <div key={ann.id} className="pb-3 border-b border-white/10 last:border-0 last:pb-0">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${ann.type === 'important' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                            {ann.type}
                                                        </span>
                                                        <span className="text-[10px] text-gray-500">{new Date(ann.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-sm font-medium text-gray-200">{ann.title}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Quick Actions */}
                                <div className="glass p-5 rounded-xl">
                                    <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
                                    <div className="space-y-2">
                                        <button onClick={() => setActiveTab('library')} className="w-full p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-between group">
                                            <span className="flex items-center gap-3">
                                                <Search size={18} className="text-gray-400 group-hover:text-white" />
                                                Find Notes
                                            </span>
                                            <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                        <button onClick={() => setActiveTab('productivity')} className="w-full p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-between group">
                                            <span className="flex items-center gap-3">
                                                <CheckSquare size={18} className="text-gray-400 group-hover:text-white" />
                                                Add Task
                                            </span>
                                            <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                        <button onClick={() => setActiveTab('profile')} className="w-full p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-between group">
                                            <span className="flex items-center gap-3">
                                                <User size={18} className="text-gray-400 group-hover:text-white" />
                                                Update Profile
                                            </span>
                                            <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'library' && (
                    <div className="animate-fade-in">
                        {/* Announcements Section */}
                        {announcements.length > 0 && (
                            <div className="mb-8 glass p-4 rounded-xl border-l-4 border-primary animate-fade-in">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <AlertTriangle size={20} className="text-primary" /> Announcements
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {announcements.map(ann => (
                                        <div key={ann.id}
                                            style={{ border: '1px solid var(--card-border)' }}
                                            className={`p-4 rounded-lg border backdrop-blur-sm ${ann.type === 'important' ? 'bg-red-500-10 border-red-500-20' :
                                                ann.type === 'warning' ? 'bg-yellow-500-10 border-yellow-500-20' :
                                                    ann.type === 'success' ? 'bg-green-500-10 border-green-500-20' :
                                                        'bg-blue-500-10 border-blue-500-20'
                                                }`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${ann.type === 'important' ? 'bg-red-500-20 text-red-400' :
                                                    ann.type === 'warning' ? 'bg-yellow-500-20 text-yellow-400' :
                                                        ann.type === 'success' ? 'bg-green-500-20 text-green-400' :
                                                            'bg-blue-500-20 text-blue-400'
                                                    }`}>
                                                    {ann.type}
                                                </span>
                                                <span className="text-xs text-gray-400">{new Date(ann.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <h4 className="font-bold text-white mb-1">{ann.title}</h4>
                                            <p className="text-sm text-gray-300 line-clamp-2">{ann.content}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recommendations & Recent (Only show if not searching/filtering) */}
                        {selectedSubject === 'ALL' && !searchTerm && (
                            <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Recently Viewed */}
                                {recentNotes.length > 0 && (
                                    <div className="glass p-5 rounded-xl">
                                        <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                                            <Clock size={18} className="text-primary" /> Recently Viewed
                                        </h3>
                                        <div className="space-y-3">
                                            {recentNotes.slice(0, 3).map(note => (
                                                <div key={note.id} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="bg-primary-10 p-2 rounded">
                                                            <FileText size={16} className="text-primary" />
                                                        </div>
                                                        <span className="truncate text-sm font-medium">{note.title}</span>
                                                    </div>
                                                    <a href={note.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">View</a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Recommended */}
                                <div className="glass p-4 rounded-xl">
                                    <h3 className="text-lg px-3 font-bold mb-3 flex items-center gap-2" style={{ padding: '0.7rem' }}>
                                        <Sparkles size={18} className="text-yellow-400" /> Recommended for You
                                    </h3>
                                    <div className="space-y-3">
                                        {recommendedNotes.map(note => (
                                            <div key={note.id} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="bg-primary-10 p-2 rounded" style={{ borderRadius: '4px' }}>
                                                        <FileText size={16} className="text-primary" />
                                                    </div>
                                                    <span className="truncate text-sm font-medium">{note.title}</span>
                                                </div>
                                                <button onClick={() => toggleBookmark(note)} className="text-gray-400 hover:text-red-400">
                                                    <Heart size={16} fill={bookmarks.has(note.id) ? "currentColor" : "none"} className={bookmarks.has(note.id) ? "text-red-500" : ""} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Filters */}
                        <div className="glass filter-section mb-6">
                            <div className="filter-controls">
                                <div className="search-box">
                                    <Search className="search-icon" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Search notes..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="input-field"
                                    />
                                </div>
                                <select
                                    value={selectedSubject}
                                    onChange={(e) => setSelectedSubject(e.target.value)}
                                    className="input-field w-full md:w-auto min-w-200"
                                >
                                    <option value="ALL">All Subjects</option>
                                    <option value="ADS">ADS</option>
                                    <option value="MAD">MAD</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                        </div>

                        {/* Notes Grid */}
                        <div className="notes-grid">
                            {filteredNotes.map((note, index) => (
                                <NoteCard
                                    key={note.id}
                                    note={note}
                                    index={index}
                                    isBookmarked={bookmarks.has(note.id)}
                                    onToggleBookmark={toggleBookmark}
                                    onDownload={handleDownload}
                                />
                            ))}
                        </div>

                        {filteredNotes.length === 0 && (
                            <div className="text-center py-20 text-gray-500">
                                <FileText size={48} className="mx-auto mb-4 opacity-50" />
                                <p>No notes found matching your criteria.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'saved' && (
                    <div className="notes-grid">
                        {savedNotesList.length > 0 ? (
                            savedNotesList.map((note, index) => (
                                <NoteCard
                                    key={note.id}
                                    note={note}
                                    index={index}
                                    isBookmarked={bookmarks.has(note.id)}
                                    onToggleBookmark={toggleBookmark}
                                    onDownload={handleDownload}
                                />
                            ))
                        ) : (
                            <div className="col-span-full text-center py-20 text-gray-500">
                                <Bookmark size={48} className="mx-auto mb-4 opacity-50" />
                                <p>You haven't saved any notes yet.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'productivity' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full wpb-10">
                        {/* Left Column: Tasks & Reminders */}
                        <div className="flex flex-col gap-6">
                            <div className="flex-1">
                                <TodoList session={{ user: userSession?.user }} />
                            </div>
                            <div className="flex-1">
                                <ReminderList session={{ user: userSession?.user }} />
                            </div>
                        </div>

                        {/* Right Column: Study Planner */}
                        <div className="h-full">
                            <StudyPlanner />
                        </div>
                    </div>
                )}

                {activeTab === 'profile' && (
                    <div className="w-full">
                        <UserProfile session={{ user: userSession?.user }} />
                    </div>
                )}
            </main>

            <ConfirmationModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={modalConfig.title}
                message={modalConfig.message}
                onConfirm={() => {
                    modalConfig.onConfirm();
                    setModalOpen(false);
                }}
                isDanger={modalConfig.isDanger}
                confirmText={modalConfig.confirmText}
                cancelText={modalConfig.cancelText}
            />
        </div>
    );
}
