const API_ENDPOINT = 'https://api.siliconflow.cn/v1/chat/completions'
const API_KEY = import.meta.env.VITE_SILICONFLOW_API_KEY

export async function generateIssueContent({
  userDescription,
  images,
  onStream
}) {
  if (!API_KEY) {
    throw new Error('未配置 API Key，请在 .env 文件中设置 VITE_SILICONFLOW_API_KEY')
  }

  const systemPrompt = `你是一个资深的软件工程师和产品经理，擅长编写清晰、规范的 GitLab Issue。

## 你的任务
1. 分析用户的描述，判断这是 **Bug（问题/缺陷）** 还是 **Feature（新功能/改进）**
2. 根据类型选择对应的模板生成规范的 Issue
3. 在输出开头用标签标注类型：\`[Bug]\` 或 \`[Feature]\`

---

## Bug 报告模板（用于：错误、异常、崩溃、显示问题、功能失效等）

\`\`\`
[Bug] 简短标题

### 问题描述
<!-- 清晰描述问题现象，一句话说明白 -->

### 版本/环境
<!-- 问题出现的环境 -->
- 环境：生产/测试/开发
- 浏览器：
- 系统：

---

### 前置条件
<!-- 复现所需的权限、数据、配置等 -->
-

---

### 复现步骤
<!-- 必须可复现，按顺序写清楚 -->
1.
2.
3.

---

### 预期结果
-

### 实际结果
-

---

### 影响范围
- 模块：
- 影响用户：
- 严重程度：P0(阻塞)/P1(严重)/P2(一般)/P3(轻微)
\`\`\`

---

## Feature 需求模板（用于：新功能、优化、改进建议等）

\`\`\`
[Feature] 简短标题

### 需求描述
<!-- 一句话说明要做什么 -->

---

### 背景与动机
<!-- 为什么需要这个功能？解决什么问题？ -->

---

### 用户故事
作为 [用户角色]，
我希望 [功能描述]，
以便 [获得的价值]。

---

### 功能详情
<!-- 具体要实现什么，可以分点描述 -->
-

---

### 验收标准
<!-- 用清单形式，完成标准 -->
- [ ]
- [ ]
- [ ]

---

### 优先级与排期建议
- 优先级：高/中/低
- 建议排期：
\`\`\`

---

## 输出规则
1. **直接输出** Markdown 格式，不要任何解释性文字
2. **智能填充**：根据用户描述尽可能填充各字段内容
3. **保留占位**：用户未提供的信息，保留 \`<!-- 注释提示 -->\` 或空白让用户补充
4. **简洁专业**：语言简洁，突出关键信息
5. **标题概括**：在 [Bug] 或 [Feature] 后写一个简短概括性标题`

  // 构建用户消息
  let userMessage = userDescription || '请帮我创建一个 Issue'

  // 如果有图片，提示用户图片已上传
  if (images && images.length > 0) {
    userMessage += `\n\n（用户上传了 ${images.length} 张截图作为参考，截图将附在 Issue 末尾）`
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ]

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-ai/DeepSeek-V3',
        messages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: Boolean(onStream)
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `API 请求失败: ${response.status}`)
    }

    if (onStream) {
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'))

        for (const line of lines) {
          const data = line.replace('data:', '').trim()
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content || ''
            fullContent += content
            onStream(fullContent)
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }

      return fullContent
    } else {
      const data = await response.json()
      return data.choices?.[0]?.message?.content || ''
    }
  } catch (error) {
    console.error('AI generation error:', error)
    throw error
  }
}
