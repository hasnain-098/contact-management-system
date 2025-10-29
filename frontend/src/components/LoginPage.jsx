import React, { useState } from "react";

function LoginPage({ onLogin, switchToRegister, error, loading }) {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onLogin(identifier, password);
    };

    return (
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <h2 className="text-2xl font-semibold text-center text-gray-700 mb-6">Login</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <p className="text-red-500 text-sm text-center bg-red-100 p-2 rounded-md border border-red-200">{error}</p>}
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="login-identifier">
                        Email or Phone
                    </label>
                    <input
                        type="text"
                        id="login-identifier"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150"
                        placeholder="your@email.com or +92..."
                        required
                        aria-label="Email or Phone Number"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="login-password">
                        Password
                    </label>
                    <input
                        type="password"
                        id="login-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150"
                        placeholder="••••••••"
                        required
                        aria-label="Password"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading || !identifier || !password}
                    className={`w-full py-2 px-4 rounded-md text-white font-semibold transition duration-150 ${loading || !identifier || !password ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                        }`}
                >
                    {loading ? (
                        <div className="flex justify-center items-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Logging in...
                        </div>
                    ) : 'Login'}
                </button>
            </form>
            <p className="text-center text-sm text-gray-500 mt-6">
                Don't have an account?{' '}
                <button onClick={switchToRegister} className="text-indigo-600 hover:text-indigo-800 font-medium focus:outline-none">
                    Register
                </button>
            </p>
        </div>
    );
}

export default LoginPage;