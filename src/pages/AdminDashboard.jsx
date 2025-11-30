import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { supabase } from '../supabaseClient';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Trash2, LogOut, Loader, CheckCircle, FileText, AlertTriangle, Users, Shield, Edit2, Search, BarChart2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import ConfirmationModal from '../components/ConfirmationModal';
import { UserGrowthChart, SubjectDistributionChart, UserStatusChart } from '../components/AnalyticsCharts';
// import UserDetailsModal from '../components/UserDetailsModal';
const UserDetailsModal = lazy(() => import('../components/UserDetailsModal'));

export default function AdminDashboard() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const navigate = useNavigate();
    const { addToast } = useToast();

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState({
        title: '',
        message: '',
        onConfirm: () => { },
        isDanger: false,
        confirmText: 'Confirm'
    });

    // Upload State
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('ADS');

    // User Management State
    const [users, setUsers] = useState([]);
    const [editingUser, setEditingUser] = useState(null);
    const [userSearch, setUserSearch] = useState('');
    const [selectedUserForDetails, setSelectedUserForDetails] = useState(null);

    // Dashboard State
    const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'notes' | 'users' | 'communication'
    const [notes, setNotes] = useState([]);

    // Note Management State
    const [noteFilter, setNoteFilter] = useState('all'); // 'all' | 'approved' | 'pending' | 'rejected'
    const [noteSubjectFilter, setNoteSubjectFilter] = useState('all');

    // Communication State
    const [announcements, setAnnouncements] = useState([]);
    const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', type: 'info' });

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/login');
                return;
            }

            // Verify Admin Status
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (!profile?.is_admin) {
                addToast("Access Denied: Admins only.", 'error');
                navigate('/user-dashboard');
                return;
            }

            // Sync email if missing
            if (!profile.email && session.user.email) {
                await supabase
                    .from('profiles')
                    .update({ email: session.user.email })
                    .eq('id', session.user.id);
            }

            setUser(session.user);
            fetchNotes();
            fetchUsers();
            fetchAnnouncements();
            setLoading(false);
        };
        checkSession();
    }, [navigate]);

    const fetchNotes = async () => {
        try {
            let query = supabase
                .from('notes')
                .select('*')
                .order('created_at', { ascending: false });

            const { data, error } = await query;

            if (error) throw error;
            setNotes(data);
        } catch (error) {
            console.error("Error fetching notes:", error);
        }
    };

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('updated_at', { ascending: false });

            if (error) throw error;
            setUsers(data);
        } catch (error) {
            console.error("Error fetching users:", error);
            addToast("Failed to load users", 'error');
        }
    };

    const fetchAnnouncements = async () => {
        try {
            const { data, error } = await supabase
                .from('announcements')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setAnnouncements(data);
        } catch (error) {
            console.error("Error fetching announcements:", error);
        }
    };

    // Analytics Data Processing
    const analyticsData = useMemo(() => {
        // User Growth (Mock data based on created_at if available, else random distribution for demo)
        const userGrowth = [
            { date: 'Jan', users: 10 },
            { date: 'Feb', users: 15 },
            { date: 'Mar', users: 25 },
            { date: 'Apr', users: users.length }
        ];

        // Subject Distribution
        const subjectCounts = notes.reduce((acc, note) => {
            acc[note.subject] = (acc[note.subject] || 0) + 1;
            return acc;
        }, {});
        const subjectData = Object.entries(subjectCounts).map(([subject, count]) => ({ subject, count }));

        // User Status
        const activeUsers = users.filter(u => !u.blocked).length;
        const blockedUsers = users.filter(u => u.blocked).length;
        const userStatusData = [
            { name: 'Active', value: activeUsers },
            { name: 'Blocked', value: blockedUsers }
        ];

        return { userGrowth, subjectData, userStatusData };
    }, [users, notes]);


    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file || !title) return;

        setUploading(true);
        setUploadProgress(0);
        setUploadSuccess(false);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const projectUrl = import.meta.env.VITE_SUPABASE_URL;
            const uploadUrl = `${projectUrl}/storage/v1/object/notes/${filePath}`;

            await axios.post(uploadUrl, file, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': file.type,
                    'x-upsert': 'true'
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            });

            const { data: { publicUrl } } = supabase.storage
                .from('notes')
                .getPublicUrl(filePath);

            const { error: dbError } = await supabase
                .from('notes')
                .insert([{
                    title,
                    subject,
                    fileUrl: publicUrl,
                    storagePath: filePath,
                    created_at: new Date().toISOString(),
                    status: 'approved', // Auto-approve admin uploads
                    version: 1,
                    user_id: user.id
                }]);

            if (dbError) throw dbError;

            setUploadSuccess(true);
            setFile(null);
            setTitle('');
            setUploadProgress(0);
            fetchNotes();

            setTimeout(() => setUploadSuccess(false), 3000);

        } catch (error) {
            console.error(error);
            addToast("Upload Failed: " + (error.response?.data?.message || error.message), 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateNoteStatus = async (noteId, newStatus) => {
        try {
            const { error } = await supabase
                .from('notes')
                .update({ status: newStatus })
                .eq('id', noteId);

            if (error) throw error;

            addToast(`Note ${newStatus} successfully`, 'success');
            setNotes(notes.map(n => n.id === noteId ? { ...n, status: newStatus } : n));
        } catch (error) {
            addToast("Status Update Failed: " + error.message, 'error');
        }
    };

    // User Management Functions
    const handleUpdateUser = async (e) => {
        e.preventDefault();
        if (!editingUser) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: editingUser.full_name,
                    is_admin: editingUser.is_admin,
                    blocked: editingUser.blocked
                })
                .eq('id', editingUser.id);

            if (error) throw error;

            addToast("User updated successfully", 'success');
            setEditingUser(null);
            fetchUsers();
        } catch (error) {
            addToast("Update Failed: " + error.message, 'error');
        }
    };

    const handleUpdateRole = async (userId, newRole) => {
        try {
            const isAdmin = newRole === 'admin';
            const { error } = await supabase
                .from('profiles')
                .update({
                    role: newRole,
                    is_admin: isAdmin
                })
                .eq('id', userId);

            if (error) throw error;

            addToast(`Role updated to ${newRole}`, 'success');

            // Update local state
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole, is_admin: isAdmin } : u));
            if (selectedUserForDetails?.id === userId) {
                setSelectedUserForDetails({ ...selectedUserForDetails, role: newRole, is_admin: isAdmin });
            }
        } catch (error) {
            addToast("Role Update Failed: " + error.message, 'error');
        }
    };

    const handleDeleteUserClick = (userToDelete) => {
        setModalConfig({
            title: 'Delete User',
            message: `Are you sure you want to delete ${userToDelete.full_name}? This will remove their profile data.`,
            isDanger: true,
            confirmText: 'Delete User',
            onConfirm: () => handleDeleteUser(userToDelete.id)
        });
        setModalOpen(true);
    };

    const handleDeleteUser = async (userId) => {
        setModalOpen(false);
        try {
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', userId);

            if (error) throw error;
            addToast("User deleted successfully", 'success');
            fetchUsers();
        } catch (error) {
            addToast("Delete Failed: " + error.message, 'error');
        }
    };

    // Note Deletion
    const handleDeleteClick = (note) => {
        setModalConfig({
            title: 'Delete Note',
            message: 'Are you sure you want to delete this note? This action cannot be undone.',
            isDanger: true,
            confirmText: 'Delete',
            onConfirm: () => handleDelete(note)
        });
        setModalOpen(true);
    };

    const handleDelete = async (note) => {
        setModalOpen(false);
        try {
            if (note.storagePath) {
                const { error: storageError } = await supabase.storage
                    .from('notes')
                    .remove([note.storagePath]);
                if (storageError) console.error("File delete error", storageError);
            }

            const { error: dbError } = await supabase
                .from('notes')
                .delete()
                .eq('id', note.id);

            if (dbError) throw dbError;
            addToast("Note deleted successfully", 'success');
            fetchNotes();
        } catch (error) {
            addToast("Delete Failed: " + error.message, 'error');
        }
    };

    // Announcement Functions
    const handleCreateAnnouncement = async (e) => {
        e.preventDefault();
        if (!newAnnouncement.title || !newAnnouncement.content) return;

        try {
            const { error } = await supabase
                .from('announcements')
                .insert([{
                    ...newAnnouncement,
                    created_by: user.id
                }]);

            if (error) throw error;

            addToast("Announcement posted successfully", 'success');
            setNewAnnouncement({ title: '', content: '', type: 'info' });
            fetchAnnouncements();
        } catch (error) {
            addToast("Failed to post announcement: " + error.message, 'error');
        }
    };

    const handleDeleteAnnouncement = async (id) => {
        try {
            const { error } = await supabase
                .from('announcements')
                .delete()
                .eq('id', id);

            if (error) throw error;
            addToast("Announcement deleted", 'success');
            fetchAnnouncements();
        } catch (error) {
            addToast("Delete Failed: " + error.message, 'error');
        }
    };

    const handleLogoutClick = () => {
        setModalConfig({
            title: 'Logout',
            message: 'Are you sure you want to log out of the admin dashboard?',
            isDanger: true,
            confirmText: 'Logout',
            onConfirm: handleLogout
        });
        setModalOpen(true);
    };

    const handleLogout = async () => {
        setModalOpen(false);
        await supabase.auth.signOut();
        navigate('/login');
        addToast("Logged out successfully", 'success');
    };

    const filteredNotes = notes.filter(note => {
        const matchesStatus = noteFilter === 'all' || note.status === noteFilter;
        const matchesSubject = noteSubjectFilter === 'all' || note.subject === noteSubjectFilter;
        return matchesStatus && matchesSubject;
    });

    const filteredUsers = users.filter(u =>
        u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearch.toLowerCase())
    );

    if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader className="animate-spin text-primary" /></div>;

    return (
        <div className="container dashboard-container pt-24">
            {/* Header */}
            <div className="dashboard-header mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="dashboard-title text-3xl font-bold">Admin Dashboard</h1>
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <div className="tab-group overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
                        >
                            Analytics
                        </button>
                        <button
                            onClick={() => setActiveTab('notes')}
                            className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
                        >
                            Notes
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                        >
                            Users
                        </button>
                        <button
                            onClick={() => setActiveTab('communication')}
                            className={`tab-btn ${activeTab === 'communication' ? 'active' : ''}`}
                        >
                            Comm
                        </button>
                    </div>
                    <button onClick={handleLogoutClick} 
                    style={{padding: '0.1rem 0.6rem'}}
                    className="flex items-center justify-center gap-2 text-red-400 hover-bg-red-500-10 px-4 py-2 rounded-lg transition-colors w-full md:w-auto">
                        <LogOut size={20} /> Logout
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="stats-grid mb-8">
                <div className="glass stat-card rounded-xl">
                    <div>
                        <p className="text-gray-400 text-sm mb-1">Total Users</p>
                        <h3 className="text-3xl font-bold">{users.length}</h3>
                    </div>
                    <div className="stat-icon-wrapper bg-primary-20">
                        <Users size={24} className="text-primary" />
                    </div>
                </div>
                <div className="glass stat-card rounded-xl">
                    <div>
                        <p className="text-gray-400 text-sm mb-1">Total Notes</p>
                        <h3 className="text-3xl font-bold">{notes.length}</h3>
                    </div>
                    <div className="stat-icon-wrapper bg-blue-500-10">
                        <FileText size={24} className="text-blue-400" />
                    </div>
                </div>
                <div className="glass stat-card rounded-xl">
                    <div>
                        <p className="text-gray-400 text-sm mb-1">Active Alerts</p>
                        <h3 className="text-3xl font-bold">{announcements.length}</h3>
                    </div>
                    <div className="stat-icon-wrapper bg-purple-500-10">
                        <AlertTriangle size={24} className="text-purple-400" />
                    </div>
                </div>
            </div>

            {activeTab === 'analytics' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                    <UserGrowthChart data={analyticsData.userGrowth} />
                    <SubjectDistributionChart data={analyticsData.subjectData} />
                    <UserStatusChart data={analyticsData.userStatusData} />
                </div>
            )}

            {activeTab === 'notes' && (
                <div className="admin-grid grid gap-6 animate-fade-in">
                    {/* Upload Form */}
                    <div className="glass upload-section rounded-xl h-fit">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Upload size={20} className="text-primary" /> Upload New Note
                        </h2>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div className="form-group">
                                <label className="block text-sm font-medium mb-1 text-gray-400">Subject</label>
                                <select
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                    className="input-field w-full"
                                >
                                    <option value="ADS">ADS</option>
                                    <option value="MAD">MAD</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="block text-sm font-medium mb-1 text-gray-400">Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="input-field w-full"
                                    placeholder="e.g., Unit 1 Notes"
                                />
                            </div>
                            <div className="form-group">
                                <label className="block text-sm font-medium mb-1 text-gray-400">File</label>
                                <input
                                    type="file"
                                    onChange={e => setFile(e.target.files[0])}
                                    className="input-field w-full p-2"
                                />
                            </div>

                            {uploading && (
                                <div className="progress-bar-container">
                                    <div
                                        className="progress-bar-fill"
                                        style={{ width: `${uploadProgress}%` }}
                                    >
                                        {uploadProgress > 10 && `${uploadProgress}%`}
                                    </div>
                                </div>
                            )}

                            <AnimatePresence>
                                {uploadSuccess && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="bg-green-500-20 text-green-400 p-3 rounded-lg flex items-center gap-2 text-sm font-medium"
                                    >
                                        <CheckCircle size={16} /> Upload Successful!
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button
                                type="submit"
                                disabled={uploading}
                                className="btn-primary w-full flex justify-center items-center gap-2"
                            >
                                {uploading ? 'Uploading...' : 'Upload Note'}
                            </button>
                        </form>
                    </div>

                    {/* Manage Notes */}
                    <div className="glass manage-section rounded-xl">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                            <h2 className="text-xl font-bold">Manage Notes</h2>
                            <div className="flex gap-2">
                                <select
                                    value={noteFilter}
                                    onChange={(e) => setNoteFilter(e.target.value)}
                                    className="input-field text-sm py-1 px-2"
                                >
                                    <option value="all">All Status</option>
                                    <option value="approved">Approved</option>
                                    <option value="pending">Pending</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                                <select
                                    value={noteSubjectFilter}
                                    onChange={(e) => setNoteSubjectFilter(e.target.value)}
                                    className="input-field text-sm py-1 px-2"
                                >
                                    <option value="all">All Subjects</option>
                                    <option value="ADS">ADS</option>
                                    <option value="MAD">MAD</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="notes-list space-y-4">
                            {filteredNotes.map(note => (
                                <div key={note.id} className="glass bg-white-5 p-4 rounded-lg flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-primary-10 p-2 rounded-md">
                                                <FileText size={20} className="text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-sm text-white">{note.title}</h3>
                                                <p className="text-xs text-gray-400">{note.subject} • v{note.version || 1} • {new Date(note.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <span style={{ padding: '0px 8px', alignItems: 'center', display: 'flex' }} className={`text-xs rounded-lg border ${note.status === 'approved' ? 'border-green-500-20 text-green-400' :
                                            note.status === 'rejected' ? 'border-red-500-20 text-red-400' :
                                                'border-yellow-500-20 text-yellow-400'
                                            }`}>
                                            {note.status ? note.status.charAt(0).toUpperCase() + note.status.slice(1) : 'Approved'}
                                        </span>
                                    </div>

                                    <div className="flex justify-end gap-2 pt-2 border-t border-white-5">
                                        <div className="flex mt-4 gap-2">
                                            {note.status !== 'approved' && (
                                                <button
                                                    onClick={() => handleUpdateNoteStatus(note.id, 'approved')}
                                                    style={{ padding: '3px 8px' }}
                                                    className="text-xs bg-green-500-20 text-green-400 hover:bg-green-500-30 px-3 py-1.5 rounded-lg transition-colors"
                                                >
                                                    Approve
                                                </button>
                                            )}
                                            {note.status !== 'rejected' && (
                                                <button
                                                    onClick={() => handleUpdateNoteStatus(note.id, 'rejected')}
                                                    style={{ padding: '3px 8px' }}
                                                    className="text-xs bg-red-500-20 text-red-400 hover:bg-red-500-30 px-3 py-1.5 rounded-lg transition-colors"
                                                >
                                                    Reject
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDeleteClick(note)}
                                                style={{ padding: '3px 8px' }}
                                                className="text-xs bg-white-5 text-gray-400 hover:bg-white-10 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1"
                                            >
                                                <Trash2 size={12} style={{ marginRight: '5px' }} /> Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {filteredNotes.length === 0 && <p className="text-center text-gray-500 py-8">No notes found matching filters.</p>}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'users' && (
                <div className="glass p-6 rounded-xl animate-fade-in">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <h2 className="text-xl font-bold">User Management</h2>
                        <div className="search-wrapper">
                            <Search className="search-icon" size={18} />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                                className="input-field search-input"
                                style={{ paddingLeft: "2.5rem" }}
                            />
                        </div>
                    </div>

                    <div className="user-table-container">
                        <table className="user-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(u => (
                                    <tr key={u.id}>
                                        <td>
                                            <div className="user-info">
                                                <div className="user-avatar">
                                                    {u.full_name ? u.full_name.charAt(0).toUpperCase() : 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white">{u.full_name || 'Unknown User'}</p>
                                                    <p className="text-xs text-gray-400">{u.email || 'No Email'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${u.is_admin ? 'badge-admin' : 'badge-student'}`}>
                                                {u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : (u.is_admin ? 'Admin' : 'Student')}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${u.blocked ? 'badge-blocked' : 'badge-active'}`}>
                                                {u.blocked ? 'Blocked' : 'Active'}
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            <div className="action-buttons">
                                                <button
                                                    onClick={() => setSelectedUserForDetails(u)}
                                                    className="action-btn"
                                                    title="View Details"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() => setEditingUser(u)}
                                                    className="action-btn"
                                                    title="Edit User"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUserClick(u)}
                                                    className="action-btn delete"
                                                    title="Delete User"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredUsers.length === 0 && (
                            <div className="text-center py-12">
                                <div className="bg-white-5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Users size={32} className="text-gray-500" />
                                </div>
                                <p className="text-gray-400">No users found matching your search.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'communication' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                    {/* Create Announcement */}
                    <div className="glass p-6 rounded-xl h-fit">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <AlertTriangle size={20} className="text-primary" /> Post Announcement
                        </h2>
                        <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={newAnnouncement.title}
                                    onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                                    className="input-field w-full"
                                    placeholder="Announcement Title"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Type</label>
                                <select
                                    value={newAnnouncement.type}
                                    onChange={e => setNewAnnouncement({ ...newAnnouncement, type: e.target.value })}
                                    className="input-field w-full"
                                >
                                    <option value="info">Info</option>
                                    <option value="warning">Warning</option>
                                    <option value="success">Success</option>
                                    <option value="important">Important</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Content</label>
                                <textarea
                                    value={newAnnouncement.content}
                                    onChange={e => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                                    className="input-field w-full h-32 resize-none"
                                    placeholder="Write your announcement here..."
                                />
                            </div>
                            <button type="submit" className="btn-primary w-full">
                                Post Announcement
                            </button>
                        </form>
                    </div>

                    {/* Announcement List */}
                    <div className="glass p-6 rounded-xl lg:col-span-2">
                        <h2 className="text-xl font-bold mb-6">Recent Announcements</h2>
                        <div className="space-y-4">
                            {announcements.map(announcement => (
                                <div key={announcement.id} className="bg-white-5 p-4 rounded-xl border border-white-5 relative group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-1 rounded-full border font-bold uppercase ${announcement.type === 'important' ? 'bg-red-500-10 border-red-500-20 text-red-400' :
                                                announcement.type === 'warning' ? 'bg-yellow-500-10 border-yellow-500-20 text-yellow-400' :
                                                    announcement.type === 'success' ? 'bg-green-500-10 border-green-500-20 text-green-400' :
                                                        'bg-blue-500-10 border-blue-500-20 text-blue-400'
                                                }`}>
                                                {announcement.type}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {new Date(announcement.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteAnnouncement(announcement.id)}
                                            className="text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <h3 className="font-bold text-lg text-white mb-1">{announcement.title}</h3>
                                    <p className="text-gray-300 text-sm leading-relaxed">{announcement.content}</p>
                                </div>
                            ))}
                            {announcements.length === 0 && (
                                <p className="text-center text-gray-500 py-8">No announcements posted yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass p-6 rounded-xl w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Edit User</h3>
                        <form onSubmit={handleUpdateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={editingUser.full_name || ''}
                                    onChange={e => setEditingUser({ ...editingUser, full_name: e.target.value })}
                                    className="input-field w-full"
                                />
                            </div>

                            <div className="flex items-center justify-between p-3 bg-white-5 rounded-lg">
                                <span className="text-gray-300">Admin Privileges</span>
                                <button
                                    type="button"
                                    onClick={() => setEditingUser({ ...editingUser, is_admin: !editingUser.is_admin })}
                                    className={`toggle-btn ${editingUser.is_admin ? 'active' : 'inactive'}`}
                                >
                                    <div className="toggle-circle" />
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-white-5 rounded-lg">
                                <span className="text-gray-300">Block User</span>
                                <button
                                    type="button"
                                    onClick={() => setEditingUser({ ...editingUser, blocked: !editingUser.blocked })}
                                    className={`toggle-btn ${editingUser.blocked ? 'active-red' : 'inactive'}`}
                                >
                                    <div className="toggle-circle" />
                                </button>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className="modal-action-btn modal-cancel-btn"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="modal-action-btn btn-primary"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {selectedUserForDetails && (
                <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black-50 backdrop-blur-sm"><Loader className="animate-spin text-primary" /></div>}>
                    <UserDetailsModal
                        isOpen={!!selectedUserForDetails}
                        onClose={() => setSelectedUserForDetails(null)}
                        user={selectedUserForDetails}
                        onUpdateRole={handleUpdateRole}
                    />
                </Suspense>
            )}

            <ConfirmationModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                {...modalConfig}
            />
        </div>
    );
}
