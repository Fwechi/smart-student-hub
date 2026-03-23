# Smart Student Hub – AI-powered Study & Task Manager

Smart Student Hub is a lightweight static web application for students who need a simple way to manage assignments, plan study sessions, save notes, and receive rule-based productivity suggestions. The app is built with plain HTML, CSS, and JavaScript, so it works well on GitHub Pages without any backend.

## Features

- **Task management**: create, edit, delete, prioritize, and complete tasks.
- **Persistent storage**: tasks and notes are stored in `localStorage`.
- **Dashboard analytics**: see total tasks, completed tasks, pending tasks, due-today tasks, and a productivity score.
- **Smart study scheduler**: automatically sorts pending tasks by deadline and priority, then surfaces daily study suggestions.
- **Smart recommendations**: rule-based recommendations react to workload, productivity, and approaching deadlines.
- **Notes system**: create, edit, and delete notes for quick study references.
- **Responsive UI**: optimized for desktop and mobile screens.

## Project Structure

```text
smart-student-hub/
├── assets/
├── app.js
├── index.html
├── README.md
└── style.css
```

## How to Run Locally

Because this is a static app, you can run it in any of the following ways:

### Option 1: Open directly
1. Download or clone the repository.
2. Open `index.html` in your browser.

### Option 2: Use a local server (recommended)
From the project folder, run one of these commands:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## How to Deploy to GitHub Pages

1. Push the project to a GitHub repository.
2. On GitHub, open **Settings** > **Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select the branch you want to deploy and choose the root folder (`/`).
5. Save the settings.
6. After GitHub finishes publishing, open the provided Pages URL.

## Rule-Based AI Logic

The app uses lightweight rule-based logic instead of external AI services:

- **Study suggestions** rank pending tasks by the nearest deadline first, then by highest priority.
- **Recommendations** adapt to task count, completion rate, due-today tasks, and urgent deadlines.
- **Productivity score** is calculated with the formula:

```text
(completed tasks / total tasks) * 100
```

## Storage Notes

- Tasks are saved under `smart-student-hub.tasks` in `localStorage`.
- Notes are saved under `smart-student-hub.notes` in `localStorage`.
- Clearing browser storage removes saved data.

## Future Improvements

- Task filtering by subject or course
- Calendar integration
- Drag-and-drop prioritization
- Export/import for notes and tasks
