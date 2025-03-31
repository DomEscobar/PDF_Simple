
import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import ChatInterface from './chat/ChatInterface';

const PDFSidebar: React.FC = () => {
  return (
    <Sidebar>
      <SidebarContent>
        <ChatInterface />
      </SidebarContent>
    </Sidebar>
  );
};

export default PDFSidebar;
