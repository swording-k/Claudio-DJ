import { LitElement, html, css } from 'lit';

export class PlayerComponent extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 1.5rem;
      background: #121218;
      border-radius: 12px;
    }
    .player-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .visualizer {
      display: flex;
      align-items: flex-end;
      justify-content: center;
      gap: 4px;
      height: 60px;
      padding: 0.5rem;
    }
    .bar {
      width: 8px;
      background: linear-gradient(to top, #F59E0B, #FBBF24);
      border-radius: 2px;
      transition: height 0.1s ease;
    }
    .song-info {
      text-align: center;
    }
    .song-name {
      font-size: 1.25rem;
      font-weight: 600;
      color: #E5E5E5;
      margin-bottom: 0.25rem;
    }
    .artist {
      font-size: 0.875rem;
      color: #92400E;
    }
    .progress-bar {
      height: 4px;
      background: #1a1a2e;
      border-radius: 2px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(to right, #F59E0B, #FBBF24);
      border-radius: 2px;
      transition: width 0.3s ease;
    }
  `;

  isPlaying = false;
  songName = '';
  artist = '';
  progress = 0;

  static properties = {
    isPlaying: { type: Boolean },
    songName: { type: String },
    artist: { type: String },
    progress: { type: Number },
  };

  private bars: number[] = Array(20).fill(0);
  private animationFrame: number | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.startAnimation();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  private startAnimation() {
    const animate = () => {
      if (this.isPlaying) {
        this.bars = this.bars.map(() => Math.random() * 50 + 10);
      } else {
        this.bars = this.bars.map((_, i) => (i % 4 === 0 ? 20 : 10));
      }
      this.animationFrame = requestAnimationFrame(animate);
    };
    this.animationFrame = requestAnimationFrame(animate);
  }

  render() {
    return html`
      <div class="player-container">
        <div class="visualizer">
          ${this.bars.map((height) => html`<div class="bar" style="height: ${height}%"></div>`)}
        </div>
        <div class="song-info">
          <div class="song-name">${this.songName || 'No Track'}</div>
          <div class="artist">${this.artist || 'Unknown Artist'}</div>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${this.progress}%"></div>
        </div>
      </div>
    `;
  }
}

customElements.define('player-component', PlayerComponent);
