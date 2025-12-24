import { useState, useEffect } from 'react'
import { Settings, X, Check, Loader2, ExternalLink, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  getGitLabProjects,
  addGitLabProject,
  updateGitLabProject,
  deleteGitLabProject,
  testGitLabConnection
} from '@/lib/gitlab'

function ProjectForm({ project, onSave, onCancel, onDelete }) {
  const [config, setConfig] = useState({
    name: project?.name || '',
    gitlabUrl: project?.gitlabUrl || 'https://gitlab.com',
    token: project?.token || '',
    projectId: project?.projectId || ''
  })
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [saving, setSaving] = useState(false)

  const handleTest = async () => {
    if (!config.gitlabUrl || !config.token || !config.projectId) {
      setTestResult({ success: false, message: 'Please fill in URL, Token and Project ID' })
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const projectInfo = await testGitLabConnection(config)
      setTestResult({
        success: true,
        message: `Connected! Project: ${projectInfo.name_with_namespace}`
      })
      if (!config.name) {
        setConfig(prev => ({ ...prev, name: projectInfo.name }))
      }
    } catch (err) {
      setTestResult({ success: false, message: err.message })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    if (!config.name || !config.gitlabUrl || !config.token || !config.projectId) {
      setTestResult({ success: false, message: 'Please fill in all fields' })
      return
    }

    setSaving(true)
    try {
      if (project?.id) {
        updateGitLabProject(project.id, config)
      } else {
        addGitLabProject(config)
      }
      onSave()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Project Name</label>
        <input
          type="text"
          value={config.name}
          onChange={(e) => setConfig({ ...config, name: e.target.value })}
          placeholder="e.g., Frontend App"
          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">GitLab URL</label>
        <input
          type="url"
          value={config.gitlabUrl}
          onChange={(e) => setConfig({ ...config, gitlabUrl: e.target.value })}
          placeholder="https://gitlab.com"
          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Personal Access Token</label>
        <input
          type="password"
          value={config.token}
          onChange={(e) => setConfig({ ...config, token: e.target.value })}
          placeholder="glpat-xxxxxxxxxxxx"
          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-colors"
        />
        <p className="text-xs text-slate-500 mt-1.5">
          Requires <code className="bg-slate-100 px-1 py-0.5 rounded text-violet-600">api</code> scope.{' '}
          <a
            href="https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-600 hover:underline inline-flex items-center gap-0.5"
          >
            Learn more <ExternalLink className="w-3 h-3" />
          </a>
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Project ID</label>
        <input
          type="text"
          value={config.projectId}
          onChange={(e) => setConfig({ ...config, projectId: e.target.value })}
          placeholder="12345 or group/project"
          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-colors"
        />
      </div>

      {testResult && (
        <div className={cn(
          'p-3 rounded-xl text-sm',
          testResult.success
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        )}>
          {testResult.message}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          onClick={handleTest}
          disabled={testing}
          className="flex-1 rounded-xl"
        >
          {testing ? (
            <>
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              Testing...
            </>
          ) : (
            'Test Connection'
          )}
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 rounded-xl btn-premium"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-1.5" />
              Save
            </>
          )}
        </Button>
      </div>

      <div className="flex gap-2 pt-1">
        <Button variant="ghost" onClick={onCancel} className="flex-1 text-slate-600">
          Cancel
        </Button>
        {project?.id && (
          <Button
            variant="ghost"
            onClick={() => onDelete(project.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

function ProjectItem({ project, onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-violet-300 transition-colors group">
      <div className="flex-1 min-w-0">
        <div className="font-medium text-slate-900 truncate">{project.name}</div>
        <div className="text-sm text-slate-500 truncate">
          {project.projectId}
        </div>
      </div>
      <div className="flex gap-1 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="sm" onClick={() => onEdit(project)} className="text-slate-600 hover:text-slate-900">
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(project.id)}
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

export function GitLabSettings({ open, onClose, onProjectsChange }) {
  const [projects, setProjects] = useState([])
  const [editingProject, setEditingProject] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    if (open) {
      loadProjects()
    }
  }, [open])

  const loadProjects = () => {
    setProjects(getGitLabProjects())
  }

  const handleSave = () => {
    loadProjects()
    setEditingProject(null)
    setShowAddForm(false)
    onProjectsChange?.()
  }

  const handleDelete = (id) => {
    deleteGitLabProject(id)
    loadProjects()
    setEditingProject(null)
    onProjectsChange?.()
  }

  const handleCancel = () => {
    setEditingProject(null)
    setShowAddForm(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">GitLab Projects</h2>
              <p className="text-sm text-slate-500">Manage your connected projects</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-4">
          {/* Project List */}
          {projects.length > 0 && !showAddForm && !editingProject && (
            <div className="space-y-3">
              {projects.map(project => (
                <ProjectItem
                  key={project.id}
                  project={project}
                  onEdit={setEditingProject}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          {/* Edit Form */}
          {editingProject && (
            <ProjectForm
              project={editingProject}
              onSave={handleSave}
              onCancel={handleCancel}
              onDelete={handleDelete}
            />
          )}

          {/* Add Form */}
          {showAddForm && (
            <ProjectForm
              onSave={handleSave}
              onCancel={handleCancel}
            />
          )}

          {/* Add Button */}
          {!showAddForm && !editingProject && (
            <Button
              variant="outline"
              onClick={() => setShowAddForm(true)}
              className="w-full rounded-xl border-dashed border-2 h-12 text-slate-600 hover:text-violet-600 hover:border-violet-300"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Project
            </Button>
          )}

          {/* Empty State */}
          {projects.length === 0 && !showAddForm && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Settings className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="font-medium text-slate-700 mb-1">No projects yet</h3>
              <p className="text-sm text-slate-500">
                Add your first GitLab project to get started
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
