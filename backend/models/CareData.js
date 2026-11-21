const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  pin: { type: String, required: true },
  age: { type: String, default: '' },
}, { timestamps: true });

const medicationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosage: { type: String, default: '1 Tablet' },
  time: { type: String, required: true },
  taken: { type: Boolean, default: false },
}, { timestamps: true });

const healthRecordSchema = new mongoose.Schema({
  type: { type: String, required: true },
  value: { type: String, required: true },
  notes: { type: String, default: '' },
  date: { type: String, default: () => new Date().toLocaleDateString() },
}, { timestamps: true });

const appointmentSchema = new mongoose.Schema({
  doctor: { type: String, required: true },
  specialty: { type: String, default: 'General Physician' },
  date: { type: String, required: true },
  time: { type: String, required: true },
}, { timestamps: true });

const emergencyContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  relation: { type: String, default: 'Family' },
  phone: { type: String, required: true },
}, { timestamps: true });

const sosAlertSchema = new mongoose.Schema({
  location: { type: String, default: 'Home Address (GPS Verified)' },
  status: { type: String, default: 'DISPATCHED' },
}, { timestamps: true });

module.exports = {
  User: mongoose.model('User', userSchema),
  Medication: mongoose.model('Medication', medicationSchema),
  HealthRecord: mongoose.model('HealthRecord', healthRecordSchema),
  Appointment: mongoose.model('Appointment', appointmentSchema),
  EmergencyContact: mongoose.model('EmergencyContact', emergencyContactSchema),
  SosAlert: mongoose.model('SosAlert', sosAlertSchema),
};