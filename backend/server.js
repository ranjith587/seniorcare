const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const {
  User,
  Medication,
  HealthRecord,
  Appointment,
  EmergencyContact,
  SosAlert,
} = require('./models/CareData');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/senior_care_db';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB successfully');
    await seedInitialData();
  })
  .catch((err) => console.error('MongoDB connection error:', err));

async function seedInitialData() {
  if ((await User.countDocuments()) === 0) {
    await User.create({
      name: 'Ramesh Kumar',
      phone: '9840012345',
      pin: '1234',
      age: '68',
    });
  }

  if ((await Medication.countDocuments()) === 0) {
    await Medication.insertMany([
      { name: 'Amlodipine', dosage: '5mg - 1 Tablet', time: '08:30 AM', taken: true },
      { name: 'Metformin', dosage: '500mg - 1 Tablet', time: '01:30 PM', taken: false },
      { name: 'Vitamin D3', dosage: '1 Capsule', time: '08:00 PM', taken: false },
    ]);
  }

  if ((await HealthRecord.countDocuments()) === 0) {
    await HealthRecord.insertMany([
      { type: 'Blood Pressure', value: '124/80 mmHg', notes: 'Morning reading after breakfast', date: '11/20/2026' },
      { type: 'Blood Sugar', value: '108 mg/dL', notes: 'Fasting sugar normal', date: '11/19/2026' },
    ]);
  }

  if ((await Appointment.countDocuments()) === 0) {
    await Appointment.insertMany([
      { doctor: 'Dr. R. Subramanian', specialty: 'Cardiologist', date: '2026-11-25', time: '10:30 AM' },
    ]);
  }

  if ((await EmergencyContact.countDocuments()) === 0) {
    await EmergencyContact.insertMany([
      { name: 'Arjun Kumar', relation: 'Son', phone: '+91 98400 12345' },
      { name: 'Dr. R. Subramanian', relation: 'Family Doctor', phone: '+91 98400 67890' },
    ]);
  }
}

app.get('/', (req, res) => {
  res.json({ status: 'SeniorCare+ API is running' });
});

// --- AUTHENTICATION (SIGN UP & LOGIN) ---
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, phone, pin, age } = req.body;
    if (!name || !phone || !pin) {
      return res.status(400).json({ error: 'Name, Phone Number, and 4-Digit PIN are required.' });
    }
    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: 'PIN must be exactly 4 digits (e.g., 1234).' });
    }
    const cleanPhone = phone.trim();
    const existing = await User.findOne({ phone: cleanPhone });
    if (existing) {
      return res.status(400).json({ error: 'This phone number is already registered. Please Sign In.' });
    }
    const user = await User.create({
      name: name.trim(),
      phone: cleanPhone,
      pin,
      age: age || '',
    });
    res.status(201).json({
      _id: user._id,
      name: user.name,
      phone: user.phone,
      age: user.age,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { phone, pin } = req.body;
    if (!phone || !pin) {
      return res.status(400).json({ error: 'Please enter your Phone Number and 4-Digit PIN.' });
    }
    const user = await User.findOne({ phone: phone.trim(), pin: pin.trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid Phone Number or 4-Digit PIN.' });
    }
    res.json({
      _id: user._id,
      name: user.name,
      phone: user.phone,
      age: user.age,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- RESET DASHBOARD SUMMARY ---
app.post('/api/reset-dashboard', async (req, res) => {
  try {
    await Medication.updateMany({}, { $set: { taken: false } });
    await HealthRecord.deleteMany({});
    await Appointment.deleteMany({});
    const meds = await Medication.find().sort({ createdAt: 1 });
    res.json({ medications: meds, records: [], appointments: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- MEDICATIONS ---
app.get('/api/medications', async (req, res) => {
  try {
    res.json(await Medication.find().sort({ createdAt: 1 }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/medications', async (req, res) => {
  try {
    const saved = await Medication.create(req.body);
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/medications/reset-all', async (req, res) => {
  try {
    await Medication.updateMany({}, { $set: { taken: false } });
    const meds = await Medication.find().sort({ createdAt: 1 });
    res.json(meds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/medications/:id/toggle', async (req, res) => {
  try {
    const med = await Medication.findById(req.params.id);
    if (!med) return res.status(404).json({ error: 'Not found' });
    med.taken = !med.taken;
    await med.save();
    res.json(med);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/medications/:id', async (req, res) => {
  try {
    await Medication.findByIdAndDelete(req.params.id);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- HEALTH RECORDS ---
app.get('/api/records', async (req, res) => {
  try {
    res.json(await HealthRecord.find().sort({ createdAt: -1 }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/records', async (req, res) => {
  try {
    const saved = await HealthRecord.create(req.body);
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/records/:id', async (req, res) => {
  try {
    await HealthRecord.findByIdAndDelete(req.params.id);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- APPOINTMENTS ---
app.get('/api/appointments', async (req, res) => {
  try {
    res.json(await Appointment.find().sort({ date: 1 }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/appointments', async (req, res) => {
  try {
    const saved = await Appointment.create(req.body);
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/appointments/:id', async (req, res) => {
  try {
    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- EMERGENCY CONTACTS ---
app.get('/api/contacts', async (req, res) => {
  try {
    res.json(await EmergencyContact.find().sort({ createdAt: 1 }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/contacts', async (req, res) => {
  try {
    const saved = await EmergencyContact.create(req.body);
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/contacts/:id', async (req, res) => {
  try {
    await EmergencyContact.findByIdAndDelete(req.params.id);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- EMERGENCY SOS ---
app.post('/api/sos', async (req, res) => {
  try {
    const alert = await SosAlert.create({
      location: req.body.location || 'Home Address (GPS Verified)',
    });
    res.status(201).json({ message: 'Emergency SOS logged', alert });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});