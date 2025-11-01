import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: LucideIcon;
  iconColor?: string;
}

export default function StatsCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "text-modernize-primary",
}: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        {Icon && (
          <div className={cn("rounded-lg bg-opacity-10 p-2", iconColor)}>
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {change && (
          <p
            className={cn(
              "text-xs mt-1",
              changeType === "positive" && "text-modernize-success",
              changeType === "negative" && "text-modernize-danger",
              changeType === "neutral" && "text-gray-500"
            )}
          >
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

