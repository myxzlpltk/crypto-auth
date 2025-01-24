import sequelize from "@/core/db";
import User from "@/models/user";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Connect sqlite
    try {
      // Connect to the database
      console.log("Connecting to the database...");
      await sequelize.authenticate();
      console.log("Connection has been established successfully.");
      // Create tables
      await User.sync();
    } catch (error) {
      console.error("Unable to connect to the database:", error);
    }
  }
}
