export const templates = {
  bug: {
    name: 'Bug Report',
    icon: 'Bug',
    description: '报告软件缺陷或错误',
    fields: [
      { id: 'description', label: 'Bug 描述', type: 'textarea', placeholder: '简要描述遇到的问题...' },
      { id: 'steps', label: '复现步骤', type: 'textarea', placeholder: '1. 打开...\n2. 点击...\n3. 出现...' },
      { id: 'expected', label: '期望行为', type: 'textarea', placeholder: '描述期望的正确行为...' },
      { id: 'actual', label: '实际行为', type: 'textarea', placeholder: '描述实际发生的错误行为...' },
      { id: 'environment', label: '环境信息', type: 'textarea', placeholder: '操作系统、浏览器、版本等...' },
    ],
    generateMarkdown: (data, images) => {
      let md = `## Bug 描述\n${data.description || '_待填写_'}\n\n`
      md += `## 复现步骤\n${data.steps || '1. \n2. \n3. '}\n\n`
      md += `## 期望行为\n${data.expected || '_待填写_'}\n\n`
      md += `## 实际行为\n${data.actual || '_待填写_'}\n\n`

      if (images && images.length > 0) {
        md += `## 截图\n`
        images.forEach((img, index) => {
          md += `![截图 ${index + 1}](${img})\n\n`
        })
      }

      md += `## 环境信息\n${data.environment || '- 操作系统: \n- 浏览器: \n- 版本: '}\n`

      return md
    }
  },
  feature: {
    name: 'Feature Request',
    icon: 'Lightbulb',
    description: '提出新功能建议',
    fields: [
      { id: 'description', label: '功能描述', type: 'textarea', placeholder: '描述希望添加的新功能...' },
      { id: 'scenario', label: '使用场景', type: 'textarea', placeholder: '描述这个功能的应用场景...' },
      { id: 'proposal', label: '建议方案', type: 'textarea', placeholder: '可选的实现建议...' },
    ],
    generateMarkdown: (data, images) => {
      let md = `## 功能描述\n${data.description || '_待填写_'}\n\n`
      md += `## 使用场景\n${data.scenario || '_待填写_'}\n\n`
      md += `## 建议方案\n${data.proposal || '_待填写_'}\n\n`

      if (images && images.length > 0) {
        md += `## 参考资料\n`
        images.forEach((img, index) => {
          md += `![参考图 ${index + 1}](${img})\n\n`
        })
      }

      return md
    }
  }
}

export const priorityOptions = [
  { value: 'critical', label: '紧急', color: 'text-red-500' },
  { value: 'high', label: '高', color: 'text-orange-500' },
  { value: 'medium', label: '中', color: 'text-yellow-500' },
  { value: 'low', label: '低', color: 'text-green-500' },
]

export const labelOptions = [
  { value: 'frontend', label: '前端' },
  { value: 'backend', label: '后端' },
  { value: 'ui', label: 'UI/UX' },
  { value: 'api', label: 'API' },
  { value: 'database', label: '数据库' },
  { value: 'performance', label: '性能' },
  { value: 'security', label: '安全' },
  { value: 'documentation', label: '文档' },
]
