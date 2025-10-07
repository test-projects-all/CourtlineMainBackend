import mongoose from 'mongoose';

const SlotSchema = new mongoose.Schema({
  courtId: { type: mongoose.Schema.Types.ObjectId, ref: 'Court', required: true },
  slotTime: { type: String, required: true }, // "HH:mm"
  price: { type: Number, default: 2000  }, // Default price
  active: { type: String, required: true, default: 'true' }, // "true" or "false"
  date: { type: String, required: true }, // "YYYY-MM-DD"
});

export default mongoose.model('Slot', SlotSchema);