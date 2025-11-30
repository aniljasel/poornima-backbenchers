import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';
import { FileText, Download, Loader } from 'lucide-react';

export default function Notes() {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubject, setSelectedSubject] = useState('ALL');

    useEffect(() => {
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

        fetchNotes();
    }, []);

    const filteredNotes = selectedSubject === 'ALL'
        ? notes
        : notes.filter(note => note.subject === selectedSubject);

    const subjects = ['ALL', 'ADS', 'MAD', 'OTHER'];

    return (
        <div className="container" style={{ minHeight: '100vh', paddingTop: '100px', paddingBottom: '50px' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
                style={{ marginBottom: '2.5rem' }}
            >
                <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Course Notes</h1>
                <p style={{ color: '#a0a0a0' }}>Download the latest notes uploaded by admins.</p>
            </motion.div>

            {/* Filter */}
            <div className="flex justify-center gap-4" style={{ marginBottom: '2.5rem', flexWrap: 'wrap' }}>
                {subjects.map(sub => (
                    <button
                        key={sub}
                        onClick={() => setSelectedSubject(sub)}
                        style={{
                            padding: '0.5rem 1.5rem',
                            borderRadius: '9999px',
                            fontWeight: 500,
                            transition: 'all 0.2s',
                            backgroundColor: selectedSubject === sub ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                            color: selectedSubject === sub ? 'var(--dark)' : 'white'
                        }}
                    >
                        {sub}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center" style={{ marginTop: '5rem' }}>
                    <Loader className="animate-spin" style={{ color: 'var(--primary)' }} size={40} />
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {filteredNotes.length === 0 ? (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#666', padding: '5rem 0' }}>
                            No notes found for this subject.
                        </div>
                    ) : (
                        filteredNotes.map((note, index) => (
                            <motion.div
                                key={note.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="glass"
                                style={{ padding: '1.5rem', borderRadius: '12px', transition: 'border-color 0.2s' }}
                                onMouseOver={(e) => e.currentTarget.style.borderColor = 'rgba(255, 204, 0, 0.5)'}
                                onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                            >
                                <div className="flex justify-between items-start" style={{ marginBottom: '1rem' }}>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '4px',
                                        backgroundColor: note.subject === 'MAD' ? 'rgba(0, 210, 211, 0.2)' : 'rgba(255, 204, 0, 0.2)',
                                        color: note.subject === 'MAD' ? 'var(--mad-color)' : 'var(--primary)'
                                    }}>
                                        {note.subject}
                                    </span>
                                    <FileText size={20} style={{ color: '#666' }} />
                                </div>

                                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{note.title}</h3>
                                <p style={{ fontSize: '0.875rem', color: '#a0a0a0', marginBottom: '1.5rem' }}>
                                    {new Date(note.created_at).toLocaleDateString()}
                                </p>

                                <a
                                    href={note.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-primary w-full"
                                    style={{ textDecoration: 'none' }}
                                >
                                    <Download size={18} />
                                    Download
                                </a>
                            </motion.div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
