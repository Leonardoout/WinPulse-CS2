use chrono::Local;
use std::fs;
use std::path::PathBuf;
use std::process::Command;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x08000000;

fn run_hidden(program: &str, args: &[&str]) -> Result<String, String> {
    let mut cmd = Command::new(program);
    cmd.args(args);
    #[cfg(windows)]
    cmd.creation_flags(CREATE_NO_WINDOW);

    let output = cmd
        .output()
        .map_err(|e| format!("Falha ao executar {}: {}", program, e))?;

    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();

    if output.status.success() {
        Ok(stdout)
    } else {
        Err(if stderr.is_empty() { stdout } else { stderr })
    }
}

pub fn pick_backup_folder_dialog(initial_dir: Option<&str>) -> Result<Option<String>, String> {
    let sanitized_initial = initial_dir
        .unwrap_or("")
        .trim()
        .replace('\'', "''");

    let ps_script = format!(
        "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; \
         Add-Type -AssemblyName System.Windows.Forms; \
         Add-Type -AssemblyName System.Drawing; \
         $top = New-Object System.Windows.Forms.Form; \
         $top.TopMost = $true; \
         $top.StartPosition = 'Manual'; \
         $top.Location = New-Object System.Drawing.Point(-32000, -32000); \
         $top.Size = New-Object System.Drawing.Size(1, 1); \
         $top.Show(); $top.Activate(); \
         $dlg = New-Object System.Windows.Forms.FolderBrowserDialog; \
         $dlg.Description = 'Escolha onde salvar o Backup Completo do PC'; \
         $dlg.UseDescriptionForTitle = $true; \
         $dlg.ShowNewFolderButton = $true; \
         if ('{}' -and (Test-Path '{}')) {{ $dlg.SelectedPath = '{}' }}; \
         if ($dlg.ShowDialog($top) -eq [System.Windows.Forms.DialogResult]::OK) {{ Write-Output $dlg.SelectedPath }}; \
         $top.Dispose()",
        sanitized_initial, sanitized_initial, sanitized_initial
    );

    let out = run_hidden(
        "powershell.exe",
        &[
            "-NoProfile",
            "-STA",
            "-WindowStyle",
            "Hidden",
            "-Command",
            &ps_script,
        ],
    )?;

    let trimmed = out.trim();
    if trimmed.is_empty() {
        Ok(None)
    } else {
        Ok(Some(trimmed.to_string()))
    }
}

pub fn save_log_file_dialog(content: &str, default_name: &str) -> Result<Option<String>, String> {
    let safe_name = default_name.replace('\'', "''");
    let ps_script = format!(
        "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; \
         Add-Type -AssemblyName System.Windows.Forms; \
         Add-Type -AssemblyName System.Drawing; \
         $top = New-Object System.Windows.Forms.Form; \
         $top.TopMost = $true; \
         $top.StartPosition = 'Manual'; \
         $top.Location = New-Object System.Drawing.Point(-32000, -32000); \
         $top.Size = New-Object System.Drawing.Size(1, 1); \
         $top.Show(); $top.Activate(); \
         $dlg = New-Object System.Windows.Forms.SaveFileDialog; \
         $dlg.Title = 'Salvar Log do WinPulse CS2'; \
         $dlg.Filter = 'Arquivo de Log (*.txt)|*.txt|Todos os arquivos (*.*)|*.*'; \
         $dlg.FileName = '{}'; \
         $dlg.DefaultExt = 'txt'; \
         if ($dlg.ShowDialog($top) -eq [System.Windows.Forms.DialogResult]::OK) {{ Write-Output $dlg.FileName }}; \
         $top.Dispose()",
        safe_name
    );

    let out = run_hidden(
        "powershell.exe",
        &[
            "-NoProfile",
            "-STA",
            "-WindowStyle",
            "Hidden",
            "-Command",
            &ps_script,
        ],
    )?;

    let trimmed = out.trim();
    if trimmed.is_empty() {
        return Ok(None);
    }

    fs::write(trimmed, content.as_bytes())
        .map_err(|e| format!("Erro ao gravar o arquivo de log: {}", e))?;

    Ok(Some(trimmed.to_string()))
}

pub fn create_windows_restore_point() -> Result<String, String> {
    let ps_script = concat!(
        "$ErrorActionPreference = 'Stop'; ",
        "Enable-ComputerRestore -Drive \"$env:SystemDrive\\\" -ErrorAction SilentlyContinue; ",
        "Checkpoint-Computer -Description 'WinPulse-CS2-Backup' -RestorePointType 'MODIFY_SETTINGS'"
    );

    run_hidden(
        "powershell.exe",
        &["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", ps_script],
    )?;

    Ok("Ponto de Restauração 'WinPulse-CS2-Backup' criado com sucesso.".to_string())
}

pub fn create_full_pc_backup<F>(
    include_restore_point: bool,
    custom_destination: Option<&str>,
    mut on_log: F,
) -> (bool, Option<String>)
where
    F: FnMut(String),
{
    if include_restore_point {
        on_log("[ETAPA] Criando Ponto de Restauração do Windows (WinPulse-CS2-Backup)...".to_string());
        match create_windows_restore_point() {
            Ok(msg) => on_log(format!("[OK] {}", msg)),
            Err(err) => on_log(format!(
                "[AVISO] Ponto de Restauração não criado (limite de 24h ou Proteção do Sistema desativada): {}",
                err
            )),
        }
    }

    let base_dir = match custom_destination.map(str::trim).filter(|s| !s.is_empty()) {
        Some(custom) => PathBuf::from(custom),
        None => std::env::var("USERPROFILE")
            .map(PathBuf::from)
            .unwrap_or_else(|_| std::env::temp_dir())
            .join("Desktop"),
    };

    let timestamp = Local::now().format("%Y-%m-%d_%H-%M-%S");
    let backup_dir = base_dir.join(format!("WinPulse_Backup_{}", timestamp));

    on_log(format!(
        "[ETAPA] Criando pasta de backup em: {}",
        backup_dir.display()
    ));

    if let Err(e) = fs::create_dir_all(&backup_dir) {
        on_log(format!(
            "[ERRO] Não foi possível criar pasta de backup em {}: {}",
            backup_dir.display(),
            e
        ));
        return (false, None);
    }

    let backup_str = backup_dir.to_string_lossy().to_string();
    on_log(format!("[OK] Pasta de backup criada: {}", backup_str));

    // Exportar Plano de Energia ativo
    on_log("[ETAPA] Exportando Plano de Energia atual (.pow)...".to_string());
    if let Ok(active_out) = run_hidden("powercfg", &["/getactivescheme"]) {
        if let Some(guid) = extract_guid(&active_out) {
            let _ = fs::write(backup_dir.join("plano_ativo_guid.txt"), &guid);
            let pow_path = backup_dir.join("plano_energia_atual.pow");
            let pow_str = pow_path.to_string_lossy().to_string();
            if run_hidden("powercfg", &["/export", &pow_str, &guid]).is_ok() {
                on_log(format!("[OK] Plano de energia atual exportado ({}).", guid));
            }
        }
    }

    // Exportar chaves do Registro do Windows
    on_log("[ETAPA] Exportando chaves do Registro do Windows (.reg)...".to_string());
    let reg_keys = [
        ("HKCU\\Software\\Microsoft\\GameBar", "reg_GameBar.reg"),
        ("HKCU\\System\\GameConfigStore", "reg_GameConfigStore.reg"),
        ("HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR", "reg_GameDVR_User.reg"),
        ("HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\GameDVR", "reg_GameDVR_Policy.reg"),
        ("HKLM\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers", "reg_GraphicsDrivers.reg"),
        ("HKLM\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl", "reg_PriorityControl.reg"),
        ("HKCU\\Control Panel\\Mouse", "reg_Mouse.reg"),
        ("HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile", "reg_Multimedia_SystemProfile.reg"),
        ("HKLM\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces", "reg_Tcpip_Interfaces.reg"),
        ("HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\AppPrivacy", "reg_AppPrivacy.reg"),
        ("HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize", "reg_Personalize.reg"),
        ("HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects", "reg_VisualEffects.reg"),
    ];

    let mut exported_count = 0;
    for (key, filename) in reg_keys {
        let out_file = backup_dir.join(filename).to_string_lossy().to_string();
        if run_hidden("reg", &["export", key, &out_file, "/y"]).is_ok() {
            exported_count += 1;
        }
    }
    on_log(format!(
        "[OK] {} chaves do Registro exportadas (.reg).",
        exported_count
    ));

    // Backup do autoexec.cfg atual se encontrado na Steam
    #[cfg(windows)]
    {
        use winreg::enums::HKEY_CURRENT_USER;
        use winreg::RegKey;
        if let Ok(hkcu) = RegKey::predef(HKEY_CURRENT_USER).open_subkey("Software\\Valve\\Steam") {
            if let Ok(steam_path) = hkcu.get_value::<String, _>("SteamPath") {
                let cfg_path = PathBuf::from(steam_path.replace('/', "\\"))
                    .join("steamapps\\common\\Counter-Strike Global Offensive\\game\\csgo\\cfg\\autoexec.cfg");
                if cfg_path.exists() {
                    if fs::copy(&cfg_path, backup_dir.join("autoexec_anterior.cfg")).is_ok() {
                        on_log("[OK] autoexec.cfg anterior salvo no backup.".to_string());
                    }
                }
            }
        }
    }

    (true, Some(backup_str))
}

fn extract_guid(text: &str) -> Option<String> {
    for token in text.split_whitespace() {
        let cleaned = token.trim_matches(|c: char| !c.is_ascii_hexdigit() && c != '-');
        if cleaned.len() == 36 && cleaned.chars().filter(|&c| c == '-').count() == 4 {
            return Some(cleaned.to_string());
        }
    }
    None
}
