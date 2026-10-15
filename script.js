
const taskForm = document.getElementById("task-form");
const taskTitleInput = document.getElementById("task-title");
const taskPriorityInput = document.getElementById("task-priority");
const taskDateInput = document.getElementById("task-date");
const taskList = document.getElementById("task-list");

const openFormButton = document.getElementById("open-form");
const cancelFormButton = document.getElementById("cancel-form");
const submitTaskButton = document.getElementById("submit-task");

const totalCount = document.getElementById("total-count");
const completedCount = document.getElementById("completed-count");
const pendingCount = document.getElementById("pending-count");
const progressPercent = document.getElementById("progress-percent");
const progressFill = document.getElementById("progress-fill");
const todayDate = document.getElementById("today-date");

let tasks = [];

try {
  const savedTasks = JSON.parse(localStorage.getItem("taskflow-tasks"));
  if (Array.isArray(savedTasks)) {
    tasks = savedTasks.filter(task =>
      task &&
      typeof task.id === "string" &&
      typeof task.title === "string" &&
      ["low", "medium", "high"].includes(task.priority) &&
      typeof task.completed === "boolean"
    );
  }
} catch {
  tasks = [];
}

let currentFilter = "all";
let editingTaskId = null;

todayDate.textContent = new Intl.DateTimeFormat("en", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric"
}).format(new Date());

function saveTasks() {
  localStorage.setItem("taskflow-tasks", JSON.stringify(tasks));
}

function updateStats() {
  const completed = tasks.filter(task => task.completed).length;
  const pending = tasks.length - completed;
  const percentage = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0;

  totalCount.textContent = tasks.length;
  completedCount.textContent = completed;
  pendingCount.textContent = pending;
  progressPercent.textContent = `${percentage}%`;
  progressFill.style.width = `${percentage}%`;
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function renderTasks() {
  taskList.replaceChildren();

  const filteredTasks = tasks.filter(task => {
    if (currentFilter === "pending") return !task.completed;
    if (currentFilter === "completed") return task.completed;
    return true;
  });

  if (filteredTasks.length === 0) {
    const emptyState = createElement("div", "empty-state");
    const heading = createElement(
      "strong",
      "",
      currentFilter === "completed"
        ? "No completed tasks yet"
        : currentFilter === "pending"
          ? "You're all caught up!"
          : "Your task list is empty"
    );

    const message = createElement(
      "p",
      "",
      currentFilter === "all"
        ? "Add your first task and start making progress."
        : "Try another filter or add a new task."
    );

    emptyState.append(heading, message);
    taskList.append(emptyState);
    updateStats();
    return;
  }

  filteredTasks.forEach(task => {
    const item = createElement(
      "article",
      `task-item${task.completed ? " is-completed" : ""}`
    );

    const checkbox = createElement("input", "task-check");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute(
      "aria-label",
      `Mark ${task.title} as ${task.completed ? "pending" : "completed"}`
    );

    checkbox.addEventListener("change", () => {
      task.completed = checkbox.checked;
      saveTasks();
      renderTasks();
    });

    const details = createElement("div", "task-details");
    const title = createElement("p", "task-title", task.title);
    const meta = createElement("div", "task-meta");

    const priorityLabels = {
      low: "Low priority",
      medium: "Medium priority",
      high: "High priority"
    };

    const priority = createElement(
      "span",
      `priority priority-${task.priority}`,
      priorityLabels[task.priority]
    );

    meta.append(priority);

    if (task.dueDate) {
      const dateLabel = createElement(
        "span",
        "",
        `Due: ${formatDate(task.dueDate)}`
      );
      meta.append(dateLabel);
    }

    details.append(title, meta);

    const actions = createElement("div", "task-actions");

    const editButton = createElement("button", "icon-button", "✎");
    editButton.type = "button";
    editButton.setAttribute("aria-label", `Edit ${task.title}`);
    editButton.title = "Edit task";

    editButton.addEventListener("click", () => {
      editingTaskId = task.id;
      taskTitleInput.value = task.title;
      taskPriorityInput.value = task.priority;
      taskDateInput.value = task.dueDate || "";
      submitTaskButton.textContent = "Update task";
      taskForm.classList.remove("hidden");
      taskTitleInput.focus();
      taskForm.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    const deleteButton = createElement("button", "icon-button delete", "×");
    deleteButton.type = "button";
    deleteButton.setAttribute("aria-label", `Delete ${task.title}`);
    deleteButton.title = "Delete task";

    deleteButton.addEventListener("click", () => {
      tasks = tasks.filter(item => item.id !== task.id);
      saveTasks();
      renderTasks();
    });

    actions.append(editButton, deleteButton);
    item.append(checkbox, details, actions);
    taskList.append(item);
  });

  updateStats();
}

function resetForm() {
  taskForm.reset();
  editingTaskId = null;
  submitTaskButton.textContent = "Save task";
}

openFormButton.addEventListener("click", () => {
  resetForm();
  taskForm.classList.remove("hidden");
  taskTitleInput.focus();
});

cancelFormButton.addEventListener("click", () => {
  resetForm();
  taskForm.classList.add("hidden");
});

taskForm.addEventListener("submit", event => {
  event.preventDefault();

  const title = taskTitleInput.value.trim();

  if (!title) {
    taskTitleInput.focus();
    return;
  }

  if (editingTaskId) {
    const task = tasks.find(item => item.id === editingTaskId);

    if (task) {
      task.title = title;
      task.priority = taskPriorityInput.value;
      task.dueDate = taskDateInput.value;
    }
  } else {
    tasks.unshift({
      id: crypto.randomUUID(),
      title,
      priority: taskPriorityInput.value,
      dueDate: taskDateInput.value,
      completed: false
    });
  }

  saveTasks();
  resetForm();
  taskForm.classList.add("hidden");
  currentFilter = "all";

  document.querySelectorAll(".filter-button").forEach(button => {
    button.classList.toggle("active", button.dataset.filter === "all");
  });

  renderTasks();
});

document.querySelectorAll(".filter-button").forEach(button => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;

    document.querySelectorAll(".filter-button").forEach(filterButton => {
      filterButton.classList.toggle(
        "active",
        filterButton === button
      );
    });

    renderTasks();
  });
});

renderTasks();
