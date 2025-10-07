import express from 'express';
import { addCourt, editCourt,deleteCourt,login,signup,getBookingsTillNow } from '../controllers/adminController.js';
const router = express.Router();
import authMiddleware from '../middleware/authMiddleware.js';


router.post('/add_court',authMiddleware, addCourt); // Endpoint to add a court
router.put('/edit_court/:id',authMiddleware, editCourt); // Endpoint to edit a court by ID
router.delete('/delete_courts/:id',authMiddleware, deleteCourt);
router.get('/getBookingsTillNow',authMiddleware, getBookingsTillNow);
router.post('/login',login);
router.post('/signup',signup);

export default router;