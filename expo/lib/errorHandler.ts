import { Alert } from 'react-native';

export type AppErrorType = 'network' | 'auth' | 'validation' | 'server' | 'unknown';

export interface AppError {
  type: AppErrorType;
  message: string;
  originalError?: unknown;
  code?: string;
}

const ERROR_MESSAGES: Record<AppErrorType, string> = {
  network: 'Problème de connexion. Vérifiez votre réseau et réessayez.',
  auth: 'Session expirée. Veuillez vous reconnecter.',
  validation: 'Données invalides. Vérifiez vos informations.',
  server: 'Le serveur est momentanément indisponible. Réessayez plus tard.',
  unknown: 'Une erreur inattendue est survenue.',
};

export function classifyError(error: unknown): AppError {
  if (error instanceof TypeError && error.message.includes('Network request failed')) {
    return { type: 'network', message: ERROR_MESSAGES.network, originalError: error };
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();

    if (msg.includes('unauthorized') || msg.includes('401') || msg.includes('session')) {
      return { type: 'auth', message: ERROR_MESSAGES.auth, originalError: error };
    }

    if (msg.includes('validation') || msg.includes('invalid') || msg.includes('400')) {
      return { type: 'validation', message: error.message, originalError: error };
    }

    if (msg.includes('500') || msg.includes('server')) {
      return { type: 'server', message: ERROR_MESSAGES.server, originalError: error };
    }

    return { type: 'unknown', message: error.message || ERROR_MESSAGES.unknown, originalError: error };
  }

  return { type: 'unknown', message: ERROR_MESSAGES.unknown, originalError: error };
}

export function showErrorAlert(error: unknown, title?: string) {
  const appError = classifyError(error);
  console.error(`[ErrorHandler] ${appError.type}:`, appError.message, appError.originalError);

  Alert.alert(
    title || 'Erreur',
    appError.message,
    [{ text: 'OK', style: 'default' }]
  );

  return appError;
}

export function handleApiError(error: unknown, context?: string): AppError {
  const appError = classifyError(error);
  console.error(`[API Error${context ? ` - ${context}` : ''}]`, appError.type, appError.message);
  return appError;
}
