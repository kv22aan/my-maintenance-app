const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Set up storage for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Task file path
const taskFilePath = path.join(__dirname, 'data', 'tasks.xlsx');

// Helper function to load tasks
const loadTasks = () => {
    if (!fs.existsSync(taskFilePath)) {
        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.aoa_to_sheet([['Location', 'Description', 'Urgency', 'Technician', 'Status', 'Time Taken (mins)']]);
        xlsx.utils.book_append_sheet(wb, ws, 'Tasks');
        xlsx.writeFile(wb, taskFilePath);
    }
    const wb = xlsx.readFile(taskFilePath);
    const ws = wb.Sheets['Tasks'];
    return xlsx.utils.sheet_to_json(ws, { header: 1 }).slice(1); // Skip header
};

// Helper function to save tasks
const saveTasks = (tasks) => {
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.aoa_to_sheet([['Location', 'Description', 'Urgency', 'Technician', 'Status', 'Time Taken (mins)'], ...tasks]);
    xlsx.utils.book_append_sheet(wb, ws, 'Tasks');
    xlsx.writeFile(wb, taskFilePath);
};

// API to report a task
app.post('/report-task', (req, res) => {
    const { location, description, urgency } = req.body;
    const tasks = loadTasks();
    tasks.push([location, description, urgency, '', 'Pending', '']);
    saveTasks(tasks);
    res.sendStatus(200);
});

// API to get tasks
app.get('/tasks', (req, res) => {
    const tasks = loadTasks();
    res.json(tasks);
});

// API to take a task
app.post('/take-task', (req, res) => {
    const { index, technician } = req.body;
    const tasks = loadTasks();
    if (tasks[index][3] === '') { // If no technician assigned
        tasks[index][3] = technician;
        tasks[index][4] = 'In Progress';
        saveTasks(tasks);
        res.sendStatus(200);
    } else {
        res.status(400).send('Task already taken');
    }
});

// API to complete a task
app.post('/complete-task', (req, res) => {
    const { index, timeTaken } = req.body;
    const tasks = loadTasks();
    tasks[index][4] = 'Completed';
    tasks[index][5] = timeTaken;
    saveTasks(tasks);
    res.sendStatus(200);
});

// API to send summary email
app.post('/send-summary', (req, res) => {
    const tasks = loadTasks();
    const pendingTasks = tasks.filter(task => task[4] === 'Pending');
    const emailBody = `Pending Tasks Summary:\n\n${pendingTasks.map(task => `Location: ${task[0]}, Description: ${task[1]}, Urgency: ${task[2]}`).join('\n')}`;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'your-email@gmail.com',
            pass: 'your-email-password'
        }
    });

    const mailOptions = {
        from: 'your-email@gmail.com',
        to: 'manager-email@example.com',
        subject: 'Pending Maintenance Tasks Summary',
        text: emailBody
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(error);
            res.status(500).send('Error sending email');
        } else {
            res.send('Email sent: ' + info.response);
        }
    });
});

// Start server

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
