import React, { useState } from 'react';
import { Pill, Plus, CheckCircle2, Volume2, Trash2, RotateCcw } from 'lucide-react';

export default function MedicationSection({ medications, setMedications, apiBase }) {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [time, setTime] = useState('');

  const addMed = async (e) => {
    e.preventDefault();
    if (!name.trim() || !time) return;
    try {
      const res = await fetch(`${apiBase}/medications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          dosage: dosage.trim() || '1 Tablet',
          time,
          taken: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Error saving medication: ${data.error || 'Server error'}`);
        return;
      }
      setMedications([...medications, data]);
      setName('');
      setDosage('');
      setTime('');
    } catch (err) {
      alert('Cannot connect to backend (http://localhost:5000). Run "node server.js" in the backend terminal.');
    }
  };

  const toggleTaken = async (id) => {
    const res = await fetch(`${apiBase}/medications/${id}/toggle`, { method: 'PATCH' });
    const updated = await res.json();
    setMedications(medications.map((m) => (m._id === id ? updated : m)));
  };

  const resetAllForNewDay = async () => {
    const res = await fetch(`${apiBase}/medications/reset-all`, { method: 'PATCH' });
    const updatedList = await res.json();
    setMedications(updatedList);
  };

  const deleteMed = async (id) => {
    await fetch(`${apiBase}/medications/${id}`, { method: 'DELETE' });
    setMedications(medications.filter((m) => m._id !== id));
  };

  const speakReminder = (med) => {
    if ('speechSynthesis' in window) {
      const msg = new SpeechSynthesisUtterance(
        `Reminder: Please take ${med.name}, ${med.dosage}, scheduled for ${med.time}.`
      );
      msg.rate = 0.9;
      window.speechSynthesis.speak(msg);
    }
  };

  const anyTaken = medications.some((m) => m.taken);

  return (
    <div className="card">
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}><Pill color="#0d9488" /> Daily Medications & Reminders</h2>

        {medications.length > 0 && (
          <button
            type="button"
            className="tab-btn"
            onClick={resetAllForNewDay}
            disabled={!anyTaken}
            style={{
              opacity: anyTaken ? 1 : 0.5,
              cursor: anyTaken ? 'pointer' : 'not-allowed',
              background: anyTaken ? '#e0f2fe' : '#f1f5f9',
              color: anyTaken ? '#0369a1' : '#64748b',
            }}
          >
            <RotateCcw size={18} /> Start New Day (Reset All)
          </button>
        )}
      </div>

      <form className="form-row" onSubmit={addMed}>
        <input
          type="text"
          placeholder="Medicine Name (e.g., Metformin)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Dosage (e.g., 500mg - 1 pill)"
          value={dosage}
          onChange={(e) => setDosage(e.target.value)}
        />
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          required
        />
        <button type="submit" className="btn-primary">
          <Plus size={20} /> Add Medicine
        </button>
      </form>

      {medications.map((med) => (
        <div key={med._id} className={`list-item ${med.taken ? 'completed' : ''}`}>
          <div>
            <strong style={{ fontSize: '1.15em' }}>{med.name}</strong> ({med.dosage})
            <div style={{ color: '#64748b', marginTop: '4px' }}>Scheduled: <strong>{med.time}</strong></div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button type="button" className="tab-btn" onClick={() => speakReminder(med)}>
              <Volume2 size={20} /> Listen
            </button>
            <button
              type="button"
              className="btn-primary"
              style={{ background: med.taken ? '#059669' : '#0d9488' }}
              onClick={() => toggleTaken(med._id)}
            >
              <CheckCircle2 size={20} />
              {med.taken ? 'Taken' : 'Mark as Taken'}
            </button>
            <button
              type="button"
              className="tab-btn"
              style={{ color: '#e11d48' }}
              onClick={() => deleteMed(med._id)}
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}