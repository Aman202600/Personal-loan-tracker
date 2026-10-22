export function formatCurrency(amount: number): string {
  if (isNaN(amount)) return '₹0';
  const rounded = Math.round(amount * 100) / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: rounded % 1 === 0 ? 0 : 2,
  }).format(rounded);
}

export function formatDate(dateString: string | Date): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
}

export function getRelativeDueDateText(
  dueDateString: string | Date,
  status: string
): { text: string; isOverdue: boolean } {
  if (status === 'repaid') {
    return { text: 'Fully Settled', isOverdue: false };
  }

  const due = new Date(dueDateString);
  const now = new Date();

  // Reset times to compare dates
  const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const diffDays = Math.round((dueMidnight - nowMidnight) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const daysAgo = Math.abs(diffDays);
    return {
      text: `Overdue by ${daysAgo} day${daysAgo === 1 ? '' : 's'}`,
      isOverdue: true,
    };
  } else if (diffDays === 0) {
    return { text: 'Due Today', isOverdue: false };
  } else if (diffDays === 1) {
    return { text: 'Due Tomorrow', isOverdue: false };
  } else {
    return { text: `Due in ${diffDays} days`, isOverdue: false };
  }
}
