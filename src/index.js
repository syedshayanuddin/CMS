const express = require("express")
const path = require("path")
const bcrypt = require("bcrypt")
const bodyParser = require("body-parser")
const { Student, Lecturer, Class, Attendance, SubjectAssignment, Marks} = require("./config")
const mongoose = require("mongoose")

const app = express()

// Convert data into json
app.use(express.json())
app.use(express.static("views"))

app.use(express.urlencoded({ extended: false }))

// Use EJS as the view engine
app.set("view engine", "ejs")

// static file
app.use(express.static("public"))

// default loading page
app.get("/", (req, res) => {
  res.render("s_login")
})

// --------------------------------------
// ------- ROUTES TO RENDER PAGES -------
// --------------------------------------

app.get("/l_login", (req, res) => {
  res.render("l_login")
})

app.get("/s_login", (req, res) => {
  res.render("s_login")
})

app.get("/add_class", (req, res) => {
  res.render("add_class")
})

app.get("/add_student", (req, res) => {
  res.render("add_student")
})

app.get("/add_lecturer", async (req, res) => {
        const classes = await Class.find({}, "classID");
        res.render("add_lecturer", { classes });
});

app.get("/assign_subjects", (req, res) => {
    res.render("assign_subjects");
});

app.get(`/l_homepage/:username`, (req, res) => {
    res.render("l_homepage");
});

app.get(`/s_homepage/:rollNumber`, (req, res) => {
    res.render("s_homepage");
});


// -------------------------------------------------------------
// --- ROUTES FOR ADDING STUDENTS, LECTURERS AND CLASSES -------
// -------------------------------------------------------------

// API to Fetch Classes
app.get("/api/classes", async (req, res) => {
    try {
        const classes = await Class.find({}, "classID");
        res.json(classes);
    } catch (error) {
        res.status(500).json({ error: "Error fetching classes" });
    }
});

// Route: Add Students to Database
app.post("/api/add-student", async (req, res) => {
    try {
        const { name, rollnumber, password, class: classID } = req.body;

        // Ensure the class exists
        const classExists = await Class.findOne({classID});
        if (!classExists) {
            return res.status(400).json({ message: "Invalid class selected" });
        }
        const newStudent = new Student({ name, rollnumber, password, class: classID });
        await newStudent.save();

        res.status(201).json({ message: "Student added successfully" });
    } catch (error) {
        res.status(500).json({ error: "Error adding student", details: error.message });
    }
});

// Route: Add Classes to Database
app.post("/add-class", async (req, res) => {
    try {
        let { classID, branch, semester, subjects, timeTable } = req.body;

        if (!classID || !branch || !semester || subjects.length === 0) {
            return res.status(400).json({ success: false, message: "All fields are required!" });
        }

        if (!Array.isArray(timeTable) || timeTable.some(tt => typeof tt !== "object")) {
            return res.status(400).json({ success: false, message: "Invalid timeTable format." });
        }

        let newClass = new Class({ classID, branch, semester, subjects, timeTable });
        await newClass.save();
        res.json({ success: true, message: "Class added successfully!" });

    } catch (err) {
        res.status(500).json({ success: false, message: "Server error!", error: err.message });
    }
});

// Route: Add Lecturers to Database
app.post("/api/add-lecturer", async (req, res) => {
    try {
        const { name, username, password, classesTaught } = req.body;
        
        if (!Array.isArray(classesTaught)) {
            return res.status(400).json({ error: "classesTaught must be an array" });
        }

        const newLecturer = new Lecturer({
            name,
            username,
            password,
            classesTaught
        });

        await newLecturer.save();
        res.json({ message: "Lecturer added successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Error adding lecturer", details: error.message });
    }
});

// ------------------------------------------------
// --- SUBJECT-LECTURER ASSIGNMENT ROUTES ---------
// ------------------------------------------------
app.get("/api/subject-assignments", async (req, res) => {
    try {
        const assignments = await SubjectAssignment
            .find()
            .populate('lecturer_id', 'lecturer_id name');
        res.json(assignments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/api/subject-assignments", async (req, res) => {
    try {
        const { classID, subject, lecturer_id } = req.body;

        const classDoc = await Class.findOne({ classID });
        if (!classDoc) return res.status(400).json({ error: "Class not found" });
        if (!classDoc.subjects.includes(subject)) return res.status(400).json({ error: "Subject not found in class" });

        const lecturer = await Lecturer.findOne({ lecturer_id });
        if (!lecturer) return res.status(400).json({ error: "Lecturer not found" });

        const assignment = new SubjectAssignment({
            classID,
            subject,
            lecturer_id,
            lecturer_name: lecturer.name
        });

        await assignment.save();
        res.json({ message: "Subject assigned successfully" });

    } catch (error) {
        if (error.code === 11000) {
            res.status(400).json({ error: "This subject is already assigned" });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

app.get("/api/lecturers", async (req, res) => {
    try {
        const lecturers = await Lecturer.find({}, { _id: 0, lecturer_id: 1, name: 1 });
        res.json(lecturers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/api/classes/:classID", async (req, res) => {
    try {
        const classDoc = await Class.findOne({ classID: req.params.classID });
        if (!classDoc) {
            return res.status(404).json({ error: "Class not found" });
        }
        res.json(classDoc);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ------------------------------------------------
// --------- LECTURER DASHBOARD ROUTES ------------
// ------------------------------------------------
// Get subject assignment for lecturer and class
app.get('/api/subject-assignments/find', async (req, res) => {
    const { classID, lecturer_id } = req.query;
    const assignment = await SubjectAssignment.findOne({ classID, lecturer_id });
    res.json(assignment);
});

// Updated class schedule route
app.get('/api/class/schedule', async (req, res) => {
    try {
        const { classID, date, subject } = req.query;
        const classDoc = await Class.findOne({ classID });
        const dayIndex = new Date(date).getDay() - 1;

        const daySchedule = classDoc.timeTable[dayIndex];
        
        const matchingHours = [];
        daySchedule.hours.forEach((subj, hour) => {
            if (subj === subject) {
                matchingHours.push(hour);
            }
        });
        
        res.json({ hours: matchingHours });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get students for a class
app.get('/api/students/:classID', async (req, res) => {
    const students = await Student.find({ class: req.params.classID })
                                .sort('rollnumber');
    res.json(students);
});

// Check if attendance is already marked
app.get('/api/attendance/check', async (req, res) => {
    const { classID, date, hour } = req.query;
    const attendance = await Attendance.findOne({
        classID,
        date: new Date(date),
        'hourWiseAttendance': {
            $elemMatch: {
                hour: hour,
                updated: true
            }
        }
    });
    res.json({ updated: !!attendance });
});

// Mark attendance
app.post('/api/attendance/mark', async (req, res) => {
    try {
        const { classID, date, hour, subject, lecturer_id, student_data } = req.body;
        
        const existingAttendance = await Attendance.findOne({
            classID,
            date: new Date(date),
            'hourWiseAttendance': {
                $elemMatch: {
                    hour: hour,
                    updated: true
                }
            }
        });

        if (existingAttendance) {
            return res.status(400).json({ 
                success: false, 
                error: 'Attendance already marked for this hour' 
            });
        }

        let attendance = await Attendance.findOne({
            classID,
            date: new Date(date)
        });

        if (!attendance) {
            attendance = new Attendance({
                classID,
                day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(date).getDay()],
                date: new Date(date),
                hourWiseAttendance: [],
                totalHours: 0
            });
        }

        attendance.hourWiseAttendance.push({
            hour,
            updated: true,
            subject,
            lecturer_id,
            student_data
        });
        attendance.totalHours = attendance.hourWiseAttendance.length;

        await attendance.save();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get lecturer by username
app.get('/api/lecturer/:username', async (req, res) => {
    try {
        const lecturer = await Lecturer.findOne({ username: req.params.username });
        if (!lecturer) {
            return res.status(404).json({ error: 'Lecturer not found' });
        }
        res.json(lecturer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --------- Subsection: Route for Marks Handling ------------
// Get student marks
app.get('/api/marks/:classID/:subject', async (req, res) => {
    try {
        const students = await Student.find({ class: req.params.classID });
        const marksPromises = students.map(async (student) => {
            const markRecord = await Marks.findOne({ student: student._id, 'marks.subject': req.params.subject });
            return {
                student_id: student._id,
                rollnumber: student.rollnumber,
                name: student.name,
                marks: markRecord ? markRecord.marks.find(m => m.subject === req.params.subject) : {
                    subject: req.params.subject,
                    CIE1: 0,
                    CIE2: 0,
                    Assignment: 0
                }
            };
        });
        const results = await Promise.all(marksPromises);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Save/Update marks
app.post('/api/marks/update', async (req, res) => {
    try {
        const { student_id, subject, CIE1, CIE2, Assignment } = req.body;
        
        let markRecord = await Marks.findOne({ student: student_id });
        
        if (!markRecord) {
            markRecord = new Marks({
                student: student_id,
                marks: [{
                    subject,
                    CIE1,
                    CIE2,
                    Assignment
                }]
            });
        } else {
            const subjectIndex = markRecord.marks.findIndex(m => m.subject === subject);
            if (subjectIndex >= 0) {
                markRecord.marks[subjectIndex] = {
                    subject,
                    CIE1,
                    CIE2,
                    Assignment
                };
            } else {
                markRecord.marks.push({
                    subject,
                    CIE1,
                    CIE2,
                    Assignment
                });
            }
        }
        
        await markRecord.save();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});




// ------------------------------------------------
// --------- STUDENT DASHBOARD ROUTES ------------
// ------------------------------------------------



// ------------------------------------------------
// ---------- ROUTES FOR LOGGING IN ---------------
// ------------------------------------------------

// Route: Login for students
app.post("/login", async (req, res) => {
    try {
        const rollNumber = req.headers.rollnumber;
        const password = req.headers.password;
        
        const student = await Student.findOne({ rollnumber: rollNumber });
        if (!student) {
            return res.json({ success: false, error: "Roll Number is Invalid" });
        }

        if (password !== student.password) {
            return res.json({ success: false, error: "Invalid password" });
        }

        res.json({ success: true, redirect: `/s_homepage/${rollNumber}` });
    } catch (error) {
        res.json({ success: false, error: "Login failed" });
    }
});

app.post("/lecturer-login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const lecturer = await Lecturer.findOne({ username });
        
        if (!lecturer) {
            return res.status(401).json({ error: "Invalid username" });
        }
        
        if (password !== lecturer.password) {
            return res.status(401).json({ error: "Invalid password" });
        }
        
        res.json({ redirect: `/l_homepage/${username}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});




const port = 5500
app.listen(port, () => {
  console.log(`Server running on port: ${port}`)
})