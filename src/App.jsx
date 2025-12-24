import { useState, useEffect } from 'react'
import { Sparkles, Copy, Check, Loader2, ImagePlus, X, Clipboard, FileText, RefreshCw, Settings, Send, ExternalLink, Zap } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { generateIssueContent } from '@/lib/ai'
import { useClipboardPaste, useCopyToClipboard } from '@/hooks/useClipboard'
import { GitLabSettings } from '@/components/GitLabSettings'
import { ProjectSelector } from '@/components/ProjectSelector'
import { getGitLabProjects, createGitLabIssue, extractTitleFromContent, extractLabelsFromContent } from '@/lib/gitlab'

function GitLabIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z"/>
    </svg>
  )
}

function App() {
  const [description, setDescription] = useState('')
  const [images, setImages] = useState([])
  const [generatedContent, setGeneratedContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState(null)
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)

  const copy = useCopyToClipboard()

  // 加载项目配置
  const loadProjects = () => {
    const allProjects = getGitLabProjects()
    setProjects(allProjects)
    if (!selectedProject || !allProjects.find(p => p.id === selectedProject.id)) {
      setSelectedProject(allProjects[0] || null)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  // 处理图片粘贴
  const addImage = (dataUrl) => {
    setImages(prev => [...prev, dataUrl])
  }

  useClipboardPaste(addImage)

  // 删除图片
  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  // 处理拖拽
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => addImage(event.target.result)
      reader.readAsDataURL(file)
    })
  }

  // AI 生成
  const handleGenerate = async () => {
    if (!description.trim() && images.length === 0) {
      setError('请输入描述或上传截图')
      return
    }

    setIsGenerating(true)
    setError(null)
    setGeneratedContent('')

    try {
      await generateIssueContent({
        userDescription: description,
        images,
        onStream: (content) => {
          setGeneratedContent(content)
        }
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  // 生成完整的复制内容（包含截图）
  const getFullContent = () => {
    let content = generatedContent

    if (images.length > 0) {
      content += '\n\n---\n\n### 截图\n'
      images.forEach((img, index) => {
        content += `![截图 ${index + 1}](${img})\n\n`
      })
    }

    return content
  }

  // 复制内容
  const handleCopy = async () => {
    if (!generatedContent) return
    const fullContent = getFullContent()
    const success = await copy(fullContent)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // 提交到 GitLab
  const handleSubmitToGitLab = async () => {
    if (!generatedContent) return

    if (!selectedProject) {
      setShowSettings(true)
      return
    }

    setIsSubmitting(true)
    setSubmitResult(null)

    try {
      const title = extractTitleFromContent(generatedContent)
      const labels = extractLabelsFromContent(generatedContent)
      const description = getFullContent()

      const issue = await createGitLabIssue({ title, description, labels, project: selectedProject })
      setSubmitResult({
        success: true,
        message: `Issue #${issue.iid} 已提交到 ${selectedProject.name}`,
        url: issue.web_url
      })
    } catch (err) {
      setSubmitResult({
        success: false,
        message: err.message
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <GitLabIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">GitLab Issue Generator</h1>
              <p className="text-xs text-slate-500">AI-powered issue creation</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(true)}
            className={cn(
              'rounded-full px-4',
              projects.length > 0 && 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
            )}
          >
            <Settings className="w-4 h-4 mr-1.5" />
            {projects.length > 0 ? `${projects.length} Projects` : 'Configure'}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-10 max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Panel - Input */}
          <div className="space-y-6">
            {/* Hero Text */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                Describe your issue
              </h2>
              <p className="text-slate-500">
                Our AI will generate a professional, well-structured issue for you.
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the bug you encountered or the feature you need...

Example:
• Login button not responding on mobile
• Need batch export functionality
• Dashboard charts loading slowly"
                className="min-h-[180px] resize-none text-base bg-white border-slate-200 focus:border-violet-400 focus:ring-violet-400/20 rounded-xl shadow-sm"
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Screenshots (optional)</label>
              <div
                className={cn(
                  'relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer',
                  isDragging
                    ? 'border-violet-400 bg-violet-50 scale-[1.01]'
                    : 'border-slate-200 hover:border-violet-300 hover:bg-slate-50',
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
                    isDragging ? 'bg-violet-100' : 'bg-slate-100'
                  )}>
                    <ImagePlus className={cn(
                      'w-6 h-6 transition-colors',
                      isDragging ? 'text-violet-600' : 'text-slate-400'
                    )} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-700">
                      {isDragging ? 'Drop to upload' : 'Add screenshots'}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      Paste with Ctrl+V or drag & drop
                    </p>
                  </div>
                </div>
              </div>

              {/* Image Preview */}
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {images.map((img, index) => (
                    <div key={index} className="relative group aspect-video rounded-lg overflow-hidden bg-slate-100 shadow-sm">
                      <img src={img} alt={`Screenshot ${index + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          onClick={() => removeImage(index)}
                          className="p-2 bg-white rounded-full hover:bg-slate-100 transition-colors"
                        >
                          <X className="w-4 h-4 text-slate-700" />
                        </button>
                      </div>
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 rounded-full text-xs text-white font-medium">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full h-12 text-base rounded-xl btn-premium"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Generate Issue
                </>
              )}
            </Button>
          </div>

          {/* Right Panel - Preview */}
          <div className="lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)]">
            <Card className="h-full border-slate-200 shadow-sm overflow-hidden">
              <CardContent className="p-0 h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">Preview</span>
                  </div>
                  {generatedContent && (
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={handleGenerate} disabled={isGenerating} className="text-slate-600 hover:text-slate-900">
                        <RefreshCw className={cn('w-4 h-4 mr-1.5', isGenerating && 'animate-spin')} />
                        Regenerate
                      </Button>
                      <Button
                        variant={copied ? 'default' : 'outline'}
                        size="sm"
                        onClick={handleCopy}
                        className={cn(
                          'rounded-full',
                          copied && 'bg-green-600 hover:bg-green-600 text-white'
                        )}
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 mr-1.5" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-1.5" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* GitLab Submit Bar */}
                {generatedContent && (
                  <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-indigo-50">
                    <ProjectSelector
                      selectedProject={selectedProject}
                      onSelect={setSelectedProject}
                      onOpenSettings={() => setShowSettings(true)}
                    />
                    <Button
                      size="sm"
                      onClick={handleSubmitToGitLab}
                      disabled={isSubmitting || !selectedProject}
                      className="rounded-full btn-premium px-5"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-1.5" />
                          Submit to GitLab
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                  {!generatedContent && !isGenerating ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center max-w-xs">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                          <Sparkles className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="font-medium text-slate-700 mb-1">Ready to generate</h3>
                        <p className="text-sm text-slate-500">
                          Enter a description or upload screenshots, and AI will create a professional issue for you.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="markdown-body">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {generatedContent}
                      </ReactMarkdown>
                      {isGenerating && (
                        <span className="inline-block w-0.5 h-5 bg-violet-500 animate-pulse ml-0.5" />
                      )}
                      {/* 显示截图预览 */}
                      {!isGenerating && images.length > 0 && (
                        <div className="mt-8 pt-8 border-t border-slate-200">
                          <h3 className="text-base font-semibold text-slate-900 mb-4">Screenshots</h3>
                          <div className="grid grid-cols-2 gap-4">
                            {images.map((img, index) => (
                              <img
                                key={index}
                                src={img}
                                alt={`Screenshot ${index + 1}`}
                                className="rounded-xl border border-slate-200 shadow-sm"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Submit Result Toast */}
      {submitResult && (
        <div className={cn(
          'fixed bottom-6 right-6 p-4 rounded-2xl shadow-2xl z-50 max-w-sm animate-in slide-in-from-bottom-5',
          submitResult.success
            ? 'bg-white border border-green-200'
            : 'bg-white border border-red-200'
        )}>
          <div className="flex items-start gap-3">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
              submitResult.success ? 'bg-green-100' : 'bg-red-100'
            )}>
              {submitResult.success ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <X className="w-4 h-4 text-red-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn(
                'font-medium',
                submitResult.success ? 'text-green-900' : 'text-red-900'
              )}>
                {submitResult.message}
              </p>
              {submitResult.url && (
                <a
                  href={submitResult.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-violet-600 hover:text-violet-700 flex items-center gap-1 mt-1 font-medium"
                >
                  View Issue <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <button
              onClick={() => setSubmitResult(null)}
              className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      )}

      {/* GitLab Settings Modal */}
      <GitLabSettings
        open={showSettings}
        onClose={() => setShowSettings(false)}
        onProjectsChange={loadProjects}
      />
    </div>
  )
}

export default App
