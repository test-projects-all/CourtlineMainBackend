import mongoose from 'mongoose';

const SlotSchema = new mongoose.Schema({
  courtId: { type: String, ref: 'Court', required: true },
  slotTime: { type: String, required: true }, // "HH:mm"
  price: { type: String, default: 2000  }, // Default price
  active: { type: String, required: true, default: 'true' }, // "true" or "false"
  date: { type: String, required: true }, // "YYYY-MM-DD"
});

const Slot =  mongoose.model('Slot', SlotSchema);

export default Slot;