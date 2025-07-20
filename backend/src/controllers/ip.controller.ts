import { Request, Response } from 'express';
import { ipService } from '../services/ip.service';

export class IpController {
  async checkIp(req: Request, res: Response) {
    const { ip } = req.params;
    if (!ip) {
      return res.status(400).json({ message: 'IP address is required' });
    }

    const isBlacklisted = await ipService.isBlacklisted(ip);
    res.json({ ip, isBlacklisted });
  }
}

export const ipController = new IpController();