import { positions } from './constants.js';
import { getEmployeeById, getProjectById, getTotalEstimatedIncome } from './calculations.js';
import {
    confirmEmployeeDelete,
    getEmployeeHeaders,
    getEmployeeRows,
    openAssignmentPopup,
    openCalendarModal,
    openEmployeeAssignmentsModal,
    openEmployeeForm,
    openUnassignModal,
} from './employee.js';
import {
    confirmProjectDelete,
    createSampleSnapshot,
    getProjectHeaders,
    getProjectRows,
    openProjectEmployeesModal,
    openProjectForm,
    openSeedModal,
} from './project.js';
import { ensureMonthData, loadData, saveData } from './storage.js';
import { currentSnapshot, elements, setElements, state } from './store.js';
import { escapeAttribute, escapeHtml, formatCurrency, humanizeKey } from './utils.js';

document.addEventListener('DOMContentLoaded', init);

function init() {
    cacheElements();
    loadData(createSampleSnapshot);
    ensureMonthData();
    bindControls();
    syncPeriodControls();
    renderApp();
}

function cacheElements() {
    setElements({
        sidebar: document.getElementById('sidebar'),
        burger: document.getElementById('button-burger'),
        monthSelect: document.getElementById('select-month'),
        yearSelect: document.getElementById('select-year'),
        navLinks: [...document.querySelectorAll('.nav-links .nav')],
        title: document.getElementById('view-title'),
        addProjectBtn: document.getElementById('add-project-btn'),
        addEmployeeBtn: document.getElementById('add-employee-btn'),
        seedBtn: document.getElementById('add-seed-btn'),
        table: document.getElementById('table-content'),
        thead: document.querySelector('#table-content thead'),
        tbody: document.querySelector('#table-content tbody'),
        filterChips: document.getElementById('filter-chips'),
        summaryPanel: document.getElementById('summary-panel'),
        overlayRoot: document.getElementById('overlay-root'),
    });
}

function bindControls() {
    elements.burger.addEventListener('click', toggleSidebar);
    elements.monthSelect.addEventListener('change', handlePeriodChange);
    elements.yearSelect.addEventListener('change', handlePeriodChange);
    elements.navLinks.forEach((link) => {
        link.addEventListener('click', () => switchView(link.dataset.view));
    });
    elements.addProjectBtn.addEventListener('click', () => openProjectForm(uiApi));
    elements.addEmployeeBtn.addEventListener('click', () => openEmployeeForm(uiApi));
    elements.seedBtn.addEventListener('click', () => openSeedModal(uiApi));
    elements.table.addEventListener('click', handleTableClick);
    elements.table.addEventListener('change', handleTableChange);
    elements.filterChips.addEventListener('click', handleChipClick);
    document.addEventListener('click', handleGlobalClick);
}

function handleGlobalClick(event) {
    const floating = state.ui.activeFloating;
    if (!floating) {
        return;
    }
    const clickedInsidePopup = floating.element.contains(event.target);
    const clickedAnchor = floating.anchor && floating.anchor.contains(event.target);
    if (!clickedInsidePopup && !clickedAnchor) {
        closeFloating();
    }
}

function syncPeriodControls() {
    elements.monthSelect.value = String(state.period.month);
    elements.yearSelect.value = String(state.period.year);
}

function handlePeriodChange() {
    state.period.month = Number(elements.monthSelect.value);
    state.period.year = Number(elements.yearSelect.value);
    ensureMonthData();
    renderApp();
}

function switchView(view) {
    state.currentView = view;
    closeFloating();
    renderApp();
}

function toggleSidebar() {
    state.ui.sidebarCollapsed = !state.ui.sidebarCollapsed;
    elements.sidebar.classList.toggle('collapsed', state.ui.sidebarCollapsed);
    elements.burger.textContent = state.ui.sidebarCollapsed ? '→' : '☰';
}

function renderApp() {
    const isProjects = state.currentView === 'projects';
    elements.title.textContent = isProjects ? 'Projects' : 'Employees';
    elements.addProjectBtn.classList.toggle('hidden', !isProjects);
    elements.addEmployeeBtn.classList.toggle('hidden', isProjects);
    elements.navLinks.forEach((link) => {
        link.classList.toggle('active', link.dataset.view === state.currentView);
    });
    renderChips();
    renderTable();
    renderSummary();
}

function renderTable() {
    const isProjectsView = state.currentView === 'projects';
    const headers = isProjectsView ? getProjectHeaders() : getEmployeeHeaders();
    elements.thead.innerHTML = `<tr>${headers.map(renderHeaderCell).join('')}</tr>`;
    const rows = isProjectsView ? getProjectRows() : getEmployeeRows();
    elements.tbody.innerHTML = rows.length
        ? rows.join('')
        : `<tr><td colspan="${headers.length}" class="empty-state">No data for this period yet.</td></tr>`;
}

function renderHeaderCell(header) {
    const sortState = state.sort[state.currentView];
    let sortIcon = '';

    if (header.sortable) {
        if (sortState.key === header.key) {
            sortIcon = sortState.direction === 'asc' ? '↑' : '↓';
        } else {
            sortIcon = '⇅';
        }
    }

    const hasFilter = header.filterable && state.filters[state.currentView][header.key];
    return `
        <th>
            <div class="th-content">
                <span>${header.label}</span>
                <div class="th-actions">
                    ${header.sortable ? `<button class="icon-btn" data-action="sort" data-key="${header.key}">${sortIcon}</button>` : ''}
                    ${header.filterable ? `<button class="icon-btn ${hasFilter ? 'has-filter' : ''}" data-action="open-filter" data-key="${header.key}">⌕</button>` : ''}
                </div>
            </div>
        </th>
    `;
}

function renderSummary() {
    if (state.currentView === 'projects') {
        const total = getTotalEstimatedIncome();
        elements.summaryPanel.innerHTML = `
            <div class="summary-card">
                <span>Total Estimated Income</span>
                <strong class="${total >= 0 ? 'positive-text' : 'negative-text'}">${formatCurrency(total)}</strong>
            </div>
        `;
        return;
    }

    elements.summaryPanel.innerHTML = `
        <div class="summary-card">
            <span>Employees in period</span>
            <strong>${currentSnapshot().employees.length}</strong>
        </div>
    `;
}

function renderChips() {
    const filters = state.filters[state.currentView];
    const entries = Object.entries(filters).filter(([, value]) => value);
    if (!entries.length) {
        elements.filterChips.innerHTML = '';
        return;
    }
    const chips = entries.map(([key, value]) => `
        <button class="chip" data-action="remove-filter-chip" data-key="${key}">
            ${humanizeKey(key)}: ${escapeHtml(String(value))} ×
        </button>
    `);
    if (entries.length > 1) {
        chips.push('<button class="chip clear-chip" data-action="clear-all-filters">Clear Filters</button>');
    }
    elements.filterChips.innerHTML = chips.join('');
}

function handleChipClick(event) {
    const button = event.target.closest('button');
    if (!button) {
        return;
    }

    const { action, key } = button.dataset;

    switch (action) {
    case 'remove-filter-chip':
        state.filters[state.currentView][key] = '';
        renderApp();
        break;
    case 'clear-all-filters':
        Object.keys(state.filters[state.currentView]).forEach((filterKey) => {
            state.filters[state.currentView][filterKey] = '';
        });
        renderApp();
        break;
    default:
        break;
    }
}

function handleTableClick(event) {
    const target = event.target.closest('button');
    if (!target) {
        return;
    }
    const { action, key, projectId, employeeId } = target.dataset;

    switch (action) {
    case 'sort':
        toggleSort(key);
        break;
    case 'open-filter':
        openFilterPopup(key, target);
        break;
    case 'show-project-employees':
        openProjectEmployeesModal(projectId, uiApi);
        break;
    case 'delete-project':
        confirmProjectDelete(projectId, uiApi);
        break;
    case 'show-assignments':
        openEmployeeAssignmentsModal(employeeId, uiApi);
        break;
    case 'open-calendar':
        openCalendarModal(employeeId, uiApi);
        break;
    case 'assign':
        openAssignmentPopup(employeeId, target, null, uiApi);
        break;
    case 'delete-employee':
        confirmEmployeeDelete(employeeId, uiApi);
        break;
    default:
        break;
    }
}

function handleTableChange(event) {
    const target = event.target;
    const { action, employeeId } = target.dataset;
    const employee = getEmployeeById(employeeId);
    if (!employee) {
        return;
    }
    switch (action) {
    case 'update-position':
        employee.position = target.value;
        saveData();
        renderApp();
        break;
    case 'update-salary': {
        const value = Number(target.value);
        if (value > 0) {
            employee.salary = Number(value.toFixed(2));
            saveData();
            renderApp();
        }
        break;
    }
    default:
        break;
    }
}

function toggleSort(key) {
    const sortState = state.sort[state.currentView];
    if (sortState.key === key) {
        sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
    } else {
        sortState.key = key;
        sortState.direction = 'asc';
    }
    renderApp();
}

function openFilterPopup(key, anchor) {
    closeFloating();
    const filterValue = state.filters[state.currentView][key] || '';
    const floating = document.createElement('div');
    floating.className = 'floating-popup filter-popup';
    const isPosition = state.currentView === 'employees' && key === 'position';
    floating.innerHTML = `
        <div class="floating-title">Filter by ${humanizeKey(key)}</div>
        ${isPosition
            ? `<select id="floating-filter-input">${['<option value="">All</option>', ...positions.map((position) => `<option value="${position}" ${position === filterValue ? 'selected' : ''}>${position}</option>`)].join('')}</select>`
            : `<input id="floating-filter-input" type="text" value="${escapeAttribute(filterValue)}" placeholder="Type value">`
        }
        <div class="floating-actions">
            <button class="table-btn" data-action="apply-filter-popup" data-key="${key}">Apply</button>
            <button class="danger-btn secondary-danger" data-action="cancel-floating">Cancel</button>
        </div>
    `;
    document.body.appendChild(floating);
    positionFloating(floating, anchor);
    const input = floating.querySelector('#floating-filter-input');
    input.focus();
    input.addEventListener('keydown', (nativeEvent) => {
        if (nativeEvent.key === 'Enter') {
            applyFilterFromPopup(key, input.value);
        }
    });
    if (isPosition) {
        input.addEventListener('change', () => applyFilterFromPopup(key, input.value));
    }
    floating.addEventListener('click', (nativeEvent) => {
        const actionButton = nativeEvent.target.closest('button');
        if (!actionButton) {
            return;
        }

        switch (actionButton.dataset.action) {
        case 'apply-filter-popup':
            applyFilterFromPopup(key, input.value);
            break;
        case 'cancel-floating':
            closeFloating();
            break;
        default:
            break;
        }
    });
    state.ui.activeFloating = { element: floating, anchor };
}

function applyFilterFromPopup(key, value) {
    state.filters[state.currentView][key] = value.trim();
    closeFloating();
    renderApp();
}

function closeFloating() {
    if (state.ui.activeFloating?.cleanup) {
        state.ui.activeFloating.cleanup();
    }
    if (state.ui.activeFloating?.element) {
        state.ui.activeFloating.element.remove();
    }
    state.ui.activeFloating = null;
}

function positionFloating(element, anchor) {
    const rect = anchor.getBoundingClientRect();
    const width = Math.min(Math.max(element.offsetWidth || 260, 260), window.innerWidth - 32);
    const top = Math.min(window.innerHeight - element.offsetHeight - 16, rect.bottom + 8);
    const left = Math.min(window.innerWidth - width - 16, Math.max(16, rect.left));
    element.style.top = `${Math.max(16, top)}px`;
    element.style.left = `${left}px`;
    element.style.width = `${width}px`;
}

function openModal({ title, content, className = '' }) {
    closeModal();
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `
        <div class="modal-window ${className}">
            <div class="modal-header">
                <h2>${title}</h2>
                <button class="icon-btn large-icon" data-action="close-modal">×</button>
            </div>
            <div class="modal-body"></div>
        </div>
    `;
    const body = backdrop.querySelector('.modal-body');
    if (typeof content === 'string') {
        body.innerHTML = content;
    } else {
        body.appendChild(content);
    }
    backdrop.addEventListener('click', (event) => {
        if (event.target === backdrop || event.target.dataset.action === 'close-modal') {
            closeModal();
        }
    });
    elements.overlayRoot.appendChild(backdrop);
    state.ui.activeModal = backdrop;
    return backdrop;
}

function closeModal() {
    if (state.ui.activeModal) {
        state.ui.activeModal.remove();
        state.ui.activeModal = null;
    }
}

function bindValidatedForm(form, validators, onSubmit, submitButton) {
    const fields = [...form.elements].filter((field) => field.name);

    function validate() {
        let isValid = true;
        fields.forEach((field) => {
            const error = validators[field.name](field.value.trim());
            const holder = form.querySelector(`[data-error="${field.name}"]`);
            holder.textContent = error;
            field.classList.toggle('invalid', Boolean(error));
            if (error) {
                isValid = false;
            }
        });
        submitButton.disabled = !isValid;
        return isValid;
    }

    fields.forEach((field) => {
        field.addEventListener('input', validate);
        field.addEventListener('blur', validate);
        field.addEventListener('change', validate);
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!validate()) {
            return;
        }
        const values = Object.fromEntries(new FormData(form).entries());
        onSubmit(values);
    });

    validate();
}

function bindDetailActions(modal) {
    modal.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (!button) {
            return;
        }

        const { action, employeeId, projectId } = button.dataset;

        switch (action) {
        case 'see-employee': {
            const employee = getEmployeeById(employeeId);
            if (!employee) {
                return;
            }
            closeModal();
            state.currentView = 'employees';
            state.filters.employees = { name: employee.name, surname: employee.surname, position: '', project: '' };
            renderApp();
            break;
        }
        case 'see-project': {
            const project = getProjectById(projectId);
            if (!project) {
                return;
            }
            closeModal();
            state.currentView = 'projects';
            state.filters.projects = { companyName: '', projectName: project.projectName };
            renderApp();
            break;
        }
        case 'edit-assignment-modal': {
            closeModal();
            const employee = getEmployeeById(employeeId);
            const assignment = employee?.assignments.find((item) => item.projectId === projectId) || null;
            openAssignmentPopup(employeeId, document.body, assignment, uiApi);
            break;
        }
        case 'unassign-modal':
            openUnassignModal(employeeId, projectId, uiApi);
            break;
        default:
            break;
        }
    });
}

const uiApi = {
    bindDetailActions,
    bindValidatedForm,
    closeFloating,
    closeModal,
    openModal,
    positionFloating,
    renderApp,
};
