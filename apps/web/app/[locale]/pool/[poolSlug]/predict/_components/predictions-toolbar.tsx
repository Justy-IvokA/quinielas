"use client";

import { Button } from "@qp/ui";
import { Save, Filter } from "lucide-react";

interface PredictionsToolbarProps {
  onSaveAll: () => void;
  isSaving: boolean;
  dirtyCount: number;
}

export function PredictionsToolbar({ onSaveAll, isSaving, dirtyCount }: PredictionsToolbarProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-2">
        {/* Future: Add filter controls here */}
      </div>
      <Button
        onClick={onSaveAll}
        disabled={dirtyCount === 0 || isSaving}
        className="gap-2"
      >
        <Save className="w-4 h-4" />
        Save All {dirtyCount > 0 && `(${dirtyCount})`}
      </Button>
    </div>
  );
}
