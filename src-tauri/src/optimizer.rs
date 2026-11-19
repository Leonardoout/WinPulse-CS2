use crate::backup::create_full_pc_backup;
use crate::models::{ActionReport, OptimizerPayload};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x08000000;

fn is_enabled(payload: &OptimizerPayload, id: &str) -> bool {
    *payload.enabled_tweaks.get(id).unwrap_or(&false)
}

fn run_cmd(program: &str, args: &[&str]) -> Result<String, String> {
    let mut cmd = Command::new(program);
    cmd.args(args);
    #[cfg(windows)]
    cmd.creation_flags(CREATE_NO_WINDOW);

    let out = cmd
        .output()
        .map_err(|e| format!("Falha ao iniciar {}: {}", program, e))?;

    if out.status.success() {
        Ok(String::from_utf8_lossy(&out.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&out.stderr).to_string())
    }
}

fn clean_directory_contents(dir: &Path) -> u64 {
    if !dir.exists() {
        return 0;
    }
    let mut freed_bytes: u64 = 0;
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                freed_bytes += dir_size(&path);
                let _ = fs::remove_dir_all(&path);
            } else if let Ok(meta) = fs::metadata(&path) {
                let len = meta.len();
                if fs::remove_file(&path).is_ok() {
                    freed_bytes += len;
                }
            }
        }
    }
    freed_bytes
}

fn dir_size(dir: &Path) -> u64 {
    let mut total = 0;
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                total += dir_size(&path);
            } else if let Ok(meta) = fs::metadata(&path) {
                total += meta.len();
            }
        }
    }
    total
}

pub fn apply_optimizations_direct<F>(payload: &OptimizerPayload, mut emit_log: F) -> ActionReport
where
    F: FnMut(String),
{
    let mut all_logs = Vec::new();
    let mut log = |msg: String| {
        all_logs.push(msg.clone());
        emit_log(msg);
    };

    let mut backup_path: Option<String> = None;
    let mut freed_bytes: u64 = 0;
    let mut requires_reboot = false;

    log(format!(
        "[INICIO] Aplicando perfil '{}' diretamente no Windows...",
        payload.active_profile
    ));

    // 1. Backup / Ponto de Restauração antes de aplicar
    if payload.full_pc_backup {
        let dest = payload.backup_destination.as_deref();
        let (ok, path) = create_full_pc_backup(payload.create_restore_point, dest, |line| {
            log(line);
        });
        if ok {
            backup_path = path;
        }
    } else if payload.create_restore_point {
        log("[ETAPA] Criando Ponto de Restauração do Windows...".to_string());
        match crate::backup::create_windows_restore_point() {
            Ok(msg) => log(format!("[OK] {}", msg)),
            Err(err) => log(format!("[AVISO] Ponto de Restauração: {}", err)),
        }
    }

    // 2. Limpeza de Arquivos Temporários
    let local_appdata = std::env::var("LOCALAPPDATA").unwrap_or_default();
    let system_root = std::env::var("SystemRoot").unwrap_or_else(|_| "C:\\Windows".to_string());

    if is_enabled(payload, "temp_user") {
        log("[ETAPA] Limpando pasta %TEMP% do usuário...".to_string());
        let p = std::env::temp_dir();
        let bytes = clean_directory_contents(&p);
        freed_bytes += bytes;
        log(format!(
            "[OK] %TEMP% limpa ({:.1} MB liberados).",
            bytes as f64 / 1_048_576.0
        ));
    }

    if is_enabled(payload, "temp_windows") {
        log("[ETAPA] Limpando pasta Windows\\Temp...".to_string());
        let p = PathBuf::from(&system_root).join("Temp");
        let bytes = clean_directory_contents(&p);
        freed_bytes += bytes;
        log(format!(
            "[OK] Windows\\Temp limpa ({:.1} MB).",
            bytes as f64 / 1_048_576.0
        ));
    }

    if is_enabled(payload, "temp_prefetch") {
        log("[ETAPA] Limpando Prefetch...".to_string());
        let p = PathBuf::from(&system_root).join("Prefetch");
        let bytes = clean_directory_contents(&p);
        freed_bytes += bytes;
        log(format!(
            "[OK] Prefetch limpo ({:.1} MB).",
            bytes as f64 / 1_048_576.0
        ));
    }

    if is_enabled(payload, "temp_dx_cache") && !local_appdata.is_empty() {
        log("[ETAPA] Limpando DirectX Shader Cache (D3DSCache)...".to_string());
        let p = PathBuf::from(&local_appdata).join("D3DSCache");
        freed_bytes += clean_directory_contents(&p);
        log("[OK] DirectX Shader Cache (D3DSCache) limpo.".to_string());
    }

    if is_enabled(payload, "temp_gpu_cache") && !local_appdata.is_empty() {
        log("[ETAPA] Limpando caches de shader NVIDIA e AMD...".to_string());
        let gpu_dirs = [
            "NVIDIA\\DXCache",
            "NVIDIA\\GLCache",
            "AMD\\DxCache",
            "AMD\\GLCache",
            "AMD\\VkCache",
        ];
        for sub in gpu_dirs {
            freed_bytes += clean_directory_contents(&PathBuf::from(&local_appdata).join(sub));
        }
        log("[OK] Caches de shader NVIDIA/AMD limpos.".to_string());
    }

    if is_enabled(payload, "temp_wu_cache") {
        log("[ETAPA] Limpando cache de downloads do Windows Update...".to_string());
        let _ = run_cmd("net", &["stop", "wuauserv"]);
        let p = PathBuf::from(&system_root).join("SoftwareDistribution\\Download");
        freed_bytes += clean_directory_contents(&p);
        let _ = run_cmd("net", &["start", "wuauserv"]);
        log("[OK] Cache de downloads do Windows Update limpo.".to_string());
    }

    if is_enabled(payload, "temp_delivery_opt") {
        log("[ETAPA] Limpando Delivery Optimization Cache...".to_string());
        let _ = run_cmd(
            "powershell.exe",
            &[
                "-NoProfile",
                "-Command",
                "Delete-DeliveryOptimizationCache -Force -ErrorAction SilentlyContinue",
            ],
        );
        log("[OK] Cache Delivery Optimization limpo.".to_string());
    }

    if is_enabled(payload, "temp_dns_flush") {
        log("[ETAPA] Executando ipconfig /flushdns...".to_string());
        let _ = run_cmd("ipconfig", &["/flushdns"]);
        log("[OK] Cache DNS limpo (ipconfig /flushdns).".to_string());
    }

    if is_enabled(payload, "temp_recycle_bin") {
        log("[ETAPA] Esvaziando Lixeira...".to_string());
        let _ = run_cmd(
            "powershell.exe",
            &[
                "-NoProfile",
                "-Command",
                "Clear-RecycleBin -Force -ErrorAction SilentlyContinue",
            ],
        );
        log("[OK] Lixeira esvaziada.".to_string());
    }

    // 3. Plano de Energia (powercfg)
    log("[ETAPA] Configurando Plano de Energia via powercfg...".to_string());
    apply_power_plan(payload, &mut log);

    // 4. Registro do Windows & CS2
    #[cfg(windows)]
    {
        log("[ETAPA] Aplicando chaves do Registro para Windows 11 e Counter-Strike 2...".to_string());
        apply_registry_tweaks(payload, &mut log, &mut requires_reboot);
        install_cs2_autoexec(&payload.autoexec_content, &mut log);
    }

    // 5. Serviços opcionais
    if is_enabled(payload, "win_telemetry_reduce") {
        log("[ETAPA] Desativando serviço DiagTrack...".to_string());
        let _ = run_cmd("sc", &["stop", "DiagTrack"]);
        let _ = run_cmd("sc", &["config", "DiagTrack", "start=", "disabled"]);
        log("[OK] Serviço DiagTrack desativado.".to_string());
    }
    if is_enabled(payload, "win_sysmain_off") {
        log("[ETAPA] Desativando serviço SysMain...".to_string());
        let _ = run_cmd("sc", &["stop", "SysMain"]);
        let _ = run_cmd("sc", &["config", "SysMain", "start=", "disabled"]);
        log("[OK] Serviço SysMain desativado.".to_string());
    }
    if is_enabled(payload, "win_search_index_off") {
        log("[ETAPA] Desativando Windows Search (WSearch)...".to_string());
        let _ = run_cmd("sc", &["stop", "WSearch"]);
        let _ = run_cmd("sc", &["config", "WSearch", "start=", "disabled"]);
        log("[OK] Indexação Windows Search (WSearch) desativada.".to_string());
    }

    let freed_mb = freed_bytes as f64 / 1_048_576.0;
    log(format!(
        "[CONCLUIDO] Todas as etapas finalizadas ({:.1} MB liberados).",
        freed_mb
    ));

    ActionReport {
        ok: true,
        summary: format!(
            "Otimizações aplicadas diretamente ({:.1} MB liberados).",
            freed_mb
        ),
        backup_path,
        freed_mb,
        requires_reboot,
        logs: all_logs,
    }
}

fn apply_power_plan<F>(payload: &OptimizerPayload, log: &mut F)
where
    F: FnMut(String),
{
    let plan = payload.power_config.plan.as_str();
    match plan {
        "ultimate" => {
            let ultimate_guid = "e9a42b02-d5df-448d-aa00-03f14749eb61";
            let list_out = run_cmd("powercfg", &["/list"]).unwrap_or_default();
            if !list_out.contains("Ultimate Performance") && !list_out.contains("Desempenho M") {
                let _ = run_cmd("powercfg", &["-duplicatescheme", ultimate_guid]);
            }
            let updated_list = run_cmd("powercfg", &["/list"]).unwrap_or_default();
            let mut activated = false;
            for line in updated_list.lines() {
                if line.contains("Ultimate Performance") || line.contains("Desempenho M") {
                    for token in line.split_whitespace() {
                        let cleaned =
                            token.trim_matches(|c: char| !c.is_ascii_hexdigit() && c != '-');
                        if cleaned.len() == 36 {
                            if run_cmd("powercfg", &["-setactive", cleaned]).is_ok() {
                                log(format!(
                                    "[OK] Plano Desempenho Máximo ativado ({}).",
                                    cleaned
                                ));
                                activated = true;
                                break;
                            }
                        }
                    }
                }
                if activated {
                    break;
                }
            }
            if !activated {
                let _ = run_cmd(
                    "powercfg",
                    &["-setactive", "8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c"],
                );
                log("[OK] Plano Alto Desempenho ativado (fallback).".to_string());
            }
        }
        "high" => {
            let _ = run_cmd(
                "powercfg",
                &["-setactive", "8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c"],
            );
            log("[OK] Plano Alto Desempenho ativado.".to_string());
        }
        _ => {
            let _ = run_cmd(
                "powercfg",
                &["-setactive", "381b4222-f694-41f0-9685-ff5bb260df2e"],
            );
            log("[OK] Plano Equilibrado ativado.".to_string());
        }
    }

    let timeout_str = payload.power_config.monitor_timeout_minutes.to_string();
    let _ = run_cmd("powercfg", &["/change", "monitor-timeout-ac", &timeout_str]);
    let _ = run_cmd("powercfg", &["/change", "standby-timeout-ac", "0"]);

    if is_enabled(payload, "power_core_parking") {
        let _ = run_cmd(
            "powercfg",
            &[
                "-setacvalueindex",
                "SCHEME_CURRENT",
                "SUB_PROCESSOR",
                "CPMINCORES",
                "100",
            ],
        );
        log("[OK] CPU Core Parking desativado (100% núcleos ativos).".to_string());
    }
    if is_enabled(payload, "power_cpu_min_max") {
        let _ = run_cmd(
            "powercfg",
            &[
                "-setacvalueindex",
                "SCHEME_CURRENT",
                "SUB_PROCESSOR",
                "PROCTHROTTLEMIN",
                "100",
            ],
        );
        let _ = run_cmd(
            "powercfg",
            &[
                "-setacvalueindex",
                "SCHEME_CURRENT",
                "SUB_PROCESSOR",
                "PROCTHROTTLEMAX",
                "100",
            ],
        );
        log("[OK] CPU Mínimo/Máximo definido para 100%.".to_string());
    }
    if is_enabled(payload, "power_usb_suspend") {
        let _ = run_cmd(
            "powercfg",
            &[
                "-setacvalueindex",
                "SCHEME_CURRENT",
                "2a737441-1930-4402-8d77-b2bebba308a3",
                "48e6b7a6-50f5-4782-a5d4-53bb8f07e226",
                "0",
            ],
        );
        log("[OK] Suspensão seletiva USB desativada.".to_string());
    }
    if is_enabled(payload, "power_pcie_aspm") {
        let _ = run_cmd(
            "powercfg",
            &[
                "-setacvalueindex",
                "SCHEME_CURRENT",
                "SUB_PCIEXPRESS",
                "ASPM",
                "0",
            ],
        );
        log("[OK] PCIe Link State Power Management (ASPM) desativado.".to_string());
    }
    if is_enabled(payload, "power_disk_idle") {
        let _ = run_cmd(
            "powercfg",
            &[
                "-setacvalueindex",
                "SCHEME_CURRENT",
                "SUB_DISK",
                "DISKIDLE",
                "0",
            ],
        );
        log("[OK] Desligamento de disco/SSD por ociosidade desativado.".to_string());
    }
    if is_enabled(payload, "power_hibernate_off") {
        let _ = run_cmd("powercfg", &["/hibernate", "off"]);
        log("[OK] Hibernação desativada.".to_string());
    }

    let _ = run_cmd("powercfg", &["-setactive", "SCHEME_CURRENT"]);
}

#[cfg(windows)]
fn apply_registry_tweaks<F>(
    payload: &OptimizerPayload,
    log: &mut F,
    requires_reboot: &mut bool,
) where
    F: FnMut(String),
{
    use winreg::enums::{HKEY_CURRENT_USER, HKEY_LOCAL_MACHINE};
    use winreg::RegKey;

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);

    if is_enabled(payload, "cs2_cpu_priority") {
        if let Ok((key, _)) = hklm.create_subkey("SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Image File Execution Options\\cs2.exe\\PerfOptions") {
            let _ = key.set_value("CpuPriorityClass", &3u32);
            log("[OK] Prioridade alta de CPU definida para cs2.exe (IFEO).".to_string());
        }
    }

    if is_enabled(payload, "cs2_fso_disable") {
        if let Ok((key, _)) = hkcu.create_subkey("System\\GameConfigStore") {
            let _ = key.set_value("GameDVR_FSEBehaviorMode", &2u32);
            let _ = key.set_value("GameDVR_HonorUserFSEBehaviorMode", &1u32);
            let _ = key.set_value("GameDVR_DXGIHonorFSEWindowsCompatible", &1u32);
            log("[OK] Otimizações de Tela Cheia (FSO) desativadas.".to_string());
        }
    }

    if is_enabled(payload, "cs2_mouse_accel_off") {
        if let Ok((key, _)) = hkcu.create_subkey("Control Panel\\Mouse") {
            let _ = key.set_value("MouseSpeed", &"0");
            let _ = key.set_value("MouseThreshold1", &"0");
            let _ = key.set_value("MouseThreshold2", &"0");
            log("[OK] Aceleração do mouse desativada (Curva 1:1).".to_string());
        }
    }

    if is_enabled(payload, "cs2_mm_tasks_games") {
        if let Ok((key, _)) = hklm.create_subkey("SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games") {
            let _ = key.set_value("GPU Priority", &8u32);
            let _ = key.set_value("Priority", &6u32);
            let _ = key.set_value("Scheduling Category", &"High");
            let _ = key.set_value("SFIO Priority", &"High");
            log("[OK] Prioridade MMCSS de GPU e agendamento aplicada para Jogos.".to_string());
        }
    }

    if is_enabled(payload, "win_game_mode") {
        if let Ok((key, _)) = hkcu.create_subkey("Software\\Microsoft\\GameBar") {
            let _ = key.set_value("AllowAutoGameMode", &1u32);
            let _ = key.set_value("AutoGameModeEnabled", &1u32);
            log("[OK] Modo de Jogo (Game Mode) ativado.".to_string());
        }
    }

    if is_enabled(payload, "win_hags") {
        if let Ok((key, _)) = hklm.create_subkey("SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers") {
            let _ = key.set_value("HwSchMode", &2u32);
            *requires_reboot = true;
            log("[OK] HAGS (Hardware-Accelerated GPU Scheduling) ativado.".to_string());
        }
    }

    if is_enabled(payload, "win_game_dvr_off") {
        if let Ok((key, _)) = hkcu.create_subkey("System\\GameConfigStore") {
            let _ = key.set_value("GameDVR_Enabled", &0u32);
        }
        if let Ok((key, _)) = hkcu.create_subkey("Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR") {
            let _ = key.set_value("AppCaptureEnabled", &0u32);
        }
        if let Ok((key, _)) = hklm.create_subkey("SOFTWARE\\Policies\\Microsoft\\Windows\\GameDVR") {
            let _ = key.set_value("AllowGameDVR", &0u32);
        }
        log("[OK] Xbox Game Bar e Game DVR desativados.".to_string());
    }

    if is_enabled(payload, "win_priority_separation") {
        if let Ok((key, _)) = hklm.create_subkey("SYSTEM\\CurrentControlSet\\Control\\PriorityControl") {
            let _ = key.set_value("Win32PrioritySeparation", &38u32);
            *requires_reboot = true;
            log("[OK] Win32PrioritySeparation definido para 0x26 (38).".to_string());
        }
    }

    if is_enabled(payload, "win_net_throttling") {
        if let Ok((key, _)) = hklm.create_subkey("SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile") {
            let _ = key.set_value("NetworkThrottlingIndex", &0xFFFFFFFFu32);
            let _ = key.set_value("SystemResponsiveness", &0u32);
            *requires_reboot = true;
            log("[OK] Network Throttling Index desativado.".to_string());
        }
    }

    if is_enabled(payload, "win_nagle_off") {
        if let Ok(ifaces) = hklm.open_subkey("SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces") {
            for name in ifaces.enum_keys().flatten() {
                if let Ok((sub, _)) = ifaces.create_subkey(&name) {
                    let has_ip = sub.get_value::<String, _>("DhcpIPAddress").is_ok()
                        || sub.get_value::<Vec<String>, _>("IPAddress").is_ok();
                    if has_ip {
                        let _ = sub.set_value("TCPNoDelay", &1u32);
                        let _ = sub.set_value("TcpAckFrequency", &1u32);
                    }
                }
            }
            *requires_reboot = true;
            log("[OK] Algoritmo de Nagle desativado nas interfaces ativas.".to_string());
        }
    }

    if is_enabled(payload, "win_background_apps") {
        if let Ok((key, _)) = hklm.create_subkey("SOFTWARE\\Policies\\Microsoft\\Windows\\AppPrivacy") {
            let _ = key.set_value("LetAppsRunInBackground", &2u32);
            log("[OK] Apps UWP em segundo plano bloqueados.".to_string());
        }
    }

    if is_enabled(payload, "win_transparency_off") {
        if let Ok((key, _)) = hkcu.create_subkey("Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize") {
            let _ = key.set_value("EnableTransparency", &0u32);
            log("[OK] Transparência do Windows 11 desativada.".to_string());
        }
    }

    if is_enabled(payload, "win_visual_fx") {
        if let Ok((key, _)) = hkcu.create_subkey("Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects") {
            let _ = key.set_value("VisualFXSetting", &3u32);
        }
        if let Ok((key, _)) = hkcu.create_subkey("Control Panel\\Desktop") {
            let _ = key.set_value("FontSmoothing", &"2");
            let _ = key.set_value("DragFullWindows", &"1");
        }
        log("[OK] Efeitos visuais ajustados para desempenho mantendo fontes nítidas.".to_string());
    }
}

#[cfg(windows)]
fn install_cs2_autoexec<F>(autoexec_content: &str, log: &mut F)
where
    F: FnMut(String),
{
    use winreg::enums::HKEY_CURRENT_USER;
    use winreg::RegKey;

    if autoexec_content.trim().is_empty() {
        return;
    }

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    if let Ok(steam_key) = hkcu.open_subkey("Software\\Valve\\Steam") {
        if let Ok(steam_path) = steam_key.get_value::<String, _>("SteamPath") {
            let cfg_dir = PathBuf::from(steam_path.replace('/', "\\"))
                .join("steamapps\\common\\Counter-Strike Global Offensive\\game\\csgo\\cfg");
            if cfg_dir.exists() {
                let target = cfg_dir.join("autoexec.cfg");
                if fs::write(&target, autoexec_content).is_ok() {
                    log(format!(
                        "[OK] autoexec.cfg instalado em {}",
                        target.display()
                    ));
                    return;
                }
            }
        }
    }
    log("[AVISO] Pasta do CS2 na Steam não detectada automaticamente; exporte o autoexec.cfg na aba Auditoria de Scripts.".to_string());
}
