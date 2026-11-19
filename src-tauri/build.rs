fn main() {
    #[cfg(windows)]
    {
        println!("cargo:rerun-if-changed=app.manifest");
        println!("cargo:rerun-if-changed=icons/icon.ico");
        println!("cargo:rerun-if-changed=tauri.conf.json");
        let windows = tauri_build::WindowsAttributes::new()
            .window_icon_path("icons/icon.ico")
            .app_manifest(include_str!("app.manifest"));
        let attrs = tauri_build::Attributes::new().windows_attributes(windows);
        tauri_build::try_build(attrs).expect("falha ao configurar build Tauri Windows");
        return;
    }

    #[cfg(not(windows))]
    tauri_build::build();
}
