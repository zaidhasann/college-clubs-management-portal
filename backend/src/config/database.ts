import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const uri = (process.env.MONGODB_URI || "mongodb://localhost:27017/club_management").trim();
    mongoose.set("strictQuery", false);
    // Disable mongoose buffering so operations fail fast when DB is unreachable
    mongoose.set('bufferCommands', false);

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      // useNewUrlParser and useUnifiedTopology are recommended for modern drivers
      // (TypeScript may infer proper types from mongoose types)
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      useNewUrlParser: true,
      // @ts-ignore
      useUnifiedTopology: true,
    });

    mongoose.connection.on("connected", () => {
      console.log("✅ MongoDB connected successfully");
    });

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    return true;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    console.error("The server will shut down because the database connection failed.");
    process.exit(1);
  }
};

export default connectDB;
