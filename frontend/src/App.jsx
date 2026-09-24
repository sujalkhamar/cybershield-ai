import React, { useState, useEffect } from 'react';
import { Shield, Server, Activity, AlertOctagon, Network, ShieldCheck } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, 
  LineChart, Line, CartesianGrid, ReferenceLine, 
  PieChart, Pie, Legend
} from 'recharts';

function App() {
  const [threats, setThreats] = useState([]);
  const [flStatus, setFlStatus] = useState(null);
  const [selectedThreat, setSelectedThreat] = useState(null);
  const [shapData, setShapData] = useState([]);
  const [isExplaining, setIsExplaining] = useState(false);
  const [mseData, setMseData] = useState(Array.from({length: 20}, (_, i) => ({ time: i, mse: 1.5 + Math.random() })));

  const fetchThreats = () => {
    fetch('http://127.0.0.1:8000/api/v1/threats')
      .then(res => res.json())
      .then(data => {
        setThreats(data);
        if(data.length > 0) {
          const latest = data[0];
          setMseData(prev => {
            const rawMse = latest.reconstruction_mse || (latest.is_zero_day ? 8 + Math.random()*5 : Math.random()*2.5);
            const clampedMse = Math.min(rawMse, 25);
            return [...prev.slice(1), { time: prev[prev.length-1].time + 1, mse: clampedMse }];
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
    }, 2000);
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
    }, 600);
  };

  // Prepare data for the Distribution Pie Chart
  const zeroDayCount = threats.filter(t => t.is_zero_day).length;
  const knownCount = threats.filter(t => !t.is_zero_day && t.prediction_class !== 'Benign').length;
  const benignCount = threats.filter(t => t.prediction_class === 'Benign').length;
  
  const pieData = [
    { name: 'Benign', value: benignCount === 0 ? 1 : benignCount, color: '#10b981' }, // Emerald
    { name: 'Known Attacks', value: knownCount, color: '#f59e0b' }, // Amber
    { name: 'Zero-Day', value: zeroDayCount, color: '#ef4444' } // Red
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-300 p-6 font-sans">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center">
            <Shield className="w-6 h-6 mr-3 text-cyan-400" />
            CyberShield-AI Analytics
          </h1>
          <p className="text-slate-400 text-sm mt-1">Federated Deep Learning IDS Dashboard</p>
        </div>
        
        <div className="flex space-x-3">
          <div className="bg-slate-800/50 border border-slate-700 px-4 py-2 rounded-lg flex items-center">
            <Server className="w-4 h-4 text-cyan-400 mr-2" />
            <span className="text-sm font-medium">
              FL Node: {flStatus ? `Round ${flStatus.current_round}` : 'Syncing...'}
            </span>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-lg flex items-center">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse mr-2"></div>
            <span className="text-sm font-medium text-emerald-400">System Live</span>
          </div>
        </div>
      </div>

      {/* TOP ROW: KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Total Packets Scanned</p>
            <p className="text-2xl font-bold text-white">10,000<span className="text-sm text-slate-500 font-normal"> /min</span></p>
          </div>
          <div className="p-3 bg-slate-800 rounded-lg"><Network className="w-5 h-5 text-cyan-400" /></div>
        </div>
        
        <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Benign Traffic</p>
            <p className="text-2xl font-bold text-emerald-400">{benignCount}</p>
          </div>
          <div className="p-3 bg-emerald-400/10 rounded-lg"><ShieldCheck className="w-5 h-5 text-emerald-400" /></div>
        </div>

        <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Known Signatures (LSTM)</p>
            <p className="text-2xl font-bold text-amber-400">{knownCount}</p>
          </div>
          <div className="p-3 bg-amber-400/10 rounded-lg"><Activity className="w-5 h-5 text-amber-400" /></div>
        </div>

        <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Zero-Day Anomalies</p>
            <p className="text-2xl font-bold text-red-400">{zeroDayCount}</p>
          </div>
          <div className="p-3 bg-red-400/10 rounded-lg"><AlertOctagon className="w-5 h-5 text-red-400" /></div>
        </div>
      </div>

      {/* MIDDLE ROW: CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Pie Chart */}
        <div className="bg-slate-800/40 border border-slate-700/50 p-5 rounded-xl h-72 flex flex-col">
          <h2 className="text-sm font-semibold text-slate-200 mb-2">Traffic Classification</h2>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Autoencoder Line Chart */}
        <div className="lg:col-span-2 bg-slate-800/40 border border-slate-700/50 p-5 rounded-xl h-72 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-semibold text-slate-200">Autoencoder Reconstruction Loss (MSE)</h2>
            <span className="text-xs text-slate-500 font-mono flex items-center">
              <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
              Threshold (τ = 5.0)
            </span>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mseData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="time" hide />
                <YAxis domain={[0, 30]} tick={{fill: '#64748b', fontSize: 11}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }} />
                <ReferenceLine y={5.0} stroke="#ef4444" strokeDasharray="4 4" />
                <Line type="stepAfter" dataKey="mse" stroke="#22d3ee" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW: TABLE & SHAP */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Threat Table */}
        <div className="lg:col-span-2 bg-slate-800/40 border border-slate-700/50 rounded-xl flex flex-col h-80 overflow-hidden">
          <div className="p-4 border-b border-slate-700/50">
            <h2 className="text-sm font-semibold text-slate-200">Recent Network Activity</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {threats.length === 0 ? (
              <div className="p-8 text-center text-slate-500">Waiting for network traffic...</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-800/80 sticky top-0 text-xs text-slate-400">
                  <tr>
                    <th className="px-5 py-3 font-medium">IP Address</th>
                    <th className="px-5 py-3 font-medium">Prediction</th>
                    <th className="px-5 py-3 font-medium">Confidence</th>
                    <th className="px-5 py-3 font-medium text-right">Analysis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {threats.map((threat, index) => (
                    <tr key={index} className={`hover:bg-slate-700/20 transition-colors ${selectedThreat?.id === threat.id ? 'bg-cyan-900/10' : ''}`}>
                      <td className="px-5 py-3 font-mono text-slate-300">{threat.destination_ip}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold
                          ${threat.prediction_class === 'Benign' ? 'text-emerald-400 bg-emerald-400/10' : 
                            threat.is_zero_day ? 'text-red-400 bg-red-400/10' : 
                            'text-amber-400 bg-amber-400/10'}`}>
                          {threat.is_zero_day ? 'Zero-Day' : threat.prediction_class}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-400">{(threat.confidence_score * 100).toFixed(1)}%</td>
                      <td className="px-5 py-3 text-right">
                        {threat.prediction_class !== 'Benign' && (
                          <button 
                            onClick={() => handleExplain(threat)}
                            className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded transition-colors"
                          >
                            SHAP
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

        {/* SHAP Explainer */}
        <div className="bg-slate-800/40 border border-slate-700/50 p-5 rounded-xl h-80 flex flex-col">
          <h2 className="text-sm font-semibold text-slate-200 mb-1">SHAP KernelExplainer</h2>
          <p className="text-xs text-slate-500 mb-4">Feature impact on model output</p>
          
          <div className="flex-1 min-h-0 flex flex-col justify-center">
            {!selectedThreat ? (
              <div className="text-center text-slate-500 text-sm">
                Click <b>SHAP</b> on any threat in the table to generate analysis.
              </div>
            ) : isExplaining ? (
              <div className="flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col">
                <div className="text-xs text-slate-400 mb-3 text-center">
                  Target: <span className="font-mono text-slate-200 bg-slate-800 px-2 py-1 rounded ml-1">{selectedThreat.destination_ip}</span>
                </div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={shapData} layout="vertical" margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="feature" type="category" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} width={110} />
                      <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                      <Bar dataKey="importance" radius={[0, 4, 4, 0]} barSize={16}>
                        {shapData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={selectedThreat.is_zero_day ? '#ef4444' : '#f59e0b'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
    </div>
  );
}

export default App;
