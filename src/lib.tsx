import { render } from 'preact'
import { Comments } from './components/Comments'
import './tailwind.css'

// 导出 Comments 组件
export { Comments }

// 全局挂载函数
declare global {
  interface Window {
    WhisperComment: {
      mount: (selector: string, options?: any) => void
      autoMount: () => void
      Comments: typeof Comments
    }
  }
}

// 手动挂载函数（保持向后兼容）
function mount(selector: string, options: any = {}) {
  const element = document.querySelector(selector)
  if (!element) {
    console.error(`Element with selector "${selector}" not found`)
    return
  }

  const { title = '评论区', className = '' } = options

  render(
    <Comments title={title} className={className} />,
    element
  )
}

// 自动挂载函数
function autoMount() {
  // 查找所有具有 data-whisper-comment 属性的元素
  const elements = document.querySelectorAll('[data-whisper-comment]')
  
  elements.forEach((element) => {
    // 检查是否已经挂载过（避免重复挂载）
    if (element.hasAttribute('data-whisper-mounted')) {
      return
    }

    // 从 data 属性中读取配置
    const title = element.getAttribute('data-title') || '评论区'
    const className = element.getAttribute('data-class-name') || ''
    
    // 渲染组件
    render(
      <Comments title={title} className={className} />,
      element
    )
    
    // 标记为已挂载
    element.setAttribute('data-whisper-mounted', 'true')
  })
}

// 当 DOM 内容加载完成后自动挂载
function initAutoMount() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoMount)
  } else {
    // 如果页面已经加载完成，立即执行
    autoMount()
  }
}

// 暴露到全局
window.WhisperComment = {
  mount,
  autoMount,
  Comments
}

// 启动自动挂载
initAutoMount() 