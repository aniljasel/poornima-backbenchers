import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Calendar, ChevronRight } from 'lucide-react';

export default function StudyPlanner() {
    const [selectedSubject, setSelectedSubject] = useState('BCA');

    // Mock data for study plans
    const studyPlans = {
        'BCA': [
            { day: 'Monday', topics: ['C++ Basics', 'Data Structures Intro'] },
            { day: 'Tuesday', topics: ['Mathematics II', 'Digital Electronics'] },
            { day: 'Wednesday', topics: ['Web Development (HTML/CSS)', 'C++ OOPs'] },
            { day: 'Thursday', topics: ['Database Management', 'Operating Systems'] },
            { day: 'Friday', topics: ['Practical Labs', 'Revision'] },
            { day: 'Saturday', topics: ['Project Work', 'Weekly Quiz'] },
            { day: 'Sunday', topics: ['Rest & Review'] },
        ],
        'B.Tech': [
            { day: 'Monday', topics: ['Engineering Math', 'Physics'] },
            { day: 'Tuesday', topics: ['Chemistry', 'Programming in C'] },
            { day: 'Wednesday', topics: ['Basic Electrical', 'Engineering Graphics'] },
            { day: 'Thursday', topics: ['Data Structures', 'Algorithms'] },
            { day: 'Friday', topics: ['Lab Work', 'Workshops'] },
            { day: 'Saturday', topics: ['Mini Project', 'Assignments'] },
            { day: 'Sunday', topics: ['Rest'] },
        ],
        'Other': [
            { day: 'Monday', topics: ['Subject 1', 'Subject 2'] },
            { day: 'Tuesday', topics: ['Subject 3', 'Subject 4'] },
            { day: 'Wednesday', topics: ['Revision', 'Practice'] },
            { day: 'Thursday', topics: ['Subject 1', 'Subject 3'] },
            { day: 'Friday', topics: ['Subject 2', 'Subject 4'] },
            { day: 'Saturday', topics: ['Mock Tests', 'Review'] },
            { day: 'Sunday', topics: ['Rest'] },
        ]
    };

    const currentPlan = studyPlans[selectedSubject] || studyPlans['Other'];

    return (
        <div className="premium-card p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <BookOpen className="text-blue-400" />
                    <span className="text-white text-xl" style={{ width: '150px' }}>Study Planner</span>
                </h3>
                <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="premium-input text-sm py-1.5 px-3 w-auto"
                >
                    <option value="BCA">BCA</option>
                    <option value="B.Tech">B.Tech</option>
                    <option value="Other">Other</option>
                </select>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {currentPlan.map((dayPlan, index) => (
                    <motion.div
                        key={dayPlan.day}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white/5 p-4 rounded-lg hover:bg-white/10 transition-all border border-transparent hover:border-white/10 flex flex-col h-full"
                    >
                        <h4 className="font-bold text-primary mb-3 flex items-center gap-2 text-sm uppercase tracking-wider border-b border-white/5 pb-2">
                            {dayPlan.day.substring(0, 3)}
                        </h4>
                        <ul className="space-y-2.5 flex-1">
                            {dayPlan.topics.map((topic, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400/50 mt-1 flex-shrink-0"></div>
                                    <span className="leading-tight">{topic}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
