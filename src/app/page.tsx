"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";

/**
 * Render the home view with a button to create a new project and a list of existing projects.
 *
 * @returns The component element containing a "Create Project" button and a list of fetched projects.
 */
export default function Home() {

  const projects = useQuery(api.projects.get,{})
  const createProject = useMutation(api.projects.create)

  return (
    <div>
      <Button onClick={()=>createProject({
        name : "new"
      })}>
        Create Project
      </Button>
      {projects?.map((project) => (
        <div key={project._id}>{project.name}</div>
      ))}
    </div>
  );
}