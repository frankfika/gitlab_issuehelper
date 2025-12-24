import { Settings, Eye, EyeOff, Save } from 'lucide-react'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSettings } from '@/store/settings'

export function SettingsPanel() {
  const { settings, updateSettings } = useSettings()
  const [localApiKey, setLocalApiKey] = useState(settings.apiKey)
  const [showApiKey, setShowApiKey] = useState(false)
  const [open, setOpen] = useState(false)

  const handleSave = () => {
    updateSettings({ apiKey: localApiKey })
    setOpen(false)
  }

  const handleOpenChange = (isOpen) => {
    setOpen(isOpen)
    if (isOpen) {
      setLocalApiKey(settings.apiKey)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Settings className="w-4 h-4" />
          {!settings.apiKey && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full" />
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>设置</DialogTitle>
          <DialogDescription>
            配置 AI 服务的 API Key，数据仅保存在本地浏览器中。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">硅基流动 API Key</Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showApiKey ? 'text' : 'password'}
                value={localApiKey}
                onChange={(e) => setLocalApiKey(e.target.value)}
                placeholder="sk-..."
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showApiKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              访问{' '}
              <a
                href="https://cloud.siliconflow.cn"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                硅基流动
              </a>
              {' '}获取 API Key
            </p>
          </div>

          <div className="space-y-2">
            <Label>使用模型</Label>
            <p className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-lg">
              DeepSeek-V3
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-1" />
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
