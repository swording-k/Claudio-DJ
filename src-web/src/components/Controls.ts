import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('controls-component')
export class ControlsComponent extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 1.5rem;
    }

    .controls-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1.5rem;
    }

    .control-btn {
      width: 48px;
      height: 48px;
      border: none;
      border-radius: 50%;
      background: #121218;
      color: #E5E5E5;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .control-btn:hover {
      background: #1a1a2e;
      transform: scale(1.05);
    }

    .control-btn:active {
      transform: scale(0.95);
    }

    .control-btn.primary {
      width: 64px;
      height: 64px;
      background: #F59E0B;
      color: #08080C;
    }

    .control-btn.primary:hover {
      background: #FBBF24;
    }

    .control-btn svg {
      width: 24px;
      height: 24px;
      fill: currentColor;
    }

    .control-btn.primary svg {
      width: 28px;
      height: 28px;
    }
  `;

  private emitEvent(eventName: string) {
    this.dispatchEvent(new CustomEvent(eventName, {
      bubbles: true,
      composed: true,
    }));
  }

  render() {
    return html`
      <div class="controls-container">
        <button class="control-btn" @click=${() => this.emitEvent('prev')} title="Previous">
          <svg viewBox="0 0 24 24">
            <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z"/>
          </svg>
        </button>
        <button class="control-btn primary" @click=${() => this.emitEvent('play-pause')} title="Play/Pause">
          <svg viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </button>
        <button class="control-btn" @click=${() => this.emitEvent('next')} title="Next">
          <svg viewBox="0 0 24 24">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
          </svg>
        </button>
      </div>
    `;
  }
}