# 🛡️ System Monitoring and Access Control Application

## Overview

This application provides a **backend system** for monitoring user activity and managing secure access to desktop systems. It captures screenshots, logs application session data, and enforces strict user authentication.

## ✨ Features

- 📸 **Screenshot Monitoring**
  - Captures **2 random screenshots per minute**
  - Screenshots are tagged with session information
  - Secure transmission and storage

- 📊 **Session Data Reporting**
  - Monitors and logs every application used on the system
  - Captures:
    - Application name
    - Start time
    - End time
    - Duration
  - Sends data to admin panel in real time

- 🔐 **Access Control with Login**
  - Enforces system access only after successful login
  - Tracks session start and end (on logout or shutdown)
  - JWT-based authentication

---

## 🔧 Tech Stack
- **Frontend**: React.js,
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT
- **Screenshot Capturing**: [screenshot-desktop](https://www.npmjs.com/package/screenshot-desktop)
- **Process Monitoring**: [ps-list](https://www.npmjs.com/package/ps-list)

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 16.x
- MongoDB running locally or via cloud (MongoDB Atlas)
- Git

### Installation

```bash
git clone https://github.com/Mshweta11/system-monitoring-app.git
cd system-monitoring-app
npm install


### Environment Variables
###create .env file
PORT=5000
MONGO_URI=mongodb://localhost:27017/system_monitoring
JWT_SECRET=your_jwt_secret

###Folder structure
system-monitoring-app/
│
├── controllers/         # Logic for handling API requests
├── middleware/          # Authentication & session middleware
├── models/              # Mongoose models
├── routes/              # API endpoints
├── services/            # Screenshot and monitoring logic
├── utils/               # Utility functions
├── test-monitoring.js   # Script to run a full system test
├── app.js            # Entry point
└── .env 
└── node-moduule                # Environment variables
└── package.json
└── package-lock.json
└── utils
└── frontend
     └── node-module
     └── package.json
     └── src
     └── component
     └── build
          └── static     


### COMMANDS TO BE RUN
### Start Mongodb server
- win+R
- services.msc + ENTER
- Select MongoDB Server from the list ,right click and then click on start.

### Start Backend
node app.js
node create-test-user.js

### 2. Start Frontend
cd frontend
npm start

### ADD proxy link manually iside the frontend/package.json file
### for local server
"proxy": "http://localhost:5000"
