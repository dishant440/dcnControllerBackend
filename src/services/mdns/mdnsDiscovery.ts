import dotenv from 'dotenv';
import { connectDB } from '../../config/db';
import { MdnsDiscoveryService } from './mdnsDiscovery.service';
import express from 'express';

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

app.use(express.json());



console.log('mDNS Discovery Process starting...');

// Start the discovery service
MdnsDiscoveryService.startDiscovery();





// Handle clean shutdown
const shutdown = () => {
  console.log('[mDNS Process] Received shutdown signal. Cleaning up...');
  MdnsDiscoveryService.stopDiscovery();
  process.exit(0);
};



process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
