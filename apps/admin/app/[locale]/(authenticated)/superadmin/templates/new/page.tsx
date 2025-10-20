"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@admin/trpc";
import { toast } from "sonner";
import {
  Button,
  Input,
  Label,
  Textarea,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@qp/ui";
import { ArrowLeftIcon, SaveIcon } from "lucide-react";

export default function NewTemplatePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    slug: "",
    title: "",
    description: "",
    status: "DRAFT" as "DRAFT" | "PUBLISHED" | "ARCHIVED",
    competitionExternalId: "",
    seasonYear: new Date().getFullYear(),
    stageLabel: "",
    roundLabel: "",
    accessType: "PUBLIC" as "PUBLIC" | "CODE" | "EMAIL_INVITE",
    requireCaptcha: false,
    requireEmailVerification: false,
    exactScore: 5,
    correctSign: 3,
    goalDiffBonus: 1
  });

  const createMutation = trpc.superadmin.templates.create.useMutation({
    onSuccess: (data) => {
      toast.success("Template created successfully");
      router.push(`/superadmin/templates/${data.id}/edit`);
    },
    onError: (error) => {
      toast.error(error.message || "Error creating template");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    createMutation.mutate({
      slug: formData.slug,
      title: formData.title,
      description: formData.description || undefined,
      status: formData.status,
      competitionExternalId: formData.competitionExternalId || undefined,
      seasonYear: formData.seasonYear || undefined,
      stageLabel: formData.stageLabel || undefined,
      roundLabel: formData.roundLabel || undefined,
      rules: {
        exactScore: formData.exactScore,
        correctSign: formData.correctSign,
        goalDiffBonus: formData.goalDiffBonus,
        tieBreakers: ["EXACT_SCORES", "CORRECT_SIGNS"]
      },
      accessDefaults: {
        accessType: formData.accessType,
        requireCaptcha: formData.requireCaptcha,
        requireEmailVerification: formData.requireEmailVerification
      }
    });
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4"
          StartIcon={ArrowLeftIcon}
        >
          Back
        </Button>
        <h1 className="text-3xl font-bold">Create Pool Template</h1>
        <p className="text-muted-foreground mt-1">
          Define a reusable pool configuration for quick tenant provisioning
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="scope">Sport Scope</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
            <TabsTrigger value="access">Access</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Template identification and description
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="World Cup 2026 - Group Stage"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="world-cup-2026-groups"
                    pattern="[a-z0-9-]+"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Lowercase letters, numbers, and hyphens only
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Template for FIFA World Cup 2026 group stage pools"
                    rows={3}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Only PUBLISHED templates can be assigned to tenants
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scope" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sport Provider Scope</CardTitle>
                <CardDescription>
                  Define which fixtures to import from the sports API provider
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="competitionExternalId">Competition External ID *</Label>
                  <Input
                    id="competitionExternalId"
                    value={formData.competitionExternalId}
                    onChange={(e) => setFormData({ ...formData, competitionExternalId: e.target.value })}
                    placeholder="1 (for World Cup in API-Football)"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Provider-specific competition ID (e.g., API-Football competition ID)
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="seasonYear">Season Year *</Label>
                  <Input
                    id="seasonYear"
                    type="number"
                    value={formData.seasonYear}
                    onChange={(e) => setFormData({ ...formData, seasonYear: parseInt(e.target.value) })}
                    placeholder="2026"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="stageLabel">Stage Label (Optional)</Label>
                  <Input
                    id="stageLabel"
                    value={formData.stageLabel}
                    onChange={(e) => setFormData({ ...formData, stageLabel: e.target.value })}
                    placeholder="Group Stage"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to import all stages
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="roundLabel">Round Label (Optional)</Label>
                  <Input
                    id="roundLabel"
                    value={formData.roundLabel}
                    onChange={(e) => setFormData({ ...formData, roundLabel: e.target.value })}
                    placeholder="Round 1"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to import all rounds
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rules" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Scoring Rules</CardTitle>
                <CardDescription>
                  Default scoring configuration for pools created from this template
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="exactScore">Points for Exact Score</Label>
                  <Input
                    id="exactScore"
                    type="number"
                    value={formData.exactScore}
                    onChange={(e) => setFormData({ ...formData, exactScore: parseInt(e.target.value) })}
                    min="0"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="correctSign">Points for Correct Sign (1X2)</Label>
                  <Input
                    id="correctSign"
                    type="number"
                    value={formData.correctSign}
                    onChange={(e) => setFormData({ ...formData, correctSign: parseInt(e.target.value) })}
                    min="0"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="goalDiffBonus">Bonus for Goal Difference</Label>
                  <Input
                    id="goalDiffBonus"
                    type="number"
                    value={formData.goalDiffBonus}
                    onChange={(e) => setFormData({ ...formData, goalDiffBonus: parseInt(e.target.value) })}
                    min="0"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="access" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Access Policy Defaults</CardTitle>
                <CardDescription>
                  Default access configuration for pools created from this template
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="accessType">Access Type</Label>
                  <Select
                    value={formData.accessType}
                    onValueChange={(value: any) => setFormData({ ...formData, accessType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLIC">Public</SelectItem>
                      <SelectItem value="CODE">Invite Code</SelectItem>
                      <SelectItem value="EMAIL_INVITE">Email Invitation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="requireCaptcha"
                    checked={formData.requireCaptcha}
                    onChange={(e) => setFormData({ ...formData, requireCaptcha: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="requireCaptcha" className="cursor-pointer">
                    Require CAPTCHA
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="requireEmailVerification"
                    checked={formData.requireEmailVerification}
                    onChange={(e) => setFormData({ ...formData, requireEmailVerification: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="requireEmailVerification" className="cursor-pointer">
                    Require Email Verification
                  </Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending} StartIcon={SaveIcon}>
            {createMutation.isPending ? "Creating..." : "Create Template"}
          </Button>
        </div>
      </form>
    </div>
  );
}
