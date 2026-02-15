# Class Scheduler Backend

Backend API for the class scheduling system. Provides master data (students, instructors, class types), configuration management, CSV registration uploads, and reporting endpoints.

## Features

- **Master data** — Students, instructors, and class types
- **Configuration** — Key-value system config (limits, features, system)
- **CSV upload** — Bulk registration upload with validation and batch status
- **Reports** — Classes per day, filtered classes, statistics, instructor reports
- **Health check** — `/health` for uptime monitoring
- **Rate limiting** — Per-IP request limits
- **CORS** — Configurable frontend origin

## Tech Stack

- **Runtime:** Node.js (see [.nvmrc](.nvmrc))
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose)
- **Validation:** Joi
- **File upload:** Multer

## Prerequisites

- **Node.js** v21.6.0 (or use [nvm](https://github.com/nvm-sh/nvm): `nvm use`)
- **MongoDB** — Local instance or a connection URI (e.g. MongoDB Atlas, Railway)

## Installation

```bash
# Clone the repository (if not already)
git clone git@github.com:AkibDeraiya123/test-backend.git
cd backend

# Install dependencies
npm install

# Create a .env file with your settings (see Environment Variables below)
```

## Environment Variables

Create a `.env` file in the project root. Example:

| Variable        | Description                    | Default                    |
|----------------|--------------------------------|----------------------------|
| `PORT`         | Server port                    | `5000`                     |
| `NODE_ENV`     | Environment                    | `development`              |
| `MONGODB_URI`  | MongoDB connection string      | `mongodb://localhost:27017/class-scheduler` |
| `FRONTEND_URL` | Allowed CORS origin            | `http://localhost:5173`    |
| `MAX_FILE_SIZE`| Max upload size (bytes)        | `10485760` (10MB)          |
| `UPLOAD_DIR`   | Directory for uploaded files   | `./uploads`                |
| `LOG_LEVEL`    | Log level                      | `info`                     |

**Note:** Do not commit `.env` or any `.env.*` files; they are gitignored.

## Scripts

| Command     | Description                    |
|------------|---------------------------------|
| `npm start`| Start the server (production)   |
| `npm run dev` | Start with nodemon (development) |
| `npm test` | Run tests with coverage         |

## Running the Server

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

Server runs at `http://localhost:5000` (or your `PORT`). Health check: [http://localhost:5000/health](http://localhost:5000/health).

## CSV Upload Format

Registration CSV should include columns (order/names may vary; see validation):

- **Registration ID** — Optional for new rows; required for update/delete
- **Student ID**
- **Instructor ID**
- **Class ID**
- **Class Start Time** — e.g. `MM/DD/YYYY HH:mm`
- **Action** — `new`, `update`, or `delete`

See `sample_registrations.csv` in the project root for an example.

## Project Structure

```
backend/
├── src/
│   ├── config/          # Database, environment
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Upload, error handling
│   ├── models/          # Mongoose models (Student, Instructor, ClassType, Configuration)
│   ├── routes/          # API route definitions
│   ├── services/        # Validation, CSV processing
│   ├── utils/           # Helpers (e.g. seed data)
│   ├── app.js           # Express app, middleware, routes
│   └── server.js        # HTTP server, DB connect, listen
├── uploads/             # Uploaded files (create if needed)
├── .env                 # Environment variables (not committed)
├── .nvmrc               # Node version
├── package.json
└── README.md
```
