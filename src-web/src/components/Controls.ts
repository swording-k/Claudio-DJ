import { LitElement, html, css } from 'lit';

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
      font-size: 1.25rem;
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
      font-size: 1.5rem;
    }
    .control-btn.primary:hover {
      background: #FBBF24;
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
        <button class="control-btn" @click=${() => this.emitEvent('prev')}>⏮</button>
        <button class="control-btn primary" @click=${() => this.emitEvent('play-pause')}>▶</button>
        <button class="control-btn" @click=${() => this.emitEvent('next')}>⏭</button>
      </div>
    `;
  }
}

customElements.define('controls-component', ControlsComponent);
