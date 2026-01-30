# PDL (Sericulture Tamil Nadu)

## Project Structure

This is a full-stack application with separate client and server components:

### Client (Frontend)
- **Location**: `Client/`
- **Technology**: React + Vite + Tailwind CSS
- **Development**: `npm run dev` (runs on port 5173)
- **Build**: `npm run build`

### Server (Backend) 
- **Location**: `Node/`
- **Technology**: Node.js + Express
- **Development**: `npm run dev` (runs on port 4000)
- **Production**: `npm start`

## Getting Started

1. Install dependencies in both directories:
   ```bash
   cd Client && npm install
   cd ../Node && npm install
   ```

2. Start development servers:
   ```bash
   # Terminal 1 - Backend
   cd Node && npm run dev
   
   # Terminal 2 - Frontend  
   cd Client && npm run dev
   ```

The client proxies API requests to the backend server.