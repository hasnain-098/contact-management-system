import React, { useState, useEffect } from "react";
import PropTypes from 'prop-types'; 
import { EyeIcon, EyeOffIcon, Spinner } from "../utils/Icons";

function RegisterPage({ onRegister, switchToLogin, error, loading }) {

    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMatch, setPasswordMatch] = useState(true);
    const [matchError, setMatchError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        const match = password === confirmPassword;
        setPasswordMatch(match || confirmPassword === '');
        if (!match && confirmPassword != '') {
            setMatchError("Passwords do not match.");
        } else {
            setMatchError("");
        }
    }, [password, confirmPassword])

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!passwordMatch) {
            return;
        }

        onRegister(identifier, password);
    };

    return (
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <h2 className="text-2xl font-semibold text-center text-gray-700 mb-6">Register</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <p className="text-red-500 text-sm text-center bg-red-100 p-2 rounded-md border border-red-200">{error}</p>}
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="register-identifier">
                        Email or Phone
                    </label>
                    <input
                        type="text"
                        id="register-identifier"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150"
                        placeholder="your@email.com or +92..."
                        required
                        aria-label="Email or Phone Number"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="register-password">
                        Password
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id="register-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150"
                            placeholder="••••••••"
                            required
                            aria-label="Password"
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
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="confirm-password">
                        Confirm Password
                    </label>
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            id="confirm-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent transition duration-150 ${passwordMatch ? 'border-gray-300 focus:ring-indigo-500' : 'border-red-500 focus:ring-red-500'}`}
                            placeholder="••••••••"
                            required
                            aria-label="Confirm Password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(prev => !prev)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-indigo-600 disabled:opacity-50"
                            disabled={loading}
                            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                            {showConfirmPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </button>
                    </div>
                    {matchError && (
                        <p className="text-red-500 text-xs mt-1">{matchError}</p>
                    )}
                </div>
                <button
                    type="submit"
                    disabled={loading || !passwordMatch || !password || !confirmPassword}
                    className={`w-full py-2 px-4 rounded-md text-white font-semibold transition duration-150 ${loading || !passwordMatch || !password || !confirmPassword ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                        }`}
                >
                    {loading ? (
                        <div className="flex justify-center items-center">
                            <Spinner />
                            Registering...
                        </div>
                    ) : 'Register'}
                </button>
            </form>
            <p className="text-center text-sm text-gray-500 mt-6">
                Already have an account?{' '}
                <button onClick={switchToLogin} className="text-indigo-600 hover:text-indigo-800 font-medium focus:outline-none">
                    Login
                </button>
            </p>
        </div>
    );
}

RegisterPage.propTypes = {
    onRegister: PropTypes.func.isRequired,
    switchToLogin: PropTypes.func.isRequired,
    error: PropTypes.string,
    loading: PropTypes.bool.isRequired,
};

export default RegisterPage;