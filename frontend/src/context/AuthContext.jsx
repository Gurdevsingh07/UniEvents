import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (stored && token) {
            setUser(JSON.parse(stored));

            // Transparently refresh user profile (including dynamic permissions) in the background
            api.get('/api/auth/me')
                .then(res => {
                    if (res?.data?.data) {
                        setUser(prev => {
                            const updated = { ...prev, ...res.data.data, token };
                            localStorage.setItem('user', JSON.stringify(updated));
                            return updated;
                        });
                    }
                })
                .catch(err => console.error("Silently failed to refresh user session", err));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const res = await api.post('/api/auth/login', { email, password });
        const data = res.data.data;
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data));
        setUser(data);
        return data;
    };

    const register = async (formData) => {
        const res = await api.post('/api/auth/register', formData);
        const data = res.data.data;
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data));
        setUser(data);
        return data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const updateUser = (userData) => {
        setUser(prev => {
            const updated = { ...prev, ...userData };
            localStorage.setItem('user', JSON.stringify(updated));
            return updated;
        });
    };

    const isAdmin = () => user?.role === 'ADMIN';
    const isOrganizer = () => user?.role === 'ORGANIZER';
    const isStudent = () => user?.role === 'STUDENT';

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, isAdmin, isOrganizer, isStudent }}>
            {children}
        </AuthContext.Provider>
    );
};
