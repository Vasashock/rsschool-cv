import { EMPLOYEE_LIMIT, positions } from './constants.js';
import {
    getEmployeeById,
    getEmployeeMetrics,
    getProjectById,
    getProjectMetrics,
    getVacationCoefficient,
    getWorkingDays,
    isWeekend,
} from './calculations.js';
import { currentSnapshot, state } from './store.js';
import { saveData } from './storage.js';
import {
    calculateAge,
    deepClone,
    escapeHtml,
    formatCurrency,
    formatNumber,
    formatVacationRanges,
    uid,
} from './utils.js';

export function getEmployeeHeaders() {
    return [
        { label: 'Name', key: 'name', sortable: true, filterable: true },
        { label: 'Surname', key: 'surname', sortable: true, filterable: true },
        { label: 'Age', key: 'age', sortable: true },
        { label: 'Position', key: 'position', sortable: true, filterable: true },
        { label: 'Salary', key: 'salary', sortable: true },
        { label: 'Estimated Payment', key: 'estimatedPayment', sortable: true },
        { label: 'Project', key: 'project', filterable: true },
        { label: 'Projected Income', key: 'projectedIncome', sortable: true },
        { label: 'Actions', key: 'actions' },
    ];
}

export function getEmployeeRows() {
    const prepared = currentSnapshot().employees.map((employee) => {
        const metrics = getEmployeeMetrics(employee);
        return {
            employee,
            metrics,
            projectNames: metrics.rows.map((row) => row.project.projectName).join(', '),
        };
    });
    const { name, surname, position, project } = state.filters.employees;
    const sortKey = state.sort.employees.key;
    const sortDirection = state.sort.employees.direction;
    const getters = {
        name: (entry) => entry.employee.name,
        surname: (entry) => entry.employee.surname,
        age: (entry) => calculateAge(entry.employee.dob),
        position: (entry) => entry.employee.position,
        salary: (entry) => entry.employee.salary,
        estimatedPayment: (entry) => entry.metrics.estimatedPayment,
        projectedIncome: (entry) => entry.metrics.projectedIncome,
    };

    const filtered = prepared.filter((entry) => {
        const nameMatch = !name || entry.employee.name.toLowerCase().includes(name.toLowerCase());
        const surnameMatch = !surname || entry.employee.surname.toLowerCase().includes(surname.toLowerCase());
        const positionMatch = !position || entry.employee.position === position;
        const projectMatch = !project || entry.projectNames.toLowerCase().includes(project.toLowerCase());
        return nameMatch && surnameMatch && positionMatch && projectMatch;
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

    return sorted.map(({ employee, metrics }) => `
        <tr>
            <td>${escapeHtml(employee.name)}</td>
            <td>${escapeHtml(employee.surname)}</td>
            <td>${calculateAge(employee.dob)}</td>
            <td>
                <select class="cell-select" data-action="update-position" data-employee-id="${employee.id}">
                    ${positions.map((position) => `<option value="${position}" ${position === employee.position ? 'selected' : ''}>${position}</option>`).join('')}
                </select>
            </td>
            <td>
                <input class="cell-input" type="number" min="0" step="0.01" value="${formatNumber(employee.salary)}"
                    data-action="update-salary" data-employee-id="${employee.id}">
            </td>
            <td>${formatCurrency(metrics.estimatedPayment)}</td>
            <td>
                <button class="table-btn" data-action="show-assignments" data-employee-id="${employee.id}">
                    Show Assignments (${metrics.rows.length}) ${formatNumber(metrics.assignedCapacity, 1)}/${EMPLOYEE_LIMIT}
                </button>
            </td>
            <td class="${metrics.projectedIncome >= 0 ? 'positive-text' : 'negative-text'}">${formatCurrency(metrics.projectedIncome)}</td>
            <td class="action-group">
                <button class="table-btn" data-action="open-calendar" data-employee-id="${employee.id}">Availability</button>
                <button class="table-btn" data-action="assign" data-employee-id="${employee.id}" ${metrics.assignedCapacity >= EMPLOYEE_LIMIT ? 'disabled' : ''}>Assign</button>
                <button class="danger-btn" data-action="delete-employee" data-employee-id="${employee.id}">Delete</button>
            </td>
        </tr>
    `);
}

export function openEmployeeForm(ui) {
    const content = document.createElement('div');
    content.innerHTML = `
        <form class="stack-form" id="employee-form">
            <label>Name
                <input type="text" name="name" required>
                <small data-error="name"></small>
            </label>
            <label>Surname
                <input type="text" name="surname" required>
                <small data-error="surname"></small>
            </label>
            <label>Date of Birth
                <input type="date" name="dob" required>
                <small data-error="dob"></small>
            </label>
            <label>Position
                <select name="position" required>
                    <option value="">Select position</option>
                    ${positions.map((position) => `<option value="${position}">${position}</option>`).join('')}
                </select>
                <small data-error="position"></small>
            </label>
            <label>Salary
                <input type="number" name="salary" min="0" step="0.01" required>
                <small data-error="salary"></small>
            </label>
            <div class="modal-actions">
                <button type="submit" class="table-btn" disabled>Create Employee</button>
            </div>
        </form>
    `;
    ui.openModal({ title: 'Add Employee', content, className: 'drawer-like' });
    const form = content.querySelector('#employee-form');
    const submit = form.querySelector('[type="submit"]');
    const validators = {
        name: (value) => /^[a-zA-Zа-яА-Я ]{3,}$/.test(value) ? '' : 'Name must be at least 3 letters.',
        surname: (value) => /^[a-zA-Zа-яА-Я ]{3,}$/.test(value) ? '' : 'Surname must be at least 3 letters.',
        dob: (value) => calculateAge(value) >= 18 ? '' : 'Employee must be 18+ years old.',
        position: (value) => value ? '' : 'Select a position.',
        salary: (value) => Number(value) > 0 ? '' : 'Salary must be positive.',
    };

    ui.bindValidatedForm(form, validators, (values) => {
        currentSnapshot().employees.push({
            id: uid(),
            name: values.name.trim(),
            surname: values.surname.trim(),
            dob: values.dob,
            position: values.position,
            salary: Number(Number(values.salary).toFixed(2)),
            vacationDays: [],
            assignments: [],
        });
        saveData();
        ui.closeModal();
        ui.renderApp();
    }, submit);
}

export function confirmEmployeeDelete(employeeId, ui) {
    const employee = getEmployeeById(employeeId);
    if (!employee) {
        return;
    }
    const content = document.createElement('div');
    content.innerHTML = `
        <p>Delete employee <strong>${escapeHtml(employee.name)} ${escapeHtml(employee.surname)}</strong>?</p>
        <div class="modal-actions">
            <button class="danger-btn" id="confirm-delete-employee">Delete</button>
        </div>
    `;
    const modal = ui.openModal({ title: 'Delete Employee', content });
    modal.querySelector('#confirm-delete-employee').addEventListener('click', () => {
        currentSnapshot().employees = currentSnapshot().employees.filter((item) => item.id !== employeeId);
        saveData();
        ui.closeModal();
        ui.renderApp();
    });
}

export function openEmployeeAssignmentsModal(employeeId, ui) {
    const employee = getEmployeeById(employeeId);
    if (!employee) {
        return;
    }
    const metrics = getEmployeeMetrics(employee);
    const rows = metrics.rows.map((row) => `
        <tr>
            <td>
                <button class="link-btn" data-action="see-project" data-project-id="${row.project.id}">
                    ${escapeHtml(row.project.projectName)}
                </button>
            </td>
            <td>${formatNumber(row.assignment.capacity, 2)}</td>
            <td>${formatNumber(row.assignment.fit, 2)}</td>
            <td>${employee.vacationDays.length}</td>
            <td>${formatNumber(row.effectiveCapacity, 3)}</td>
            <td>${formatCurrency(row.revenue)}</td>
            <td>${formatCurrency(row.cost)}</td>
            <td class="${row.profit >= 0 ? 'positive-text' : 'negative-text'}">${formatCurrency(row.profit)}</td>
            <td class="action-group">
                <button class="table-btn" data-action="edit-assignment-modal" data-employee-id="${employee.id}" data-project-id="${row.project.id}">Edit</button>
                <button class="danger-btn secondary-danger" data-action="unassign-modal" data-employee-id="${employee.id}" data-project-id="${row.project.id}">Unassign</button>
            </td>
        </tr>
    `).join('');

    const content = document.createElement('div');
    content.innerHTML = metrics.rows.length ? `
        <table class="detail-table">
            <thead>
                <tr>
                    <th>Project</th>
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
    ` : '<div class="empty-state tall">No assignments for this employee.</div>';
    const modal = ui.openModal({ title: `${employee.name} ${employee.surname}`, content, className: 'wide-modal' });
    ui.bindDetailActions(modal);
}

export function openUnassignModal(employeeId, projectId, ui) {
    const employee = getEmployeeById(employeeId);
    const project = getProjectById(projectId);
    const assignment = employee?.assignments.find((item) => item.projectId === projectId);
    if (!employee || !project || !assignment) {
        return;
    }
    const currentMetrics = getProjectMetrics(project);
    const currentIncome = currentMetrics.income;
    const clonedEmployees = deepClone(currentSnapshot().employees);
    const targetEmployee = clonedEmployees.find((item) => item.id === employeeId);
    targetEmployee.assignments = targetEmployee.assignments.filter((item) => item.projectId !== projectId);
    const originalAssignments = employee.assignments;
    employee.assignments = targetEmployee.assignments;
    const afterIncome = getProjectMetrics(project).income;
    employee.assignments = originalAssignments;

    const content = document.createElement('div');
    content.innerHTML = `
        <p><strong>${escapeHtml(employee.name)} ${escapeHtml(employee.surname)}</strong> from <strong>${escapeHtml(project.projectName)}</strong></p>
        <div class="info-grid">
            <span>Assigned Capacity</span><strong>${formatNumber(assignment.capacity, 2)}</strong>
            <span>Employee Salary Share</span><strong>${formatCurrency(employee.salary * assignment.capacity)}</strong>
            <span>Budget Share</span><strong>${formatCurrency(project.budget * (assignment.capacity / Math.max(project.capacity, 1)))}</strong>
            <span>Project Income Before</span><strong class="${currentIncome >= 0 ? 'positive-text' : 'negative-text'}">${formatCurrency(currentIncome)}</strong>
            <span>Project Income After</span><strong class="${afterIncome >= 0 ? 'positive-text' : 'negative-text'}">${formatCurrency(afterIncome)}</strong>
        </div>
        <div class="modal-actions">
            <button class="danger-btn" id="confirm-unassign-btn">Confirm Unassign</button>
        </div>
    `;
    const modal = ui.openModal({ title: 'Unassign Employee', content });
    modal.querySelector('#confirm-unassign-btn').addEventListener('click', () => {
        employee.assignments = employee.assignments.filter((item) => item.projectId !== projectId);
        saveData();
        ui.closeModal();
        ui.renderApp();
    });
}

export function openAssignmentPopup(employeeId, anchor, existingAssignment, ui) {
    ui.closeFloating();
    const employee = getEmployeeById(employeeId);
    if (!employee) {
        return;
    }
    if (!currentSnapshot().projects.length) {
        const content = document.createElement('div');
        content.innerHTML = '<p>Create a project first, then you can assign employees to it.</p>';
        ui.openModal({ title: 'No Projects Available', content });
        return;
    }

    const capacityUsed = employee.assignments.reduce((sum, assignment) => {
        const isEditingCurrentAssignment = existingAssignment
            && assignment.projectId === existingAssignment.projectId;

        if (isEditingCurrentAssignment) {
            return sum;
        }

        return sum + assignment.capacity;
    }, 0);
    const projects = currentSnapshot().projects;
    const initialProjectId = existingAssignment?.projectId || projects[0]?.id || '';
    const initialCapacity = existingAssignment?.capacity || Math.min(0.5, Math.max(0.1, EMPLOYEE_LIMIT - capacityUsed));
    const initialFit = existingAssignment?.fit || 1;

    const floating = document.createElement('div');
    floating.className = 'floating-popup assignment-popup';
    floating.innerHTML = `
        <div class="floating-title">${existingAssignment ? 'Edit Assignment' : 'Assign Employee'}</div>
        <label>Current Capacity
            <div class="mini-text">${formatNumber(capacityUsed, 1)}/${EMPLOYEE_LIMIT}</div>
        </label>
        <label>Project
            <select id="assignment-project" ${existingAssignment ? 'disabled' : ''}>
                ${projects.map((project) => `<option value="${project.id}" ${project.id === initialProjectId ? 'selected' : ''}>${escapeHtml(project.projectName)}</option>`).join('')}
            </select>
        </label>
        <label>Capacity
            <input id="assignment-capacity" type="range" min="0.1" max="1.5" step="0.1" value="${initialCapacity}">
            <div class="mini-text" id="capacity-value">${formatNumber(initialCapacity, 1)}</div>
        </label>
        <label>Project Fit
            <input id="assignment-fit" type="range" min="0" max="1" step="0.1" value="${initialFit}">
            <div class="mini-text" id="fit-value">${formatNumber(initialFit, 1)}</div>
        </label>
        <div class="info-grid compact" id="assignment-info"></div>
        <div class="error-box" id="assignment-error"></div>
        <div class="floating-actions">
            <button class="table-btn" id="save-assignment-btn">${existingAssignment ? 'Save' : 'Assign'}</button>
            <button class="danger-btn secondary-danger" id="cancel-assignment-btn">Cancel</button>
        </div>
    `;
    document.body.appendChild(floating);

    const projectSelect = floating.querySelector('#assignment-project');
    const capacityInput = floating.querySelector('#assignment-capacity');
    const fitInput = floating.querySelector('#assignment-fit');
    const capacityValue = floating.querySelector('#capacity-value');
    const fitValue = floating.querySelector('#fit-value');
    const infoBox = floating.querySelector('#assignment-info');
    const errorBox = floating.querySelector('#assignment-error');

    function refreshInfo() {
        const selectedProject = getProjectById(projectSelect.value);
        const capacity = Number(capacityInput.value);
        const fit = Number(fitInput.value);
        const predictedCapacity = capacityUsed + capacity;
        const effectiveCapacity = capacity * fit * getVacationCoefficient(employee);
        const metrics = selectedProject ? getProjectMetrics(selectedProject) : null;
        capacityValue.textContent = formatNumber(capacity, 1);
        fitValue.textContent = formatNumber(fit, 1);
        infoBox.innerHTML = `
            <span>Available Capacity</span><strong>${formatNumber(Math.max(0, EMPLOYEE_LIMIT - capacityUsed), 1)}</strong>
            <span>Predicted Capacity</span><strong>${formatNumber(predictedCapacity, 1)}/${EMPLOYEE_LIMIT}</strong>
            <span>Effective Capacity</span><strong>${formatNumber(effectiveCapacity, 3)}</strong>
            <span>Project Usage</span><strong>${metrics ? `${formatNumber(metrics.usedCapacity, 2)}/${formatNumber(selectedProject.capacity, 0)}` : '-'}</strong>
        `;
        errorBox.textContent = predictedCapacity > EMPLOYEE_LIMIT ? 'Employee capacity cannot exceed 1.5.' : '';
    }

    [projectSelect, capacityInput, fitInput].forEach((input) => input.addEventListener('input', refreshInfo));
    [projectSelect, capacityInput, fitInput].forEach((input) => input.addEventListener('change', refreshInfo));

    floating.querySelector('#save-assignment-btn').addEventListener('click', () => {
        const projectId = projectSelect.value;
        const capacity = Number(capacityInput.value);
        const fit = Number(fitInput.value);
        if (!projectId || capacityUsed + capacity > EMPLOYEE_LIMIT) {
            refreshInfo();
            return;
        }
        if (existingAssignment) {
            existingAssignment.capacity = capacity;
            existingAssignment.fit = fit;
        } else {
            employee.assignments.push({ projectId, capacity, fit });
        }
        saveData();
        ui.closeFloating();
        ui.renderApp();
    });
    floating.querySelector('#cancel-assignment-btn').addEventListener('click', ui.closeFloating);

    function reposition() {
        ui.positionFloating(floating, anchor);
    }
    window.addEventListener('scroll', reposition);
    window.addEventListener('resize', reposition);
    state.ui.activeFloating = {
        element: floating,
        anchor,
        cleanup() {
            window.removeEventListener('scroll', reposition);
            window.removeEventListener('resize', reposition);
        },
    };
    refreshInfo();
    ui.positionFloating(floating, anchor);
}

export function openCalendarModal(employeeId, ui) {
    const employee = getEmployeeById(employeeId);
    if (!employee) {
        return;
    }
    const workingDays = getWorkingDays(state.period.year, state.period.month);
    const selected = new Set(employee.vacationDays);
    const daysInMonth = new Date(state.period.year, state.period.month + 1, 0).getDate();
    const firstDay = new Date(state.period.year, state.period.month, 1).getDay();
    const today = new Date();

    const content = document.createElement('div');
    content.className = 'calendar-wrapper';
    content.innerHTML = `
        <div class="calendar-head">
            <strong>${new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(state.period.year, state.period.month, 1))}</strong>
            <span id="working-days-label"></span>
        </div>
        <div class="weekdays">
            <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
        </div>
        <div class="calendar-grid" id="calendar-grid"></div>
        <div class="vacation-ranges" id="vacation-ranges"></div>
        <div class="modal-actions">
            <button class="table-btn" id="save-vacation-btn">Set Vacation</button>
        </div>
    `;

    const modal = ui.openModal({ title: `${employee.name} Availability`, content });
    const grid = modal.querySelector('#calendar-grid');
    const workingLabel = modal.querySelector('#working-days-label');
    const ranges = modal.querySelector('#vacation-ranges');

    function renderCalendar() {
        const blanks = new Array(firstDay).fill('<span class="calendar-cell empty"></span>').join('');
        const sortedDays = [...selected].sort((a, b) => a - b);
        const dayCells = Array.from({ length: daysInMonth }, (_, index) => {
            const day = index + 1;
            const isToday = today.getFullYear() === state.period.year
                && today.getMonth() === state.period.month
                && today.getDate() === day;
            const weekend = isWeekend(state.period.year, state.period.month, day);
            const chosen = selected.has(day);
            return `
                <button class="calendar-cell ${weekend ? 'weekend' : ''} ${isToday ? 'today' : ''} ${chosen ? 'selected' : ''}" data-day="${day}">
                    ${day}
                </button>
            `;
        }).join('');
        grid.innerHTML = blanks + dayCells;
        const vacationWorkingDays = sortedDays.filter((day) => !isWeekend(state.period.year, state.period.month, day)).length;
        workingLabel.textContent = `Working Days: ${workingDays - vacationWorkingDays}/${workingDays} days`;
        ranges.textContent = `Vacation Days: ${formatVacationRanges(sortedDays, state.period.year, state.period.month, isWeekend) || 'None'}`;
    }

    grid.addEventListener('click', (event) => {
        const cell = event.target.closest('[data-day]');
        if (!cell) {
            return;
        }
        const day = Number(cell.dataset.day);
        if (selected.has(day)) {
            selected.delete(day);
        } else {
            selected.add(day);
        }
        renderCalendar();
    });

    modal.querySelector('#save-vacation-btn').addEventListener('click', () => {
        employee.vacationDays = [...selected].sort((a, b) => a - b);
        saveData();
        ui.closeModal();
        ui.renderApp();
    });

    renderCalendar();
}
