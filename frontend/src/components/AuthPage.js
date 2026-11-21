import React, { useState } from 'react';
import { Heart, LogIn, UserPlus, Eye, EyeOff, Phone, Lock, User } from 'lucide-react';

export default function AuthPage({ onLogin, apiBase }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isSignUp ? `${apiBase}/auth/signup` : `${apiBase}/auth/login`;
      const payload = isSignUp ? { name, age, phone, pin } : { phone, pin };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Authentication failed. Please try again.');
        setLoading(false);
        return;
      }

      localStorage.setItem('seniorcare_user', JSON.stringify(data));
      onLogin(data);
    } catch (err) {
      setError('Cannot connect to server. Make sure backend (port 5000) is running.');
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%)',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '36px',
          borderRadius: '24px',
          boxShadow: '0 20px 45px rgba(15, 23, 42, 0.1)',
        }}
      >
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
          <div className="brand-icon" style={{ width: '52px', height: '52px' }}>
            <Heart fill="white" size={28} />
          </div>
          <div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>SeniorCare+</div>
            <div style={{ fontSize: '0.95rem', color: '#64748b' }}>
              {isSignUp ? 'Create Your Care Profile' : 'Welcome Back — Sign In'}
            </div>
          </div>
        </div>

        {/* Toggle Sign In / Sign Up */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '22px' }}>
          <button
            type="button"
            className="tab-btn"
            style={{
              flex: 1,
              justifyContent: 'center',
              background: !isSignUp ? '#0d9488' : '#f1f5f9',
              color: !isSignUp ? '#ffffff' : '#334155',
            }}
            onClick={() => { setIsSignUp(false); setError(''); }}
          >
            <LogIn size={18} /> Sign In
          </button>
          <button
            type="button"
            className="tab-btn"
            style={{
              flex: 1,
              justifyContent: 'center',
              background: isSignUp ? '#0d9488' : '#f1f5f9',
              color: isSignUp ? '#ffffff' : '#334155',
            }}
            onClick={() => { setIsSignUp(true); setError(''); }}
          >
            <UserPlus size={18} /> New Sign Up
          </button>
        </div>

        {error && (
          <div
            style={{
              background: '#fee2e2',
              color: '#991b1b',
              padding: '12px 16px',
              borderRadius: '12px',
              fontWeight: 600,
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isSignUp && (
            <>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '14px', top: '16px', color: '#64748b' }} />
                  <input
                    type="text"
                    placeholder="e.g., Ramesh Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ width: '100%', paddingLeft: '42px', boxSizing: 'border-box' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
                  Age (Optional)
                </label>
                <input
                  type="number"
                  placeholder="e.g., 68"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>
            </>
          )}

          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
              Phone Number
            </label>
            <div style={{ position: 'relative' }}>
              <Phone size={18} style={{ position: 'absolute', left: '14px', top: '16px', color: '#64748b' }} />
              <input
                type="tel"
                placeholder="e.g., 9840012345"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ width: '100%', paddingLeft: '42px', boxSizing: 'border-box' }}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
              Easy 4-Digit PIN
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '16px', color: '#64748b' }} />
              <input
                type={showPin ? 'text' : 'password'}
                maxLength={4}
                pattern="\d{4}"
                placeholder="4-digit PIN (e.g., 1234)"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                style={{ width: '100%', paddingLeft: '42px', paddingRight: '46px', boxSizing: 'border-box' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '13px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                }}
                title={showPin ? 'Hide PIN' : 'Show PIN'}
              >
                {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '16px', fontSize: '1.1rem', marginTop: '6px' }}
          >
            {loading ? 'Please wait...' : isSignUp ? 'Create Account & Enter' : 'Sign In to My Dashboard'}
          </button>
        </form>

        {!isSignUp && (
          <div
            style={{
              marginTop: '18px',
              padding: '12px',
              background: '#f8fafc',
              borderRadius: '12px',
              fontSize: '0.9rem',
              color: '#475569',
              textAlign: 'center',
            }}
          >
            Demo Account: Phone <strong>9840012345</strong> • PIN <strong>1234</strong>
          </div>
        )}
      </div>
    </div>
  );
}