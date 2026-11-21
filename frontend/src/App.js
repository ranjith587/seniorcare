import React, { useState, useEffect, useRef } from 'react';
import {
  Heart, AlertTriangle, Pill, HeartPulse, Calendar,
  Activity, PhoneCall, Users, BellRing, CheckCircle2, Volume2, RotateCcw, LogOut
} from 'lucide-react';
import MedicationSection from './components/MedicationSection';
import HealthRecordsSection from './components/HealthRecordsSection';
import AppointmentsSection from './components/AppointmentsSection';
import EmergencyContactsSection from './components/EmergencyContactsSection';
import AuthPage from './components/AuthPage';
import './App.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function normalizeTo24Hour(timeStr) {
  if (!timeStr) return '';
  const trimmed = timeStr.trim();
  const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = ampmMatch[2];
    const period = ampmMatch[3].toUpperCase();
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }
  return trimmed.slice(0, 5);
}

let sharedAudioCtx = null;

function playChimeSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume();
    }

    const now = sharedAudioCtx.currentTime;
    const notes = [587.33, 739.99, 880.0, 1174.66];
    notes.forEach((freq, idx) => {
      const osc = sharedAudioCtx.createOscillator();
      const gain = sharedAudioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.18);
      gain.gain.setValueAtTime(0.45, now + idx * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.18 + 0.8);
      osc.connect(gain);
      gain.connect(sharedAudioCtx.destination);
      osc.start(now + idx * 0.18);
      osc.stop(now + idx * 0.18 + 0.8);
    });
  } catch (err) {
    console.error('Audio error:', err);
  }
}

function speakText(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.volume = 1.0;
  utterance.rate = 0.92;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('seniorcare_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState('meds');
  const [fontSize, setFontSize] = useState('normal');

  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const [medications, setMedications] = useState([]);
  const [records, setRecords] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [contacts, setContacts] = useState([]);

  const [dueMedAlert, setDueMedAlert] = useState(null);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const triggeredKeysRef = useRef(new Set());

  useEffect(() => {
    if (!currentUser) return;
    fetch(`${API_BASE}/medications`).then((r) => r.json()).then(setMedications).catch(console.error);
    fetch(`${API_BASE}/records`).then((r) => r.json()).then(setRecords).catch(console.error);
    fetch(`${API_BASE}/appointments`).then((r) => r.json()).then(setAppointments).catch(console.error);
    fetch(`${API_BASE}/contacts`).then((r) => r.json()).then(setContacts).catch(console.error);
  }, [currentUser]);

  const handleLogout = () => {
    localStorage.removeItem('seniorcare_user');
    setCurrentUser(null);
  };

  const testAndUnlockAudio = async () => {
    setAudioUnlocked(true);
    playChimeSound();
    speakText('Audio and voice reminders are now active.');

    if ('Notification' in window && Notification.permission !== 'granted') {
      await Notification.requestPermission();
    }
  };

  const resetDashboardSummary = async () => {
    if (!window.confirm("Reset Today's Medications, Latest Vital, and Next Doctor Visit?")) return;
    try {
      const res = await fetch(`${API_BASE}/reset-dashboard`, { method: 'POST' });
      const data = await res.json();
      setMedications(data.medications);
      setRecords(data.records);
      setAppointments(data.appointments);
    } catch (err) {
      alert('Cannot connect to backend server on port 5000.');
    }
  };

  const triggerMedicationAlarm = (med) => {
    playChimeSound();
    setDueMedAlert(med);
    speakText(`Attention! It is ${med.time}. Time to take your ${med.name}, ${med.dosage}.`);

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Time for ${med.name}`, {
        body: `Dosage: ${med.dosage} (Scheduled: ${med.time})`,
      });
    }
  };

  useEffect(() => {
    if (!dueMedAlert) return;
    const ringLoop = setInterval(() => {
      playChimeSound();
    }, 4000);
    return () => clearInterval(ringLoop);
  }, [dueMedAlert]);

  useEffect(() => {
    if (!currentUser) return;
    const checkSchedule = () => {
      const now = new Date();
      const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const todayKey = now.toDateString();

      medications.forEach((med) => {
        if (med.taken) return;
        const medHHMM = normalizeTo24Hour(med.time);
        const uniqueAlertId = `${med._id}-${todayKey}-${currentHHMM}`;

        if (medHHMM === currentHHMM && !triggeredKeysRef.current.has(uniqueAlertId)) {
          triggeredKeysRef.current.add(uniqueAlertId);
          triggerMedicationAlarm(med);
        }
      });
    };

    checkSchedule();
    const interval = setInterval(checkSchedule, 5000);
    return () => clearInterval(interval);
  }, [medications, currentUser]);

  const confirmDueMedTaken = async () => {
    if (!dueMedAlert) return;
    window.speechSynthesis.cancel();
    const res = await fetch(`${API_BASE}/medications/${dueMedAlert._id}/toggle`, {
      method: 'PATCH',
    });
    const updated = await res.json();
    setMedications((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
    setDueMedAlert(null);
  };

  useEffect(() => {
    if (!sosModalOpen) return;
    if (countdown === 0) {
      fetch(`${API_BASE}/sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: 'Home Address (GPS Verified)' }),
      }).catch(console.error);

      const names = contacts.map((c) => c.name).join(', ') || 'Emergency Responders';
      setSosModalOpen(false);
      setCountdown(5);
      alert(`EMERGENCY SOS SENT! Alerted: ${names} with your live GPS location.`);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [sosModalOpen, countdown, contacts]);

  const startSos = () => {
    setCountdown(5);
    setSosModalOpen(true);
  };

  // Show Login / Sign-Up screen if not signed in
  if (!currentUser) {
    return <AuthPage onLogin={setCurrentUser} apiBase={API_BASE} />;
  }

  const takenMeds = medications.filter((m) => m.taken).length;

  const pageTitles = {
    meds: 'Daily Medications',
    health: 'Health Records',
    appts: 'Doctor Appointments',
    contacts: 'Emergency Contacts',
  };

  return (
    <div className={`scale-${fontSize}`}>
      <div className="dashboard-layout">
        {/* Left Navigation Sidebar */}
        <aside className="sidebar">
          <div>
            <div className="brand">
              <div className="brand-icon">
                <Heart fill="white" size={24} />
              </div>
              <div>
                <div>SeniorCare+</div>
                <div style={{ fontSize: '0.68em', fontWeight: 600, color: '#0d9488' }}>
                  Hello, {currentUser.name}
                </div>
              </div>
            </div>

            <h3 className="sidebar-heading">Menu</h3>

            <nav className="sidebar-nav">
              <button
                className={`sidebar-btn ${activeTab === 'meds' ? 'active' : ''}`}
                onClick={() => setActiveTab('meds')}
              >
                <span className="sidebar-btn-left">
                  <Pill size={22} />
                  <span>Medications</span>
                </span>
                <span className="sidebar-count">{takenMeds}/{medications.length}</span>
              </button>

              <button
                className={`sidebar-btn ${activeTab === 'health' ? 'active' : ''}`}
                onClick={() => setActiveTab('health')}
              >
                <span className="sidebar-btn-left">
                  <HeartPulse size={22} />
                  <span>Health Records</span>
                </span>
                <span className="sidebar-count">{records.length}</span>
              </button>

              <button
                className={`sidebar-btn ${activeTab === 'appts' ? 'active' : ''}`}
                onClick={() => setActiveTab('appts')}
              >
                <span className="sidebar-btn-left">
                  <Calendar size={22} />
                  <span>Appointments</span>
                </span>
                <span className="sidebar-count">{appointments.length}</span>
              </button>

              <button
                className={`sidebar-btn ${activeTab === 'contacts' ? 'active' : ''}`}
                onClick={() => setActiveTab('contacts')}
              >
                <span className="sidebar-btn-left">
                  <Users size={22} />
                  <span>Emergency Contacts</span>
                </span>
                <span className="sidebar-count">{contacts.length}</span>
              </button>
            </nav>
          </div>

          <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button className="sos-sidebar-btn" onClick={startSos}>
              <PhoneCall size={22} />
              EMERGENCY SOS
            </button>

            <button
              type="button"
              className="tab-btn"
              onClick={handleLogout}
              style={{ width: '100%', justifyContent: 'center', color: '#475569' }}
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Right Main Content Workspace */}
        <main className="main-content">
          <div className="top-bar">
            <h1 className="page-title">{pageTitles[activeTab]}</h1>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
              <button
                type="button"
                className="tab-btn"
                onClick={resetDashboardSummary}
                style={{ background: '#fee2e2', color: '#991b1b', borderColor: 'transparent' }}
                title="Reset Today's Medications, Latest Vital, and Next Doctor Visit"
              >
                <RotateCcw size={18} />
                Reset Summary
              </button>

              <button
                type="button"
                className="tab-btn"
                onClick={testAndUnlockAudio}
                style={{
                  background: audioUnlocked ? '#d1fae5' : '#fef3c7',
                  color: audioUnlocked ? '#065f46' : '#92400e',
                  borderColor: 'transparent',
                }}
              >
                <BellRing size={18} />
                {audioUnlocked ? 'Test Sound & Voice' : 'Click to Enable Sound'}
              </button>

              <div className="font-pill-group" title="Adjust Text Size">
                <span style={{ fontSize: '0.85em', fontWeight: 600, color: '#64748b', padding: '0 8px' }}>
                  Text Size:
                </span>
                <button className={`font-btn ${fontSize === 'normal' ? 'active' : ''}`} onClick={() => setFontSize('normal')}>A</button>
                <button className={`font-btn ${fontSize === 'large' ? 'active' : ''}`} onClick={() => setFontSize('large')}>A+</button>
                <button className={`font-btn ${fontSize === 'xlarge' ? 'active' : ''}`} onClick={() => setFontSize('xlarge')}>A++</button>
              </div>
            </div>
          </div>

          {/* Summary Metric Strip */}
          <div className="stats-strip">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#ccfbf1', color: '#0d9488' }}>
                <Pill size={24} />
              </div>
              <div>
                <div className="stat-label">Today's Medications</div>
                <div className="stat-value">{takenMeds} / {medications.length} Taken</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#e0e7ff', color: '#4f46e5' }}>
                <Activity size={24} />
              </div>
              <div>
                <div className="stat-label">Latest Vital</div>
                <div className="stat-value">{records[0] ? records[0].value : 'No records'}</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                <Calendar size={24} />
              </div>
              <div>
                <div className="stat-label">Next Doctor Visit</div>
                <div className="stat-value">{appointments[0] ? appointments[0].date : 'None'}</div>
              </div>
            </div>
          </div>

          {/* Active Section */}
          {activeTab === 'meds' && (
            <MedicationSection medications={medications} setMedications={setMedications} apiBase={API_BASE} />
          )}
          {activeTab === 'health' && (
            <HealthRecordsSection records={records} setRecords={setRecords} apiBase={API_BASE} />
          )}
          {activeTab === 'appts' && (
            <AppointmentsSection appointments={appointments} setAppointments={setAppointments} apiBase={API_BASE} />
          )}
          {activeTab === 'contacts' && (
            <EmergencyContactsSection contacts={contacts} setContacts={setContacts} apiBase={API_BASE} />
          )}
        </main>

        {/* Automatic Medication Due Alarm Modal */}
        {dueMedAlert && (
          <div className="modal-overlay">
            <div className="modal-box" style={{ borderTopColor: '#0d9488' }}>
              <BellRing size={52} color="#0d9488" />
              <h2 style={{ color: '#0f172a', marginTop: '12px', marginBottom: '6px' }}>
                TIME FOR YOUR MEDICINE
              </h2>
              <p style={{ fontSize: '1.25em', fontWeight: 800, color: '#0d9488', margin: '10px 0 4px' }}>
                {dueMedAlert.name} ({dueMedAlert.dosage})
              </p>
              <p style={{ color: '#64748b', marginBottom: '20px' }}>
                Scheduled for <strong>{dueMedAlert.time}</strong>
              </p>

              <button
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '16px', fontSize: '1.05em' }}
                onClick={confirmDueMedTaken}
              >
                <CheckCircle2 size={22} /> I TOOK IT NOW
              </button>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  className="tab-btn"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => triggerMedicationAlarm(dueMedAlert)}
                >
                  <Volume2 size={18} /> Repeat Voice
                </button>
                <button
                  className="tab-btn"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => {
                    window.speechSynthesis.cancel();
                    setDueMedAlert(null);
                  }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5-Second Safety Countdown Modal */}
        {sosModalOpen && (
          <div className="modal-overlay">
            <div className="modal-box">
              <AlertTriangle size={52} color="#e11d48" />
              <h2 style={{ color: '#e11d48', marginTop: '12px', marginBottom: '6px' }}>SENDING EMERGENCY SOS</h2>
              <p style={{ color: '#64748b' }}>
                Alerting {contacts.length} trusted contact(s) & emergency responders in...
              </p>
              <div className="countdown-circle">{countdown}</div>
              <button
                className="btn-cancel"
                onClick={() => setSosModalOpen(false)}
              >
                CANCEL — I AM OKAY
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}