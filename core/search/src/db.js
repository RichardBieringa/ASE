const mongoose = require("mongoose");
const { connection } = mongoose;

// Load env vars from .env file
require("dotenv").config();

// Check if env vars are set
const keys = ["DB_USER", "DB_PASSWORD", "DB_HOST", "DB_PORT", "DB_NAME"];
for (let key of keys) {
  if (!process.env[key]) {
    console.error(`ENV VAR: ${key} not set`);
    console.error(`exiting...`);
    process.exit(1);
  }
}

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME} = process.env;
const connectionString = `mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`;

// Set up MongoDB connection
console.log(`Mongo: connecting to: ${connectionString}`);

// Callbacks on Mongo events
connection.on("connected", () => console.log(`Mongo: connection established.`));
connection.on("error", () => console.error(`Mongo: connection error!`));
connection.on("disconnected", () => console.log(`Mongo: disconnected.`));

module.exports =  mongoose.connect(connectionString);