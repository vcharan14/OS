function generateProcessInputs() {
    const count = document.getElementById("processCount").value;
    const processInputs = document.getElementById("processInputs");
    processInputs.innerHTML = ""; // Clear existing inputs

    for (let i = 0; i < count; i++) {
        const processDiv = document.createElement("div");
        processDiv.className = "process-input";

        processDiv.innerHTML = `
            <label>Process ${i + 1} Arrival Time:</label>
            <input type="number" class="arrivalTime" placeholder="e.g., 0" required>

            <label>Process ${i + 1} Burst Time:</label>
            <input type="number" class="burstTime" placeholder="e.g., 4" required>

            <label>Process ${i + 1} Priority (Optional):</label>
            <input type="number" class="priority" placeholder="e.g., 1">
        `;
        processInputs.appendChild(processDiv);
    }
}

function simulateScheduling() {
    document.getElementById("results").innerHTML = "";
    document.getElementById("ganttChart").innerHTML = "";

    const count = document.getElementById("processCount").value;
    const arrivalTime = [];
    const burstTime = [];
    const priority = [];

    for (let i = 0; i < count; i++) {
        arrivalTime.push(Number(document.querySelectorAll(".arrivalTime")[i].value));
        burstTime.push(Number(document.querySelectorAll(".burstTime")[i].value));
        priority.push(Number(document.querySelectorAll(".priority")[i].value) || null);
    }

    let processes = arrivalTime.map((arrival, index) => ({
        id: index + 1,
        arrival,
        burst: burstTime[index],
        priority: priority[index],
        waitingTime: 0,
        turnaroundTime: 0,
        responseTime: 0,
        remainingBurst: burstTime[index]
    }));

    let ganttData;
    const algorithm = document.getElementById("algorithm").value;
    switch (algorithm) {
        case "FCFS":
            ganttData = FCFS(processes);
            break;
        case "SJF":
            ganttData = SJF(processes);
            break;
        case "Priority":
            ganttData = PriorityScheduling(processes);
            break;
        case "RoundRobin":
            ganttData = RoundRobin(processes, 2); // Assuming a quantum of 2
            break;
        case "SRTF":
            ganttData = SRTF(processes);
            break;
    }

    displayResults(processes);
    generateGanttChart(ganttData);
}

function FCFS(processes) {
    processes.sort((a, b) => a.arrival - b.arrival);
    let time = 0;
    let ganttData = [];
    processes.forEach(process => {
        if (time < process.arrival) {
            time = process.arrival;
        }
        process.waitingTime = time - process.arrival;
        ganttData.push({ id: process.id, duration: process.burst });
        time += process.burst;
        process.turnaroundTime = process.waitingTime + process.burst;
        process.responseTime = process.waitingTime;
    });
    return ganttData;
}

function SJF(processes) {
    let time = 0;
    let ganttData = [];
    while (processes.length > 0) {
        let availableProcesses = processes.filter(p => p.arrival <= time);
        if (availableProcesses.length === 0) {
            time++;
            continue;
        }
        let shortestProcess = availableProcesses.reduce((prev, curr) => (prev.burst < curr.burst ? prev : curr));
        shortestProcess.waitingTime = time - shortestProcess.arrival;
        ganttData.push({ id: shortestProcess.id, duration: shortestProcess.burst });
        time += shortestProcess.burst;
        shortestProcess.turnaroundTime = shortestProcess.waitingTime + shortestProcess.burst;
        shortestProcess.responseTime = shortestProcess.waitingTime;
        processes = processes.filter(p => p.id !== shortestProcess.id);
    }
    return ganttData;
}

function PriorityScheduling(processes) {
    let time = 0;
    let ganttData = [];
    while (processes.length > 0) {
        let availableProcesses = processes.filter(p => p.arrival <= time);
        if (availableProcesses.length === 0) {
            time++;
            continue;
        }
        let highestPriorityProcess = availableProcesses.reduce((prev, curr) => (prev.priority < curr.priority ? prev : curr));
        highestPriorityProcess.waitingTime = time - highestPriorityProcess.arrival;
        ganttData.push({ id: highestPriorityProcess.id, duration: highestPriorityProcess.burst });
        time += highestPriorityProcess.burst;
        highestPriorityProcess.turnaroundTime = highestPriorityProcess.waitingTime + highestPriorityProcess.burst;
        highestPriorityProcess.responseTime = highestPriorityProcess.waitingTime;
        processes = processes.filter(p => p.id !== highestPriorityProcess.id);
    }
    return ganttData;
}

function RoundRobin(processes, quantum) {
    let time = 0;
    let ganttData = [];
    let queue = [...processes];
    while (queue.length > 0) {
        let process = queue.shift();
        if (process.arrival <= time) {
            let executedTime = Math.min(process.remainingBurst, quantum);
            ganttData.push({ id: process.id, duration: executedTime });
            process.remainingBurst -= executedTime;
            time += executedTime;

            if (process.remainingBurst > 0) {
                queue.push(process);
            } else {
                process.turnaroundTime = time - process.arrival;
                process.waitingTime = process.turnaroundTime - process.burst;
                process.responseTime = process.waitingTime;
            }
        } else {
            time++;
            queue.push(process);
        }
    }
    return ganttData;
}

function SRTF(processes) {
    let time = 0;
    let ganttData = [];
    while (processes.length > 0) {
        let availableProcesses = processes.filter(p => p.arrival <= time);
        if (availableProcesses.length === 0) {
            time++;
            continue;
        }
        let shortestProcess = availableProcesses.reduce((prev, curr) => (prev.remainingBurst < curr.remainingBurst ? prev : curr));
        ganttData.push({ id: shortestProcess.id, duration: 1 });
        shortestProcess.remainingBurst -= 1;
        time++;

        if (shortestProcess.remainingBurst === 0) {
            shortestProcess.turnaroundTime = time - shortestProcess.arrival;
            shortestProcess.waitingTime = shortestProcess.turnaroundTime - shortestProcess.burst;
            shortestProcess.responseTime = shortestProcess.waitingTime;
            processes = processes.filter(p => p.id !== shortestProcess.id);
        }
    }
    return ganttData;
}

function displayResults(processes) {
    let results = "<strong>Process Execution Details:</strong><br>";
    processes.forEach(p => {
        results += `Process ${p.id}: Waiting Time = ${p.waitingTime}, Turnaround Time = ${p.turnaroundTime}<br>`;
    });
    document.getElementById("results").innerHTML = results;
}

function generateGanttChart(ganttData) {
    const ganttChart = document.getElementById("ganttChart");
    ganttData.forEach(segment => {
        const div = document.createElement("div");
        div.className = "gantt-bar";
        div.style.width = `${segment.duration * 50}px`; // Adjust scaling for display
        div.style.backgroundColor = getRandomColor();
        div.innerText = `P${segment.id}`;
        ganttChart.appendChild(div);
    });
}

function getRandomColor() {
    const colors = ['#FF5733', '#33FF57', '#3357FF', '#F33FF5', '#FF5733', '#57FF33', '#5733FF'];
    return colors[Math.floor(Math.random() * colors.length)];
}
