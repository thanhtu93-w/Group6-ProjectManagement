# TeamSync - Project Management Platform

## Project Description
TeamSync is a powerful web application designed for project management and team collaboration. It helps teams to organize tasks visually and communicate in real-time. With TeamSync, you can create projects, track progress using a Kanban board, and discuss task details with your teammates in one place.

## Technologies Used
This project is built using the MERN stack and modern web tools:
- **Frontend**: React.js, Axios, React Router, Socket.io-client, Chart.js.
- **Backend**: Node.js, Express.js, MongoDB, Mongoose.
- **Real-time**: Socket.io for live updates and chat.
- **Security**: JWT (JSON Web Tokens) for authentication and Bcrypt for password hashing.
- **File Management**: Multer for handling file and image uploads.

## Key Features
- **Dynamic Kanban Board**: Manage tasks with a simple drag-and-drop interface.
- **Real-time Collaboration**: Live chat and status updates without refreshing the page.
- **Project Dashboard**: View your project progress with interactive charts and progress bars.
- **Admin Panel**: Manage all users, projects, and system statistics from a central dashboard.
- **Notifications**: Get instant alerts when you are assigned to a task or when status changes.
- **File Sharing**: Upload documents and images directly to specific tasks.

## Project Presentation
Watch the project presentation and demo video here:
[TeamSync Presentation Video](https://youtu.be/5BQIVp4biX0)

## Installation Guide

### Prerequisites
- Node.js installed on your machine.
- A MongoDB database (local or MongoDB Atlas).

### 1. Setup the Backend
1. Open your terminal and go to the backend folder:
   ```bash
   cd backend
   ```
2. Install the required packages:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` directory and add your configuration:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_uri
   JWT_SECRET=your_jwt_secret_key
   ```
4. Start the backend server:
   ```bash
   npm run dev
   ```

### 2. Setup the Frontend
1. Open a new terminal and go to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install the required packages:
   ```bash
   npm install
   ```
3. Start the frontend application:
   ```bash
   npm run dev
   ```

### 3. Start Using the System
- Once both servers are running, open your browser and visit: `http://localhost:3000`
- Register a new account or login with your existing credentials.
- Note: If you are an admin, the system will automatically redirect you to the Admin Panel.

---
© 2026 TeamSync Project. All rights reserved.
