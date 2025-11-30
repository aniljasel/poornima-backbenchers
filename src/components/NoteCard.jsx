import { motion } from 'framer-motion';
import { FileText, Download, Heart } from 'lucide-react';

export default function NoteCard({ note, index = 0, isBookmarked, onToggleBookmark, onDownload }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass note-card flex flex-col relative group"
        >
            <button
                onClick={(e) => {
                    e.preventDefault();
                    onToggleBookmark(note);
                }}
                style={{marginTop: "5px"}}
                className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-300 z-10 ${isBookmarked
                    ? 'text-red-500 bg-red-500/10 scale-110'
                    : 'text-gray-400 hover:text-red-400 hover:bg-white/10 hover:scale-110'
                    }`}
                title={isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
            >
                <Heart size={20} fill={isBookmarked ? "currentColor" : "none"} />
            </button>

            <div className="note-card-header">
                <div className="bg-primary-10 p-3 rounded-lg">
                    <FileText size={24} className="text-primary" />
                </div>
                <span className="note-subject-badge">
                    {note.subject}
                </span>
            </div>

            <h3 className="text-xl font-bold mb-2 truncate" title={note.title}>{note.title}</h3>
            <p className="note-date">
                Uploaded on {new Date(note.created_at).toLocaleDateString()}
            </p>

            <a
                href={note.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onDownload && onDownload(note)}
                className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
            >
                <Download size={18} /> Download
            </a>
        </motion.div>
    );
}
