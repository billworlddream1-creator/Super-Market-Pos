
import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Eye, EyeOff, Store, ArrowRight, ShieldCheck, UserPlus } from 'lucide-react';
import { UserAccount } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface AuthProps {
  onLogin: (user: UserAccount) => void;
  onRegister: (user: UserAccount) => void;
  existingUsers: UserAccount[];
}

const Auth: React.FC<AuthProps> = ({ onLogin, onRegister, existingUsers }) => {
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP' | 'RESET'>('LOGIN');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    setTimeout(() => {
      if (mode === 'RESET') {
        alert('Password reset link sent to your email!');
        setMode('LOGIN');
      } else if (mode === 'LOGIN') {
        const userFound = existingUsers.find(u => u.email === email);
        if (userFound) {
          if (rememberMe) {
            localStorage.setItem('rememberedEmail', email);
          } else {
            localStorage.removeItem('rememberedEmail');
          }
          onLogin(userFound);
        } else {
          setError('User account not found. Please sign up.');
        }
      } else if (mode === 'SIGNUP') {
        if (existingUsers.some(u => u.email === email)) {
          setError('Email already registered.');
        } else {
          const newUser: UserAccount = {
            id: uuidv4(),
            name,
            email,
            role: 'ADMIN', // Default to admin for this demo
            password
          };
          onRegister(newUser);
          onLogin(newUser);
        }
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
        <div className="p-8 md:p-12">
          <div className="flex flex-col items-center mb-8">
            <div className="h-20 w-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl mb-4 rotate-3 hover:rotate-0 transition-transform cursor-pointer">
              <Store size={40} />
            </div>
            <h1 className="text-3xl font-black text-gray-900">SuperMart AI</h1>
            <p className="text-gray-500 text-sm mt-1 font-medium">Enterprise Portal Access</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100 flex items-center animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'SIGNUP' && (
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                <input 
                  type="text" required placeholder="Display Name"
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-medium"
                  value={name} onChange={e => setName(e.target.value)}
                />
              </div>
            )}

            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
              <input 
                type="email" required placeholder="Email Address"
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-medium"
                value={email} onChange={e => setEmail(e.target.value)}
              />
            </div>

            {mode !== 'RESET' && (
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                <input 
                  type={showPassword ? 'text' : 'password'} required placeholder="Access Key / Password"
                  className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-medium"
                  value={password} onChange={e => setPassword(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            )}

            {mode === 'LOGIN' && (
              <div className="flex items-center justify-between text-sm pt-1">
                <label className="flex items-center space-x-2 cursor-pointer text-gray-600 font-medium">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded-lg border-gray-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                  />
                  <span>Keep me signed in</span>
                </label>
                <button type="button" onClick={() => setMode('RESET')} className="text-indigo-600 font-bold hover:underline">
                  Reset Key?
                </button>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black flex items-center justify-center space-x-2 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-xl shadow-indigo-100 disabled:opacity-70 mt-4"
            >
              <span>{loading ? 'Validating...' : mode === 'LOGIN' ? 'Sign In to Portal' : mode === 'SIGNUP' ? 'Join Global Network' : 'Send Recovery Link'}</span>
              {!loading && (mode === 'SIGNUP' ? <UserPlus size={20} /> : <ArrowRight size={20} />)}
            </button>
          </form>

          <div className="mt-8 text-center text-sm font-medium">
            {mode === 'LOGIN' ? (
              <p className="text-gray-500">New operator? <button onClick={() => setMode('SIGNUP')} className="text-indigo-600 font-black hover:underline px-1">Create Account</button></p>
            ) : (
              <p className="text-gray-500">Existing operator? <button onClick={() => setMode('LOGIN')} className="text-indigo-600 font-black hover:underline px-1">Sign In</button></p>
            )}
          </div>
        </div>
        <div className="bg-slate-50 p-5 border-t border-slate-100 flex items-center justify-center space-x-2 text-xs text-slate-400 font-bold tracking-widest uppercase">
          <ShieldCheck size={16} className="text-green-500" />
          <span>Biometric & MFA Ready</span>
        </div>
      </div>
    </div>
  );
};

export default Auth;
