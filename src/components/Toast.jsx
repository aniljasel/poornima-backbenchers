import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { useEffect } from 'react';

const toastVariants = {
    initial: { opacity: 0, y: 50, scale: 0.9 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
};

const icons = {
    success: <CheckCircle size={20} className="text-green-400" />,
    error: <AlertCircle size={20} className="text-red-400" />,
    info: <Info size={20} className="text-blue-400" />
};

const bgColors = {
    success: 'bg-green-500-10 border-green-500-20',
    error: 'bg-red-500-10 border-red-500-20',
    info: 'bg-blue-500-10 border-blue-500-20'
};

export default function Toast({ message, type = 'info', onClose }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <motion.div
            variants={toastVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 p-4 rounded-lg border backdrop-blur-md shadow-lg min-w-300 ${bgColors[type]}`}
        >
            {icons[type]}
            <p className="text-sm font-medium text-gray-200 flex-1">{message}</p>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                <X size={16} />
            </button>
        </motion.div>
    );
}
