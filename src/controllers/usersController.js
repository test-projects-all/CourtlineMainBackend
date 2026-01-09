import CourtBooking from "../models/CourtBookingUser.js";
import Court from "../models/Court.js";
import mongoose from "mongoose";
import Slot from "../models/Slot.js";
import Event from "../models/Event.js";
import Razorpay from "razorpay";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { google } from "googleapis";
import crypto from "crypto";

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// export async function bookSlot(req, res) {
//   const {
//     courtId,
//     name,
//     phone,
//     email,
//     slots,
//     totalAmount,
//     PaymentId,
//     date,
//     time,
//     status,
//   } = req.body;
//   if (
//     !courtId ||
//     !name ||
//     !phone ||
//     !email ||
//     !slots ||
//     !totalAmount ||
//     !PaymentId ||
//     !date ||
//     !time
//   ) {
//     return res.status(400).json({ error: "All fields are required" });
//   }

//   const court = await Court.findById(courtId);

//   try {
//     const newBooking = new CourtBooking({
//       courtId,
//       courtName,
//       name,
//       phone,
//       email,
//       slots,
//       totalAmount,
//       PaymentId,
//       date,
//       time,
//       status,
//     });
//     const savedBooking = await newBooking.save();
//     res
//       .status(201)
//       .json({ message: "Booking successful", bookingId: savedBooking._id });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// }


export async function bookSlot(req, res) {
  const {
    courtId,
    name,
    phone,
    email,
    slots,
    totalAmount,
    PaymentId,
    date,
    time,
    status,
  } = req.body;

  if (
    !courtId ||
    !name ||
    !phone ||
    !email ||
    !slots ||
    !totalAmount ||
    !PaymentId ||
    !date ||
    !time
  ) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const courtName =
      COURT_NAME_MAP[courtId.toString()] || "Unknown Court";

    const newBooking = new CourtBooking({
      courtId,
      courtName, // ✅ now defined
      name,
      phone,
      email,
      slots,
      totalAmount,
      PaymentId,
      date,
      time,
      status,
    });

    const savedBooking = await newBooking.save();

    res.status(201).json({
      message: "Booking successful",
      bookingId: savedBooking._id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// 🟡 Get all events (optionally filter by type)
export const getEvents = async (req, res) => {
  try {
    const { type } = req.query; // e.g. ?type=upcoming or ?type=possibility
    const filter = type ? { type } : {};

    const events = await Event.find(filter).sort({ createdAt: -1 });
    res.status(200).json(events);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching events", error: err.message });
  }
};

// export async function getSlot(req, res) {
//   try {
//     const { courtId } = req.params;
//     const { date } = req.query; // Allow passing date as query param

//     if (!courtId) return res.status(400).json({ error: 'courtId is required' });

//     const court = await Court.findById(courtId);
//     if (!court) return res.status(404).json({ error: 'Court not found' });

//  let formattedDate = "";

// if (date.includes("/")) {
//   // Frontend sent DD/MM/YYYY
//   const [dd, mm, yyyy] = date.split("/");
//   formattedDate = `${dd}-${mm}-${yyyy}`;
// } else if (date.includes("-")) {
//   // Already in DD-MM-YYYY
//   formattedDate = date;
// } else {
//   return res.status(400).json({ error: "Invalid date format" });
// }

//     const timeStrToMinutes = (timeStr) => {
//       let [time, ampm] = timeStr.split(" ");
//       let [h, m] = time.split(":").map(Number);
//       if (ampm === "PM" && h < 12) h += 12;
//       if (ampm === "AM" && h === 12) h = 0;
//       return h * 60 + m;
//     };

//     const normalizeTimeStr = (timeStr) => {
//       return timeStr ? timeStr.replace(/\s+/g, ' ').trim() : '';
//     };

//     const formatTo12Hour = (hour24, minute) => {
//       const ampm = hour24 >= 12 ? 'PM' : 'AM';
//       const hour12 = hour24 % 12 || 12;
//       return `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${ampm}`;
//     };

//     const generateSlots = (startTime, endTime, length) => {
//       const slots = [];
//       const parseTime = (timeStr) => {
//         const [time, ampm] = timeStr.split(" ");
//         const [h, m] = time.split(":").map(Number);
//         return [h, m, ampm];
//       };

//       const [startH, startM, startAMPM] = parseTime(startTime);
//       const [endH, endM, endAMPM] = parseTime(endTime);

//       // Convert minutes to hours and minutes
//       const lengthInMinutes = parseInt(length);
//       const slotH = Math.floor(lengthInMinutes / 60);
//       const slotM = lengthInMinutes % 60;

//       let currentH = startH + (startAMPM === "PM" && startH < 12 ? 12 : 0);
//       let currentM = startM;
//       let endHour = endH + (endAMPM === "PM" && endH < 12 ? 12 : 0);

//       while (currentH < endHour || (currentH === endHour && currentM < endM)) {
//         let slotEndH = currentH + slotH;
//         let slotEndM = currentM + slotM;
//         if (slotEndM >= 60) {
//           slotEndH += Math.floor(slotEndM / 60);
//           slotEndM = slotEndM % 60;
//         }

//         const slotStart = formatTo12Hour(currentH, currentM);
//         const slotEnd = formatTo12Hour(slotEndH, slotEndM);

//         slots.push({
//           time: `${slotStart} - ${slotEnd}`,
//           price: court.price || 2000,
//           status: "available"
//         });

//         currentH = slotEndH;
//         currentM = slotEndM;
//       }

//       return slots;
//     };

//     const dynamicSlots = generateSlots(court.startTime, court.endTime, court.length);

//     // ✅ FETCH ALL CONFIRMED BOOKINGS FOR THIS COURT & DATE
//     const bookings = await CourtBooking.find({
//       'slots.courtId': courtId,
//       'slots.date': formattedDate,
//       status: { $in: ['Paid', 'reserved'] } // Only confirmed bookings
//     });

//     const slotMap = new Map();
//     dynamicSlots.forEach(s => slotMap.set(normalizeTimeStr(s.time), s));

//     // ✅ MARK BOOKED SLOTS
//     bookings.forEach(booking => {
//       booking.slots.forEach(bookedSlot => {
//         if (bookedSlot.courtId.toString() === courtId && bookedSlot.date === formattedDate) {
//           const normalizedTime = normalizeTimeStr(bookedSlot.timeRange);
//           if (slotMap.has(normalizedTime)) {
//             const slot = slotMap.get(normalizedTime);
//             slotMap.set(normalizedTime, { ...slot, status: "booked" });
//           }
//         }
//       });
//     });

//     // ✅ APPLY EDITED SLOTS (Price & Availability Changes)
//     const editedSlots = await Slot.find({
//       courtId: String(courtId),
//       date: formattedDate
//     });

//     editedSlots.forEach(editedSlot => {
//       const normalizedEditedTime = normalizeTimeStr(editedSlot.timeRange);

//       if (slotMap.has(normalizedEditedTime)) {
//         const existingSlot = slotMap.get(normalizedEditedTime);

//         slotMap.set(normalizedEditedTime, {
//           ...existingSlot,
//           price: Number(editedSlot.price) || existingSlot.price,
//           status: editedSlot.status === "available"
//             ? existingSlot.status // Keep booked/available status
//             : "inactive" // Admin disabled this slot
//         });
//       }
//     });

//     const finalSlots = Array.from(slotMap.values());

//     res.status(200).json({
//       message: "Slots fetched successfully",
//       date: formattedDate,
//       courtId,
//       slots: finalSlots
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// }

// export async function getSlot(req, res) {
//   try {
//     const { courtId } = req.params;
//     const { date } = req.query;

//     if (!courtId) return res.status(400).json({ error: "courtId is required" });

//     const court = await Court.findById(courtId);
//     if (!court) return res.status(404).json({ error: "Court not found" });

//     // ---------- DATE NORMALIZATION ----------
//     let formattedDate = "";
//     if (date.includes("/")) {
//       const [dd, mm, yyyy] = date.split("/");
//       formattedDate = `${dd}-${mm}-${yyyy}`;
//     } else if (date.includes("-")) {
//       formattedDate = date;
//     } else {
//       return res.status(400).json({ error: "Invalid date format" });
//     }

//     // Convert DD-MM-YYYY → Date object
//     const toDateObj = (d) => {
//       const [dd, mm, yyyy] = d.split("-");
//       return new Date(`${yyyy}-${mm}-${dd}`);
//     };

//     const selectedDateObj = toDateObj(formattedDate);

//     // ---------- TIME HELPERS ----------
//     const normalizeTimeStr = (str) =>
//       str ? str.replace(/\s+/g, " ").trim() : "";

//     const formatTo12Hour = (h, m) => {
//       const ampm = h >= 12 ? "PM" : "AM";
//       const hour12 = h % 12 || 12;
//       return `${String(hour12).padStart(2, "0")}:${String(m).padStart(
//         2,
//         "0"
//       )} ${ampm}`;
//     };

//     const generateSlots = (startTime, endTime, length) => {
//       const slots = [];
//       const parse = (t) => {
//         const [time, ampm] = t.split(" ");
//         let [h, m] = time.split(":").map(Number);
//         if (ampm === "PM" && h < 12) h += 12;
//         if (ampm === "AM" && h === 12) h = 0;
//         return [h, m];
//       };

//       let [sh, sm] = parse(startTime);
//       let [eh, em] = parse(endTime);

//       const len = parseInt(length);
//       const lh = Math.floor(len / 60);
//       const lm = len % 60;

//       while (sh < eh || (sh === eh && sm < em)) {
//         let eh2 = sh + lh;
//         let em2 = sm + lm;
//         if (em2 >= 60) {
//           eh2 += Math.floor(em2 / 60);
//           em2 %= 60;
//         }

//         slots.push({
//           time: `${formatTo12Hour(sh, sm)} - ${formatTo12Hour(eh2, em2)}`,
//           price: court.price || 2000,
//           status: "available",
//         });

//         sh = eh2;
//         sm = em2;
//       }
//       return slots;
//     };

//     const dynamicSlots = generateSlots(
//       court.startTime,
//       court.endTime,
//       court.length
//     );

//     const slotMap = new Map();
//     dynamicSlots.forEach((s) =>
//       slotMap.set(normalizeTimeStr(s.time), s)
//     );

//     // ---------- BOOKINGS ----------
//     const bookings = await CourtBooking.find({
//       "slots.courtId": courtId,
//       "slots.date": formattedDate,
//       status: { $in: ["Paid", "reserved"] },
//     });

//     bookings.forEach((booking) => {
//       booking.slots.forEach((bs) => {
//         if (bs.courtId.toString() === courtId && bs.date === formattedDate) {
//           const key = normalizeTimeStr(bs.timeRange);
//           if (slotMap.has(key)) {
//             slotMap.set(key, { ...slotMap.get(key), status: "booked" });
//           }
//         }
//       });
//     });

//     // ---------- APPLY PRICING (DATE + RANGE) ----------
//     const pricingSlots = await Slot.find({
//       courtId: String(courtId),
//       $or: [
//         { date: formattedDate }, // old logic
//         {
//           FromDate: { $lte: formattedDate },
//           ToDate: { $gte: formattedDate },
//         },
//       ],
//     });

//     pricingSlots.forEach((ps) => {
//       const slotKey = normalizeTimeStr(ps.timeRange);

//       if (slotMap.has(slotKey)) {
//         const existing = slotMap.get(slotKey);
//         slotMap.set(slotKey, {
//           ...existing,
//           price: Number(ps.price) || existing.price,
//           status:
//             ps.status === "inactive"
//               ? "inactive"
//               : existing.status,
//         });
//       }
//     });

//     res.status(200).json({
//       message: "Slots fetched successfully",
//       date: formattedDate,
//       courtId,
//       slots: Array.from(slotMap.values()),
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// }

// export async function getSlot(req, res) {
//   try {
//     const { courtId } = req.params;
//     const { date } = req.query;

//     if (!courtId) {
//       return res.status(400).json({ error: "courtId is required" });
//     }
//     if (!date) {
//       return res.status(400).json({ error: "date is required" });
//     }

//     const court = await Court.findById(courtId);
//     if (!court) {
//       return res.status(404).json({ error: "Court not found" });
//     }

//     /* -------------------------------------------------------
//        DATE NORMALIZATION (Frontend sends DD-MM-YYYY)
//     ------------------------------------------------------- */
//     let formattedDate = "";

//     if (date.includes("/")) {
//       const [dd, mm, yyyy] = date.split("/");
//       formattedDate = `${dd}-${mm}-${yyyy}`;
//     } else if (date.includes("-")) {
//       formattedDate = date;
//     } else {
//       return res.status(400).json({ error: "Invalid date format" });
//     }

//     const toDateObj = (d) => {
//       const [dd, mm, yyyy] = d.split("-");
//       return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
//     };

//     const selectedDateObj = toDateObj(formattedDate);

//     /* -------------------------------------------------------
//        TIME HELPERS
//     ------------------------------------------------------- */
//     const normalizeTimeStr = (str) =>
//       str.replace(/\s+/g, " ").trim();

//     const formatTo12Hour = (h, m) => {
//       const ampm = h >= 12 ? "PM" : "AM";
//       const hour12 = h % 12 || 12;
//       return `${String(hour12).padStart(2, "0")}:${String(m).padStart(
//         2,
//         "0"
//       )} ${ampm}`;
//     };

//     const parseTime = (t) => {
//       const [time, ampm] = t.split(" ");
//       let [h, m] = time.split(":").map(Number);
//       if (ampm === "PM" && h < 12) h += 12;
//       if (ampm === "AM" && h === 12) h = 0;
//       return [h, m];
//     };

//     /* -------------------------------------------------------
//        SLOT GENERATION (Single source of truth)
//     ------------------------------------------------------- */
//     const generateSlots = (startTime, endTime, length) => {
//       const slots = [];

//       let [sh, sm] = parseTime(startTime);
//       const [eh, em] = parseTime(endTime);

//       const totalMinutes = Number(length);
//       const stepH = Math.floor(totalMinutes / 60);
//       const stepM = totalMinutes % 60;

//       while (sh < eh || (sh === eh && sm < em)) {
//         let endH = sh + stepH;
//         let endM = sm + stepM;

//         if (endM >= 60) {
//           endH += Math.floor(endM / 60);
//           endM %= 60;
//         }

//         const slotTime = `${formatTo12Hour(sh, sm)} - ${formatTo12Hour(
//           endH,
//           endM
//         )}`;

//         slots.push({
//           time: slotTime,
//           price: Number(court.price) || 2000,
//           status: "available",
//         });

//         sh = endH;
//         sm = endM;
//       }

//       return slots;
//     };

//     const baseSlots = generateSlots(
//       court.startTime,
//       court.endTime,
//       court.length
//     );

//     /* -------------------------------------------------------
//        SLOT MAP (Canonical)
//     ------------------------------------------------------- */
//     const slotMap = new Map();
//     baseSlots.forEach((s) =>
//       slotMap.set(normalizeTimeStr(s.time), s)
//     );

//     /* -------------------------------------------------------
//        BOOKINGS (Hard override)
//     ------------------------------------------------------- */
//     const bookings = await CourtBooking.find({
//       "slots.courtId": courtId,
//       "slots.date": formattedDate,
//       status: { $in: ["Paid", "reserved"] },
//     });

//     bookings.forEach((booking) => {
//       booking.slots.forEach((bs) => {
//         if (
//           bs.courtId.toString() === courtId &&
//           bs.date === formattedDate
//         ) {
//           const key = normalizeTimeStr(bs.timeRange);
//           if (slotMap.has(key)) {
//             slotMap.set(key, {
//               ...slotMap.get(key),
//               status: "booked",
//             });
//           }
//         }
//       });
//     });

//     /* -------------------------------------------------------
//        PRICING (FromDate / ToDate — SAFE DATE LOGIC)
//     ------------------------------------------------------- */
//     const pricingSlots = await Slot.find({
//       courtId: String(courtId),
//       FromDateObj: { $lte: selectedDateObj },
//       ToDateObj: { $gte: selectedDateObj },
//     });

//     pricingSlots.forEach((ps) => {
//       const key = normalizeTimeStr(ps.timeRange);
//       if (!slotMap.has(key)) return;

//       const existing = slotMap.get(key);

//       // booking always wins
//       if (existing.status === "booked") return;

//       let finalStatus = existing.status;
//       if (ps.status === "inactive") finalStatus = "inactive";

//       slotMap.set(key, {
//         ...existing,
//         price: Number(ps.price) || existing.price,
//         status: finalStatus,
//       });
//     });

//     /* -------------------------------------------------------
//        RESPONSE
//     ------------------------------------------------------- */
//     return res.status(200).json({
//       message: "Slots fetched successfully",
//       date: formattedDate,
//       courtId,
//       slots: Array.from(slotMap.values()),
//     });
//   } catch (err) {
//     console.error("getSlot error:", err);
//     return res.status(500).json({ error: err.message });
//   }
// }

export async function getSlot(req, res) {
  try {
    const { courtId } = req.params;
    const { date } = req.query;

    if (!courtId) {
      return res.status(400).json({ error: "courtId is required" });
    }
    if (!date) {
      return res.status(400).json({ error: "date is required" });
    }

    const court = await Court.findById(courtId);
    if (!court) {
      return res.status(404).json({ error: "Court not found" });
    }

    /* -------------------------------------------------------
       DATE NORMALIZATION (expects DD-MM-YYYY)
    ------------------------------------------------------- */
    let formattedDate = "";

    if (date.includes("/")) {
      const [dd, mm, yyyy] = date.split("/");
      formattedDate = `${dd}-${mm}-${yyyy}`;
    } else if (date.includes("-")) {
      formattedDate = date;
    } else {
      return res.status(400).json({ error: "Invalid date format" });
    }

    const toDateObj = (d) => {
      const [dd, mm, yyyy] = d.split("-");
      return new Date(yyyy, mm - 1, dd);
    };

    const selectedDateObj = toDateObj(formattedDate);

    /* -------------------------------------------------------
       TIME HELPERS
    ------------------------------------------------------- */
    const normalizeTimeStr = (str) => str.replace(/\s+/g, " ").trim();

    const formatTo12Hour = (h, m) => {
      const ampm = h >= 12 ? "PM" : "AM";
      const hour12 = h % 12 || 12;
      return `${String(hour12).padStart(2, "0")}:${String(m).padStart(
        2,
        "0"
      )} ${ampm}`;
    };

    const parseTime = (t) => {
      const [time, ampm] = t.split(" ");
      let [h, m] = time.split(":").map(Number);
      if (ampm === "PM" && h < 12) h += 12;
      if (ampm === "AM" && h === 12) h = 0;
      return [h, m];
    };

    /* -------------------------------------------------------
       SLOT GENERATION (BASE SLOTS FROM COURT)
    ------------------------------------------------------- */
    const generateSlots = (startTime, endTime, length) => {
      const slots = [];

      let [sh, sm] = parseTime(startTime);
      const [eh, em] = parseTime(endTime);

      const totalMinutes = Number(length);
      const stepH = Math.floor(totalMinutes / 60);
      const stepM = totalMinutes % 60;

      while (sh < eh || (sh === eh && sm < em)) {
        let endH = sh + stepH;
        let endM = sm + stepM;

        if (endM >= 60) {
          endH += Math.floor(endM / 60);
          endM %= 60;
        }

        const slotTime = `${formatTo12Hour(sh, sm)} - ${formatTo12Hour(
          endH,
          endM
        )}`;

        slots.push({
          time: slotTime,
          price: Number(court.price) || 2000,
          status: "available",
        });

        sh = endH;
        sm = endM;
      }

      return slots;
    };

    const baseSlots = generateSlots(
      court.startTime,
      court.endTime,
      court.length
    );

    /* -------------------------------------------------------
       SLOT MAP (CANONICAL)
    ------------------------------------------------------- */
    const slotMap = new Map();
    baseSlots.forEach((s) => {
      slotMap.set(normalizeTimeStr(s.time), s);
    });

    /* -------------------------------------------------------
       BOOKINGS (BOOKED ALWAYS WINS)
    ------------------------------------------------------- */
    const bookings = await CourtBooking.find({
      "slots.courtId": courtId,
      "slots.date": formattedDate,
      status: { $in: ["Paid", "reserved"] },
    });

    bookings.forEach((booking) => {
      booking.slots.forEach((bs) => {
        if (bs.courtId.toString() === courtId && bs.date === formattedDate) {
          const key = normalizeTimeStr(bs.timeRange);
          if (slotMap.has(key)) {
            slotMap.set(key, {
              ...slotMap.get(key),
              status: "booked",
            });
          }
        }
      });
    });

    /* -------------------------------------------------------
       PRICING + INACTIVE (FIXED — STRING DATE SAFE)
    ------------------------------------------------------- */
    let pricingSlots = await Slot.find({
      courtId: String(courtId),
    }).lean();

    pricingSlots = pricingSlots.filter((ps) => {
      if (!ps.FromDate || !ps.ToDate) return false;

      const from = toDateObj(ps.FromDate);
      const to = toDateObj(ps.ToDate);

      return from <= selectedDateObj && selectedDateObj <= to;
    });

    pricingSlots.forEach((ps) => {
      const key = normalizeTimeStr(ps.timeRange);
      if (!slotMap.has(key)) return;

      const existing = slotMap.get(key);

      // booked always wins
      if (existing.status === "booked") return;

      let finalStatus = existing.status;
      if (ps.status === "inactive") finalStatus = "inactive";

      slotMap.set(key, {
        ...existing,
        price: Number(ps.price) || existing.price,
        status: finalStatus,
      });
    });

    /* -------------------------------------------------------
       RESPONSE
    ------------------------------------------------------- */
    return res.status(200).json({
      message: "Slots fetched successfully",
      date: formattedDate,
      courtId,
      slots: Array.from(slotMap.values()),
    });
  } catch (err) {
    console.error("getSlot error:", err);
    return res.status(500).json({ error: err.message });
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
    console.log(amount);
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
    res
      .status(500)
      .json({ message: "Failed to create order", error: err.message });
  }
}

// export async function verifyOrder(req, res) {
//   const session = await mongoose.startSession();
//   session.startTransaction();

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
//             status: 'booked',
//           });
//         });
//       });
//     });

//     // ✅ CHECK IF ANY SLOT IS ALREADY BOOKED (Race Condition Prevention)
//     const conflictingBookings = await CourtBooking.find({
//       'slots.courtId': { $in: slots.map(s => s.courtId) },
//       'slots.date': { $in: slots.map(s => s.date) },
//       'slots.timeRange': { $in: slots.map(s => s.timeRange) },
//       status: { $in: ['Paid', 'reserved'] }
//     }).session(session);

//     // Check for exact slot conflicts
//     for (const booking of conflictingBookings) {
//       for (const bookedSlot of booking.slots) {
//         const conflict = slots.find(
//           s => s.courtId.toString() === bookedSlot.courtId.toString() &&
//             s.date === bookedSlot.date &&
//             s.timeRange === bookedSlot.timeRange
//         );

//         if (conflict) {
//           await session.abortTransaction();
//           session.endSession();

//           return res.status(409).json({
//             success: false,
//             message: `Slot ${conflict.timeRange} on ${conflict.date} is already booked. Please refresh and select another slot.`,
//             conflictingSlot: conflict
//           });
//         }
//       }
//     }

//     // ✅ CREATE BOOKING IF NO CONFLICTS
//     const booking = new CourtBooking({
//       name: formData.name,
//       phone: formData.phone,
//       email: formData.email,
//       slots,
//       totalAmount: totalPrice,
//       paymentId: razorpay_payment_id,
//       status: 'Paid'
//     });

//     await booking.save({ session });

//     // Commit transaction
//     await session.commitTransaction();
//     session.endSession();

//     res.json({ success: true, booking });
//   } catch (err) {
//     await session.abortTransaction();
//     session.endSession();

//     console.error(err);
//     res.status(500).json({
//       success: false,
//       message: "Payment verification failed",
//       error: err.message,
//     });
//   }
// }

// export async function verifyOrder(req, res) {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { paymentResponse, orderData } = req.body;
//     const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
//       paymentResponse;

//     const { totalPrice, courts, formData } = orderData;

//     // 🔐 STEP 1: VERIFY RAZORPAY SIGNATURE (MANDATORY)
//     const body = `${razorpay_order_id}|${razorpay_payment_id}`;
//     const expectedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_SECRET)
//       .update(body)
//       .digest("hex");

//     if (expectedSignature !== razorpay_signature) {
//       throw new Error("Invalid Razorpay signature");
//     }

//     // 🔁 STEP 2: IDEMPOTENCY CHECK (payment already used?)
//     const existing = await CourtBooking.findOne(
//       { paymentId: razorpay_payment_id },
//       null,
//       { session }
//     );

//     if (existing) {
//       await session.commitTransaction();
//       session.endSession();
//       return res.json({ success: true, booking: existing });
//     }

//     // 🧱 STEP 3: BUILD SLOT LIST
//     const slots = [];
//     courts.forEach((court) => {
//       court.dates.forEach((dateObj) => {
//         dateObj.slots.forEach((slot) => {
//           slots.push({
//             courtId: court.courtId,
//             date: dateObj.date,
//             timeRange: slot.time || slot.timeRange,
//             price: slot.price,
//             status: "booked",
//           });
//         });
//       });
//     });

//     // 🛑 STEP 4: HARD CONFLICT CHECK INSIDE TRANSACTION
//     const conflicts = await CourtBooking.find({
//       "slots.courtId": { $in: slots.map((s) => s.courtId) },
//       "slots.date": { $in: slots.map((s) => s.date) },
//       "slots.timeRange": { $in: slots.map((s) => s.timeRange) },
//       status: { $in: ["Paid", "reserved"] },
//     }).session(session);

//     if (conflicts.length > 0) {
//       throw new Error("Slot already booked");
//     }

//     // ✅ STEP 5: CREATE BOOKING (ATOMIC)
//     const booking = new CourtBooking({
//       name: formData.name,
//       phone: formData.phone,
//       email: formData.email,
//       slots,
//       totalAmount: totalPrice,
//       paymentId: razorpay_payment_id,
//       status: "Paid",
//     });

//     await booking.save({ session });



    
//     // 💾 COMMIT
//     await session.commitTransaction();
//     session.endSession();

//     return res.json({ success: true, booking });
//   } catch (err) {
//     await session.abortTransaction();
//     session.endSession();

//     console.error("verifyOrder error:", err);
//     return res.status(500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// }



// export async function verifyOrder(req, res) {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { paymentResponse, orderData } = req.body;
//     const {
//       razorpay_payment_id,
//       razorpay_order_id,
//       razorpay_signature,
//     } = paymentResponse;

//     const { totalPrice, courts, formData } = orderData;

//     /* -------------------------------------------------------
//        1️⃣ VERIFY RAZORPAY SIGNATURE (SECURITY)
//     ------------------------------------------------------- */
//     const body = `${razorpay_order_id}|${razorpay_payment_id}`;
//     const expectedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_SECRET)
//       .update(body)
//       .digest("hex");

//     if (expectedSignature !== razorpay_signature) {
//       throw new Error("Invalid Razorpay signature");
//     }

//     /* -------------------------------------------------------
//        2️⃣ IDEMPOTENCY CHECK (PREVENT DUPLICATES)
//     ------------------------------------------------------- */
//     const existingBooking = await CourtBooking.findOne(
//       { paymentId: razorpay_payment_id },
//       null,
//       { session }
//     );

//     if (existingBooking) {
//       await session.commitTransaction();
//       session.endSession();
//       return res.json({ success: true, booking: existingBooking });
//     }

//     /* -------------------------------------------------------
//        3️⃣ BUILD SLOT LIST (CANONICAL)
//     ------------------------------------------------------- */
//     const slots = [];
//     courts.forEach((court) => {
//       court.dates.forEach((dateObj) => {
//         dateObj.slots.forEach((slot) => {
//           slots.push({
//             courtId: court.courtId,
//             date: dateObj.date,
//             timeRange: slot.time || slot.timeRange,
//             price: slot.price,
//             status: "booked",
//           });
//         });
//       });
//     });

//     /* -------------------------------------------------------
//        4️⃣ HARD CONFLICT CHECK (RACE CONDITION SAFE)
//     ------------------------------------------------------- */
//     const conflicts = await CourtBooking.find({
//       "slots.courtId": { $in: slots.map((s) => s.courtId) },
//       "slots.date": { $in: slots.map((s) => s.date) },
//       "slots.timeRange": { $in: slots.map((s) => s.timeRange) },
//       status: { $in: ["Paid", "reserved"] },
//     }).session(session);

//     if (conflicts.length > 0) {
//       throw new Error("Slot already booked by another user");
//     }

//     /* -------------------------------------------------------
//        5️⃣ CREATE BOOKING (ATOMIC)
//     ------------------------------------------------------- */
//     const booking = new CourtBooking({
//       name: formData.name,
//       phone: formData.phone,
//       email: formData.email,
//       slots,
//       totalAmount: totalPrice,
//       paymentId: razorpay_payment_id,
//       status: "Paid",
//     });

//     await booking.save({ session });

//     /* -------------------------------------------------------
//        6️⃣ COMMIT TRANSACTION (DATA IS FINAL)
//     ------------------------------------------------------- */
//     await session.commitTransaction();
//     session.endSession();

//     /* -------------------------------------------------------
//        7️⃣ SEND CONFIRMATION EMAIL (POST-COMMIT)
//     ------------------------------------------------------- */
//     try {
//       const transporter = nodemailer.createTransport({
//         service: "gmail",
//         auth: {
//           user: process.env.GMAIL_USER_MAIL,
//           pass: process.env.GMAIL_APP_PASSWORD,
//         },
//       });

//       const slotHtml = slots
//         .map(
//           (s) =>
//             `<li>
//               <b>Court:</b> ${s.courtId}<br/>
//               <b>Date:</b> ${s.date}<br/>
//               <b>Time:</b> ${s.timeRange}
//             </li>`
//         )
//         .join("");

//       await transporter.sendMail({
//         from: `Courtline <${process.env.GMAIL_USER}>`,
//         to: formData.email,
//         subject: "🎾 Court Booking Confirmed",
//         html: `
//           <h2>Hi ${formData.name},</h2>
//           <p>Your court booking is <b>confirmed</b> ✅</p>
//           <ul>${slotHtml}</ul>
//           <p><b>Total Paid:</b> ₹${totalPrice}</p>
//           <p>See you on the court! 🏸</p>
//           <p><b>Team Courtline</b></p>
//         `,
//       });
//       console.log("Email send.............")
//     } catch (mailErr) {
//       console.error("Email failed (booking safe):", mailErr.message);
//     }

//     /* -------------------------------------------------------
//        8️⃣ FINAL RESPONSE
//     ------------------------------------------------------- */
//     return res.json({ success: true, booking });
//   } catch (err) {
//     await session.abortTransaction();
//     session.endSession();

//     console.error("verifyOrder error:", err.message);
//     return res.status(500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// }

// import crypto from "crypto";
// import mongoose from "mongoose";
// import nodemailer from "nodemailer";
// import CourtBooking from "../models/CourtBooking.js";

/* -----------------------------------------
   COURT ID → COURT NAME MAP (EMAIL ONLY)
----------------------------------------- */
const COURT_NAME_MAP = {
  "6949260ff11e456cff9bb735": "Court 1",
  "69492643f11e456cff9bb76f": "Court 2",
};

// export async function verifyOrder(req, res) {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { paymentResponse, orderData } = req.body;
//     const {
//       razorpay_payment_id,
//       razorpay_order_id,
//       razorpay_signature,
//     } = paymentResponse;

//     const { totalPrice, courts, formData } = orderData;

//     /* 1️⃣ VERIFY SIGNATURE */
//     const body = `${razorpay_order_id}|${razorpay_payment_id}`;
//     const expectedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_SECRET)
//       .update(body)
//       .digest("hex");

//     if (expectedSignature !== razorpay_signature) {
//       throw new Error("Invalid Razorpay signature");
//     }

//     /* 2️⃣ IDEMPOTENCY */
//     const existingBooking = await CourtBooking.findOne(
//       { paymentId: razorpay_payment_id },
//       null,
//       { session }
//     );

//     if (existingBooking) {
//       await session.commitTransaction();
//       session.endSession();
//       return res.json({ success: true, booking: existingBooking });
//     }

//     /* 3️⃣ BUILD SLOTS */
//     const slots = [];
//     courts.forEach((court) => {
//       court.dates.forEach((dateObj) => {
//         dateObj.slots.forEach((slot) => {
//           slots.push({
//             courtId: court.courtId,
//             date: dateObj.date,
//             timeRange: slot.time || slot.timeRange,
//             price: slot.price,
//             status: "booked",
//           });
//         });
//       });
//     });

//     /* 4️⃣ CONFLICT CHECK */
//     const conflicts = await CourtBooking.find({
//       "slots.courtId": { $in: slots.map((s) => s.courtId) },
//       "slots.date": { $in: slots.map((s) => s.date) },
//       "slots.timeRange": { $in: slots.map((s) => s.timeRange) },
//       status: { $in: ["Paid", "reserved"] },
//     }).session(session);

//     if (conflicts.length > 0) {
//       throw new Error("Slot already booked by another user");
//     }

//     /* 5️⃣ CREATE BOOKING */
//     const booking = new CourtBooking({
//       name: formData.name,
//       phone: formData.phone,
//       email: formData.email,
//       slots,
//       totalAmount: totalPrice,
//       paymentId: razorpay_payment_id,
//       status: "Paid",
//     });

//     await booking.save({ session });

//     /* 6️⃣ COMMIT */
//     await session.commitTransaction();
//     session.endSession();

//     /* 7️⃣ EMAIL */
//     try {
//       const transporter = nodemailer.createTransport({
//         service: "gmail",
//         auth: {
//           user: process.env.GMAIL_USER_MAIL,
//           pass: process.env.GMAIL_APP_PASSWORD,
//         },
//       });

//       const slotHtml = slots
//         .map((s) => {
//           const courtName =
//             COURT_NAME_MAP[s.courtId.toString()] || "Unknown Court";

//           return `
//             <li>
//               <b>Court:</b> ${courtName}<br/>
//               <b>Date:</b> ${s.date}<br/>
//               <b>Time:</b> ${s.timeRange}
//             </li>
//           `;
//         })
//         .join("");

//       await transporter.sendMail({
//         from: `Courtline <${process.env.GMAIL_USER_MAIL}>`,
//         to: formData.email,
//         subject: "🎾 Court Booking Confirmed",
//         html: `
//           <h2>Hi ${formData.name},</h2>
//           <p>Your court booking is <b>confirmed</b> ✅</p>
//           <ul>${slotHtml}</ul>
//           <p><b>Total Paid:</b> ₹${totalPrice}</p>
//           <p>See you on the court! 🏸</p>
//           <p><b>Team Courtline</b></p>
//         `,
//       });
//     } catch (err) {
//       console.error("Email failed (booking safe):", err.message);
//     }

//     return res.json({ success: true, booking });
//   } catch (err) {
//     await session.abortTransaction();
//     session.endSession();

//     return res.status(500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// }

export async function verifyOrder(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { paymentResponse, orderData } = req.body;
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = paymentResponse;

    const { totalPrice, courts, formData } = orderData;

    /* ----------------------------------
       1️⃣ VERIFY RAZORPAY SIGNATURE
    ---------------------------------- */
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      throw new Error("Invalid Razorpay signature");
    }

    /* ----------------------------------
       2️⃣ BUILD SLOT LIST (CANONICAL)
    ---------------------------------- */
    const slots = [];
    courts.forEach((court) => {
      court.dates.forEach((dateObj) => {
        dateObj.slots.forEach((slot) => {
          slots.push({
            courtId: court.courtId,
            date: dateObj.date,
            timeRange: slot.time || slot.timeRange,
            price: slot.price,
            status: "booked",
          });
        });
      });
    });

    /* ----------------------------------
       3️⃣ IDEMPOTENT UPSERT (NO DATA LOSS)
    ---------------------------------- */
    const booking = await CourtBooking.findOneAndUpdate(
      { paymentId: razorpay_payment_id },
      {
        $setOnInsert: {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          slots,
          totalAmount: totalPrice,
          paymentId: razorpay_payment_id,
          status: "Paid",
        },
      },
      {
        upsert: true,
        new: true,
        session,
      }
    );

    /* ----------------------------------
       4️⃣ HARD CONFLICT CHECK
    ---------------------------------- */
    const conflicts = await CourtBooking.find({
      _id: { $ne: booking._id },
      "slots.courtId": { $in: slots.map((s) => s.courtId) },
      "slots.date": { $in: slots.map((s) => s.date) },
      "slots.timeRange": { $in: slots.map((s) => s.timeRange) },
      status: { $in: ["Paid", "reserved"] },
    }).session(session);

    if (conflicts.length > 0) {
      throw new Error("Slot already booked by another user");
    }

    /* ----------------------------------
       5️⃣ COMMIT TRANSACTION
    ---------------------------------- */
    await session.commitTransaction();
    session.endSession();

    /* ----------------------------------
       6️⃣ SEND EMAIL (ASYNC — NEVER BLOCK)
    ---------------------------------- */
    (async () => {
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.GMAIL_USER_MAIL,
            pass: process.env.GMAIL_APP_PASSWORD,
          },
        });

        const slotHtml = slots
          .map((s) => {
            const courtName =
              COURT_NAME_MAP[s.courtId.toString()] || "Court";
            return `<li><b>${courtName}</b> | ${s.date} | ${s.timeRange}</li>`;
          })
          .join("");

        await transporter.sendMail({
          from: `Courtline <${process.env.GMAIL_USER_MAIL}>`,
          to: formData.email,
          subject: "🎾 Court Booking Confirmed",
          html: `
            <h2>Hi ${formData.name},</h2>
            <p>Your booking is <b>confirmed</b> ✅</p>
            <ul>${slotHtml}</ul>
            <p><b>Total Paid:</b> ₹${totalPrice}</p>
            <p>See you soon! 🏸</p>
          `,
        });
      } catch (err) {
        console.error("Email failed (booking safe):", err.message);
      }
    })();

    /* ----------------------------------
       7️⃣ FINAL RESPONSE
    ---------------------------------- */
    return res.json({ success: true, booking });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.error("verifyOrder error:", err.message);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}


export async function newsletterSignup(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      "https://developers.google.com/oauthplayground"
    );

    oAuth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    const accessToken = await oAuth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.GMAIL_USER,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
        accessToken: accessToken.token,
      },
    });

    const whatsappInviteLink = process.env.WHATSAPP_INVITE_LINK;

    const mailOptions = {
      from: `Courtline <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Welcome to Courtline Community! 🎾",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #76B73A;">Welcome to Courtline! 🎾</h2>
          <p>Thank you for joining our community!</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${whatsappInviteLink}" 
               style="background-color: #25D366; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 25px; font-weight: bold;">
              Join WhatsApp Group
            </a>
          </div>
          <p>See you on the court!</p>
          <p><strong>Team Courtline</strong></p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "Welcome email sent successfully!" });
  } catch (error) {
    console.error("Newsletter signup error:", error.response?.data || error);

    res.status(500).json({ success: false, message: "Failed to send email" });
  }
}

export async function checkAvailability(req, res) {
  const { courts } = req.body;

  const slots = [];
  courts.forEach((court) => {
    court.dates.forEach((dateObj) => {
      dateObj.slots.forEach((slot) => {
        slots.push({
          courtId: court.courtId,
          date: dateObj.date,
          timeRange: slot.time || slot.timeRange,
        });
      });
    });
  });

  // Check existing bookings
  const booked = await CourtBooking.find({
    "slots.courtId": { $in: slots.map((s) => s.courtId) },
    "slots.date": { $in: slots.map((s) => s.date) },
    "slots.timeRange": { $in: slots.map((s) => s.timeRange) },
    status: { $in: ["Paid", "reserved"] },
  });

  if (booked.length > 0) {
    return res.json({ available: false });
  }

  return res.json({ available: true });
}
