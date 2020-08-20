import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('guild_settings')
export class GuildSettings {
	@PrimaryColumn({ type: 'varchar', length: 255 })
	guild!: string;

	@Column({ type: 'text', default: '{}' })
	settings: string;
}
