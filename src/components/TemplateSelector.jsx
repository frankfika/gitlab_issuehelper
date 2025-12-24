import { Bug, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import { templates } from '@/lib/templates'

const iconMap = {
  Bug: Bug,
  Lightbulb: Lightbulb,
}

export function TemplateSelector({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Object.entries(templates).map(([key, template]) => {
        const Icon = iconMap[template.icon]
        const isSelected = value === key

        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={cn(
              'relative p-4 rounded-xl border-2 text-left transition-all duration-300',
              isSelected
                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                : 'border-border hover:border-primary/50 hover:bg-muted/50'
            )}
          >
            {/* Selection Indicator */}
            {isSelected && (
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary animate-pulse" />
            )}

            <div className="flex items-start gap-3">
              <div className={cn(
                'p-2 rounded-lg transition-colors duration-300',
                isSelected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              )}>
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className={cn(
                  'font-medium text-sm',
                  isSelected && 'text-primary'
                )}>
                  {template.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {template.description}
                </p>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
