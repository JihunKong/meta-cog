import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SmartGoalCard } from "./smart-goal-card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export async function SmartGoalList() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  const goals = await prisma.smartGoal.findMany({
    where: {
      user_id: session.user.id,
    },
    orderBy: {
      created_at: "desc",
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">SMART 목표</h2>
        <Link href="/smart-goals/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            새 목표
          </Button>
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => (
          <SmartGoalCard key={goal.id} goal={goal} />
        ))}
      </div>
    </div>
  );
} 