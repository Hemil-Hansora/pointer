import { Id } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { CopyIcon, HistoryIcon, LoaderIcon, PlusIcon } from "lucide-react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { useState } from "react";
import {
  useConversation,
  useConversations,
  useCreateConversation,
  useMessages,
} from "../hooks/use-conversations";
import { toast } from "sonner";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import ky from "ky";

export const ConversationSidebar = ({
  projectId,
}: {
  projectId: Id<"projects">;
}) => {
  const [input, setInput] = useState("");
  const [selectedConversationId, setSelectedConversationId] =
    useState<Id<"conversations"> | null>(null);

  const createConversation = useCreateConversation();

  const conversations = useConversations(projectId);

  const activeConversationId =
    selectedConversationId ?? conversations?.[0]?._id ?? null;

  const activeConversation = useConversation(activeConversationId);
  const conversationMessages = useMessages(activeConversationId);

  const isProcessing = conversationMessages?.some(
    (msg) => msg.status === "processing",
  );

  const handleCreateConversation = async () => {
    try {
      const conversationId = await createConversation({
        projectId,
        title: "New Conversation",
      });
      setSelectedConversationId(conversationId);
      return conversationId;
    } catch (error) {
      toast.error("Unable to create conversation. Please try again.");
      return null;
    }
  };

  const handleSubmit = async (message: PromptInputMessage) => {
    if(isProcessing && !message.text){
      //TODO:
      setInput("")
      return;
    }

    let conversationId = activeConversationId;
    
    if (!conversationId) {
      conversationId = await handleCreateConversation();
      if (!conversationId) {
        return;
      }
    }
    try {
      await ky.post("/api/messages",{
        json:{
          conversationId,
          message: message.text,
        }
      })
    } catch (error) {
      toast.error("Message failed to send. Please try again.");
      return
    }finally{
      setInput("")
    }
  }

  return (
    <div className="flex flex-col h-full bg-sidebar ">
      <div className="h-8.75 flex items-center justify-between  border-b">
        <div className="text-sm truncate pl-3">
          {activeConversation?.title ?? "New Conversation"}
        </div>
        <div className="flex items-center px-1 gap-1 ">
          <Button size="icon-xs" variant="highlight">
            <HistoryIcon className="size-3.5" />
          </Button>
          <Button
            size="icon-xs"
            variant="highlight"
            onClick={handleCreateConversation}
          >
            <PlusIcon className="size-3.5" />
          </Button>
        </div>
      </div>
      <Conversation>
        <ConversationContent>
          {conversationMessages?.map((msg, msgIdx) => (
            <Message key={msg._id} from={msg.role}>
              <MessageContent>
                {msg.status === "processing" ? (
                  <div className="flex items-center gap-e text-muted-foreground">
                    <LoaderIcon className="siz-4 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                ) : (
                  <MessageResponse>{msg.content}</MessageResponse>
                )}
              </MessageContent>
              {msg.role === "assistant" &&
                msg.status === "completed" &&
                (msgIdx === (conversationMessages.length ?? 0) - 1) && (
              <MessageActions>
                <MessageAction
                  onClick={() => {
                    navigator.clipboard.writeText(msg.content);
                  }}
                  label="Copy"
                >
                  <CopyIcon className="size-3" />
                </MessageAction>
              </MessageActions>
              )}
            </Message>
          ))}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="p-3">
        <PromptInput onSubmit={handleSubmit} className="mt-2">
          <PromptInputBody>
            <PromptInputTextarea
              placeholder="Ask Pointer anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isProcessing}
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools />
            <PromptInputSubmit
              status={isProcessing ? "streaming" : undefined}
              disabled={isProcessing ? false : !input}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
};
