import mongoose from 'mongoose';
import Razorpay from 'razorpay';
import dotenv from "dotenv";
dotenv.config();

// if (!uri) {
	//   throw new Error('MONGO_URI is not defined. Check your .env file and dotenv setup!');
	// }
	export async function connectDB() {
		try {
		const uri = process.env.MONGO_URI;
		console.log("Mongo URI:", process.env.MONGO_URI);
		console.log("Mongo URI:", uri);
		await mongoose.connect(uri);
		console.log('Connected to MongoDB');
	} catch (err) {
		console.error('MongoDB connection error:', err);
		throw err;
	}
}

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

