"use client";

import { useState, Suspense, lazy, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Mail,
  Gift,
  Timer,
  Ticket,
  Smartphone,
  Tablet,
  Monitor,
  ArrowRight,
  Sparkles,
} from "lucide-react";

// Featured recipes to showcase (subset of the 75+) - each with unique color theme
const featuredRecipes = [
  {
    id: "NEWSLETTER",
    name: "Newsletter",
    icon: Mail,
    color: "from-blue-500 to-cyan-500",
    description: "Email signup forms",
  },
  {
    id: "SPIN_TO_WIN",
    name: "Spin to Win",
    icon: Gift,
    color: "from-purple-500 to-pink-500",
    description: "Gamified wheel",
  },
  {
    id: "SCRATCH_CARD",
    name: "Scratch Card",
    icon: Ticket,
    color: "from-yellow-500 to-orange-500",
    description: "Interactive scratch",
  },
  {
    id: "FLASH_SALE",
    name: "Flash Sale",
    icon: Timer,
    color: "from-orange-500 to-red-500",
    description: "Urgency timers",
  },
] as const;

type TemplateType = (typeof featuredRecipes)[number]["id"];
type DeviceType = "mobile" | "tablet" | "desktop";

// Device configurations
const devices: {
  id: DeviceType;
  name: string;
  icon: typeof Smartphone;
  minViewportWidth: number;
  frameWidth: number;
}[] = [
  { id: "mobile", name: "Mobile", icon: Smartphone, minViewportWidth: 0, frameWidth: 390 },
  { id: "tablet", name: "Tablet", icon: Tablet, minViewportWidth: 768, frameWidth: 768 },
  { id: "desktop", name: "Desktop", icon: Monitor, minViewportWidth: 1024, frameWidth: 1024 },
];

// Lazy load the preview component
const LivePopupPreview = lazy(() => import("./live-popup-preview"));

const PreviewSkeleton = () => (
  <div className="flex items-center justify-center h-[500px]">
    <div className="animate-pulse flex flex-col items-center gap-4">
      <div className="w-16 h-16 bg-white/20 rounded-full" />
      <div className="w-48 h-6 bg-white/20 rounded" />
      <div className="w-32 h-4 bg-white/10 rounded" />
    </div>
  </div>
);

function useViewportWidth() {
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return width;
}

export function TemplatesSectionLive() {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>("NEWSLETTER");
  const [selectedDevice, setSelectedDevice] = useState<DeviceType>("mobile");
  const selected = featuredRecipes.find((t) => t.id === selectedTemplate) || featuredRecipes[0];
  const viewportWidth = useViewportWidth();

  const availableDevices = devices.filter((d) => viewportWidth >= d.minViewportWidth + 100);

  useEffect(() => {
    if (!availableDevices.find((d) => d.id === selectedDevice)) {
      setSelectedDevice("mobile");
    }
  }, [availableDevices, selectedDevice]);

  return (
    <section id="templates" className="bg-secondary/30 px-4 py-20 md:py-32">
      <div className="container mx-auto">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4 gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Interactive Preview
          </Badge>
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">See It in Action</h2>
          <p className="text-lg text-muted-foreground">
            Try our popups before you install. Click, spin, and interact — just like your customers
            will.
          </p>
        </div>

        <div className="mx-auto max-w-5xl">
          <Card className="mb-8 overflow-hidden border-border/50">
            {availableDevices.length > 1 && (
              <div className="flex items-center justify-center gap-2 border-b border-border/50 bg-slate-800/50 px-4 py-3">
                {availableDevices.map((device) => {
                  const IconComponent = device.icon;
                  return (
                    <button
                      key={device.id}
                      onClick={() => setSelectedDevice(device.id)}
                      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                        selectedDevice === device.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                      }`}
                      title={`Preview on ${device.name}`}
                    >
                      <IconComponent className="h-4 w-4" />
                      <span className="hidden sm:inline">{device.name}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex justify-center p-4 sm:p-6 w-full">
              <Suspense fallback={<PreviewSkeleton />}>
                <LivePopupPreview templateType={selectedTemplate} device={selectedDevice} />
              </Suspense>
            </div>

            <div className="flex items-center justify-between border-t border-border/50 bg-muted/30 px-4 py-3">
              <Badge variant="secondary" className="gap-2">
                <selected.icon className="h-4 w-4" />
                {selected.name}
              </Badge>
              <span className="text-sm text-muted-foreground">✨ Try it — it's interactive!</span>
            </div>
          </Card>

          {/* Template Selector */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {featuredRecipes.map((template) => {
              const IconComponent = template.icon;
              return (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    selectedTemplate === template.id
                      ? `bg-gradient-to-r ${template.color} text-white`
                      : "bg-card text-foreground hover:bg-muted"
                  }`}
                  title={template.description}
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{template.name}</span>
                </button>
              );
            })}
          </div>

          {/* CTA to see all designs */}
          <div className="text-center">
            <Button size="lg" className="gap-2" asChild>
              <Link href="/designs">
                See All 75+ Designs
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
