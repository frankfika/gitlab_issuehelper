const HISTORY_KEY = 'issue_history'
const MAX_HISTORY = 20

/**
 * 获取历史记录
 */
export function getHistory() {
  try {
    const data = localStorage.getItem(HISTORY_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

/**
 * 保存到历史记录
 */
export function saveToHistory({ title, content, projectName, issueUrl, issueId }) {
  const history = getHistory()

  const newRecord = {
    id: Date.now().toString(),
    title,
    content,
    projectName,
    issueUrl,
    issueId,
    createdAt: new Date().toISOString()
  }

  // 添加到开头
  history.unshift(newRecord)

  // 限制最大数量
  if (history.length > MAX_HISTORY) {
    history.pop()
  }

  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  return newRecord
}

/**
 * 删除历史记录
 */
export function deleteFromHistory(id) {
  const history = getHistory()
  const filtered = history.filter(item => item.id !== id)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered))
  return filtered
}

/**
 * 清空历史记录
 */
export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY)
  return []
}

/**
 * 格式化时间
 */
export function formatHistoryDate(isoString) {
  const date = new Date(isoString)
  const now = new Date()
  const diff = now - date

  // 1分钟内
  if (diff < 60 * 1000) {
    return '刚刚'
  }

  // 1小时内
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000))
    return `${minutes} 分钟前`
  }

  // 今天
  if (date.toDateString() === now.toDateString()) {
    return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }

  // 昨天
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }

  // 今年
  if (date.getFullYear() === now.getFullYear()) {
    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }

  // 其他
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}
