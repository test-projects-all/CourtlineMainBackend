import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import userRoutes from './routes/userRoutes.js';

import adminRoutes from './routes/adminRoute.js';
const app = express();

// Middleware
app.use(
  cors({
    origin: ['http://localhost:5173','http://localhost:5174','https://courtline.netlify.app','https://courtlineadminpanel.netlify.app','www.courtline.club','http://courtline.club'], // your frontend URL
    credentials: true,               // allow cookies to be sent
  })
);
app.use(bodyParser.json());
app.use(express.json());

// Example route
app.get('/', (req, res) => {
    res.json({ message: 'Courtline Backend API is running.' });
});

app.use('/api/users', userRoutes); //not sure
// app.use('/api/auth', authRoutes);
// app.use('/api', courtRoutes);
app.use('/api/admin',adminRoutes)

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

export default app;