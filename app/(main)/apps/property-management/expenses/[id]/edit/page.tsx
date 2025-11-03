import { redirect } from "next/navigation";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { isHost, isCoHost } from "@/app/utils/pms-access";
import ExpenseForm from "@/app/components/property-management/ExpenseForm";

interface EditExpensePageProps {
  params: { id: string };
}

export const metadata = {
  title: "Edit Expense - BOOKIN.social",
  description: "Edit expense details",
};

export default async function EditExpensePage({ params }: EditExpensePageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/");
  }

  // Only hosts and co-hosts can edit expenses
  const [isHostUser, isCoHostUser] = await Promise.all([
    isHost(currentUser.id),
    isCoHost(currentUser.id)
  ]);

  if (!isHostUser && !isCoHostUser) {
    redirect("/apps/property-management");
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Expense</h1>
        <p className="text-gray-500 mt-1">Update expense details</p>
      </div>
      <ExpenseForm currentUser={currentUser} expenseId={params.id} />
    </div>
  );
}

