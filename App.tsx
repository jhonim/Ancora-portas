import React, { useState, useEffect } from 'react';
import { Anchor, LayoutDashboard, Calculator, LogOut, User } from 'lucide-react';
import { AdminPanel } from './components/AdminPanel';
import { QuoteCalculator } from './components/QuoteCalculator';
import { Auth } from './components/Auth';
import { dataService } from './services/supabaseService';
import { ViewMode } from './types';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('quote');

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data } = await dataService.auth.getSession();
      setSession(data.session);
    } catch (error) {
      console.error("Erro ao verificar sessão:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await dataService.auth.signOut();
    setSession(null);
    setView('quote'); // Resetar view ao sair
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-500 font-medium">
        <div className="flex flex-col items-center animate-pulse">
          <Anchor size={48} className="text-brand-300 mb-4" />
          <span>Carregando sistema...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Auth onLoginSuccess={checkSession} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-brand-600 p-2 rounded-lg text-white shadow-md">
              <Anchor size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">
              Âncora <span className="text-slate-400 font-normal hidden sm:inline">| Sistema de Orçamentos</span>
            </h1>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <nav className="flex items-center space-x-2">
              <button 
                onClick={() => setView('quote')}
                className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  view === 'quote' 
                  ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200' 
                  : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Calculator size={18} />
                <span className="hidden md:inline">Novo Orçamento</span>
              </button>
              <button 
                onClick={() => setView('admin')}
                className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  view === 'admin' 
                  ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200' 
                  : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <LayoutDashboard size={18} />
                <span className="hidden md:inline">Administração</span>
              </button>
            </nav>
            
            <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>
            
            <button 
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
              title="Sair"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'quote' ? (
          <div className="animate-fadeIn">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Calculadora de Orçamento</h2>
              <p className="text-slate-500">Preencha as dimensões e selecione os itens para gerar o orçamento.</p>
            </div>
            <QuoteCalculator />
          </div>
        ) : (
          <div className="animate-fadeIn">
             <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Painel Administrativo</h2>
              <p className="text-slate-500">Gerencie perfis, motores, eixos e itens opcionais.</p>
            </div>
            <AdminPanel />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 mt-12 py-8">
         <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center text-center text-slate-400 text-sm space-y-2">
            <p>&copy; {new Date().getFullYear()} Âncora Portas. Todos os direitos reservados.</p>
            <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1 rounded-full">
              <User size={12} />
              <span>Logado como: <span className="font-medium text-slate-600">{session.user.email}</span></span>
            </div>
         </div>
      </footer>
    </div>
  );
}