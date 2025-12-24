import { useState, useCallback, useRef } from 'react'
import { ImagePlus, X, Clipboard } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useClipboardPaste } from '@/hooks/useClipboard'

export function ImageUploader({ images, onImagesChange }) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  const addImage = useCallback((dataUrl) => {
    onImagesChange([...images, dataUrl])
  }, [images, onImagesChange])

  const removeImage = useCallback((index) => {
    onImagesChange(images.filter((_, i) => i !== index))
  }, [images, onImagesChange])

  useClipboardPaste(addImage)

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        addImage(event.target.result)
      }
      reader.readAsDataURL(file)
    })
  }, [addImage])

  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'))
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        addImage(event.target.result)
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }, [addImage])

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer',
          isDragging
            ? 'border-primary bg-primary/10 scale-[1.02]'
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50',
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />

        <div className="flex flex-col items-center gap-3">
          <div className={cn(
            'p-4 rounded-full transition-colors duration-300',
            isDragging ? 'bg-primary/20' : 'bg-muted'
          )}>
            <ImagePlus className={cn(
              'w-8 h-8 transition-colors duration-300',
              isDragging ? 'text-primary' : 'text-muted-foreground'
            )} />
          </div>

          <div>
            <p className="text-sm font-medium">
              {isDragging ? '松开以上传图片' : '拖拽图片到这里'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              或点击选择文件
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
            <Clipboard className="w-3 h-3" />
            <span>支持 Ctrl+V 粘贴截图</span>
          </div>
        </div>
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((img, index) => (
            <div
              key={index}
              className="relative group aspect-video rounded-lg overflow-hidden bg-muted animate-fade-in"
            >
              <img
                src={img}
                alt={`截图 ${index + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeImage(index)
                  }}
                  className="p-2 bg-destructive rounded-full hover:bg-destructive/80 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Index Badge */}
              <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 rounded text-xs text-white">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
