import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './config/db';
import apiRoutes from './routes';
import { errorHandler } from './middlewares/errorHandler';

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Base API route
app.use('/api', apiRoutes);

// Catch-all route for unmatched paths (404)
app.use((req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

// Error handling middleware (must be registered last)
app.use(errorHandler);

import http from 'http';
import https from 'https';
import fs from 'fs';

const PORT = process.env.PORT || 5000;
const HTTPS_PORT = process.env.HTTPS_PORT || 5443;

// Paths to SSL Certificates (support local/host paths)
const caPath = process.env.SSL_CA_PATH || '/home/khadas/COMPANY_CA.crt';
const certPath = process.env.SSL_CERT_PATH || '/home/khadas/SBC_SERVER_CERTIFICATE.crt';
const keyPath = process.env.SSL_KEY_PATH || '/home/khadas/SBC_SERVER_CERTIFICATE.key';

let ca: Buffer | undefined;
let cert: Buffer | undefined;
let key: Buffer | undefined;
let runHttps = false;

try {
  if (fs.existsSync(caPath)) ca = fs.readFileSync(caPath);
  if (fs.existsSync(certPath)) cert = fs.readFileSync(certPath);
  if (fs.existsSync(keyPath)) key = fs.readFileSync(keyPath);

  if (cert && key) {
    runHttps = true;
  }
} catch (err: any) {
  console.warn('[SSL] Could not read certificates:', err?.message || err);
}

// Start HTTP Server
const httpServer = http.createServer(app);
httpServer.listen(PORT, () => {
  console.log(`HTTP Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Start HTTPS Server
if (runHttps) {
  const httpsOptions = {
    ca,
    cert,
    key,
    rejectUnauthorized: false,
    requestCert: false,
    minVersion: 'TLSv1.2' as const,
    maxVersion: 'TLSv1.3' as const,
    honorCipherOrder: true,
  };
  const httpsServer = https.createServer(httpsOptions, app);
  httpsServer.listen(HTTPS_PORT, () => {
    console.log(`HTTPS Server running in ${process.env.NODE_ENV || 'development'} mode on port ${HTTPS_PORT}`);
  });
} else {
  console.log('[SSL] HTTPS Server not started (SSL certificates not found or unreadable).');
}
