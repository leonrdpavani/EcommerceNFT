import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-success" />,
        info: <InfoIcon className="size-4 text-brand-text" />,
        warning: <TriangleAlertIcon className="size-4 text-amber" />,
        error: <OctagonXIcon className="size-4 text-coral" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--kurio-surface-card)",
          "--normal-text": "var(--kurio-foreground)",
          "--normal-border": "var(--kurio-border-soft)",
          "--border-radius": "6px",
          fontFamily: "var(--font-sans)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
