import dns from 'dns';

export class IpService {
  async isBlacklisted(ip: string): Promise<boolean> {
    return new Promise((resolve) => {
      const reversedIp = ip.split('.').reverse().join('.');
      const lookup = `${reversedIp}.zen.spamhaus.org`;

      dns.lookup(lookup, (err, address) => {
        if (err && err.code === 'ENOTFOUND') {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }
}

export const ipService = new IpService();