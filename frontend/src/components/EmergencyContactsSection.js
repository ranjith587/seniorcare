import React, { useState } from 'react';
import { Users, Plus, PhoneCall, Trash2 } from 'lucide-react';

export default function EmergencyContactsSection({ contacts, setContacts, apiBase }) {
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [phone, setPhone] = useState('');

  const addContact = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    try {
      const res = await fetch(`${apiBase}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          relation: relation.trim() || 'Family',
          phone: phone.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Error saving contact: ${data.error || 'Server error'}`);
        return;
      }
      setContacts([...contacts, data]);
      setName('');
      setRelation('');
      setPhone('');
    } catch (err) {
      alert('Cannot connect to backend (http://localhost:5000). Run "node server.js" in the backend terminal.');
    }
  };

  const deleteContact = async (id) => {
    await fetch(`${apiBase}/contacts/${id}`, { method: 'DELETE' });
    setContacts(contacts.filter((c) => c._id !== id));
  };

  return (
    <div className="card">
      <h2><Users color="#0d9488" /> Trusted Emergency Contacts</h2>

      <form className="form-row" onSubmit={addContact}>
        <input
          type="text"
          placeholder="Contact Name (e.g., Meera Kumar)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Relation (e.g., Daughter / Neighbor)"
          value={relation}
          onChange={(e) => setRelation(e.target.value)}
        />
        <input
          type="tel"
          placeholder="Phone Number (e.g., +91 98400 11223)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <button type="submit" className="btn-primary">
          <Plus size={20} /> Add Contact
        </button>
      </form>

      {contacts.map((c) => (
        <div key={c._id} className="list-item">
          <div>
            <strong style={{ fontSize: '1.15em' }}>{c.name}</strong> ({c.relation})
            <div style={{ color: '#64748b', marginTop: '4px' }}>
              Phone: <strong>{c.phone}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <a
              href={`tel:${c.phone}`}
              className="btn-primary"
              style={{ textDecoration: 'none' }}
            >
              <PhoneCall size={18} /> Call Now
            </a>
            <button
              type="button"
              className="tab-btn"
              style={{ color: '#e11d48' }}
              onClick={() => deleteContact(c._id)}
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}