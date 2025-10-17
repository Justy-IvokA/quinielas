"use client";

import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@qp/ui";

interface UserPoolsToolbarProps {
  filter: "ALL" | "ACTIVE" | "FINALIZED" | "PENDING";
  onFilterChange: (filter: "ALL" | "ACTIVE" | "FINALIZED" | "PENDING") => void;
  sort: "RECENT" | "NEXT_KICKOFF" | "FINALIZED_RECENT";
  onSortChange: (sort: "RECENT" | "NEXT_KICKOFF" | "FINALIZED_RECENT") => void;
  search: string;
  onSearchChange: (search: string) => void;
}

export function UserPoolsToolbar({
  filter,
  onFilterChange,
  sort,
  onSortChange,
  search,
  onSearchChange
}: UserPoolsToolbarProps) {
  const t = useTranslations("myPools");
  const tCommon = useTranslations("common");

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/50" />
        <Input
          type="text"
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-white/10 border-white/20 text-primary placeholder:text-primary/50 focus:bg-white/15"
        />
      </div>

      {/* Filter */}
      <Select value={filter} onValueChange={(value) => onFilterChange(value as typeof filter)}>
        <SelectTrigger className="w-full sm:w-[180px] bg-white/10 border-white/20 text-primary">
          <SelectValue placeholder={tCommon("filter")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">{t("filters.all")}</SelectItem>
          <SelectItem value="ACTIVE">{t("filters.active")}</SelectItem>
          <SelectItem value="FINALIZED">{t("filters.finalized")}</SelectItem>
          <SelectItem value="PENDING">{t("filters.pending")}</SelectItem>
        </SelectContent>
      </Select>

      {/* Sort */}
      <Select value={sort} onValueChange={(value) => onSortChange(value as typeof sort)}>
        <SelectTrigger className="w-full sm:w-[200px] bg-white/10 border-white/20 text-primary">
          <SelectValue placeholder={tCommon("sort")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="RECENT">{t("sort.recent")}</SelectItem>
          <SelectItem value="NEXT_KICKOFF">{t("sort.nextKickoff")}</SelectItem>
          <SelectItem value="FINALIZED_RECENT">{t("sort.finalizedRecent")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
