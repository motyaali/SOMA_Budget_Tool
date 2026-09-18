# SOMA Budget Planner

A private, installable monthly budget and scenario-planning tool. It compares budgeted and actual expenses, calculates remaining income and savings rate, and stores data locally in the browser.

## Features

- Editable income, categories, and expense items
- Budgeted versus actual tracking
- True month-by-month budgets with copy-forward planning
- Monthly summary, visual spend progress, and category variance alerts
- Automatic local saving
- JSON backup and restore
- CSV history export
- Print-friendly summary
- Responsive, keyboard-accessible interface
- Installable Progressive Web App with offline support
- No account, analytics, or server-side financial-data storage

## Run locally

Service workers require an HTTP origin. From the project directory, run:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Deploy to GitHub Pages

In the repository, open **Settings → Pages** and select **Deploy from a branch**. Choose `main` and `/ (root)`. The expected URL is:

`https://motyaali.github.io/SOMA_Budget_Tool/`

## Privacy

Budget data remains in the browser's local storage. Users should export a backup before clearing browser data or switching devices.

## Status

Version 1 is a working static web application. A Google Sheets companion and optional cloud synchronization are future enhancements.
