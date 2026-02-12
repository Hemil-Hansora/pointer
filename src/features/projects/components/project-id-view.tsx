"use client";

import { cn } from "@/lib/utils";
import { Id } from "../../../../convex/_generated/dataModel";
import { useState } from "react";
import { GithubIcon } from "lucide-react";

const Tab = ({
  label,
  onClick,
  isActive,
}: {
  label: string;
  onClick: () => void;
  isActive: boolean;
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 h-full px-3  cursor-pointer border-r text-muted-foreground  hover:bg-accent/30",
        isActive && "bg-background text-foreground",
      )}
    >
      <span className="text-sm">{label}</span>
    </div>
  );
};

export const ProjectIdView = ({ projectId }: { projectId: Id<"projects"> }) => {
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");
  return (
    <div className="h-full flex flex-col">
      <nav className="h-[35px] flex items-center bg-sidebar border-b">
        <Tab
          label="Code"
          isActive={activeTab === "editor"}
          onClick={() => setActiveTab("editor")}
        />
        <Tab
          label="Preview"
          isActive={activeTab === "preview"}
          onClick={() => setActiveTab("preview")}
        />
        <div className="flex-1 flex justify-end h-full">
          <div className="flex items-center gap-1.5 h-full px-3  cursor-pointer border-l text-muted-foreground  hover:bg-accent/30">
          <GithubIcon className="size-3.5"/>
<span className="text-sm">Export</span>
          </div>
        </div>
      </nav>
      <div className="flex-1 relative">
        <div
          className={cn(
            "absolute inset-0",
            activeTab === "editor" ? "visible" : "invisible",
          )}
        >
          <div>Editor</div>
        </div>
        <div
          className={cn(
            "absolute inset-0",
            activeTab === "preview" ? "visible" : "invisible",
          )}
        >
          <div>Preview</div>
        </div>
      </div>
    </div>
  );
};
