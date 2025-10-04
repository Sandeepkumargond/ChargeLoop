'use client';

import { NotificationProvider as BaseNotificationProvider } from '../contexts/NotificationContext';

export default function ClientNotificationProvider({ children }) {
  return <BaseNotificationProvider>{children}</BaseNotificationProvider>;
}
