import React, { useState, useEffect, useMemo } from 'react';
import { Download, Calculator, Check, AlertCircle, Cylinder, Zap, Save, Loader2, User, Phone, Mail, MapPin } from 'lucide-react';
import { Profile, Motor, Axle, OptionalItem } from '../types';
import { dataService } from '../services/supabaseService';

declare global {
  interface Window {
    jspdf: any;
  }
}

export const QuoteCalculator: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [motors, setMotors] = useState<Motor[]>([]);
  const [axles, setAxles] = useState<Axle[]>([]);
  const [optionals, setOptionals] = useState<OptionalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Client State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // Dimensions State
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [roll, setRoll] = useState<number>(0.4); // Default rolo 40cm
  const [quantity, setQuantity] = useState<number>(1);
  
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  
  // Motor State
  const [autoMotor, setAutoMotor] = useState(true);
  const [manualMotorId, setManualMotorId] = useState<string>('');

  // Axle State
  const [autoAxle, setAutoAxle] = useState(true);
  const [manualAxleId, setManualAxleId] = useState<string>('');

  const [selectedOptionalIds, setSelectedOptionalIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const init = async () => {
      try {
        const [p, m, a, o] = await Promise.all([
          dataService.getProfiles(),
          dataService.getMotors(),
          dataService.getAxles(),
          dataService.getOptionals()
        ]);
        setProfiles(p);
        setMotors(m);
        setAxles(a);
        setOptionals(o);
        if (p.length > 0) setSelectedProfileId(p[0].id);
      } catch (e) {
        console.error("Error fetching data", e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // --- Calculations ---
  const calculationResult = useMemo(() => {
    const profile = profiles.find(p => p.id === selectedProfileId);
    if (!profile) return null;

    // Formula: Area = (Height + Roll) * Width
    const areaPerGate = (height + roll) * width;
    const totalArea = areaPerGate * quantity;
    
    // Weight for ONE gate (to select motor)
    const gateWeight = areaPerGate * profile.weight_per_m2;

    // 1. Motor Selection
    let selectedMotor: Motor | undefined;
    if (autoMotor) {
      // Find cheapest motor that can handle the weight of ONE gate
      const validMotors = motors
        .filter(m => m.max_weight >= gateWeight)
        .sort((a, b) => a.price - b.price);
      selectedMotor = validMotors.length > 0 ? validMotors[0] : undefined;
    } else {
      selectedMotor = motors.find(m => m.id === manualMotorId);
    }

    // 2. Axle Selection
    let selectedAxle: Axle | undefined;
    if (autoAxle) {
        // Automatic: Find cheapest axle that supports the width
        const validAxles = axles
          .filter(a => a.max_width >= width)
          .sort((a, b) => a.price - b.price);
        selectedAxle = validAxles.length > 0 ? validAxles[0] : undefined;
    } else {
        // Manual
        selectedAxle = axles.find(a => a.id === manualAxleId);
    }

    // 3. Pricing
    const basePrice = totalArea * profile.price_per_m2;
    const motorPrice = selectedMotor ? (selectedMotor.price * quantity) : 0;
    const axlePrice = selectedAxle ? (selectedAxle.price * quantity) : 0;
    
    // Optionals
    let optionalsTotal = 0;
    const optionalDetails: {name: string, price: number}[] = [];

    optionals.forEach(opt => {
      if (selectedOptionalIds.has(opt.id)) {
        let price = opt.price;
        if (opt.unit_type === 'per_m2') {
          price = opt.price * totalArea; // Apply to total area
        } else {
          price = opt.price * quantity; // Apply to fixed unit * quantity
        }
        optionalsTotal += price;
        optionalDetails.push({ name: opt.name, price });
      }
    });

    const totalPrice = basePrice + motorPrice + axlePrice + optionalsTotal;
    const pricePerGate = totalPrice / quantity;

    return {
      areaPerGate,
      totalArea,
      gateWeight,
      selectedMotor,
      selectedAxle,
      basePrice,
      motorPrice,
      axlePrice,
      optionalsTotal,
      optionalDetails,
      totalPrice,
      pricePerGate,
      profileName: profile.name,
      isValid: width > 0 && height > 0 && quantity > 0 && !!selectedMotor && !!selectedAxle
    };
  }, [width, height, roll, quantity, selectedProfileId, autoMotor, manualMotorId, autoAxle, manualAxleId, selectedOptionalIds, profiles, motors, axles, optionals]);

  const toggleOptional = (id: string) => {
    const next = new Set(selectedOptionalIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedOptionalIds(next);
  };

  const handleSaveAndPDF = async () => {
    if (!calculationResult || !window.jspdf) return;
    setSaving(true);

    try {
        // 1. Save to Database
        await dataService.saveQuote(
            {
                name: customerName,
                phone: customerPhone,
                email: customerEmail,
                address: customerAddress
            },
            {
                width,
                height,
                roll,
                quantity,
                profile_id: selectedProfileId,
                motor_id: calculationResult.selectedMotor?.id || null,
                axle_id: calculationResult.selectedAxle?.id || null,
                total_price: calculationResult.totalPrice
            },
            Array.from(selectedOptionalIds)
        );

        // 2. Generate PDF
        generatePDF();
        alert("Orçamento salvo e PDF gerado com sucesso!");

    } catch (error) {
        console.error(error);
        alert("Erro ao salvar orçamento. Tente novamente.");
    } finally {
        setSaving(false);
    }
  };

  // --- PDF Generation ---
  const generatePDF = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.setTextColor(14, 165, 233);
    doc.text("Âncora - Orçamentos", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Data: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Client Info Box
    doc.setDrawColor(200);
    doc.setFillColor(250);
    doc.rect(14, 35, 180, 28, 'F');
    
    doc.setFontSize(11);
    doc.setTextColor(50);
    doc.text("Dados do Cliente:", 18, 42);
    doc.setFontSize(10);
    doc.text(`Nome: ${customerName || 'Não informado'}`, 18, 48);
    doc.text(`Tel: ${customerPhone || '-'}`, 18, 53);
    doc.text(`Email: ${customerEmail || '-'}`, 110, 48);
    doc.text(`Endereço: ${customerAddress || '-'}`, 110, 53);


    const tableBody = [];
    
    // 1. Portão Info
    if (calculationResult) {
        tableBody.push([
        `${quantity}x Portão (${width.toFixed(2)}m x ${height.toFixed(2)}m)\n` +
        `Perfil: ${calculationResult.profileName}\n` +
        `Motor: ${calculationResult.selectedMotor?.name || 'N/A'}\n` +
        `Eixo: ${calculationResult.selectedAxle?.name || 'N/A'}`,
        `R$ ${(calculationResult.basePrice + calculationResult.motorPrice + calculationResult.axlePrice).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`
        ]);

        // 2. Optionals
        calculationResult.optionalDetails.forEach(opt => {
        tableBody.push([
            `Opcional: ${opt.name}`,
            `R$ ${opt.price.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`
        ]);
        });

        // 3. Totals
        tableBody.push([
        { content: 'Valor Unitário (por portão)', styles: { fontStyle: 'italic', halign: 'right' } },
        { content: `R$ ${calculationResult.pricePerGate.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, styles: { fontStyle: 'italic' } }
        ]);

        tableBody.push([
        { content: 'TOTAL GERAL', styles: { fontStyle: 'bold', fillColor: [240, 249, 255] } },
        { content: `R$ ${calculationResult.totalPrice.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, styles: { fontStyle: 'bold', fillColor: [240, 249, 255] } }
        ]);
    }

    doc.autoTable({
      startY: 70,
      head: [['Descrição', 'Valor']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [14, 165, 233] },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 50, halign: 'right' }
      },
      margin: { left: 14, right: 14 }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("Orçamento válido por 15 dias.", 14, finalY);

    doc.save(`Orcamento_${customerName.replace(/[^a-z0-9]/gi, '_') || 'Ancora'}.pdf`);
  };

  if (loading) return <div className="p-8 text-center">Carregando componentes...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* LEFT COLUMN: INPUTS */}
      <div className="space-y-6">
        
        {/* DADOS DO CLIENTE */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
            <User className="mr-2 text-brand-600" size={20} /> Dados do Cliente
          </h2>
          <div className="space-y-4">
             <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Nome Completo</label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                placeholder="Ex: Shopping Centro"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center"><Phone size={14} className="mr-1"/> Telefone</label>
                    <input
                        type="text"
                        value={customerPhone}
                        onChange={e => setCustomerPhone(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                        placeholder="(11) 99999-9999"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center"><Mail size={14} className="mr-1"/> Email</label>
                    <input
                        type="email"
                        value={customerEmail}
                        onChange={e => setCustomerEmail(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                        placeholder="cliente@email.com"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center"><MapPin size={14} className="mr-1"/> Endereço</label>
                <input
                    type="text"
                    value={customerAddress}
                    onChange={e => setCustomerAddress(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                    placeholder="Av. Principal, 1000 - Centro"
                />
            </div>
          </div>
        </div>

        {/* DADOS DO PROJETO */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
            <Calculator className="mr-2 text-brand-600" size={20} /> Especificações
          </h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Largura (m)</label>
                <input
                  type="number"
                  step="0.01"
                  value={width || ''}
                  onChange={e => setWidth(parseFloat(e.target.value))}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Altura (m)</label>
                <input
                  type="number"
                  step="0.01"
                  value={height || ''}
                  onChange={e => setHeight(parseFloat(e.target.value))}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Rolo (m)</label>
                <input
                  type="number"
                  step="0.01"
                  value={roll || ''}
                  onChange={e => setRoll(parseFloat(e.target.value))}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                  placeholder="0.40"
                />
                <span className="text-xs text-slate-400">Padrão: 0.40m</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Quantidade</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={quantity || ''}
                  onChange={e => setQuantity(parseInt(e.target.value))}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Perfil da Lâmina</label>
              <select
                value={selectedProfileId}
                onChange={e => setSelectedProfileId(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 bg-white"
              >
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
             Motorização & Eixo
          </h2>
          
          {/* SEÇÃO MOTOR */}
          <div className="mb-6 border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between mb-3">
                 <h3 className="text-sm font-semibold text-slate-700 flex items-center"><Zap size={16} className="mr-1 text-slate-400"/> Motor</h3>
                 <div className="flex items-center space-x-3 bg-slate-50 p-1.5 rounded-lg">
                    <button 
                        onClick={() => setAutoMotor(true)}
                        className={`text-xs px-3 py-1 rounded transition-colors ${autoMotor ? 'bg-white shadow text-brand-600 font-medium' : 'text-slate-500 hover:text-slate-700'}`}
                    >Automático</button>
                    <button 
                        onClick={() => setAutoMotor(false)}
                        className={`text-xs px-3 py-1 rounded transition-colors ${!autoMotor ? 'bg-white shadow text-brand-600 font-medium' : 'text-slate-500 hover:text-slate-700'}`}
                    >Manual</button>
                 </div>
              </div>

              {!autoMotor && (
                <div className="animate-fadeIn mb-3">
                  <select
                    value={manualMotorId}
                    onChange={e => setManualMotorId(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 bg-white"
                  >
                    <option value="">Selecione o Motor...</option>
                    {motors.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.max_weight}kg) - R$ {m.price}</option>
                    ))}
                  </select>
                </div>
              )}
          </div>

          {/* SEÇÃO EIXO */}
          <div className="mb-4">
               <div className="flex items-center justify-between mb-3">
                 <h3 className="text-sm font-semibold text-slate-700 flex items-center"><Cylinder size={16} className="mr-1 text-slate-400"/> Eixo</h3>
                 <div className="flex items-center space-x-3 bg-slate-50 p-1.5 rounded-lg">
                    <button 
                        onClick={() => setAutoAxle(true)}
                        className={`text-xs px-3 py-1 rounded transition-colors ${autoAxle ? 'bg-white shadow text-brand-600 font-medium' : 'text-slate-500 hover:text-slate-700'}`}
                    >Automático</button>
                    <button 
                        onClick={() => setAutoAxle(false)}
                        className={`text-xs px-3 py-1 rounded transition-colors ${!autoAxle ? 'bg-white shadow text-brand-600 font-medium' : 'text-slate-500 hover:text-slate-700'}`}
                    >Manual</button>
                 </div>
              </div>

              {!autoAxle && (
                <div className="animate-fadeIn mb-3">
                  <select
                    value={manualAxleId}
                    onChange={e => setManualAxleId(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 bg-white"
                  >
                    <option value="">Selecione o Eixo...</option>
                    {axles.map(a => (
                      <option key={a.id} value={a.id}>{a.name} (até {a.max_width}m) - R$ {a.price}</option>
                    ))}
                  </select>
                </div>
              )}
          </div>

          {/* Automatic Results Feedback */}
          {calculationResult && (
             <div className="mt-4 space-y-2 text-sm">
                {/* Motor Result */}
                {calculationResult.selectedMotor ? (
                    <div className="flex items-center text-green-700 bg-green-50 p-2 rounded">
                        <Check size={16} className="mr-2 flex-shrink-0"/>
                        <span>Motor: <strong>{calculationResult.selectedMotor.name}</strong></span>
                    </div>
                ) : (
                    <div className="flex items-center text-amber-700 bg-amber-50 p-2 rounded">
                        <AlertCircle size={16} className="mr-2 flex-shrink-0"/>
                        <span>
                            {autoMotor 
                             ? `Nenhum motor suporta o peso (${calculationResult.gateWeight.toFixed(2)}kg)`
                             : `Selecione um motor`
                            }
                        </span>
                    </div>
                )}

                {/* Axle Result */}
                {calculationResult.selectedAxle ? (
                    <div className="flex items-center text-blue-700 bg-blue-50 p-2 rounded">
                         <Cylinder size={16} className="mr-2 flex-shrink-0"/>
                        <span>Eixo: <strong>{calculationResult.selectedAxle.name}</strong></span>
                    </div>
                ) : (
                    <div className="flex items-center text-amber-700 bg-amber-50 p-2 rounded">
                        <AlertCircle size={16} className="mr-2 flex-shrink-0"/>
                        <span>
                            {autoAxle 
                             ? `Nenhum eixo suporta a largura (${width}m)`
                             : `Selecione um eixo`
                            }
                        </span>
                    </div>
                )}
             </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Itens Opcionais</h2>
            <div className="space-y-3">
                {optionals.map(opt => (
                    <label key={opt.id} className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                        <div className="flex items-center">
                            <input 
                                type="checkbox" 
                                checked={selectedOptionalIds.has(opt.id)}
                                onChange={() => toggleOptional(opt.id)}
                                className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 border-gray-300"
                            />
                            <span className="ml-3 text-slate-700">{opt.name}</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-600">
                             + R$ {opt.price.toFixed(2)} 
                             <span className="text-xs font-normal text-slate-500 ml-1">
                                {opt.unit_type === 'per_m2' ? '/m²' : 'unid'}
                             </span>
                        </span>
                    </label>
                ))}
            </div>
        </div>
      </div>

      {/* RIGHT COLUMN: SUMMARY & ACTIONS */}
      <div className="space-y-6">
        <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg lg:sticky lg:top-6">
            <h2 className="text-xl font-bold mb-6 border-b border-slate-700 pb-4">Resumo ({quantity} un)</h2>

            {calculationResult ? (
                <div className="space-y-4">
                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-800 p-3 rounded">
                            <div className="text-xs text-slate-400">Área Total ({quantity} un)</div>
                            <div className="text-lg font-mono">{calculationResult.totalArea.toFixed(2)} m²</div>
                        </div>
                        <div className="bg-slate-800 p-3 rounded">
                            <div className="text-xs text-slate-400">Peso Unitário</div>
                            <div className="text-lg font-mono">{calculationResult.gateWeight.toFixed(2)} kg</div>
                        </div>
                    </div>

                    {/* Cost Breakdown */}
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-400">Kits Porta ({calculationResult.profileName})</span>
                            <span>R$ {calculationResult.basePrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Motores ({quantity})</span>
                            <span>R$ {calculationResult.motorPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Eixos ({quantity})</span>
                            <span>R$ {calculationResult.axlePrice.toFixed(2)}</span>
                        </div>
                        {calculationResult.optionalDetails.length > 0 && (
                             <div className="border-t border-slate-700 pt-2 mt-2">
                                <div className="text-xs text-slate-400 mb-1">Opcionais:</div>
                                {calculationResult.optionalDetails.map((o, idx) => (
                                    <div key={idx} className="flex justify-between pl-2 text-slate-300">
                                        <span>{o.name}</span>
                                        <span>R$ {o.price.toFixed(2)}</span>
                                    </div>
                                ))}
                             </div>
                        )}
                    </div>

                    <div className="border-t border-slate-700 pt-4 mt-4">
                        <div className="flex justify-between items-end">
                            <span className="text-slate-400">Valor Total</span>
                            <span className="text-3xl font-bold text-brand-400">
                                R$ {calculationResult.totalPrice.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                            </span>
                        </div>
                        <div className="text-right text-xs text-slate-400 mt-1">
                            (R$ {calculationResult.pricePerGate.toLocaleString('pt-BR', {minimumFractionDigits: 2})} por unidade)
                        </div>
                    </div>

                    <button 
                        onClick={handleSaveAndPDF}
                        disabled={!calculationResult.isValid || saving}
                        className={`w-full mt-6 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all ${
                            calculationResult.isValid && !saving
                            ? 'bg-brand-500 hover:bg-brand-400 text-white shadow-lg shadow-brand-900/50' 
                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                        }`}
                    >
                        {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        <span>{saving ? 'Salvando...' : 'Salvar e Gerar PDF'}</span>
                    </button>
                    {!calculationResult.isValid && (
                        <p className="text-center text-xs text-amber-500 mt-2">
                            Verifique dimensões, motor e eixo disponíveis.
                        </p>
                    )}
                </div>
            ) : (
                <div className="text-center text-slate-500 py-10">
                    Preencha os dados ao lado para ver o cálculo.
                </div>
            )}
        </div>
      </div>
    </div>
  );
};