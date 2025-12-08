import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, AlertCircle } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass p-6 rounded-xl max-w-lg w-full border border-white-10"
            >
                <div className="mb-6 flex justify-center">
                    <div className="bg-red-500-10 p-4 rounded-full">
                        <AlertCircle size={64} className="text-red-400" />
                    </div>
                </div>

                <h1 className="text-6xl font-bold gradient-text mb-4">404</h1>
                <h2 className="text-2xl font-bold text-white mb-4">Page Not Found</h2>
                <p className="text-gray-400 mb-8">
                    Oops! The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                </p>

                <Link
                    to="/"
                    className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium"
                >
                    <Home size={20} />
                    Go Back Home
                </Link>
            </motion.div>
        </div>
    );
}
