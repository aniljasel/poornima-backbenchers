import { motion } from 'framer-motion';

export default function About() {
    return (
        <div className="container" style={{ minHeight: '100vh', paddingTop: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ maxWidth: '800px' }}
            >
                <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '2rem', color: 'var(--primary)' }}>About Us</h1>

                <div className="glass" style={{ padding: '2rem', borderRadius: '12px', marginBottom: '2rem' }}>
                    <p style={{ fontSize: '1.2rem', lineHeight: 1.8, color: '#e0e0e0', marginBottom: '1.5rem' }}>
                        Welcome to <strong>Poornima Backbenchers</strong>. We are a community-driven platform dedicated to helping students of Poornima University ace their exams with minimum effort and maximum efficiency.
                    </p>
                    <p style={{ fontSize: '1.2rem', lineHeight: 1.8, color: '#e0e0e0' }}>
                        Our mission is to provide high-quality notes, important questions, and last-minute study resources for BCA students. We understand the challenges students face during exam preparation, and we aim to make the process easier and more effective. Whether you're looking for concise notes or need quick revision materials, we've got you covered. Join us and become a part of a supportive community that values learning and success! 
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                    <div className="glass" style={{ padding: '1.5rem', borderRadius: '8px' }}>
                        <h3 style={{ color: 'var(--primary)', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>100+</h3>
                        <p style={{ color: '#aaa' }}>Students Helped</p>
                    </div>
                    <div className="glass" style={{ padding: '1.5rem', borderRadius: '8px' }}>
                        <h3 style={{ color: 'var(--primary)', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>10+</h3>
                        <p style={{ color: '#aaa' }}>Notes Uploaded</p>
                    </div>
                    <div className="glass" style={{ padding: '1.5rem', borderRadius: '8px' }}>
                        <h3 style={{ color: 'var(--primary)', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>24/7</h3>
                        <p style={{ color: '#aaa' }}>Exam Support</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
