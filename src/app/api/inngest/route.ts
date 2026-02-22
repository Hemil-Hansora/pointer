import { inngest } from "@/inngest/client";
import { serve } from "inngest/next";
import { processMessage } from "@/features/conversations/inngest/process-message";
import { exportToGithub } from "@/features/projects/inngest/export-to-github";
import { importGithubRepo } from "@/features/projects/inngest/import-github-repo";


// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    /* your functions will be passed here later! */
    processMessage,
    importGithubRepo,
    exportToGithub
  ],
});