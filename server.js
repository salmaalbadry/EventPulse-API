require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const configureSocket = require('./config/socket');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`EventPulse Server running on port ${PORT}`);
  });

  configureSocket(server);
};

startServer();
