import { redirect } from "next/navigation";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { isHost, isCoHost } from "@/app/utils/pms-access";
import ExpenseForm from "@/app/components/property-management/ExpenseForm";

export const metadata = {
  title: "Submit Expense - BOOKIN.social",
  description: "Submit a new expense",
};

export default async function NewExpensePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/");
  }

  // Only hosts and co-hosts can submit expenses
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
        <h1 className="text-3xl font-bold text-gray-900">Submit Expense</h1>
        <p className="text-gray-500 mt-1">Submit a new expense for approval</p>
      </div>
      <ExpenseForm currentUser={currentUser} />
    </div>
  );
}

