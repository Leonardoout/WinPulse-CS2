import { Cs2Config, PowerConfig, ProfileId, TweakItem } from '../types/optimizer';

export interface ProfileMeta {
  id: ProfileId;
  title: string;
  subtitle: string;
  description: string;
  highlights: string[];
}

export const PROFILES: ProfileMeta[] = [
  {
    id: 'low-latency',
    title: 'Baixa Latência & Frametime',
    subtitle: 'Hardware Forte · Padrão Recomendado',
    description:
      'Prioriza estabilidade de 1% Low FPS, redução de input lag, desativação de economia de energia em CPU/GPU/USB e ajustes de rede sem sacrificar recursos úteis do Windows 11.',
    highlights: [
      'Plano Desempenho Máximo + Core Parking desativado',
      'HAGS, Game Mode, PrioritySeparation 0x26 e Nagle OFF',
      'CS2 com Low Latency Sleep, rate 1000000 e prioridade alta',
    ],
  },
  {
    id: 'balanced',
    title: 'Competitivo Equilibrado',
    subtitle: 'Uso Misto · Estabilidade Total',
    description:
      'Mantém todos os ajustes seguros de limpeza, rede, Game Mode e mouse 1:1 sem alterações profundas de registro ou desativação de serviços em segundo plano.',
    highlights: [
      'Limpeza completa de caches e temporários seguros',
      'Plano Alto Desempenho e USB sem suspensão',
      'Mantém serviços do Windows intactos para trabalho',
    ],
  },
  {
    id: 'max-fps',
    title: 'Máximo FPS — PC Modesto',
    subtitle: 'Redução Máxima de Carga',
    description:
      'Desativa efeitos visuais, transparência, apps em segundo plano, hibernação, telemetria e serviços extras para liberar RAM e ciclos de CPU ao máximo no CS2.',
    highlights: [
      'Corta transparência, animações e apps em background',
      'Desativa Hibernação, SysMain e indexação WSearch',
      'Limpeza profunda incluindo Prefetch e shader cache',
    ],
  },
];

export const TWEAKS_CATALOG: TweakItem[] = [
  // =========================================================================
  // CATEGORIA: LIMPEZA DE TEMPORÁRIOS (temp)
  // =========================================================================
  {
    id: 'temp_user',
    category: 'temp',
    subgroup: 'Arquivos Temporários do Sistema',
    title: 'Limpar pasta %TEMP% do Usuário',
    description:
      'Remove arquivos temporários de instaladores, navegadores e programas acumulados no perfil atual do usuário.',
    frametimeBenefit: 'Libera espaço em SSD/NVMe e reduz arquivos órfãos',
    risk: 'seguro',
    defaultProfiles: ['low-latency', 'balanced', 'max-fps'],
    previewCommand: 'Remove-Item "$env:TEMP\\*" -Recurse -Force -ErrorAction SilentlyContinue',
    applyScript: `Write-Host "  -> Limpando pasta TEMP do usuario ($env:TEMP)..." -ForegroundColor Gray
Get-ChildItem -Path "$env:TEMP" -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue`,
  },
  {
    id: 'temp_windows',
    category: 'temp',
    subgroup: 'Arquivos Temporários do Sistema',
    title: 'Limpar pasta C:\\Windows\\Temp',
    description:
      'Remove logs antigos e arquivos temporários gerados por serviços e atualizações em nível de sistema.',
    frametimeBenefit: 'Recupera espaço no disco do sistema (C:)',
    risk: 'seguro',
    defaultProfiles: ['low-latency', 'balanced', 'max-fps'],
    previewCommand: 'Remove-Item "$env:SystemRoot\\Temp\\*" -Recurse -Force -ErrorAction SilentlyContinue',
    applyScript: `Write-Host "  -> Limpando pasta Windows\\Temp..." -ForegroundColor Gray
Get-ChildItem -Path "$env:SystemRoot\\Temp" -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue`,
  },
  {
    id: 'temp_dx_cache',
    category: 'temp',
    subgroup: 'Caches de Shaders e GPU',
    title: 'Limpar Cache de Shaders DirectX (D3DSCache)',
    description:
      'Remove shaders DirectX compilados antigos que podem causar engasgos (stuttering) após atualizações de driver ou patches do CS2.',
    frametimeBenefit: 'Elimina micro-travamentos por shaders corrompidos',
    risk: 'seguro',
    defaultProfiles: ['low-latency', 'balanced', 'max-fps'],
    previewCommand: 'Remove-Item "$env:LOCALAPPDATA\\D3DSCache\\*" -Recurse -Force -ErrorAction SilentlyContinue',
    applyScript: `Write-Host "  -> Limpando DirectX Shader Cache (D3DSCache)..." -ForegroundColor Gray
if (Test-Path "$env:LOCALAPPDATA\\D3DSCache") {
  Get-ChildItem -Path "$env:LOCALAPPDATA\\D3DSCache" -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
}`,
  },
  {
    id: 'temp_gpu_cache',
    category: 'temp',
    subgroup: 'Caches de Shaders e GPU',
    title: 'Limpar Cache de Shaders NVIDIA e AMD',
    description:
      'Apaga caches DXCache e GLCache de drivers NVIDIA/AMD. Os novos shaders são recompilados de forma limpa na próxima partida.',
    frametimeBenefit: 'Estabiliza frametime pós-update de driver de vídeo',
    risk: 'seguro',
    defaultProfiles: ['low-latency', 'max-fps'],
    previewCommand: 'Remove-Item "$env:LOCALAPPDATA\\NVIDIA\\DXCache\\*", "$env:LOCALAPPDATA\\AMD\\DxCache\\*" -Recurse -Force',
    applyScript: `Write-Host "  -> Limpando caches de shader NVIDIA e AMD..." -ForegroundColor Gray
$gpuCachePaths = @(
  "$env:LOCALAPPDATA\\NVIDIA\\DXCache",
  "$env:LOCALAPPDATA\\NVIDIA\\GLCache",
  "$env:LOCALAPPDATA\\AMD\\DxCache",
  "$env:LOCALAPPDATA\\AMD\\GLCache",
  "$env:LOCALAPPDATA\\AMD\\VkCache"
)
foreach ($p in $gpuCachePaths) {
  if (Test-Path $p) {
    Get-ChildItem -Path $p -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
  }
}`,
  },
  {
    id: 'temp_wu_cache',
    category: 'temp',
    subgroup: 'Caches de Atualização e Rede',
    title: 'Limpar Cache de Downloads do Windows Update',
    description:
      'Pausa temporariamente o serviço wuauserv, limpa pacotes baixados antigos em SoftwareDistribution\\Download e reinicia o serviço.',
    frametimeBenefit: 'Frequentemente libera vários GB em SSDs antigos',
    risk: 'seguro',
    defaultProfiles: ['low-latency', 'balanced', 'max-fps'],
    previewCommand: 'Stop-Service wuauserv; Remove-Item "$env:SystemRoot\\SoftwareDistribution\\Download\\*"; Start-Service wuauserv',
    applyScript: `Write-Host "  -> Limpando cache de download do Windows Update..." -ForegroundColor Gray
Stop-Service -Name "wuauserv" -Force -ErrorAction SilentlyContinue
if (Test-Path "$env:SystemRoot\\SoftwareDistribution\\Download") {
  Get-ChildItem -Path "$env:SystemRoot\\SoftwareDistribution\\Download" -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
}
Start-Service -Name "wuauserv" -ErrorAction SilentlyContinue`,
  },
  {
    id: 'temp_delivery_opt',
    category: 'temp',
    subgroup: 'Caches de Atualização e Rede',
    title: 'Limpar Cache do Otimizador de Entrega (Delivery Optimization)',
    description:
      'Remove arquivos de cache P2P guardados pelo Windows para redistribuição de atualizações na rede.',
    frametimeBenefit: 'Libera espaço oculto do sistema sem afetar updates',
    risk: 'seguro',
    defaultProfiles: ['low-latency', 'balanced', 'max-fps'],
    previewCommand: 'Delete-DeliveryOptimizationCache -Force',
    applyScript: `Write-Host "  -> Limpando cache Delivery Optimization..." -ForegroundColor Gray
Delete-DeliveryOptimizationCache -Force -ErrorAction SilentlyContinue`,
  },
  {
    id: 'temp_dns_flush',
    category: 'temp',
    subgroup: 'Caches de Atualização e Rede',
    title: 'Limpar Cache DNS (Flush DNS)',
    description:
      'Limpa entradas de resolução de nomes em cache no cliente DNS para evitar rotas antigas ao conectar em servidores Valve/FACEIT.',
    frametimeBenefit: 'Conexão mais limpa e resolução rápida de servidores',
    risk: 'seguro',
    defaultProfiles: ['low-latency', 'balanced', 'max-fps'],
    previewCommand: 'ipconfig /flushdns',
    applyScript: `Write-Host "  -> Executando Flush DNS..." -ForegroundColor Gray
ipconfig /flushdns | Out-Null`,
  },
  {
    id: 'temp_prefetch',
    category: 'temp',
    subgroup: 'Arquivos Temporários do Sistema',
    title: 'Limpar pasta Windows\\Prefetch',
    description:
      'Remove entradas antigas de pré-carregamento. Os aplicativos podem demorar 1 segundo a mais apenas na primeira abertura após a limpeza.',
    frametimeBenefit: 'Remove referências de programas já desinstalados',
    risk: 'moderado',
    defaultProfiles: ['max-fps'],
    previewCommand: 'Remove-Item "$env:SystemRoot\\Prefetch\\*" -Recurse -Force -ErrorAction SilentlyContinue',
    applyScript: `Write-Host "  -> Limpando pasta Prefetch..." -ForegroundColor Gray
if (Test-Path "$env:SystemRoot\\Prefetch") {
  Get-ChildItem -Path "$env:SystemRoot\\Prefetch" -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
}`,
  },
  {
    id: 'temp_recycle_bin',
    category: 'temp',
    subgroup: 'Arquivos Temporários do Sistema',
    title: 'Esvaziar Lixeira do Windows',
    description:
      'Exclui permanentemente todos os arquivos atualmente na Lixeira. Desmarcado por padrão para evitar perda acidental de arquivos.',
    frametimeBenefit: 'Recupera espaço em disco imediatamente',
    risk: 'moderado',
    defaultProfiles: [],
    previewCommand: 'Clear-RecycleBin -Force -ErrorAction SilentlyContinue',
    applyScript: `Write-Host "  -> Esvaziando Lixeira..." -ForegroundColor Gray
Clear-RecycleBin -Force -ErrorAction SilentlyContinue`,
  },

  // =========================================================================
  // CATEGORIA: PLANO DE ENERGIA (power)
  // =========================================================================
  {
    id: 'power_core_parking',
    category: 'power',
    subgroup: 'Processador & Latência de Núcleos',
    title: 'Desativar CPU Core Parking (100% dos Núcleos Ativos)',
    description:
      'Impede o Windows de estacionar núcleos ociosos na tomada (AC), evitando picos de latência quando o CS2 precisa de threads instantaneamente.',
    frametimeBenefit: 'Reduz quedas bruscas no 1% Low FPS durante smokes/tiroteios',
    risk: 'seguro',
    defaultProfiles: ['low-latency', 'max-fps'],
    previewCommand: 'powercfg -setacvalueindex SCHEME_CURRENT SUB_PROCESSOR CPMINCORES 100',
    applyScript: `Write-Host "  -> Desativando CPU Core Parking..." -ForegroundColor Gray
powercfg -setacvalueindex SCHEME_CURRENT SUB_PROCESSOR CPMINCORES 100
powercfg -setactive SCHEME_CURRENT`,
    revertScript: `powercfg -setacvalueindex SCHEME_CURRENT SUB_PROCESSOR CPMINCORES 10
powercfg -setactive SCHEME_CURRENT`,
  },
  {
    id: 'power_cpu_min_max',
    category: 'power',
    subgroup: 'Processador & Latência de Núcleos',
    title: 'Manter Desempenho Mínimo e Máximo da CPU em 100%',
    description:
      'Mantém o estado mínimo e máximo do processador em 100% no modo AC para eliminar atrasos de subida de clock (P-State ramp-up).',
    frametimeBenefit: 'Clock estável e resposta imediata de frametime',
    risk: 'seguro',
    defaultProfiles: ['low-latency', 'max-fps'],
    previewCommand: 'powercfg -setacvalueindex SCHEME_CURRENT SUB_PROCESSOR PROCTHROTTLEMIN 100',
    applyScript: `Write-Host "  -> Configurando CPU Min/Max em 100%..." -ForegroundColor Gray
powercfg -setacvalueindex SCHEME_CURRENT SUB_PROCESSOR PROCTHROTTLEMIN 100
powercfg -setacvalueindex SCHEME_CURRENT SUB_PROCESSOR PROCTHROTTLEMAX 100
powercfg -setactive SCHEME_CURRENT`,
    revertScript: `powercfg -setacvalueindex SCHEME_CURRENT SUB_PROCESSOR PROCTHROTTLEMIN 5
powercfg -setacvalueindex SCHEME_CURRENT SUB_PROCESSOR PROCTHROTTLEMAX 100
powercfg -setactive SCHEME_CURRENT`,
  },
  {
    id: 'power_usb_suspend',
    category: 'power',
    subgroup: 'Periféricos & Barramento PCIe',
    title: 'Desativar Suspensão Seletiva USB',
    description:
      'Impede o Windows de economizar energia nas portas USB. Essencial para mouses de 1000Hz a 8000Hz, headsets USB e adaptadores sem fio.',
    frametimeBenefit: 'Elimina micro-engasgos de polling rate no mouse',
    risk: 'seguro',
    defaultProfiles: ['low-latency', 'balanced', 'max-fps'],
    previewCommand: 'powercfg -setacvalueindex SCHEME_CURRENT 2a737441-1930-4402-8d77-b2bebba308a3 48e6b7a6-50f5-4782-a5d4-53bb8f07e226 0',
    applyScript: `Write-Host "  -> Desativando Suspensao Seletiva USB..." -ForegroundColor Gray
powercfg -setacvalueindex SCHEME_CURRENT 2a737441-1930-4402-8d77-b2bebba308a3 48e6b7a6-50f5-4782-a5d4-53bb8f07e226 0
powercfg -setactive SCHEME_CURRENT`,
    revertScript: `powercfg -setacvalueindex SCHEME_CURRENT 2a737441-1930-4402-8d77-b2bebba308a3 48e6b7a6-50f5-4782-a5d4-53bb8f07e226 1
powercfg -setactive SCHEME_CURRENT`,
  },
  {
    id: 'power_pcie_aspm',
    category: 'power',
    subgroup: 'Periféricos & Barramento PCIe',
    title: 'Desativar Gerenciamento de Energia PCI Express (ASPM)',
    description:
      'Desliga a economia de energia no barramento PCIe para que placa de vídeo e SSD NVMe operem sem transição de estado de baixa potência.',
    frametimeBenefit: 'Reduz latência de comunicação com a GPU e NVMe',
    risk: 'seguro',
    defaultProfiles: ['low-latency', 'max-fps'],
    previewCommand: 'powercfg -setacvalueindex SCHEME_CURRENT SUB_PCIEXPRESS ASPM 0',
    applyScript: `Write-Host "  -> Desativando PCI Express Link State Power Management..." -ForegroundColor Gray
powercfg -setacvalueindex SCHEME_CURRENT SUB_PCIEXPRESS ASPM 0
powercfg -setactive SCHEME_CURRENT`,
    revertScript: `powercfg -setacvalueindex SCHEME_CURRENT SUB_PCIEXPRESS ASPM 2
powercfg -setactive SCHEME_CURRENT`,
  },
  {
    id: 'power_disk_idle',
    category: 'power',
    subgroup: 'Periféricos & Barramento PCIe',
    title: 'Impedir Desligamento do Disco/SSD por Ociosidade',
    description:
      'Define o tempo para desligar o armazenamento como Nunca (0) enquanto ligado na tomada, evitando pausas ao carregar mapas ou demos.',
    frametimeBenefit: 'Zero atraso de I/O durante o carregamento de ativos',
    risk: 'seguro',
    defaultProfiles: ['low-latency', 'balanced', 'max-fps'],
    previewCommand: 'powercfg -setacvalueindex SCHEME_CURRENT SUB_DISK DISKIDLE 0',
    applyScript: `Write-Host "  -> Impedindo desligamento de disco por ociosidade..." -ForegroundColor Gray
powercfg -setacvalueindex SCHEME_CURRENT SUB_DISK DISKIDLE 0
powercfg -setactive SCHEME_CURRENT`,
    revertScript: `powercfg -setacvalueindex SCHEME_CURRENT SUB_DISK DISKIDLE 1200
powercfg -setactive SCHEME_CURRENT`,
  },
  {
    id: 'power_hibernate_off',
    category: 'power',
    subgroup: 'Sistema de Energia',
    title: 'Desativar Hibernação e Inicialização Rápida',
    description:
      'Desativa o arquivo hiberfil.sys (economiza gigabytes iguais à sua RAM no SSD) e garante reinicializações limpas do kernel do Windows.',
    frametimeBenefit: 'Libera até 16–32 GB no SSD e limpa estado do kernel',
    risk: 'moderado',
    defaultProfiles: ['max-fps'],
    previewCommand: 'powercfg /hibernate off',
    applyScript: `Write-Host "  -> Desativando Hibernacao..." -ForegroundColor Gray
powercfg /hibernate off`,
    revertScript: `powercfg /hibernate on`,
  },

  // =========================================================================
  // CATEGORIA: COUNTER-STRIKE 2 SISTEMA (cs2_sys)
  // =========================================================================
  {
    id: 'cs2_cpu_priority',
    category: 'cs2_sys',
    subgroup: 'Prioridade e Pipeline do Executável',
    title: 'Prioridade Alta de CPU para cs2.exe (Registro IFEO)',
    description:
      'Configura Image File Execution Options para iniciar o processo cs2.exe sempre com CpuPriorityClass = High (3), sem depender de parâmetro -high.',
    frametimeBenefit: 'Garante precedência de agendamento ao CS2 frente a apps em fundo',
    risk: 'seguro',
    defaultProfiles: ['low-latency', 'max-fps'],
    previewCommand: 'Set-ItemProperty "...\\Image File Execution Options\\cs2.exe\\PerfOptions" -Name CpuPriorityClass -Value 3',
    applyScript: `Write-Host "  -> Definindo prioridade Alta de CPU para cs2.exe..." -ForegroundColor Gray
$cs2IfeoPath = "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Image File Execution Options\\cs2.exe\\PerfOptions"
if (-not (Test-Path $cs2IfeoPath)) { New-Item -Path $cs2IfeoPath -Force | Out-Null }
Set-ItemProperty -Path $cs2IfeoPath -Name "CpuPriorityClass" -Value 3 -Type DWord`,
    revertScript: `Remove-Item -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Image File Execution Options\\cs2.exe" -Recurse -Force -ErrorAction SilentlyContinue`,
  },
  {
    id: 'cs2_fso_disable',
    category: 'cs2_sys',
    subgroup: 'Prioridade e Pipeline do Executável',
    title: 'Desativar Otimizações de Tela Cheia (Fullscreen Optimizations)',
    description:
      'Ajusta GameConfigStore para respeitar modo exclusivo de tela cheia, reduzindo camada extra de composição do DWM e input lag.',
    frametimeBenefit: 'Menor latência de exibição entre quadro renderizado e monitor',
    risk: 'seguro',
    defaultProfiles: ['low-latency', 'max-fps'],
    previewCommand: 'Set-ItemProperty "HKCU:\\System\\GameConfigStore" -Name GameDVR_FSEBehaviorMode -Value 2',
    applyScript: `Write-Host "  -> Desativando Fullscreen Optimizations no DWM..." -ForegroundColor Gray
$gcsPath = "HKCU:\\System\\GameConfigStore"
if (-not (Test-Path $gcsPath)) { New-Item -Path $gcsPath -Force | Out-Null }
Set-ItemProperty -Path $gcsPath -Name "GameDVR_FSEBehaviorMode" -Value 2 -Type DWord
Set-ItemProperty -Path $gcsPath -Name "GameDVR_HonorUserFSEBehaviorMode" -Value 1 -Type DWord
Set-ItemProperty -Path $gcsPath -Name "GameDVR_DXGIHonorFSEWindowsCompatible" -Value 1 -Type DWord`,
    revertScript: `Set-ItemProperty -Path "HKCU:\\System\\GameConfigStore" -Name "GameDVR_FSEBehaviorMode" -Value 0 -Type DWord -ErrorAction SilentlyContinue
Set-ItemProperty -Path "HKCU:\\System\\GameConfigStore" -Name "GameDVR_HonorUserFSEBehaviorMode" -Value 0 -Type DWord -ErrorAction SilentlyContinue
Set-ItemProperty -Path "HKCU:\\System\\GameConfigStore" -Name "GameDVR_DXGIHonorFSEWindowsCompatible" -Value 0 -Type DWord -ErrorAction SilentlyContinue`,
  },
  {
    id: 'cs2_mouse_accel_off',
    category: 'cs2_sys',
    subgroup: 'Input & Precisão de Mira',
    title: 'Desativar Aceleração do Mouse no Windows (Curva 1:1)',
    description:
      'Remove "Aprimorar precisão do ponteiro" (MouseSpeed=0, Threshold=0), garantindo movimento linear 1:1 no desktop e menus.',
    frametimeBenefit: 'Consistência muscular absoluta na mira',
    risk: 'seguro',
    defaultProfiles: ['low-latency', 'balanced', 'max-fps'],
    previewCommand: 'Set-ItemProperty "HKCU:\\Control Panel\\Mouse" -Name MouseSpeed -Value "0"',
    applyScript: `Write-Host "  -> Desativando aceleracao do mouse (Curva 1:1)..." -ForegroundColor Gray
$mousePath = "HKCU:\\Control Panel\\Mouse"
Set-ItemProperty -Path $mousePath -Name "MouseSpeed" -Value "0" -Type String
Set-ItemProperty -Path $mousePath -Name "MouseThreshold1" -Value "0" -Type String
Set-ItemProperty -Path $mousePath -Name "MouseThreshold2" -Value "0" -Type String`,
    revertScript: `$mousePath = "HKCU:\\Control Panel\\Mouse"
Set-ItemProperty -Path $mousePath -Name "MouseSpeed" -Value "1" -Type String
Set-ItemProperty -Path $mousePath -Name "MouseThreshold1" -Value "6" -Type String
Set-ItemProperty -Path $mousePath -Name "MouseThreshold2" -Value "10" -Type String`,
  },
  {
    id: 'cs2_mm_tasks_games',
    category: 'cs2_sys',
    subgroup: 'Prioridade e Pipeline do Executável',
    title: 'Prioridade Máxima de GPU e Agendamento para Jogos (MMCSS)',
    description:
      'Define GPU Priority = 8, Priority = 6 e Scheduling Category = High em Multimedia\\SystemProfile\\Tasks\\Games.',
    frametimeBenefit: 'Prioriza recursos de GPU e CPU para o loop do CS2',
    risk: 'seguro',
    defaultProfiles: ['low-latency', 'balanced', 'max-fps'],
    previewCommand: 'Set-ItemProperty "...\\Tasks\\Games" -Name "GPU Priority" -Value 8; "Scheduling Category" = "High"',
    applyScript: `Write-Host "  -> Ajustando prioridade MMCSS para Jogos..." -ForegroundColor Gray
$gamesTaskPath = "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games"
if (-not (Test-Path $gamesTaskPath)) { New-Item -Path $gamesTaskPath -Force | Out-Null }
Set-ItemProperty -Path $gamesTaskPath -Name "GPU Priority" -Value 8 -Type DWord
Set-ItemProperty -Path $gamesTaskPath -Name "Priority" -Value 6 -Type DWord
Set-ItemProperty -Path $gamesTaskPath -Name "Scheduling Category" -Value "High" -Type String
Set-ItemProperty -Path $gamesTaskPath -Name "SFIO Priority" -Value "High" -Type String`,
    revertScript: `$gamesTaskPath = "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games"
Set-ItemProperty -Path $gamesTaskPath -Name "GPU Priority" -Value 8 -Type DWord -ErrorAction SilentlyContinue
Set-ItemProperty -Path $gamesTaskPath -Name "Priority" -Value 2 -Type DWord -ErrorAction SilentlyContinue
Set-ItemProperty -Path $gamesTaskPath -Name "Scheduling Category" -Value "Medium" -Type String -ErrorAction SilentlyContinue
Set-ItemProperty -Path $gamesTaskPath -Name "SFIO Priority" -Value "Normal" -Type String -ErrorAction SilentlyContinue`,
  },
  {
    id: 'cs2_shadercache_clean',
    category: 'cs2_sys',
    subgroup: 'Manutenção do Jogo',
    title: 'Limpar Shader Cache do CS2 na Steam (AppID 730)',
    description:
      'Limpa o cache compilado da Steam para o CS2 caso esteja enfrentando travamentos após grandes atualizações de mapas.',
    frametimeBenefit: 'Corrige stutter após updates do CS2',
    risk: 'moderado',
    defaultProfiles: [],
    previewCommand: 'Remove-Item "C:\\Program Files (x86)\\Steam\\steamapps\\shadercache\\730\\*" -Recurse -Force',
    applyScript: `Write-Host "  -> Verificando Shader Cache do CS2 (730) na Steam..." -ForegroundColor Gray
$steamShader = "C:\\Program Files (x86)\\Steam\\steamapps\\shadercache\\730"
if (Test-Path $steamShader) {
  Get-ChildItem -Path $steamShader -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
}`,
  },

  // =========================================================================
  // CATEGORIA: OTIMIZAÇÕES GERAIS DO WINDOWS (windows)
  // =========================================================================
  {
    id: 'win_game_mode',
    category: 'windows',
    subgroup: 'Gráficos & Agendamento',
    title: 'Ativar Modo de Jogo (Game Mode) do Windows 11',
    description:
      'Ativa o Game Mode nativo para suspender tarefas de manutenção do Windows Update e notificações enquanto o CS2 está em execução.',
    frametimeBenefit: 'Evita quedas repentinas de FPS causadas por updates em segundo plano',
    risk: 'seguro',
    defaultProfiles: ['low-latency', 'balanced', 'max-fps'],
    previewCommand: 'Set-ItemProperty "HKCU:\\Software\\Microsoft\\GameBar" -Name AutoGameModeEnabled -Value 1',
    applyScript: `Write-Host "  -> Ativando Modo de Jogo do Windows..." -ForegroundColor Gray
$gbPath = "HKCU:\\Software\\Microsoft\\GameBar"
if (-not (Test-Path $gbPath)) { New-Item -Path $gbPath -Force | Out-Null }
Set-ItemProperty -Path $gbPath -Name "AllowAutoGameMode" -Value 1 -Type DWord
Set-ItemProperty -Path $gbPath -Name "AutoGameModeEnabled" -Value 1 -Type DWord`,
    revertScript: `Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\GameBar" -Name "AutoGameModeEnabled" -Value 0 -Type DWord -ErrorAction SilentlyContinue`,
  },
  {
    id: 'win_hags',
    category: 'windows',
    subgroup: 'Gráficos & Agendamento',
    title: 'Ativar Agendamento de GPU Acelerado por Hardware (HAGS)',
    description:
      'Transfere parte do gerenciamento de fila de VRAM e agendamento para o processador dedicado da própria GPU (necessita NVIDIA Reflex / GPUs modernas).',
    frametimeBenefit: 'Reduz latência de renderização e overhead de CPU em hardware forte',
    risk: 'seguro',
    requiresReboot: true,
    defaultProfiles: ['low-latency'],
    previewCommand: 'Set-ItemProperty "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers" -Name HwSchMode -Value 2',
    applyScript: `Write-Host "  -> Ativando HAGS (HwSchMode = 2)..." -ForegroundColor Gray
$gdPath = "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers"
if (-not (Test-Path $gdPath)) { New-Item -Path $gdPath -Force | Out-Null }
Set-ItemProperty -Path $gdPath -Name "HwSchMode" -Value 2 -Type DWord`,
    revertScript: `Set-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers" -Name "HwSchMode" -Value 1 -Type DWord -ErrorAction SilentlyContinue`,
  },
  {
    id: 'win_game_dvr_off',
    category: 'windows',
    subgroup: 'Gráficos & Agendamento',
    title: 'Desativar Xbox Game Bar e Captura Game DVR',
    description:
      'Impede a gravação contínua em segundo plano (DVR) e desativa sobreposições da Game Bar que consomem largura de banda da GPU.',
    frametimeBenefit: 'Menor latência de frame e menos uso de codificador/VRAM',
    risk: 'seguro',
    defaultProfiles: ['low-latency', 'balanced', 'max-fps'],
    previewCommand: 'Set-ItemProperty "HKCU:\\System\\GameConfigStore" -Name GameDVR_Enabled -Value 0',
    applyScript: `Write-Host "  -> Desativando Xbox Game Bar e Game DVR..." -ForegroundColor Gray
$gcs = "HKCU:\\System\\GameConfigStore"
$dvrUser = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR"
$dvrPolicy = "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\GameDVR"
foreach ($p in @($gcs, $dvrUser, $dvrPolicy)) { if (-not (Test-Path $p)) { New-Item -Path $p -Force | Out-Null } }
Set-ItemProperty -Path $gcs -Name "GameDVR_Enabled" -Value 0 -Type DWord
Set-ItemProperty -Path $dvrUser -Name "AppCaptureEnabled" -Value 0 -Type DWord
Set-ItemProperty -Path $dvrPolicy -Name "AllowGameDVR" -Value 0 -Type DWord`,
    revertScript: `Set-ItemProperty -Path "HKCU:\\System\\GameConfigStore" -Name "GameDVR_Enabled" -Value 1 -Type DWord -ErrorAction SilentlyContinue
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR" -Name "AppCaptureEnabled" -Value 1 -Type DWord -ErrorAction SilentlyContinue
Remove-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\GameDVR" -Name "AllowGameDVR" -ErrorAction SilentlyContinue`,
  },
  {
    id: 'win_priority_separation',
    category: 'windows',
    subgroup: 'Gráficos & Agendamento',
    title: 'Otimizar Win32PrioritySeparation (0x26 / 38)',
    description:
      'Configura o agendador do kernel para fatias de tempo curtas, variáveis e com prioridade alta para a janela em primeiro plano (o jogo).',
    frametimeBenefit: 'Melhora consistência de frametime e resposta de entrada',
    risk: 'moderado',
    requiresReboot: true,
    defaultProfiles: ['low-latency', 'max-fps'],
    previewCommand: 'Set-ItemProperty "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl" -Name Win32PrioritySeparation -Value 38',
    applyScript: `Write-Host "  -> Ajustando Win32PrioritySeparation para 0x26 (38)..." -ForegroundColor Gray
Set-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl" -Name "Win32PrioritySeparation" -Value 38 -Type DWord`,
    revertScript: `Set-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl" -Name "Win32PrioritySeparation" -Value 2 -Type DWord`,
  },
  {
    id: 'win_net_throttling',
    category: 'windows',
    subgroup: 'Rede & Jitter Competitivo',
    title: 'Desativar Network Throttling Index e SystemResponsiveness',
    description:
      'Remove o limite artificial de pacotes de rede multimídia do Windows (NetworkThrottlingIndex = 0xFFFFFFFF) e zera reserva de CPU ociosa para tarefas secundárias.',
    frametimeBenefit: 'Menor jitter de rede e entrega constante de pacotes sub-tick',
    risk: 'seguro',
    requiresReboot: true,
    defaultProfiles: ['low-latency', 'balanced', 'max-fps'],
    previewCommand: 'Set-ItemProperty "...\\Multimedia\\SystemProfile" -Name NetworkThrottlingIndex -Value 0xffffffff',
    applyScript: `Write-Host "  -> Desativando Network Throttling Index..." -ForegroundColor Gray
$mmPath = "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile"
Set-ItemProperty -Path $mmPath -Name "NetworkThrottlingIndex" -Value 4294967295 -Type DWord
Set-ItemProperty -Path $mmPath -Name "SystemResponsiveness" -Value 0 -Type DWord`,
    revertScript: `$mmPath = "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile"
Set-ItemProperty -Path $mmPath -Name "NetworkThrottlingIndex" -Value 10 -Type DWord
Set-ItemProperty -Path $mmPath -Name "SystemResponsiveness" -Value 20 -Type DWord`,
  },
  {
    id: 'win_nagle_off',
    category: 'windows',
    subgroup: 'Rede & Jitter Competitivo',
    title: 'Desativar Algoritmo de Nagle (TCPNoDelay & TcpAckFrequency)',
    description:
      'Aplica TCPNoDelay=1 e TcpAckFrequency=1 nas interfaces de rede ativas com IP configurado para enviar pacotes imediatamente sem agrupamento.',
    frametimeBenefit: 'Reduz latência em conexões TCP e serviços de matchmaking',
    risk: 'moderado',
    requiresReboot: true,
    defaultProfiles: ['low-latency'],
    previewCommand: 'Set-ItemProperty "...\\Tcpip\\Parameters\\Interfaces\\<ID>" -Name TCPNoDelay -Value 1',
    applyScript: `Write-Host "  -> Desativando Algoritmo de Nagle nas interfaces ativas..." -ForegroundColor Gray
$ifaces = Get-ChildItem "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces" -ErrorAction SilentlyContinue
foreach ($iface in $ifaces) {
  $props = Get-ItemProperty -Path $iface.PSPath -ErrorAction SilentlyContinue
  if ($props.DhcpIPAddress -or $props.IPAddress) {
    Set-ItemProperty -Path $iface.PSPath -Name "TCPNoDelay" -Value 1 -Type DWord -ErrorAction SilentlyContinue
    Set-ItemProperty -Path $iface.PSPath -Name "TcpAckFrequency" -Value 1 -Type DWord -ErrorAction SilentlyContinue
  }
}`,
    revertScript: `$ifaces = Get-ChildItem "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces" -ErrorAction SilentlyContinue
foreach ($iface in $ifaces) {
  Remove-ItemProperty -Path $iface.PSPath -Name "TCPNoDelay" -ErrorAction SilentlyContinue
  Remove-ItemProperty -Path $iface.PSPath -Name "TcpAckFrequency" -ErrorAction SilentlyContinue
}`,
  },
  {
    id: 'win_background_apps',
    category: 'windows',
    subgroup: 'Sistema, Serviços & Interface',
    title: 'Bloquear Aplicativos UWP em Segundo Plano',
    description:
      'Define LetAppsRunInBackground = 2 na política AppPrivacy, evitando que apps da Microsoft Store consumam CPU ou rede durante as partidas.',
    frametimeBenefit: 'Elimina picos aleatórios de uso de CPU em segundo plano',
    risk: 'seguro',
    defaultProfiles: ['low-latency', 'max-fps'],
    previewCommand: 'Set-ItemProperty "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\AppPrivacy" -Name LetAppsRunInBackground -Value 2',
    applyScript: `Write-Host "  -> Bloqueando apps UWP em segundo plano..." -ForegroundColor Gray
$appPriv = "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\AppPrivacy"
if (-not (Test-Path $appPriv)) { New-Item -Path $appPriv -Force | Out-Null }
Set-ItemProperty -Path $appPriv -Name "LetAppsRunInBackground" -Value 2 -Type DWord`,
    revertScript: `Remove-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\AppPrivacy" -Name "LetAppsRunInBackground" -ErrorAction SilentlyContinue`,
  },
  {
    id: 'win_transparency_off',
    category: 'windows',
    subgroup: 'Sistema, Serviços & Interface',
    title: 'Desativar Efeitos de Transparência (Mica/Acrylic)',
    description:
      'Desliga a transparência translúcida nas janelas do Windows 11 para reduzir trabalho desnecessário do Desktop Window Manager (DWM).',
    frametimeBenefit: 'Menor carga no DWM quando usando Alt+Tab ou modo janela',
    risk: 'seguro',
    defaultProfiles: ['low-latency', 'max-fps'],
    previewCommand: 'Set-ItemProperty "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Name EnableTransparency -Value 0',
    applyScript: `Write-Host "  -> Desativando transparencia da interface..." -ForegroundColor Gray
$pers = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize"
if (-not (Test-Path $pers)) { New-Item -Path $pers -Force | Out-Null }
Set-ItemProperty -Path $pers -Name "EnableTransparency" -Value 0 -Type DWord`,
    revertScript: `Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Name "EnableTransparency" -Value 1 -Type DWord -ErrorAction SilentlyContinue`,
  },
  {
    id: 'win_visual_fx',
    category: 'windows',
    subgroup: 'Sistema, Serviços & Interface',
    title: 'Otimizar Efeitos Visuais mantendo Fontes Nítidas',
    description:
      'Ajusta VisualFXSetting para modo personalizado focado em desempenho, mas mantém FontSmoothing e arrasto de janela legíveis.',
    frametimeBenefit: 'Menus do Windows mais ágeis com menor overhead gráfico',
    risk: 'seguro',
    defaultProfiles: ['max-fps'],
    previewCommand: 'Set-ItemProperty "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects" -Name VisualFXSetting -Value 3',
    applyScript: `Write-Host "  -> Otimizando efeitos visuais do Windows..." -ForegroundColor Gray
$vfx = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects"
if (-not (Test-Path $vfx)) { New-Item -Path $vfx -Force | Out-Null }
Set-ItemProperty -Path $vfx -Name "VisualFXSetting" -Value 3 -Type DWord
Set-ItemProperty -Path "HKCU:\\Control Panel\\Desktop" -Name "FontSmoothing" -Value "2" -Type String
Set-ItemProperty -Path "HKCU:\\Control Panel\\Desktop" -Name "DragFullWindows" -Value "1" -Type String`,
    revertScript: `Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects" -Name "VisualFXSetting" -Value 0 -Type DWord -ErrorAction SilentlyContinue`,
  },
  {
    id: 'win_telemetry_reduce',
    category: 'windows',
    subgroup: 'Sistema, Serviços & Interface',
    title: 'Desativar Serviço de Telemetria (DiagTrack)',
    description:
      'Para o serviço Connected User Experiences and Telemetry (DiagTrack) e altera a inicialização para Manual, reduzindo escritas em disco.',
    frametimeBenefit: 'Menos I/O em segundo plano e menor tráfego de rede ocioso',
    risk: 'moderado',
    defaultProfiles: ['low-latency', 'max-fps'],
    previewCommand: 'Stop-Service DiagTrack; Set-Service DiagTrack -StartupType Disabled',
    applyScript: `Write-Host "  -> Reduzindo servico de telemetria DiagTrack..." -ForegroundColor Gray
Stop-Service -Name "DiagTrack" -Force -ErrorAction SilentlyContinue
Set-Service -Name "DiagTrack" -StartupType Disabled -ErrorAction SilentlyContinue`,
    revertScript: `Set-Service -Name "DiagTrack" -StartupType Automatic -ErrorAction SilentlyContinue
Start-Service -Name "DiagTrack" -ErrorAction SilentlyContinue`,
  },
  {
    id: 'win_sysmain_off',
    category: 'windows',
    subgroup: 'Sistema, Serviços & Interface',
    title: 'Desativar SysMain (Superfetch) para SSD/NVMe',
    description:
      'Desativa o pré-carregamento agressivo em memória RAM. Recomendado apenas se o sistema roda em SSD/NVMe rápido com 16GB+ de RAM.',
    frametimeBenefit: 'Reduz atividade constante de leitura/escrita em SSD',
    risk: 'avancado',
    defaultProfiles: ['max-fps'],
    previewCommand: 'Stop-Service SysMain; Set-Service SysMain -StartupType Disabled',
    applyScript: `Write-Host "  -> Desativando SysMain (Superfetch)..." -ForegroundColor Gray
Stop-Service -Name "SysMain" -Force -ErrorAction SilentlyContinue
Set-Service -Name "SysMain" -StartupType Disabled -ErrorAction SilentlyContinue`,
    revertScript: `Set-Service -Name "SysMain" -StartupType Automatic -ErrorAction SilentlyContinue
Start-Service -Name "SysMain" -ErrorAction SilentlyContinue`,
  },
  {
    id: 'win_search_index_off',
    category: 'windows',
    subgroup: 'Sistema, Serviços & Interface',
    title: 'Desativar Indexação do Windows Search (WSearch)',
    description:
      'Interrompe a indexação contínua de arquivos em disco. A busca do Menu Iniciar pode demorar mais para arquivos locais.',
    frametimeBenefit: 'Elimina picos de disco durante partidas longas',
    risk: 'avancado',
    defaultProfiles: ['max-fps'],
    previewCommand: 'Stop-Service WSearch; Set-Service WSearch -StartupType Disabled',
    applyScript: `Write-Host "  -> Desativando Windows Search (WSearch)..." -ForegroundColor Gray
Stop-Service -Name "WSearch" -Force -ErrorAction SilentlyContinue
Set-Service -Name "WSearch" -StartupType Disabled -ErrorAction SilentlyContinue`,
    revertScript: `Set-Service -Name "WSearch" -StartupType Automatic -ErrorAction SilentlyContinue
Start-Service -Name "WSearch" -ErrorAction SilentlyContinue`,
  },
];

export function getDefaultTweaksForProfile(profile: ProfileId): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const tweak of TWEAKS_CATALOG) {
    result[tweak.id] = tweak.defaultProfiles.includes(profile);
  }
  return result;
}

export function getDefaultPowerConfigForProfile(profile: ProfileId): PowerConfig {
  if (profile === 'balanced') {
    return { plan: 'high', monitorTimeoutMinutes: 15 };
  }
  return { plan: 'ultimate', monitorTimeoutMinutes: 0 };
}

export function getDefaultCs2ConfigForProfile(profile: ProfileId): Cs2Config {
  const sharedExtras = {
    viewmodelPresetPos: 0 as const,
    viewmodelFov: 68,
    viewmodelOffsetX: 2.5,
    viewmodelOffsetY: 2.0,
    viewmodelOffsetZ: -1.5,
    hudColor: 0,
    applySensitivityInAutoexec: true,
    mouseSensitivity: 1.5,
    zoomSensitivityRatio: 1.0,
    bindVoiceEnabled: true,
    bindVoiceKey: 'v',
    radarHudScale: 1.15,
    radarIconScaleMin: 0.85,
    radarBackgroundAlpha: 0.63,
    radarRotate: true,
    radarSquareAlways: false,
    radarSquareWithScoreboard: true,
    radarMapAdditive: true,
    teammateColorsShow: 2 as const,
  };

  if (profile === 'max-fps') {
    return {
      launchHighPriority: true,
      launchNoJoy: true,
      launchExecAutoexec: true,
      launchFullscreen: true,
      launchThreadsEnabled: false,
      launchThreadsCount: 8,
      launchRefreshRateEnabled: false,
      launchRefreshRate: 240,
      launchExtraArgs: '',
      fpsMax: 0,
      fpsMaxUi: 120,
      lowLatencySleep: true,
      rate: 1000000,
      netBufferTicks: 0,
      maxPing: 60,
      fullscreenGamma: 2.1,
      hideBuildInfo: true,
      telemetryFrametime: '2',
      telemetryPing: '2',
      telemetryPacketLoss: '1',
      headphoneEq: '1',
      perspectiveCorrection: true,
      radarScale: 0.45,
      radarAlwaysCentered: false,
      useOpensBuyMenu: false,
      bindScrollJump: true,
      bindRadarZoom: true,
      bindClutchMute: true,
      ...sharedExtras,
    };
  }
  if (profile === 'balanced') {
    return {
      launchHighPriority: false,
      launchNoJoy: true,
      launchExecAutoexec: true,
      launchFullscreen: false,
      launchThreadsEnabled: false,
      launchThreadsCount: 8,
      launchRefreshRateEnabled: false,
      launchRefreshRate: 144,
      launchExtraArgs: '',
      fpsMax: 300,
      fpsMaxUi: 144,
      lowLatencySleep: true,
      rate: 786432,
      netBufferTicks: 1,
      maxPing: 70,
      fullscreenGamma: 2.2,
      hideBuildInfo: true,
      telemetryFrametime: '1',
      telemetryPing: '1',
      telemetryPacketLoss: '1',
      headphoneEq: '0',
      perspectiveCorrection: true,
      radarScale: 0.5,
      radarAlwaysCentered: false,
      useOpensBuyMenu: false,
      bindScrollJump: false,
      bindRadarZoom: false,
      bindClutchMute: false,
      ...sharedExtras,
    };
  }
  // low-latency (Default for strong hardware)
  return {
    launchHighPriority: true,
    launchNoJoy: true,
    launchExecAutoexec: true,
    launchFullscreen: true,
    launchThreadsEnabled: false,
    launchThreadsCount: 8,
    launchRefreshRateEnabled: false,
    launchRefreshRate: 240,
    launchExtraArgs: '',
    fpsMax: 0,
    fpsMaxUi: 144,
    lowLatencySleep: true,
    rate: 1000000,
    netBufferTicks: 0,
    maxPing: 55,
    fullscreenGamma: 2.1,
    hideBuildInfo: true,
    telemetryFrametime: '2',
    telemetryPing: '2',
    telemetryPacketLoss: '1',
    headphoneEq: '1',
    perspectiveCorrection: true,
    radarScale: 0.45,
    radarAlwaysCentered: false,
    useOpensBuyMenu: false,
    bindScrollJump: true,
    bindRadarZoom: true,
    bindClutchMute: true,
    ...sharedExtras,
  };
}
