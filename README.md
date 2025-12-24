# Ssaye Web Application

A simple MERN stack web application with a home page and 4 static pages.

## Project Structure

```
Ssaye/
├── client/              # React frontend
│   ├── public/
│   └── src/
│       ├── components/  # Navbar, Footer
│       ├── pages/       # Home, Assets, Smart City, Farms, Blog
│       ├── images/      # Logo and other images
│       ├── App.js
│       └── index.js
├── server/              # Express backend
│   ├── server.js
│   └── .env
└── package.json
```

## Installation

Install all dependencies (root, server, and client):

```bash
npm run install-all
```

Or install manually:

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

## Running the Application

### Development Mode

Run both frontend and backend concurrently:

```bash
npm run dev
```

Or run separately:

```bash
# Terminal 1 - Backend (runs on http://localhost:5000)
npm run server

# Terminal 2 - Frontend (runs on http://localhost:3000)
npm run client
```

### Production Mode

Build the React app and serve it from Express:

```bash
cd client
npm run build
cd ..
NODE_ENV=production node server/server.js
```

## Pages

- **Home** - Landing page (/)
- **Assets** - Asset management page (/assets)
- **Smart City** - Smart city solutions page (/smart-city)
- **Farms** - Farm management page (/farms)
- **Blog** - Blog and articles page (/blog)

## Tech Stack

- **Frontend**: React, React Router
- **Backend**: Node.js, Express
- **Development**: Nodemon, Concurrently

## Notes

This is a simple starter structure. You can easily extend it by:
- Adding MongoDB for database functionality
- Creating API endpoints in the server
- Adding more components and pages
- Implementing forms and state management
