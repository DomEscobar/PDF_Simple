
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { ChatMessage as ChatMessageType } from '@/types/chat';
import { formatDistanceToNow } from 'date-fns';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  
  return (
    <div className={cn(
      "flex items-start gap-2 mb-4",
      isUser ? "flex-row-reverse" : "flex-row"
    )}>
      <Avatar className="mt-0.5 h-8 w-8">
        {isUser ? (
          <>
            <AvatarFallback className="bg-primary text-primary-foreground">U</AvatarFallback>
            <AvatarImage src="/placeholder.svg" />
          </>
        ) : (
          <>
            <AvatarFallback className="bg-editor-active text-primary-foreground">A</AvatarFallback>
            <AvatarImage src="/placeholder.svg" />
          </>
        )}
      </Avatar>
      <div className={cn(
        "rounded-lg px-3 py-2 max-w-[75%] text-sm",
        isUser ? 
          "bg-primary text-primary-foreground" : 
          "bg-muted"
      )}>
        <p>{message.content}</p>
        <div className="text-xs opacity-70 mt-1">
          {formatDistanceToNow(message.timestamp, { addSuffix: true })}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
