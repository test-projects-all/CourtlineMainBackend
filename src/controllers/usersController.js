import CourtBooking from "../models/CourtBookingUser.js";
import Court from "../models/Court.js";
import mongoose from "mongoose";
import Slot from "../models/Slot.js";

export async function bookSlot(req, res) {
    const { courtId, name, phone, email, slots, totalAmount, PaymentId, date, time,status } = req.body;
    if (!courtId || !name || !phone || !email || !slots || !totalAmount || !PaymentId || !date || !time) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    try {
        const newBooking = new CourtBooking({
            courtId,
            name,
            phone,
            email,
            slots,
            totalAmount,
            PaymentId,
            date,
            time,
            status
        });
        const savedBooking = await newBooking.save();
        res.status(201).json({ message: 'Booking successful', bookingId: savedBooking._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }   
}

export async function getSlot(req, res) {
    try {
        const { courtId, date } = req.params;
        console.log('1: Received request', { courtId, date });

        // Validate inputs
        if (!courtId || !mongoose.isValidObjectId(courtId)) {
            console.log('1: Invalid courtId');
            return res.status(400).json({ error: 'Valid courtId is required' });
        }

        // Fetch booked slots from CourtBooking
        const bookings = await CourtBooking.find({ courtId, date })
            .catch(err => {
                console.error('3: Error fetching CourtBooking:', err.message);
                return [];
            });
        console.log(bookings);

        // Extract slots from bookings
        const bookedSlots = [];
        bookings.forEach(booking => {
                    bookedSlots.push({
                        time: booking.time || { start: '', end: '' }, // Fallback for missing time
                        status: booking.status || 'booked',
                        bookedBy: booking.userId || null,
                        courtId:booking.courtId,
                        date: booking.date,
                        price: booking.price || 2000,
                        isActive: true // Assume bookings are active unless overridden
                    });
             
            });

        console.log('4: Extracted booked slots', {bookedSlots });

        // Fetch edited slots from Slot (isActive: false or price !== 0)
        const editedSlots = await Slot.find({
            courtId,
            date: date,
            $or: [{ isActive: false }, { price: { $ne: 0 } }]
        })
            .populate('bookedBy', 'name email')
            .catch(err => {
                console.error('5: Error fetching Slot:', err.message);
                return [];
            });
        console.log('5: Fetched edited slots', { count: editedSlots.length });

        let finalData = [];
        finalData.push(...bookedSlots);
        finalData.push(...editedSlots);

        res.status(200).json({
            message: 'Slots fetched successfully',
            courtId,
            date,
            slots: finalData
        });
    } catch (err) {
        console.error('Error in getSlot:', err.message);
        res.status(500).json({ error: err.message });
    }
}

export async function getCourt(req,res)
{
    try {
        const courts = await Court.find();
        res.json(courts);
    }   catch (err) {   
        res.status(500).json({ error: err.message });
    }
}