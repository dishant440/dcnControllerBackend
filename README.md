# SirenProject Backend

This is the Node.js/TypeScript backend for the SirenProject, structured as a modular and dynamic universal central system. It supports dynamic product templates, physical terminal assignments, and integrates with MQTT and mDNS services.

---

## Prerequisites

Ensure you have the following installed on your machine:
- **Node.js** (v20.x or higher recommended)
- **npm** (v10.x or higher)
- **MongoDB** (v7.0 or higher running locally, remotely, or via Docker)
- **MQTT Broker** (Optional: e.g., Mosquitto, if MQTT services are utilized)

---

## Environment Configuration

Create a `.env` file in the root of the `backend/` directory. You can copy the template from `.env.example`:

```bash
cp .env.example .env
```

Define the configuration variables:
- `PORT`: The port on which the Express server will listen (default: `5000`).
- `MONGO_URI`: The MongoDB connection string (e.g., `mongodb://localhost:27017/siren_db`).
- `NODE_ENV`: Application environment (`development` or `production`).
- `JWT_SECRET`: Secret key for JWT generation and verification.
- `MQTT_HOST`: Hostname of the MQTT broker.
- `MQTT_PORT`: Port of the MQTT broker.

---

## Local Setup & Development

### 1. Install Dependencies
Navigate to the `backend/` directory and install the required npm packages:
```bash
npm install
```

### 2. Run in Development Mode
You can start the services concurrently or individually during development:

- **Start Main Express Server**:
  ```bash
  npm run dev
  ```
- **Start mDNS Discovery Service**:
  ```bash
  npm run dev:mdns
  ```
- **Start MQTT Processor Service**:
  ```bash
  npm run dev:mqtt
  ```

---

## Production Setup (Bare Metal / Local PM2)

### 1. Build TypeScript Source
Compile the TypeScript code to JavaScript. The output will be written to the `build/` directory:
```bash
npm run build
```

### 2. Run Production Services
Start the compiled applications:

- **Start Main Express Server**:
  ```bash
  npm run start
  ```
- **Start mDNS Discovery Service**:
  ```bash
  npm run start:mdns
  ```
- **Start MQTT Processor Service**:
  ```bash
  npm run start:mqtt
  ```

---

## Production Setup (Docker / Containerized)

A multi-container setup is pre-configured using Docker and Docker Compose. This orchestrates both the MongoDB database and the backend server.

### 1. Build and Launch Containers
To build the backend image and launch all services in detached mode:
```bash
docker compose up --build -d
```

### 2. View Service Logs
Monitor log output from the running containers:
```bash
docker compose logs -f
```

### 3. Stop Containers
To stop and remove containers and networks:
```bash
docker compose down
```
