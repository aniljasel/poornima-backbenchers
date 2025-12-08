import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, BookOpen, Loader, Search } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Courses() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('courses')
                .select('*, subjects(name)')
                .eq('is_published', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCourses(data || []);
        } catch (error) {
            console.error('Error fetching courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const categories = ['All', ...new Set(courses.map(course => course.subjects?.name).filter(Boolean))];

    const filteredCourses = courses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || course.subjects?.name === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen pt-20">
                <Loader className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    return (
        <div className="container pt-24 pb-12 min-h-screen">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12 text-center"
            >
                <h1 className="text-4xl font-bold mb-4" style={{fontSize: '3rem'}}>
                    Industry-Ready <span className="text-primary">Courses</span>
                </h1>
                <p className="text-gray-400 max-w-2xl mb-4 mx-auto">
                    Master the latest technologies with our curated collection of courses designed to boost your career in the IT industry.
                </p>
            </motion.div>

            {/* Filters */}
            <div className="mb-10 flex flex-col md:flex-row justify-between items-center gap-6">
                {/* <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${selectedCategory === category
                                ? 'bg-primary text-black'
                                : 'bg-white-5 text-gray-400 hover:text-white hover:bg-white-10'
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div> */}

                <div className="relative w-full md:w-72 flex items-center">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search courses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field w-full"
                        style={{ paddingLeft: '2.5rem' }}
                    />
                </div>
            </div>

            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" style={{ marginBottom: '2rem', marginTop: '2rem' }}>
                {filteredCourses.map((course, index) => (
                    <motion.div
                        key={course.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="course-card rounded-xl group"
                    >
                        {course.image_url && (
                            <div className="h-48 overflow-hidden relative">
                                <img
                                    src={course.image_url}
                                    alt={course.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black-80 to-transparent opacity-60"></div>
                                <span className="absolute top-3 right-3 course-badge px-3 p-2 rounded-full text-xs font-bold text-white">
                                    {course.subjects?.name || 'General'}
                                </span>
                            </div>
                        )}
                        <div className="p-6">
                            <h3 className="text-xl font-bold mb-2 text-white group-hover:text-primary transition-colors line-clamp-1">{course.title}</h3>
                            <p className="text-gray-400 text-sm mb-4 line-clamp-3 h-15">{course.description}</p>

                            <a
                                href={course.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-primary hover:text-white font-medium text-sm course-link-btn pb-1"
                            >
                                Start Learning <ExternalLink size={16} />
                            </a>
                        </div>
                    </motion.div>
                ))}
            </div>

            {filteredCourses.length === 0 && (
                <div className="text-center py-20">
                    <div className="bg-white-5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen size={32} className="text-gray-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-300 mb-2">No Courses Found</h3>
                    <p className="text-gray-500">Try adjusting your search or category filters.</p>
                </div>
            )}
        </div>
    );
}
