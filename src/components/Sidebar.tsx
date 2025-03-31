
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import ChatInterface from './ChatInterface';

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat'>('chat');

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div
      className={cn(
        "h-full bg-white border-l border-gray-200 transition-all duration-300 flex flex-col shadow-md",
        isCollapsed ? "w-14" : "w-80"
      )}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        {!isCollapsed && <h3 className="font-medium text-gray-800">Assistant</h3>}
        <button 
          onClick={toggleSidebar}
          className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Sidebar Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          className={cn(
            "flex items-center justify-center p-3 flex-1",
            activeTab === 'chat' ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:bg-gray-50"
          )}
          onClick={() => setActiveTab('chat')}
        >
          <MessageSquare size={isCollapsed ? 20 : 16} />
          {!isCollapsed && <span className="ml-2">Chat</span>}
        </button>
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' && (
          <div className={cn("h-full", isCollapsed && "hidden")}>
            <ChatInterface />
          </div>
        )}
        {isCollapsed && (
          <div className="flex flex-col items-center py-4">
            <button
              onClick={() => setActiveTab('chat')}
              className={cn(
                "p-2 rounded-lg mb-2 hover:bg-gray-100",
                activeTab === 'chat' && "bg-primary/10 text-primary"
              )}
            >
              <MessageSquare size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
