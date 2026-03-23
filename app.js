const STORAGE_KEYS = {
  tasks: 'smart-student-hub.tasks',
  notes: 'smart-student-hub.notes',
};

const PRIORITY_WEIGHT = {
  high: 3,
  medium: 2,
  low: 1,
};

const state = {
  tasks: loadCollection(STORAGE_KEYS.tasks),
  notes: loadCollection(STORAGE_KEYS.notes),
  activeView: 'dashboard',
  editingTaskId: null,
  editingNoteId: null,
};

const elements = {
  navLinks: document.querySelectorAll('.nav-link'),
  views: {
    dashboard: document.getElementById('dashboard-view'),
    tasks: document.getElementById('tasks-view'),
    notes: document.getElementById('notes-view'),
  },
  viewTitle: document.getElementById('view-title'),
  todayLabel: document.getElementById('today-label'),
  dashboard: {
    total: document.getElementById('total-tasks'),
    completed: document.getElementById('completed-tasks'),
    pending: document.getElementById('pending-tasks'),
    dueToday: document.getElementById('due-today'),
    productivityBadge: document.getElementById('productivity-badge'),
    productivityFill: document.getElementById('productivity-fill'),
    productivityMessage: document.getElementById('productivity-message'),
    studySuggestions: document.getElementById('study-suggestions'),
    recommendations: document.getElementById('recommendations-list'),
  },
  tasks: {
    form: document.getElementById('task-form'),
    formTitle: document.getElementById('task-form-title'),
    hiddenId: document.getElementById('task-id'),
    title: document.getElementById('task-title'),
    description: document.getElementById('task-description'),
    deadline: document.getElementById('task-deadline'),
    priority: document.getElementById('task-priority'),
    cancel: document.getElementById('task-cancel'),
    list: document.getElementById('task-list'),
    empty: document.getElementById('task-empty-state'),
    countChip: document.getElementById('task-count-chip'),
    template: document.getElementById('task-template'),
  },
  notes: {
    form: document.getElementById('note-form'),
    formTitle: document.getElementById('note-form-title'),
    hiddenId: document.getElementById('note-id'),
    title: document.getElementById('note-title'),
    content: document.getElementById('note-content'),
    cancel: document.getElementById('note-cancel'),
    list: document.getElementById('notes-list'),
    empty: document.getElementById('notes-empty-state'),
    countChip: document.getElementById('note-count-chip'),
    template: document.getElementById('note-template'),
  },
};

initializeApp();

function initializeApp() {
  elements.todayLabel.textContent = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  bindNavigation();
  bindTaskForm();
  bindNoteForm();
  renderAll();
}

function loadCollection(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    console.warn(`Failed to parse ${key}. Resetting collection.`, error);
    return [];
  }
}

function saveCollection(key, collection) {
  localStorage.setItem(key, JSON.stringify(collection));
}

function bindNavigation() {
  elements.navLinks.forEach((button) => {
    button.addEventListener('click', () => {
      const nextView = button.dataset.view;
      state.activeView = nextView;
      elements.viewTitle.textContent = capitalize(nextView);

      elements.navLinks.forEach((link) => link.classList.toggle('active', link === button));
      Object.entries(elements.views).forEach(([viewName, section]) => {
        section.classList.toggle('active', viewName === nextView);
      });
    });
  });
}

function bindTaskForm() {
  elements.tasks.form.addEventListener('submit', (event) => {
    event.preventDefault();

    const taskPayload = {
      id: state.editingTaskId || crypto.randomUUID(),
      title: elements.tasks.title.value.trim(),
      description: elements.tasks.description.value.trim(),
      deadline: elements.tasks.deadline.value,
      priority: elements.tasks.priority.value,
      completed: findTaskById(state.editingTaskId)?.completed || false,
      createdAt: findTaskById(state.editingTaskId)?.createdAt || new Date().toISOString(),
    };

    if (state.editingTaskId) {
      state.tasks = state.tasks.map((task) => (task.id === state.editingTaskId ? taskPayload : task));
    } else {
      state.tasks.push(taskPayload);
    }

    persistTasks();
    resetTaskForm();
    renderAll();
    state.activeView = 'tasks';
  });

  elements.tasks.cancel.addEventListener('click', resetTaskForm);
}

function bindNoteForm() {
  elements.notes.form.addEventListener('submit', (event) => {
    event.preventDefault();

    const notePayload = {
      id: state.editingNoteId || crypto.randomUUID(),
      title: elements.notes.title.value.trim(),
      content: elements.notes.content.value.trim(),
      updatedAt: new Date().toISOString(),
    };

    if (state.editingNoteId) {
      state.notes = state.notes.map((note) => (note.id === state.editingNoteId ? notePayload : note));
    } else {
      state.notes.push(notePayload);
    }

    persistNotes();
    resetNoteForm();
    renderNotes();
  });

  elements.notes.cancel.addEventListener('click', resetNoteForm);
}

function persistTasks() {
  saveCollection(STORAGE_KEYS.tasks, state.tasks);
}

function persistNotes() {
  saveCollection(STORAGE_KEYS.notes, state.notes);
}

function renderAll() {
  renderDashboard();
  renderTasks();
  renderNotes();
}

function renderDashboard() {
  const totalTasks = state.tasks.length;
  const completedTasks = state.tasks.filter((task) => task.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const dueTodayTasks = state.tasks.filter((task) => isSameDay(task.deadline, new Date())).length;
  const productivityScore = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  elements.dashboard.total.textContent = totalTasks;
  elements.dashboard.completed.textContent = completedTasks;
  elements.dashboard.pending.textContent = pendingTasks;
  elements.dashboard.dueToday.textContent = dueTodayTasks;
  elements.dashboard.productivityBadge.textContent = `${productivityScore}%`;
  elements.dashboard.productivityFill.style.width = `${productivityScore}%`;
  elements.dashboard.productivityMessage.textContent = getProductivityMessage(productivityScore, totalTasks);

  renderList(elements.dashboard.studySuggestions, buildStudySuggestions(state.tasks));
  renderList(elements.dashboard.recommendations, buildRecommendations({
    totalTasks,
    completedTasks,
    pendingTasks,
    dueTodayTasks,
    productivityScore,
    tasks: state.tasks,
  }));
}

function renderTasks() {
  const sortedTasks = getSortedTasks(state.tasks);
  elements.tasks.list.innerHTML = '';
  elements.tasks.countChip.textContent = `${state.tasks.length} task${state.tasks.length === 1 ? '' : 's'}`;
  elements.tasks.empty.classList.toggle('hidden', sortedTasks.length > 0);

  sortedTasks.forEach((task) => {
    const fragment = elements.tasks.template.content.cloneNode(true);
    const article = fragment.querySelector('.task-item');
    const title = fragment.querySelector('.task-item__title');
    const meta = fragment.querySelector('.task-item__meta');
    const description = fragment.querySelector('.task-item__description');
    const priority = fragment.querySelector('.priority-pill');
    const toggle = fragment.querySelector('.task-toggle');
    const editButton = fragment.querySelector('.task-edit');
    const deleteButton = fragment.querySelector('.task-delete');

    title.textContent = task.title;
    meta.textContent = `Due ${formatDate(task.deadline)} • ${capitalize(task.priority)} priority`;
    description.textContent = task.description || 'No description provided.';
    priority.textContent = task.priority;
    priority.classList.add(task.priority);
    toggle.checked = task.completed;
    article.classList.toggle('completed', task.completed);

    toggle.addEventListener('change', () => {
      state.tasks = state.tasks.map((item) => (item.id === task.id ? { ...item, completed: toggle.checked } : item));
      persistTasks();
      renderAll();
    });

    editButton.addEventListener('click', () => populateTaskForm(task.id));
    deleteButton.addEventListener('click', () => deleteTask(task.id));

    elements.tasks.list.appendChild(fragment);
  });
}

function renderNotes() {
  elements.notes.list.innerHTML = '';
  elements.notes.countChip.textContent = `${state.notes.length} note${state.notes.length === 1 ? '' : 's'}`;
  elements.notes.empty.classList.toggle('hidden', state.notes.length > 0);

  state.notes
    .slice()
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .forEach((note) => {
      const fragment = elements.notes.template.content.cloneNode(true);
      fragment.querySelector('.note-item__title').textContent = note.title;
      fragment.querySelector('.note-item__content').textContent = note.content;
      fragment.querySelector('.note-edit').addEventListener('click', () => populateNoteForm(note.id));
      fragment.querySelector('.note-delete').addEventListener('click', () => deleteNote(note.id));
      elements.notes.list.appendChild(fragment);
    });
}

function populateTaskForm(taskId) {
  const task = findTaskById(taskId);
  if (!task) return;

  state.editingTaskId = taskId;
  elements.tasks.formTitle.textContent = 'Edit task';
  elements.tasks.hiddenId.value = task.id;
  elements.tasks.title.value = task.title;
  elements.tasks.description.value = task.description;
  elements.tasks.deadline.value = task.deadline;
  elements.tasks.priority.value = task.priority;
  elements.tasks.cancel.classList.remove('hidden');
  state.activeView = 'tasks';
}

function resetTaskForm() {
  state.editingTaskId = null;
  elements.tasks.form.reset();
  elements.tasks.priority.value = 'medium';
  elements.tasks.formTitle.textContent = 'Create task';
  elements.tasks.hiddenId.value = '';
  elements.tasks.cancel.classList.add('hidden');
}

function populateNoteForm(noteId) {
  const note = state.notes.find((item) => item.id === noteId);
  if (!note) return;

  state.editingNoteId = noteId;
  elements.notes.formTitle.textContent = 'Edit note';
  elements.notes.hiddenId.value = note.id;
  elements.notes.title.value = note.title;
  elements.notes.content.value = note.content;
  elements.notes.cancel.classList.remove('hidden');
  state.activeView = 'notes';
}

function resetNoteForm() {
  state.editingNoteId = null;
  elements.notes.form.reset();
  elements.notes.formTitle.textContent = 'Create note';
  elements.notes.hiddenId.value = '';
  elements.notes.cancel.classList.add('hidden');
}

function deleteTask(taskId) {
  state.tasks = state.tasks.filter((task) => task.id !== taskId);
  persistTasks();
  if (state.editingTaskId === taskId) resetTaskForm();
  renderAll();
}

function deleteNote(noteId) {
  state.notes = state.notes.filter((note) => note.id !== noteId);
  persistNotes();
  if (state.editingNoteId === noteId) resetNoteForm();
  renderNotes();
}

function findTaskById(taskId) {
  return state.tasks.find((task) => task.id === taskId);
}

function getSortedTasks(tasks) {
  return tasks
    .slice()
    .sort((taskA, taskB) => {
      const deadlineDelta = new Date(taskA.deadline) - new Date(taskB.deadline);
      if (deadlineDelta !== 0) return deadlineDelta;
      return PRIORITY_WEIGHT[taskB.priority] - PRIORITY_WEIGHT[taskA.priority];
    });
}

function buildStudySuggestions(tasks) {
  const pendingTasks = getSortedTasks(tasks.filter((task) => !task.completed));

  if (!pendingTasks.length) {
    return ['You are all caught up. Use today to review notes or plan ahead for upcoming classes.'];
  }

  return pendingTasks.slice(0, 3).map((task) => {
    const dueLabel = getRelativeDeadlineLabel(task.deadline);
    return `You should focus on ${task.title} today (${task.priority} priority, due ${dueLabel}).`;
  });
}

function buildRecommendations({ pendingTasks, dueTodayTasks, productivityScore, tasks }) {
  const recommendations = [];
  const upcomingUrgentTask = tasks
    .filter((task) => !task.completed)
    .find((task) => daysUntil(task.deadline) <= 2);

  if (pendingTasks >= 5) {
    recommendations.push('Focus on completing your pending tasks today to reduce your workload.');
  }

  if (productivityScore >= 75) {
    recommendations.push('Great job! Your productivity is high—keep the momentum going.');
  } else if (productivityScore > 0 && productivityScore < 40) {
    recommendations.push('Try finishing one quick task first to build momentum and raise your completion rate.');
  }

  if (dueTodayTasks > 0) {
    recommendations.push(`You have ${dueTodayTasks} task${dueTodayTasks === 1 ? '' : 's'} due today. Prioritize those first.`);
  }

  if (upcomingUrgentTask) {
    recommendations.push(`Start early on ${upcomingUrgentTask.title}; its deadline is approaching quickly.`);
  }

  if (!recommendations.length) {
    recommendations.push('Your workload looks balanced. Review your notes and maintain your current study rhythm.');
  }

  return recommendations;
}

function getProductivityMessage(score, totalTasks) {
  if (!totalTasks) return 'Add your first task to start measuring progress.';
  if (score >= 80) return 'Excellent consistency. You are staying on top of your work.';
  if (score >= 50) return 'Solid progress. Completing a few more tasks will boost your score.';
  return 'You have room to improve. Start with the nearest deadline first.';
}

function renderList(target, items) {
  target.innerHTML = '';
  items.forEach((item) => {
    const listItem = document.createElement('li');
    listItem.textContent = item;
    target.appendChild(listItem);
  });
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

function isSameDay(dateString, comparisonDate) {
  const normalizedDate = new Date(`${dateString}T00:00:00`);
  return normalizedDate.toDateString() === comparisonDate.toDateString();
}

function daysUntil(dateString) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateString}T00:00:00`);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

function getRelativeDeadlineLabel(dateString) {
  const delta = daysUntil(dateString);
  if (delta <= 0) return delta === 0 ? 'today' : 'in the past';
  if (delta === 1) return 'tomorrow';
  return `in ${delta} days`;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
