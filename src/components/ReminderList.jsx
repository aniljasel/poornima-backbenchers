import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';
import { Bell, Calendar, Plus, Trash2, Clock } from 'lucide-react';

export default function ReminderList({ session }) {
    const [reminders, setReminders] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [newReminder, setNewReminder] = useState({
        title: '',
        date: '',
        type: 'assignment' // 'exam', 'assignment', 'study', 'other'
    });

    useEffect(() => {
        fetchReminders();
    }, [session]);

    const fetchReminders = async () => {
        try {
            const { data, error } = await supabase
                .from('reminders')
                .select('*')
                .eq('user_id', session.user.id)
                .order('reminder_date', { ascending: true });

            if (error) throw error;
            setReminders(data || []);
        } catch (error) {
            console.error('Error fetching reminders:', error);
        }
    };

    const addReminder = async (e) => {
        e.preventDefault();
        if (!newReminder.title || !newReminder.date) return;

        try {
            const { data, error } = await supabase
                .from('reminders')
                .insert([
                    {
                        user_id: session.user.id,
                        title: newReminder.title,
                        reminder_date: new Date(newReminder.date).toISOString(),
                        type: newReminder.type
                    }
                ])
                .select()
                .single();

            if (error) throw error;
            setReminders([...reminders, data].sort((a, b) => new Date(a.reminder_date) - new Date(b.reminder_date)));
            setNewReminder({ title: '', date: '', type: 'assignment' });
            setShowForm(false);
        } catch (error) {
            console.error('Error adding reminder:', error);
        }
    };

    const deleteReminder = async (id) => {
        try {
            setReminders(reminders.filter(r => r.id !== id));
            await supabase.from('reminders').delete().eq('id', id);
        } catch (error) {
            console.error('Error deleting reminder:', error);
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'exam': return 'text-red-400 bg-red-400/10';
            case 'assignment': return 'text-yellow-400 bg-yellow-400/10';
            case 'study': return 'text-blue-400 bg-blue-400/10';
            default: return 'text-gray-400 bg-gray-400/10';
        }
    };

    return (
        <div className="premium-card p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <Bell className="text-yellow-400" /> Reminders
                </h3>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className={`p-2 rounded-full transition-all ${showForm ? 'bg-red-500/20 text-red-400 rotate-45' : 'bg-primary/20 text-primary hover:bg-primary/30'}`}
                >
                    <Plus size={20} />
                </button>
            </div>

            {showForm && (
                <motion.form
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mb-6 space-y-4 overflow-hidden bg-white/5 p-4 rounded-lg border border-white/10"
                    onSubmit={addReminder}
                >
                    <input
                        type="text"
                        placeholder="Title (e.g., Math Exam)"
                        value={newReminder.title}
                        onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                        className="premium-input w-full text-sm"
                    />
                    <div className="flex gap-3">
                        <input
                            type="datetime-local"
                            value={newReminder.date}
                            onChange={(e) => setNewReminder({ ...newReminder, date: e.target.value })}
                            className="premium-input flex-1 text-sm"
                        />
                        <select
                            value={newReminder.type}
                            onChange={(e) => setNewReminder({ ...newReminder, type: e.target.value })}
                            className="premium-input text-sm w-32"
                        >
                            <option value="assignment">Assignment</option>
                            <option value="exam">Exam</option>
                            <option value="study">Study</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <button type="submit" className="btn-primary w-full text-sm py-2 shadow-lg shadow-primary/20">Add Reminder</button>
                </motion.form>
            )}

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                {reminders.map(reminder => (
                    <div
                        key={reminder.id}
                        className="group flex items-center justify-between p-4 bg-white/5 rounded-lg border border-transparent hover:border-white/10 transition-all hover:bg-white/10"
                    >
                        {/* This wrapper ensures the Icon and Text stick together (the fix) */}
                        <div className="flex items-center gap-4">

                            <div className={`p-3 rounded-xl ${getTypeColor(reminder.type)}`}>
                                <Calendar size={20} />
                            </div>

                            <div className="text-left">
                                <h4 className="font-semibold truncate text-gray-200">{reminder.title}</h4>
                                <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-1">
                                    <Clock size={12} />
                                    {new Date(reminder.reminder_date).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {/* Delete button is pushed to the far right by outer justify-between */}
                        <button
                            onClick={() => deleteReminder(reminder.id)}
                            className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}

                {reminders.length === 0 && !showForm && (
                    <div className="text-center text-gray-500 py-12 flex flex-col items-center">
                        <div className="bg-white/5 p-4 rounded-full mb-3">
                            <Bell size={32} className="opacity-50" />
                        </div>
                        <p>No upcoming reminders.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
