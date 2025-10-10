import React, { useState } from 'react';
import { Eye, EyeOff, Fingerprint, Camera, Mail, Lock, User } from 'lucide-react';
import { CognitoAuth } from '../lib/cognito-auth';

interface EnhancedAuthProps {
  onAuthSuccess: (user: any) => void;
}

const EnhancedAuth: React.FC<EnhancedAuthProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'biometric' | 'face'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'signup') {
        const result = await CognitoAuth.signUp(email, password, name);
        if (result.success) {
          setError('Please check your email for verification code');
        } else {
          setError(result.error || 'Sign up failed');
        }
      } else {
        const result = await CognitoAuth.signIn(email, password);
        if (result.success && result.user) {
          onAuthSuccess(result.user);
        } else {
          setError(result.error || 'Sign in failed');
        }
      }
    } catch (err) {
      setError('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = (provider: 'Google' | 'Facebook' | 'Apple') => {
    const url = CognitoAuth.getSocialSignInUrl(provider);
    window.location.href = url;
  };

  const handleBiometricSetup = async () => {
    setLoading(true);
    const result = await CognitoAuth.setupBiometric(email);
    if (result.success) {
      setError('Biometric authentication set up successfully');
    } else {
      setError(result.error || 'Biometric setup failed');
    }
    setLoading(false);
  };

  const handleBiometricAuth = async () => {
    setLoading(true);
    const result = await CognitoAuth.authenticateWithBiometric();
    if (result.success) {
      onAuthSuccess({ username: 'biometric_user', email: 'biometric@swire.com' });
    } else {
      setError(result.error || 'Biometric authentication failed');
    }
    setLoading(false);
  };

  const handleFaceSetup = async () => {
    setLoading(true);
    const result = await CognitoAuth.setupFaceRecognition();
    if (result.success) {
      setError('Face recognition set up successfully');
    } else {
      setError(result.error || 'Face setup failed');
    }
    setLoading(false);
  };

  const handleFaceAuth = async () => {
    setLoading(true);
    const result = await CognitoAuth.authenticateWithFace();
    if (result.success) {
      onAuthSuccess({ username: 'face_user', email: 'face@swire.com' });
    } else {
      setError(result.error || 'Face authentication failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Swire Intelligence</h1>
          <p className="text-gray-600">Secure Multi-Factor Authentication</p>
        </div>

        {/* Authentication Mode Tabs */}
        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setMode('signin')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              mode === 'signin' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600'
            }`}>
            Sign In
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              mode === 'signup' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600'
            }`}>
            Sign Up
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Full Name"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Email address"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 transition-colors">
            {loading ? 'Processing...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        {/* Social Authentication */}
        <div className="mb-6">
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleSocialAuth('Google')}
              className="flex justify-center items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-sm font-medium">Google</span>
            </button>
            <button
              onClick={() => handleSocialAuth('Facebook')}
              className="flex justify-center items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-sm font-medium">Facebook</span>
            </button>
            <button
              onClick={() => handleSocialAuth('Apple')}
              className="flex justify-center items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-sm font-medium">Apple</span>
            </button>
          </div>
        </div>

        {/* Biometric Authentication */}
        <div className="space-y-3">
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Biometric Options</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleBiometricAuth}
              className="flex flex-col items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Fingerprint className="h-6 w-6 text-green-600 mb-2" />
              <span className="text-sm font-medium">Fingerprint</span>
            </button>
            <button
              onClick={handleFaceAuth}
              className="flex flex-col items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Camera className="h-6 w-6 text-green-600 mb-2" />
              <span className="text-sm font-medium">Face ID</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-2">
            <button
              onClick={handleBiometricSetup}
              className="text-xs text-green-600 hover:text-green-700">
              Setup Fingerprint
            </button>
            <button
              onClick={handleFaceSetup}
              className="text-xs text-green-600 hover:text-green-700">
              Setup Face ID
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAuth;