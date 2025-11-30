import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';
import { FileText, Download, Loader, LogOut, Search, User, LayoutDashboard, Bookmark, Clock, Sparkles, Heart, CheckSquare, AlertTriangle } from 'lucide-react';
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
    const [activeTab, setActiveTab] = useState('notes'); // 'notes', 'saved', 'productivity', 'profile'
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
            // Log history
            await supabase
                .from('note_history')
                .insert({
                    user_id: userSession.user.id,
                    note_id: note.id,
                    action_type: 'download'
                });

            // Increment download count
            const { error: updateError } = await supabase.rpc('increment_download_stats', { user_id_param: userSession.user.id });

            if (updateError) {
                console.warn("RPC increment_download_stats failed, trying manual update:", updateError);
                // Fallback
                const { data: profile, error: fetchError } = await supabase.from('profiles').select('download_count').eq('id', userSession.user.id).single();

                if (fetchError) {
                    console.error("Failed to fetch profile for download count:", fetchError);
                } else {
                    const currentCount = profile?.download_count || 0;
                    const { error: manualUpdateError } = await supabase.from('profiles').update({
                        download_count: currentCount + 1
                    }).eq('id', userSession.user.id);

                    if (manualUpdateError) {
                        console.error("Manual download count update failed:", manualUpdateError);
                    } else {
                        console.log("Manual download count update successful");
                    }
                }
            } else {
                console.log("RPC download count update successful");
            }

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
                        onClick={() => setActiveTab('notes')}
                        className={`nav-btn ${activeTab === 'notes' ? 'active' : ''}`}
                    >
                        <LayoutDashboard size={20} />
                        Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('saved')}
                        className={`nav-btn ${activeTab === 'saved' ? 'active' : ''}`}
                    >
                        <Bookmark size={20} />
                        Saved Notes
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
                        My Profile
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
            <main className="flex-1 w-full">
                <div className="dashboard-header mb-6">
                    <h1 className="dashboard-title text-3xl font-bold">
                        {activeTab === 'notes' && 'Study Materials'}
                        {activeTab === 'saved' && 'Saved Notes'}
                        {activeTab === 'productivity' && 'Study Tools'}
                        {activeTab === 'profile' && 'My Profile'}
                    </h1>
                </div>

                {activeTab === 'notes' && (
                    <>
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
                                    <div className="glass p-4 rounded-xl">
                                        <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                                            <Clock size={18} className="text-primary" /> Recently Viewed
                                        </h3>
                                        <div className="space-y-3">
                                            {recentNotes.slice(0, 3).map(note => (
                                                <div key={note.id} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="bg-primary-10 p-2 rounded-md">
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
                    </>
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
