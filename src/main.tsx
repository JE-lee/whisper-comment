import { render } from 'preact'
import { install } from '@twind/core'
import config from './twind.config'
import { App } from './app.tsx'
import './index.css'

// 安装 TwindCSS
install(config)

render(<App />, document.getElementById('app')!)
