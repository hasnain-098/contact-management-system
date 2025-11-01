import React, { useState, useEffect } from "react";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import ContactListPage from "./components/ContactListPage";

const API_BASE_URL = 'http://localhost:8080/api/auth';

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
    return /^(?:\+92-\d{3}-\d{7}|03\d{9})$/.test(phone);
}

function App() {

    const [view, setView] = useState(localStorage.getItem('authToken') ? 'contacts' : 'login');
    const [token, setToken] = useState(localStorage.getItem('authToken') || null);
    const [username, setUsername] = useState(localStorage.getItem('username') || null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (token && username) {
            localStorage.setItem('authToken', token);
            localStorage.setItem('username', username);
            setView('contacts');
        } else {
            localStorage.removeItem('authToken');
            localStorage.removeItem('username');
            setView('login');
        }
    }, [token, username])

    const handleLogin = async (identifier, password) => {
        setError('');
        setLoading(true);
        console.log('Attempting to login for:', identifier);
        if (!identifier || !password) {
            setError('Identifier and password are required.');
            setLoading(false);
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, password })
            });
            const data = await response.json()
                .catch(() => ({ error: `Request failed with status: ${response.status}` }));
            if (!response.ok) {
                throw new Error(data.error || `Login failed: ${response.statusText || response.status}`);
            }
            if (data.token && data.username) {
                setToken(data.token);
                setUsername(data.username);
            } else {
                throw new Error('Invalid response from server during login');
            }
        } catch (err) {
            console.log('Login error:', err);
            setError(err.message || 'An error occured during login');
            setToken(null);
            setUsername(null);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (identifier, password) => {
        setError('');
        setLoading(true);
        console.log('Attempting registration for:', identifier);
        if (!identifier || !password) {
            setError('Identifier and password are required.');
            setLoading(false);
            return;
        }
        if (!isValidEmail(identifier) && !isValidPhone(identifier)) {
            setError('Identifier must be a valid email or phone number.');
            setLoading(false);
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, password }),
            });
            const data = await response.json()
                .catch(({ error: `Request failed with status: ${response.status}` }));
            if (!response.ok) {
                throw new Error(data.error || `Registration failed: ${response.statusText || response.status}`);
            }
            console.log('Registration successful:', data);
            setView('login');
            setError('Registration successful! Please log in.');
        } catch (err) {
            console.error('Registration error:', err);
            setError(err.message || 'An error occurred during registration.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        console.log('Logging out');
        setToken(null);
        setUsername(null);
        setError('');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 font-sans flex flex-col items-center justify-center p-4">
            {!token && < h1 className="text-4xl font-bold text-indigo-700 mb-8 drop-shadow-md font-['Inter',_sans-serif]">Contact Management System</h1>}

            {!token ? (
                view === 'login' ? (
                    <LoginPage
                        onLogin={handleLogin}
                        switchToRegister={() => { setView('register'); setError(''); }}
                        error={error}
                        loading={loading}
                    />
                ) : (
                    <RegisterPage
                        onRegister={handleRegister}
                        switchToLogin={() => { setView('login'); setError(''); }}
                        error={error}
                        loading={loading}
                    />
                )
            ) : (
                <ContactListPage
                    token={token}
                    username={username}
                    onLogout={handleLogout}
                />
            )}
        </div>
    );
}

export default App;