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

// --- Tooltip Implementation ---

export const Tooltip = ({ children, content }: { children: React.ReactNode, content: string }) => {
  const [visible, setVisible] = React.useState(false)
  
  return (
    <div 
      className="relative flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && content && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-zinc-900 border border-zinc-700 rounded shadow-xl z-[100] text-[10px] font-medium leading-tight text-zinc-300 text-center animate-in fade-in zoom-in-95 duration-200">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-zinc-700" />
        </div>
      )}
    </div>
  )
}