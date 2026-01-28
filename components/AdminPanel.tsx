import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Settings, Box, Zap, Cylinder, FileText, Check, X } from 'lucide-react';
import { dataService } from '../services/supabaseService';
import { Profile, Motor, Axle, OptionalItem, AdminTab, Quote } from '../types';

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('quotes');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [motors, setMotors] = useState<Motor[]>([]);
  const [axles, setAxles] = useState<Axle[]>([]);
  const [optionals, setOptionals] = useState<OptionalItem[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);

  // Form States
  const [newProfile, setNewProfile] = useState({ name: '', price_per_m2: 0, weight_per_m2: 0 });
  const [newMotor, setNewMotor] = useState({ name: '', max_weight: 0, price: 0 });
  const [newAxle, setNewAxle] = useState({ name: '', max_width: 0, price: 0 });
  const [newOptional, setNewOptional] = useState({ name: '', price: 0, unit_type: 'fixed' as const });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [p, m, a, o, q] = await Promise.all([
        dataService.getProfiles(),
        dataService.getMotors(),
        dataService.getAxles(),
        dataService.getOptionals(),
        dataService.getQuotes()
      ]);
      setProfiles(p);
      setMotors(m);
      setAxles(a);
      setOptionals(o);
      setQuotes(q);
    } catch (e) {
      console.error(e);
      alert('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddProfile = async () => {
    if (!newProfile.name) return;
    await dataService.addProfile(newProfile);
    setNewProfile({ name: '', price_per_m2: 0, weight_per_m2: 0 });
    fetchData();
  };

  const handleAddMotor = async () => {
    if (!newMotor.name) return;
    await dataService.addMotor(newMotor);
    setNewMotor({ name: '', max_weight: 0, price: 0 });
    fetchData();
  };

  const handleAddAxle = async () => {
    if (!newAxle.name) return;
    await dataService.addAxle(newAxle);
    setNewAxle({ name: '', max_width: 0, price: 0 });
    fetchData();
  };

  const handleAddOptional = async () => {
    if (!newOptional.name) return;
    await dataService.addOptional(newOptional);
    setNewOptional({ name: '', price: 0, unit_type: 'fixed' });
    fetchData();
  };

  const handleDelete = async (type: AdminTab, id: string) => {
    if (!confirm('Tem certeza?')) return;
    if (type === 'profiles') await dataService.deleteProfile(id);
    if (type === 'motors') await dataService.deleteMotor(id);
    if (type === 'axles') await dataService.deleteAxle(id);
    if (type === 'optionals') await dataService.deleteOptional(id);
    if (type === 'quotes') await dataService.deleteQuote(id);
    fetchData();
  };

  const handleApproveQuote = async (id: string) => {
     if(!confirm('Deseja aprovar este orçamento?')) return;
     await dataService.updateQuoteStatus(id, 'approved');
     fetchData();
  };

  const TabButton = ({ id, label, icon: Icon }: { id: AdminTab; label: string; icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-colors whitespace-nowrap text-sm font-medium ${
        activeTab === id 
        ? 'bg-brand-600 text-white shadow-sm' 
        : 'bg-white text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200'
      }`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        <TabButton id="quotes" label="Orçamentos" icon={FileText} />
        <TabButton id="profiles" label="Perfis" icon={Box} />
        <TabButton id="motors" label="Motores" icon={Zap} />
        <TabButton id="axles" label="Eixos" icon={Cylinder} />
        <TabButton id="optionals" label="Opcionais" icon={Settings} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
        {loading ? (
          <div className="text-center py-8 text-slate-500">Carregando dados...</div>
        ) : (
          <>
            {/* QUOTES TAB */}
            {activeTab === 'quotes' && (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <div className="inline-block min-w-full align-middle">
                        <div className="overflow-hidden md:rounded-lg">
                            {quotes.length === 0 ? (
                                <div className="text-center py-10 text-slate-400">Nenhum orçamento salvo.</div>
                            ) : (
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Data</th>
                                        <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Cliente</th>
                                        <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Contato</th>
                                        <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Detalhes</th>
                                        <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Valor Total</th>
                                        <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                                        <th className="px-3 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Ações</th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-200">
                                    {quotes.map(q => (
                                        <tr key={q.id} className="hover:bg-slate-50">
                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {q.created_at ? new Date(q.created_at).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-slate-800">
                                            {q.client?.name || q.customer_name || 'Não informado'}
                                        </td>
                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-600">
                                            <div className="flex flex-col">
                                                <span>{q.client?.phone || '-'}</span>
                                                <span className="text-xs text-slate-400">{q.client?.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {q.quantity}x {q.width}x{q.height}m
                                        </td>
                                        <td className="px-3 py-4 whitespace-nowrap text-sm font-semibold text-brand-600">
                                            R$ {q.total_price?.toLocaleString('pt-BR', {minimumFractionDigits: 2}) || '0,00'}
                                        </td>
                                        <td className="px-3 py-4 whitespace-nowrap">
                                            {q.status === 'approved' ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Aprovado</span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Pendente</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-3">
                                                {q.status !== 'approved' && (
                                                    <button 
                                                        onClick={() => q.id && handleApproveQuote(q.id)} 
                                                        className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 p-2 rounded-full transition-colors"
                                                        title="Aprovar"
                                                    >
                                                        <Check size={18} />
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => q.id && handleDelete('quotes', q.id)} 
                                                    className="text-red-500 hover:text-red-900 bg-red-50 hover:bg-red-100 p-2 rounded-full transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* PROFILES TAB */}
            {activeTab === 'profiles' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end bg-slate-50 p-4 rounded-lg">
                  <div className="col-span-1 sm:col-span-2 lg:col-span-1">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Nome do Perfil</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-500"
                      value={newProfile.name}
                      onChange={e => setNewProfile({...newProfile, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Preço/m² (R$)</label>
                    <input 
                      type="number" 
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-500"
                      value={newProfile.price_per_m2}
                      onChange={e => setNewProfile({...newProfile, price_per_m2: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Peso/m² (kg)</label>
                    <input 
                      type="number" 
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-500"
                      value={newProfile.weight_per_m2}
                      onChange={e => setNewProfile({...newProfile, weight_per_m2: parseFloat(e.target.value)})}
                    />
                  </div>
                  <button 
                    onClick={handleAddProfile}
                    className="w-full bg-brand-600 text-white p-2 rounded hover:bg-brand-700 flex justify-center items-center h-[42px]"
                  >
                    <Plus size={20} /> <span className="ml-2">Adicionar</span>
                  </button>
                </div>

                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Nome</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Preço/m²</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Peso/m²</th>
                        <th className="px-3 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {profiles.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-slate-800">{p.name}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-600">R$ {p.price_per_m2.toFixed(2)}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-600">{p.weight_per_m2} kg</td>
                          <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button onClick={() => handleDelete('profiles', p.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-full">
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* MOTORS TAB */}
            {activeTab === 'motors' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end bg-slate-50 p-4 rounded-lg">
                  <div className="col-span-1 sm:col-span-2 lg:col-span-1">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Nome do Motor</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-500"
                      value={newMotor.name}
                      onChange={e => setNewMotor({...newMotor, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Capacidade (kg)</label>
                    <input 
                      type="number" 
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-500"
                      value={newMotor.max_weight}
                      onChange={e => setNewMotor({...newMotor, max_weight: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Preço (R$)</label>
                    <input 
                      type="number" 
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-500"
                      value={newMotor.price}
                      onChange={e => setNewMotor({...newMotor, price: parseFloat(e.target.value)})}
                    />
                  </div>
                  <button 
                    onClick={handleAddMotor}
                    className="w-full bg-brand-600 text-white p-2 rounded hover:bg-brand-700 flex justify-center items-center h-[42px]"
                  >
                    <Plus size={20} /> <span className="ml-2">Adicionar</span>
                  </button>
                </div>

                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Nome</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Capacidade</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Preço</th>
                        <th className="px-3 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {motors.map(m => (
                        <tr key={m.id} className="hover:bg-slate-50">
                          <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-slate-800">{m.name}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-600">{m.max_weight} kg</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-600">R$ {m.price.toFixed(2)}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button onClick={() => handleDelete('motors', m.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-full">
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* AXLES TAB */}
            {activeTab === 'axles' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end bg-slate-50 p-4 rounded-lg">
                  <div className="col-span-1 sm:col-span-2 lg:col-span-1">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Nome do Eixo</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-500"
                      value={newAxle.name}
                      onChange={e => setNewAxle({...newAxle, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Largura Máx. (m)</label>
                    <input 
                      type="number" 
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-500"
                      value={newAxle.max_width}
                      onChange={e => setNewAxle({...newAxle, max_width: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Preço (R$)</label>
                    <input 
                      type="number" 
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-500"
                      value={newAxle.price}
                      onChange={e => setNewAxle({...newAxle, price: parseFloat(e.target.value)})}
                    />
                  </div>
                  <button 
                    onClick={handleAddAxle}
                    className="w-full bg-brand-600 text-white p-2 rounded hover:bg-brand-700 flex justify-center items-center h-[42px]"
                  >
                    <Plus size={20} /> <span className="ml-2">Adicionar</span>
                  </button>
                </div>

                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Nome</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Limite Largura</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Preço</th>
                        <th className="px-3 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {axles.map(a => (
                        <tr key={a.id} className="hover:bg-slate-50">
                          <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-slate-800">{a.name}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-600">Até {a.max_width} m</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-600">R$ {a.price.toFixed(2)}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button onClick={() => handleDelete('axles', a.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-full">
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* OPTIONALS TAB */}
            {activeTab === 'optionals' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end bg-slate-50 p-4 rounded-lg">
                  <div className="col-span-1 sm:col-span-2 lg:col-span-1">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Nome do Item</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-500"
                      value={newOptional.name}
                      onChange={e => setNewOptional({...newOptional, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Preço (R$)</label>
                    <input 
                      type="number" 
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-500"
                      value={newOptional.price}
                      onChange={e => setNewOptional({...newOptional, price: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Tipo de Unidade</label>
                    <select 
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-500 bg-white"
                      value={newOptional.unit_type}
                      onChange={e => setNewOptional({...newOptional, unit_type: e.target.value as any})}
                    >
                      <option value="fixed">Fixo (unidade)</option>
                      <option value="per_m2">Por m²</option>
                    </select>
                  </div>
                  <button 
                    onClick={handleAddOptional}
                    className="w-full bg-brand-600 text-white p-2 rounded hover:bg-brand-700 flex justify-center items-center h-[42px]"
                  >
                    <Plus size={20} /> <span className="ml-2">Adicionar</span>
                  </button>
                </div>

                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Nome</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Cobrança</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Preço</th>
                        <th className="px-3 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {optionals.map(o => (
                        <tr key={o.id} className="hover:bg-slate-50">
                          <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-slate-800">{o.name}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-600">
                            {o.unit_type === 'per_m2' ? <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Por m²</span> : <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">Fixo</span>}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-600">R$ {o.price.toFixed(2)}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button onClick={() => handleDelete('optionals', o.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-full">
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};