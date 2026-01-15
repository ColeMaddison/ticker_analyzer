"use client";

import * as React from "react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const Card = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("rounded-xl border border-zinc-800 bg-[#0A0A0A] text-zinc-100 shadow-sm", className)} {...props} />
)

export const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
)

export const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
)

export const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-6 pt-0", className)} {...props} />
)

export const Progress = ({ value, className }: { value: number, className?: string }) => (
  <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-zinc-800", className)}>
    <div
      className="h-full w-full flex-1 bg-green-500 transition-all duration-500 ease-in-out"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </div>
)

export const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("animate-pulse rounded-md bg-zinc-800/50", className)} {...props} />
)

// --- Tabs Implementation using Context ---

type TabsContextType = {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextType | null>(null);

export const Tabs = ({ children, defaultValue, className }: { children: React.ReactNode, defaultValue: string, className?: string }) => {
  const [activeTab, setActiveTab] = React.useState(defaultValue)
  
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export const TabsList = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 p-1 text-zinc-400", className)}>
    {children}
  </div>
)

export const TabsTrigger = ({ children, value, className }: { children: React.ReactNode, value: string, className?: string }) => {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error("TabsTrigger must be used within Tabs")
  
  const { activeTab, setActiveTab } = context
  
  return (
    <button
      onClick={() => setActiveTab(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
        activeTab === value ? "bg-zinc-800 text-zinc-100 shadow-sm" : "hover:text-zinc-200",
        className
      )}
    >
      {children}
    </button>
  )
}

export const TabsContent = ({ children, value, className }: { children: React.ReactNode, value: string, className?: string }) => {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error("TabsContent must be used within Tabs")
  
  const { activeTab } = context
  
  if (activeTab !== value) return null
  
  return <div className={cn("mt-2", className)}>{children}</div>
}

import { createPortal } from "react-dom"

// --- Tooltip Implementation ---

export const Tooltip = ({ children, content }: { children: React.ReactNode, content: string }) => {
  const [visible, setVisible] = React.useState(false)
  const [coords, setCoords] = React.useState({ top: 0, left: 0 })
  const triggerRef = React.useRef<HTMLDivElement>(null)
  const [mounted, setVisibleMounted] = React.useState(false)

  React.useEffect(() => {
    setVisibleMounted(true)
  }, [])

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setCoords({
        top: rect.top + window.scrollY,
        left: rect.left + rect.width / 2 + window.scrollX
      })
    }
  }

  const handleMouseEnter = () => {
    updateCoords()
    setVisible(true)
  }

  React.useEffect(() => {
    if (visible) {
      window.addEventListener('scroll', updateCoords)
      window.addEventListener('resize', updateCoords)
    }
    return () => {
      window.removeEventListener('scroll', updateCoords)
      window.removeEventListener('resize', updateCoords)
    }
  }, [visible])

  return (
    <div 
      ref={triggerRef}
      className="inline-flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && content && mounted && createPortal(
        <div 
          className="fixed z-[9999] pointer-events-none"
          style={{ 
            top: `${coords.top - 8}px`, 
            left: `${coords.left}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="w-48 p-2 bg-zinc-900 border border-zinc-700 rounded shadow-2xl text-[10px] font-medium leading-tight text-zinc-300 text-center animate-in fade-in zoom-in-95 duration-200">
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-zinc-700" />
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

// --- Toast Implementation ---

export type ToastType = "info" | "error" | "success" | "warning";

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

type ToastContextType = {
  addToast: (message: string, type: ToastType) => void;
};

const ToastContext = React.createContext<ToastContextType | null>(null);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const addToast = React.useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 left-4 z-[100] flex flex-col gap-2 w-80">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "p-4 rounded-lg border shadow-2xl animate-in slide-in-from-left-5 fade-in duration-300 flex items-center gap-3",
              t.type === "error" ? "bg-red-950 border-red-500/50 text-red-200" :
              t.type === "success" ? "bg-green-950 border-green-500/50 text-green-200" :
              t.type === "warning" ? "bg-orange-950 border-orange-500/50 text-orange-200" :
              "bg-zinc-900 border-zinc-700 text-zinc-200"
            )}
          >
            <div className={cn(
              "w-2 h-2 rounded-full shrink-0 animate-pulse",
              t.type === "error" ? "bg-red-500" :
              t.type === "success" ? "bg-green-500" :
              t.type === "warning" ? "bg-orange-500" :
              "bg-blue-500"
            )} />
            <div className="text-xs font-bold leading-tight">{t.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};

// --- New Components ---

export const Separator = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("h-[1px] w-full bg-zinc-800", className)} {...props} />
)

export const Badge = ({ className, variant = "default", ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "outline" }) => {
   const variants = {
     default: "border-transparent bg-zinc-900 text-zinc-100 hover:bg-zinc-900/80",
     outline: "text-zinc-100"
   }
   return (
    <div className={cn("inline-flex items-center rounded-full border border-zinc-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2", variants[variant], className)} {...props} />
   )
}

export const ScrollArea = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("overflow-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent", className)} {...props}>
    {children}
  </div>
)
