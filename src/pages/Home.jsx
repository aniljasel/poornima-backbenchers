import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen } from 'lucide-react';

export default function Home() {
    return (
        <div style={{ minHeight: '100vh', paddingTop: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', paddingLeft: '1rem', paddingRight: '1rem' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                style={{ maxWidth: '800px' }}
            >
                <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', fontWeight: 'bold', marginBottom: '1.5rem', lineHeight: 1.1 }}>
                    Studying Hard or <br />
                    <span className="text-gradient">Hardly Studying?</span>
                </h1>

                <p style={{ fontSize: '1.25rem', color: '#a0a0a0', marginBottom: '2.5rem', maxWidth: '600px', marginInline: 'auto' }}>
                    Get the best notes, important questions, and resources for your BCA journey.
                    Everything you need to pass with flying colors, all in one place.
                </p>

                <div className="flex flex-col md:flex-row gap-4 justify-center" style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    <Link to="/notes" className="btn-primary" style={{ fontSize: '1.1rem', padding: '0.8rem 2rem' }}>
                        <BookOpen size={20} />
                        Get Notes
                    </Link>

                    <Link to="/important" style={{
                        padding: '0.8rem 2rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        transition: 'background 0.2s'
                    }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        Important Qs
                        <ArrowRight size={20} />
                    </Link>
                </div>
            </motion.div>

            <div style={{ position: 'absolute', bottom: '40px', left: 0, width: '100%', textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>
            </div>
        </div>
    );
}
