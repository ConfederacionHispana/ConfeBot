import { Awaitable, Piece } from '@sapphire/framework';

import type { CronJob } from 'cron';

export abstract class Task extends Piece {
  private _cron: CronJob | null = this.create();

  public abstract create(...args: readonly unknown[]): CronJob;
  public abstract run(...args: readonly unknown[]): Awaitable<void>;

  public onLoad() {
    if (!this._cron) this._cron = this.create();
    this._cron.start();
    this._cron.fireOnTick();
    return super.onLoad();
  }

  public onUnload() {
    if (this._cron) {
      this._cron.stop();
      this._cron = null;
    }
  }
}
