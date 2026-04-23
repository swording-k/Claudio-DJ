// lib.rs for Tauri library
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            log::info!("Claudio DJ app setup complete");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}