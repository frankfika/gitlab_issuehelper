// GitLab API 集成 - 支持多项目配置

const STORAGE_KEY = 'gitlab_projects'
const COOKIE_MAX_AGE_DAYS = 365

function getCookieValue(name) {
  if (typeof document === 'undefined') return ''
  const cookies = document.cookie ? document.cookie.split('; ') : []
  for (const cookie of cookies) {
    const [key, ...rest] = cookie.split('=')
    if (key === name) {
      return rest.join('=')
    }
  }
  return ''
}

function setCookieValue(name, value, days) {
  if (typeof document === 'undefined') return false
  const maxAge = days ? `; max-age=${days * 24 * 60 * 60}` : ''
  const secure = typeof window !== 'undefined' && window.location?.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${name}=${value}; path=/; SameSite=Lax${maxAge}${secure}`
  return getCookieValue(name) === value
}

function readProjectsFromCookie() {
  const raw = getCookieValue(STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(decodeURIComponent(raw))
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function readProjectsFromLocalStorage() {
  if (typeof localStorage === 'undefined') return null
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function writeProjectsToCookie(projects) {
  const serialized = encodeURIComponent(JSON.stringify(projects))
  const stored = setCookieValue(STORAGE_KEY, serialized, COOKIE_MAX_AGE_DAYS)
  if (!stored && typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
  }
}

// 获取所有项目配置
export function getGitLabProjects() {
  const fromCookie = readProjectsFromCookie()
  if (fromCookie) return fromCookie
  const fromLocalStorage = readProjectsFromLocalStorage()
  if (fromLocalStorage) {
    writeProjectsToCookie(fromLocalStorage)
    return fromLocalStorage
  }
  return []
}

// 保存所有项目配置
export function saveGitLabProjects(projects) {
  writeProjectsToCookie(projects)
}

// 添加项目
export function addGitLabProject(project) {
  const projects = getGitLabProjects()
  const newProject = {
    ...project,
    id: Date.now().toString(),
    createdAt: new Date().toISOString()
  }
  projects.push(newProject)
  saveGitLabProjects(projects)
  return newProject
}

// 更新项目
export function updateGitLabProject(id, updates) {
  const projects = getGitLabProjects()
  const index = projects.findIndex(p => p.id === id)
  if (index !== -1) {
    projects[index] = { ...projects[index], ...updates }
    saveGitLabProjects(projects)
  }
  return projects[index]
}

// 删除项目
export function deleteGitLabProject(id) {
  const projects = getGitLabProjects()
  const filtered = projects.filter(p => p.id !== id)
  saveGitLabProjects(filtered)
}

// 获取单个项目配置（兼容旧版）
export function getGitLabConfig() {
  const projects = getGitLabProjects()
  return projects.length > 0 ? projects[0] : null
}

// 测试连接
export async function testGitLabConnection(config) {
  const { gitlabUrl, token, projectId } = config

  const response = await fetch(`${gitlabUrl}/api/v4/projects/${encodeURIComponent(projectId)}`, {
    headers: {
      'PRIVATE-TOKEN': token
    }
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `连接失败: ${response.status}`)
  }

  return await response.json()
}

// 创建 Issue
export async function createGitLabIssue({ title, description, labels = [], project }) {
  if (!project) {
    throw new Error('未选择目标项目')
  }

  const { gitlabUrl, token, projectId } = project

  const response = await fetch(`${gitlabUrl}/api/v4/projects/${encodeURIComponent(projectId)}/issues`, {
    method: 'POST',
    headers: {
      'PRIVATE-TOKEN': token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title,
      description,
      labels: labels.join(',')
    })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `创建 Issue 失败: ${response.status}`)
  }

  return await response.json()
}

// 从内容中提取标题
export function extractTitleFromContent(content) {
  // 尝试匹配 [Bug] 或 [Feature] 开头的标题
  const match = content.match(/^\[(?:Bug|Feature)\]\s*(.+?)(?:\n|$)/m)
  if (match) {
    return match[0].trim()
  }

  // 否则取第一行
  const firstLine = content.split('\n')[0].trim()
  return firstLine.substring(0, 100) || 'New Issue'
}

// 从内容中提取标签
export function extractLabelsFromContent(content) {
  const labels = []

  if (content.includes('[Bug]')) {
    labels.push('bug')
  }
  if (content.includes('[Feature]')) {
    labels.push('feature')
  }

  // 提取严重程度
  const severityMatch = content.match(/严重程度[：:]\s*(P[0-3])/i)
  if (severityMatch) {
    labels.push(severityMatch[1].toLowerCase())
  }

  // 提取优先级
  const priorityMatch = content.match(/优先级[：:]\s*(高|中|低)/i)
  if (priorityMatch) {
    const priorityMap = { '高': 'priority::high', '中': 'priority::medium', '低': 'priority::low' }
    labels.push(priorityMap[priorityMatch[1]] || '')
  }

  return labels.filter(Boolean)
}
