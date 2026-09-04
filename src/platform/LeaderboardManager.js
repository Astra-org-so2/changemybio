/** Phase 2: UI. Сейчас — только отправка очков (не чаще раза в 60с, лимит SDK 1/с). */
export class LeaderboardManager {
  constructor(platform) { this.platform = platform; this.last = {}; }
  async submit(name, score) {
    const t = Date.now(); if (t - (this.last[name] || 0) < 60_000) return;
    this.last[name] = t;
    try { await this.platform.setLeaderboardScore(name, score); } catch (e) { /* не авторизован / нет борда */ }
  }
}
