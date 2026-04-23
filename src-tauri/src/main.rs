// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use log::info;

fn main() {
    // Initialize logger
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info")).init();

    info!("Starting Claudio DJ application");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}