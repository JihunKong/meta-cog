import { StudyPlan } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface StudyPlanCardProps {
  plan: StudyPlan;
}

export function StudyPlanCard({ plan }: StudyPlanCardProps) {
  const progress = (plan.achievement / plan.target) * 100;

  return (
    <Link href={`/study-plans/${plan.id}`}>
      <Card className="hover:bg-muted/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{plan.subject}</CardTitle>
            <Badge variant="outline">
              {format(new Date(plan.date), "PPP", { locale: ko })}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>달성도</span>
              <span>{progress.toFixed(1)}%</span>
            </div>
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground line-clamp-2">
              {plan.content}
            </p>
            {plan.reflection && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {plan.reflection}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
} 