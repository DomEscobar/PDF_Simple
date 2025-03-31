
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
};

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I can help you annotate and edit your PDF. Ask me anything about how to use the tools.',
      sender: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sample responses for demo purposes
  const sampleResponses = [
    "You can use the draw tool to highlight or underline text.",
    "To add a signature, click on the signature tool in the toolbar.",
    "Select the text tool to add text annotations to your document.",
    "The eraser tool allows you to remove annotations you've made.",
    "You can export your annotated document using the export button in the toolbar."
  ];

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInputValue('');

    // Simulate assistant response
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * sampleResponses.length);
      const newAssistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: sampleResponses[randomIndex],
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, newAssistantMessage]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex items-start gap-2.5 max-w-[90%]",
              message.sender === 'user' ? "ml-auto" : "mr-auto"
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-white",
                message.sender === 'user' ? "bg-primary" : "bg-gray-500"
              )}
            >
              {message.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div
              className={cn(
                "p-3 rounded-lg",
                message.sender === 'user'
                  ? "bg-primary text-white rounded-tr-none"
                  : "bg-gray-100 text-gray-800 rounded-tl-none"
              )}
            >
              {message.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <textarea
            className="flex-1 p-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Type a message..."
            rows={1}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            className={cn(
              "p-2 rounded-full",
              inputValue.trim()
                ? "bg-primary text-white hover:bg-primary/90"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            )}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
