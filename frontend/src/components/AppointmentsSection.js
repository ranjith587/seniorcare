import React, { useState } from 'react';
import { Calendar, Plus } from 'lucide-react';

export default function AppointmentsSection({ appointments, setAppointments }) {
  const [doctor, setDoctor] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const handleBook = (e) => {
    e.preventDefault();
    if (!doctor || !date) return;
    setAppointments([
      ...appointments,
      { id: Date.now(), doctor, specialty: specialty || 'General Checkup', date, time: time || '10:00 AM' },
    ]);
    setDoctor('');
    setSpecialty('');
    setDate('');
    setTime('');
  };

  return (
    <div className="card">
      <h2><Calendar size={26} /> Appointment Scheduling</h2>

      <form className="form-row" onSubmit={handleBook}>
        <input
          type="text"
          placeholder="Doctor Name (e.g., Dr. Meera Nair)"
          value={doctor}
          onChange={(e) => setDoctor(e.target.value)}
        />
        <input
          type="text"
          placeholder="Specialty (e.g., Cardiologist)"
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
        />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        <button type="submit" className="btn-primary">
          <Plus size={20} /> Schedule
        </button>
      </form>

      {appointments.map((app) => (
        <div key={app.id} className="list-item">
          <div>
            <strong>{app.doctor}</strong> — {app.specialty}
            <div style={{ color: '#57534e' }}>Date: {app.date} at {app.time}</div>
          </div>
          <span className="badge badge-amber">Upcoming</span>
        </div>
      ))}
    </div>
  );
}