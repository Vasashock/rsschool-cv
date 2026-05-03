import { monthNames } from './constants.js';
import { getProjectById, getProjectMetrics, getTotalEstimatedIncome } from './calculations.js';
import { currentPeriodKey, currentSnapshot, monthlyData, state } from './store.js';
import { saveData } from './storage.js';
import {
    deepClone,
    escapeHtml,
    formatCurrency,
    formatNumber,
    uid,
} from './utils.js';

export function getProjectHeaders() {
    return [
        { label: 'Company Name', key: 'companyName', sortable: true, filterable: true },
        { label: 'Project Name', key: 'projectName', sortable: true, filterable: true },
        { label: 'Budget', key: 'budget', sortable: true },
        { label: 'Employee Capacity', key: 'capacityUsage', sortable: true },
        { label: 'Employees', key: 'employeesCount' },
        { label: 'Estimated Income', key: 'estimatedIncome', sortable: true },
        { label: 'Actions', key: 'actions' },
    ];
}

export function getProjectRows() {
    const prepared = currentSnapshot().projects.map((project) => {
        const metrics = getProjectMetrics(project);
        return {
            project,
            metrics,
            employeesCount: metrics.rows.length,
        };
    });
    const { companyName, projectName } = state.filters.projects;
    const sortKey = state.sort.projects.key;
    const sortDirection = state.sort.projects.direction;
    const getters = {
        companyName: (entry) => entry.project.companyName,
        projectName: (entry) => entry.project.projectName,
        budget: (entry) => entry.project.budget,
        capacityUsage: (entry) => entry.metrics.usedCapacity,
        estimatedIncome: (entry) => entry.metrics.income,
    };

    const filtered = prepared.filter((entry) => {
        const companyMatch = !companyName || entry.project.companyName.toLowerCase().includes(companyName.toLowerCase());
        const projectMatch = !projectName || entry.project.projectName.toLowerCase().includes(projectName.toLowerCase());
        return companyMatch && projectMatch;
    });

    const sorted = [...filtered].sort((left, right) => {
        const leftValue = getters[sortKey](left);
        const rightValue = getters[sortKey](right);

        if (typeof leftValue === 'number' && typeof rightValue === 'number') {
            return sortDirection === 'asc' ? leftValue - rightValue : rightValue - leftValue;
        }

        const result = String(leftValue).localeCompare(String(rightValue));
        return sortDirection === 'asc' ? result : -result;
    });

    return sorted.map(({ project, metrics, employeesCount }) => `
        <tr>
            <td>${escapeHtml(project.companyName)}</td>
            <td>${escapeHtml(project.projectName)}</td>
            <td>${formatCurrency(project.budget)}</td>
            <td class="${metrics.usedCapacity > project.capacity ? 'warning-text' : ''}">
                ${formatNumber(metrics.usedCapacity, 2)}/${formatNumber(project.capacity, 0)}
            </td>
            <td>
                <button class="table-btn" data-action="show-project-employees" data-project-id="${project.id}">
                    Show Employees (${employeesCount})
                </button>
            </td>
            <td class="${metrics.income >= 0 ? 'positive-text' : 'negative-text'}">${formatCurrency(metrics.income)}</td>
            <td>
                <button class="danger-btn" data-action="delete-project" data-project-id="${project.id}">Delete</button>
            </td>
        </tr>
    `);
}

export function openProjectForm(ui) {
    const content = document.createElement('div');
    content.innerHTML = `
        <form class="stack-form" id="project-form">
            <label>Project Name
                <input type="text" name="projectName" required>
                <small data-error="projectName"></small>
            </label>
            <label>Company Name
                <input type="text" name="companyName" required>
                <small data-error="companyName"></small>
            </label>
            <label>Budget
                <input type="number" name="budget" min="0" step="0.01" required>
                <small data-error="budget"></small>
            </label>
            <label>Employee Capacity
                <input type="number" name="capacity" min="1" step="1" required>
                <small data-error="capacity"></small>
            </label>
            <div class="modal-actions">
                <button type="submit" class="table-btn" disabled>Create Project</button>
            </div>
        </form>
    `;
    ui.openModal({ title: 'Add Project', content, className: 'drawer-like' });
    const form = content.querySelector('#project-form');
    const submit = form.querySelector('[type="submit"]');
    const validators = {
        projectName: (value) => /^[a-z0-9 ]{3,}$/i.test(value) ? '' : 'Use at least 3 letters or numbers.',
        companyName: (value) => /^[a-z0-9 ]{2,}$/i.test(value) ? '' : 'Use at least 2 letters or numbers.',
        budget: (value) => Number(value) > 0 ? '' : 'Budget must be positive.',
        capacity: (value) => Number(value) >= 1 && Number.isInteger(Number(value)) ? '' : 'Capacity must be an integer from 1.',
    };

    ui.bindValidatedForm(form, validators, (values) => {
        currentSnapshot().projects.push({
            id: uid(),
            projectName: values.projectName.trim(),
            companyName: values.companyName.trim(),
            budget: Number(Number(values.budget).toFixed(2)),
            capacity: Number(values.capacity),
        });
        saveData();
        ui.closeModal();
        ui.renderApp();
    }, submit);
}

export function confirmProjectDelete(projectId, ui) {
    const project = getProjectById(projectId);
    if (!project) {
        return;
    }
    const content = document.createElement('div');
    content.innerHTML = `
        <p>Delete project <strong>${escapeHtml(project.projectName)}</strong>?</p>
        <div class="modal-actions">
            <button class="danger-btn" id="confirm-delete-project">Delete</button>
        </div>
    `;
    const modal = ui.openModal({ title: 'Delete Project', content });
    modal.querySelector('#confirm-delete-project').addEventListener('click', () => {
        currentSnapshot().employees.forEach((employee) => {
            employee.assignments = employee.assignments.filter((assignment) => assignment.projectId !== projectId);
        });
        currentSnapshot().projects = currentSnapshot().projects.filter((item) => item.id !== projectId);
        saveData();
        ui.closeModal();
        ui.renderApp();
    });
}

export function openProjectEmployeesModal(projectId, ui) {
    const project = getProjectById(projectId);
    if (!project) {
        return;
    }
    const metrics = getProjectMetrics(project);
    const rows = metrics.rows
        .sort((left, right) => {
            const leftName = `${left.employee.name} ${left.employee.surname}`;
            const rightName = `${right.employee.name} ${right.employee.surname}`;
            return leftName.localeCompare(rightName);
        })
        .map((row) => `
            <tr>
                <td>
                    <button class="link-btn" data-action="see-employee" data-employee-id="${row.employee.id}">
                        ${escapeHtml(row.employee.name)} ${escapeHtml(row.employee.surname)}
                    </button>
                </td>
                <td>${formatNumber(row.assignment.capacity, 2)}</td>
                <td>${formatNumber(row.assignment.fit, 2)}</td>
                <td>${row.employee.vacationDays.length}</td>
                <td>${formatNumber(row.effectiveCapacity, 3)}</td>
                <td>${formatCurrency(row.revenue)}</td>
                <td>${formatCurrency(row.cost)}</td>
                <td class="${row.profit >= 0 ? 'positive-text' : 'negative-text'}">${formatCurrency(row.profit)}</td>
                <td class="action-group">
                    <button class="table-btn" data-action="edit-assignment-modal" data-employee-id="${row.employee.id}" data-project-id="${project.id}">Edit</button>
                    <button class="danger-btn secondary-danger" data-action="unassign-modal" data-employee-id="${row.employee.id}" data-project-id="${project.id}">Unassign</button>
                </td>
            </tr>
        `)
        .join('');

    const content = document.createElement('div');
    content.innerHTML = metrics.rows.length ? `
        <table class="detail-table">
            <thead>
                <tr>
                    <th>Employee</th>
                    <th>Capacity</th>
                    <th>Fit</th>
                    <th>Vacation Days</th>
                    <th>Effective Capacity</th>
                    <th>Revenue</th>
                    <th>Cost</th>
                    <th>Profit</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    ` : '<div class="empty-state tall">No employees assigned to this project.</div>';
    const modal = ui.openModal({ title: `${project.projectName} Team`, content, className: 'wide-modal' });
    ui.bindDetailActions(modal);
}

export function openSeedModal(ui) {
    const originalPeriod = { ...state.period };
    const entries = Object.entries(monthlyData)
        .filter(([key]) => key !== currentPeriodKey())
        .map(([key, snapshot]) => {
            const [year, month] = key.split('-').map(Number);
            state.period = { year, month };
            const total = getTotalEstimatedIncome();
            return {
                key,
                year,
                month,
                projectCount: snapshot.projects.length,
                employeeCount: snapshot.employees.length,
                total,
            };
        })
        .filter((entry) => entry.projectCount || entry.employeeCount);
    state.period = originalPeriod;

    const content = document.createElement('div');
    content.innerHTML = entries.length ? `
        <div class="seed-list">
            ${entries.map((entry) => `
                <div class="seed-card">
                    <strong>${monthNames[entry.month]} ${entry.year}</strong>
                    <span>Projects: ${entry.projectCount}</span>
                    <span>Employees: ${entry.employeeCount}</span>
                    <span class="${entry.total >= 0 ? 'positive-text' : 'negative-text'}">Income: ${formatCurrency(entry.total)}</span>
                    <button class="table-btn" data-seed-key="${entry.key}">Seed</button>
                </div>
            `).join('')}
        </div>
    ` : '<div class="empty-state tall">No other months with data available.</div>';

    const modal = ui.openModal({ title: 'Seed Data', content });
    modal.addEventListener('click', (event) => {
        const button = event.target.closest('[data-seed-key]');
        if (!button) {
            return;
        }
        const fromKey = button.dataset.seedKey;
        const fromLabel = `${monthNames[Number(fromKey.split('-')[1])]} ${fromKey.split('-')[0]}`;
        const currentLabel = `${monthNames[state.period.month]} ${state.period.year}`;
        if (!window.confirm(`Copy data from ${fromLabel} to ${currentLabel}? Vacation days will be cleared.`)) {
            return;
        }
        const cloned = deepClone(monthlyData[fromKey]);
        cloned.employees.forEach((employee) => {
            employee.vacationDays = [];
        });
        monthlyData[currentPeriodKey()] = cloned;
        saveData();
        ui.closeModal();
        ui.renderApp();
    });
}

export function createSampleSnapshot() {
    const projectA = {
        id: uid(),
        projectName: 'Atlas CRM',
        companyName: 'Northwind',
        budget: 24000,
        capacity: 3,
    };
    const projectB = {
        id: uid(),
        projectName: 'Pulse Admin',
        companyName: 'Blue Ocean',
        budget: 18000,
        capacity: 2,
    };
    const projectC = {
        id: uid(),
        projectName: 'Care Mobile',
        companyName: 'WellTech',
        budget: 12000,
        capacity: 1,
    };
    return {
        projects: [projectA, projectB, projectC],
        employees: [
            {
                id: uid(),
                name: 'Anna',
                surname: 'Smith',
                dob: '1996-04-12',
                position: 'Senior',
                salary: 4200,
                vacationDays: [7, 8],
                assignments: [
                    { projectId: projectA.id, capacity: 0.7, fit: 1 },
                    { projectId: projectB.id, capacity: 0.5, fit: 0.8 },
                ],
            },
            {
                id: uid(),
                name: 'Mark',
                surname: 'Taylor',
                dob: '1992-11-03',
                position: 'Middle',
                salary: 3000,
                vacationDays: [15],
                assignments: [
                    { projectId: projectA.id, capacity: 0.8, fit: 0.9 },
                ],
            },
            {
                id: uid(),
                name: 'Julia',
                surname: 'Brown',
                dob: '1990-02-24',
                position: 'Lead',
                salary: 5200,
                vacationDays: [],
                assignments: [
                    { projectId: projectC.id, capacity: 0.6, fit: 0.9 },
                ],
            },
            {
                id: uid(),
                name: 'Chris',
                surname: 'Green',
                dob: '1998-09-18',
                position: 'Junior',
                salary: 1800,
                vacationDays: [],
                assignments: [],
            },
        ],
    };
}
