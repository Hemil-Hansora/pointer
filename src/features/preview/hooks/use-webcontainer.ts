import { WebContainer } from "@webcontainer/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFiles } from "@/features/projects/hooks/use-files";
import { buildFileTree, getFilePath } from "../utils/file-tree";

// Store on globalThis so the reference survives Next.js HMR reloads.
// Without this, HMR resets module-level variables while the browser
// still holds the old WebContainer instance, causing
// "unable to create more instances" on the next boot() call.
const WC_KEY = "__webcontainer_instance__" as const;
const WC_BOOT_KEY = "__webcontainer_boot_promise__" as const;

const getStoredInstance = (): WebContainer | null =>
  (globalThis as Record<string, unknown>)[WC_KEY] as WebContainer | null;

const setStoredInstance = (instance: WebContainer | null) => {
  (globalThis as Record<string, unknown>)[WC_KEY] = instance;
};

const getStoredBootPromise = (): Promise<WebContainer> | null =>
  (globalThis as Record<string, unknown>)[WC_BOOT_KEY] as Promise<WebContainer> | null;

const setStoredBootPromise = (promise: Promise<WebContainer> | null) => {
  (globalThis as Record<string, unknown>)[WC_BOOT_KEY] = promise;
};

const getWebContainer = async (): Promise<WebContainer> => {
  const existing = getStoredInstance();
  if (existing) {
    return existing;
  }

  if (!getStoredBootPromise()) {
    const promise = WebContainer.boot({ coep: "credentialless" });
    setStoredBootPromise(promise);
  }

  try {
    const instance = await getStoredBootPromise()!;
    setStoredInstance(instance);
    return instance;
  } catch (err) {
    // If boot fails, clear the promise so the next attempt can retry
    setStoredBootPromise(null);
    throw err;
  }
};

const teardownWebContainer = () => {
  const instance = getStoredInstance();
  if (instance) {
    instance.teardown();
    setStoredInstance(null);
  }
  setStoredBootPromise(null);
};

interface WebContainerProps {
  projectId: Id<"projects">;
  enable: boolean;
  settings?: {
    installCommand?: string;
    devCommand?: string;
  };
}

export const useWebContainer = ({
  projectId,
  enable,
  settings,
}: WebContainerProps) => {
  const [status, setStatus] = useState<
    "idle" | "booting" | "running" | "installing" | "error"
  >("idle");

  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [restartKey, setRestartKey] = useState(0);
  const [terminalOutput, setTerminalOutput] = useState("");

  const containerRef = useRef<WebContainer | null>(null);
  const hasStartedRef = useRef(false);

  const files = useFiles(projectId);

  useEffect(() => {
    if (!enable || !files || files.length === 0 || hasStartedRef.current) {
      return;
    }
    hasStartedRef.current = true;

    const start = async () => {
      try {
        setStatus("booting");
        setError(null);
        setTerminalOutput("");

        const appendOutput = (data: string) => {
          setTerminalOutput((prev) => prev + data);
        };

        const container = await getWebContainer();
        containerRef.current = container;

        const fileTree = buildFileTree(files);
        await container.mount(fileTree);

        container.on("server-ready", (_port, url) => {
          setPrevUrl(url);
          setStatus("running");
        });

        setStatus("installing");

        const installCommand = settings?.installCommand || "npm install";
        const [installBin, ...installArgs] = installCommand.split(" ");
        appendOutput(`$ ${installCommand}\n`);
        const installProcess = await container.spawn(installBin, installArgs);
        installProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              appendOutput(data);
            },
          }),
        );
        const installExitCode = await installProcess.exit;
        if (installExitCode !== 0) {
          throw new Error(
            `${installCommand} failed with exit code ${installExitCode}`,
          );
        }

        const devCommand = settings?.devCommand || "npm run dev";
        const [devBin, ...devArgs] = devCommand.split(" ");
        appendOutput(`\n$ ${devCommand}\n`);
        const devProcess = await container.spawn(devBin, devArgs);
        devProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              appendOutput(data);
            },
          }),
        );
      } catch (error) {
        setError(error instanceof Error ? error.message : "unknown error");
        setStatus("error");
      }
    };

    start();
  }, [
    enable,
    files,
    restartKey,
    settings?.devCommand,
    settings?.installCommand,
  ]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !files || status != "running") return;

    const fileMap = new Map(files.map((f) => [f._id, f]));
    for (const file of files) {
      if (file.type !== "file" || file.storageId || !file.content) continue;

      const filePath = getFilePath(file, fileMap);
      container.fs.writeFile(filePath, file.content);
    }
  }, [files, status]);

  useEffect(() => {
    if (!enable) {
      hasStartedRef.current = false;
      setStatus("idle");
      setError(null);
      setPrevUrl(null);
    }
  }, [enable]);

  const restart = useCallback(() => {
    teardownWebContainer();
    containerRef.current = null;
    hasStartedRef.current = false;
    setStatus("idle");
    setError(null);
    setPrevUrl(null);
    setRestartKey((k) => k + 1);
  }, []);

  return { 
    status,
    prevUrl,
    error,
    restart,
    terminalOutput
  }
};
