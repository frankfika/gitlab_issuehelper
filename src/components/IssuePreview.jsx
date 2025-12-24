import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Copy, Check, FileText } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useCopyToClipboard } from '@/hooks/useClipboard'
import { cn } from '@/lib/utils'

export function IssuePreview({ markdown, title }) {
  const [copied, setCopied] = useState(false)
  const copy = useCopyToClipboard()

  const handleCopy = async () => {
    const fullContent = title ? `# ${title}\n\n${markdown}` : markdown
    const success = await copy(fullContent)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const isEmpty = !markdown || markdown.trim() === ''

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">预览</span>
        </div>

        <Button
          variant={copied ? 'default' : 'outline'}
          size="sm"
          onClick={handleCopy}
          disabled={isEmpty}
          className={cn(
            'transition-all duration-300',
            copied && 'bg-green-600 hover:bg-green-600'
          )}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-1" />
              已复制
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-1" />
              复制
            </>
          )}
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto mt-4">
        {isEmpty ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">填写表单后将在这里显示预览</p>
            </div>
          </div>
        ) : (
          <div className="markdown-body prose prose-invert max-w-none">
            {title && <h1>{title}</h1>}
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {markdown}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}
