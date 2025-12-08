import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GraduationCap, Menu, X, Home, LayoutDashboard, AlertTriangle, LogIn, User, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState(null);
    const location = useLocation();

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const getDashboardLink = () => {
        if (!user) return '/login';
        return user.email === 'schedule.manager4@gmail.com' ? '/admin-dashboard' : '/user-dashboard';
    };

    const links = [
        { path: '/', name: 'Home', icon: <Home size={20} /> },
        { path: '/courses', name: 'Courses', icon: <BookOpen size={20} /> },
        { path: '/about', name: 'About', icon: <GraduationCap size={25} /> },
        ...(user ? [{ path: '/important', name: 'Important', icon: <AlertTriangle size={20} /> }] : []),
        {
            path: user ? getDashboardLink() : '/login',
            name: user ? 'Dashboard' : 'Login',
            icon: user ? <LayoutDashboard size={20} /> : <LogIn size={20} />
        },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="glass navbar">
            <div className="container nav-container">
                <Link to="/" className="nav-logo">
                    <GraduationCap size={40} style={{ color: 'var(--primary)' }} />
                    <span style={{ color: 'white' }}>POORNIMA</span> <span style={{ color: 'var(--primary)' }}>BACKBENCHERS</span>
                </Link>

                {/* Desktop Nav */}
                <div className="nav-links">
                    {links.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className="nav-link"
                            style={{
                                color: isActive(link.path) ? 'var(--primary)' : '#ccc',
                            }}
                        >
                            {link.icon}
                            {link.name}
                        </Link>
                    ))}
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="mobile-menu-btn"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Nav */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="glass mobile-menu"
                    >
                        <div className="mobile-links">
                            {links.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => setIsOpen(false)}
                                    className="nav-link"
                                    style={{
                                        padding: '0.5rem',
                                        borderRadius: '8px',
                                        color: isActive(link.path) ? 'var(--primary)' : '#ccc',
                                        backgroundColor: isActive(link.path) ? 'rgba(255, 204, 0, 0.1)' : 'transparent',
                                        gap: '1rem'
                                    }}
                                >
                                    {link.icon}
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
