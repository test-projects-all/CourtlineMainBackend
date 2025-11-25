import express from 'express';
import { addCourt, editCourt,deleteCourt,login,signup,getBookingsTillNow, todaysBookings,weeklyBookings, getUpcomingBookings, weeklyAnalytics, slotAnalytics, editSlots, addEvent,editEvent,deleteEvent } from '../controllers/adminController.js';
const router = express.Router();
import authMiddleware from '../middleware/authMiddleware.js';
import multer from "multer";
const upload = multer({ storage: multer.diskStorage({}) });


router.get('/todaysBooking',todaysBookings);
router.get('/weeklyBookings',weeklyBookings);
router.get('/upcomingBookings',getUpcomingBookings);
router.get('/weeklyAnalytics',weeklyAnalytics);
router.get('/slotAnalytics',slotAnalytics);
router.post('/add_court', addCourt); // Endpoint to add a court
router.put('/edit_court', editCourt); // Endpoint to edit a court by ID
router.delete('/delete_courts/:id', deleteCourt);
router.put("/editSlots",editSlots);
router.get('/getBookingsTillNow', getBookingsTillNow);
router.post('/login',login);   //done 
router.post('/signup',signup); // done

router.post('/addEvent',upload.single("image"),addEvent);
router.put('/editEvent/:id',upload.single("image"),editEvent);
router.delete('/deleteEvent/:id',deleteEvent);
router.post('/logout', (req, res) => {
  try {
    // Clear the token cookie
    res.clearCookie('token', {
      httpOnly: true,   // must match how it was set
      secure: process.env.NODE_ENV === 'production', // if HTTPS
      sameSite: 'lax',  // or 'strict' depending on your setup
      path: '/',        // must match the path used when setting cookie
    });

    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Logout failed' });
  }
});

export default router;