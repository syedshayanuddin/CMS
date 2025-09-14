# College Management System (CMS)

## Overview
The College Management System (CMS) is a web-based application designed to streamline academic data management. It provides dedicated dashboards for students, lecturers, and administrators to manage attendance, marks, and other academic records efficiently.

---

## Features

### Student Dashboard
- View personal details.
- Check daily attendance records and overall attendance percentage.
- View subject-wise attendance breakdown.
- View marks for each subject in real-time.

### Lecturer Dashboard
- View teaching timetable.
- Take attendance for classes on specific dates.
- Upload and update student marks.
- Access analytics for attendance and marks of classes taught.

### Admin Dashboard
- Manage student, lecturer, and class records.
- Assign lecturers to subjects and classes.
- Monitor overall academic data.

---

## Setup

1. Clone the repository:
   ```sh
   git clone <REPO_URL>
   cd academic-management-portal
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Configure MongoDB connection in `.env` file:
   ```sh
   MONGODB_URI=<your-mongodb-uri>
   ```

4. Start the server:
   ```sh
   nodemon src/index.js
   ```

## Usage

### Student Dashboard
- Login as a student to view attendance, marks, and personal details.
<p align="center">
<img src="screenshots/student1.png" width="700">
<img src="screenshots/student2.png" width="700">
<img src="screenshots/student3.png" width="700">
</p>


### Lecturer Dashboard
- Login as a lecturer to take attendance, upload marks, and view analytics.
<p align="center">
<img src="screenshots/lec1.png" width="700">
<img src="screenshots/lec2.png" width="700">
<img src="screenshots/lec3.png" width="700">
</p>
<p align="center">
  <img src="screenshots/lec4.png" width="45%">
  <img src="screenshots/lec5.png" width="45%">
</p>

### Admin Dashboard
- Login as an admin to manage users, subjects, and classes.
<p align="center">
  <img src="screenshots/admin1.png" width="45%">
  <img src="screenshots/admin2.png" width="45%">
</p>
<p align="center">
  <img src="screenshots/admin3.png" width="45%">
  <img src="screenshots/admin4.png" width="45%">
</p>
