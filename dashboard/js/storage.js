import { STORAGE_KEY } from './constants.js';
import { positions } from './constants.js';
import { currentPeriodKey, monthlyData, setMonthlyData } from './store.js';
import { uid } from './utils.js';

export function loadData(createSampleSnapshot) {
    let parsed = {};
    try {
        parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (error) {
        parsed = {};
    }

    const nextData = typeof parsed === 'object' && parsed ? parsed : {};
    if (!Object.keys(nextData).length) {
        nextData[currentPeriodKey()] = createSampleSnapshot();
    } else {
        Object.keys(nextData).forEach((key) => {
            nextData[key] = normalizeSnapshot(nextData[key]);
        });
    }

    setMonthlyData(nextData);
    saveData();
}

export function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(monthlyData));
}

export function normalizeSnapshot(snapshot) {
    const normalized = {
        employees: Array.isArray(snapshot?.employees) ? snapshot.employees : [],
        projects: Array.isArray(snapshot?.projects) ? snapshot.projects : [],
    };

    normalized.employees = normalized.employees.map((employee) => ({
        id: employee.id || uid(),
        name: employee.name || '',
        surname: employee.surname || '',
        dob: employee.dob || '1995-01-01',
        position: positions.includes(employee.position) ? employee.position : 'Junior',
        salary: Number(employee.salary) || 0,
        vacationDays: Array.isArray(employee.vacationDays) ? employee.vacationDays : [],
        assignments: Array.isArray(employee.assignments) ? employee.assignments.map((assignment) => ({
            projectId: assignment.projectId,
            capacity: Number(assignment.capacity) || 0,
            fit: Number(assignment.fit) || 0,
        })) : [],
    }));

    normalized.projects = normalized.projects.map((project) => ({
        id: project.id || uid(),
        projectName: project.projectName || '',
        companyName: project.companyName || '',
        budget: Number(project.budget) || 0,
        capacity: Number(project.capacity) || 1,
    }));

    return normalized;
}

export function ensureMonthData() {
    const key = currentPeriodKey();
    if (!monthlyData[key]) {
        monthlyData[key] = { employees: [], projects: [] };
    }
    monthlyData[key] = normalizeSnapshot(monthlyData[key]);
    saveData();
}
