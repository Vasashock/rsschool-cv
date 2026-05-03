import { BENCH_CAPACITY } from './constants.js';
import { currentSnapshot, state } from './store.js';

export function getWorkingDays(year, month) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let count = 0;
    for (let day = 1; day <= daysInMonth; day += 1) {
        const date = new Date(year, month, day);
        const weekday = date.getDay();
        if (weekday !== 0 && weekday !== 6) {
            count += 1;
        }
    }
    return count;
}

export function isWeekend(year, month, day) {
    const weekDay = new Date(year, month, day).getDay();
    return weekDay === 0 || weekDay === 6;
}

export function getVacationWorkingDays(employee) {
    return employee.vacationDays.filter((day) => !isWeekend(state.period.year, state.period.month, day)).length;
}

export function getVacationCoefficient(employee) {
    const workingDays = getWorkingDays(state.period.year, state.period.month);
    if (!workingDays) {
        return 1;
    }
    return Math.max(0, (workingDays - getVacationWorkingDays(employee)) / workingDays);
}

export function getProjectById(projectId) {
    return currentSnapshot().projects.find((project) => project.id === projectId);
}

export function getEmployeeById(employeeId) {
    return currentSnapshot().employees.find((employee) => employee.id === employeeId);
}

export function getAssignmentDetails(employee, assignment) {
    const project = getProjectById(assignment.projectId);
    if (!project) {
        return null;
    }
    const vacationCoefficient = getVacationCoefficient(employee);
    const effectiveCapacity = assignment.capacity * assignment.fit * vacationCoefficient;
    return {
        employee,
        project,
        assignment,
        vacationCoefficient,
        effectiveCapacity,
    };
}

export function getProjectAssignments(projectId) {
    const assignments = [];

    currentSnapshot().employees.forEach((employee) => {
        employee.assignments.forEach((assignment) => {
            const details = getAssignmentDetails(employee, assignment);
            if (details && details.project.id === projectId) {
                assignments.push(details);
            }
        });
    });

    return assignments;
}

export function getProjectMetrics(project) {
    const assignments = getProjectAssignments(project.id);
    let usedCapacity = 0;

    assignments.forEach((item) => {
        usedCapacity += item.effectiveCapacity;
    });

    const capacityForRevenue = Math.max(project.capacity, usedCapacity);
    const revenuePerCapacity = capacityForRevenue > 0 ? project.budget / capacityForRevenue : 0;
    const rows = [];
    let totalRevenue = 0;
    let totalCost = 0;

    assignments.forEach((item) => {
        const revenue = revenuePerCapacity * item.effectiveCapacity;
        const cost = item.employee.salary * Math.max(BENCH_CAPACITY, item.assignment.capacity);
        const profit = revenue - cost;

        rows.push({
            ...item,
            revenue,
            cost,
            profit,
        });

        totalRevenue += revenue;
        totalCost += cost;
    });

    const income = totalRevenue - totalCost;

    return {
        usedCapacity,
        capacityForRevenue,
        revenuePerCapacity,
        rows,
        totalRevenue,
        totalCost,
        income,
    };
}

export function getEmployeeMetrics(employee) {
    const rows = [];
    let assignedCapacity = 0;
    let estimatedPayment = 0;
    let projectedIncome = 0;

    employee.assignments.forEach((assignment) => {
        assignedCapacity += assignment.capacity;

        const details = getAssignmentDetails(employee, assignment);
        if (!details) {
            return;
        }

        const projectMetrics = getProjectMetrics(details.project);
        const revenue = projectMetrics.revenuePerCapacity * details.effectiveCapacity;
        const cost = employee.salary * Math.max(BENCH_CAPACITY, details.assignment.capacity);
        const profit = revenue - cost;

        rows.push({
            ...details,
            revenue,
            cost,
            profit,
        });

        estimatedPayment += cost;
        projectedIncome += profit;
    });

    if (!rows.length) {
        estimatedPayment = employee.salary * BENCH_CAPACITY;
    }

    return {
        rows,
        assignedCapacity,
        estimatedPayment,
        projectedIncome,
    };
}

export function getTotalEstimatedIncome() {
    const projectIncome = currentSnapshot().projects.reduce((sum, project) => sum + getProjectMetrics(project).income, 0);
    const benchPayments = currentSnapshot().employees
        .filter((employee) => employee.assignments.length === 0)
        .reduce((sum, employee) => sum + employee.salary * BENCH_CAPACITY, 0);
    return projectIncome - benchPayments;
}
