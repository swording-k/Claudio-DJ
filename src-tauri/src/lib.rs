use serde::{Deserialize, Serialize};
use std::process::Command;
use std::sync::Mutex;
use tauri::{
    image::Image,
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, State, WindowEvent,
};

pub struct AppState {
    pub agent_paths: Mutex<Vec<String>>,
    pub last_agent_status: Mutex<AgentStatus>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct TrackInfo {
    pub name: String,
    pub artist: String,
    pub album: String,
    pub playing: bool,
    pub source_app: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AgentStatus {
    pub state: String,
    pub name: String,
    pub task: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct RunningAgents {
    pub agents: Vec<AgentInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentInfo {
    pub name: String,
    pub pid: u32,
    pub state: String,
}

#[tauri::command]
fn get_current_track() -> TrackInfo {
    #[cfg(target_os = "macos")]
    {
        get_current_track_macos()
    }
    #[cfg(target_os = "windows")]
    {
        get_current_track_windows()
    }
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        TrackInfo::default()
    }
}

#[cfg(target_os = "macos")]
fn get_current_track_macos() -> TrackInfo {
    if let Ok(out) = Command::new("osascript")
        .args(["-e", "tell application \"Spotify\" to if player state is playing then return \"PLAYING||\" & name of current track & \"||\" & artist of current track & \"||\" & album of current track else return \"PAUSED||\" & name of current track & \"||\" & artist of current track & \"||\" & album of current track"])
        .output()
    {
        let r = String::from_utf8_lossy(&out.stdout).trim().to_string();
        if !r.is_empty() && !r.contains("error") && r.contains("||") {
            let parts: Vec<&str> = r.split("||").collect();
            if parts.len() >= 4 {
                return TrackInfo {
                    name: parts[1].to_string(),
                    artist: parts[2].to_string(),
                    album: parts[3].to_string(),
                    playing: parts[0] == "PLAYING",
                    source_app: "Spotify".to_string(),
                };
            }
        }
    }

    if let Ok(out) = Command::new("osascript")
        .args(["-e", "tell application \"System Events\" to exists (process \"NeteaseMusic\")"])
        .output()
    {
        let r = String::from_utf8_lossy(&out.stdout).trim().to_string();
        if r == "true" {
            if let Ok(name_out) = Command::new("osascript")
                .args(["-e", "tell application \"NeteaseMusic\" to get name of current track"])
                .output()
            {
                let track_name = String::from_utf8_lossy(&name_out.stdout).trim().to_string();
                if !track_name.is_empty()
                    && !track_name.contains("error")
                    && !track_name.contains("(-")
                {
                    let artist_name = Command::new("osascript")
                        .args(["-e", "tell application \"NeteaseMusic\" to get artist of current track"])
                        .output()
                        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
                        .unwrap_or_default();
                    let state_str = Command::new("osascript")
                        .args(["-e", "tell application \"NeteaseMusic\" to get player state"])
                        .output()
                        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
                        .unwrap_or_default();
                    return TrackInfo {
                        name: track_name,
                        artist: artist_name,
                        album: "未知专辑".to_string(),
                        playing: state_str == "playing" || state_str == "1",
                        source_app: "网易云音乐".to_string(),
                    };
                }
            }
        }
    }

    TrackInfo::default()
}

#[cfg(target_os = "windows")]
fn get_current_track_windows() -> TrackInfo {
    let script = r#"
        try
            [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,Windows.Media.Control,ContentType=WindowsRuntime] | Out-Null
            $manager = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync().GetAwaiter().GetResult()
            $session = $manager.GetCurrentSession()
            if ($session -ne $null) {
                $info = $session.TryGetMediaPropertiesAsync().GetAwaiter().GetResult()
                $playback = $session.GetPlaybackInfo()
                $app = $session.SourceAppUserModelId
                if ($info -ne $null) {
                    $title = $info.Title
                    $artist = $info.Artist
                    $album = $info.AlbumTitle
                    $state = $playback.PlaybackStatus.ToString()
                    $playing = if ($state -eq "Playing") { "playing" } else { "paused" }
                    return "$app||$title||$artist||$album||$playing"
                }
            }
            return "NONE"
        } catch { return "NONE" }
    "#;

    let output = Command::new("powershell")
        .args(["-NoProfile", "-Command", script])
        .output();

    match output {
        Ok(out) => {
            let result = String::from_utf8_lossy(&out.stdout).trim().to_string();
            if result == "NONE" || result.is_empty() {
                return TrackInfo::default();
            }
            let parts: Vec<&str> = result.split("||").collect();
            if parts.len() >= 5 {
                return TrackInfo {
                    name: parts[1].to_string(),
                    artist: parts[2].to_string(),
                    album: parts[3].to_string(),
                    playing: parts[4] == "playing",
                    source_app: parts[0].to_string(),
                };
            }
            TrackInfo::default()
        }
        Err(_) => TrackInfo::default(),
    }
}

#[tauri::command]
fn get_running_agents() -> RunningAgents {
    #[cfg(target_os = "macos")]
    {
        get_running_agents_macos()
    }
    #[cfg(target_os = "windows")]
    {
        get_running_agents_windows()
    }
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        RunningAgents::default()
    }
}

#[cfg(target_os = "macos")]
fn get_running_agents_macos() -> RunningAgents {
    let output = Command::new("ps")
        .args(["aux"])
        .output();

    match output {
        Ok(out) => {
            let content = String::from_utf8_lossy(&out.stdout);
            let mut agents = Vec::new();

            let process_names = [
                ("Claude Code", "claude-code"),
                ("Claude Code", "claudecode"),
                ("Claude", "claude"),
                ("Cursor", "cursor"),
                ("Windsurf", "windsurf"),
                ("Trae", "trae"),
                ("Continue", "continue"),
                ("VS Code", "code"),
                ("Obsidian", "obsidian"),
                ("Xcode", "xcode"),
            ];

            let lines: Vec<&str> = content.lines().collect();
            for line in lines {
                let lower = line.to_lowercase();
                for (agent_name, proc_keyword) in &process_names {
                    if lower.contains(&proc_keyword.to_lowercase())
                        && !lower.contains("grep")
                        && !lower.contains("ps aux")
                    {
                        let parts: Vec<&str> = line.split_whitespace().collect();
                        let pid = parts.get(1).and_then(|s| s.parse::<u32>().ok()).unwrap_or(0);
                        if pid > 0 {
                            agents.push(AgentInfo {
                                name: agent_name.to_string(),
                                pid,
                                state: "running".to_string(),
                            });
                        }
                        break;
                    }
                }
            }

            RunningAgents { agents }
        }
        Err(_) => RunningAgents::default(),
    }
}

#[cfg(target_os = "windows")]
fn get_running_agents_windows() -> RunningAgents {
    let output = Command::new("tasklist")
        .args(["/fo", "csv", "/nh"])
        .output();

    match output {
        Ok(out) => {
            let content = String::from_utf8_lossy(&out.stdout);
            let mut agents = Vec::new();

            let process_names = [
                ("Claude Code", "claude-code"),
                ("Claude Code", "claudecode"),
                ("Claude", "claude"),
                ("Cursor", "cursor"),
                ("Windsurf", "windsurf"),
                ("Trae", "trae"),
                ("Continue", "continue"),
                ("VS Code", "code"),
                ("Obsidian", "obsidian"),
            ];

            for line in content.lines() {
                let lower = line.to_lowercase();
                for (agent_name, proc_keyword) in &process_names {
                    if lower.contains(&proc_keyword.to_lowercase()) {
                        let parts: Vec<&str> = line.split(',').collect();
                        let pid = parts.get(1).and_then(|s| {
                            s.trim().trim_matches('"').parse::<u32>().ok()
                        }).unwrap_or(0);
                        if pid > 0 {
                            agents.push(AgentInfo {
                                name: agent_name.to_string(),
                                pid,
                                state: "running".to_string(),
                            });
                        }
                        break;
                    }
                }
            }

            RunningAgents { agents }
        }
        Err(_) => RunningAgents::default(),
    }
}

#[tauri::command]
fn get_agent_status(state: State<AppState>) -> AgentStatus {
    let paths: Vec<String> = state.agent_paths.lock().unwrap().clone();
    let mut latest = AgentStatus {
        state: "idle".to_string(),
        name: "无 Agent".to_string(),
        task: "等待检测到工作 Agent...".to_string(),
    };

    for path_template in &paths {
        let expanded = shellexpand::tilde(path_template);
        let path = expanded.as_ref();

        if let Ok(entries) = std::fs::read_dir(path) {
            for entry in entries.flatten() {
                let file_path = entry.path();
                if file_path.extension().map(|e| e == "log").unwrap_or(false)
                    || file_path
                        .file_name()
                        .map(|n| n.to_str().unwrap_or("").ends_with(".log"))
                        .unwrap_or(false)
                {
                    if let Ok(content) = std::fs::read_to_string(&file_path) {
                        let file_name =
                            file_path.file_name().and_then(|n| n.to_str()).unwrap_or("");

                        if content.contains("Waiting for user input")
                            || content.contains("需要用户确认")
                            || content.contains("awaiting_confirmation")
                        {
                            latest = AgentStatus {
                                state: "waiting".to_string(),
                                name: detect_agent_name(file_name),
                                task: "等待用户确认...".to_string(),
                            };
                            break;
                        } else if content.contains("Running")
                            || content.contains("running")
                            || content.contains("Working")
                            || content.contains("thinking")
                        {
                            latest = AgentStatus {
                                state: "running".to_string(),
                                name: detect_agent_name(file_name),
                                task: extract_current_task(&content),
                            };
                        }
                    }
                }
            }
        }
    }

    *state.last_agent_status.lock().unwrap() = latest.clone();
    latest
}

fn detect_agent_name(filename: &str) -> String {
    let f = filename.to_lowercase();
    if f.contains("claude-code") || f.contains("claudecode") {
        return "Claude Code".to_string();
    } else if f.contains("claude") {
        return "Claude".to_string();
    } else if f.contains("cursor") {
        return "Cursor".to_string();
    } else if f.contains("windsurf") {
        return "Windsurf".to_string();
    } else if f.contains("continue") {
        return "Continue".to_string();
    } else if f.contains("trae") {
        return "Trae".to_string();
    } else if f.contains("obsidian") {
        return "Obsidian".to_string();
    } else if f.contains("vscode") {
        return "VS Code".to_string();
    }
    "Agent".to_string()
}

fn extract_current_task(content: &str) -> String {
    let lines: Vec<&str> = content.lines().rev().take(30).collect();
    for line in lines {
        let trimmed = line.trim();
        if trimmed.len() > 15 && trimmed.len() < 200 && !trimmed.starts_with("[20") {
            return trimmed.chars().take(120).collect();
        }
    }
    "工作中...".to_string()
}

#[tauri::command]
fn set_agent_paths(paths: Vec<String>, state: State<AppState>) {
    *state.agent_paths.lock().unwrap() = paths;
}

#[tauri::command]
fn get_cached_agent_status(state: State<AppState>) -> AgentStatus {
    state.last_agent_status.lock().unwrap().clone()
}

fn create_tray_menu(app: &AppHandle) -> tauri::Result<Menu<tauri::Wry>> {
    let show_item = MenuItem::new(app, "显示窗口", true, None::<&str>)?;
    let hide_item = MenuItem::new(app, "隐藏窗口", true, None::<&str>)?;
    let quit_item = MenuItem::new(app, "退出 Claudio", true, None::<&str>)?;
    Menu::with_items(app, &[&show_item, &hide_item, &quit_item])
}

fn setup_tray(app: &AppHandle) -> tauri::Result<()> {
    let menu = create_tray_menu(app)?;

    let icon_bytes = include_bytes!("../icons/icon.png");
    let icon = Image::from_bytes(icon_bytes)?;

    let _tray = TrayIconBuilder::new()
        .icon(icon)
        .menu(&menu)
        .tooltip("Claudio - VibeCoding 伴侣")
        .menu_on_left_click(false)
        .on_menu_event(|app, event| {
            match event.id.as_ref() {
                "显示窗口" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                "隐藏窗口" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.hide();
                    }
                }
                "退出 Claudio" => {
                    app.exit(0);
                }
                _ => {}
            }
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    if window.is_visible().unwrap_or(false) {
                        let _ = window.hide();
                    } else {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            }
        })
        .build(app)?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let default_paths = vec![
        "~/.claude/logs/".to_string(),
        "~/.cursor/logs/".to_string(),
        "~/.windsurf/logs/".to_string(),
        "~/Library/Logs/Claude/".to_string(),
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(AppState {
            agent_paths: Mutex::new(default_paths),
            last_agent_status: Mutex::new(AgentStatus::default()),
        })
        .setup(|app| {
            log::info!("Claudio app setup complete");
            setup_tray(app.handle())?;
            let window = app.get_webview_window("main").unwrap();
            window.on_window_event(move |event| {
                if let WindowEvent::Focused(false) = event {}
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_current_track,
            get_agent_status,
            set_agent_paths,
            get_cached_agent_status,
            get_running_agents
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
