import { useState, useCallback } from 'react'
import { generateIssueContent } from '@/lib/ai'
import { useSettings } from '@/store/settings'

export function useAI() {
  const { settings } = useSettings()
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [streamContent, setStreamContent] = useState('')

  const generate = useCallback(async ({ templateType, userDescription, images }) => {
    if (!settings.apiKey) {
      setError('请先在设置中配置 API Key')
      return null
    }

    setIsGenerating(true)
    setError(null)
    setStreamContent('')

    try {
      const result = await generateIssueContent({
        templateType,
        userDescription,
        images,
        apiKey: settings.apiKey,
        onStream: (content) => {
          setStreamContent(content)
        }
      })
      return result
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setIsGenerating(false)
    }
  }, [settings.apiKey])

  return {
    generate,
    isGenerating,
    error,
    streamContent,
    clearError: () => setError(null)
  }
}
