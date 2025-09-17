import { Toaster as Sonner } from "sonner"

interface ToasterProps {
  theme?: "light" | "dark" | "system"
  className?: string
  style?: React.CSSProperties
  [key: string]: any
}

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="system"
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
