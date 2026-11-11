
const STORAGE_KEY = "streaklyData";

let appData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
    tasks: {},
    theme: "light"
};

let editingTaskId = null;

const today = getDateKey();

const taskModal = new bootstrap.Modal(
    document.getElementById("taskModal")
);


// ELEMENTS

const taskList = document.getElementById("taskList");
const taskInput = document.getElementById("taskInput");
const taskFormError = document.getElementById("inputError");


// DATE FUNCTIONS

function getDateKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");

    return `${y}-${m}-${d}`;
}

function getDateObject(key) {
    return new Date(key + "T12:00:00");
}

function getPreviousDate(key) {
    const date = getDateObject(key);
    date.setDate(date.getDate() - 1);

    return getDateKey(date);
}

function getTodayTasks() {
    return appData.tasks[today] || [];
}

function hasCompletedTask(key) {
    return (appData.tasks[key] || []).some(task => task.completed);
}


// SAVE DATA

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}


// OPEN MODAL

function openTaskModal(taskId = null) {

    editingTaskId = taskId;

    taskInput.value = "";
    taskFormError.textContent = "";

    if (taskId) {

        const task = getTodayTasks().find(
            item => item.id === taskId
        );

        if (!task) return;

        taskInput.value = task.name;

        document.getElementById("modalTitle").textContent =
            "Edit Task";

        document.getElementById("saveTaskBtn").textContent =
            "Update Task";

    } else {

        document.getElementById("modalTitle").textContent =
            "Create New Task";

        document.getElementById("saveTaskBtn").textContent =
            "Save Task";
    }

    taskModal.show();

    setTimeout(() => taskInput.focus(), 200);
}


// ADD / EDIT TASK

document.getElementById("saveTaskBtn").addEventListener(
    "click",
    function () {

        const name = taskInput.value.trim();

        if (!name) {
            taskFormError.textContent =
                "Please enter a task name.";
            return;
        }

        if (!appData.tasks[today]) {
            appData.tasks[today] = [];
        }

        if (editingTaskId) {

            const task = getTodayTasks().find(
                item => item.id === editingTaskId
            );

            if (task) {
                task.name = name;
            }

        } else {

            appData.tasks[today].push({
                id: crypto.randomUUID(),
                name: name,
                completed: false,
                createdAt: new Date().toISOString()
            });

        }

        saveData();
        taskModal.hide();
        renderApp();

    }
);


// BUTTON EVENTS

document.getElementById("openTaskModal")
    .addEventListener("click", () => openTaskModal());

document.getElementById("emptyAddBtn")
    .addEventListener("click", () => openTaskModal());

taskInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        event.preventDefault();
        document.getElementById("saveTaskBtn").click();
    }
});


// TOGGLE TASK

function toggleTask(taskId, checked) {

    const task = getTodayTasks().find(
        item => item.id === taskId
    );

    if (!task) return;

    task.completed = checked;

    saveData();
    renderApp();
}


// DELETE TASK

function deleteTask(taskId) {

    const confirmed = confirm(
        "Are you sure you want to delete this task?"
    );

    if (!confirmed) return;

    appData.tasks[today] = getTodayTasks().filter(
        task => task.id !== taskId
    );

    saveData();
    renderApp();
}


// RENDER TASKS

function renderTasks() {

    const tasks = getTodayTasks();

    taskList.innerHTML = "";

    document.getElementById("emptyState").style.display =
        tasks.length === 0 ? "block" : "none";

    tasks.forEach(task => {

        const item = document.createElement("div");

        item.className = "task-item";

        if (task.completed) {
            item.classList.add("completed");
        }

        // Task information

        const info = document.createElement("div");
        info.className = "task-info";

        const checkbox = document.createElement("input");

        checkbox.type = "checkbox";
        checkbox.className = "task-check";
        checkbox.checked = task.completed;

        checkbox.addEventListener("change", () => {
            toggleTask(task.id, checkbox.checked);
        });

        const details = document.createElement("div");

        const name = document.createElement("div");
        name.className = "task-name";
        name.textContent = task.name;

        const time = document.createElement("div");
        time.className = "task-time";

        time.textContent = task.completed
            ? "Completed"
            : "Pending";

        details.append(name, time);

        info.append(checkbox, details);

        // Action buttons

        const actions = document.createElement("div");
        actions.className = "task-actions";

        const editBtn = document.createElement("button");

        editBtn.className = "action-btn";
        editBtn.innerHTML = '<i class="bi bi-pencil"></i>';
        editBtn.title = "Edit task";

        editBtn.addEventListener("click", () => {
            openTaskModal(task.id);
        });

        const deleteBtn = document.createElement("button");

        deleteBtn.className = "action-btn delete";
        deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
        deleteBtn.title = "Delete task";

        deleteBtn.addEventListener("click", () => {
            deleteTask(task.id);
        });

        actions.append(editBtn, deleteBtn);

        item.append(info, actions);

        taskList.appendChild(item);

    });

}


// STREAK CALCULATION

function calculateCurrentStreak() {

    let currentDay = today;

    // If today is not completed, check yesterday.
    if (!hasCompletedTask(currentDay)) {

        currentDay = getPreviousDate(currentDay);

        if (!hasCompletedTask(currentDay)) {
            return 0;
        }
    }

    let streak = 0;

    while (hasCompletedTask(currentDay)) {

        streak++;

        currentDay = getPreviousDate(currentDay);
    }

    return streak;
}


// LONGEST STREAK

function calculateLongestStreak() {

    const completedDates = Object.keys(appData.tasks)
        .filter(date => hasCompletedTask(date))
        .sort();

    let longest = 0;
    let current = 0;
    let previous = null;

    completedDates.forEach(date => {

        if (
            previous &&
            getPreviousDate(date) === previous
        ) {
            current++;
        } else {
            current = 1;
        }

        longest = Math.max(longest, current);

        previous = date;

    });

    return longest;
}


// TOTAL COMPLETED TASKS

function calculateTotalCompleted() {

    return Object.values(appData.tasks)
        .flat()
        .filter(task => task.completed)
        .length;
}


// UPDATE STATISTICS

function updateStats() {

    const tasks = getTodayTasks();

    const completed = tasks.filter(
        task => task.completed
    ).length;

    const percentage = tasks.length
        ? Math.round((completed / tasks.length) * 100)
        : 0;

    document.getElementById("currentStreak").innerHTML =
        `${calculateCurrentStreak()} <small>Days</small>`;

    document.getElementById("longestStreak").innerHTML =
        `${calculateLongestStreak()} <small>Days</small>`;

    document.getElementById("totalCompleted").textContent =
        calculateTotalCompleted();

    document.getElementById("progressText").textContent =
        percentage + "%";

    document.getElementById("progressSubtitle").textContent =
        tasks.length === 0
            ? "Start your day"
            : completed === tasks.length
                ? "All tasks completed!"
                : `${tasks.length - completed} tasks remaining`;

    document.getElementById("taskCount").textContent =
        `${completed} / ${tasks.length}`;

    document.getElementById("progressBar").style.width =
        percentage + "%";

}


// WEEKLY PROGRESS

function renderWeeklyProgress() {

    const weekGrid = document.getElementById("weekGrid");

    weekGrid.innerHTML = "";

    const todayDate = getDateObject(today);

    for (let i = 6; i >= 0; i--) {

        const date = new Date(todayDate);

        date.setDate(date.getDate() - i);

        const key = getDateKey(date);

        const isToday = key === today;
        const isDone = hasCompletedTask(key);

        const day = document.createElement("div");

        day.className = "week-day";

        if (isToday) {
            day.classList.add("today");
        }

        const dayName = document.createElement("span");
        dayName.className = "day-name";
        dayName.textContent = date.toLocaleDateString(
            "en-IN", { weekday: "short" }
        );

        const dayNumber = document.createElement("span");
        dayNumber.className = "day-number";
        dayNumber.textContent = date.getDate();

        const status = document.createElement("div");
        status.className = "day-status";

        if (isDone) {

            status.classList.add("done");
            status.innerHTML = '<i class="bi bi-check-lg"></i>';

        } else if (isToday) {

            status.classList.add("future");
            status.textContent = "•";

        } else {

            status.classList.add("missed");
            status.innerHTML = '<i class="bi bi-x-lg"></i>';

        }

        day.append(dayName, dayNumber, status);

        weekGrid.appendChild(day);

    }

}


// THEME TOGGLE

function applyTheme() {

    document.body.classList.toggle(
        "dark-mode",
        appData.theme === "dark"
    );

    const icon = document.querySelector("#themeBtn i");

    icon.className = appData.theme === "dark"
        ? "bi bi-sun"
        : "bi bi-moon-stars";

}

document.getElementById("themeBtn").addEventListener(
    "click",
    () => {

        appData.theme =
            appData.theme === "dark" ? "light" : "dark";

        saveData();
        applyTheme();

    }
);


// DATE DISPLAY

function renderDate() {

    document.getElementById("currentDate").textContent =
        new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });

}


// INITIALIZE APP

function renderApp() {

    renderTasks();

    updateStats();

    renderWeeklyProgress();

}

renderDate();
applyTheme();
renderApp();
