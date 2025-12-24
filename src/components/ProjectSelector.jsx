import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Check, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getGitLabProjects } from '@/lib/gitlab'

export function ProjectSelector({ selectedProject, onSelect, onOpenSettings }) {
  const [open, setOpen] = useState(false)
  const [projects, setProjects] = useState([])
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

  if (projects.length === 0) {
    return (
      <button
        onClick={onOpenSettings}
        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-violet-600 border border-dashed border-slate-300 rounded-full hover:border-violet-400 transition-all"
      >
        <Settings className="w-4 h-4" />
        <span>Configure project</span>
      </button>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-full transition-all min-w-[160px]',
          open
            ? 'border-violet-400 bg-violet-50 text-violet-700'
            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
        )}
      >
        <span className="flex-1 text-left truncate">
          {selectedProject?.name || 'Select project'}
        </span>
        <ChevronDown className={cn('w-4 h-4 transition-transform text-slate-400', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-full min-w-[220px] bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2 animate-in slide-in-from-bottom-5">
          {projects.map(project => (
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
                <div className="text-xs text-slate-500 truncate">{project.projectId}</div>
              </div>
            </button>
          ))}
          <div className="border-t border-slate-100 mt-2 pt-2">
            <button
              onClick={() => {
                setOpen(false)
                onOpenSettings()
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Manage projects</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
