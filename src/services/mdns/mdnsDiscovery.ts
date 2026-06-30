import dotenv from 'dotenv';
import { MdnsDiscoveryService } from './mdnsDiscovery.service';

// Load environment variables
dotenv.config();

console.log('mDNS Service starting...');

// Start the advertisement service
MdnsDiscoveryService.startDiscovery();

// Handle clean shutdown
const shutdown = () => {
  console.log('[mDNS Process] Received shutdown signal. Cleaning up...');
  MdnsDiscoveryService.stopDiscovery();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
