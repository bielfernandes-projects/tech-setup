import type { LucideIcon } from "lucide-react";
import {
  Wrench,
  Gamepad2,
  Monitor,
  Bot,
  Terminal,
  Settings,
  Home,
} from "lucide-react";

export const categoryMeta: Record<
  string,
  { description: string; Icon: LucideIcon }
> = {
  troubleshooting: {
    description:
      "Step-by-step guides to diagnose and fix common developer issues.",
    Icon: Wrench,
  },
  "discord-bots": {
    description:
      "Tutorials for building, deploying, and managing Discord bots.",
    Icon: Gamepad2,
  },
  "windows-setup": {
    description:
      "Configuring Windows dev environments — WSL, terminals, drivers.",
    Icon: Monitor,
  },
  windows: {
    description:
      "Tips, tricks, and deep-dives into Windows for developers.",
    Icon: Monitor,
  },
  "ai-development": {
    description:
      "Building with AI — RAG pipelines, prompt engineering, vibe coding.",
    Icon: Bot,
  },
  linux: {
    description:
      "Linux server administration, Docker setup, and CLI workflows.",
    Icon: Terminal,
  },
  devops: {
    description:
      "CI/CD pipelines, container orchestration, and deployment automation.",
    Icon: Settings,
  },
  "home-automation": {
    description:
      "Smart home dashboards, Home Assistant, and IoT integrations.",
    Icon: Home,
  },
};
