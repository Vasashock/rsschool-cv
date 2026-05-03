import { getInitialPeriod, getPeriodKey } from './utils.js';

const initialPeriod = getInitialPeriod();

const defaultSort = {
    projects: { key: 'companyName', direction: 'asc' },
    employees: { key: 'name', direction: 'asc' },
};

const defaultFilters = {
    projects: {
        companyName: '',
        projectName: '',
    },
    employees: {
        name: '',
        surname: '',
        position: '',
        project: '',
    },
};

export const state = {
    currentView: 'projects',
    period: initialPeriod,
    sort: defaultSort,
    filters: defaultFilters,
    ui: {
        sidebarCollapsed: false,
        activeModal: null,
        activeFloating: null,
    },
};

export let monthlyData = {};
export let elements = {};

export function setMonthlyData(data) {
    monthlyData = data;
}

export function setElements(data) {
    elements = data;
}

export function currentPeriodKey() {
    const { year, month } = state.period;
    return getPeriodKey(year, month);
}

export function currentSnapshot() {
    const periodKey = currentPeriodKey();
    return monthlyData[periodKey];
}
