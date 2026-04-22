import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full font-medium transition-colors",
  {
    variants: {
      variant: {
        default:   "bg-primary/15 text-primary border border-primary/25 px-2.5 py-0.5 text-xs",
        success:   "bg-green-500/15 text-green-400 border border-green-500/25 px-2.5 py-0.5 text-xs",
        warning:   "bg-yellow-500/15 text-yellow-400 border border-yellow-500/25 px-2.5 py-0.5 text-xs",
        danger:    "bg-red-500/15 text-red-400 border border-red-500/25 px-2.5 py-0.5 text-xs",
        info:      "bg-blue-500/15 text-blue-400 border border-blue-500/25 px-2.5 py-0.5 text-xs",
        muted:     "bg-white/8 text-muted-foreground border border-white/10 px-2.5 py-0.5 text-xs",
        outline:   "border border-white/15 text-muted-foreground px-2.5 py-0.5 text-xs",
      },
      size: {
        sm: "px-2 py-0 text-[10px]",
        md: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  }
);

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  dot?: boolean;
  dotColor?: string;
}

export function Badge({ className, variant, size, dot, dotColor, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full shrink-0", dotColor || "bg-current")}
          aria-hidden
        />
      )}
      {children}
    </span>
  );
}
