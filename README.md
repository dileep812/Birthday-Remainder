# 🎂 Birthday & Event Reminder System

A robust Node.js automation service that sends timely email notifications for birthdays, anniversaries, and festivals. Built with MongoDB and Node-Cron, it handles both yearly recurring events and one-time notifications.

**Live Demo:** [https://birthday-remainder-zodg.onrender.com](https://birthday-remainder-zodg.onrender.com)

![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?logo=mongodb&logoColor=white)
![Node.js](https://img.shields.io/badge/node.js-%3E%3D14.0.0-green.svg)
![Render](https://img.shields.io/badge/Render-%2346E3B7.svg?logo=render&logoColor=white)

## 🚀 Features

- **Automated Scheduling:** Daily notifications sent at 12:00 AM, 9:00 AM, and 9:00 PM IST.
- **Smart Filtering:** Uses MongoDB aggregation to match events by month and day, ignoring the birth year for recurring milestones.
- **Event Management:** - **Recurring:** Automatically reminds you every year (Birthdays, Anniversaries).
  - **Non-Recursive:** Sends a reminder for a specific year and auto-deletes the record after execution.
- **Dynamic HTML Templates:** Color-coded email designs for each event type (Birthday, Anniversary, Festival).
- **Timezone Optimized:** Fixed to **Asia/Kolkata (IST)** regardless of server location.

## 📋 Prerequisites

- MongoDB Atlas URI
- SMTP Server (Gmail App Password or Mailtrap)
- Node.js installed locally (for development)

## 🔧 Deployment Note (Render Free Tier)

Since this project relies on **Node-Cron**, the server must remain active. On Render's free tier, the service "sleeps" after inactivity. 

**Recommended Fix:** Use a free "cron-ping" service like [Cron-job.org](https://cron-job.org/) to hit your URL every 10 minutes. This prevents the server from sleeping and ensures your 9 PM / 12 AM / 9 AM notifications are sent on time.

## 🛠️ Tech Stack

- **Backend:** Node.js (ES Modules) & Express
- **Database:** MongoDB via Mongoose
- **Email:** Nodemailer
- **Task Runner:** Node-Cron

## 🔧 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/dileep812/Birthday-Remainder.git](https://github.com/dileep812/Birthday-Remainder.git)
   cd Birthday-Remainder
