import { PrismaClient, Site } from '@prisma/client';

export class SiteRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * 根据 ID 获取站点
   */
  async findById(siteId: string): Promise<Site | null> {
    return this.prisma.site.findUnique({
      where: { siteId },
    });
  }

  /**
   * 根据域名获取站点
   */
  async findByDomain(domain: string): Promise<Site | null> {
    return this.prisma.site.findUnique({
      where: { domain },
    });
  }

  /**
   * 根据 API Key 获取站点
   */
  async findByApiKey(apiKey: string): Promise<Site | null> {
    return this.prisma.site.findUnique({
      where: { apiKey },
    });
  }

  /**
   * 创建站点
   */
  async create(data: {
    siteId: string;
    ownerId: string;
    domain: string;
    apiKey: string;
    settings?: any;
  }): Promise<Site> {
    return this.prisma.site.create({
      data,
    });
  }

  /**
   * 更新站点
   */
  async update(siteId: string, data: {
    ownerId?: string;
    domain?: string;
    apiKey?: string;
    settings?: any;
  }): Promise<Site> {
    return this.prisma.site.update({
      where: { siteId },
      data,
    });
  }

  /**
   * 删除站点
   */
  async delete(siteId: string): Promise<Site> {
    return this.prisma.site.delete({
      where: { siteId },
    });
  }

  /**
   * 获取或创建站点（如果不存在则创建默认站点）
   */
  async getOrCreateDefault(siteId: string): Promise<Site> {
    // 首先尝试查找现有站点
    let site = await this.findById(siteId);
    
    if (!site) {
      // 如果站点不存在，创建一个默认站点
      // 使用siteId作为域名的一部分，确保唯一性
      const domain = `site-${siteId}.localhost`;
      site = await this.create({
        siteId,
        ownerId: '00000000-0000-0000-0000-000000000000', // 默认所有者ID
        domain: domain, // 使用动态域名
        apiKey: `default-api-key-${siteId}`, // 生成默认API Key
        settings: {
          theme: 'default',
          moderation: 'auto',
          notifications: true,
        },
      });
    }
    
    return site;
  }
} 