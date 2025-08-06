import { v4 as uuidv4 } from 'uuid';

/**
 * 身份管理服务
 * 负责生成和管理用户的匿名身份标识
 */
export class IdentityService {
  private static readonly STORAGE_KEY = 'whisper_user_token';
  private static readonly NICKNAME_STORAGE_KEY = 'whisper_user_nickname';
  private static userToken: string | null = null;
  private static userNickname: string | null = null;

  /**
   * 初始化身份服务
   * 从 localStorage 获取或生成新的用户token
   */
  static init(): string {
    if (this.userToken) {
      return this.userToken;
    }

    try {
      // 尝试从 localStorage 获取现有token
      const storedToken = localStorage.getItem(this.STORAGE_KEY);
      const storedNickname = localStorage.getItem(this.NICKNAME_STORAGE_KEY);
      
      if (storedToken && this.isValidToken(storedToken)) {
        this.userToken = storedToken;
        this.userNickname = storedNickname;
      } else {
        // 生成新的token
        this.userToken = this.generateToken();
        localStorage.setItem(this.STORAGE_KEY, this.userToken);
      }
    } catch (_error) {
      // 如果无法访问 localStorage，使用会话级别的token
      this.userToken = this.generateToken();
    }

    return this.userToken;
  }

  /**
   * 获取当前用户token
   */
  static getUserToken(): string | null {
    return this.userToken;
  }

  /**
   * 获取当前用户昵称
   */
  static getUserNickname(): string | null {
    return this.userNickname;
  }

  /**
   * 设置用户昵称
   */
  static setUserNickname(nickname: string): void {
    this.userNickname = nickname;
    
    try {
      localStorage.setItem(this.NICKNAME_STORAGE_KEY, nickname);
    } catch (_error) {
      // Ignore localStorage errors
    }
  }

  /**
   * 重新生成用户token
   * 用于重置用户身份
   */
  static regenerateToken(): string {
    this.userToken = this.generateToken();
    
    try {
      localStorage.setItem(this.STORAGE_KEY, this.userToken);
    } catch (_error) {
      // Ignore localStorage errors
    }
    return this.userToken;
  }

  /**
   * 清除用户身份
   */
  static clearIdentity(): void {
    this.userToken = null;
    this.userNickname = null;
    
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.NICKNAME_STORAGE_KEY);
    } catch (_error) {
      // Ignore localStorage errors
    }
  }

  /**
   * 生成新的用户token
   */
  private static generateToken(): string {
    // 使用 UUID v4 生成唯一标识符
    const uuid = uuidv4();
    // 添加时间戳前缀，便于调试和分析
    const timestamp = Date.now().toString(36);
    return `wc_${timestamp}_${uuid}`;
  }

  /**
   * 验证token格式是否有效
   */
  private static isValidToken(token: string): boolean {
    // 检查token格式：wc_[timestamp]_[uuid]
    const tokenPattern = /^wc_[a-z0-9]+_[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
    return tokenPattern.test(token);
  }

  /**
   * 获取token的创建时间（如果可解析）
   */
  static getTokenCreatedAt(token?: string): Date | null {
    const targetToken = token || this.userToken;
    if (!targetToken) return null;

    try {
      const parts = targetToken.split('_');
      if (parts.length >= 2) {
        const timestamp = parseInt(parts[1], 36);
        return new Date(timestamp);
      }
    } catch (_error) {
      // Ignore parse errors
    }
    
    return null;
  }

  /**
   * 检查token是否过期（可选功能）
   * @param maxAgeMs 最大年龄（毫秒），默认30天
   */
  static isTokenExpired(maxAgeMs: number = 30 * 24 * 60 * 60 * 1000): boolean {
    const createdAt = this.getTokenCreatedAt();
    if (!createdAt) return true;
    
    return Date.now() - createdAt.getTime() > maxAgeMs;
  }

  /**
   * 获取用户身份信息摘要
   */
  static getIdentitySummary(): {
    hasToken: boolean;
    token?: string;
    nickname?: string;
    createdAt?: Date;
    isExpired?: boolean;
  } {
    const token = this.getUserToken();
    const nickname = this.getUserNickname();
    const createdAt = this.getTokenCreatedAt();
    
    return {
      hasToken: !!token,
      token: token || undefined,
      nickname: nickname || undefined,
      createdAt: createdAt || undefined,
      isExpired: token ? this.isTokenExpired() : undefined,
    };
  }
}

// 自动初始化（在模块加载时）
if (typeof window !== 'undefined') {
  // 确保在浏览器环境中才初始化
  IdentityService.init();
}