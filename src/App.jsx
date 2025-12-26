import { useState, useEffect, useCallback } from 'react'
import { Sparkles, Copy, Check, Loader2, ImagePlus, X, FileText, RefreshCw, Settings, Send, ExternalLink, Zap, Trash2, RotateCcw, Keyboard, Edit3, Eye, Maximize2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { generateIssueContent } from '@/lib/ai'
import { useClipboardPaste, useCopyToClipboard } from '@/hooks/useClipboard'
import { GitLabSettings } from '@/components/GitLabSettings'
import { ProjectSelector } from '@/components/ProjectSelector'
import { ImagePreviewModal } from '@/components/ImagePreviewModal'
import { getGitLabProjects, createGitLabIssue, extractTitleFromContent, extractLabelsFromContent } from '@/lib/gitlab'
import { saveToHistory, getHistory } from '@/lib/history'

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
  const [previewMode, setPreviewMode] = useState('preview') // 'preview' | 'edit'
  const [editableContent, setEditableContent] = useState('')
  const [previewImage, setPreviewImage] = useState(null)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showSubmitPicker, setShowSubmitPicker] = useState(false)
  const [pendingProject, setPendingProject] = useState(null)

  const copy = useCopyToClipboard()

  // 加载项目配置
  const loadProjects = () => {
    const allProjects = getGitLabProjects()
    setProjects(allProjects)
    if (allProjects.length === 0) {
      setSelectedProject(null)
      return
    }
    if (selectedProject) {
      const matched = allProjects.find(p => p.id === selectedProject.id)
      setSelectedProject(matched || allProjects[0] || null)
      return
    }
    setSelectedProject(allProjects[0] || null)
  }

  useEffect(() => {
    loadProjects()
  }, [])

  // 同步生成内容到可编辑内容
  useEffect(() => {
    setEditableContent(generatedContent)
  }, [generatedContent])

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
    setPreviewMode('preview')

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
  const getFullContent = useCallback(() => {
    const content = previewMode === 'edit' ? editableContent : generatedContent
    let fullContent = content

    if (images.length > 0) {
      fullContent += '\n\n---\n\n### 截图\n'
      images.forEach((img, index) => {
        fullContent += `![截图 ${index + 1}](${img})\n\n`
      })
    }

    return fullContent
  }, [previewMode, editableContent, generatedContent, images])

  // 复制内容
  const handleCopy = async () => {
    const content = previewMode === 'edit' ? editableContent : generatedContent
    if (!content) return
    const fullContent = getFullContent()
    const success = await copy(fullContent)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // 清空所有
  const handleClear = () => {
    setDescription('')
    setImages([])
    setGeneratedContent('')
    setEditableContent('')
    setError(null)
    setSubmitResult(null)
    setPreviewMode('preview')
  }

  // 提交到 GitLab
  const submitIssueToGitLab = async (project) => {
    const content = previewMode === 'edit' ? editableContent : generatedContent
    if (!content) return

    if (!project) {
      setShowSettings(true)
      return
    }

    setIsSubmitting(true)
    setSubmitResult(null)

    try {
      const title = extractTitleFromContent(content)
      const labels = extractLabelsFromContent(content)
      const issueDescription = getFullContent()

      const issue = await createGitLabIssue({ title, description: issueDescription, labels, project })

      // 保存到历史记录
      saveToHistory({
        title,
        content: issueDescription,
        projectName: project.name,
        issueUrl: issue.web_url,
        issueId: issue.iid
      })

      setSubmitResult({
        success: true,
        message: `Issue #${issue.iid} 已提交到 ${project.name}`,
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

  const handleSubmitClick = () => {
    const content = previewMode === 'edit' ? editableContent : generatedContent
    if (!content) return
    if (projects.length === 0) {
      setShowSettings(true)
      return
    }
    if (projects.length > 1) {
      const matched = selectedProject
        ? projects.find(p => p.id === selectedProject.id)
        : null
      setPendingProject(matched || projects[0] || null)
      setShowSubmitPicker(true)
      return
    }
    submitIssueToGitLab(selectedProject || projects[0] || null)
  }

  const handleConfirmSubmit = () => {
    if (!pendingProject) return
    setShowSubmitPicker(false)
    setSelectedProject(pendingProject)
    submitIssueToGitLab(pendingProject)
  }

  const formatHost = (url) => {
    if (!url) return ''
    try {
      return new URL(url).host
    } catch {
      return url.replace(/^https?:\/\//, '').replace(/\/+$/, '')
    }
  }

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + Enter: 生成
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        if (!isGenerating && (description.trim() || images.length > 0)) {
          handleGenerate()
        }
      }
      // Escape: 关闭弹窗
      if (e.key === 'Escape') {
        if (previewImage) {
          setPreviewImage(null)
        } else if (showSettings) {
          setShowSettings(false)
        } else if (showShortcuts) {
          setShowShortcuts(false)
        }
      }
      // Ctrl/Cmd + Shift + C: 复制生成的内容
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault()
        handleCopy()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [description, images, isGenerating, previewImage, showSettings, showShortcuts, handleCopy])

  // Toast 自动消失
  useEffect(() => {
    if (submitResult) {
      const timer = setTimeout(() => {
        setSubmitResult(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [submitResult])

  // 获取实际显示的内容
  const displayContent = previewMode === 'edit' ? editableContent : generatedContent

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
              <h1 className="text-lg font-semibold text-slate-900">GitLab Issue 生成器</h1>
              <p className="text-xs text-slate-500">AI 智能生成规范 Issue</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowShortcuts(true)}
              className="text-slate-500 hover:text-slate-700"
              title="快捷键"
            >
              <Keyboard className="w-4 h-4" />
            </Button>
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
              {projects.length > 0 ? `${projects.length} 个项目` : '配置'}
            </Button>
          </div>
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
                描述你的需求
              </h2>
              <p className="text-slate-500">
                AI 将为你生成专业、规范的 GitLab Issue
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">问题描述</label>
                <span className={cn(
                  "text-xs transition-colors",
                  description.length > 500 ? "text-amber-600" : "text-slate-400"
                )}>
                  {description.length} 字
                </span>
              </div>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="描述你遇到的 Bug 或需要的功能...

示例：
• 手机端登录按钮点击无响应
• 需要批量导出功能
• 仪表盘图表加载很慢"
                className="min-h-[180px] resize-none text-base bg-white border-slate-200 focus:border-violet-400 focus:ring-violet-400/20 rounded-xl shadow-sm"
              />
              <p className="text-xs text-slate-400">
                提示：按 <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-mono">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-mono">Enter</kbd> 快速生成
              </p>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">截图（可选）</label>
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
                      {isDragging ? '松开以上传' : '添加截图'}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      按 Ctrl+V 粘贴 或 拖拽图片到这里
                    </p>
                  </div>
                </div>
              </div>

              {/* Image Preview */}
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {images.map((img, index) => (
                    <div key={index} className="relative group aspect-video rounded-lg overflow-hidden bg-slate-100 shadow-sm">
                      <img
                        src={img}
                        alt={`截图 ${index + 1}`}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setPreviewImage(img)}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={() => setPreviewImage(img)}
                          className="p-2 bg-white rounded-full hover:bg-slate-100 transition-colors"
                          title="放大查看"
                        >
                          <Maximize2 className="w-4 h-4 text-slate-700" />
                        </button>
                        <button
                          onClick={() => removeImage(index)}
                          className="p-2 bg-white rounded-full hover:bg-red-50 transition-colors"
                          title="删除"
                        >
                          <X className="w-4 h-4 text-red-600" />
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
              <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm animate-shake">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex-1 h-12 text-base rounded-xl btn-premium"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    生成 Issue
                  </>
                )}
              </Button>
              {(description || images.length > 0 || generatedContent) && (
                <Button
                  variant="outline"
                  onClick={handleClear}
                  className="h-12 px-4 rounded-xl text-slate-600 hover:text-red-600 hover:border-red-200"
                  title="清空所有"
                >
                  <RotateCcw className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)]">
            <Card className="h-full border-slate-200 shadow-sm overflow-hidden">
              <CardContent className="p-0 h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">预览</span>
                    {displayContent && (
                      <div className="flex items-center ml-2 bg-white rounded-lg border border-slate-200 p-0.5">
                        <button
                          onClick={() => setPreviewMode('preview')}
                          className={cn(
                            "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                            previewMode === 'preview'
                              ? 'bg-violet-100 text-violet-700'
                              : 'text-slate-500 hover:text-slate-700'
                          )}
                        >
                          <Eye className="w-3 h-3 inline-block mr-1" />
                          预览
                        </button>
                        <button
                          onClick={() => setPreviewMode('edit')}
                          className={cn(
                            "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                            previewMode === 'edit'
                              ? 'bg-violet-100 text-violet-700'
                              : 'text-slate-500 hover:text-slate-700'
                          )}
                        >
                          <Edit3 className="w-3 h-3 inline-block mr-1" />
                          编辑
                        </button>
                      </div>
                    )}
                  </div>
                  {displayContent && (
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={handleGenerate} disabled={isGenerating} className="text-slate-600 hover:text-slate-900">
                        <RefreshCw className={cn('w-4 h-4 mr-1.5', isGenerating && 'animate-spin')} />
                        重新生成
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
                            已复制
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-1.5" />
                            复制
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* GitLab Submit Bar */}
                {displayContent && (
                  <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-indigo-50">
                    <ProjectSelector
                      selectedProject={selectedProject}
                      onSelect={setSelectedProject}
                      onOpenSettings={() => setShowSettings(true)}
                    />
                    <Button
                      size="sm"
                      onClick={handleSubmitClick}
                      disabled={isSubmitting}
                      className="rounded-full btn-premium px-5"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                          提交中...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-1.5" />
                          提交到 GitLab
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                  {!displayContent && !isGenerating ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center max-w-xs">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                          <Sparkles className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="font-medium text-slate-700 mb-1">准备就绪</h3>
                        <p className="text-sm text-slate-500">
                          在左侧输入描述或上传截图，AI 将为你生成专业的 Issue
                        </p>
                        {projects.length === 0 && (
                          <>
                            <Button
                              variant="link"
                              onClick={() => setShowSettings(true)}
                              className="mt-4 text-violet-600"
                            >
                              <Settings className="w-4 h-4 mr-1" />
                              先配置 GitLab 项目
                            </Button>
                            <p className="text-xs text-slate-400 mt-2">
                              在配置里填写 GitLab 地址、访问令牌、项目 ID，信息会保存在浏览器 Cookie。
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  ) : previewMode === 'edit' ? (
                    <Textarea
                      value={editableContent}
                      onChange={(e) => setEditableContent(e.target.value)}
                      className="w-full h-full min-h-[400px] resize-none font-mono text-sm bg-white border-slate-200 focus:border-violet-400 focus:ring-violet-400/20 rounded-xl"
                      placeholder="编辑生成的内容..."
                    />
                  ) : (
                    <div className="markdown-body">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {displayContent}
                      </ReactMarkdown>
                      {isGenerating && (
                        <span className="inline-block w-0.5 h-5 bg-violet-500 animate-pulse ml-0.5" />
                      )}
                      {/* 显示截图预览 */}
                      {!isGenerating && images.length > 0 && (
                        <div className="mt-8 pt-8 border-t border-slate-200">
                          <h3 className="text-base font-semibold text-slate-900 mb-4">截图</h3>
                          <div className="grid grid-cols-2 gap-4">
                            {images.map((img, index) => (
                              <img
                                key={index}
                                src={img}
                                alt={`截图 ${index + 1}`}
                                className="rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => setPreviewImage(img)}
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
                <div className="flex items-center gap-3 mt-2">
                  <a
                    href={submitResult.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-violet-600 hover:text-violet-700 flex items-center gap-1 font-medium"
                  >
                    查看 Issue <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    onClick={handleClear}
                    className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    清空继续
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => setSubmitResult(null)}
              className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          {/* 自动关闭进度条 */}
          <div className="mt-3 h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className={cn(
              "h-full rounded-full animate-progress",
              submitResult.success ? "bg-green-500" : "bg-red-500"
            )} />
          </div>
        </div>
      )}

      {/* 快捷键弹窗 */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowShortcuts(false)} />
          <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">键盘快捷键</h2>
              <button onClick={() => setShowShortcuts(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-600">生成 Issue</span>
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 bg-slate-100 rounded text-sm font-mono">Ctrl</kbd>
                  <span className="text-slate-400">+</span>
                  <kbd className="px-2 py-1 bg-slate-100 rounded text-sm font-mono">Enter</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-600">复制内容</span>
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 bg-slate-100 rounded text-sm font-mono">Ctrl</kbd>
                  <span className="text-slate-400">+</span>
                  <kbd className="px-2 py-1 bg-slate-100 rounded text-sm font-mono">Shift</kbd>
                  <span className="text-slate-400">+</span>
                  <kbd className="px-2 py-1 bg-slate-100 rounded text-sm font-mono">C</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-600">关闭弹窗</span>
                <kbd className="px-2 py-1 bg-slate-100 rounded text-sm font-mono">Esc</kbd>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-600">粘贴截图</span>
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 bg-slate-100 rounded text-sm font-mono">Ctrl</kbd>
                  <span className="text-slate-400">+</span>
                  <kbd className="px-2 py-1 bg-slate-100 rounded text-sm font-mono">V</kbd>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 图片预览弹窗 */}
      {previewImage && (
        <ImagePreviewModal
          image={previewImage}
          onClose={() => setPreviewImage(null)}
        />
      )}

      {/* GitLab Settings Modal */}
      <GitLabSettings
        open={showSettings}
        onClose={() => setShowSettings(false)}
        onProjectsChange={loadProjects}
        selectedProject={selectedProject}
        onSelectProject={setSelectedProject}
      />

      {/* Submit Project Picker */}
      <Dialog open={showSubmitPicker} onOpenChange={setShowSubmitPicker}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>选择提交项目</DialogTitle>
            <DialogDescription>
              请确认本次 Issue 要提交到哪个 GitLab 项目。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-72 overflow-auto">
            {projects.map(project => (
              <button
                key={project.id}
                onClick={() => setPendingProject(project)}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-colors',
                  pendingProject?.id === project.id
                    ? 'border-violet-400 bg-violet-50'
                    : 'border-slate-200 hover:border-violet-200 hover:bg-slate-50'
                )}
              >
                <span className="min-w-0">
                  <span className="block font-medium text-slate-900 truncate">{project.name}</span>
                  <span className="block text-xs text-slate-500 truncate">
                    {formatHost(project.gitlabUrl)} · {project.projectId}
                  </span>
                </span>
                {pendingProject?.id === project.id && (
                  <Check className="w-4 h-4 text-violet-600" />
                )}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitPicker(false)}>
              取消
            </Button>
            <Button onClick={handleConfirmSubmit} disabled={!pendingProject || isSubmitting}>
              确认提交
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default App
