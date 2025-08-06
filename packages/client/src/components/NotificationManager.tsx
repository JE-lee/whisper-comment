import { Component } from 'preact';
import { getWebSocketService, WebSocketStatus } from '../services/websocket';
import type { NotificationMessage, WebSocketEventListener, WebSocketStatusType } from '../services/websocket';
import { pushNotificationService } from '../services/pushNotification';

/**
 * 通知项接口
 */
interface NotificationItem {
  id: string;
  type: 'new_comment' | 'comment_reply' | 'comment_approved' | 'comment_rejected';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: any;
}

/**
 * 通知管理器状态
 */
interface NotificationManagerState {
  notifications: NotificationItem[];
  wsStatus: WebSocketStatusType;
  isVisible: boolean;
  unreadCount: number;
}

/**
 * 通知管理器属性
 */
interface NotificationManagerProps {
  maxNotifications?: number;
  autoHideDelay?: number;
  showConnectionStatus?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

/**
 * 通知管理器组件
 * 负责显示实时通知和管理 WebSocket 连接状态
 */
export class NotificationManager extends Component<NotificationManagerProps, NotificationManagerState> {
  private wsService = getWebSocketService();
  private wsListener: WebSocketEventListener;
  private autoHideTimers: Map<string, number> = new Map();

  constructor(props: NotificationManagerProps) {
    super(props);
    
    this.state = {
      notifications: [],
      wsStatus: this.wsService.getStatus(),
      isVisible: false,
      unreadCount: 0
    };



    // WebSocket 事件监听器
    this.wsListener = {
      onStatusChange: (status: WebSocketStatusType) => {
        this.setState({ wsStatus: status });
      },
      onNotification: (notification: NotificationMessage) => {
        this.handleNotification(notification);
      },
      onError: (error: Error) => {
        this.addSystemNotification('连接错误', error.message, 'error');
      }
    };
  }

  componentDidMount() {
    // 注册 WebSocket 监听器
    this.wsService.addListener(this.wsListener);
    
    // 如果 WebSocket 未连接，尝试连接
    if (this.wsService.getStatus() === WebSocketStatus.DISCONNECTED) {
      this.wsService.connect();
    }
    
    // 初始化推送通知服务
    this.initializePushNotifications();
  }

  componentWillUnmount() {
    // 移除 WebSocket 监听器
    this.wsService.removeListener(this.wsListener);
    
    // 清理所有定时器
    this.autoHideTimers.forEach(timer => clearTimeout(timer));
    this.autoHideTimers.clear();
  }

  /**
   * 初始化推送通知服务
   */
  private initializePushNotifications = async () => {
    try {
      // 初始化推送通知服务
      await pushNotificationService.initialize();
      console.log('[NotificationManager] 推送通知服务已初始化');
    } catch (error) {
      console.error('[NotificationManager] 推送通知服务初始化失败:', error);
    }
  };

  /**
   * 处理收到的通知
   */
  private handleNotification = (notification: NotificationMessage) => {
    console.log('[NotificationManager] 收到通知:', {
      type: notification.type,
      data: notification.data,
      timestamp: notification.timestamp,
      targetUserToken: notification.targetUserToken
    });
    
    const { type, data } = notification;
    let title = '';
    let message = '';

    switch (type) {
      case 'new_comment':
        title = '新评论';
        message = `${data.authorNickname || '匿名用户'} 发表了新评论`;
        break;
      case 'comment_reply':
        title = '评论回复';
        message = `${data.authorNickname || '匿名用户'} 回复了您的评论`;
        break;
      case 'comment_approved':
        title = '评论已通过';
        message = '您的评论已通过审核';
        break;
      case 'comment_rejected':
        title = '评论被拒绝';
        message = '您的评论未通过审核';
        break;
      default:
        title = '通知';
        message = '收到新消息';
    }

    const notificationItem = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      title,
      message,
      timestamp: new Date(),
      read: false,
      data
    };
    
    console.log('[NotificationManager] 创建通知项:', notificationItem);
    
    this.addNotification(notificationItem);
  };

  /**
   * 添加通知
   */
  private addNotification = (notification: NotificationItem) => {
    const { maxNotifications = 5, autoHideDelay = 0 } = this.props;
    
    this.setState(prevState => {
      let notifications = [notification, ...prevState.notifications];
      
      // 限制通知数量
      if (notifications.length > maxNotifications) {
        notifications = notifications.slice(0, maxNotifications);
      }
      
      return {
        notifications,
        unreadCount: prevState.unreadCount + 1,
        isVisible: true
      };
    });

    // 只有当autoHideDelay大于0时才设置自动隐藏通知
    if (autoHideDelay > 0) {
      const timer = window.setTimeout(() => {
        this.removeNotification(notification.id);
      }, autoHideDelay);
      
      this.autoHideTimers.set(notification.id, timer);
    }
  };

  /**
   * 添加系统通知
   */
  private addSystemNotification = (title: string, message: string, _type: 'info' | 'error' | 'warning' = 'info') => {
    this.addNotification({
      id: `system-${Date.now()}`,
      type: 'new_comment', // 使用默认类型
      title,
      message,
      timestamp: new Date(),
      read: false
    });
  };

  /**
   * 移除通知
   */
  private removeNotification = (id: string) => {
    // 清理定时器
    const timer = this.autoHideTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.autoHideTimers.delete(id);
    }

    this.setState(prevState => {
      // 找到要移除的通知
      const notificationToRemove = prevState.notifications.find(n => n.id === id);
      const isUnread = notificationToRemove && !notificationToRemove.read;
      
      return {
        notifications: prevState.notifications.filter(n => n.id !== id),
        // 如果移除的是未读通知，减少未读计数
        unreadCount: isUnread ? Math.max(0, prevState.unreadCount - 1) : prevState.unreadCount
      };
    });
  };

  /**
   * 标记通知为已读
   */
  private markAsRead = (id: string) => {
    this.setState(prevState => ({
      notifications: prevState.notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, prevState.unreadCount - 1)
    }));
  };

  /**
   * 清除所有通知
   */
  private clearAll = () => {
    // 清理所有定时器
    this.autoHideTimers.forEach(timer => clearTimeout(timer));
    this.autoHideTimers.clear();
    
    this.setState({
      notifications: [],
      unreadCount: 0,
      isVisible: false
    });
  };

  /**
   * 切换通知面板显示状态
   */
  private toggleVisibility = () => {
    this.setState(prevState => ({
      isVisible: !prevState.isVisible
    }));
  };

  /**
   * 获取连接状态显示文本
   */
  private getStatusText = (): string => {
    switch (this.state.wsStatus) {
      case WebSocketStatus.CONNECTED:
      case WebSocketStatus.AUTHENTICATED:
        return '已连接';
      case WebSocketStatus.CONNECTING:
        return '连接中...';
      case WebSocketStatus.RECONNECTING:
        return '重连中...';
      case WebSocketStatus.ERROR:
        return '连接错误';
      case WebSocketStatus.DISCONNECTED:
      default:
        return '未连接';
    }
  };

  /**
   * 获取连接状态样式
   */
  private getStatusColor = (): string => {
    switch (this.state.wsStatus) {
      case WebSocketStatus.CONNECTED:
      case WebSocketStatus.AUTHENTICATED:
        return 'text-green-500';
      case WebSocketStatus.CONNECTING:
      case WebSocketStatus.RECONNECTING:
        return 'text-yellow-500';
      case WebSocketStatus.ERROR:
        return 'text-red-500';
      case WebSocketStatus.DISCONNECTED:
      default:
        return 'text-gray-500';
    }
  };

  /**
   * 获取位置样式
   */
  private getPositionClass = (): string => {
    const { position = 'top-right' } = this.props;
    
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-right':
      default:
        return 'top-4 right-4';
    }
  };

  render() {
    const { showConnectionStatus = true } = this.props;
    const { notifications, wsStatus, isVisible, unreadCount } = this.state;

    return (
      <div className={`fixed ${this.getPositionClass()} z-50 max-w-sm w-full`}>
        {/* 通知按钮 */}
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={this.toggleVisibility}
            className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 shadow-lg hover:shadow-xl transition-shadow"
            title="通知"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM11 19H6a2 2 0 01-2-2V7a2 2 0 012-2h5m5 0v5" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          
          {/* 连接状态指示器 */}
          {showConnectionStatus && (
            <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-xs">
              <div className={`w-2 h-2 rounded-full ${
                wsStatus === WebSocketStatus.CONNECTED || wsStatus === WebSocketStatus.AUTHENTICATED
                  ? 'bg-green-500'
                  : wsStatus === WebSocketStatus.CONNECTING || wsStatus === WebSocketStatus.RECONNECTING
                  ? 'bg-yellow-500 animate-pulse'
                  : 'bg-red-500'
              }`} />
              <span className={this.getStatusColor()}>
                {this.getStatusText()}
              </span>
            </div>
          )}
        </div>

        {/* 通知列表 */}
        {isVisible && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-96 overflow-hidden">
            {/* 头部 */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">通知</h3>
              {notifications.length > 0 && (
                <button
                  onClick={this.clearAll}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  清除全部
                </button>
              )}
            </div>
            
            {/* 通知内容 */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                  暂无通知
                </div>
              ) : (
                notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {notification.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {!notification.read && (
                          <button
                            onClick={() => this.markAsRead(notification.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                            title="标记为已读"
                          >
                            ✓
                          </button>
                        )}
                        <button
                          onClick={() => this.removeNotification(notification.id)}
                          className="text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                          title="删除"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default NotificationManager;