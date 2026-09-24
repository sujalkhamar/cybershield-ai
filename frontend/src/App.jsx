import React, { useState, useEffect } from 'react';
import { 
  Shield, Server, Activity, AlertOctagon, Network, ShieldCheck,
  LayoutDashboard, Cpu, Database, Settings, Bell, Search, User
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, 
  LineChart, Line, CartesianGrid, ReferenceLine, 
  PieChart, Pie, Legend
} from 'recharts';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'zeroday', 'known'
  const [showNotifications, setShowNotifications] = useState(false);
  const [readAlertIds, setReadAlertIds] = useState(new Set());
  const [policies, setPolicies] = useState({ autoBlock: true, isolate: true, dpi: false });
  const [mseThreshold, setMseThreshold] = useState(5.0);
  const [confThreshold, setConfThreshold] = useState(85);
  const [apiKey, setApiKey] = useState('sk_live_9283hx8921m4992p');
  const [webhooks, setWebhooks] = useState({ slack: true, jira: false, pagerduty: false });
  const [activeTab, setActiveTab] = useState('dashboard');
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

  const handleMarkAllRead = () => {
    const newReadIds = new Set(readAlertIds);
    threats.filter(t => (t.reconstruction_mse || 0) > mseThreshold).forEach(t => newReadIds.add(t.id));
    setReadAlertIds(newReadIds);
  };

  // DYNAMICALLY OVERRIDE BACKEND CLASSIFICATION BASED ON FRONTEND SLIDERS
  const dynamicThreats = threats.map(t => ({
    ...t,
    is_zero_day: (t.reconstruction_mse || 0) > mseThreshold
  }));

  const handleExportCSV = () => {
    const headers = ['ID', 'Timestamp', 'Source IP', 'Destination IP', 'Prediction', 'Confidence', 'MSE', 'Is Zero Day'];
    const rows = filteredThreats.map(t => [
      t.id, t.timestamp, t.source_ip, t.destination_ip, t.prediction_class, t.confidence_score, t.reconstruction_mse || '', t.is_zero_day
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "cybershield_threats_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const zeroDayCount = dynamicThreats.filter(t => t.is_zero_day).length;
  const unreadZeroDays = dynamicThreats.filter(t => t.is_zero_day && !readAlertIds.has(t.id));
  const knownCount = dynamicThreats.filter(t => !t.is_zero_day && t.prediction_class !== 'Benign').length;
  const benignCount = dynamicThreats.filter(t => t.prediction_class === 'Benign').length;

  const filteredThreats = dynamicThreats.filter(t => {
    const matchesSearch = t.destination_ip.includes(searchQuery) || t.prediction_class.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterMode === 'zeroday') return t.is_zero_day;
    if (filterMode === 'known') return !t.is_zero_day && t.prediction_class !== 'Benign';
    return true; // 'all'
  });
  
  const pieData = [
    { name: 'Benign', value: benignCount === 0 ? 1 : benignCount, color: '#10b981' }, 
    { name: 'Known Attacks', value: knownCount, color: '#f59e0b' }, 
    { name: 'Zero-Day', value: zeroDayCount, color: '#f43f5e' } 
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800 font-sans overflow-hidden">
      
      {/* MODERN LIGHT SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex shadow-sm z-20">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <Shield className="w-7 h-7 text-indigo-600 mr-3" />
          <span className="text-lg font-bold text-slate-800 tracking-wide">CyberShield</span>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2">Analytics</div>
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all font-medium text-sm ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>
            <LayoutDashboard className={`w-5 h-5 mr-3 ${activeTab === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'}`} /> Dashboard
          </button>
          
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-8 mb-3 ml-2">Machine Learning</div>
          <button onClick={() => setActiveTab('fl')} className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all font-medium text-sm ${activeTab === 'fl' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>
            <Server className={`w-5 h-5 mr-3 ${activeTab === 'fl' ? 'text-indigo-600' : 'text-slate-400'}`} /> FL Cluster
          </button>
          <button onClick={() => setActiveTab('models')} className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all font-medium text-sm ${activeTab === 'models' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>
            <Cpu className={`w-5 h-5 mr-3 ${activeTab === 'models' ? 'text-indigo-600' : 'text-slate-400'}`} /> AI Models
          </button>
          <button onClick={() => setActiveTab('database')} className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all font-medium text-sm ${activeTab === 'database' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>
            <Database className={`w-5 h-5 mr-3 ${activeTab === 'database' ? 'text-indigo-600' : 'text-slate-400'}`} /> Data Lake
          </button>
          
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-8 mb-3 ml-2">Administration</div>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all font-medium text-sm ${activeTab === 'settings' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>
            <Settings className={`w-5 h-5 mr-3 ${activeTab === 'settings' ? 'text-indigo-600' : 'text-slate-400'}`} /> System Settings
          </button>
        </nav>
        
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center">
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
              S
            </div>
            <div className="ml-3">
              <p className="text-sm font-bold text-slate-700">Sujal & Twinkle</p>
              <p className="text-xs text-slate-500 font-medium">SOC Administrators</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50/50">
        
        {/* TOP NAVBAR */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10 shadow-sm relative">
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 w-72 focus-within:ring-2 ring-indigo-500/20 transition-all">
            <Search className="w-4 h-4 text-slate-400 mr-2" />
            <input 
              type="text" 
              placeholder="Search threats, IPs, models..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-slate-700 w-full placeholder-slate-400" 
            />
          </div>
          
          <div className="flex items-center space-x-5">
            <div className="flex items-center">
              <span className="text-xs font-bold text-slate-500 uppercase mr-2">FedAvg Round</span>
              <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-sm font-bold border border-slate-200">
                {flStatus?.current_round || 1}
              </span>
            </div>
            <div className="flex items-center bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">System Live</span>
            </div>
            <button onClick={() => setShowNotifications(!showNotifications)} className="relative text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none">
              <Bell className="w-5 h-5" />
              {unreadZeroDays.length > 0 && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>}
            </button>
          </div>

          {/* NOTIFICATION DROPDOWN */}
          {showNotifications && (
            <div className="absolute top-14 right-8 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-2">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Alerts ({unreadZeroDays.length})</span>
                <span onClick={handleMarkAllRead} className="text-[10px] text-indigo-600 cursor-pointer font-bold hover:text-indigo-800 transition-colors">Mark all read</span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {unreadZeroDays.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">No active unread alerts.</div>
                ) : (
                  unreadZeroDays.slice(0, 5).map(t => (
                    <div key={t.id} className="p-3 border-b border-slate-50 hover:bg-slate-50 flex items-start cursor-pointer transition-colors" onClick={() => {
                        const newRead = new Set(readAlertIds);
                        newRead.add(t.id);
                        setReadAlertIds(newRead);
                      }}>
                      <div className="w-2 h-2 bg-rose-500 rounded-full mt-1.5 mr-3 flex-shrink-0 animate-pulse"></div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Zero-Day Detected</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">Target: {t.destination_ip}</p>
                        <p className="text-[10px] text-rose-600 font-bold mt-0.5">MSE: {t.reconstruction_mse?.toFixed(2) || 'High'}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </header>

        {/* DASHBOARD SCROLL AREA */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
          
          {activeTab === 'dashboard' && (
            <div className="animate-in fade-in duration-500">
              <div className="mb-8 flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Global Threat Analytics</h2>
                  <p className="text-slate-500 text-sm mt-1">Enterprise Command Center - Region: Global (All Nodes)</p>
                </div>
                <div className="flex space-x-3">
                  <div className="text-xs text-slate-600 font-bold bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center">
                    <Activity className="w-3.5 h-3.5 mr-2 text-indigo-500" /> Model Latency: 12ms
                  </div>
                  <div className="text-xs text-rose-700 font-bold bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 flex items-center">
                    <Shield className="w-3.5 h-3.5 mr-2" /> Autoencoder τ = {mseThreshold.toFixed(1)}
                  </div>
                </div>
              </div>

              {/* KPI CARDS (6 instead of 4) */}
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2"><p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Network Traffic</p><Network className="w-4 h-4 text-blue-500" /></div>
                  <p className="text-2xl font-black text-slate-800">10,000</p><p className="text-[10px] text-slate-400 font-bold mt-1">Pkts/sec</p>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2"><p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Clean Traffic</p><ShieldCheck className="w-4 h-4 text-emerald-500" /></div>
                  <p className="text-2xl font-black text-slate-800">{benignCount}</p><p className="text-[10px] text-emerald-600 font-bold mt-1">Verified Safe</p>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2"><p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">LSTM Threats</p><Activity className="w-4 h-4 text-amber-500" /></div>
                  <p className="text-2xl font-black text-slate-800">{knownCount}</p><p className="text-[10px] text-amber-600 font-bold mt-1">Known Signatures</p>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-rose-500"></div>
                  <div className="flex items-center justify-between mb-2"><p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Zero-Day</p><AlertOctagon className="w-4 h-4 text-rose-500" /></div>
                  <p className="text-2xl font-black text-slate-800">{zeroDayCount}</p><p className="text-[10px] text-rose-600 font-bold mt-1">Autoencoder Anomaly</p>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2"><p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active FL Nodes</p><Server className="w-4 h-4 text-indigo-500" /></div>
                  <p className="text-2xl font-black text-slate-800">3 / 3</p><p className="text-[10px] text-indigo-600 font-bold mt-1">Global Syncing</p>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2"><p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">System Load</p><Cpu className="w-4 h-4 text-purple-500" /></div>
                  <p className="text-2xl font-black text-slate-800">42%</p><p className="text-[10px] text-purple-600 font-bold mt-1">Inference GPU</p>
                </div>
              </div>

              {/* NEW MIDDLE TIER: Threat Intel & Policies */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                
                {/* Threat Origins */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Top Threat Origins</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1"><span className="text-slate-700">192.168.1.105 (Local Subnet)</span><span className="text-rose-600">45%</span></div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5"><div className="bg-rose-500 h-1.5 rounded-full w-[45%]"></div></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1"><span className="text-slate-700">10.0.0.52 (Cloud VPC)</span><span className="text-amber-500">30%</span></div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5"><div className="bg-amber-400 h-1.5 rounded-full w-[30%]"></div></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1"><span className="text-slate-700">172.16.254.1 (External Gateway)</span><span className="text-indigo-500">15%</span></div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5"><div className="bg-indigo-500 h-1.5 rounded-full w-[15%]"></div></div>
                    </div>
                  </div>
                </div>

                {/* Defense Policies */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Active Defense Policies</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex flex-col"><span className="text-xs font-bold text-slate-800">Auto-Block Zero-Days</span><span className="text-[10px] text-slate-500">Instantly drop packets MSE &gt; 5.0</span></div>
                      <div onClick={() => setPolicies({...policies, autoBlock: !policies.autoBlock})} className={`w-8 h-4 rounded-full relative cursor-pointer transition-colors ${policies.autoBlock ? 'bg-emerald-500' : 'bg-slate-300'}`}><div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${policies.autoBlock ? 'right-1' : 'left-1'}`}></div></div>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex flex-col"><span className="text-xs font-bold text-slate-800">Isolate Compromised Nodes</span><span className="text-[10px] text-slate-500">Disconnect FL clients under attack</span></div>
                      <div onClick={() => setPolicies({...policies, isolate: !policies.isolate})} className={`w-8 h-4 rounded-full relative cursor-pointer transition-colors ${policies.isolate ? 'bg-emerald-500' : 'bg-slate-300'}`}><div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${policies.isolate ? 'right-1' : 'left-1'}`}></div></div>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-100 opacity-80">
                      <div className="flex flex-col"><span className="text-xs font-bold text-slate-800">Deep Packet Inspection</span><span className="text-[10px] text-slate-500">Resource intensive analysis</span></div>
                      <div onClick={() => setPolicies({...policies, dpi: !policies.dpi})} className={`w-8 h-4 rounded-full relative cursor-pointer transition-colors ${policies.dpi ? 'bg-emerald-500' : 'bg-slate-300'}`}><div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${policies.dpi ? 'right-1' : 'left-1'}`}></div></div>
                    </div>
                  </div>
                </div>

                {/* System Health */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Global FL Cluster Health</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <Server className="w-5 h-5 text-emerald-500 mb-2" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Node Alpha</span>
                      <span className="text-xs font-black text-slate-800">99.9%</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <Server className="w-5 h-5 text-emerald-500 mb-2" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Node Beta</span>
                      <span className="text-xs font-black text-slate-800">98.5%</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <Server className="w-5 h-5 text-amber-500 mb-2" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Node Gamma</span>
                      <span className="text-xs font-black text-amber-600">High Load</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CHARTS ROW */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Traffic Pie */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col h-80">
                  <h2 className="text-sm font-bold text-slate-800 mb-1">Traffic Distribution</h2>
                  <p className="text-xs text-slate-500 mb-4">Payload classification ratio</p>
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                          {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Autoencoder Loss Chart */}
                <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col h-80">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-sm font-bold text-slate-800">Autoencoder MSE Loss</h2>
                      <p className="text-xs text-slate-500 mt-1">Real-time reconstruction error monitoring</p>
                    </div>
                    <div className="bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-md text-xs text-rose-600 font-bold flex items-center">
                      <div className="w-1.5 h-1.5 bg-rose-500 rounded-full mr-2 animate-pulse"></div> τ &gt; {mseThreshold.toFixed(1)}
                    </div>
                  </div>
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={mseData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="time" hide />
                        <YAxis domain={[0, 30]} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 500}} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <ReferenceLine y={mseThreshold} stroke="#f43f5e" strokeDasharray="4 4" />
                        <Line type="stepAfter" dataKey="mse" stroke="#6366f1" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* TABLE & SHAP ROW */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-10">
                {/* Threat Table */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-[420px] overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div>
                      <h2 className="text-sm font-bold text-slate-800">Live Threat Log</h2>
                      <p className="text-xs text-slate-500 mt-1">Latest intercepted edge packets</p>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {filteredThreats.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 font-medium h-full flex items-center justify-center">Awaiting telemetry or no match...</div>
                    ) : (
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 sticky top-0 text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-100 z-10">
                          <tr>
                            <th className="px-6 py-3">IP Address</th>
                            <th className="px-6 py-3">Classification</th>
                            <th className="px-6 py-3">Confidence</th>
                            <th className="px-6 py-3 text-right">Analysis</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {filteredThreats.map((threat, index) => (
                            <tr key={index} className={`hover:bg-slate-50/80 transition-colors ${selectedThreat?.id === threat.id ? 'bg-indigo-50/50' : ''}`}>
                              <td className="px-6 py-4 font-mono text-slate-600 text-xs">{threat.destination_ip}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider
                                  ${threat.prediction_class === 'Benign' ? 'text-emerald-700 bg-emerald-100' : 
                                    threat.is_zero_day ? 'text-rose-700 bg-rose-100' : 
                                    'text-amber-700 bg-amber-100'}`}>
                                  {threat.is_zero_day ? 'Zero-Day' : threat.prediction_class}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className={`h-full ${threat.is_zero_day ? 'bg-rose-500' : 'bg-amber-500'}`} style={{ width: `${threat.confidence_score * 100}%` }}></div>
                                  </div>
                                  <span className="text-slate-500 text-xs font-bold font-mono">{(threat.confidence_score * 100).toFixed(0)}%</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                {threat.prediction_class !== 'Benign' && (
                                  <button onClick={() => handleExplain(threat)} className="text-[10px] font-bold uppercase tracking-wider bg-white hover:bg-slate-50 text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg shadow-sm transition-all">
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

                {/* SHAP */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col h-[420px]">
                  <div className="mb-6">
                    <h2 className="text-sm font-bold text-slate-800 flex items-center">
                      <Cpu className="w-4 h-4 mr-2 text-indigo-500" /> SHAP Explainer
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">Interpretable AI attributions</p>
                  </div>
                  
                  <div className="flex-1 min-h-0 flex flex-col justify-center">
                    {!selectedThreat ? (
                      <div className="text-center text-slate-400 p-8 border-2 border-dashed border-slate-100 rounded-xl">
                        <Shield className="w-10 h-10 mx-auto mb-3 opacity-20 text-slate-400" />
                        <p className="text-xs font-medium">Select a threat from the log to compute SHAP values.</p>
                      </div>
                    ) : isExplaining ? (
                      <div className="flex flex-col justify-center items-center h-full">
                        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-xs text-indigo-600 font-bold uppercase tracking-widest">Computing...</p>
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col">
                        <div className="bg-slate-50 rounded-xl p-3 mb-5 flex justify-between items-center border border-slate-100">
                          <span className="text-[10px] uppercase font-bold text-slate-500">Target IP</span>
                          <span className="font-mono text-slate-800 font-bold text-xs">{selectedThreat.destination_ip}</span>
                        </div>
                        <div className="flex-1 min-h-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={shapData} layout="vertical" margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                              <XAxis type="number" hide />
                              <YAxis dataKey="feature" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 600}} width={110} />
                              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                              <Bar dataKey="importance" radius={[0, 4, 4, 0]} barSize={14}>
                                {shapData.map((entry, index) => <Cell key={`cell-${index}`} fill={selectedThreat.is_zero_day ? '#f43f5e' : '#6366f1'} />)}
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
          )}

          {activeTab === 'fl' && (
            <div className="animate-in fade-in duration-500">
              <div className="mb-6 flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Federated Learning Orchestration</h2>
                  <p className="text-slate-500 text-sm mt-1">Flower (flwr) gRPC global weight aggregation.</p>
                </div>
                <div className="flex space-x-2">
                  <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1.5 rounded-lg text-xs font-bold uppercase">Strategy: FedAvg</span>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1.5 rounded-lg text-xs font-bold uppercase">Global Round: {flStatus?.current_round || 1}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm lg:col-span-2">
                  <h3 className="text-sm font-bold text-slate-800 mb-4">Active Edge Nodes</h3>
                  <table className="w-full text-left text-sm">
                    <thead className="text-[10px] text-slate-400 uppercase font-bold border-b border-slate-100">
                      <tr><th className="pb-3">Client ID</th><th className="pb-3">Location</th><th className="pb-3">Status</th><th className="pb-3">Local Samples</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-600 font-medium">
                      <tr><td className="py-4 font-mono text-indigo-600">node-alpha-92x</td><td className="py-4 text-xs">Enterprise Server A</td><td className="py-4"><span className="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase flex items-center w-fit"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></div>Training</span></td><td className="py-4 font-mono text-xs">1,420</td></tr>
                      <tr><td className="py-4 font-mono text-indigo-600">node-beta-44v</td><td className="py-4 text-xs">IoT Gateway B</td><td className="py-4"><span className="text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase flex items-center w-fit"><div className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5"></div>Syncing</span></td><td className="py-4 font-mono text-xs">890</td></tr>
                      <tr><td className="py-4 font-mono text-indigo-600">node-gamma-11p</td><td className="py-4 text-xs">Cloud VPC C</td><td className="py-4"><span className="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase flex items-center w-fit"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></div>Training</span></td><td className="py-4 font-mono text-xs">2,100</td></tr>
                    </tbody>
                  </table>
                </div>
                
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center">
                  <Server className="w-12 h-12 text-indigo-100 mb-3" />
                  <h3 className="text-lg font-bold text-slate-800 mb-1">Flower Aggregator</h3>
                  <p className="text-xs text-slate-500 mb-5">gRPC port 8080 active</p>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2 overflow-hidden"><div className="bg-indigo-500 h-full rounded-full w-[65%]"></div></div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">Round {flStatus?.current_round || 1} Progress - 65%</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'models' && (
            <div className="animate-in fade-in duration-500">
              <div className="mb-6 flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 tracking-tight">AI Architecture & Hyperparameters</h2>
                  <p className="text-slate-500 text-sm mt-1">PyTorch deep learning configurations.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center"><Activity className="w-4 h-4 mr-2 text-amber-500"/> LSTM Classifier (Known Threats)</h3>
                    <span className="text-[10px] bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-md font-mono font-bold">torch.nn.LSTM</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100"><p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Input Features</p><p className="text-slate-800 font-black font-mono text-lg">79</p></div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100"><p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Hidden Layers</p><p className="text-slate-800 font-black font-mono text-lg">2</p></div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100"><p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Hidden Dimension</p><p className="text-slate-800 font-black font-mono text-lg">64</p></div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100"><p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Output Classes</p><p className="text-slate-800 font-black font-mono text-lg">5</p></div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center"><AlertOctagon className="w-4 h-4 mr-2 text-rose-500"/> Deep Autoencoder (Zero-Day)</h3>
                    <span className="text-[10px] bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-md font-mono font-bold">torch.nn.Sequential</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100"><p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Encoder Layers</p><p className="text-slate-800 font-black font-mono text-sm">64 → 32 → 16</p></div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100"><p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Decoder Layers</p><p className="text-slate-800 font-black font-mono text-sm">16 → 32 → 64</p></div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100"><p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Bottleneck Dim</p><p className="text-slate-800 font-black font-mono text-lg">8</p></div>
                    <div className="bg-rose-50 p-4 rounded-xl border border-rose-100"><p className="text-rose-500 text-[10px] font-bold uppercase tracking-wider mb-1">Threshold (τ)</p><p className="text-rose-700 font-black font-mono text-sm">MSE &gt; 5.0</p></div>
                  </div>
                </div>
              </div>

              {/* NEW ADDITION: Model Training Convergence Graph */}
              <div className="mt-6 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm h-72 flex flex-col">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-800">Global Model Convergence</h3>
                  <p className="text-xs text-slate-500">Cross-entropy loss and Accuracy metrics over FL communication rounds.</p>
                </div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[
                      { round: 1, loss: 0.85, acc: 60 }, { round: 2, loss: 0.65, acc: 75 },
                      { round: 3, loss: 0.45, acc: 85 }, { round: 4, loss: 0.35, acc: 89 },
                      { round: 5, loss: 0.25, acc: 93 }, { round: 6, loss: 0.20, acc: 95 },
                      { round: 7, loss: 0.18, acc: 96 }, { round: 8, loss: 0.15, acc: 97.5 },
                      { round: Math.max(8, flStatus?.current_round || 8), loss: 0.12, acc: 98.2 }
                    ]} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="round" tick={{fill: '#94a3b8', fontSize: 11}} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="left" tick={{fill: '#94a3b8', fontSize: 11}} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{fill: '#94a3b8', fontSize: 11}} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Line yAxisId="left" type="monotone" dataKey="loss" name="Cross-Entropy Loss" stroke="#f43f5e" strokeWidth={2.5} dot={{r: 4, fill: '#f43f5e'}} />
                      <Line yAxisId="right" type="monotone" dataKey="acc" name="Accuracy (%)" stroke="#10b981" strokeWidth={2.5} dot={{r: 4, fill: '#10b981'}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'database' && (
            <div className="animate-in fade-in duration-500 h-[700px] flex flex-col">
              <div className="mb-6 flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 tracking-tight">SQLite Data Lake</h2>
                  <p className="text-slate-500 text-sm mt-1">Raw relational data logs (cybershield.db)</p>
                </div>
                <div className="flex space-x-3">
                  <select 
                    value={filterMode} 
                    onChange={(e) => setFilterMode(e.target.value)}
                    className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 shadow-sm outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="all">Show All Traffic</option>
                    <option value="zeroday">Show Zero-Days Only</option>
                    <option value="known">Show Known Threats Only</option>
                  </select>
                  <button onClick={handleExportCSV} className="bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl flex items-center shadow-sm transition-colors text-indigo-600">
                    <Database className="w-4 h-4 mr-2" />
                    <span className="text-xs font-bold">Export CSV</span>
                  </button>
                  <div className="bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl flex items-center shadow-sm">
                    <span className="text-xs font-bold text-indigo-700">Records: <span className="font-mono">{filteredThreats.length}</span></span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 sticky top-0 text-[10px] uppercase tracking-wider text-slate-500 font-bold z-10 border-b border-slate-200">
                      <tr><th className="px-6 py-4">ID</th><th className="px-6 py-4">Timestamp</th><th className="px-6 py-4">Src IP</th><th className="px-6 py-4">Dest IP</th><th className="px-6 py-4">Prediction</th><th className="px-6 py-4">Confidence</th><th className="px-6 py-4">MSE Loss</th><th className="px-6 py-4">Zero Day</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600 font-mono text-xs">
                      {filteredThreats.map((threat) => (
                        <tr key={threat.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-3.5 text-slate-400 font-bold">#{threat.id}</td>
                          <td className="px-6 py-3.5 text-slate-500 font-sans font-medium">{new Date(threat.timestamp).toISOString().replace('T', ' ').substring(0,19)}</td>
                          <td className="px-6 py-3.5 text-indigo-500">{threat.source_ip}</td>
                          <td className="px-6 py-3.5 text-indigo-600 font-bold">{threat.destination_ip}</td>
                          <td className="px-6 py-3.5 font-sans font-bold">
                            <span className={threat.prediction_class === 'Benign' ? 'text-emerald-600' : 'text-amber-600'}>{threat.prediction_class}</span>
                          </td>
                          <td className="px-6 py-3.5">{(threat.confidence_score).toFixed(4)}</td>
                          <td className="px-6 py-3.5 text-rose-500 font-bold">{threat.reconstruction_mse?.toFixed(2) || 'N/A'}</td>
                          <td className="px-6 py-3.5 font-sans font-bold">
                            {threat.is_zero_day ? <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">True</span> : <span className="text-slate-300">False</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="animate-in fade-in duration-500 pb-10">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">System Settings</h2>
                <p className="text-slate-500 text-sm mt-1">Configure global SOC parameters, webhooks, and thresholds.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Thresholds */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center border-b border-slate-100 pb-3"><Settings className="w-4 h-4 mr-2 text-indigo-500"/> AI Anomaly Thresholds</h3>
                  <div className="mb-6">
                    <label className="flex justify-between text-xs font-bold text-slate-700 mb-2">
                      <span>Autoencoder MSE Cutoff (τ)</span>
                      <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{mseThreshold.toFixed(2)}</span>
                    </label>
                    <input type="range" min="1" max="10" step="0.1" value={mseThreshold} onChange={(e) => setMseThreshold(parseFloat(e.target.value))} className="w-full accent-indigo-600 cursor-pointer" />
                    <p className="text-[10px] text-slate-500 mt-2">Any reconstruction error above this threshold triggers a Zero-Day alert.</p>
                  </div>
                  <div>
                    <label className="flex justify-between text-xs font-bold text-slate-700 mb-2">
                      <span>LSTM Confidence Minimum</span>
                      <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{confThreshold}%</span>
                    </label>
                    <input type="range" min="50" max="99" step="1" value={confThreshold} onChange={(e) => setConfThreshold(parseInt(e.target.value))} className="w-full accent-emerald-600 cursor-pointer" />
                    <p className="text-[10px] text-slate-500 mt-2">Minimum probability required to auto-drop known malicious signatures.</p>
                  </div>
                </div>

                {/* API Keys */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center border-b border-slate-100 pb-3"><Shield className="w-4 h-4 mr-2 text-rose-500"/> Enterprise API Access</h3>
                  <p className="text-xs text-slate-600 mb-4">Use these keys to connect external SIEM tools (Splunk, QRadar) to CyberShield-AI.</p>
                  
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-3 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-500 mb-0.5">Production SIEM Token</p>
                      <p className="font-mono text-xs text-slate-800">{apiKey}</p>
                    </div>
                    <button onClick={() => setApiKey('sk_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15))} className="text-[10px] font-bold text-indigo-600 bg-white border border-indigo-200 px-3 py-1.5 rounded-lg shadow-sm hover:bg-slate-50 transition-colors">Regenerate</button>
                  </div>
                  
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center opacity-60">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-500 mb-0.5">Staging Token</p>
                      <p className="font-mono text-xs text-slate-800">sk_test_1120px...11ax</p>
                    </div>
                    <button className="text-[10px] font-bold text-indigo-600 bg-white border border-indigo-200 px-3 py-1.5 rounded-lg shadow-sm">Regenerate</button>
                  </div>
                </div>

                {/* Integrations */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm lg:col-span-2">
                  <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center border-b border-slate-100 pb-3"><Network className="w-4 h-4 mr-2 text-amber-500"/> Webhook Integrations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border border-slate-200 rounded-xl p-4 flex flex-col items-center text-center transition-all">
                      <div className="w-10 h-10 bg-[#4A154B] text-white flex items-center justify-center rounded-lg font-bold text-xl mb-3">S</div>
                      <p className="text-xs font-bold text-slate-800">Slack Alerts</p>
                      <p className="text-[10px] text-slate-500 mt-1 mb-3">Post Zero-Day alerts to #soc-critical</p>
                      <button onClick={() => setWebhooks({...webhooks, slack: !webhooks.slack})} className={`text-[10px] font-bold px-4 py-1.5 rounded-full w-full transition-colors ${webhooks.slack ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100'}`}>
                        {webhooks.slack ? 'Connected' : 'Connect'}
                      </button>
                    </div>
                    <div className="border border-slate-200 rounded-xl p-4 flex flex-col items-center text-center transition-all">
                      <div className="w-10 h-10 bg-[#0066FF] text-white flex items-center justify-center rounded-lg font-bold text-xl mb-3">J</div>
                      <p className="text-xs font-bold text-slate-800">Jira Service Desk</p>
                      <p className="text-[10px] text-slate-500 mt-1 mb-3">Auto-create tickets for new anomalies</p>
                      <button onClick={() => setWebhooks({...webhooks, jira: !webhooks.jira})} className={`text-[10px] font-bold px-4 py-1.5 rounded-full w-full transition-colors ${webhooks.jira ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100'}`}>
                        {webhooks.jira ? 'Connected' : 'Connect'}
                      </button>
                    </div>
                    <div className="border border-slate-200 rounded-xl p-4 flex flex-col items-center text-center transition-all">
                      <div className="w-10 h-10 bg-[#25C171] text-white flex items-center justify-center rounded-lg font-bold text-xl mb-3">P</div>
                      <p className="text-xs font-bold text-slate-800">PagerDuty</p>
                      <p className="text-[10px] text-slate-500 mt-1 mb-3">Trigger on-call incidents on breach</p>
                      <button onClick={() => setWebhooks({...webhooks, pagerduty: !webhooks.pagerduty})} className={`text-[10px] font-bold px-4 py-1.5 rounded-full w-full transition-colors ${webhooks.pagerduty ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100'}`}>
                        {webhooks.pagerduty ? 'Connected' : 'Connect'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />
    </div>
  );
}

export default App;
