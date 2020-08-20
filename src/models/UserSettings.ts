import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('user_settings')
export class UserSettings {
    @PrimaryColumn({ type: 'varchar', length: 255 })
    user!: string;

    @Column({ type: 'text', default: '{}' })
    settings: string;
}