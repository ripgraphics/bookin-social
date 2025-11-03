import { Suspense } from 'react';
import ExpenseForm from '@/app/components/property-management/ExpenseForm';
import LoadingSkeleton from '@/app/components/property-management/shared/LoadingSkeleton';

async function getExpense(expenseId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/expenses/${expenseId}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching expense:', error);
    return null;
  }
}

async function EditExpenseContent({ expenseId }: { expenseId: string }) {
  const expense = await getExpense(expenseId);

  if (!expense) {
    return (
      <div className="text-center py-12">
        <h3 className="text-sm font-medium text-gray-900">Expense not found</h3>
      </div>
    );
  }

  return <ExpenseForm expense={expense} />;
}

export default async function EditExpensePage({
  params
}: {
  params: { id: string }
}) {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Edit Expense
        </h1>
        <p className="text-gray-600">
          Update expense details and information.
        </p>
      </div>

      <Suspense fallback={<LoadingSkeleton type="form" count={10} />}>
        <EditExpenseContent expenseId={params.id} />
      </Suspense>
    </div>
  );
}

