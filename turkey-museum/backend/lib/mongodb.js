import { MongoClient } from 'mongodb';

const uri = 'mongodb+srv://aytasyusuf642:EB9qDIgGscitIfEO@veritabani.9ok9y.mongodb.net/?retryWrites=true&w=majority&appName=VeriTabani';

const options = {};

let client;
let clientPromise;

if (!uri) {
  throw new Error('Please provide your MongoDB URI.');
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
