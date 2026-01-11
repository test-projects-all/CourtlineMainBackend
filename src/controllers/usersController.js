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
    const courtName = COURT_NAME_MAP[courtId.toString()] || "Unknown Court";

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
///Old code -----------------------------
// export async function initiateBooking(req, res) {
//   try {
//     const { courts, totalPrice, formData } = req.body;

//     if (!courts || !totalPrice || !formData) {
//       return res.status(400).json({ success: false });
//     }

//     const slots = [];
//     courts.forEach((court) => {
//       court.dates.forEach((dateObj) => {
//         dateObj.slots.forEach((slot) => {
//           slots.push({
//             courtId: court.courtId,
//             date: dateObj.date,
//             timeRange: slot.time || slot.timeRange,
//             price: slot.price,
//             status: "pending",
//           });
//         });
//       });
//     });

//     const booking = await CourtBooking.create({
//       name: formData.name,
//       phone: formData.phone,
//       email: formData.email,
//       slots,
//       totalAmount: totalPrice,
//       status: "initiated",
//     });

//     return res.json({
//       success: true,
//       bookingId: booking._id,
//     });
//   } catch (err) {
//     console.error("initiateBooking error:", err.message);
//     return res.status(500).json({ success: false });
//   }
// }

export async function initiateBooking(req, res) {
  try {
    const { courts, totalPrice, formData } = req.body;

    if (!courts || !totalPrice || !formData) {
      return res.status(400).json({ success: false });
    }

    /* ---------------------------------------
       BUILD SLOTS (ENUM SAFE)
    --------------------------------------- */
    const slots = [];
    courts.forEach((court) => {
      court.dates.forEach((dateObj) => {
        dateObj.slots.forEach((slot) => {
          slots.push({
            courtId: court.courtId,
            date: dateObj.date,
            timeRange: slot.time || slot.timeRange,
            price: slot.price,
            status: "available", // ✅ VALID ENUM
          });
        });
      });
    });

    /* ---------------------------------------
       TEMP PAYMENT ID (REQUIRED BY SCHEMA)
    --------------------------------------- */
    const tempPaymentId = `INIT_${Date.now()}`;

    const booking = await CourtBooking.create({
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      slots,
      totalAmount: totalPrice,
      paymentId: tempPaymentId, // ✅ REQUIRED FIELD
      status: "initiated",
    });

    return res.json({
      success: true,
      bookingId: booking._id,
    });
  } catch (err) {
    console.error("initiateBooking error:", err.message);
    return res.status(500).json({ success: false });
  }
}
/* ---------------------------------------
   2️⃣ CREATE RAZORPAY ORDER
// --------------------------------------- */
// export async function createOrder(req, res) {
//   try {
//     const { amount } = req.body;

//     const order = await razorpay.orders.create({
//       amount,
//       currency: "INR",
//       receipt: `receipt_${Date.now()}`,
//     });

//     return res.json({
//       orderId: order.id,
//       key: process.env.RAZORPAY_KEY_ID,
//     });
//   } catch (err) {
//     console.error("createOrder error:", err.message);
//     return res.status(500).json({ success: false });
//   }
// }

export async function createOrder(req, res) {
  try {
    const { amount, bookingId } = req.body;

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: bookingId, // 🔑 CRITICAL LINK
    });

    // 🔥 SAVE ORDER ID IN BOOKING
    await CourtBooking.findByIdAndUpdate(bookingId, {
      razorpayOrderId: order.id,
    });

    return res.json({
      orderId: order.id,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("createOrder error:", err.message);
    return res.status(500).json({ success: false });
  }
}

/* ---------------------------------------
   3️⃣ VERIFY PAYMENT (SUCCESS / FAILED)
--------------------------------------- */



// export async function verifyOrder(req, res) {
//   try {
//     const { paymentResponse, orderData } = req.body;
//     const { bookingId, totalPrice, courts } = orderData;
//     const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
//       paymentResponse;

//     if (!bookingId) {
//       throw new Error("Booking ID missing");
//     }

//     /* ✅ IDEMPOTENCY GUARD (NOW CORRECT) */
//     const existing = await CourtBooking.findById(bookingId);
//     if (existing && existing.status === "Paid") {
//       return res.json({ success: true, booking: existing });
//     }

//     const session = await mongoose.startSession();
//     session.startTransaction();

//     /* BUILD SLOTS AGAIN (SAFE) */
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

//     /* VERIFY SIGNATURE */
//     const body = `${razorpay_order_id}|${razorpay_payment_id}`;
//     const expectedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_SECRET)
//       .update(body)
//       .digest("hex");

//     /* ❌ PAYMENT FAILED */
//     if (expectedSignature !== razorpay_signature) {
//       await CourtBooking.findByIdAndUpdate(
//         bookingId,
//         {
//           status: "Failed",
//           paymentId: razorpay_payment_id || razorpay_order_id,
//         },
//         { session }
//       );

//       await session.commitTransaction();
//       session.endSession();

//       return res.status(400).json({
//         success: false,
//         message: "Payment failed, booking saved",
//       });
//     }

//     /* 🛑 CONFLICT CHECK (PAID ONLY) */
//     const conflicts = await CourtBooking.find({
//       _id: { $ne: bookingId },
//       "slots.courtId": { $in: slots.map((s) => s.courtId) },
//       "slots.date": { $in: slots.map((s) => s.date) },
//       "slots.timeRange": { $in: slots.map((s) => s.timeRange) },
//       status: "Paid",
//     }).session(session);

//     if (conflicts.length > 0) {
//       await CourtBooking.findByIdAndUpdate(
//         bookingId,
//         { status: "Failed" },
//         { session }
//       );
//       throw new Error("Slot already booked");
//     }

//     /* ✅ PAYMENT SUCCESS */
//     const booking = await CourtBooking.findByIdAndUpdate(
//       bookingId,
//       {
//         status: "Paid",
//         paymentId: razorpay_payment_id,
//         slots,
//         totalAmount: totalPrice,
//       },
//       { new: true, session }
//     );

//     await session.commitTransaction();
//     session.endSession();

//     return res.json({ success: true, booking });
//   } catch (err) {
//     console.error("verifyOrder error:", err.message);
//     return res.status(500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// }


// export async function verifyOrder(req, res) {
//   let session;

//   try {
//     const { paymentResponse, orderData } = req.body;
//     const { bookingId, totalPrice, courts } = orderData || {};
//     const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
//       paymentResponse || {};

//     if (!bookingId) {
//       throw new Error("Booking ID missing");
//     }

//     /* ======================================================
//        1️⃣ IDEMPOTENCY GUARD (CRITICAL)
//        If webhook already marked Paid, exit immediately
//     ====================================================== */
//     const existing = await CourtBooking.findById(bookingId);
//     if (!existing) {
//       throw new Error("Booking not found");
//     }

//     if (existing.status === "Paid") {
//       return res.json({ success: true, booking: existing });
//     }

//     /* ======================================================
//        2️⃣ VERIFY SIGNATURE
//        (Frontend verification only — webhook is authority)
//     ====================================================== */
//     const body = `${razorpay_order_id}|${razorpay_payment_id}`;
//     const expectedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_SECRET)
//       .update(body)
//       .digest("hex");

//     if (expectedSignature !== razorpay_signature) {
//       await CourtBooking.findByIdAndUpdate(bookingId, {
//         status: "Failed",
//         paymentId: razorpay_payment_id || razorpay_order_id,
//       });

//       return res.status(400).json({
//         success: false,
//         message: "Payment failed, booking saved",
//       });
//     }

//     /* ======================================================
//        3️⃣ START TRANSACTION (SUCCESS PATH ONLY)
//     ====================================================== */
//     session = await mongoose.startSession();
//     session.startTransaction();

//     /* ======================================================
//        4️⃣ BUILD FINAL SLOTS (BOOKED)
//     ====================================================== */
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

//     /* ======================================================
//        5️⃣ CONFLICT CHECK (PAID BOOKINGS ONLY)
//     ====================================================== */
//     const conflicts = await CourtBooking.find({
//       _id: { $ne: bookingId },
//       "slots.courtId": { $in: slots.map((s) => s.courtId) },
//       "slots.date": { $in: slots.map((s) => s.date) },
//       "slots.timeRange": { $in: slots.map((s) => s.timeRange) },
//       status: "Paid",
//     }).session(session);

//     if (conflicts.length > 0) {
//       await CourtBooking.findByIdAndUpdate(
//         bookingId,
//         { status: "Failed" },
//         { session }
//       );
//       throw new Error("Slot already booked");
//     }

//     /* ======================================================
//        6️⃣ MARK BOOKING PAID (SAFE)
//     ====================================================== */
//     const booking = await CourtBooking.findByIdAndUpdate(
//       bookingId,
//       {
//         status: "Paid",
//         paymentId: razorpay_payment_id,
//         slots,
//         totalAmount: totalPrice,
//       },
//       { new: true, session }
//     );

//     await session.commitTransaction();
//     session.endSession();

//     return res.json({ success: true, booking });
//   } catch (err) {
//     if (session) {
//       await session.abortTransaction();
//       session.endSession();
//     }

//     console.error("verifyOrder error:", err.message);
//     return res.status(500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// }

export async function verifyOrder(req, res) {
  try {
    const { paymentResponse, orderData } = req.body;
    const { bookingId, totalPrice, courts } = orderData;
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = paymentResponse;

    if (!bookingId) throw new Error("Booking ID missing");

    // ✅ IDEMPOTENCY
    const existing = await CourtBooking.findById(bookingId);
    if (existing?.status === "Paid") {
      return res.json({ success: true, booking: existing });
    }

    // ✅ VERIFY SIGNATURE
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      await CourtBooking.findByIdAndUpdate(bookingId, {
        status: "Failed",
        paymentId: razorpay_payment_id || razorpay_order_id,
      });

      return res.status(400).json({ success: false });
    }

    // ✅ REBUILD SLOTS
    const slots = [];
    courts.forEach((court) =>
      court.dates.forEach((d) =>
        d.slots.forEach((s) =>
          slots.push({
            courtId: court.courtId,
            date: d.date,
            timeRange: s.time || s.timeRange,
            price: s.price,
            status: "booked",
          })
        )
      )
    );

    const booking = await CourtBooking.findByIdAndUpdate(
      bookingId,
      {
        status: "Paid",
        paymentId: razorpay_payment_id,
        slots,
        totalAmount: totalPrice,
      },
      { new: true }
    );

    return res.json({ success: true, booking });
  } catch (err) {
    console.error("verifyOrder error:", err.message);
    return res.status(500).json({ success: false });
  }
}


/* ---------------------------------------
   4️⃣ CHECK AVAILABILITY (UNCHANGED)
--------------------------------------- */
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

  const booked = await CourtBooking.find({
    "slots.courtId": { $in: slots.map((s) => s.courtId) },
    "slots.date": { $in: slots.map((s) => s.date) },
    "slots.timeRange": { $in: slots.map((s) => s.timeRange) },
    status: { $in: ["Paid", "reserved"] },
  });

  return res.json({ available: booked.length === 0 });
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

export async function razorpayWebhook(req, res) {
  console.log("🔔 ================= WEBHOOK HIT =================");
  console.log("⏰ Time:", new Date().toISOString());

  try {
    /* --------------------------------------------------
       0️⃣ BODY MUST BE BUFFER (CRITICAL)
    -------------------------------------------------- */
    if (!Buffer.isBuffer(req.body)) {
      console.error("❌ Webhook body is NOT Buffer. Middleware order wrong.");
      return res.status(500).json({ success: false });
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const razorpaySignature = req.headers["x-razorpay-signature"];

    if (!razorpaySignature || !webhookSecret) {
      console.error("❌ Missing webhook signature or secret");
      return res.status(400).json({ success: false });
    }

    /* --------------------------------------------------
       1️⃣ VERIFY SIGNATURE (RAW BODY ONLY)
    -------------------------------------------------- */
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(req.body)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      console.error("❌ Webhook signature mismatch");
      return res.status(400).json({ success: false });
    }

    console.log("✅ Webhook signature verified");

    /* --------------------------------------------------
       2️⃣ PARSE PAYLOAD
    -------------------------------------------------- */
    const payload = JSON.parse(req.body.toString());
    const event = payload.event;

    const payment = payload.payload?.payment?.entity;
    const order = payload.payload?.order?.entity;

    const paymentId = payment?.id;
    const orderId = payment?.order_id || order?.id;
    const receiptBookingId = order?.receipt; // 🔑 bookingId

    console.log("📌 Event:", event);
    console.log("💳 Payment ID:", paymentId);
    console.log("🧾 Order ID:", orderId);
    console.log("📦 Receipt (bookingId):", receiptBookingId);

    /* --------------------------------------------------
       3️⃣ HANDLE SUCCESS EVENTS
    -------------------------------------------------- */
    if (
      event === "payment.captured" ||
      event === "order.paid"
    ) {
      console.log("✅ Handling SUCCESS payment");

      let booking =
        (orderId &&
          await CourtBooking.findOne({ razorpayOrderId: orderId })) ||
        (receiptBookingId &&
          await CourtBooking.findById(receiptBookingId));

      if (!booking) {
        console.error("❌ PAYMENT SUCCESS BUT BOOKING NOT FOUND", {
          orderId,
          receiptBookingId,
        });
        return res.json({ success: true }); // do not retry webhook
      }

      // ✅ IDEMPOTENT UPDATE
      if (booking.status !== "Paid") {
        booking.status = "Paid";
        booking.paymentId = paymentId || booking.paymentId;
        booking.slots.forEach((s) => (s.status = "booked"));
        await booking.save();

        console.log("🎉 BOOKING MARKED PAID:", booking._id.toString());
      } else {
        console.log("ℹ️ Booking already Paid, skipping");
      }
    }

    /* --------------------------------------------------
       4️⃣ HANDLE FAILURE
    -------------------------------------------------- */
    if (event === "payment.failed") {
      console.log("❌ Handling PAYMENT FAILED");

      let booking =
        (orderId &&
          await CourtBooking.findOne({ razorpayOrderId: orderId })) ||
        (receiptBookingId &&
          await CourtBooking.findById(receiptBookingId));

      if (booking && booking.status !== "Paid") {
        booking.status = "Failed";
        booking.paymentId = paymentId || booking.paymentId;
        await booking.save();

        console.log("🛑 BOOKING MARKED FAILED:", booking._id.toString());
      }
    }

    console.log("🔔 =============== WEBHOOK END ===============");
    return res.json({ success: true });
  } catch (err) {
    console.error("🔥 WEBHOOK CRASHED:", err);
    return res.status(500).json({ success: false });
  }
}


// export async function razorpayWebhook(req, res) {
//   console.log("🔔 ================= WEBHOOK HIT =================");
//   console.log("⏰ Time:", new Date().toISOString());

//   try {
//     /* --------------------------------------------------
//        1️⃣ BASIC REQUEST INFO
//     -------------------------------------------------- */
//     console.log("📩 Headers received:", req.headers);
//     console.log(
//       "📦 Body type:",
//       Buffer.isBuffer(req.body) ? "Buffer ✅" : typeof req.body
//     );

//       // 🔥🔥 ADD THIS BLOCK EXACTLY HERE 🔥🔥
//     if (!Buffer.isBuffer(req.body)) {
//       console.error(
//         "❌ Webhook body is NOT a Buffer. JSON middleware has already parsed it."
//       );
//       console.error("❌ Middleware order is WRONG.");
//       return res.status(500).json({ success: false });
//     }
//     // 🔥🔥 END BLOCK 🔥🔥

//     const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
//     const razorpaySignature = req.headers["x-razorpay-signature"];

//     if (!razorpaySignature) {
//       console.error("❌ Missing x-razorpay-signature header");
//       return res.status(400).json({ success: false });
//     }

//     if (!webhookSecret) {
//       console.error("❌ Missing RAZORPAY_WEBHOOK_SECRET in env");
//       return res.status(500).json({ success: false });
//     }

//     /* --------------------------------------------------
//        2️⃣ SIGNATURE VERIFICATION
//     -------------------------------------------------- */
//     const rawBody = req.body; // MUST be Buffer
//     console.log("🧾 Raw body length:", rawBody.length);

//     const expectedSignature = crypto
//       .createHmac("sha256", webhookSecret)
//       .update(rawBody)
//       .digest("hex");

//     console.log("🔑 Razorpay Signature:", razorpaySignature);
//     console.log("🔐 Expected Signature:", expectedSignature);

//     if (expectedSignature !== razorpaySignature) {
//       console.error("❌ WEBHOOK SIGNATURE MISMATCH");
//       return res.status(400).json({ success: false });
//     }

//     console.log("✅ Webhook signature verified");

//     /* --------------------------------------------------
//        3️⃣ PARSE PAYLOAD
//     -------------------------------------------------- */
//     const payload = JSON.parse(rawBody.toString());
//     console.log("📨 Full payload:", JSON.stringify(payload, null, 2));

//     const event = payload.event;
//     console.log("📌 Event type:", event);

//     const payment = payload.payload?.payment?.entity;
//     if (!payment) {
//       console.warn("⚠️ No payment entity found in payload");
//       return res.json({ success: true });
//     }

//     const paymentId = payment.id;
//     const orderId = payment.order_id;

//     console.log("💳 Payment ID:", paymentId);
//     console.log("🧾 Order ID:", orderId);

//     /* --------------------------------------------------
//        4️⃣ HANDLE EVENTS
//     -------------------------------------------------- */

//     // if (event === "payment.captured") {
//     //   console.log("✅ Handling PAYMENT CAPTURED");

//     //   const booking = await CourtBooking.findOneAndUpdate(
//     //     { razorpayOrderId: orderId },
//     //     {
//     //       $set: {
//     //         status: "Paid",
//     //         paymentId: paymentId,
//     //         "slots.$[].status": "booked",
//     //       },
//     //     },
//     //     { new: true }
//     //   );

//     //   if (!booking) {
//     //     console.warn(
//     //       "⚠️ No booking found for orderId:",
//     //       orderId,
//     //       "(maybe initiateBooking not done?)"
//     //     );
//     //   } else {
//     //     console.log("🎉 BOOKING MARKED PAID:", booking._id.toString());
//     //   }
//     // }

//     if (event === "order.paid" || event === "payment.captured") {
//   console.log("✅ Handling PAYMENT SUCCESS");

//   const booking = await CourtBooking.findOneAndUpdate(
//     { razorpayOrderId: orderId },
//     {
//       $set: {
//         status: "Paid",
//         paymentId: paymentId,
//         "slots.$[].status": "booked",
//       },
//     },
//     { new: true }
//   );

//   if (!booking) {
//     console.warn("⚠️ Booking not found for orderId:", orderId);
//   } else {
//     console.log("🎉 BOOKING CONFIRMED:", booking._id.toString());
//   }
// }


//     if (event === "payment.failed") {
//       console.log("❌ Handling PAYMENT FAILED");

//       const booking = await CourtBooking.findOneAndUpdate(
//         { razorpayOrderId: orderId },
//         {
//           $set: {
//             status: "Failed",
//             paymentId: paymentId || orderId,
//           },
//         },
//         { new: true }
//       );

//       if (!booking) {
//         console.warn(
//           "⚠️ No booking found to mark FAILED for orderId:",
//           orderId
//         );
//       } else {
//         console.log("🛑 BOOKING MARKED FAILED:", booking._id.toString());
//       }
//     }

//     /* --------------------------------------------------
//        5️⃣ FINISH
//     -------------------------------------------------- */
//     console.log("✅ Webhook processed successfully");
//     console.log("🔔 =============== WEBHOOK END ===============");

//     return res.json({ success: true });
//   } catch (err) {
//     console.error("🔥 WEBHOOK CRASHED");
//     console.error(err);
//     console.log("🔔 =============== WEBHOOK END ===============");
//     return res.status(500).json({ success: false });
//   }
// }



// export async function razorpayWebhook(req, res) {
//   try {
//     console.log(
//       "🌍 DB URL:",
//       mongoose.connection.host,
//       mongoose.connection.name
//     );

//     const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

//     const razorpaySignature = req.headers["x-razorpay-signature"];
//     const rawBody = req.body;

//     const expectedSignature = crypto
//       .createHmac("sha256", webhookSecret)
//       .update(rawBody)
//       .digest("hex");

//     if (razorpaySignature !== expectedSignature) {
//       console.error("❌ Webhook signature mismatch");
//       return res.status(400).json({ success: false });
//     }

//     const payload = JSON.parse(rawBody.toString());
//     const event = payload.event;

//     const payment = payload.payload?.payment?.entity;
//     if (!payment) return res.json({ success: true });

//     const paymentId = payment.id;
//     const orderId = payment.order_id;

//     /* ================= PAYMENT CAPTURED ================= */
//     if (event === "payment.captured") {
//       // const booking = await CourtBooking.findOneAndUpdate(
//       //   {
//       //     status: "initiated",
//       //     paymentId: { $regex: "^INIT_" },
//       //   },
//       //   {
//       //     $set: {
//       //       status: "Paid",
//       //       paymentId: paymentId,
//       //       "slots.$[].status": "booked",
//       //     },
//       //   },
//       //   { new: true }
//       // );

//       const booking = await CourtBooking.findOneAndUpdate(
//         { razorpayOrderId: orderId },
//         {
//           $set: {
//             status: "Paid",
//             paymentId: paymentId,
//             "slots.$[].status": "booked",
//           },
//         },
//         { new: true }
//       );

//       if (!booking) {
//         console.warn("⚠️ Webhook: No initiated booking found");
//         return res.json({ success: true });
//       }

//       console.log("✅ Webhook DB UPDATED:", booking._id);
//     }

//     /* ================= PAYMENT FAILED ================= */
//     if (event === "payment.failed") {
//       // const booking = await CourtBooking.findOneAndUpdate(
//       //   {
//       //     status: "initiated",
//       //     paymentId: { $regex: "^INIT_" },
//       //   },
//       //   {
//       //     $set: {
//       //       status: "Failed",
//       //       paymentId: paymentId || orderId,
//       //     },
//       //   },
//       //   { new: true }
//       // );

//       const booking = await CourtBooking.findOneAndUpdate(
//         { razorpayOrderId: orderId },
//         {
//           $set: {
//             status: "Failed",
//             paymentId: paymentId || orderId,
//           },
//         },
//         { new: true }
//       );

//       if (booking) {
//         console.log("❌ Webhook marked FAILED:", booking._id);
//       }
//     }

//     return res.json({ success: true });
//   } catch (err) {
//     console.error("🔥 Webhook error:", err);
//     return res.status(500).json({ success: false });
//   }
// }




/* =========================================================
   RAZORPAY WEBHOOK (FINAL SAFETY NET)
========================================================= */

// export async function razorpayWebhook(req, res) {
//   try {
//     const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
//     console.log(
//       "🌍 DB URL:",
//       mongoose.connection.host,
//       mongoose.connection.name
//     );

//     const razorpaySignature = req.headers["x-razorpay-signature"];
//     const body = req.body; // RAW body (Buffer)

//     const expectedSignature = crypto
//       .createHmac("sha256", webhookSecret)
//       .update(body)
//       .digest("hex");

//     if (razorpaySignature !== expectedSignature) {
//       console.error("❌ Razorpay Webhook Signature Mismatch");
//       return res.status(400).json({ success: false });
//     }

//     const payload = JSON.parse(body.toString());
//     const event = payload.event;

//     /* ================= PAYMENT SUCCESS ================= */
//     if (event === "payment.captured") {
//       const payment = payload.payload.payment.entity;

//       const paymentId = payment.id;
//       const orderId = payment.order_id;

//       const booking = await CourtBooking.findOne({
//         status: "initiated",
//         $or: [{ paymentId: orderId }, { paymentId: { $regex: "^INIT_" } }],
//       });

//       if (!booking) {
//         console.warn("⚠️ Webhook: No initiated booking found");
//         return res.json({ success: true });
//       }

//       booking.status = "Paid";
//       booking.paymentId = paymentId;
//       booking.slots = booking.slots.map((s) => ({
//         ...s.toObject(),
//         status: "booked",
//       }));

//       await booking.save();
//       console.log("✅ Webhook marked booking PAID:", booking._id);
//     }

//     /* ================= PAYMENT FAILED ================= */
//     if (event === "payment.failed") {
//       const payment = payload.payload.payment.entity;

//       const paymentId = payment.id;
//       const orderId = payment.order_id;

//       const booking = await CourtBooking.findOne({
//         status: "initiated",
//         $or: [{ paymentId: orderId }, { paymentId: { $regex: "^INIT_" } }],
//       });

//       if (!booking) {
//         console.warn("⚠️ Webhook: No initiated booking found for failure");
//         return res.json({ success: true });
//       }

//       booking.status = "Failed";
//       booking.paymentId = paymentId || orderId;

//       await booking.save();
//       console.log("❌ Webhook marked booking FAILED:", booking._id);
//     }

//     return res.json({ success: true });
//   } catch (err) {
//     console.error("🔥 Razorpay Webhook Error:", err);
//     return res.status(500).json({ success: false });
//   }
// }

// export async function checkAvailability(req, res) {
//   const { courts } = req.body;

//   const slots = [];
//   courts.forEach((court) => {
//     court.dates.forEach((dateObj) => {
//       dateObj.slots.forEach((slot) => {
//         slots.push({
//           courtId: court.courtId,
//           date: dateObj.date,
//           timeRange: slot.time || slot.timeRange,
//         });
//       });
//     });
//   });

//   // Check existing bookings
//   const booked = await CourtBooking.find({
//     "slots.courtId": { $in: slots.map((s) => s.courtId) },
//     "slots.date": { $in: slots.map((s) => s.date) },
//     "slots.timeRange": { $in: slots.map((s) => s.timeRange) },
//     status: { $in: ["Paid", "reserved"] },
//   });

//   if (booked.length > 0) {
//     return res.json({ available: false });
//   }

//   return res.json({ available: true });
// }
