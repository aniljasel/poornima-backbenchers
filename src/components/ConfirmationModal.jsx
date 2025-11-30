import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', isDanger = false }) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black-50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass w-full max-w-md p-6 rounded-xl border border-white-10 shadow-2xl"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isDanger ? 'bg-red-500-10 text-red-400' : 'bg-primary-10 text-primary'}`}>
                                <AlertTriangle size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-white">{title}</h3>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <p className="text-gray-300 mb-8 leading-relaxed">
                        {message}
                    </p>

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            style={{padding:'5px 10px'}}
                            className="px-2 py-2 rounded-lg text-gray-300 hover-bg-white-5 transition-colors font-medium"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            style={{padding:'5px 10px'}}
                            className={`px-2 py-2 rounded-lg font-medium transition-colors ${isDanger
                                ? 'bg-red-500 hover-bg-red-600 text-white'
                                : 'bg-primary hover-text-primary text-black'
                                }`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
