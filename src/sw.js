import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';

precacheAndRoute(self.__WB_MANIFEST);

/* Las fuentes vienen de Google Fonts, así que el precache del manifiesto
   no las alcanza: hay que enrutarlas a mano. Sin esto la app instalada
   arranca sin conexión con la pila de respaldo del sistema. */
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new CacheFirst({ cacheName: 'google-fonts-stylesheets' }),
);

registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({ cacheName: 'google-fonts-webfonts' }),
);

const scheduledNotifications = new Map();

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'SCHEDULE_NOTIFICATIONS') return;

  const { habits } = event.data;

  habits.forEach(({ habitId, habitName, notificationTime, isTodayDone }) => {
    if (scheduledNotifications.has(habitId)) {
      clearTimeout(scheduledNotifications.get(habitId));
      scheduledNotifications.delete(habitId);
    }

    if (isTodayDone || !notificationTime) return;

    const [hours, minutes] = notificationTime.split(':').map(Number);
    const now = new Date();
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);
    const delay = target - now;

    if (delay <= 0) return;

    const timeoutId = setTimeout(() => {
      scheduledNotifications.delete(habitId);
      self.registration.showNotification(habitName, {
        body: '¡No olvides registrar tu habito de hoy!',
        icon: '/HabitTrackerNautilus/icon.svg',
        tag: `habit-${habitId}`,
        renotify: false,
      });
    }, delay);

    scheduledNotifications.set(habitId, timeoutId);
  });
});
