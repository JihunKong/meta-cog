import { SmartGoal } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

interface SmartGoalCardProps {
  goal: SmartGoal;
}

export function SmartGoalCard({ goal }: SmartGoalCardProps) {
  const progress = (goal.achievement / goal.target) * 100;

  return (
    <Link href={`/smart-goals/${goal.id}`}>
      <Card className="hover:bg-muted/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{goal.subject}</CardTitle>
            <Badge variant={goal.status === "COMPLETED" ? "default" : "secondary"}>
              {goal.status === "COMPLETED" ? "완료" : "진행 중"}
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
              {goal.specific}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
} 