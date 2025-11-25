import mongoose from 'mongoose';

const courtSchema = new mongoose.Schema({
  name: { type: String, required: true },
  startTime: { type: String, required: true }, // "HH:mm"
  endTime: { type: String, required: true },   // "HH:mm"
  length: { type: String, required: true },   // e.g., "00:30"
  active: { type: String, required: true, default: 'true' }, // "true" or "false"
  createdAt: { type: Date, default: Date.now }
});

const Court = mongoose.model('Court', courtSchema);

export default Court;