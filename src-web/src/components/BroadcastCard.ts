import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('broadcast-card')
export class BroadcastCard extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .card {
      padding: 1rem;
      border-radius: 8px;
      background: #121218;
      border-left: 3px solid;
    }

    .card.broadcast {
      border-color: #F59E0B;
    }

    .card.user {
      border-color: #3B82F6;
    }

    .card.ai {
      border-color: #22C55E;
    }

    .text {
      font-size: 0.875rem;
      color: #E5E5E5;
      line-height: 1.5;
    }
  `;

  @property({ type: String }) text = '';
  @property({ type: String }) type: 'broadcast' | 'user' | 'ai' = 'broadcast';

  render() {
    return html`
      <div class="card ${this.type}">
        <div class="text">${this.text}</div>
      </div>
    `;
  }
}