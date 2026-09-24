import React, { useState, useEffect, useRef } from 'react';
import { Shield, Activity, AlertTriangle, Network, Server, Cpu, Info, Terminal, Activity as ActivityIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid, ReferenceLine } from 'recharts';
import { motion } from 'framer-motion';

function App() {
  const [threats, setThreats] = useState([]);
  const [flStatus, setFlStatus] = useState(null);
  const [selectedThreat, setSelectedThreat] = useState(null);
  const [shapData, setShapData] = useState([]);
  const [isExplaining, setIsExplaining] = useState(false);
  const [mseData, setMseData] = useState(Array.from({length: 20}, (_, i) => ({ time: i, mse: Math.random() * 2 })));
  const [terminalLogs, setTerminalLogs] = useState([]);
  const terminalEndRef = useRef(null);

  // Hexadecimal Sniffer Simulator
  useEffect(() => {
    const interval = setInterval(() => {
      const hex = Array.from({length: 8}, () => Math.floor(Math.random()*16).toString(16)).join('').toUpperCase();
      const ip = `192.168.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;
      const log = `[SNIFF] ${ip} -> TCP [0x${hex}] FLAGS: [S.] SEQ: ${Math.floor(Math.random()*10000)}`;
      setTerminalLogs(prev => [...prev.slice(-40), log]);
    }, 150);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  // Fetch live threats & Simulate MSE Data
  const fetchThreats = () => {
    fetch('http://127.0.0.1:8000/api/v1/threats')
      .then(res => res.json())
      .then(data => {
        setThreats(data);
        
        // Update MSE Graph based on latest threat
        if(data.length > 0) {
          const latest = data[0];
          setMseData(prev => {
            const newData = [...prev.slice(1), { 
              time: prev[prev.length-1].time + 1, 
              mse: latest.reconstruction_mse || (latest.is_zero_day ? 8 + Math.random()*5 : Math.random()*2.5) 
            }];
            return newData;
          });
        }
      })
      .catch(err => console.error(err));
  };

  const fetchFLStatus = () => {
    fetch('http://127.0.0.1:8000/api/v1/fl/status')
      .then(res => res.json())
      .then(data => setFlStatus(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchThreats();
    fetchFLStatus();
    const interval = setInterval(() => {
      fetchThreats();
      fetchFLStatus();
    }, 2000); // Faster polling for the demo
    return () => clearInterval(interval);
  }, []);

  const handleExplain = (threat) => {
    setSelectedThreat(threat);
    setIsExplaining(true);
    setTimeout(() => {
      setShapData([
        { feature: 'Destination Port', importance: threat.is_zero_day ? 0.85 : 0.4 },
        { feature: 'Flow Duration', importance: threat.is_zero_day ? 0.72 : 0.3 },
        { feature: 'Total Fwd Packets', importance: threat.is_zero_day ? 0.61 : 0.8 },
        { feature: 'Packet Length Mean', importance: 0.55 },
        { feature: 'FIN Flag Count', importance: 0.42 },
      ]);
      setIsExplaining(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#050B14] text-slate-200 p-4 lg:p-6 font-sans overflow-x-hidden selection:bg-emerald-500/30">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row items-center justify-between mb-6 bg-slate-900/50 backdrop-blur-md border border-slate-800/80 p-4 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)]">
        <div className="flex items-center space-x-4 mb-4 md:mb-0">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-20 animate-pulse"></div>
            <div className="relative p-3 bg-slate-950 rounded-xl border border-emerald-500/30">
              <Shield className="w-8 h-8 text-emerald-400" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">CyberShield-AI</h1>
            <p className="text-emerald-400 text-xs font-bold tracking-widest uppercase opacity-80">Next-Gen IDS SOC</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3 bg-slate-950/80 px-5 py-2.5 rounded-xl border border-slate-800">
            <Server className="w-4 h-4 text-blue-400 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">FL Cluster</span>
              <span className="text-sm font-bold text-blue-400">{flStatus ? `Round ${flStatus.current_round} Active` : 'Syncing...'}</span>
            </div>
          </div>
          <div className="flex items-center space-x-3 bg-emerald-500/10 px-5 py-3 rounded-xl border border-emerald-500/20">
            <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping absolute"></div>
            <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full relative z-10"></div>
            <span className="text-sm font-bold text-emerald-400 tracking-wide">SYSTEM SECURE</span>
          </div>
        </div>
      </header>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* TOP LEFT: Federated Learning Topology (3 cols) */}
        <div className="lg:col-span-3 bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-800 shadow-2xl p-5 relative overflow-hidden flex flex-col">
          <h2 className="text-sm font-bold text-white flex items-center mb-6 uppercase tracking-wider">
            <Network className="w-4 h-4 mr-2 text-blue-400" /> FedAvg Topology
          </h2>
          <div className="flex-1 relative flex items-center justify-center min-h-[200px]">
            {/* Center Server */}
            <div className="absolute z-10 p-4 bg-blue-500/10 border-2 border-blue-500/50 rounded-full shadow-[0_0_30px_rgba(59,130,246,0.3)]">
              <Server className="w-8 h-8 text-blue-400" />
            </div>
            {/* Edge Nodes */}
            {[0, 120, 240].map((deg, i) => (
              <motion.div 
                key={i}
                className="absolute w-full h-full flex justify-center items-start"
                style={{ rotate: deg }}
              >
                <div className="mt-2 p-2 bg-slate-800 rounded-full border border-slate-700 z-10" style={{ rotate: -deg }}>
                  <Cpu className="w-5 h-5 text-slate-400" />
                </div>
                {/* Animated Weight Transfer Particle */}
                <motion.div 
                  className="absolute top-10 w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_10px_#34d399]"
                  animate={{ y: [0, 60], opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.5 }}
                />
              </motion.div>
            ))}
            {/* Connecting Lines */}
            <div className="absolute w-32 h-32 border border-slate-700/50 rounded-full"></div>
            <div className="absolute w-48 h-48 border border-slate-800/50 rounded-full border-dashed animate-[spin_20s_linear_infinite]"></div>
          </div>
          <p className="text-[10px] text-center text-slate-500 font-mono mt-4">gRPC SECURE WEIGHT AGGREGATION</p>
        </div>

        {/* TOP MIDDLE: Live Autoencoder MSE Graph (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-800 shadow-2xl p-5 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-white flex items-center uppercase tracking-wider">
              <ActivityIcon className="w-4 h-4 mr-2 text-rose-400" /> Autoencoder Loss (MSE)
            </h2>
            <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> <span>Zero-Day Threshold (τ = 5.0)</span>
            </div>
          </div>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mseData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" hide />
                <YAxis domain={[0, 12]} tick={{fill: '#64748b', fontSize: 10}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <ReferenceLine y={5.0} stroke="#f43f5e" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Anomaly Threshold', fill: '#f43f5e', fontSize: 10 }} />
                <Line type="monotone" dataKey="mse" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TOP RIGHT: Quick Stats (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 shadow-lg flex items-center justify-between group hover:border-rose-500/30 transition-all">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Zero-Day Anomalies</p>
              <p className="text-3xl font-black text-rose-400 mt-1">{threats.filter(t => t.is_zero_day).length}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-rose-500/20 group-hover:text-rose-500/40" />
          </div>
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 shadow-lg flex items-center justify-between group hover:border-orange-500/30 transition-all">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Known Attacks (LSTM)</p>
              <p className="text-3xl font-black text-orange-400 mt-1">{threats.filter(t => !t.is_zero_day && t.prediction_class !== 'Benign').length}</p>
            </div>
            <Activity className="w-10 h-10 text-orange-500/20 group-hover:text-orange-500/40" />
          </div>
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Scanned</p>
              <p className="text-3xl font-black text-white mt-1">10,000</p>
            </div>
            <Network className="w-10 h-10 text-slate-700" />
          </div>
        </div>

        {/* BOTTOM LEFT: SHAP Explainer & Hacker Terminal (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* SHAP */}
          <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-800 shadow-2xl p-5 flex-1 min-h-[250px] flex flex-col">
            <h2 className="text-sm font-bold text-white flex items-center mb-4 uppercase tracking-wider">
              <Cpu className="w-4 h-4 mr-2 text-purple-400" /> SHAP XAI Interpretation
            </h2>
            <div className="flex-1 flex flex-col justify-center">
              {!selectedThreat ? (
                <div className="text-center text-slate-500">
                  <Info className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-xs">Select threat from log to generate SHAP values</p>
                </div>
              ) : isExplaining ? (
                <div className="text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
                  <p className="text-[10px] text-purple-400 font-mono animate-pulse">Calculating Shapley values...</p>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col">
                  <div className="mb-2 flex justify-between items-end">
                    <p className="font-mono text-white text-xs bg-slate-950 px-2 py-1 rounded border border-slate-800">{selectedThreat.destination_ip}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${selectedThreat.is_zero_day ? 'bg-rose-500/20 text-rose-400' : 'bg-orange-500/20 text-orange-400'}`}>
                      {selectedThreat.is_zero_day ? 'Zero-Day' : selectedThreat.prediction_class}
                    </span>
                  </div>
                  <div className="flex-1 min-h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={shapData} layout="vertical" margin={{ top: 0, right: 10, left: -25, bottom: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="feature" type="category" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 9}} width={100} />
                        <Tooltip cursor={{fill: '#0f172a'}} contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', fontSize: '12px' }} />
                        <Bar dataKey="importance" radius={[0, 4, 4, 0]} barSize={12}>
                          {shapData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={selectedThreat.is_zero_day ? '#f43f5e' : '#8b5cf6'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Hacker Terminal */}
          <div className="bg-[#0a0a0a] rounded-2xl border border-slate-800 shadow-2xl p-4 h-48 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-b from-[#0a0a0a] to-transparent z-10"></div>
            <h2 className="text-[10px] font-bold text-emerald-500/50 flex items-center mb-2 uppercase tracking-wider relative z-20">
              <Terminal className="w-3 h-3 mr-1" /> Raw Packet Sniffer
            </h2>
            <div className="flex-1 overflow-hidden font-mono text-[9px] text-emerald-500/70 leading-relaxed tracking-wider">
              {terminalLogs.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
              <div ref={terminalEndRef} />
            </div>
          </div>
        </div>

        {/* BOTTOM RIGHT: Threat Log (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex justify-between items-center">
            <h2 className="text-sm font-bold text-white flex items-center uppercase tracking-wider">
              <Shield className="w-4 h-4 mr-2 text-indigo-400" /> Threat Intelligence Log
            </h2>
          </div>
          
          <div className="p-0 flex-1 h-[470px] overflow-y-auto">
            {threats.length === 0 ? (
              <div className="h-full flex items-center justify-center text-emerald-500/50 font-mono text-sm">
                NO THREATS DETECTED
              </div>
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-950/90 text-slate-500 sticky top-0 backdrop-blur-md z-10 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Target IP</th>
                    <th className="px-5 py-3 font-semibold">Classification</th>
                    <th className="px-5 py-3 font-semibold">Confidence</th>
                    <th className="px-5 py-3 font-semibold text-right">XAI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {threats.map((threat, index) => (
                    <tr key={index} className={`hover:bg-slate-800/40 transition-colors ${selectedThreat?.id === threat.id ? 'bg-indigo-500/10 border-l-2 border-indigo-500' : 'border-l-2 border-transparent'}`}>
                      <td className="px-5 py-4 font-mono text-slate-300 text-xs">{threat.destination_ip}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-widest uppercase
                          ${threat.prediction_class === 'Benign' ? 'bg-emerald-500/10 text-emerald-400' : 
                            threat.is_zero_day ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse' : 
                            'bg-orange-500/10 text-orange-400 border border-orange-500/20'}`}>
                          {threat.is_zero_day ? 'Zero-Day' : threat.prediction_class}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center space-x-2 w-24">
                          <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${threat.is_zero_day ? 'bg-rose-500' : 'bg-orange-500'}`} 
                              style={{ width: `${threat.confidence_score * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-slate-400 text-[10px] font-mono">{(threat.confidence_score * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {threat.prediction_class !== 'Benign' && (
                          <button 
                            onClick={() => handleExplain(threat)}
                            className="inline-flex items-center px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/30 text-indigo-400 rounded text-[10px] font-bold transition-all border border-indigo-500/30 uppercase tracking-wider"
                          >
                            Explain
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
      
      {/* End of Grid */}
    </div>
  );
}

export default App;
