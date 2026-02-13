"use client";
import { Id } from "../../../../convex/_generated/dataModel";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Poppins } from "next/font/google";
import { UserButton } from "@clerk/nextjs";
import { useProject, useRenameProject } from "../hooks/use-projects";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CloudCheckIcon, Loader2Icon, LoaderIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const font = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const Navbar = ({ projectId }: { projectId: Id<"projects"> }) => {
  const project = useProject(projectId);
  const renamedProject = useRenameProject();

  const [isRenaming, setIsRenaming] = useState(false);
  const [name, setName] = useState(project?.name ?? "");

  const handleStartRename = () => {
    if (!project) return;
    setName(project.name);
    setIsRenaming(true);
  };

  const handleSubmit = () => {
    if (!project) return;
    setIsRenaming(false);
    const trimmedName = name.trim();
    if (trimmedName.length === 0 || trimmedName === project?.name) return;
    renamedProject({ id: project._id, name: trimmedName });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    } else if (e.key === "Escape") {
      setIsRenaming(false);
    }
  };

  return (
    <nav className="flex justify-between items-center gap-2 min-h-14 p-2 bg-sidebar border-b">
      <div className="flex items-center gap-x-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink className="flex items-center  gap-1.5" asChild>
                <Button
                  variant={"ghost"}
                  className="w-fit! p-1.5! h-7!"
                  asChild
                >
                  <Link href={"/"}>
                    <Image src="/logo.svg" alt="Logo" width={20} height={20} />
                    <span className={cn("text-sm font-medium", font.className)}>
                      Pointer
                    </span>
                  </Link>
                </Button>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="ml-0! mr-1!" />
            <BreadcrumbItem>
              {isRenaming ? (
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={(e) => e.currentTarget.select()}
                  onBlur={handleSubmit}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  className="text-sm! truncate max-w-40"
                />
              ) : (
                <BreadcrumbPage
                  onClick={handleStartRename}
                  className="text-sm cursor-pointer hover:text-primary font-medium truncate max-w-40"
                >
                  {project?.name ?? "loading..."}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {project?.importStatus === "importing" ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <LoaderIcon className="size-4 text-muted-foreground animate-spin" />
            </TooltipTrigger>
            <TooltipContent>Importing...</TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <CloudCheckIcon className="size-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              Saved{" "}
              {project?.updatedAt
                ? formatDistanceToNow(project.updatedAt, { addSuffix: true })
                : "Loading..."}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className="flex items-center gap-2">
        <UserButton />
      </div>
    </nav>
  );
};
