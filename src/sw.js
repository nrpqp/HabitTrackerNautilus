import { precacheAndRoute } from 'workbox-precaching';

precacheAndRoute(self.__WB_MANIFEST);

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
