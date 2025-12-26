import { useState, useEffect, useRef, useMemo } from 'react'
import { ChevronDown, Check, Settings, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getGitLabProjects } from '@/lib/gitlab'
import { Input } from '@/components/ui/input'

export function ProjectSelector({ selectedProject, onSelect, onOpenSettings }) {
  const [open, setOpen] = useState(false)
  const [projects, setProjects] = useState([])
  const [query, setQuery] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    setProjects(getGitLabProjects())
  }, [])

  const refresh = () => {
    const newProjects = getGitLabProjects()
    setProjects(newProjects)
    if (selectedProject && !newProjects.find(p => p.id === selectedProject.id)) {
      onSelect(newProjects[0] || null)
    }
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (ref.current) {
      ref.current.refresh = refresh
    }
  }, [])

  useEffect(() => {
    if (!open) {
      setQuery('')
    }
  }, [open])

  const formatHost = (url) => {
    if (!url) return ''
    try {
      return new URL(url).host
    } catch {
      return url.replace(/^https?:\/\//, '').replace(/\/+$/, '')
    }
  }

  const filteredProjects = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return projects
    return projects.filter((project) => {
      const haystack = [
        project.name,
        project.projectId,
        formatHost(project.gitlabUrl)
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(keyword)
    })
  }, [projects, query])

  if (projects.length === 0) {
    return (
      <button
        onClick={onOpenSettings}
        className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:text-violet-600 border border-dashed border-slate-300 rounded-2xl hover:border-violet-400 transition-all"
      >
        <Settings className="w-4 h-4" />
        <span className="text-left">
          <span className="block font-medium">添加 GitLab 项目</span>
          <span className="block text-xs text-slate-400">填写地址、Token、项目 ID</span>
        </span>
      </button>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-3 px-4 py-2 text-sm font-medium border rounded-2xl transition-all min-w-[220px]',
          open
            ? 'border-violet-400 bg-violet-50 text-violet-700'
            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
        )}
      >
        <span className="flex-1 text-left min-w-0">
          <span className="block truncate">{selectedProject?.name || '选择项目'}</span>
          <span className="block text-xs text-slate-500 truncate">
            {selectedProject
              ? `${formatHost(selectedProject.gitlabUrl)} · ${selectedProject.projectId}`
              : '点击选择或添加项目'}
          </span>
        </span>
        <ChevronDown className={cn('w-4 h-4 transition-transform text-slate-400', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-full min-w-[260px] bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-2 animate-in slide-in-from-bottom-5">
          <div className="px-3 pt-3 pb-2">
            <div className="text-xs text-slate-500 mb-2">搜索项目</div>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="按名称 / ID / 域名搜索"
                className="h-9 pl-9 rounded-xl border-slate-200 focus:border-violet-400"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-auto">
            {filteredProjects.length > 0 ? (
              filteredProjects.map(project => (
                <button
                  key={project.id}
                  onClick={() => {
                    onSelect(project)
                    setOpen(false)
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors text-left',
                    selectedProject?.id === project.id && 'bg-violet-50'
                  )}
                >
                  <div className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                    selectedProject?.id === project.id
                      ? 'border-violet-500 bg-violet-500'
                      : 'border-slate-300'
                  )}>
                    {selectedProject?.id === project.id && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 truncate">{project.name}</div>
                    <div className="text-xs text-slate-500 truncate">
                      {formatHost(project.gitlabUrl)} · {project.projectId}
                    </div>
                  </div>
                  {selectedProject?.id === project.id && (
                    <span className="text-xs text-violet-600 font-medium">当前</span>
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-6 text-center text-sm text-slate-500">
                未找到匹配项目，去管理里添加或修改。
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 mt-2 pt-2">
            <button
              onClick={() => {
                setOpen(false)
                onOpenSettings()
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>管理 / 添加项目</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
