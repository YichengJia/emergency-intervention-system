# Emergency Intervention System

This repository contains a full‑stack application for managing patients, doctors and appointments for an emergency intervention system. The backend is built with Node.js/Express and MongoDB, while the frontend is a React application styled with Tailwind CSS.

## Features

- Secure user authentication with JWT tokens
- User roles (patient, doctor, admin) with role‑based access control
- CRUD operations for patients, doctors and appointments
- Simple FHIR client and hooks for interacting with external FHIR servers
- Responsive UI using Tailwind CSS and React Router
- Dockerized services for easy deployment (backend, frontend, MongoDB)

## Getting Started

To run the application locally you will need Node.js and MongoDB installed. Clone the repository and create a `.env` file based on `.env.example` both at the root and in the `backend/` folder.

```bash
# Install dependencies for both frontend and backend
cd emergency-intervention-system
npm install
cd backend
npm install
cd ..

# Run MongoDB locally or use Docker (see docker-compose.yml)
# Start development servers
./start.sh
```

Alternatively, you can spin up everything using Docker Compose:

```bash
docker-compose up --build
```

This will build and start the `mongodb`, `backend` and `frontend` services. The frontend will be accessible at `http://localhost:3000` and will proxy API requests to the backend.

## License

This project is licensed under the MIT License.