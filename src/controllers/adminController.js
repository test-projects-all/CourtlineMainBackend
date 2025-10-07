import Court from '../models/Court.js';
import Slot from '../models/Slot.js';
import CourtBooking from '../models/CourtBookingUser.js';
import mongoose from 'mongoose';
import Admin from '../models/Admin.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function addCourt(req, res) {
    try {
        const { name, startTime, endTime, length, active } = req.body;

        // Validate required fields
        if (!name || !startTime || !endTime || !length) {
            return res.status(400).json({ error: 'name, startTime, endTime, and length are required' });
        }

        // Validate active as string
        const activeStr = active !== undefined ? String(active) : 'true';
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
        const { id } = req.params; // Court ID from URL
        const { name, startTime, endTime, length, active } = req.body;

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


export async function editSlot(req, res) {
    const { courtId, slotTime, price, active, date } = req.body;
    if (!price) {
        price = 2000;
    }

    const slot = await Slot.findOneAndUpdate({ courtId, slotTime, date }, { price, active }, { new: true });
    if (!slot) {
        return res.status(404).json({ error: "Slot not found" });
    }
    res.status(200).json({ message: "Slot updated", slot });
}

export async function getBookingsTillNow(req, res) {
    try {
        const allBookings = await CourtBooking.find().lean(); // get all bookings

        const today = new Date();

        const filteredBookings = allBookings.filter((b) => {
            const [day, month, year] = b.date.split("-"); // "dd-mm-yyyy"
            const bookingDate = new Date(`${year}-${month}-${day}`); // yyyy-mm-dd
            return bookingDate <= today;
        });

        res.json(filteredBookings);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}

export async function getUpcomingBookings(req, res) {
    try {
        const bookings = await CourtBooking.find({ date: { $gt: new Date() } })
        res.json(bookings);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
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
