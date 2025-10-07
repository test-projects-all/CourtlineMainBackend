import mongoose from "mongoose";
import slotSchema from './Slot.js';

const courtBookingUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  slots: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  PaymentId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  date: { type: String, required: true },
  time: { type: String, required: true },
  status: { type: String, default: 'Paid' },
  courtId: { type: mongoose.Schema.Types.ObjectId, ref: 'Court', required: true },
});

const CourtBooking = mongoose.model('CourtBookingUser', courtBookingUserSchema);

export default CourtBooking;