import React, { useRef } from "react";
import { Id } from "../../../../convex/_generated/dataModel";
import { TopNavigation } from "./top-navigation";
import { useEditor } from "../hooks/use-editor";
import { FileBreadcrumbs } from "./file-breadcrumbs";
import { useFile, useUpdateFile } from "@/features/projects/hooks/use-files";
import Image from "next/image";
import { CodeEditor } from "./code-editor";

export const EditorView = ({ projectId }: { projectId: Id<"projects"> }) => {
  const { activeTabId } = useEditor(projectId);
  const activeFile = useFile(activeTabId);
  const updateFile = useUpdateFile();
  const timeOutRef = useRef<NodeJS.Timeout | null>(null);

  const isActiveFileBinary = activeFile && activeFile.storageId
  const isActiveFileText = activeFile && !activeFile.storageId

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center ">
        <TopNavigation projectId={projectId} />
      </div>
      {activeTabId && <FileBreadcrumbs projectId={projectId} />}
      <div className="flex-1 min-h-0 bg-background">
        {!activeFile && (
          <div className="size-full flex items-center justify-center">
            <Image
              src={"/logo.svg"}
              width={100}
              height={100}
              alt="Pointer"
              className="opacity-25"
            />
          </div>
        )}
        {isActiveFileText && (
          <CodeEditor
            key={activeFile._id}
            initialValue={activeFile.content}
            fileName={activeFile.name}
            onChange={(content) => {
              if (timeOutRef.current) {
                clearTimeout(timeOutRef.current);
              }
              timeOutRef.current = setTimeout(() => {
                updateFile({
                  id: activeFile._id,
                  content,
                });
              }, 1500);
            }}
          />
        )}
      </div>
    </div>
  );
};
