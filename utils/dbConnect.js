import mongoose from "mongoose";

const dbConnect = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    await mongoose.connect(process.env.DB_HOST, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw new Error("Failed to connect to MongoDB");
  }
};

export default dbConnect;
