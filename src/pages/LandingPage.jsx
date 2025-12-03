import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, ArrowRight, BookOpen, Shield, Users } from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="landing-container">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="flex justify-center" style={{ marginBottom: '1.5rem' }}>
                            <div style={{
                                backgroundColor: 'rgba(255, 204, 0, 0.1)',
                                padding: '1rem 1.2rem',
                                borderRadius: '50%',
                                border: '1px solid rgba(255, 204, 0, 0.3)'
                            }}>
                                <GraduationCap size={64} style={{ color: 'var(--primary)' }} />
                            </div>
                        </div>

                        <h1 className="hero-title">
                            Poornima <span className="text-gradient">Backbenchers</span>
                        </h1>

                        <p className="hero-subtitle">
                            Unlock your academic potential with study notes, resources, and a supportive community of learners.
                        </p>

                        <div className="flex justify-center gap-4" style={{ flexWrap: 'wrap' }}>
                            <Link
                                to="/login"
                                className="btn-primary"
                                style={{ padding: '0.8rem 2rem', fontSize: '1.1rem' }}
                            >
                                Get Started <ArrowRight size={20} />
                            </Link>
                            <Link
                                to="/about"
                                className="glass"
                                style={{
                                    padding: '0.8rem 2rem',
                                    fontSize: '1.1rem',
                                    borderRadius: 'var(--radius-md)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontWeight: 600
                                }}
                            >
                                Learn More
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="container">
                    <div className="features-grid">
                        <FeatureCard
                            icon={<BookOpen size={32} style={{ color: '#60a5fa' }} />}
                            title="Comprehensive Notes"
                            description="Access high-quality notes for all your subjects, curated by top students."
                        />
                        <FeatureCard
                            icon={<Shield size={32} style={{ color: '#4ade80' }} />}
                            title="Verified Content"
                            description="All resources are verified by admins to ensure accuracy and relevance."
                        />
                        <FeatureCard
                            icon={<Users size={32} style={{ color: '#c084fc' }} />}
                            title="Student Community"
                            description="Join a growing community of students helping each other succeed."
                        />
                    </div>
                </div>
            </section>
        </div>
    );
}

function FeatureCard({ icon, title, description }) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="glass feature-card"
        >
            <div className="feature-icon">
                {icon}
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem', color: 'white' }}>{title}</h3>
            <p style={{ color: 'var(--text-muted)' }}>{description}</p>
        </motion.div>
    );
}
