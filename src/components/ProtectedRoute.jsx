import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Loader } from 'lucide-react';

export default function ProtectedRoute({ children, adminOnly = false }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            setLoading(false);
        };
        checkSession();
    }, []);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin text-primary" /></div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (adminOnly && user.email !== 'schedule.manager4@gmail.com') {
        return <Navigate to="/user-dashboard" replace />;
    }

    return children;
}
