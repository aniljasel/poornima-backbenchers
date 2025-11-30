import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Circle, Trash2, Plus, Calendar } from 'lucide-react';

export default function TodoList({ session }) {
    const [todos, setTodos] = useState([]);
    const [newTask, setNewTask] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTodos();
    }, [session]);

    const fetchTodos = async () => {
        try {
            const { data, error } = await supabase
                .from('todos')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTodos(data || []);
        } catch (error) {
            console.error('Error fetching todos:', error);
        } finally {
            setLoading(false);
        }
    };

    const addTodo = async (e) => {
        e.preventDefault();
        if (!newTask.trim()) return;

        try {
            const { data, error } = await supabase
                .from('todos')
                .insert([
                    { user_id: session.user.id, task: newTask, is_completed: false }
                ])
                .select()
                .single();

            if (error) throw error;
            setTodos([data, ...todos]);
            setNewTask('');
        } catch (error) {
            console.error('Error adding todo:', error);
        }
    };

    const toggleTodo = async (id, currentStatus) => {
        try {
            // Optimistic update
            setTodos(todos.map(t => t.id === id ? { ...t, is_completed: !currentStatus } : t));

            const { error } = await supabase
                .from('todos')
                .update({ is_completed: !currentStatus })
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error toggling todo:', error);
            fetchTodos(); // Revert on error
        }
    };

    const deleteTodo = async (id) => {
        try {
            // Optimistic update
            setTodos(todos.filter(t => t.id !== id));

            const { error } = await supabase
                .from('todos')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting todo:', error);
            fetchTodos(); // Revert on error
        }
    };

    return (
        <div className="premium-card p-6 h-full flex flex-col">
            <h3 className="section-title">
                <CheckCircle className="text-primary" /> My Tasks
            </h3>

            <form onSubmit={addTodo} className="flex gap-3 mb-6">
                <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Add a new task..."
                    className="premium-input flex-1"
                />
                <button type="submit" className="btn-primary p-3 rounded-lg shadow-lg shadow-primary/20">
                    <Plus size={20} />
                </button>
            </form>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                <AnimatePresence>
                    {todos.map(todo => (
                        <motion.div
                            key={todo.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className={`p-4 rounded-lg flex items-center justify-between group transition-all border border-transparent hover:border-white/10 ${todo.is_completed ? 'bg-white/5 opacity-50' : 'bg-white/5 hover:bg-white/10'}`}
                        >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <button
                                    onClick={() => toggleTodo(todo.id, todo.is_completed)}
                                    className={`flex-shrink-0 transition-colors ${todo.is_completed ? 'text-green-400' : 'text-gray-400 hover:text-primary'}`}
                                >
                                    {todo.is_completed ? <CheckCircle size={22} /> : <Circle size={22} />}
                                </button>
                                <span className={`truncate font-medium ${todo.is_completed ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                                    {todo.task}
                                </span>
                            </div>
                            <button
                                onClick={() => deleteTodo(todo.id)}
                                className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110"
                            >
                                <Trash2 size={18} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {todos.length === 0 && !loading && (
                    <div className="text-center text-gray-500 py-12 flex flex-col items-center">
                        <div className="bg-white/5 p-4 rounded-full mb-3">
                            <CheckCircle size={32} className="opacity-50" />
                        </div>
                        <p>No tasks yet. Add one above!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
