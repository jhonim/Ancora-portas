import React, { useState } from 'react';
import { Anchor, Mail, Lock, ArrowRight, AlertTriangle } from 'lucide-react';
import { dataService } from '../services/supabaseService';

interface AuthProps {
  onLoginSuccess: () => void;
}

type AuthMode = 'login' | 'register' | 'recovery';

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'login') {
        const { error } = await dataService.auth.signIn(email, password);
        if (error) throw error;
        onLoginSuccess();
      } else if (mode === 'register') {
        const { error } = await dataService.auth.signUp(email, password);
        if (error) throw error;
        setMessage('Cadastro realizado! Verifique seu email ou faça login.');
        setMode('login');
      } else if (mode === 'recovery') {
        const { error } = await dataService.auth.resetPassword(email);
        if (error) throw error;
        setMessage('Email de recuperação enviado!');
        setMode('login');
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-brand-600 p-8 text-center">
          <div className="mx-auto bg-white/20 w-16 h-16 rounded-xl flex items-center justify-center text-white mb-4 backdrop-blur-sm">
            <Anchor size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">Âncora</h1>
          <p className="text-brand-100 mt-2">Sistema de Orçamentos</p>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">
            {mode === 'login' && 'Bem-vindo de volta'}
            {mode === 'register' && 'Criar nova conta'}
            {mode === 'recovery' && 'Recuperar senha'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-start">
              <AlertTriangle size={16} className="mt-0.5 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-lg">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 text-slate-400" size={20} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            {mode !== 'recovery' && (
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 text-slate-400" size={20} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 text-white p-3 rounded-lg font-semibold hover:bg-brand-700 transition-colors flex items-center justify-center disabled:opacity-70"
            >
              {loading ? 'Processando...' : (
                <>
                  {mode === 'login' && 'Entrar'}
                  {mode === 'register' && 'Cadastrar'}
                  {mode === 'recovery' && 'Enviar Link'}
                  {!loading && <ArrowRight size={20} className="ml-2" />}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm space-y-2">
            {mode === 'login' && (
              <>
                <button onClick={() => setMode('register')} className="text-brand-600 hover:underline block w-full">
                  Não tem conta? Cadastre-se
                </button>
                <button onClick={() => setMode('recovery')} className="text-slate-500 hover:text-slate-700 block w-full">
                  Esqueceu a senha?
                </button>
              </>
            )}
            {(mode === 'register' || mode === 'recovery') && (
              <button onClick={() => setMode('login')} className="text-brand-600 hover:underline">
                Voltar para o login
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};