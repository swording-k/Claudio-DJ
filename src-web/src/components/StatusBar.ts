import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('status-bar')
export class StatusBar extends LitElement {
  static styles = css`
    :host {
      display: block;
      text-align: center;
      padding: 1rem;
    }

    .status-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .status-light {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background-color: #3B82F6;
      transition: background-color 0.3s ease;
    }

    .status-light.idle {
      animation: breathe 2s ease-in-out infinite;
    }

    .status-light.playing {
      background-color: #22C55E;
    }

    .status-light.speaking {
      background-color: #F59E0B;
    }

    .status-light.listening {
      background-color: #3B82F6;
    }

    @keyframes breathe {
      0%, 100% {
        opacity: 0.3;
        transform: scale(0.8);
      }
      50% {
        opacity: 1;
        transform: scale(1);
      }
    }

    .status-text {
      font-size: 0.875rem;
      color: #E5E5E5;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .clock {
      font-size: 3rem;
      font-weight: 700;
      color: #E5E5E5;
      font-variant-numeric: tabular-nums;
      letter-spacing: 0.05em;
    }
  `;

  @property({ type: String }) status: 'idle' | 'playing' | 'speaking' | 'listening' = 'idle';
  @property({ type: String }) time = '';

  render() {
    const statusLabels = {
      idle: '待机',
      playing: '正在播放',
      speaking: 'Claudio播报中',
      listening: '正在聆听',
    };

    return html`
      <div class="status-container">
        <div class="status-indicator">
          <div class="status-light ${this.status}"></div>
          <span class="status-text">${statusLabels[this.status]}</span>
        </div>
        <div class="clock">${this.time}</div>
      </div>
    `;
  }
}