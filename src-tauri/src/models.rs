use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PowerConfigInput {
    pub plan: String,
    pub monitor_timeout_minutes: u32,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OptimizerPayload {
    pub active_profile: String,
    pub enabled_tweaks: HashMap<String, bool>,
    pub create_restore_point: bool,
    pub full_pc_backup: bool,
    pub backup_destination: Option<String>,
    pub power_config: PowerConfigInput,
    pub autoexec_content: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ActionReport {
    pub ok: bool,
    pub summary: String,
    pub backup_path: Option<String>,
    pub freed_mb: f64,
    pub requires_reboot: bool,
    pub logs: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecutionStatusSnapshot {
    pub running: bool,
    pub action_type: String,
    pub logs: Vec<String>,
    pub report: Option<ActionReport>,
}
