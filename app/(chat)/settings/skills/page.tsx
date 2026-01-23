"use client";

import {
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  Loader2Icon,
  PlusIcon,
  SparklesIcon,
  Trash2Icon,
  XCircleIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface UserSkill {
  id: string;
  name: string;
  displayName: string;
  description: string;
  instructions: string;
  isEnabled: boolean;
  source: "user" | "plugin" | "builtin";
  pluginName: string | null;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function SkillCard({
  skill,
  onUpdate,
  onDelete,
}: {
  skill: UserSkill;
  onUpdate: (id: string, data: Partial<UserSkill>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(skill.displayName);
  const [description, setDescription] = useState(skill.description);
  const [instructions, setInstructions] = useState(skill.instructions);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isReadOnly = skill.source === "plugin" || skill.source === "builtin";

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(skill.id, { displayName, description, instructions });
      setIsEditing(false);
      toast.success("Skill updated");
    } catch (error) {
      toast.error("Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(skill.id);
      toast.success("Skill deleted");
    } catch (error) {
      toast.error("Failed to delete");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggle = async (enabled: boolean) => {
    try {
      await onUpdate(skill.id, { isEnabled: enabled });
    } catch (error) {
      toast.error("Failed to update");
    }
  };

  return (
    <Card className={!skill.isEnabled ? "opacity-60" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="p-1 hover:bg-muted rounded"
              onClick={() => setIsExpanded(!isExpanded)}
              type="button"
            >
              {isExpanded ? (
                <ChevronDownIcon className="h-4 w-4" />
              ) : (
                <ChevronRightIcon className="h-4 w-4" />
              )}
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <SparklesIcon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {skill.displayName}
                {skill.source !== "user" && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {skill.source === "plugin"
                      ? skill.pluginName
                      : skill.source}
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                {skill.description.slice(0, 100)}
                {skill.description.length > 100 ? "..." : ""}
              </CardDescription>
            </div>
          </div>
          <Switch
            checked={skill.isEnabled}
            onCheckedChange={handleToggle}
          />
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-4 space-y-4">
          {isEditing && !isReadOnly ? (
            <>
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input
                  onChange={(e) => setDisplayName(e.target.value)}
                  value={displayName}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  className="resize-none"
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  value={description}
                />
              </div>
              <div className="space-y-2">
                <Label>Instructions</Label>
                <Textarea
                  className="font-mono text-sm resize-none"
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={10}
                  value={instructions}
                />
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label className="text-muted-foreground">Instructions</Label>
              <div className="bg-muted/50 rounded-md p-3 text-sm whitespace-pre-wrap font-mono max-h-64 overflow-y-auto">
                {skill.instructions}
              </div>
            </div>
          )}
        </CardContent>
      )}

      {isExpanded && (
        <CardFooter className="flex justify-between gap-2 pt-0">
          <div className="flex gap-2">
            {!isReadOnly && (
              <>
                {isEditing ? (
                  <>
                    <Button
                      onClick={() => {
                        setIsEditing(false);
                        setDisplayName(skill.displayName);
                        setDescription(skill.description);
                        setInstructions(skill.instructions);
                      }}
                      size="sm"
                      variant="outline"
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={isSaving}
                      onClick={handleSave}
                      size="sm"
                    >
                      {isSaving && (
                        <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Save
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setIsEditing(true)}
                    size="sm"
                    variant="outline"
                  >
                    Edit
                  </Button>
                )}
              </>
            )}
          </div>
          {!isReadOnly && (
            <Button
              disabled={isDeleting}
              onClick={handleDelete}
              size="icon"
              variant="ghost"
            >
              {isDeleting ? (
                <Loader2Icon className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2Icon className="h-4 w-4 text-destructive" />
              )}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}

function AddSkillForm({
  onAdd,
}: {
  onAdd: (content: string) => Promise<ValidationResult>;
}) {
  const [content, setContent] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const exampleSkill = `---
name: my-custom-skill
description: A brief description of when to use this skill
---

# My Custom Skill

Instructions for the AI go here. These will be injected into the system prompt when this skill is enabled.

## Guidelines
- Be concise
- Follow best practices
- Provide examples when helpful`;

  const handleAdd = async () => {
    if (!content.trim()) {
      toast.error("Please enter skill content");
      return;
    }

    setIsAdding(true);
    setValidationErrors([]);

    try {
      const result = await onAdd(content);
      if (result.valid) {
        setContent("");
        toast.success("Skill added");
      } else {
        setValidationErrors(result.errors);
      }
    } catch (error) {
      toast.error("Failed to add skill");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add New Skill</CardTitle>
        <CardDescription>
          Paste a SKILL.md file content or write your own skill instructions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="skill-content">Skill Content (SKILL.md format)</Label>
          <Textarea
            className="font-mono text-sm resize-none"
            id="skill-content"
            onChange={(e) => setContent(e.target.value)}
            placeholder={exampleSkill}
            rows={12}
            value={content}
          />
        </div>

        {validationErrors.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-destructive mb-1">
              <XCircleIcon className="h-4 w-4" />
              Validation Errors
            </div>
            <ul className="list-disc list-inside text-sm text-destructive/80 space-y-1">
              {validationErrors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            <strong>Format:</strong> Skills use YAML frontmatter followed by
            Markdown instructions.
          </p>
          <p>
            <strong>Required fields:</strong> <code>name</code> (lowercase with
            hyphens) and <code>description</code>
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button disabled={!content.trim() || isAdding} onClick={handleAdd}>
          {isAdding && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Skill
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function SkillsSettingsPage() {
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSkills = useCallback(async () => {
    try {
      const response = await fetch("/api/settings/skills");
      if (response.ok) {
        const data = await response.json();
        setSkills(data);
      }
    } catch (error) {
      console.error("Failed to fetch skills:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  const handleAdd = async (content: string): Promise<ValidationResult> => {
    const response = await fetch("/api/settings/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    const result = await response.json();

    if (response.ok) {
      await fetchSkills();
      return { valid: true, errors: [] };
    }

    return {
      valid: false,
      errors: result.errors || [result.message || "Unknown error"],
    };
  };

  const handleUpdate = async (id: string, data: Partial<UserSkill>) => {
    const response = await fetch(`/api/settings/skills/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to update");
    }

    await fetchSkills();
  };

  const handleDelete = async (id: string) => {
    const response = await fetch(`/api/settings/skills/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete");
    }

    await fetchSkills();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const userSkills = skills.filter((s) => s.source === "user");
  const pluginSkills = skills.filter((s) => s.source !== "user");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Skills</h2>
        <p className="text-sm text-muted-foreground">
          Add custom skills to extend your AI assistant with specialized
          knowledge and workflows.
        </p>
      </div>

      {/* Add new skill */}
      <AddSkillForm onAdd={handleAdd} />

      {/* User skills */}
      {userSkills.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Your Skills</h3>
          <div className="grid gap-3">
            {userSkills.map((skill) => (
              <SkillCard
                key={skill.id}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
                skill={skill}
              />
            ))}
          </div>
        </div>
      )}

      {/* Plugin-bundled skills */}
      {pluginSkills.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Plugin Skills</h3>
          <p className="text-sm text-muted-foreground">
            These skills are provided by installed plugins and cannot be edited.
          </p>
          <div className="grid gap-3">
            {pluginSkills.map((skill) => (
              <SkillCard
                key={skill.id}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
                skill={skill}
              />
            ))}
          </div>
        </div>
      )}

      {skills.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <SparklesIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No skills configured yet.</p>
            <p className="text-sm text-muted-foreground">
              Add your first skill above to enhance your AI assistant.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
