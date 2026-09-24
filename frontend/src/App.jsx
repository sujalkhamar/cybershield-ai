import React, { useState, useEffect } from 'react';

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
    <div style={{ fontFamily: 'sans-serif', margin: '2rem' }}>
      <h1 style={{ color: '#1e293b' }}>🛡️ CyberShield-AI: SOC Dashboard</h1>
      <p style={{ color: '#64748b' }}>Real-time Zero-Day Cyberattack Prediction</p>
      
      <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '8px' }}>
        <h2 style={{ color: '#0f172a' }}>Live Threat Logs</h2>
        
        {loading ? (
          <p>Connecting to backend...</p>
        ) : threats.length === 0 ? (
          <p>No threats detected yet. Secure!</p>
        ) : (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '0.5rem' }}>Source IP</th>
                <th style={{ padding: '0.5rem' }}>Attack Type</th>
                <th style={{ padding: '0.5rem' }}>Confidence</th>
                <th style={{ padding: '0.5rem' }}>Zero-Day?</th>
              </tr>
            </thead>
            <tbody>
              {threats.map((threat, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #e2e8f0', color: threat.is_zero_day ? '#ef4444' : '#334155' }}>
                  <td style={{ padding: '0.5rem' }}>{threat.source_ip}</td>
                  <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>{threat.prediction_class}</td>
                  <td style={{ padding: '0.5rem' }}>{(threat.confidence_score * 100).toFixed(1)}%</td>
                  <td style={{ padding: '0.5rem' }}>{threat.is_zero_day ? '⚠️ YES' : 'NO'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default App;
