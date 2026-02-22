import { useClerk } from "@clerk/nextjs";
import { useForm } from "@tanstack/react-form";
import ky, { HTTPError } from "ky";
import { useRouter } from "next/navigation";
import z from "zod";
import { Id } from "../../../../convex/_generated/dataModel";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  url: z.url("Please enter a valid GitHub repository URL."),
});

interface ImportGithubDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ImportGithubDialog = ({
  onOpenChange,
  open,
}: ImportGithubDialogProps) => {
  const router = useRouter();
  const { openUserProfile } = useClerk();

  const form = useForm({
    defaultValues: {
      url: "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const { projectId } = await ky
          .post("/api/github/import", {
            json: { url: value.url },
          })
          .json<{
            projectId: Id<"projects">;
            success: boolean;
            eventId: string;
          }>();
        toast.success("Importing repository...");
        onOpenChange(false);
        form.reset();
        router.push(`/projects/${projectId}`);
      } catch (error) {
        if (error instanceof HTTPError) {
          const body = await error.response.json<{ error: string }>();
          if (body?.error?.includes("GitHub is not connected")) {
            toast.error("GitHub account not connected.", {
              action: {
                label: "Connect",
                onClick: () => openUserProfile(),
              },
            });
            onOpenChange(false);
            return;
          }
          toast.error(
            "Unable to import repository. Please check the URL and try again.",
          );
        }
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import GitHub Repository</DialogTitle>
          <DialogDescription>
            Enter a Github repository URL to import. A new project will be
            created with the repository contents.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <form.Field name="url">
            {(field) => {
              const isInValid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInValid}>
                  <FieldLabel htmlFor={field.name}>Repository URL</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    value={field.state.value}
                    aria-invalid={isInValid}
                    placeholder="https://github.com/owner/repo"
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {isInValid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant={"outline"}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitted]}
            >
              {([canSubmit, isSubmitted]) => (
                <Button type="submit" disabled={!canSubmit || isSubmitted}>
                  {isSubmitted ? "Importing..." : "Import"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
