import { IdentityService } from './identity';

/**
 * WebSocket 消息类型定义
 */
export interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp?: string;
  connectionId?: string;
  userToken?: string;
}

/**
 * 通知消息类型
 */
export interface NotificationMessage {
  type: 'new_comment' | 'comment_reply' | 'comment_approved' | 'comment_rejected';
  targetUserToken?: string;
  data: {
    commentId: string;
    siteId: string;
    pageIdentifier: string;
    content?: string;
    authorNickname?: string;
    parentId?: string;
  };
  timestamp: string;
}

/**
 * WebSocket 连接状态
 */
export const WebSocketStatus = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  AUTHENTICATED: 'authenticated',
  ERROR: 'error',
  RECONNECTING: 'reconnecting'
} as const;

export type WebSocketStatusType = typeof WebSocketStatus[keyof typeof WebSocketStatus];

/**
 * WebSocket 事件监听器类型
 */
export type WebSocketEventListener = {
  onStatusChange?: (status: WebSocketStatusType) => void;
  onNotification?: (notification: NotificationMessage) => void;
  onError?: (error: Error) => void;
  onMessage?: (message: WebSocketMessage) => void;
};

/**
 * WebSocket 客户端服务
 */
export class WebSocketService {
  private ws: WebSocket | null = null;
  private status: WebSocketStatusType = WebSocketStatus.DISCONNECTED;
  private listeners: WebSocketEventListener[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // 初始重连延迟 1 秒
  private heartbeatInterval: number | null = null;
  private connectionId: string | null = null;
  private userToken: string | null = null;
  
  // 配置
  private readonly wsUrl: string;
  private readonly heartbeatIntervalMs = 30000; // 30秒心跳
  
  constructor(wsUrl: string = 'ws://localhost:3000/ws') {
    this.wsUrl = wsUrl;
    this.userToken = IdentityService.getUserToken();
  }

  /**
   * 连接 WebSocket
   */
  async connect(): Promise<void> {
    if (this.status === WebSocketStatus.CONNECTED || this.status === WebSocketStatus.CONNECTING) {
      return;
    }

    this.setStatus(WebSocketStatus.CONNECTING);
    
    try {
      this.ws = new WebSocket(this.wsUrl);
      this.setupEventHandlers();
    } catch (_error) {
      this.setStatus(WebSocketStatus.ERROR);
      this.handleReconnect();
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.reconnectAttempts = this.maxReconnectAttempts; // 阻止自动重连
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.setStatus(WebSocketStatus.DISCONNECTED);
  }

  /**
   * 发送消息
   */
  send(message: WebSocketMessage): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        return true;
      } catch (_error) {
        return false;
      }
    }
    
    return false;
  }

  /**
   * 添加事件监听器
   */
  addListener(listener: WebSocketEventListener): void {
    this.listeners.push(listener);
  }

  /**
   * 移除事件监听器
   */
  removeListener(listener: WebSocketEventListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * 获取连接状态
   */
  getStatus(): WebSocketStatusType {
    return this.status;
  }

  /**
   * 获取连接ID
   */
  getConnectionId(): string | null {
    return this.connectionId;
  }

  /**
   * 设置状态并通知监听器
   */
  private setStatus(status: WebSocketStatusType): void {
    if (this.status !== status) {
      this.status = status;
      this.listeners.forEach(listener => {
        listener.onStatusChange?.(status);
      });
    }
  }

  /**
   * 设置 WebSocket 事件处理器
   */
  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.setStatus(WebSocketStatus.CONNECTED);
      this.reconnectAttempts = 0;
      this.authenticate();
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (_error) {
        // Ignore parse errors
      }
    };

    this.ws.onclose = () => {
      this.setStatus(WebSocketStatus.DISCONNECTED);
      
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }
      
      // 如果不是主动断开，尝试重连
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.handleReconnect();
      }
    };

    this.ws.onerror = () => {
      this.setStatus(WebSocketStatus.ERROR);
      this.listeners.forEach(listener => {
        listener.onError?.(new Error('WebSocket connection error'));
      });
    };
  }

  /**
   * 处理收到的消息
   */
  private handleMessage(message: WebSocketMessage): void {
    
    switch (message.type) {
      case 'auth_success':
        this.connectionId = message.connectionId || null;
        this.setStatus(WebSocketStatus.AUTHENTICATED);
        this.startHeartbeat();
        console.log('[WebSocketService] 认证成功:', {
          connectionId: this.connectionId,
          userToken: this.userToken
        });
        break;
        
      case 'pong':
        // 心跳响应，无需特殊处理
        break;
        
      case 'new_comment':
      case 'comment_reply':
      case 'comment_approved':
      case 'comment_rejected':

        this.listeners.forEach(listener => {
          listener.onNotification?.(message as NotificationMessage);
        });
        break;
        
      case 'error':
        console.error('[WebSocketService] 收到错误消息:', message.data);
        this.listeners.forEach(listener => {
          listener.onError?.(new Error(message.data?.message || 'Server error'));
        });
        break;
        
      default:
        console.log('[WebSocketService] 收到未知类型消息:', message.type);
        this.listeners.forEach(listener => {
          listener.onMessage?.(message);
        });
    }
  }

  /**
   * 发送认证消息
   */
  private authenticate(): void {
    if (!this.userToken) {
      this.userToken = IdentityService.init();
    }
    

    
    this.send({
      type: 'auth',
      userToken: this.userToken,
    });
  }

  /**
   * 开始心跳检测
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.heartbeatInterval = window.setInterval(() => {
      this.send({ type: 'ping' });
    }, this.heartbeatIntervalMs);
  }

  /**
   * 处理重连逻辑
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }
    
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // 指数退避
    
    this.setStatus(WebSocketStatus.RECONNECTING);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }
}

// 全局 WebSocket 服务实例
let globalWebSocketService: WebSocketService | null = null;

/**
 * 获取全局 WebSocket 服务实例
 */
export function getWebSocketService(wsUrl?: string): WebSocketService {
  if (!globalWebSocketService) {
    globalWebSocketService = new WebSocketService(wsUrl);
  }
  return globalWebSocketService;
}

/**
 * 初始化 WebSocket 连接
 */
export function initWebSocket(wsUrl?: string): WebSocketService {
  const service = getWebSocketService(wsUrl);
  service.connect();
  return service;
}