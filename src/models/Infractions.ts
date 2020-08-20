import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('infractions')
export class Infractions {
    @PrimaryColumn({ type: 'varchar', length: 255 })
    user!: string;

    @Column({ type: 'text', default: '{}' })
    infractions: string;
}