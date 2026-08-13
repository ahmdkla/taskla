"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PauseIcon, PlayIcon, RotateCcwIcon, CheckIcon } from "lucide-react";
import { logFocusSession } from "@/lib/actions/focus";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TaskOption = { id: string; title: string };

function formatElapsed(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
}

export function FocusTimer({ tasks }: { tasks: TaskOption[] }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [taskId, setTaskId] = useState<string>("none");
  const [isPending, startTransition] = useTransition();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const hasElapsed = elapsed > 0;

  function reset() {
    setRunning(false);
    setElapsed(0);
  }

  function finish() {
    if (!hasElapsed) return;
    const minutes = Math.max(1, Math.round(elapsed / 60));
    const selectedTaskId = taskId === "none" ? null : taskId;
    setRunning(false);
    startTransition(async () => {
      await logFocusSession(selectedTaskId, minutes);
      setElapsed(0);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <div className="font-mono text-6xl font-semibold tabular-nums tracking-tight">
        {formatElapsed(elapsed)}
      </div>

      <div className="w-full max-w-xs space-y-1.5">
        <Select value={taskId} onValueChange={(v) => setTaskId(v ?? "none")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="No task">
              {(id: string) =>
                id === "none"
                  ? "No task"
                  : (tasks.find((t) => t.id === id)?.title ?? "No task")
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No task</SelectItem>
            {tasks.map((task) => (
              <SelectItem key={task.id} value={task.id}>
                {task.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="lg"
          onClick={() => setRunning((r) => !r)}
          disabled={isPending}
        >
          {running ? <PauseIcon /> : <PlayIcon />}
          {running ? "Pause" : hasElapsed ? "Resume" : "Start"}
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={reset}
          disabled={!hasElapsed || isPending}
        >
          <RotateCcwIcon />
          Reset
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={finish}
          disabled={!hasElapsed || isPending}
        >
          <CheckIcon />
          {isPending ? "Saving…" : "Finish"}
        </Button>
      </div>
    </div>
  );
}
