import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true },
  isAdmin: {type:Boolean,default:false},
  password: { type: String, required: true }, // 🔑 New
  createdAt: { type: Date, default: Date.now },

});

const Admin = mongoose.model("Admin", adminSchema);
export default Admin;
