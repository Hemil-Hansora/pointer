"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { GithubIcon, SparkleIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Poppins } from "next/font/google";
import Image from "next/image";
import { ProjectList } from "./project-list";
import { useCreateProject } from "../hooks/use-projects";
import {
  adjectives,
  animals,
  colors,
  uniqueNamesGenerator,
} from "unique-names-generator";
import { ProjectsCommandDialog } from "./projects-command-dialog";
import { ImportGithubDialog } from "./import-github-dialog";

const font = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const ProjectView = () => {
  const createProject = useCreateProject();

  const [commandDialogOpen, setCommandDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === "k") {
          e.preventDefault();
          setCommandDialogOpen((open) => !open);
        }
        if (e.key === "i") {
          e.preventDefault();
          setImportDialogOpen(true);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <ProjectsCommandDialog
        open={commandDialogOpen}
        onOpenChange={setCommandDialogOpen}
      />
      <ImportGithubDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />
      <div className="min-h-screen bg-sidebar flex flex-col justify-center items-center p-6 md:p-16">
        <div className="w-full max-w-sm mx-auto flex flex-col gap-4 items-center">
          <div className="flex items-center justify-center gap-4 w-full">
            <div className="flex items-center gap-2 w-full group/logo">
              <Image src="/logo.svg" alt="Pointer" width={35} height={35} />
              <h1
                className={cn(
                  "text-4xl md:font-5xl font-semibold ",
                  font.className,
                )}
              >
                Pointer
              </h1>
            </div>
          </div>
          <div className="flex flex-col gap-4 w-full">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={"outline"}
                onClick={() => {
                  const projectName = uniqueNamesGenerator({
                    dictionaries: [adjectives, animals, colors],
                    separator: "-",
                    length: 3,
                  });
                  createProject({ name: projectName });
                }}
                className="h-full items-start justify-start p-4 bg-background flex flex-col gap-6 rounded-none"
              >
                <div className="flex items-center justify-between w-full">
                  <SparkleIcon className="size-4" />
                  <KbdGroup>
                    <Kbd>Ctrl</Kbd>
                    <span>+</span>
                    <Kbd>J</Kbd>
                  </KbdGroup>
                </div>
                <div>
                  <span className="text-sm">New</span>
                </div>
              </Button>
              <Button
                variant={"outline"}
                onClick={() =>{ 
                  setImportDialogOpen(true)}}
                className="h-full items-start justify-start p-4 bg-background flex flex-col gap-6 rounded-none"
              >
                <div className="flex items-center justify-between w-full">
                  <GithubIcon className="size-4" />
                  <KbdGroup>
                    <Kbd>Ctrl</Kbd>
                    <span>+</span>
                    <Kbd>I</Kbd>
                  </KbdGroup>
                </div>
                <div>
                  <span className="text-sm">Import</span>
                </div>
              </Button>
            </div>
            <ProjectList onViewAll={() => setCommandDialogOpen(true)} />
          </div>
        </div>
      </div>
    </>
  );
};
