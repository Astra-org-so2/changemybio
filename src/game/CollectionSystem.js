import { CHARACTERS, CHARACTER_MAP } from '../config/characters.js';
import { collectionProgress } from './Economy.js';

export class CollectionSystem {
  constructor(gm) { this.gm = gm; this._lastPct = -1; }
  list() { const s = this.gm.state; return CHARACTERS.filter((c) => c.unlockCondition.type !== 'event' || s.characters[c.id]).map((c) => ({ ...c, owned: !!s.characters[c.id], level: s.characters[c.id] || 0 })); }
  progress() { return collectionProgress(this.gm.state); }
  setActive(id) { if (this.gm.state.characters[id] && CHARACTER_MAP[id]) { this.gm.state.activeCharacter = id; this.gm.emitState(); } }
  /** трекинг вех коллекции */
  checkMilestones() {
    const p = this.progress();
    const bucket = Math.floor(p.pct * 4) / 4;
    if (bucket > this._lastPct) { this._lastPct = bucket; if (bucket > 0) this.gm.analytics.track('collection_progress', { pct: bucket, owned: p.owned, total: p.total }); }
  }
}
