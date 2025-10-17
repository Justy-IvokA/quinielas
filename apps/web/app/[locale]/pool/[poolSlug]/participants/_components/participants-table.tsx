"use client";

import { useTranslations } from "next-intl";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell,
  Button
} from "@qp/ui";
import { cn } from "@qp/ui";

interface Participant {
  userId: string;
  userName: string;
  userEmail: string;
  totalPoints: number;
  exactCount: number;
  signCount: number;
  missCount: number;
  drawHits: number;
  predictionsCount: number;
  onTimePercentage: number;
}

interface ParticipantsTableProps {
  participants: Participant[];
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (column: any) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function ParticipantsTable({
  participants,
  sortBy,
  sortOrder,
  onSort,
  page,
  totalPages,
  onPageChange
}: ParticipantsTableProps) {
  const t = useTranslations("participants");

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) {
      return <ChevronsUpDown className="w-4 h-4 ml-2 opacity-50" />;
    }
    return sortOrder === "asc" ? (
      <ChevronUp className="w-4 h-4 ml-2" />
    ) : (
      <ChevronDown className="w-4 h-4 ml-2" />
    );
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>
                <button
                  onClick={() => onSort("name")}
                  className="flex items-center font-semibold hover:text-primary"
                >
                  {t("columns.name")}
                  <SortIcon column="name" />
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button
                  onClick={() => onSort("points")}
                  className="flex items-center justify-end w-full font-semibold hover:text-primary"
                >
                  {t("columns.points")}
                  <SortIcon column="points" />
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button
                  onClick={() => onSort("exactCount")}
                  className="flex items-center justify-end w-full font-semibold hover:text-primary"
                >
                  {t("columns.exacts")}
                  <SortIcon column="exactCount" />
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button
                  onClick={() => onSort("signCount")}
                  className="flex items-center justify-end w-full font-semibold hover:text-primary"
                >
                  {t("columns.signs")}
                  <SortIcon column="signCount" />
                </button>
              </TableHead>
              <TableHead className="text-right">{t("columns.misses")}</TableHead>
              <TableHead className="text-right">{t("columns.draws")}</TableHead>
              <TableHead className="text-right">
                <button
                  onClick={() => onSort("predictionsCount")}
                  className="flex items-center justify-end w-full font-semibold hover:text-primary"
                >
                  {t("columns.predictions")}
                  <SortIcon column="predictionsCount" />
                </button>
              </TableHead>
              <TableHead className="text-right">{t("columns.onTime")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {participants.map((participant, index) => {
              const rank = (page - 1) * 20 + index + 1;
              return (
                <TableRow key={participant.userId}>
                  <TableCell className="font-medium">
                    <span
                      className={cn(
                        "inline-flex items-center justify-center w-8 h-8 rounded-full",
                        rank === 1 && "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 font-bold",
                        rank === 2 && "bg-gray-400/20 text-gray-600 dark:text-gray-400 font-bold",
                        rank === 3 && "bg-orange-500/20 text-orange-600 dark:text-orange-400 font-bold"
                      )}
                    >
                      {rank}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{participant.userName}</p>
                      <p className="text-xs text-muted-foreground">{participant.userEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold text-primary">
                    {participant.totalPoints}
                  </TableCell>
                  <TableCell className="text-right">{participant.exactCount}</TableCell>
                  <TableCell className="text-right">{participant.signCount}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {participant.missCount}
                  </TableCell>
                  <TableCell className="text-right">{participant.drawHits}</TableCell>
                  <TableCell className="text-right">{participant.predictionsCount}</TableCell>
                  <TableCell className="text-right">
                    <span className="text-sm">{participant.onTimePercentage}%</span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
          >
            {t("pagination.previous")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t("pagination.page", { current: page, total: totalPages })}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
          >
            {t("pagination.next")}
          </Button>
        </div>
      )}
    </div>
  );
}
