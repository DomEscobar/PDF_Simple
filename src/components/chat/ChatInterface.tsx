
import React, { useState } from 'react';
import { SendHorizontal } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatMessage from './ChatMessage';
import { ChatMessage as ChatMessageType } from '@/types/chat';

const SAMPLE_MESSAGES: ChatMessageType[] = [
  {
    id: '1',
    content: 'Hello! How can I help you with your PDF document today?',
    sender: 'assistant',
    timestamp: new Date(Date.now() - 60000 * 5)
  }
];

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>(SAMPLE_MESSAGES);
  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessageType = {
      id: uuidv4(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Simulate assistant response after a short delay
    setTimeout(() => {
      const assistantMessage: ChatMessageType = {
        id: uuidv4(),
        content: getAssistantResponse(inputValue),
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    }, 1000);
  };

  const getAssistantResponse = (userMessage: string): string => {
    const lowerCaseMessage = userMessage.toLowerCase();
    
    if (lowerCaseMessage.includes('hello') || lowerCaseMessage.includes('hi')) {
      return 'Hello! How can I assist you with your document today?';
    } else if (lowerCaseMessage.includes('draw') || lowerCaseMessage.includes('drawing')) {
      return 'To draw on your PDF, select the draw tool from the toolbar and click and drag on the document.';
    } else if (lowerCaseMessage.includes('text') || lowerCaseMessage.includes('add text')) {
      return 'To add text, select the text tool from the toolbar, then click where you want to add text on the document.';
    } else if (lowerCaseMessage.includes('signature')) {
      return 'You can add a signature by selecting the signature tool and clicking where you want to place it.';
    } else if (lowerCaseMessage.includes('save') || lowerCaseMessage.includes('export')) {
      return 'To save or export your annotated PDF, click the export button in the toolbar.';
    } else {
      return 'I\'m here to help with your document editing. You can ask me about adding text, drawing, signatures, or exporting your document.';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b">
        <h3 className="font-semibold">Chat Assistant</h3>
        <p className="text-xs text-muted-foreground">Ask for help with your document</p>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col">
          {messages.map(message => (
            <ChatMessage key={message.id} message={message} />
          ))}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button 
            size="icon" 
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
          >
            <SendHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
