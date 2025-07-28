/**
 * Sistema de logging aprimorado para debugging de sessão e extração
 */
export class DebugLogger {
  private static instance: DebugLogger;
  private logs: Array<{ timestamp: string; level: string; component: string; message: string; data?: any }> = [];
  private maxLogs = 100;

  static getInstance(): DebugLogger {
    if (!DebugLogger.instance) {
      DebugLogger.instance = new DebugLogger();
    }
    return DebugLogger.instance;
  }

  private formatTimestamp(): string {
    return new Date().toISOString().split('T')[1].split('.')[0];
  }

  private addLog(level: string, component: string, message: string, data?: any) {
    const log = {
      timestamp: this.formatTimestamp(),
      level,
      component,
      message,
      data
    };

    this.logs.push(log);
    
    // Manter apenas os últimos logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log no console com formatação
    const emoji = this.getEmoji(level);
    const prefix = `${emoji} [${component}]`;
    
    if (data) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }

  private getEmoji(level: string): string {
    switch (level) {
      case 'INFO': return 'ℹ️';
      case 'SUCCESS': return '✅';
      case 'WARNING': return '⚠️';
      case 'ERROR': return '❌';
      case 'DEBUG': return '🔍';
      case 'SESSION': return '🔐';
      case 'EXTRACTION': return '📱';
      default: return '📝';
    }
  }

  info(component: string, message: string, data?: any) {
    this.addLog('INFO', component, message, data);
  }

  success(component: string, message: string, data?: any) {
    this.addLog('SUCCESS', component, message, data);
  }

  warning(component: string, message: string, data?: any) {
    this.addLog('WARNING', component, message, data);
  }

  error(component: string, message: string, data?: any) {
    this.addLog('ERROR', component, message, data);
  }

  debug(component: string, message: string, data?: any) {
    this.addLog('DEBUG', component, message, data);
  }

  session(component: string, message: string, data?: any) {
    this.addLog('SESSION', component, message, data);
  }

  extraction(component: string, message: string, data?: any) {
    this.addLog('EXTRACTION', component, message, data);
  }

  getLogs(): Array<{ timestamp: string; level: string; component: string; message: string; data?: any }> {
    return [...this.logs];
  }

  getLogsSummary(): string {
    const recent = this.logs.slice(-10);
    return recent.map(log => 
      `[${log.timestamp}] ${log.level} ${log.component}: ${log.message}`
    ).join('\n');
  }

  clearLogs() {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Instância global para facilitar o uso
export const debugLogger = DebugLogger.getInstance();