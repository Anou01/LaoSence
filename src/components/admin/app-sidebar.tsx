"use client";

import * as React from "react";
import { AudioWaveform, Command, GalleryVerticalEnd, RadioTower, Workflow, Upload, MessageSquare } from "lucide-react";

import { NavMain } from "@/components/admin/nav-main";
import { NavProjects } from "@/components/admin/nav-projects";
import { TeamSwitcher } from "@/components/admin/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

// Updated data with items always visible (no dropdown/collapse)
const data = {
  user: {
    name: "admin",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      icon: RadioTower,
      isActive: true,
      isOpen: true, // Always keep expanded
      items: [
        {
          title: "Statistics",
          url: "/admin",
        },
        {
          title: "Map",
          url: "/admin/map",
        },
        {
          title: "Analytics",
          url: "/admin/analysis",
        },
      ],
    },
    {
      title: "Process Files",
      url: "/admin/process",
      icon: Workflow,
      isOpen: true, // Always keep expanded
      items: [
        {
          title: "Process CSV & KML",
          url: "/admin/process/csv-kml",
        },
        {
          title: "Merge",
          url: "/admin/process/merge",
        },
      ],
    },
    {
      title: "Upload Files",
      url: "/admin/upload",
      icon: Upload,
      isOpen: true, // Always keep expanded
      items: [
        {
          title: "Upload",
          url: "/admin/upload",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Messaging",
      url: "/admin/messaging",
      icon: MessageSquare,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
