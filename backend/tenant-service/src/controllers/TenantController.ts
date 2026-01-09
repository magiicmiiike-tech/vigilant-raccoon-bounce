import { Request, Response } from 'express';
import { Tenant } from '../models/Tenant';
import { Result } from '../../../shared/utils/Result';

export class TenantController {
  static async create(req: Request, res: Response) {
    try {
      const { name, slug, contactEmail } = req.body;
      
      const existing = await Tenant.findOne({ where: [{ slug }, { name }] });
      if (existing) {
        return res.status(400).json(Result.fail('Tenant already exists'));
      }

      const tenant = Tenant.create({ name, slug, contactEmail });
      await tenant.save();
      
      return res.status(201).json(Result.ok(tenant));
    } catch (error) {
      return res.status(500).json(Result.fail('Internal server error'));
    }
  }

  static async getBySlug(req: Request, res: Response) {
    const tenant = await Tenant.findOne({ where: { slug: req.params.slug } });
    if (!tenant) return res.status(404).json(Result.fail('Not found'));
    return res.json(Result.ok(tenant));
  }
}
