import ExpenseForm from '@/app/components/property-management/ExpenseForm';

export default function NewExpensePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Record New Expense
        </h1>
        <p className="text-gray-600">
          Track property-related expenses for reimbursement and reporting.
        </p>
      </div>

      <ExpenseForm />
    </div>
  );
}

