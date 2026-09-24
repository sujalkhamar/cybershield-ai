import React, { useState, useEffect } from 'react';
import { Shield, Activity, AlertTriangle, Network } from 'lucide-react';

function App() {
  const [threats, setThreats] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch live threats from Sujal's Backend
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/v1/threats')
      .then(res => res.json())
      .then(data => {
        setThreats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching from backend:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-8">
      {/* Header */}
      <header className="flex items-center justify-between mb-8 pb-4 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <Shield className="w-10 h-10 text-emerald-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">CyberShield-AI</h1>
            <p className="text-slate-400 text-sm">Explainable Federated Learning IDS</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 bg-slate-800 px-4 py-2 rounded-lg">
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">SOC Active</span>
        </div>
      </header>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Quick Stats */}
        <div className="space-y-6">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-slate-400 font-medium">Total Scanned</h3>
              <Network className="text-blue-400 w-5 h-5" />
            </div>
            <p className="text-3xl font-bold text-white">10,000</p>
            <p className="text-xs text-slate-500 mt-1">Packets / minute</p>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-slate-400 font-medium">Zero-Day Anomalies</h3>
              <AlertTriangle className="text-rose-400 w-5 h-5" />
            </div>
            <p className="text-3xl font-bold text-rose-400">
              {threats.filter(t => t.is_zero_day).length}
            </p>
            <p className="text-xs text-slate-500 mt-1">Detected via Autoencoder</p>
          </div>
          
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-slate-400 font-medium">Known Attacks</h3>
              <Activity className="text-orange-400 w-5 h-5" />
            </div>
            <p className="text-3xl font-bold text-orange-400">
              {threats.filter(t => !t.is_zero_day && t.prediction_class !== 'Benign').length}
            </p>
            <p className="text-xs text-slate-500 mt-1">Detected via LSTM</p>
          </div>
        </div>

        {/* Right Column: Threat Log Table */}
        <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white">Live Threat Intelligence Log</h2>
          </div>
          
          <div className="p-0 overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-400">Connecting to Backend Inference Engine...</div>
            ) : threats.length === 0 ? (
              <div className="p-8 text-center text-emerald-400">No threats detected. Network is secure.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900 text-slate-400">
                  <tr>
                    <th className="px-6 py-4 font-medium">Source IP</th>
                    <th className="px-6 py-4 font-medium">Attack Type</th>
                    <th className="px-6 py-4 font-medium">Confidence</th>
                    <th className="px-6 py-4 font-medium">Zero-Day?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {threats.map((threat, index) => (
                    <tr key={index} className="hover:bg-slate-750 transition-colors">
                      <td className="px-6 py-4 font-mono text-slate-300">{threat.source_ip}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium 
                          ${threat.prediction_class === 'Benign' ? 'bg-emerald-400/10 text-emerald-400' : 
                            threat.is_zero_day ? 'bg-rose-400/10 text-rose-400 border border-rose-400/20' : 
                            'bg-orange-400/10 text-orange-400'}`}>
                          {threat.prediction_class}
                        </span>
                      </td>
                      <td className="px-6 py-4">{(threat.confidence_score * 100).toFixed(1)}%</td>
                      <td className="px-6 py-4 text-rose-400 font-bold">{threat.is_zero_day ? '⚠️ YES' : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
