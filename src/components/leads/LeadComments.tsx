import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, MessageSquare, Send } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type LeadComment = Database["public"]["Tables"]["lead_comments"]["Row"];

interface CommentWithAuthor extends LeadComment {
  author?: { full_name: string | null; email: string | null } | null;
}

interface LeadCommentsProps {
  leadId: string;
}

export function LeadComments({ leadId }: LeadCommentsProps) {
  const [newBody, setNewBody] = useState("");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["lead-comments", leadId],
    queryFn: async (): Promise<CommentWithAuthor[]> => {
      const { data: commentsData, error: commentsError } = await supabase
        .from("lead_comments")
        .select("id, lead_id, user_id, body, created_at")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: true });

      if (commentsError) throw commentsError;
      if (!commentsData?.length) return [];

      const userIds = [...new Set(commentsData.map((c) => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", userIds);

      const profileMap = new Map(
        (profiles ?? []).map((p) => [
          p.user_id,
          { full_name: p.full_name ?? null, email: p.email ?? null },
        ])
      );

      return commentsData.map((c) => ({
        ...c,
        author: profileMap.get(c.user_id) ?? null,
      }));
    },
    enabled: !!leadId,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (body: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase.from("lead_comments").insert({
        lead_id: leadId,
        user_id: user.id,
        body: body.trim(),
      });
      if (error) throw error;
    },
    onSuccess: (_, body) => {
      queryClient.invalidateQueries({ queryKey: ["lead-comments", leadId] });
      setNewBody("");
      toast.success("Comment added");
    },
    onError: (e) => {
      toast.error("Failed to add comment: " + (e as Error).message);
    },
  });

  const submitComment = () => {
    const trimmed = newBody.trim();
    if (!trimmed) return;
    addCommentMutation.mutate(trimmed);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-body font-medium">
        <MessageSquare className="h-4 w-4" />
        Activity
      </div>
      <ScrollArea className="h-[180px] rounded-md border p-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-meta text-muted-foreground text-center py-4">No comments yet. Add one below.</p>
        ) : (
          <ul className="space-y-3">
            {comments.map((c) => (
              <li key={c.id} className="text-body">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-medium text-foreground">
                    {c.author?.full_name || c.author?.email || "Someone"}
                  </span>
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-meta text-muted-foreground cursor-default">
                          {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        {format(new Date(c.created_at), "MMM d, yyyy 'at' HH:mm")}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-meta mt-0.5 whitespace-pre-wrap">{c.body}</p>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
      <div className="flex gap-2" role="group" aria-label="Add comment">
        <Textarea
          placeholder="Add a comment for the team..."
          value={newBody}
          onChange={(e) => setNewBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submitComment();
            }
          }}
          className="min-h-[60px] resize-none"
          disabled={addCommentMutation.isPending}
        />
        <Button
          type="button"
          size="icon"
          className="shrink-0 h-9 w-9"
          disabled={!newBody.trim() || addCommentMutation.isPending}
          onClick={submitComment}
        >
          {addCommentMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
