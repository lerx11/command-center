import { createClient } from "@/utils/supabase/server";
import { ParkingIdeaCard } from "@/components/parking/parking-idea-card";
import { EmptyState } from "@/components/shared/empty-state";
import type { ParkingIdea, Project } from "@/lib/types";

export default async function ParkingPage() {
  const supabase = await createClient();

  const { data: ideas } = await supabase
    .from("parking_ideas")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  const ideaList = (ideas ?? []) as unknown as ParkingIdea[];
  const projectList = (projects ?? []) as unknown as Project[];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Parking Lot</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ideas live here until you decide to make them tasks.
        </p>
      </header>

      {ideaList.length === 0 ? (
        <EmptyState
          title="No ideas parked yet."
          description="Use the + button anywhere to capture a thought — it won't become a task until you decide."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {ideaList.map((idea) => (
            <ParkingIdeaCard key={idea.id} idea={idea} projects={projectList} />
          ))}
        </div>
      )}
    </div>
  );
}
