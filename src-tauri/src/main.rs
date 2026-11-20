#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod backup;
mod models;
mod optimizer;

use models::{ActionReport, ExecutionStatusSnapshot, OptimizerPayload};
use std::sync::{Arc, Mutex};

struct AppExecutionState {
    inner: Arc<Mutex<ExecutionStatusSnapshot>>,
}

impl Default for AppExecutionState {
    fn default() -> Self {
        Self {
            inner: Arc::new(Mutex::new(ExecutionStatusSnapshot {
                running: false,
                action_type: "idle".to_string(),
                logs: Vec::new(),
                report: None,
            })),
        }
    }
}

#[tauri::command]
fn start_restore_point_cmd(
    include_full_backup: bool,
    backup_destination: Option<String>,
    exec_state: tauri::State<'_, AppExecutionState>,
) -> Result<(), String> {
    {
        let mut guard = exec_state
            .inner
            .lock()
            .map_err(|_| "Falha ao travar estado".to_string())?;
        if guard.running {
            return Err("Já existe uma execução em andamento.".to_string());
        }
        guard.running = true;
        guard.action_type = "restore".to_string();
        guard.logs.clear();
        guard.report = None;
    }

    let shared = Arc::clone(&exec_state.inner);
    std::thread::spawn(move || {
        let append_log = |line: String| {
            if let Ok(mut g) = shared.lock() {
                g.logs.push(line);
            }
        };

        let report = if include_full_backup {
            append_log("[INICIO] Iniciando criação de Ponto de Restauração e Backup Completo do PC...".to_string());
            let (ok, backup_path) =
                backup::create_full_pc_backup(true, backup_destination.as_deref(), |line| {
                    append_log(line);
                });

            let final_logs = shared
                .lock()
                .map(|g| g.logs.clone())
                .unwrap_or_default();

            ActionReport {
                ok,
                summary: if ok {
                    "Ponto de Restauração e Backup Completo concluídos.".to_string()
                } else {
                    "Não foi possível concluir o backup completo.".to_string()
                },
                backup_path,
                freed_mb: 0.0,
                requires_reboot: false,
                logs: final_logs,
            }
        } else {
            append_log("[INICIO] Criando Ponto de Restauração do Windows...".to_string());
            match backup::create_windows_restore_point() {
                Ok(msg) => {
                    append_log(format!("[OK] {}", msg));
                    let final_logs = shared
                        .lock()
                        .map(|g| g.logs.clone())
                        .unwrap_or_default();
                    ActionReport {
                        ok: true,
                        summary: msg,
                        backup_path: None,
                        freed_mb: 0.0,
                        requires_reboot: false,
                        logs: final_logs,
                    }
                }
                Err(err) => {
                    append_log(format!("[ERRO] {}", err));
                    let final_logs = shared
                        .lock()
                        .map(|g| g.logs.clone())
                        .unwrap_or_default();
                    ActionReport {
                        ok: false,
                        summary: format!("Falha ao criar Ponto de Restauração: {}", err),
                        backup_path: None,
                        freed_mb: 0.0,
                        requires_reboot: false,
                        logs: final_logs,
                    }
                }
            }
        };

        if let Ok(mut guard) = shared.lock() {
            guard.running = false;
            guard.report = Some(report);
        }
    });

    Ok(())
}

#[tauri::command]
fn start_apply_optimizations_cmd(
    payload: OptimizerPayload,
    exec_state: tauri::State<'_, AppExecutionState>,
) -> Result<(), String> {
    {
        let mut guard = exec_state
            .inner
            .lock()
            .map_err(|_| "Falha ao travar estado".to_string())?;
        if guard.running {
            return Err("Já existe uma execução em andamento.".to_string());
        }
        guard.running = true;
        guard.action_type = "apply".to_string();
        guard.logs.clear();
        guard.report = None;
    }

    let shared = Arc::clone(&exec_state.inner);
    std::thread::spawn(move || {
        let report = optimizer::apply_optimizations_direct(&payload, |line| {
            if let Ok(mut g) = shared.lock() {
                g.logs.push(line);
            }
        });

        if let Ok(mut guard) = shared.lock() {
            guard.running = false;
            guard.report = Some(report);
        }
    });

    Ok(())
}

#[tauri::command]
fn start_temp_cleanup_cmd(
    enabled_tweaks: std::collections::HashMap<String, bool>,
    exec_state: tauri::State<'_, AppExecutionState>,
) -> Result<(), String> {
    {
        let mut guard = exec_state
            .inner
            .lock()
            .map_err(|_| "Falha ao travar estado".to_string())?;
        if guard.running {
            return Err("Já existe uma execução em andamento.".to_string());
        }
        guard.running = true;
        guard.action_type = "temp".to_string();
        guard.logs.clear();
        guard.report = None;
    }

    let shared = Arc::clone(&exec_state.inner);
    std::thread::spawn(move || {
        let report = optimizer::run_temp_cleanup_only(enabled_tweaks, |line| {
            if let Ok(mut g) = shared.lock() {
                g.logs.push(line);
            }
        });

        if let Ok(mut guard) = shared.lock() {
            guard.running = false;
            guard.report = Some(report);
        }
    });

    Ok(())
}

#[tauri::command]
fn get_execution_status_cmd(
    exec_state: tauri::State<'_, AppExecutionState>,
) -> Result<ExecutionStatusSnapshot, String> {
    let guard = exec_state
        .inner
        .lock()
        .map_err(|_| "Falha ao ler estado da execução".to_string())?;
    Ok(guard.clone())
}

#[tauri::command]
async fn pick_backup_folder_cmd(initial_dir: Option<String>) -> Result<Option<String>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        backup::pick_backup_folder_dialog(initial_dir.as_deref())
    })
    .await
    .map_err(|e| format!("Falha na tarefa do seletor de pasta: {}", e))?
}

#[tauri::command]
async fn save_log_file_cmd(content: String, default_name: String) -> Result<Option<String>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        backup::save_log_file_dialog(&content, &default_name)
    })
    .await
    .map_err(|e| format!("Falha na tarefa ao salvar log: {}", e))?
}

fn main() {
    tauri::Builder::default()
        .manage(AppExecutionState::default())
        .invoke_handler(tauri::generate_handler![
            start_restore_point_cmd,
            start_apply_optimizations_cmd,
            start_temp_cleanup_cmd,
            get_execution_status_cmd,
            pick_backup_folder_cmd,
            save_log_file_cmd
        ])
        .run(tauri::generate_context!())
        .expect("erro ao iniciar o aplicativo WinPulse CS2");
}
