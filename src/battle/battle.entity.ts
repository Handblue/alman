import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export type BattleStatus =
  | 'pending'       // Player 2 henüz kabul etmedi
  | 'p1_done'       // Player 1 bitti, Player 2 bekleniyor
  | 'completed'     // İkisi de bitti
  | 'declined'      // Reddedildi
  | 'expired';      // 72 saat içinde tamamlanmadı

export type BattleType = 'async' | 'realtime';

export interface BattleQuestion {
  word: string;
  correctAnswer: string;
  options: string[];
  wordId?: string;
}

export interface PlayerAnswers {
  answers: { questionIndex: number; answer: string; correct: boolean; timeMs: number }[];
  score: number;
  completedAt: string;
}

@Entity('battles')
export class Battle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  challengerId: string;

  @Column({ nullable: true })
  challengedId: string;

  @Column({ type: 'varchar', default: 'pending' })
  status: BattleStatus;

  @Column({ type: 'varchar', default: 'async' })
  type: BattleType;

  // 10 soruyu JSON olarak sakla
  @Column({ type: 'jsonb' })
  questions: BattleQuestion[];

  // Her oyuncunun cevapları
  @Column({ type: 'jsonb', nullable: true })
  player1Answers: PlayerAnswers | null;

  @Column({ type: 'jsonb', nullable: true })
  player2Answers: PlayerAnswers | null;

  @Column({ default: 0 })
  player1Score: number;

  @Column({ default: 0 })
  player2Score: number;

  @Column({ nullable: true })
  winnerId: string;

  // Async mod: 72 saat sonra sona erer
  @Column({ nullable: true })
  expiresAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'challengerId' })
  challenger: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'challengedId' })
  challenged: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
