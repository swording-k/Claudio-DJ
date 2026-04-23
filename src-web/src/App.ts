import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import './components/StatusBar';
import './components/Player';
import './components/Controls';
import './components/BroadcastCard';

@customElement('app-root')
export class App extends LitElement {
  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      background-color: #08080C;
      color: #F59E0B;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 2rem;
      gap: 2rem;
    }

    .title {
      font-size: 2rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin: 0;
      color: #E5E5E5;
    }

    .section {
      width: 100%;
      max-width: 400px;
    }
  `;

  @state() private currentTime = '';
  @state() private status: 'idle' | 'playing' | 'speaking' | 'listening' = 'idle';
  @state() private isPlaying = false;
  @state() private songName = '等待播放';
  @state() private artist = '---';
  @state() private progress = 0;
  @state() private messages: Array<{ text: string; type: 'broadcast' | 'user' | 'ai' }> = [];

  private clockInterval: number | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.updateClock();
    this.clockInterval = window.setInterval(() => this.updateClock(), 1000);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
  }

  private updateClock() {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  private handlePlayPause() {
    this.isPlaying = !this.isPlaying;
    this.status = this.isPlaying ? 'playing' : 'idle';
  }

  private handlePrev() {
    this.progress = Math.max(0, this.progress - 10);
  }

  private handleNext() {
    this.progress = Math.min(100, this.progress + 10);
  }

  render() {
    return html`
      <div class="container">
        <h1 class="title">Claudio DJ</h1>

        <div class="section">
          <status-bar .status=${this.status} .time=${this.currentTime}></status-bar>
        </div>

        <div class="section">
          <player-component
            .isPlaying=${this.isPlaying}
            .songName=${this.songName}
            .artist=${this.artist}
            .progress=${this.progress}
          ></player-component>
        </div>

        <div class="section">
          <controls-component
            @play-pause=${this.handlePlayPause}
            @prev=${this.handlePrev}
            @next=${this.handleNext}
          ></controls-component>
        </div>

        <div class="section" style="display: flex; flex-direction: column; gap: 0.5rem;">
          ${this.messages.map(msg => html`
            <broadcast-card .text=${msg.text} .type=${msg.type}></broadcast-card>
          `)}
        </div>
      </div>
    `;
  }
}