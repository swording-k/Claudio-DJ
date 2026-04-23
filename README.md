# Claudio DJ

个人 AI 电台 - 像真人 DJ 一样了解你、陪伴你。

## 功能特性

- 🎵 智能音乐播放（网易云音乐）
- 🎙️ 语音唤醒（"Hey Claudio"）
- ⏰ 定时广播（早/午/晚）
- 🔊 语音合成（TTS）
- 💾 本地记忆存储

## 快速开始

### 前置要求

- Node.js 18+
- Rust 1.70+
- npm 或 yarn

### 安装

```bash
npm install
```

### 配置

复制 `.env.example` 为 `.env` 并填入 API Key。

### 启动

```bash
npm run dev
```

## 技术栈

- Tauri (跨平台桌面应用)
- Node.js (后端服务)
- Lit (Web Components 前端)
- Porcupine (语音唤醒)
- Fish Audio (语音合成)
- NeteaseCloudMusicApi (音乐服务)

## 隐私说明

所有用户数据存储在本地 ~/.claude/ 目录。