/// Starts the native KNeuron desktop shell.
///
/// Keep this layer intentionally small: EEG processing and module loading will
/// be introduced behind explicit interfaces instead of leaking into window setup.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running KNeuron");
}
