import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('channel_settings')
export class ChannelSettings {
	@PrimaryColumn({ type: 'varchar', length: 255 })
	channel!: string;

	@Column({ type: 'text', default: '{}' })
	settings: string;
}
