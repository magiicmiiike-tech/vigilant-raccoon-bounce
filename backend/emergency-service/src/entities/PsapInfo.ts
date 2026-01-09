import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../shared/models/BaseEntity';

@Entity('psap_info')
export class PsapInfo extends BaseEntity {
  @Column({ unique: true })
  psapId: string;

  @Column()
  name: string;

  @Column()
  region: string;

  @Column()
  coverageArea: string; // GeoJSON or similar description
}
