import React, { useState } from "react";
import PropTypes from 'prop-types'; 
import { EyeIcon, EyeOffIcon, Spinner } from "../utils/Icons";

function LoginPage({ onLogin, switchToRegister, error, loading }) {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

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
                        disabled={loading}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="login-password">
                        Password
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id="login-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150"
                            placeholder="••••••••"
                            required
                            aria-label="Password"
                            disabled={loading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(prev => !prev)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-indigo-600 disabled:opacity-50"
                            disabled={loading}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={loading || !identifier || !password}
                    className={`w-full py-2 px-4 rounded-md text-white font-semibold transition duration-150 ${loading || !identifier || !password ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                        }`}
                >
                    {loading ? (
                        <div className="flex justify-center items-center">
                            <Spinner />
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

LoginPage.propTypes = {
    onLogin: PropTypes.func.isRequired,
    switchToRegister: PropTypes.func.isRequired,
    error: PropTypes.string,
    loading: PropTypes.bool.isRequired,
};

export default LoginPage;