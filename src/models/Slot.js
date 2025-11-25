import mongoose from 'mongoose';

const slotSchema = new mongoose.Schema({
  courtId: { type: mongoose.Schema.Types.ObjectId, ref: "Court", required: true },
  date: { type: String, required: true },
  slotId: { type: String, required: true }, 
  timeRange: { type: String, required: true },
  price: { type: Number, required: true },
  status: { type: String, enum: ["available","reserved","booked"], default: "available" },
  reservedBy: { type: String, default: null },
  reservedAt: { type: Date },
});

const Slot =  mongoose.model('Slot', slotSchema);

export default Slot;