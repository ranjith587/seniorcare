import React, { useState } from 'react';
import { HeartPulse, Plus, Trash2 } from 'lucide-react';

export default function HealthRecordsSection({ records, setRecords, apiBase }) {
  const [type, setType] = useState('Blood Pressure');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');

  const addRecord = async (e) => {
    e.preventDefault();
    if (!value.trim()) return;

    try {
      const res = await fetch(`${apiBase}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          value: value.trim(),
          notes: notes.trim(),
          date: new Date().toLocaleDateString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(`Error saving health record: ${data.error || 'Server error'}`);
        return;
      }

      setRecords([data, ...records]);
      setValue('');
      setNotes('');
    } catch (err) {
      alert('Cannot connect to backend (http://localhost:5000). Run "node server.js" in the backend terminal.');
    }
  };

  const deleteRecord = async (id) => {
    await fetch(`${apiBase}/records/${id}`, { method: 'DELETE' });
    setRecords(records.filter((r) => r._id !== id));
  };

  return (
    <div className="card">
      <h2><HeartPulse color="#0d9488" /> Health Records & Daily Vitals</h2>

      <form className="form-row" onSubmit={addRecord}>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="Blood Pressure">Blood Pressure</option>
          <option value="Blood Sugar">Blood Sugar</option>
          <option value="Heart Rate">Heart Rate</option>
          <option value="Body Weight">Body Weight</option>
          <option value="Oxygen (SpO2)">Oxygen (SpO2)</option>
        </select>

        <input
          type="text"
          placeholder="Reading (e.g., 120/80 mmHg)"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Notes (optional, e.g., After breakfast)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <button type="submit" className="btn-primary">
          <Plus size={20} /> Save Record
        </button>
      </form>

      {records.map((rec) => (
        <div key={rec._id} className="list-item">
          <div>
            <strong style={{ fontSize: '1.15em', color: '#0d9488' }}>{rec.type}:</strong>{' '}
            <strong style={{ fontSize: '1.15em' }}>{rec.value}</strong>
            <div style={{ color: '#64748b', marginTop: '4px' }}>
              Date: <strong>{rec.date}</strong> {rec.notes ? `• ${rec.notes}` : ''}
            </div>
          </div>

          <button
            type="button"
            className="tab-btn"
            style={{ color: '#e11d48' }}
            onClick={() => deleteRecord(rec._id)}
          >
            <Trash2 size={18} />
          </button>
        </div>
      ))}
    </div>
  );
}