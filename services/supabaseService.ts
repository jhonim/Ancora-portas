import { createClient } from '@supabase/supabase-js';
import { Profile, Motor, Axle, OptionalItem, Client, Quote } from '../types';

// NOTE: In a real production environment, these would be in .env
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

const isMock = !SUPABASE_URL || !SUPABASE_KEY;

let supabase: any = null;
if (!isMock) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
}

// --- Mock Data ---
const MOCK_PROFILES: Profile[] = [
  { id: '1', name: 'Perfil Meia Cana Fechada', price_per_m2: 250, weight_per_m2: 10 },
  { id: '2', name: 'Perfil Transvision', price_per_m2: 300, weight_per_m2: 8 },
  { id: '3', name: 'Perfil Lâmina Vazada', price_per_m2: 280, weight_per_m2: 9 },
];

const MOCK_MOTORS: Motor[] = [
  { id: '1', name: 'Motor AC 200kg', max_weight: 200, price: 1200 },
  { id: '2', name: 'Motor AC 400kg', max_weight: 400, price: 1800 },
  { id: '3', name: 'Motor DC 600kg (Alto Fluxo)', max_weight: 600, price: 2500 },
  { id: '4', name: 'Motor Industrial 1000kg', max_weight: 1000, price: 4000 },
];

const MOCK_AXLES: Axle[] = [
  { id: '1', name: 'Eixo 4.5" (até 4m)', max_width: 4, price: 400 },
  { id: '2', name: 'Eixo 6" (até 8m)', max_width: 8, price: 800 },
  { id: '3', name: 'Eixo 8" Industrial (até 12m)', max_width: 12, price: 1500 },
];

const MOCK_OPTIONALS: OptionalItem[] = [
  { id: '1', name: 'Pintura Eletrostática', price: 50, unit_type: 'per_m2' },
  { id: '2', name: 'Controle Remoto Extra', price: 80, unit_type: 'fixed' },
  { id: '3', name: 'Nobreak', price: 600, unit_type: 'fixed' },
  { id: '4', name: 'Sensor de Barreira', price: 150, unit_type: 'fixed' },
];

const MOCK_QUOTES: Quote[] = []; // In-memory storage for mock quotes

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const dataService = {
  // --- Auth (Mocked & Real) ---
  auth: {
    signIn: async (email: string, password: string) => {
      if (isMock) {
        await delay(500);
        if (email === 'admin@ancora.com' && password === 'admin') {
          localStorage.setItem('ancora_session', JSON.stringify({ user: { email } }));
          return { data: { user: { email } }, error: null };
        }
        return { data: null, error: { message: 'Credenciais inválidas. (Mock: use admin@ancora.com / admin)' } };
      }
      return supabase.auth.signInWithPassword({ email, password });
    },
    signUp: async (email: string, password: string) => {
      if (isMock) {
        await delay(500);
        return { data: { user: { email } }, error: null };
      }
      return supabase.auth.signUp({ email, password });
    },
    signOut: async () => {
      if (isMock) {
        localStorage.removeItem('ancora_session');
        return;
      }
      return supabase.auth.signOut();
    },
    getSession: async () => {
      if (isMock) {
        const session = localStorage.getItem('ancora_session');
        return session ? { data: { session: JSON.parse(session) } } : { data: { session: null } };
      }
      return supabase.auth.getSession();
    },
    resetPassword: async (email: string) => {
      if (isMock) {
         await delay(500);
         return { error: null };
      }
      return supabase.auth.resetPasswordForEmail(email);
    }
  },

  // --- Data Getters ---
  getProfiles: async (): Promise<Profile[]> => {
    if (isMock) { await delay(300); return [...MOCK_PROFILES]; }
    const { data, error } = await supabase.from('tab_profiles').select('*');
    if (error) throw error;
    return data;
  },

  getMotors: async (): Promise<Motor[]> => {
    if (isMock) { await delay(300); return [...MOCK_MOTORS]; }
    const { data, error } = await supabase.from('tab_motors').select('*');
    if (error) throw error;
    return data;
  },

  getAxles: async (): Promise<Axle[]> => {
    if (isMock) { await delay(300); return [...MOCK_AXLES]; }
    const { data, error } = await supabase.from('tab_axles').select('*');
    if (error) throw error;
    return data;
  },

  getOptionals: async (): Promise<OptionalItem[]> => {
    if (isMock) { await delay(300); return [...MOCK_OPTIONALS]; }
    const { data, error } = await supabase.from('tab_optionals').select('*');
    if (error) throw error;
    return data;
  },

  getQuotes: async (): Promise<Quote[]> => {
    if (isMock) { 
        await delay(300); 
        return [...MOCK_QUOTES].sort((a,b) => (b.created_at || '').localeCompare(a.created_at || '')); 
    }
    // Fetch quotes with client data joined
    const { data, error } = await supabase
        .from('tab_quotes')
        .select('*, client:tab_clients(*)')
        .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // --- Data Mutations (Admin) ---
  addProfile: async (profile: Omit<Profile, 'id'>) => {
    if (isMock) { MOCK_PROFILES.push({ ...profile, id: Math.random().toString(36).substr(2, 9) }); return; }
    await supabase.from('tab_profiles').insert(profile);
  },
  deleteProfile: async (id: string) => {
    if(isMock) { const idx = MOCK_PROFILES.findIndex(p => p.id === id); if(idx > -1) MOCK_PROFILES.splice(idx, 1); return; }
    await supabase.from('tab_profiles').delete().eq('id', id);
  },

  addMotor: async (motor: Omit<Motor, 'id'>) => {
    if (isMock) { MOCK_MOTORS.push({ ...motor, id: Math.random().toString(36).substr(2, 9) }); return; }
    await supabase.from('tab_motors').insert(motor);
  },
  deleteMotor: async (id: string) => {
     if(isMock) { const idx = MOCK_MOTORS.findIndex(p => p.id === id); if(idx > -1) MOCK_MOTORS.splice(idx, 1); return; }
    await supabase.from('tab_motors').delete().eq('id', id);
  },

  addAxle: async (axle: Omit<Axle, 'id'>) => {
    if (isMock) { MOCK_AXLES.push({ ...axle, id: Math.random().toString(36).substr(2, 9) }); return; }
    await supabase.from('tab_axles').insert(axle);
  },
  deleteAxle: async (id: string) => {
     if(isMock) { const idx = MOCK_AXLES.findIndex(p => p.id === id); if(idx > -1) MOCK_AXLES.splice(idx, 1); return; }
    await supabase.from('tab_axles').delete().eq('id', id);
  },

  addOptional: async (opt: Omit<OptionalItem, 'id'>) => {
    if (isMock) { MOCK_OPTIONALS.push({ ...opt, id: Math.random().toString(36).substr(2, 9) }); return; }
    await supabase.from('tab_optionals').insert(opt);
  },
  deleteOptional: async (id: string) => {
     if(isMock) { const idx = MOCK_OPTIONALS.findIndex(p => p.id === id); if(idx > -1) MOCK_OPTIONALS.splice(idx, 1); return; }
    await supabase.from('tab_optionals').delete().eq('id', id);
  },

  // --- Quote Management ---
  updateQuoteStatus: async (id: string, status: 'approved' | 'pending') => {
    if (isMock) {
        const q = MOCK_QUOTES.find(q => q.id === id);
        if (q) q.status = status;
        return;
    }
    await supabase.from('tab_quotes').update({ status }).eq('id', id);
  },

  deleteQuote: async (id: string) => {
    if (isMock) {
        const idx = MOCK_QUOTES.findIndex(q => q.id === id);
        if (idx > -1) MOCK_QUOTES.splice(idx, 1);
        return;
    }
    await supabase.from('tab_quotes').delete().eq('id', id);
  },

  // --- Business Transactions (Quotes) ---
  saveQuote: async (client: Omit<Client, 'id'>, quoteData: any, optionals: string[]) => {
    if (isMock) {
        await delay(800);
        const clientId = Math.random().toString(36).substr(2, 9);
        const newClient = { ...client, id: clientId, created_at: new Date().toISOString() };
        
        const quoteId = Math.random().toString(36).substr(2, 9);
        const newQuote = {
             ...quoteData, 
             id: quoteId, 
             client_id: clientId, 
             client: newClient,
             customer_name: client.name,
             status: 'pending',
             created_at: new Date().toISOString() 
        };
        MOCK_QUOTES.push(newQuote);
        
        console.log("Mock Save:", { client, quoteData, optionals });
        return { success: true, quoteId };
    }

    try {
        // 1. Insert Client
        const { data: clientResult, error: clientError } = await supabase
            .from('tab_clients')
            .insert(client)
            .select()
            .single();
        
        if (clientError) throw clientError;
        const clientId = clientResult.id;

        // 2. Insert Quote
        const { data: quoteResult, error: quoteError } = await supabase
            .from('tab_quotes')
            .insert({
                ...quoteData,
                client_id: clientId,
                status: 'pending' // Default status
            })
            .select()
            .single();

        if (quoteError) throw quoteError;
        const quoteId = quoteResult.id;

        // 3. Insert Quote Optionals (Junction)
        if (optionals.length > 0) {
            const junctionData = optionals.map(optId => ({
                quote_id: quoteId,
                optional_id: optId
            }));

            const { error: optError } = await supabase
                .from('tab_quote_optionals')
                .insert(junctionData);
            
            if (optError) throw optError;
        }

        return { success: true, quoteId };

    } catch (error) {
        console.error("Error saving quote sequence:", error);
        throw error;
    }
  }
};