// Handle task submission
document.getElementById('taskForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const location = document.getElementById('location').value;
    const description = document.getElementById('description').value;
    const urgency = document.getElementById('urgency').value;
    
    try {
        const response = await fetch('/report-task', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ location, description, urgency }),
        });
        
        if (response.ok) {
            alert('Task reported successfully!');
            document.getElementById('taskForm').reset();
            loadTasks(); // Reload tasks after submission
        } else {
            alert('Failed to report task.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while reporting the task.');
    }
});

// Load tasks from the backend
async function loadTasks() {
    try {
        const response = await fetch('/tasks');
        const tasks = await response.json();
        const taskList = document.getElementById('taskList');
        
        taskList.innerHTML = '';
        
        tasks.forEach((task, index) => {
            if (task[4] === 'Pending') {
                const li = document.createElement('li');
                li.innerHTML = `
                    <strong>Location:</strong> ${task[0]} <br>
                    <strong>Description:</strong> ${task[1]} <br>
                    <strong>Urgency:</strong> ${task[2]} <br>
                    <button onclick="takeTask(${index})">Take Task</button>
                `;
                taskList.appendChild(li);
            }
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

// Take a task
async function takeTask(index) {
    const technician = prompt('Enter your name:');
    
    if (!technician) {
        alert('Technician name is required!');
        return;
    }

    try {
        const response = await fetch('/take-task', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ index, technician }),
        });
        
        if (response.ok) {
            alert('Task assigned to you!');
            loadTasks(); // Reload tasks after assignment
        } else {
            alert('Failed to take task.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while taking the task.');
    }
}

// Initial load of tasks
loadTasks();
