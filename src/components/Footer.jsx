import { Link } from 'react-router-dom';
import { GraduationCap, Github, Twitter, Linkedin, Mail } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="premium-footer mt-20">
            <div className="container py-10 p-6">
                <div className="footer-grid">
                    {/* Brand */}
                    <div className="md:col-span-1">
                        <Link to="/" className="flex items-center gap-2 mb-4">
                            <GraduationCap size={30} className="text-primary" />
                            <span className="font-bold text-xl footer-brand-gradient">
                                POORNIMA BACKBENCHERS
                            </span>
                        </Link>
                        <p className="text-gray-400 text-sm leading-relaxed mb-6">
                            Empowering students with shared knowledge and resources. Join existing community of learners today.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="social-icon-btn text-gray-400">
                                <Github size={18} />
                            </a>
                            <a href="#" className="social-icon-btn text-gray-400">
                                <Twitter size={18} />
                            </a>
                            <a href="#" className="social-icon-btn text-gray-400">
                                <Linkedin size={18} />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="footer-heading">Quick Links</h3>
                        <ul className="footer-list">
                            <li>
                                <Link to="/" className="text-gray-400 text-sm footer-link">Home</Link>
                            </li>
                            <li>
                                <Link to="/user-dashboard" className="text-gray-400 text-sm footer-link">Notes</Link>
                            </li>
                            <li>
                                <Link to="/courses" className="text-gray-400 text-sm footer-link">Courses</Link>
                            </li>
                            <li>
                                <Link to="/about" className="text-gray-400 text-sm footer-link">About Us</Link>
                            </li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h3 className="footer-heading">Resources</h3>
                        <ul className="footer-list">
                            <li>
                                <Link to="/important" className="text-gray-400 text-sm footer-link">Important Notices</Link>
                            </li>
                            <li>
                                <a href="#" className="text-gray-400 text-sm footer-link">Past Year Papers</a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-400 text-sm footer-link">Study Material</a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-400 text-sm footer-link">Student Guide</a>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="footer-heading">Contact</h3>
                        <ul className="footer-list">
                            <li className="flex items-center gap-2 text-gray-400 text-sm">
                                <Mail size={16} className="text-primary" />
                                <span>support@backbenchers.com</span>
                            </li>
                            <li className="text-gray-400 text-sm">
                                India | Jaipur
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t mt-12 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-500 text-sm text-center md:text-left">
                        © {new Date().getFullYear()} Poornima Backbenchers. All rights reserved.
                    </p>
                    <div className="flex gap-6 text-sm">
                        <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors">Privacy Policy</a>
                        <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
