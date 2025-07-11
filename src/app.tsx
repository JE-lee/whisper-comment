import { Comments } from './components/Comments'
import './app.css'

export function App() {
  return (
    <div class="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16">
            <div class="flex items-center">
              <h1 class="text-xl font-bold text-gray-900">Whisper Comment</h1>
            </div>
            <div class="text-sm text-gray-500">
              现代化评论系统演示
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main class="py-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 文章内容示例 */}
          <div class="max-w-4xl mx-auto mb-12">
            <article class="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <header class="mb-6">
                <h1 class="text-3xl font-bold text-gray-900 mb-2">
                  基于 Preact 的现代化评论组件
                </h1>
                <div class="flex items-center space-x-4 text-sm text-gray-600">
                  <span>2024年1月15日</span>
                  <span>•</span>
                  <span>技术分享</span>
                </div>
              </header>
              
              <div class="prose prose-lg max-w-none">
                <p class="text-gray-700 leading-relaxed mb-4">
                  这是一个使用 Preact、TwindCSS 和现代化设计理念构建的评论系统。
                  它具有以下特性：
                </p>
                
                <ul class="list-disc list-inside space-y-2 text-gray-700 mb-6">
                  <li>响应式设计，适配各种设备</li>
                  <li>支持评论和回复的树形结构</li>
                  <li>点赞和踩功能，带有流畅的动画效果</li>
                  <li>用户友好的交互体验</li>
                  <li>现代化的视觉设计</li>
                </ul>
                
                <p class="text-gray-700 leading-relaxed">
                  下方的评论区展示了完整的功能，您可以体验评论、回复、点赞等所有特性。
                  所有的数据都是 mock 的，刷新页面后会重置到初始状态。
                </p>
              </div>
            </article>
          </div>

          {/* 评论组件 */}
          <Comments 
            title="参与讨论" 
            className="mb-8"
          />
        </div>
      </main>

      {/* 页脚 */}
      <footer class="bg-white border-t border-gray-200 mt-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div class="text-center text-sm text-gray-500">
            <p>Whisper Comment - 现代化评论系统 © 2024</p>
            <p class="mt-1">基于 Preact + TwindCSS 构建</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
