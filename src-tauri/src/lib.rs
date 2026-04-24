use serde::{Deserialize, Serialize};
use std::process::Command;
use std::sync::Mutex;
use tauri::{Manager, State, WindowEvent};

// Shared app state
pub struct AppState {
    pub agent_paths: Mutex<Vec<String>>,
    pub last_agent_status: Mutex<AgentStatus>,
}

// Current playing track info
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct TrackInfo {
    pub name: String,
    pub artist: String,
    pub album: String,
    pub playing: bool,
    pub source_app: String,
}

// Agent status
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AgentStatus {
    pub state: String,      // idle / running / waiting / done
    pub name: String,
    pub task: String,
}

// Get current system media playback info
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
    // Use osascript to query MediaRemote for current track info
    let script = r#"
        try
            tell application "System Events"
                set spotifyRunning to (exists (process "Spotify")) of application "Spotify")
                set neteaseRunning to (exists (process "NeteaseMusic")) of application "NeteaseMusic"
                set qqRunning to (exists (process "QQMusic")) of application "QQMusic")
            end tell

            if spotifyRunning then
                tell application "Spotify"
                    if player state is playing then
                        set trackName to name of current track
                        set artistName to artist of current track
                        set albumName to album of current track
                        return "SPOTIFY||" & trackName & "||" & artistName & "||" & albumName & "||playing"
                    else
                        set trackName to name of current track
                        set artistName to artist of current track
                        set albumName to album of current track
                        return "SPOTIFY||" & trackName & "||" & artistName & "||" & albumName & "||paused"
                    end if
                end tell
            else if neteaseRunning then
                tell application "NeteaseMusic"
                    if player state is playing then
                        set trackName to name of current track
                        set artistName to artist of current track
                        return "NETEASE||" & trackName & "||" & artistName & "||未知专辑||playing"
                    else
                        set trackName to name of current track
                        set artistName to artist of current track
                        return "NETEASE||" & trackName & "||" & artistName & "||未知专辑||paused"
                    end if
                end tell
            else if qqRunning then
                tell application "QQMusic"
                    if player state is playing then
                        set trackName to name of current track
                        set artistName to artist of current track
                        return "QQMUSIC||" & trackName & "||" & artistName & "||未知专辑||playing"
                    else
                        return "QQMUSIC||停止||未知||未知专辑||paused"
                    end if
                end tell
            else
                return "NONE"
            end if
        on error
            return "NONE"
        end try
    "#;

    let output = Command::new("osascript")
        .args(["-e", script])
        .output();

    match output {
        Ok(out) => {
            let result = String::from_utf8_lossy(&out.stdout).trim().to_string();
            if result == "NONE" {
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

#[cfg(target_os = "windows")]
fn get_current_track_windows() -> TrackInfo {
    // Windows: use PowerShell to query MediaPlayer info
    let script = r#"
        try
            Add-Type -AssemblyName System.Runtime.WindowsRuntime
            $asTaskGeneric = ([System.WindowsRuntimeSystemExtensions,System.Runtime.WindowsRuntime,ContentType=WindowsRuntime]).GetMethod('AsTask')[[System.Threading.Tasks.TaskCompletionSource`1],System.Collections.Generic.IEnumerable`1]

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
        } catch {
            return "NONE"
        }
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

// Monitor agent status by polling log files
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
                if file_path.extension().map(|e| e == "log").unwrap_or(false) {
                    if let Ok(content) = std::fs::read_to_string(&file_path) {
                        let file_name = file_path.file_name()
                            .and_then(|n| n.to_str())
                            .unwrap_or("");
                        let agent_name = detect_agent_name(&file_name);

                        if content.contains("Waiting for user input") || content.contains("需要用户确认") {
                            latest = AgentStatus {
                                state: "waiting".to_string(),
                                name: agent_name.clone(),
                                task: "等待用户确认...".to_string(),
                            };
                            break;
                        } else if content.contains("Running") || content.contains("running") || content.contains("Working") {
                            latest = AgentStatus {
                                state: "running".to_string(),
                                name: agent_name.clone(),
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
    if filename.contains("claude") { "Claude Code".to_string() }
    else if filename.contains("cursor") { "Cursor".to_string() }
    else if filename.contains("windsurf") { "Windsurf".to_string() }
    else if filename.contains("continue") { "Continue".to_string() }
    else { "Agent".to_string() }
}

fn extract_current_task(content: &str) -> String {
    // Try to extract the most recent task description from logs
    let lines: Vec<&str> = content.lines().rev().take(20).collect();
    for line in lines {
        let trimmed = line.trim();
        if trimmed.len() > 10 && trimmed.len() < 200 {
            // Return first meaningful line found
            return trimmed.chars().take(100).collect();
        }
    }
    "工作中...".to_string()
}

// Update agent paths from settings
#[tauri::command]
fn set_agent_paths(paths: Vec<String>, state: State<AppState>) {
    *state.agent_paths.lock().unwrap() = paths;
}

// Get agent status (returns cached from state)
#[tauri::command]
fn get_cached_agent_status(state: State<AppState>) -> AgentStatus {
    state.last_agent_status.lock().unwrap().clone()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize agent paths
    let default_paths = vec![
        "~/.claude/logs/".to_string(),
        "~/.cursor/logs/".to_string(),
        "~/.windsurf/logs/".to_string(),
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(AppState {
            agent_paths: Mutex::new(default_paths),
            last_agent_status: Mutex::new(AgentStatus::default()),
        })
        .setup(|app| {
            log::info!("Claudio app setup complete");

            let window = app.get_webview_window("main").unwrap();

            window.on_window_event(move |event| {
                if let WindowEvent::Focused(false) = event {
                    // Optionally collapse when losing focus
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_current_track,
            get_agent_status,
            set_agent_paths,
            get_cached_agent_status
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
