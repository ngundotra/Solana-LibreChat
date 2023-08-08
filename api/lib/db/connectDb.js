require('dotenv').config();
const mongoose = require('mongoose');
const MONGO_URI = process.env.MONGO_URI;
const MONGO_USER = process.env.MONGO_USER;
const MONGO_PASS = process.env.MONGO_PASS;

if (!MONGO_URI) {
  throw new Error('Please define the MONGO_URI environment variable');
}
if (!MONGO_USER) {
  throw new Error('Please define the MONGO_USER environment variable');
}
if (!MONGO_PASS) {
  throw new Error('Please define the MONGO_PASS environment variable');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDb() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      bufferCommands: false,
      user: MONGO_USER,
      pass: MONGO_PASS,
      // bufferMaxEntries: 0,
      // useFindAndModify: true,
      // useCreateIndex: true
    };

    mongoose.set('strictQuery', true);
    cached.promise = mongoose.connect(MONGO_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = connectDb;
