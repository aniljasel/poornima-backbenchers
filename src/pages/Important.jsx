import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, AlertTriangle } from 'lucide-react';

const questions = [
    {
        unit: "UNIT 1: Hashing",
        content: "Q: Explain Collision removing techniques...\n\n1. Separate Chaining\n2. Open Addressing (Linear Probing, Quadratic Probing, Double Hashing)"
    },
    {
        unit: "UNIT 2: Heaps",
        content: "Q: Binary Heap & Binomial Queue...\n\nExplain the properties of Min-Heap and Max-Heap."
    },
    {
        unit: "UNIT 3: Trees",
        content: "Q: AVL Trees & Red-Black Trees...\n\nCompare the rotation mechanisms."
    },
    {
        unit: "UNIT 4: Graphs",
        content: "Q: Dijkstra & Bellman-Ford Algorithms...\n\nWrite the pseudocode for Dijkstra's algorithm."
    }
];

export default function Important() {
    return (
        <div className="container" style={{ minHeight: '100vh', paddingTop: '100px', paddingBottom: '50px', maxWidth: '900px' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
                style={{ marginBottom: '2.5rem' }}
            >
                <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Important Questions</h1>

                <div style={{
                    backgroundColor: 'rgba(255, 71, 87, 0.1)',
                    border: '1px solid rgba(255, 71, 87, 0.2)',
                    borderRadius: '8px',
                    padding: '1rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    color: 'var(--accent)',
                    marginBottom: '1.5rem'
                }}>
                    <AlertTriangle size={20} />
                    <span style={{ fontWeight: 600 }}>WARNING: Importants upload timing: 5:30 PM the day before an exam.</span>
                </div>
            </motion.div>

            <div className="flex-col gap-4" style={{ display: 'flex', gap: '1rem' }}>
                {questions.map((q, i) => (
                    <AccordionItem key={i} title={q.unit} content={q.content} index={i} />
                ))}
            </div>
        </div>
    );
}

function AccordionItem({ title, content, index }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass"
            style={{ borderRadius: '8px', overflow: 'hidden' }}
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center"
                style={{
                    padding: '1.25rem',
                    textAlign: 'left',
                    transition: 'background 0.2s',
                    cursor: 'pointer',
                    background: 'transparent',
                    color: 'inherit'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
                <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{title}</span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown />
                </motion.div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
                    >
                        <div style={{ padding: '1.25rem', color: '#ccc', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                            {content}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
