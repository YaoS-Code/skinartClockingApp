const ipaddr = require('ipaddr.js');

/**
 * IP白名单中间件
 * 支持单个IP、IP范围（CIDR格式）和IP段配置
 */
class IPWhitelist {
  constructor() {
    this.allowedIPs = [];
    this.allowedRanges = [];
    this.enabled = process.env.IP_WHITELIST_ENABLED === 'true';
    this.localNetworkOnly = process.env.IP_WHITELIST_LOCAL_ONLY === 'true';
    
    this.loadConfig();
  }

  /**
   * 从环境变量加载IP白名单配置
   * 格式: IP_WHITELIST="192.168.1.1,192.168.1.0/24,10.0.0.0-10.0.0.255"
   */
  loadConfig() {
    const whitelistConfig = process.env.IP_WHITELIST || '';
    
    if (!whitelistConfig || !this.enabled) {
      console.log('IP白名单未启用或未配置');
      return;
    }

    const entries = whitelistConfig.split(',').map(entry => entry.trim()).filter(entry => entry);
    
    entries.forEach(entry => {
      // CIDR格式: 192.168.1.0/24
      if (entry.includes('/')) {
        try {
          const [ip, prefixLength] = entry.split('/');
          const prefix = parseInt(prefixLength);
          
          // 验证前缀长度有效性
          const addr = ipaddr.process(ip);
          const maxPrefix = addr.kind() === 'ipv4' ? 32 : 128;
          
          if (prefix < 0 || prefix > maxPrefix) {
            throw new Error(`前缀长度必须在0-${maxPrefix}之间`);
          }
          
          this.allowedRanges.push({
            type: 'cidr',
            ip: ip,
            prefix: prefix,
            network: addr.toString()
          });
          console.log(`添加CIDR范围: ${entry}`);
        } catch (error) {
          console.error(`无效的CIDR格式: ${entry}`, error.message);
        }
      }
      // IP段格式: 192.168.1.0-192.168.1.255
      else if (entry.includes('-')) {
        try {
          const [startIP, endIP] = entry.split('-').map(ip => ip.trim());
          const start = ipaddr.process(startIP);
          const end = ipaddr.process(endIP);
          
          this.allowedRanges.push({
            type: 'range',
            start: start.toString(),
            end: end.toString()
          });
          console.log(`添加IP段: ${entry}`);
        } catch (error) {
          console.error(`无效的IP段格式: ${entry}`, error.message);
        }
      }
      // 单个IP
      else {
        try {
          const addr = ipaddr.process(entry);
          this.allowedIPs.push(addr.toString());
          console.log(`添加单个IP: ${entry}`);
        } catch (error) {
          console.error(`无效的IP地址: ${entry}`, error.message);
        }
      }
    });

    console.log(`IP白名单配置完成: ${this.allowedIPs.length}个单个IP, ${this.allowedRanges.length}个IP范围`);
  }

  /**
   * 检查IP是否在CIDR范围内
   */
  isInCIDR(clientIP, cidrEntry) {
    try {
      const clientAddr = ipaddr.process(clientIP);
      const networkAddr = ipaddr.process(cidrEntry.ip);
      
      // 使用ipaddr.js的CIDR匹配功能
      const cidrString = `${cidrEntry.ip}/${cidrEntry.prefix}`;
      
      // IPv4 CIDR匹配
      if (clientAddr.kind() === 'ipv4' && networkAddr.kind() === 'ipv4') {
        const subnet = ipaddr.IPv4.parseCIDR(cidrString);
        return clientAddr.match(subnet);
      }
      
      // IPv6 CIDR匹配
      if (clientAddr.kind() === 'ipv6' && networkAddr.kind() === 'ipv6') {
        const subnet = ipaddr.IPv6.parseCIDR(cidrString);
        return clientAddr.match(subnet);
      }
      
      return false;
    } catch (error) {
      console.error(`CIDR检查错误: ${error.message}`);
      return false;
    }
  }

  /**
   * 检查IP是否在IP段范围内
   */
  isInRange(clientIP, rangeEntry) {
    try {
      const clientAddr = ipaddr.process(clientIP);
      const startAddr = ipaddr.process(rangeEntry.start);
      const endAddr = ipaddr.process(rangeEntry.end);
      
      // 比较IP地址（转换为数字进行比较）
      const clientNum = this.ipToNumber(clientAddr);
      const startNum = this.ipToNumber(startAddr);
      const endNum = this.ipToNumber(endAddr);
      
      return clientNum >= startNum && clientNum <= endNum;
    } catch (error) {
      return false;
    }
  }

  /**
   * 将IP地址转换为数字（用于比较）
   */
  ipToNumber(addr) {
    const bytes = addr.bytes();
    return bytes.reduce((acc, byte, index) => {
      return acc + (byte * Math.pow(256, bytes.length - 1 - index));
    }, 0);
  }

  /**
   * 检查IP是否为私有IP（局域网IP）
   */
  isPrivateIP(ip) {
    try {
      const addr = ipaddr.process(ip);
      const range = addr.range();
      // 私有IP范围包括: private, linkLocal, loopback
      return range === 'private' || range === 'linkLocal' || range === 'loopback';
    } catch (error) {
      return false;
    }
  }

  /**
   * 检查IP是否在白名单中
   */
  isAllowed(clientIP) {
    if (!this.enabled) {
      return true; // 如果未启用，允许所有IP
    }

    // 如果启用了"仅允许局域网"模式
    if (this.localNetworkOnly) {
      if (!this.isPrivateIP(clientIP)) {
        return false; // 拒绝公网IP
      }
      // 如果是私有IP，继续检查是否在白名单中（如果配置了白名单）
      // 如果没有配置具体白名单，则允许所有私有IP
      if (this.allowedIPs.length === 0 && this.allowedRanges.length === 0) {
        return true; // 允许所有局域网IP
      }
    }

    // 检查单个IP
    if (this.allowedIPs.includes(clientIP)) {
      return true;
    }

    // 检查CIDR范围和IP段
    for (const range of this.allowedRanges) {
      if (range.type === 'cidr' && this.isInCIDR(clientIP, range)) {
        return true;
      }
      if (range.type === 'range' && this.isInRange(clientIP, range)) {
        return true;
      }
    }

    return false;
  }

  /**
   * 获取客户端真实IP地址
   * 考虑代理和负载均衡器的情况
   */
  getClientIP(req) {
    // 检查各种可能的IP头
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      // X-Forwarded-For可能包含多个IP，取第一个
      const ips = forwardedFor.split(',').map(ip => ip.trim());
      return ips[0];
    }

    const realIP = req.headers['x-real-ip'];
    if (realIP) {
      return realIP;
    }

    const cfConnectingIP = req.headers['cf-connecting-ip']; // Cloudflare
    if (cfConnectingIP) {
      return cfConnectingIP;
    }

    // 最后使用连接IP
    return req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  }

  /**
   * Express中间件函数
   */
  middleware() {
    return (req, res, next) => {
      // 如果未启用IP白名单，直接通过
      if (!this.enabled) {
        return next();
      }

      const clientIP = this.getClientIP(req);

      // 如果启用了"仅允许局域网"模式，且没有配置具体白名单，则允许所有私有IP
      if (this.localNetworkOnly && this.allowedIPs.length === 0 && this.allowedRanges.length === 0) {
        // 检查是否为私有IP
        if (!this.isPrivateIP(clientIP)) {
          console.warn(`拒绝公网IP访问（仅允许局域网）: ${clientIP} from ${req.path}`);
          return res.status(403).json({
            error: 'Access denied',
            message: 'This service is only accessible from local network',
            ip: clientIP
          });
        }
        // 私有IP允许访问
        return next();
      }

      // 如果没有配置任何IP且未启用"仅允许局域网"模式，拒绝所有访问
      if (!this.localNetworkOnly && this.allowedIPs.length === 0 && this.allowedRanges.length === 0) {
        console.warn(`IP白名单已启用但未配置任何IP，拒绝访问: ${clientIP}`);
        return res.status(403).json({
          error: 'Access denied',
          message: 'Your IP address is not authorized to access this service'
        });
      }

      // 检查IP是否在白名单中
      if (!this.isAllowed(clientIP)) {
        console.warn(`拒绝未授权IP访问: ${clientIP} from ${req.path}`);
        return res.status(403).json({
          error: 'Access denied',
          message: 'Your IP address is not authorized to access this service',
          ip: clientIP
        });
      }

      // IP在白名单中，继续处理请求
      next();
    };
  }
}

// 创建单例实例
const ipWhitelist = new IPWhitelist();

module.exports = ipWhitelist.middleware();
module.exports.IPWhitelist = IPWhitelist; // 导出类用于测试

