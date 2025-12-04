import Court from '../models/Court.js';
import Slot from '../models/Slot.js';
import CourtBooking from '../models/CourtBookingUser.js';
import mongoose from 'mongoose';
import Admin from '../models/Admin.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Event from "../models/Event.js";
import cloudinary from '../config/cloudinary.js';

export async function addCourt(req, res) {
  try {
    const { name, startTime, endTime, length, enabled } = req.body;

    // Validate required fields
    if (!name || !startTime || !endTime || !length) {
      return res.status(400).json({ error: 'name, startTime, endTime, and length are required' });
    }

    // Validate active as string
    const activeStr = enabled !== undefined ? String(enabled) : 'true';
    if (!['true', 'false'].includes(activeStr)) {
      return res.status(400).json({ error: 'active must be "true" or "false"' });
    }

    // Create court
    const court = await Court.create({
      name,
      startTime,
      endTime,
      length, // Store as string (e.g., "00:30")
      active: activeStr,
    });

    res.status(201).json({ message: 'Court added', courtId: court._id });
  } catch (err) {
    console.error('Error in addCourt:', err.message);
    res.status(500).json({ error: err.message });
  }
}


export async function editCourt(req, res) {
  try {
    const { id, name, startTime, endTime, length, active } = req.body;

    // Validate required fields
    if (!name || !startTime || !endTime || !length) {
      return res.status(400).json({ error: 'name, startTime, endTime, and length are required' });
    }

    // Validate court ID
    if (!id || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid court ID' });
    }

    // Validate active as string
    const activeStr = active !== undefined ? String(active) : 'true';
    if (!['true', 'false'].includes(activeStr)) {
      return res.status(400).json({ error: 'active must be "true" or "false"' });
    }

    // Find the existing court
    const court = await Court.findById(id);
    if (!court) {
      return res.status(404).json({ error: 'Court not found' });
    }

    // Update court
    const updatedCourt = await Court.findByIdAndUpdate(
      id,
      {
        name,
        startTime,
        endTime,
        length, // Store as string
        active: activeStr,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: 'Court updated',
      courtId: id,
    });
  } catch (err) {
    console.error('Error in editCourt:', err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function deleteCourt(req, res) {
  try {
    const { id } = req.params; // Court ID from URL

    // Validate court ID
    if (!id || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid court ID' });
    }

    // Find the court
    const court = await Court.findById(id);
    if (!court) {
      return res.status(404).json({ error: 'Court not found' });
    }

    // Delete the court
    await Court.findByIdAndDelete(id);
    console.log('Deleted court:', id);

    res.status(200).json({
      message: 'Court and associated slots deleted',
      courtId: id,
    });
  } catch (err) {
    console.error('Error in deleteCourt:', err.message);
    res.status(500).json({ error: err.message });
  }
}


export async function todaysBookings(req, res) {
  try {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;

    // Find all bookings where any slot matches today’s date
    const bookings = await CourtBooking.find({ "slots.date": formattedDate });

    return res.json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error("Error fetching today’s bookings:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
}




export async function weeklyBookings(req, res) {
  try {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = today.getFullYear();
    const formattedToday = `${day}-${month}-${year}`;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);
    const day7 = String(sevenDaysAgo.getDate()).padStart(2, "0");
    const month7 = String(sevenDaysAgo.getMonth() + 1).padStart(2, "0");
    const year7 = sevenDaysAgo.getFullYear();
    const formatted7DaysAgo = `${day7}-${month7}-${year7}`;

    // Query using string comparison
    const bookings = await CourtBooking.aggregate([
      { $unwind: "$slots" },
      {
        $match: {
          "slots.date": {
            $gte: formatted7DaysAgo,
            $lte: formattedToday,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          slots: { $push: "$slots" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      totalBookings: bookings.length > 0 ? bookings[0].totalBookings : 0,
      data: bookings.length > 0 ? bookings[0].slots : [],
    });
  } catch (error) {
    console.error("Error fetching weekly bookings:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
}


export async function editSlots(req, res) {
  try {
    const { courtId, slots, date } = req.body;
    
    console.log('editSlots request:', { courtId, slots, date });
    
    // Validate required fields
    if (!courtId) {
      return res.status(400).json({ error: "courtId is required" });
    }
    if (!date) {
      return res.status(400).json({ error: "date is required" });
    }
    if (!slots || !Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({ error: "No slots provided" });
    }

    const updates = slots.map(async (s) => {
      const { time, price, active } = s;
      
      if (!time) {
        throw new Error(`Missing time for slot: ${JSON.stringify(s)}`);
      }
      console.log("worked")
      return await Slot.findOneAndUpdate(
        { courtId: String(courtId), timeRange: time, date },
        { price: Number(price) || 0, status: Boolean(active) ? "available" : "inactive" },
        { new: true, upsert: true }
      );
    });

    const updatedSlots = await Promise.all(updates);

    res.status(200).json({
      message: "Slots updated successfully",
      slots: updatedSlots
    });

  } catch (err) {
    console.error('editSlots error:', err);
    res.status(500).json({ error: err.message });
  }
}


export async function getBookingsTillNow(req, res) {
  try {
    // populate courtId to get court.name
    const allBookings = await CourtBooking.find().populate("slots.courtId").lean();

    const today = new Date();
    today.setHours(0, 0, 0, 0); // normalize time

    const filteredBookings = allBookings.filter((booking) =>
      booking.slots.some((slot) => {
        const slotDate = new Date(slot.date);
        slotDate.setHours(0, 0, 0, 0);
        return slotDate <= today;
      })
    );

    // Map slots to include courtName
    const mappedBookings = filteredBookings.map((booking) => ({
      ...booking,
      slots: booking.slots.map((slot) => ({
        ...slot,
        courtName: slot.courtName || slot.courtId?.name || "N/A",
      })),
    }));

    console.log("Filtered Bookings with Court Names:", mappedBookings);

    res.json(mappedBookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}




export async function getUpcomingBookings(req, res) {
  try {
    const allBookings = await CourtBooking.find()
      .populate("slots.courtId", "name") // populate court name
      .lean();

    const today = new Date();
    today.setHours(0, 0, 0, 0); // normalize time

    const filteredBookings = allBookings.filter((booking) => {
      return booking.slots.some((slot) => {
        const slotDate = new Date(slot.date); // yyyy-mm-dd
        slotDate.setHours(0, 0, 0, 0);
        return slotDate >= today; // include today
      });
    });

    // Map bookings to include court name directly
    const mappedBookings = filteredBookings.map((booking) => ({
      ...booking,
      slots: booking.slots.map((slot) => ({
        ...slot,
        courtName: slot.courtId.name, // add courtName
      })),
    }));
    console.log("Upcoming Bookings:", mappedBookings);
    res.json(mappedBookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}



// Return bookings count for each day of the current week
export async function weeklyAnalytics(req, res) {
  try {
    // 1️⃣ Define start and end of week
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    // 2️⃣ Aggregate bookings with date conversion from DD-MM-YYYY to YYYY-MM-DD
    const bookings = await CourtBooking.aggregate([
      { $unwind: "$slots" },
      {
        $addFields: {
          // Convert DD-MM-YYYY to YYYY-MM-DD format
          convertedDate: {
            $let: {
              vars: {
                dateParts: { $split: ["$slots.date", "-"] }
              },
              in: {
                $concat: [
                  { $arrayElemAt: ["$$dateParts", 2] }, // year
                  "-",
                  { $arrayElemAt: ["$$dateParts", 1] }, // month
                  "-",
                  { $arrayElemAt: ["$$dateParts", 0] }  // day
                ]
              }
            }
          }
        }
      },
      {
        $addFields: {
          bookingDate: {
            $dateFromString: { dateString: "$convertedDate", format: "%Y-%m-%d" }
          }
        }
      },
      {
        $match: {
          bookingDate: { $gte: startOfWeek, $lte: today }
        }
      },
      {
        $group: {
          _id: { $dayOfWeek: "$bookingDate" },
          count: { $sum: 1 }
        }
      }
    ]);

    // 3️⃣ Map Mongo dayOfWeek to labels
    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const analyticsData = Array(7)
      .fill(0)
      .map((_, i) => {
        const day = i + 1; // Mongo $dayOfWeek: 1=Sunday
        const dayData = bookings.find((b) => b._id === day);
        return { day: dayLabels[i], bookings: dayData ? dayData.count : 0 };
      });

    res.json({ analyticsData });
  } catch (err) {
    console.error("Error fetching weekly analytics:", err);
    res.status(500).json({ error: err.message });
  }
}


// ✅ Slot Analytics
export const slotAnalytics = async (req, res) => {
  try {
    const bookings = await CourtBooking.find();

    // Define fixed slots from 6 AM to 11 PM
    const startHour = 6;
    const endHour = 23; // 11 PM
    const slotCount = {};

    for (let h = startHour; h < endHour; h++) {
      const label = `${formatHour(h)} - ${formatHour(h + 1)}`;
      slotCount[label] = 0; // initialize to zero
    }

    // Count bookings within each fixed slot
    bookings.forEach((booking) => {
      booking.slots.forEach((slot) => {
        if (!slot.timeRange) return;

        const [start, end] = slot.timeRange.split(" - ").map(t => t.trim());
        if (!start || !end) return;

        let startTime = convertTo24Hour(start);
        let endTime = convertTo24Hour(end);

        // Cap times within startHour-endHour
        startTime = Math.max(startTime, 6);
        endTime = Math.min(endTime, 23);

        for (let h = startTime; h < endTime; h++) {
          const label = `${formatHour(h)} - ${formatHour(h + 1)}`;
          if (slotCount[label] !== undefined) {
            slotCount[label] += 1;
          }
        }
      });
    });

    // Convert map to array
    const result = Object.entries(slotCount).map(([timeRange, count]) => ({
      timeRange,
      count,
    }));

    res.json(result);
  } catch (error) {
    console.error("Error fetching slot analytics:", error);
    res.status(500).json({ error: "Error fetching slot analytics" });
  }
};

// Helper: format hour to 12-hour format
function formatHour(h) {
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:00 ${period}`;
}

// Helper: convert "HH:MM AM/PM" to 24-hour number
function convertTo24Hour(timeStr) {
  const [time, period] = timeStr.split(" ");
  let [hour, minute] = time.split(":").map(Number);
  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  return hour;
}


export async function totalBooking(req, res) {
  try {
    const total = await CourtBooking.countDocuments();
    res.json({ totalBookings: total });
  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function signup(req, res) {
  try {
    const { username, password } = req.body;

    // check existing user
    const exists = await Admin.findOne({ username });
    if (exists) return res.status(400).json({ error: "Email already in use" });

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create user
    const admin = await Admin.create({ username, password: hashedPassword });
    console.log('Admin created:', admin);
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.error('Error in signup:', err);
  }
};

export async function login(req, res) {
  try {
    const { username, password } = req.body;

    // find user
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(400).json({ error: "Admin Not Found" });

    // compare password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    // create JWT
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    // ✅ store token in HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true, // prevents access via JavaScript
      secure: process.env.NODE_ENV === "production", // send only over HTTPS in production
      sameSite: "strict", // CSRF protection
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    // ✅ send minimal data back (no token)
    res.json({
      success: true,
      admin: { id: admin._id, username: admin.username },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export const addEvent = async (req, res) => {
  try {
    const { title, description, type } = req.body;
    const file = req.file;

    if (!title || !type || !file) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Upload image to Cloudinary
    const result = await cloudinary.uploader.upload(file.path, { folder: "events" });

    const newEvent = new Event({
      title,
      description,
      type,
      image: result.secure_url,
    });

    await newEvent.save();
    res.status(201).json({ message: "Event added successfully", event: newEvent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// 🟠 Edit an event
export const editEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    const file = req.file;

    let updateData = { title, description };

    if (file) {
      const result = await cloudinary.uploader.upload(file.path, { folder: "events" });
      updateData.image = result.secure_url;
    }

    const updatedEvent = await Event.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedEvent) return res.status(404).json({ message: "Event not found" });

    res.status(200).json({ message: "Event updated", event: updatedEvent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating event", error: err.message });
  }
};

// 🔴 Delete an event
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Event.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json({ message: "Event deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting event", error: err.message });
  }
};