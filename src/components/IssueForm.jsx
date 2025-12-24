import { useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { templates } from '@/lib/templates'

export function IssueForm({ templateType, formData, onFormDataChange }) {
  const template = templates[templateType]

  // Reset form when template changes
  useEffect(() => {
    const initialData = {}
    template?.fields.forEach(field => {
      initialData[field.id] = ''
    })
    onFormDataChange(initialData)
  }, [templateType])

  if (!template) return null

  const handleFieldChange = (fieldId, value) => {
    onFormDataChange({
      ...formData,
      [fieldId]: value
    })
  }

  return (
    <div className="space-y-4">
      {template.fields.map((field, index) => (
        <div key={field.id} className="space-y-2 animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
          <Label htmlFor={field.id} className="text-sm font-medium">
            {field.label}
          </Label>
          <Textarea
            id={field.id}
            value={formData[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className="min-h-[100px] resize-y"
          />
        </div>
      ))}
    </div>
  )
}
