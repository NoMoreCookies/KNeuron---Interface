/// Starts the native KNeuron desktop shell.
///
/// Keep this layer intentionally small. Device access, EEG processing,
/// sidecars and module infrastructure must be introduced behind explicit
/// interfaces instead of leaking into native window setup.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .run(tauri::generate_context!())
        .expect("error while running KNeuron");
}
