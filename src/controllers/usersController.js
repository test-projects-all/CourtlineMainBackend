import CourtBooking from "../models/CourtBookingUser.js";
import Court from "../models/Court.js";
import mongoose from "mongoose";
import Slot from "../models/Slot.js";
import Event from "../models/Event.js"
import Razorpay from "razorpay";
import dotenv from "dotenv"
dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

export async function bookSlot(req, res) {
    const { courtId, name, phone, email, slots, totalAmount, PaymentId, date, time, status } = req.body;
    if (!courtId || !name || !phone || !email || !slots || !totalAmount || !PaymentId || !date || !time) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const court = await Court.findById(courtId);


    try {
        const newBooking = new CourtBooking({
            courtId,
            courtName,
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

// export async function getSlot(req, res) {
//     try {
//         const { courtId } = req.params;

//         if (!courtId) return res.status(400).json({ error: 'courtId is required' });

//         // Fetch court details
//         const court = await Court.findById(courtId);
//         if (!court) return res.status(404).json({ error: 'Court not found' });

//         // Format today's date to dd-mm-yyyy
//         const today = new Date();
//         const formatDate = (d) => {
//             const dd = String(d.getDate()).padStart(2, '0');
//             const mm = String(d.getMonth() + 1).padStart(2, '0');
//             const yyyy = d.getFullYear();
//             return `${dd}-${mm}-${yyyy}`;
//         };
//         const date = formatDate(today);

//         // Helper: convert "7:00 AM" to minutes since 00:00
//         const timeStrToMinutes = (timeStr) => {
//             let [time, ampm] = timeStr.split(" ");
//             let [h, m] = time.split(":").map(Number);
//             if (ampm === "PM" && h < 12) h += 12;
//             if (ampm === "AM" && h === 12) h = 0;
//             return h * 60 + m;
//         };

//         // Normalize time string (remove extra spaces)
//         const normalizeTimeStr = (timeStr) => {
//             return timeStr.replace(/\s+/g, ' ').trim();
//         };

//         // Check if dynamic slot overlaps a booked slot range
//         const isSlotBooked = (dynSlot, bookedSlotStr) => {
//             const [bStartStr, bEndStr] = bookedSlotStr.split("-");
//             const [dynStartStr, dynEndStr] = dynSlot.time.split("-");

//             const dynStart = timeStrToMinutes(dynStartStr.trim());
//             const dynEnd = timeStrToMinutes(dynEndStr.trim());
//             const bStart = timeStrToMinutes(bStartStr.trim());
//             const bEnd = timeStrToMinutes(bEndStr.trim());

//             return dynStart < bEnd && dynEnd > bStart;
//         };

//         // Convert 24-hour time to 12-hour with AM/PM
//         const formatTo12Hour = (hour24, minute) => {
//             const ampm = hour24 >= 12 ? 'PM' : 'AM';
//             const hour12 = hour24 % 12 || 12;
//             return `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${ampm}`;
//         };

//         // Generate dynamic slots
//         const generateSlots = (startTime, endTime, length) => {
//             const slots = [];
//             const parseTime = (timeStr) => {
//                 const [time, ampm] = timeStr.split(" ");
//                 const [h, m] = time.split(":").map(Number);
//                 return [h, m, ampm];
//             };

//             const [startH, startM, startAMPM] = parseTime(startTime);
//             const [endH, endM, endAMPM] = parseTime(endTime);
//             const [slotH, slotM] = length.split(":").map(Number);

//             let currentH = startH + (startAMPM === "PM" && startH < 12 ? 12 : 0);
//             let currentM = startM;
//             let endHour = endH + (endAMPM === "PM" && endH < 12 ? 12 : 0);

//             while (currentH < endHour || (currentH === endHour && currentM < endM)) {
//                 let slotEndH = currentH + slotH;
//                 let slotEndM = currentM + slotM;
//                 if (slotEndM >= 60) {
//                     slotEndH += Math.floor(slotEndM / 60);
//                     slotEndM = slotEndM % 60;
//                 }

//                 // Format in 12-hour format with AM/PM to match edited slots
//                 const slotStart = formatTo12Hour(currentH, currentM);
//                 const slotEnd = formatTo12Hour(slotEndH, slotEndM);

//                 slots.push({ time: `${slotStart} - ${slotEnd}`, price: 1, status: "available" });

//                 currentH = slotEndH;
//                 currentM = slotEndM;
//             }

//             return slots;
//         };

//         const dynamicSlots = generateSlots(court.startTime, court.endTime, court.length);

//         // Fetch booked slots for today
//         const bookings = await CourtBooking.find({ courtId: courtId, date });

//         // DEBUG: Check all slots in collection
//         const allSlots = await Slot.find({});
//         console.log("=== DEBUG INFO ===");
//         console.log("Total slots in DB:", allSlots.length);
//         if (allSlots.length > 0) {
//             console.log("Sample slot:", JSON.stringify(allSlots[0], null, 2));
//             console.log("Sample courtId type:", typeof allSlots[0].courtId);
//             console.log("Sample date:", allSlots[0].date);
//         }
        
//         // Fetch edited slots - FIX: Convert courtId to string to match DB storage
//         console.log("Searching for courtId:", String(courtId), "type:", typeof String(courtId));
//         console.log("Searching for date:", date, "type:", typeof date);
        
//         const editedSlots = await Slot.find({
//             courtId: String(courtId),
//             date: date
//         });
        
//         console.log("Found edited slots:", editedSlots.length);
//         if (editedSlots.length > 0) {
//             console.log("Edited slots data:", JSON.stringify(editedSlots, null, 2));
//         }
//         console.log("=== END DEBUG ===");

//         // Merge all slots
//         const slotMap = new Map();
//         dynamicSlots.forEach(s => slotMap.set(normalizeTimeStr(s.time), s));

//         // Apply booked slots (overwrite dynamic)
//         bookings.forEach(b => {
//             slotMap.forEach((slot, key) => {
//                 if (isSlotBooked(slot, b.slots || b.time)) {
//                     slotMap.set(key, { ...slot, status: "booked" });
//                 }
//             });
//         });

//         // Apply edited slots (overwrite dynamic/booked) - FIXED LOGIC
//         editedSlots.forEach(editedSlot => {
//             const normalizedEditedTime = normalizeTimeStr(editedSlot.slotTime);
            
//             // Check if this time exists in our slot map
//             if (slotMap.has(normalizedEditedTime)) {
//                 const existingSlot = slotMap.get(normalizedEditedTime);
                
//                 // Update the slot with edited values
//                 slotMap.set(normalizedEditedTime, {
//                     ...existingSlot,
//                     price: Number(editedSlot.price) || existingSlot.price,
//                     status: editedSlot.active === "true" || editedSlot.active === true
//                         ? existingSlot.status // Keep existing status (booked/available)
//                         : "inactive" // Mark as inactive if active is false
//                 });
                
//                 console.log(`Applied edited slot: ${normalizedEditedTime}, price: ${editedSlot.price}, active: ${editedSlot.active}`);
//             } else {
//                 console.log(`Warning: Edited slot time "${editedSlot.slotTime}" not found in dynamic slots`);
//             }
//         });

//         const finalSlots = Array.from(slotMap.values());

//         res.status(200).json({
//             message: "Slots fetched successfully",
//             date,
//             courtId,
//             slots: finalSlots
//         });

//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: err.message });
//     }
// }

// 🟡 Get all events (optionally filter by type)
export const getEvents = async (req, res) => {
  try {
    const { type } = req.query; // e.g. ?type=upcoming or ?type=possibility
    const filter = type ? { type } : {};

    const events = await Event.find(filter).sort({ createdAt: -1 });
    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ message: "Error fetching events", error: err.message });
  }
};

export async function getSlot(req, res) {
    try {
        const { courtId } = req.params;
        const { date } = req.query; // Allow passing date as query param

        if (!courtId) return res.status(400).json({ error: 'courtId is required' });

        const court = await Court.findById(courtId);
        if (!court) return res.status(404).json({ error: 'Court not found' });

        const formatDate = (d) => {
            const dd = String(d.getDate()).padStart(2, '0');
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const yyyy = d.getFullYear();
            return `${dd}-${mm}-${yyyy}`;
        };

        const selectedDate = date ? new Date(date) : new Date();
        const formattedDate = formatDate(selectedDate);

        const timeStrToMinutes = (timeStr) => {
            let [time, ampm] = timeStr.split(" ");
            let [h, m] = time.split(":").map(Number);
            if (ampm === "PM" && h < 12) h += 12;
            if (ampm === "AM" && h === 12) h = 0;
            return h * 60 + m;
        };

        const normalizeTimeStr = (timeStr) => {
            return timeStr.replace(/\s+/g, ' ').trim();
        };

        const formatTo12Hour = (hour24, minute) => {
            const ampm = hour24 >= 12 ? 'PM' : 'AM';
            const hour12 = hour24 % 12 || 12;
            return `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${ampm}`;
        };

        const generateSlots = (startTime, endTime, length) => {
            const slots = [];
            const parseTime = (timeStr) => {
                const [time, ampm] = timeStr.split(" ");
                const [h, m] = time.split(":").map(Number);
                return [h, m, ampm];
            };

            const [startH, startM, startAMPM] = parseTime(startTime);
            const [endH, endM, endAMPM] = parseTime(endTime);
            const [slotH, slotM] = length.split(":").map(Number);

            let currentH = startH + (startAMPM === "PM" && startH < 12 ? 12 : 0);
            let currentM = startM;
            let endHour = endH + (endAMPM === "PM" && endH < 12 ? 12 : 0);

            while (currentH < endHour || (currentH === endHour && currentM < endM)) {
                let slotEndH = currentH + slotH;
                let slotEndM = currentM + slotM;
                if (slotEndM >= 60) {
                    slotEndH += Math.floor(slotEndM / 60);
                    slotEndM = slotEndM % 60;
                }

                const slotStart = formatTo12Hour(currentH, currentM);
                const slotEnd = formatTo12Hour(slotEndH, slotEndM);

                slots.push({ 
                    time: `${slotStart} - ${slotEnd}`, 
                    price: court.price || 2000, 
                    status: "available" 
                });

                currentH = slotEndH;
                currentM = slotEndM;
            }

            return slots;
        };

        const dynamicSlots = generateSlots(court.startTime, court.endTime, court.length);

        // ✅ FETCH ALL CONFIRMED BOOKINGS FOR THIS COURT & DATE
        const bookings = await CourtBooking.find({
            'slots.courtId': courtId,
            'slots.date': formattedDate,
            status: { $in: ['Paid', 'reserved'] } // Only confirmed bookings
        });

        const slotMap = new Map();
        dynamicSlots.forEach(s => slotMap.set(normalizeTimeStr(s.time), s));

        // ✅ MARK BOOKED SLOTS
        bookings.forEach(booking => {
            booking.slots.forEach(bookedSlot => {
                if (bookedSlot.courtId.toString() === courtId && bookedSlot.date === formattedDate) {
                    const normalizedTime = normalizeTimeStr(bookedSlot.timeRange);
                    if (slotMap.has(normalizedTime)) {
                        const slot = slotMap.get(normalizedTime);
                        slotMap.set(normalizedTime, { ...slot, status: "booked" });
                    }
                }
            });
        });

        // ✅ APPLY EDITED SLOTS (Price & Availability Changes)
        const editedSlots = await Slot.find({
            courtId: String(courtId),
            date: formattedDate
        });

        editedSlots.forEach(editedSlot => {
            const normalizedEditedTime = normalizeTimeStr(editedSlot.slotTime);
            
            if (slotMap.has(normalizedEditedTime)) {
                const existingSlot = slotMap.get(normalizedEditedTime);
                
                slotMap.set(normalizedEditedTime, {
                    ...existingSlot,
                    price: Number(editedSlot.price) || existingSlot.price,
                    status: editedSlot.active === "true" || editedSlot.active === true
                        ? existingSlot.status // Keep booked/available status
                        : "inactive" // Admin disabled this slot
                });
            }
        });

        const finalSlots = Array.from(slotMap.values());

        res.status(200).json({
            message: "Slots fetched successfully",
            date: formattedDate,
            courtId,
            slots: finalSlots
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
}

export async function getCourt(req, res) {
    try {
        const courts = await Court.find();
        res.json(courts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// Create Razorpay order
export async function createOrder(req, res) {
  try {
    const { amount } = req.body;
    console.log(amount)
    const options = {
      amount: amount, // paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.json({
      orderId: order.id,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create order", error: err.message });
  }
}

// Verify payment & store booking
// Verify payment & store booking
// export async function verifyOrder(req, res) {
//   try {
//     const { paymentResponse, orderData } = req.body;
//     const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = paymentResponse;
//     const { userId, totalPrice, activity, courts, formData } = orderData;

//     // Transform courts array into slots array
//     const slots = [];
//     courts.forEach((court) => {
//       court.dates.forEach((dateObj) => {
//         dateObj.slots.forEach((slot) => {
//           slots.push({
//             courtId: court.courtId,
//             date: dateObj.date,
//             timeRange: slot.time,
//             price: slot.price,
//           });
//         });
//       });
//     });

//     const booking = new CourtBooking({
//       name: formData.name,
//       phone: formData.phone,
//       email: formData.email,
//       slots,
//       totalAmount: totalPrice,
//       paymentId: razorpay_payment_id,
//     });

//     await booking.save();
//     res.json({ success: true, booking });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       success: false,
//       message: "Payment verification failed",
//       error: err.message,
//     });
//   }
// }

export async function verifyOrder(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { paymentResponse, orderData } = req.body;
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = paymentResponse;
    const { userId, totalPrice, activity, courts, formData } = orderData;

    // Transform courts array into slots array
    const slots = [];
    courts.forEach((court) => {
      court.dates.forEach((dateObj) => {
        dateObj.slots.forEach((slot) => {
          slots.push({
            courtId: court.courtId,
            date: dateObj.date,
            timeRange: slot.time,
            price: slot.price,
          });
        });
      });
    });

    // ✅ CHECK IF ANY SLOT IS ALREADY BOOKED (Race Condition Prevention)
    const conflictingBookings = await CourtBooking.find({
      'slots.courtId': { $in: slots.map(s => s.courtId) },
      'slots.date': { $in: slots.map(s => s.date) },
      'slots.timeRange': { $in: slots.map(s => s.timeRange) },
      status: { $in: ['Paid', 'reserved'] }
    }).session(session);

    // Check for exact slot conflicts
    for (const booking of conflictingBookings) {
      for (const bookedSlot of booking.slots) {
        const conflict = slots.find(
          s => s.courtId.toString() === bookedSlot.courtId.toString() &&
               s.date === bookedSlot.date &&
               s.timeRange === bookedSlot.timeRange
        );
        
        if (conflict) {
          await session.abortTransaction();
          session.endSession();
          
          return res.status(409).json({
            success: false,
            message: `Slot ${conflict.timeRange} on ${conflict.date} is already booked. Please refresh and select another slot.`,
            conflictingSlot: conflict
          });
        }
      }
    }

    // ✅ CREATE BOOKING IF NO CONFLICTS
    const booking = new CourtBooking({
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      slots,
      totalAmount: totalPrice,
      paymentId: razorpay_payment_id,
      status: 'Paid'
    });

    await booking.save({ session });
    
    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    res.json({ success: true, booking });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: err.message,
    });
  }
}

