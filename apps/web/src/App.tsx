import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';

type Translation = { ru: string; en: string };

interface User {
  id: string;
  email: string;
  displayName: string;
}

interface News {
  id: string;
  category: string;
  title: Translation;
  lead: Translation;
  body: { ru: string[]; en: string[] };
  publishedAt: string;
  relatedEventId: string | null;
}

interface Event {
  id: string;
  category: string;
  startsAt: string;
  title: Translation;
  description: Translation;
  price: number;
  capacity: number;
  soldCount: number;
  remainingSeats: number;
  club: { id: string; name: Translation };
  location: null | {
    id: string;
    name: Translation;
    block: string;
    floor: number | null;
    x: number;
    y: number;
  };
  locationDescription: Translation | null;
}

interface EventRegistration {
  id: string;
  eventId: string;
  paymentStatus: 'NOT_REQUIRED' | 'SIMULATED_PAID';
  createdAt: string;
  event: Event;
}

interface ManagedClub {
  clubId: string;
  role: string;
  name: Translation;
}

interface Location {
  id: string;
  kind: string;
  category: string;
  name: Translation;
  keywords: string;
  x: number;
  y: number;
  block: string;
  floor: number | null;
}

interface Resource<T> {
  data: T | null;
  loading: boolean;
  error: string;
  reload: () => void;
}

type Language = 'ru' | 'en';
type PageName = 'home' | 'news' | 'events' | 'map' | 'my-events' | 'organize' | 'login' | 'register' | 'not-found';

const API_URL = import.meta.env.VITE_API_URL ?? '/api';
const MAP_WIDTH = 1382;
const MAP_HEIGHT = 2576;
const UI: Record<Language, Record<string, string>> = {
  ru: {
    home: 'Главная', news: 'Новости', events: 'Мероприятия', map: 'Карта',
    myEvents: 'Мои мероприятия', login: 'Войти', register: 'Регистрация', logout: 'Выйти',
    today: 'Сегодня в SDU', subtitle: 'Новости, мероприятия и карта кампуса в одном месте.',
    latestNews: 'Свежие новости', upcomingEvents: 'Ближайшие мероприятия', allNews: 'Все новости',
    allEvents: 'Все мероприятия', readMore: 'Читать новость', back: 'Назад ко всем',
    loading: 'Загружаем данные…', retry: 'Повторить', noNews: 'Новостей пока нет.',
    noEvents: 'Мероприятий пока нет.', search: 'Поиск по новостям', mapSearch: 'Кабинет или место: D-105, библиотека…',
    find: 'Найти', places: 'Места на кампусе', floor: 'Этаж', allFloors: 'Все этажи',
    category: 'Категория', allCategories: 'Все категории', noLocations: 'Места не найдены.',
    zoomIn: 'Увеличить карту', zoomOut: 'Уменьшить карту', resetZoom: 'Сбросить масштаб',
    createEvent: 'Создать мероприятие', eventTitle: 'Название', eventDescription: 'Описание',
    titleRu: 'Название на русском', titleEn: 'Название на английском',
    descriptionRu: 'Описание на русском', descriptionEn: 'Описание на английском',
    startsAt: 'Дата и время', price: 'Цена (₸)', capacity: 'Вместимость',
    selectClub: 'Клуб', selectLocation: 'Место на кампусе', noLocation: 'Без места на карте',
    create: 'Создать', attendees: 'Кто ещё идёт', searchAttendees: 'Найти участника',
    noAttendees: 'Других участников пока нет.', registerToSeeAttendees: 'Запишитесь на событие, чтобы увидеть участников.',
    noAdminClubs: 'У вас нет клубов, где вы администратор.', clearSelection: 'Снять выбор',
    free: 'Бесплатно', remaining: 'Осталось мест', soldOut: 'Мест нет',
    registerEvent: 'Записаться', alreadyRegistered: 'Вы записаны на это мероприятие.',
    registered: 'Вы успешно записались на мероприятие.', loginToRegister: 'Войдите, чтобы записаться.',
    simulatePayment: 'Подтвердить тестовую оплату', paymentTitle: 'Тестовая оплата',
    paymentNotice: 'Это имитация оплаты для учебного проекта. Деньги не списываются, данные карты вводить не нужно.',
    paymentAmount: 'К оплате', paymentDone: 'Тестовая оплата подтверждена — деньги не списывались.',
    paymentFree: 'Оплата не требуется', cancelPayment: 'Отмена',
    noRegistrations: 'Вы ещё не записаны ни на одно мероприятие.', eventRegistration: 'Запись на мероприятие',
    loginTitle: 'Войти в SDU Today', signupTitle: 'Создать аккаунт',
    email: 'Университетская почта', password: 'Пароль', fullName: 'Имя и фамилия',
    confirmPassword: 'Подтвердите пароль', noAccount: 'Нет аккаунта?', haveAccount: 'Уже зарегистрированы?',
    signIn: 'Войти', signUp: 'Зарегистрироваться', passwordHint: 'Не менее 8 символов.',
    loggedOut: 'Вы вышли из аккаунта.', registerSuccess: 'Аккаунт создан. Теперь войдите.',
    signedInAs: 'Вы вошли как', organizer: 'Организатор', location: 'Место', date: 'Дата',
    categoryLabel: 'Тип', relatedEvent: 'Связанное мероприятие', freeOnly: 'Только бесплатные',
    all: 'Все', errorFallback: 'Не удалось загрузить данные.', noSession: 'Необходимо войти в аккаунт.',
  },
  en: {
    home: 'Home', news: 'News', events: 'Events', map: 'Map', myEvents: 'My events',
    login: 'Login', register: 'Register', logout: 'Log out', today: 'Today at SDU',
    subtitle: 'News, events and the campus map in one place.', latestNews: 'Latest news',
    upcomingEvents: 'Upcoming events', allNews: 'All news', allEvents: 'All events',
    readMore: 'Read article', back: 'Back to all', loading: 'Loading…', retry: 'Retry',
    noNews: 'No news yet.', noEvents: 'No events yet.', search: 'Search news',
    mapSearch: 'Room or place: D-105, library…', find: 'Find', places: 'Campus locations',
    floor: 'Floor', allFloors: 'All floors', category: 'Category', allCategories: 'All categories',
    noLocations: 'No locations found.', zoomIn: 'Zoom in', zoomOut: 'Zoom out',
    resetZoom: 'Reset zoom', free: 'Free', remaining: 'Places left', soldOut: 'Full',
    createEvent: 'Create event', eventTitle: 'Title', eventDescription: 'Description',
    titleRu: 'Title in Russian', titleEn: 'Title in English',
    descriptionRu: 'Description in Russian', descriptionEn: 'Description in English',
    startsAt: 'Date and time', price: 'Price (₸)', capacity: 'Capacity',
    selectClub: 'Club', selectLocation: 'Campus location', noLocation: 'No map location',
    create: 'Create', attendees: 'Who else is going', searchAttendees: 'Find an attendee',
    noAttendees: 'No other attendees yet.', registerToSeeAttendees: 'Register for this event to see its attendees.',
    noAdminClubs: 'You do not administer any clubs.', clearSelection: 'Clear selection',
    registerEvent: 'Register', alreadyRegistered: 'You are registered for this event.',
    registered: 'You are now registered.', loginToRegister: 'Sign in to register for events.',
    simulatePayment: 'Confirm test payment', paymentTitle: 'Test payment',
    paymentNotice: 'This is a payment simulation for an educational project. No money will be charged, and no card details are needed.',
    paymentAmount: 'Amount due', paymentDone: 'Test payment confirmed — no money was charged.',
    paymentFree: 'No payment required', cancelPayment: 'Cancel',
    noRegistrations: 'You have no event registrations yet.', eventRegistration: 'Event registration',
    loginTitle: 'Sign in to SDU Today', signupTitle: 'Create an account',
    email: 'University email', password: 'Password', fullName: 'Full name',
    confirmPassword: 'Confirm password', noAccount: 'New here?', haveAccount: 'Already registered?',
    signIn: 'Sign in', signUp: 'Create account', passwordHint: 'At least 8 characters.',
    loggedOut: 'You are signed out.', registerSuccess: 'Account created. Please sign in.',
    signedInAs: 'Signed in as', organizer: 'Organizer', location: 'Location', date: 'Date',
    categoryLabel: 'Type', relatedEvent: 'Related event', freeOnly: 'Free only', all: 'All',
    errorFallback: 'Unable to load data.', noSession: 'Please sign in.',
  },
};

const CATEGORY_LABELS: Record<string, Translation> = {
  academics: { ru: 'Учёба', en: 'Academics' },
  campus: { ru: 'Кампус', en: 'Campus' },
  announce: { ru: 'Объявления', en: 'Announcements' },
  achieve: { ru: 'Достижения', en: 'Achievements' },
  concert: { ru: 'Концерт', en: 'Concert' },
  sport: { ru: 'Турнир', en: 'Tournament' },
  talk: { ru: 'Встреча', en: 'Talk' },
  tech: { ru: 'Технологии', en: 'Technology' },
  social: { ru: 'Клубное мероприятие', en: 'Club event' },
  room: { ru: 'Аудитория', en: 'Room' },
  hall: { ru: 'Зал', en: 'Hall' },
  food: { ru: 'Еда', en: 'Food' },
  service: { ru: 'Сервис', en: 'Service' },
  wc: { ru: 'Уборная', en: 'Restroom' },
  entrance: { ru: 'Вход', en: 'Entrance' },
};

function messageForError(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

async function apiRequest<T>(path: string, body?: object): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: body ? 'POST' : 'GET',
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Не удаётся подключиться к API. Убедитесь, что backend запущен.');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => null) as {
      message?: string | string[];
    } | null;
    const message = Array.isArray(error?.message)
      ? error.message.join(' ')
      : error?.message;
    throw new Error(message ?? `Request failed (${response.status}).`);
  }

  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}

function useResource<T>(path: string | null, version = 0): Resource<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState('');
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    if (!path) {
      setData(null);
      setLoading(false);
      setError('');
      return;
    }

    let active = true;
    setLoading(true);
    setError('');
    apiRequest<T>(path)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((requestError: unknown) => {
        if (active) {
          setData(null);
          setError(messageForError(requestError, UI.ru.errorFallback));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    setData(null);

    return () => {
      active = false;
    };
  }, [path, version, reloadCount]);

  return {
    data,
    loading,
    error,
    reload: () => setReloadCount((count) => count + 1),
  };
}

function currentRoute(): { page: PageName; id: string | null } {
  const parts = window.location.pathname.split('/').filter(Boolean);
  const first = parts[0] ?? 'home';
  const pages: PageName[] = ['news', 'events', 'map', 'my-events', 'organize', 'login', 'register'];
  if (first === 'home') return { page: 'home', id: null };
  if (pages.includes(first as PageName)) {
    return { page: first as PageName, id: parts[1] ? decodeURIComponent(parts[1]) : null };
  }
  return { page: 'not-found', id: null };
}

function label(value: Translation | null | undefined, language: Language): string {
  if (!value) return '';
  return value[language] || value.ru || value.en || '';
}

function dateText(value: string, language: Language, withTime = false): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(language === 'ru' ? 'ru-RU' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date);
}

function categoryLabel(category: string, language: Language): string {
  return label(CATEGORY_LABELS[category], language) || category;
}

function initialEventDateTime(): string {
  const date = new Date(Date.now() + 86_400_000);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export function App() {
  const route = currentRoute();
  const [language, setLanguage] = useState<Language>(() =>
    localStorage.getItem('sdutoday.lang') === 'en' ? 'en' : 'ru',
  );
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState('');
  const notice =
    new URLSearchParams(window.location.search).get('registered') === '1'
      ? UI.ru.registerSuccess
      : '';
  const [newsQuery, setNewsQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [locationCategory, setLocationCategory] = useState('all');
  const [locationFloor, setLocationFloor] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [mapZoom, setMapZoom] = useState(1);
  const mapViewport = useRef<HTMLDivElement>(null);
  const mapZoomAnchor = useRef<{ x: number; y: number } | null>(null);
  const [registrationVersion, setRegistrationVersion] = useState(0);
  const [eventMessage, setEventMessage] = useState('');
  const [paymentEventId, setPaymentEventId] = useState<string | null>(null);
  const [attendeeQuery, setAttendeeQuery] = useState('');
  const [eventCreateError, setEventCreateError] = useState('');
  const [busy, setBusy] = useState(false);

  const t = (key: string) => UI[language][key] ?? UI.ru[key] ?? key;
  const newsPath = route.page === 'news' ? (route.id ? `/news/${encodeURIComponent(route.id)}` : '/news')
    : route.page === 'home' ? '/news' : null;
  const eventsPath = route.page === 'events' ? (route.id ? `/events/${encodeURIComponent(route.id)}` : '/events')
    : route.page === 'home' ? '/events' : null;
  const newsResource = useResource<News | News[]>(newsPath);
  const eventsResource = useResource<Event | Event[]>(eventsPath, registrationVersion);
  const locationsResource = useResource<Location[]>(
    route.page === 'map' || route.page === 'organize' ? '/locations' : null,
  );
  const clubsResource = useResource<ManagedClub[]>(user ? '/clubs/mine' : null);
  const registrationsResource = useResource<EventRegistration[]>(
    user && (route.page === 'my-events' || route.page === 'events' || route.page === 'home')
      ? '/events/registrations/me'
      : null,
    registrationVersion,
  );
  const eventAttendeesResource = useResource<string[]>(
    user && route.page === 'events' && route.id &&
      registrationsResource.data?.some((registration) => registration.eventId === route.id)
      ? `/events/${encodeURIComponent(route.id)}/attendees`
      : null,
    registrationVersion,
  );

  useEffect(() => {
    let active = true;
    apiRequest<User>('/auth/me')
      .then((profile) => {
        if (active) setUser(profile);
      })
      .catch((error: unknown) => {
        if (active && error instanceof Error && error.message !== 'Authentication required.') {
          setAuthError(error.message);
        }
      })
      .finally(() => {
        if (active) setAuthReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const news = useMemo(() => {
    const value = newsResource.data;
    return (Array.isArray(value) ? value : value ? [value] : []);
  }, [newsResource.data]);
  const events = useMemo(() => {
    const value = eventsResource.data;
    return (Array.isArray(value) ? value : value ? [value] : []);
  }, [eventsResource.data]);
  const registrations = registrationsResource.data ?? [];
  const registeredEventIds = new Set(registrations.map((registration) => registration.eventId));
  const adminClubs = (clubsResource.data ?? []).filter((club) => club.role === 'ADMIN');
  const filteredAttendees = (eventAttendeesResource.data ?? []).filter((displayName) =>
    displayName.toLocaleLowerCase().includes(attendeeQuery.trim().toLocaleLowerCase()),
  );
  const selectedEvent = route.page === 'events' && route.id
    ? events.find((event) => event.id === route.id) ?? null
    : null;
  const selectedRegistration = selectedEvent
    ? registrations.find((registration) => registration.eventId === selectedEvent.id)
    : null;

  const filteredNews = news.filter((item) => {
    const query = newsQuery.trim().toLocaleLowerCase();
    return !query || [
      label(item.title, language),
      label(item.lead, language),
      item.category,
    ].join(' ').toLocaleLowerCase().includes(query);
  });
  const locations = (locationsResource.data ?? []).filter((item) => {
    const query = locationQuery.trim().toLocaleLowerCase();
    const text = `${label(item.name, language)} ${item.keywords} ${item.block} ${item.id}`.toLocaleLowerCase();
    return (!query || text.includes(query)) &&
      (locationCategory === 'all' || item.category === locationCategory) &&
      (locationFloor === 'all' || item.floor === null || item.floor === Number(locationFloor));
  });
  const mapLocations = locations.filter((location) =>
    location.kind !== 'room' ||
    Boolean(locationQuery.trim()) ||
    locationCategory === 'room' ||
    locationFloor !== 'all',
  );
  const mapPinGroups = new Map<string, Location[]>();
  mapLocations.forEach((location) => {
    const key = `${location.x}:${location.y}`;
    mapPinGroups.set(key, [...(mapPinGroups.get(key) ?? []), location]);
  });
  const mapPins = [...mapPinGroups.values()].flatMap((group) => {
    const ordered = [...group].sort((left, right) =>
      (left.floor ?? 0) - (right.floor ?? 0) || left.id.localeCompare(right.id),
    );
    const selectedIndex = ordered.findIndex((location) => location.id === selectedLocation);
    if (selectedIndex > 0) {
      ordered.unshift(...ordered.splice(selectedIndex, 1));
    }
    return ordered.map((location, index) => ({
      ...location,
      pinX: location.x + (index - (ordered.length - 1) / 2) * 72,
      pinY: location.y,
    }));
  });

  useEffect(() => {
    if (!selectedLocation) return;
    const selected = locationsResource.data?.find((location) => location.id === selectedLocation);
    const viewport = mapViewport.current;
    if (!selected || !viewport) return;

    const scale = viewport.scrollWidth / MAP_WIDTH;
    viewport.scrollTo({
      left: selected.x * scale - viewport.clientWidth / 2,
      top: selected.y * scale - viewport.clientHeight / 2,
      behavior: 'smooth',
    });
  }, [selectedLocation, locationsResource.data]);

  useEffect(() => {
    const anchor = mapZoomAnchor.current;
    const viewport = mapViewport.current;
    if (!anchor || !viewport) return;
    mapZoomAnchor.current = null;
    requestAnimationFrame(() => {
      viewport.scrollTo({
        left: anchor.x * viewport.scrollWidth - viewport.clientWidth / 2,
        top: anchor.y * viewport.scrollHeight - viewport.clientHeight / 2,
        behavior: 'auto',
      });
    });
  }, [mapZoom]);

  function switchLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage);
    localStorage.setItem('sdutoday.lang', nextLanguage);
  }

  function setCampusMapZoom(nextZoom: number) {
    const viewport = mapViewport.current;
    if (viewport) {
      mapZoomAnchor.current = {
        x: (viewport.scrollLeft + viewport.clientWidth / 2) / viewport.scrollWidth,
        y: (viewport.scrollTop + viewport.clientHeight / 2) / viewport.scrollHeight,
      };
    }
    setMapZoom(Math.max(1, Math.min(3, nextZoom)));
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError('');
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const result = await apiRequest<{ user: User }>('/auth/login', {
        email: form.get('email'),
        password: form.get('password'),
      });
      setUser(result.user);
      window.location.assign('/');
    } catch (error) {
      setAuthError(messageForError(error, t('errorFallback')));
    } finally {
      setBusy(false);
    }
  }

  async function handleRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError('');
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      await apiRequest<User>('/auth/register', {
        displayName: form.get('displayName'),
        email: form.get('email'),
        password: form.get('password'),
        confirmPassword: form.get('confirmPassword'),
      });
      window.location.assign('/login?registered=1');
    } catch (error) {
      setAuthError(messageForError(error, t('errorFallback')));
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    setAuthError('');
    setBusy(true);
    try {
      await apiRequest<void>('/auth/logout', {});
      setUser(null);
      window.location.assign('/');
    } catch (error) {
      setAuthError(messageForError(error, t('errorFallback')));
    } finally {
      setBusy(false);
    }
  }

  async function registerForEvent(eventId: string) {
    setEventMessage('');
    setBusy(true);
    try {
      await apiRequest(`/events/${encodeURIComponent(eventId)}/register`, {});
      setEventMessage(t('registered'));
      setRegistrationVersion((version) => version + 1);
    } catch (error) {
      setEventMessage(messageForError(error, t('errorFallback')));
      setRegistrationVersion((version) => version + 1);
    } finally {
      setBusy(false);
    }
  }

  async function simulatePaymentForEvent(eventId: string) {
    setEventMessage('');
    setBusy(true);
    try {
      await apiRequest(`/events/${encodeURIComponent(eventId)}/pay`, {});
      setEventMessage(t('paymentDone'));
      setPaymentEventId(null);
      setRegistrationVersion((version) => version + 1);
    } catch (error) {
      setEventMessage(messageForError(error, t('errorFallback')));
      setRegistrationVersion((version) => version + 1);
    } finally {
      setBusy(false);
    }
  }

  async function createClubEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEventCreateError('');
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const clubId = String(form.get('clubId') ?? '');
    try {
      const created = await apiRequest<Event>(`/clubs/${encodeURIComponent(clubId)}/events`, {
        category: form.get('category'),
        startsAt: new Date(String(form.get('startsAt'))).toISOString(),
        titleRu: form.get('titleRu'),
        titleEn: form.get('titleEn'),
        descriptionRu: form.get('descriptionRu'),
        descriptionEn: form.get('descriptionEn'),
        price: Number(form.get('price')),
        capacity: Number(form.get('capacity')),
        locationId: form.get('locationId'),
      });
      window.location.assign(`/events/${encodeURIComponent(created.id)}`);
    } catch (error) {
      setEventCreateError(messageForError(error, t('errorFallback')));
    } finally {
      setBusy(false);
    }
  }

  function pageHeader(title: string, description: string) {
    return (
      <div className="page-h">
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    );
  }

  function resourceStatus<T>(resource: Resource<T>, empty: string) {
    if (resource.loading) return <div className="empty" role="status">{t('loading')}</div>;
    if (resource.error) {
      return (
        <div className="empty error-state" role="alert">
          <p>{resource.error}</p>
          <button className="btn sm" onClick={resource.reload} type="button">{t('retry')}</button>
        </div>
      );
    }
    return <div className="empty">{empty}</div>;
  }

  function newsCard(item: News) {
    return (
      <a className="nitem" href={`/news/${encodeURIComponent(item.id)}`} key={item.id}>
        <div className="meta">
          <span className="cat">{categoryLabel(item.category, language)}</span>
          <span>{dateText(item.publishedAt, language)}</span>
        </div>
        <h3>{label(item.title, language)}</h3>
        <p className="muted">{label(item.lead, language)}</p>
      </a>
    );
  }

  function eventCard(item: Event) {
    return (
      <a className="ev" href={`/events/${encodeURIComponent(item.id)}`} key={item.id}>
        <div className="ev-date">
          <b>{new Date(item.startsAt).getDate()}</b>
          <span>{new Intl.DateTimeFormat(language === 'ru' ? 'ru-RU' : 'en-US', { month: 'short' }).format(new Date(item.startsAt))}</span>
        </div>
        <div className="ev-body">
          <span className="tag">{categoryLabel(item.category, language)}</span>
          <h3>{label(item.title, language)}</h3>
          <div className="ev-row">{dateText(item.startsAt, language, true)}</div>
          <div className="ev-row">{item.location ? label(item.location.name, language) : label(item.locationDescription, language)}</div>
          <div className="ev-foot">
            <span className={`price${item.price === 0 ? ' free' : ''}`}>
              {item.price === 0 ? t('free') : `${item.price.toLocaleString(language === 'ru' ? 'ru-RU' : 'en-US')} ₸`}
            </span>
            <span className={item.remainingSeats === 0 ? 'sold' : 'left'}>
              {item.remainingSeats === 0 ? t('soldOut') : `${t('remaining')}: ${item.remainingSeats}`}
            </span>
          </div>
        </div>
      </a>
    );
  }

  return (
    <>
      <header className="hdr">
        <div className="wrap hdr-in">
          <a className="brand" href="/" aria-label="SDU Today">
            <img className="logo" src="/emblem.png" alt="" width="31" height="38" />
            <span>SDU Today</span>
          </a>
          <nav className="nav" aria-label="Main navigation">
            {([
              ['/', t('home'), 'home'],
              ['/news', t('news'), 'news'],
              ['/events', t('events'), 'events'],
              ['/map', t('map'), 'map'],
              ...(user ? [['/my-events', t('myEvents'), 'my-events']] : []),
              ...(adminClubs.length ? [['/organize', t('createEvent'), 'organize']] : []),
            ] as string[][]).map(([href, text, key]) => (
              <a href={href} key={key} aria-current={route.page === key ? 'page' : undefined}>{text}</a>
            ))}
          </nav>
          <div className="hdr-r">
            <div className="seg" aria-label="Language">
              <button onClick={() => switchLanguage('ru')} aria-pressed={language === 'ru'} type="button">RU</button>
              <button onClick={() => switchLanguage('en')} aria-pressed={language === 'en'} type="button">EN</button>
            </div>
            {!authReady ? <span className="muted auth-loading">…</span> : user ? (
              <div className="user-menu">
                <a href="/my-events" className="user-name">{user.displayName}</a>
                <button className="btn sm alt" disabled={busy} onClick={handleLogout} type="button">{t('logout')}</button>
              </div>
            ) : (
              <div className="auth-links">
                <a href="/login">{t('login')}</a>
                <a className="btn sm" href="/register">{t('register')}</a>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="app-main">
        {authError && !['login', 'register'].includes(route.page) && (
          <div className="wrap"><p className="error auth-error" role="alert">{authError}</p></div>
        )}

        {route.page === 'home' && (
          <div className="wrap">
            <section className="hero">
              <div>
                <p className="dateline">{dateText(new Date().toISOString(), language)}</p>
                <h1>{t('today')}</h1>
                <p className="sub">{t('subtitle')}</p>
                <a className="btn accent" href="/map">{t('map')}</a>
              </div>
              <a className="heromap" href="/map" aria-label={t('map')}>
                <img src="/map.webp" alt="" />
                <div className="cap"><span>{t('map')}</span><span aria-hidden="true">→</span></div>
              </a>
            </section>
            <section className="sec">
              <div className="sec-h"><h2>{t('upcomingEvents')}</h2><a href="/events">{t('allEvents')} →</a></div>
              {eventsResource.loading ? resourceStatus(eventsResource, t('noEvents'))
                : eventsResource.error ? resourceStatus(eventsResource, t('noEvents'))
                  : events.length ? <div className="grid">{events.slice(0, 3).map(eventCard)}</div>
                    : <div className="empty">{t('noEvents')}</div>}
            </section>
            <section className="sec">
              <div className="sec-h"><h2>{t('latestNews')}</h2><a href="/news">{t('allNews')} →</a></div>
              {newsResource.loading ? resourceStatus(newsResource, t('noNews'))
                : newsResource.error ? resourceStatus(newsResource, t('noNews'))
                  : news.length ? <div className="nlist-l">{news.slice(0, 4).map(newsCard)}</div>
                    : <div className="empty">{t('noNews')}</div>}
            </section>
          </div>
        )}

        {route.page === 'news' && !route.id && (
          <div className="wrap">
            {pageHeader(t('news'), '')}
            <label className="search news-search">
              <span className="sr">{t('search')}</span>
              <input type="search" value={newsQuery} onChange={(event) => setNewsQuery(event.target.value)} placeholder={t('search')} />
            </label>
            {newsResource.loading ? resourceStatus(newsResource, t('noNews'))
              : newsResource.error ? resourceStatus(newsResource, t('noNews'))
                : filteredNews.length ? <div className="nlist-l">{filteredNews.map(newsCard)}</div>
                  : <div className="empty">{t('noNews')}</div>}
          </div>
        )}

        {route.page === 'news' && route.id && (
          <div className="wrap">
            {newsResource.loading ? resourceStatus(newsResource, t('noNews'))
              : newsResource.error ? resourceStatus(newsResource, t('noNews'))
                : news.length === 0 ? <div className="empty">{t('noNews')}</div>
                  : (
                    <article className="article">
                      <a className="crumb" href="/news">← {t('back')}</a>
                      <div className="meta">
                        <span className="cat">{categoryLabel(news[0].category, language)}</span>
                        <span>{dateText(news[0].publishedAt, language)}</span>
                      </div>
                      <h1>{label(news[0].title, language)}</h1>
                      <p className="lead">{label(news[0].lead, language)}</p>
                      <div className="body">
                        {(news[0].body[language] ?? news[0].body.ru).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
                      </div>
                      {news[0].relatedEventId && (
                        <p className="related-link">
                          {t('relatedEvent')}: <a href={`/events/${encodeURIComponent(news[0].relatedEventId)}`}>{news[0].relatedEventId}</a>
                        </p>
                      )}
                    </article>
                  )}
          </div>
        )}

        {route.page === 'events' && !route.id && (
          <div className="wrap">
            {pageHeader(t('events'), '')}
            {eventsResource.loading ? resourceStatus(eventsResource, t('noEvents'))
              : eventsResource.error ? resourceStatus(eventsResource, t('noEvents'))
                : events.length ? <div className="grid">{events.map(eventCard)}</div>
                  : <div className="empty">{t('noEvents')}</div>}
          </div>
        )}

        {route.page === 'events' && route.id && (
          <div className="wrap">
            {eventsResource.loading ? resourceStatus(eventsResource, t('noEvents'))
              : eventsResource.error ? resourceStatus(eventsResource, t('noEvents'))
                : !selectedEvent ? <div className="empty">{t('noEvents')}</div>
                  : (
                    <article className="article event-detail">
                      <a className="crumb" href="/events">← {t('back')}</a>
                      <div className="meta"><span className="cat">{categoryLabel(selectedEvent.category, language)}</span></div>
                      <h1>{label(selectedEvent.title, language)}</h1>
                      <p className="lead">{label(selectedEvent.description, language)}</p>
                      <div className="event-facts">
                        <p><b>{t('date')}:</b> {dateText(selectedEvent.startsAt, language, true)}</p>
                        <p><b>{t('organizer')}:</b> {label(selectedEvent.club.name, language)}</p>
                        <p><b>{t('location')}:</b> {selectedEvent.location
                          ? label(selectedEvent.location.name, language)
                          : label(selectedEvent.locationDescription, language)}</p>
                        <p><b>{t('remaining')}:</b> {selectedEvent.remainingSeats}</p>
                        <p><b>{t('eventRegistration')}:</b> {selectedEvent.price === 0 ? t('free') : `${selectedEvent.price} ₸`}</p>
                      </div>
                      {eventMessage && <p className={registeredEventIds.has(selectedEvent.id) ? 'notice' : 'error'} role="status">{eventMessage}</p>}
                      {registeredEventIds.has(selectedEvent.id) ? (
                        <div className="notice">
                          <p>{t('alreadyRegistered')}</p>
                          <p>{selectedRegistration?.paymentStatus === 'SIMULATED_PAID' ? t('paymentDone') : t('paymentFree')}</p>
                        </div>
                      ) : user ? (
                        <button
                          className="btn"
                          disabled={busy || selectedEvent.remainingSeats === 0}
                          onClick={() => selectedEvent.price > 0
                            ? setPaymentEventId(selectedEvent.id)
                            : registerForEvent(selectedEvent.id)}
                          type="button"
                        >
                          {selectedEvent.price > 0 ? t('simulatePayment') : t('registerEvent')}
                        </button>
                      ) : (
                        <p className="notice">{t('loginToRegister')} <a href="/login">{t('login')}</a></p>
                      )}
                      {registeredEventIds.has(selectedEvent.id) ? (
                        <section className="attendees">
                          <h2>{t('attendees')}</h2>
                          <label className="search">
                            <span className="sr">{t('searchAttendees')}</span>
                            <input
                              type="search"
                              value={attendeeQuery}
                              onChange={(change) => setAttendeeQuery(change.target.value)}
                              placeholder={t('searchAttendees')}
                            />
                          </label>
                          {eventAttendeesResource.loading
                            ? resourceStatus(eventAttendeesResource, t('noAttendees'))
                            : eventAttendeesResource.error
                              ? resourceStatus(eventAttendeesResource, t('noAttendees'))
                              : filteredAttendees.length
                                ? <ul>{filteredAttendees.map((displayName, index) => <li key={`${displayName}-${index}`}>{displayName}</li>)}</ul>
                                : <p className="empty">{t('noAttendees')}</p>}
                        </section>
                      ) : user ? (
                        <p className="notice">{t('registerToSeeAttendees')}</p>
                      ) : null}
                    </article>
                  )}
          </div>
        )}

        {paymentEventId && selectedEvent?.id === paymentEventId && (
          <div className="payment-backdrop" role="presentation" onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busy) setPaymentEventId(null);
          }}>
            <section
              className="payment-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="payment-title"
            >
              <h2 id="payment-title">{t('paymentTitle')}</h2>
              <p>{label(selectedEvent.title, language)}</p>
              <p className="payment-amount">
                <span>{t('paymentAmount')}</span>
                <b>{selectedEvent.price.toLocaleString(language === 'ru' ? 'ru-RU' : 'en-US')} ₸</b>
              </p>
              <p className="notice">{t('paymentNotice')}</p>
              {eventMessage && <p className="error" role="alert">{eventMessage}</p>}
              <div className="payment-actions">
                <button className="btn alt" disabled={busy} onClick={() => setPaymentEventId(null)} type="button">
                  {t('cancelPayment')}
                </button>
                <button
                  className="btn"
                  disabled={busy}
                  onClick={() => simulatePaymentForEvent(selectedEvent.id)}
                  type="button"
                >
                  {busy ? t('loading') : t('simulatePayment')}
                </button>
              </div>
            </section>
          </div>
        )}

        {route.page === 'organize' && (
          <div className="wrap">
            {pageHeader(t('createEvent'), '')}
            {!adminClubs.length ? (
              clubsResource.loading
                ? resourceStatus(clubsResource, t('noAdminClubs'))
                : clubsResource.error
                  ? resourceStatus(clubsResource, t('noAdminClubs'))
                  : <p className="empty">{t('noAdminClubs')}</p>
            ) : (
              <form className="event-form" onSubmit={createClubEvent}>
                <label className="field">
                  <span>{t('selectClub')}</span>
                  <select name="clubId" required>
                    {adminClubs.map((club) => (
                      <option key={club.clubId} value={club.clubId}>{label(club.name, language)}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>{t('categoryLabel')}</span>
                  <select name="category" required>
                    {['concert', 'sport', 'talk', 'tech', 'social'].map((category) => (
                      <option key={category} value={category}>{categoryLabel(category, language)}</option>
                    ))}
                  </select>
                </label>
                <div className="row2">
                  <label className="field">
                    <span>{t('titleRu')}</span>
                    <input name="titleRu" maxLength={160} required />
                  </label>
                  <label className="field">
                    <span>{t('titleEn')}</span>
                    <input name="titleEn" maxLength={160} required />
                  </label>
                </div>
                <div className="row2">
                  <label className="field">
                    <span>{t('descriptionRu')}</span>
                    <textarea name="descriptionRu" maxLength={3000} required />
                  </label>
                  <label className="field">
                    <span>{t('descriptionEn')}</span>
                    <textarea name="descriptionEn" maxLength={3000} required />
                  </label>
                </div>
                <label className="field">
                  <span>{t('startsAt')}</span>
                  <input name="startsAt" type="datetime-local" min={initialEventDateTime()} defaultValue={initialEventDateTime()} required />
                </label>
                <div className="row2">
                  <label className="field">
                    <span>{t('price')}</span>
                    <input name="price" type="number" min="0" max="100000000" step="1" defaultValue="0" required />
                  </label>
                  <label className="field">
                    <span>{t('capacity')}</span>
                    <input name="capacity" type="number" min="1" max="2000" step="1" defaultValue="100" required />
                  </label>
                </div>
                <label className="field">
                  <span>{t('selectLocation')}</span>
                  <select name="locationId">
                    <option value="">{t('noLocation')}</option>
                    {(locationsResource.data ?? []).map((location) => (
                      <option key={location.id} value={location.id}>
                        {label(location.name, language)} · {location.block}
                      </option>
                    ))}
                  </select>
                </label>
                {eventCreateError && <p className="error" role="alert">{eventCreateError}</p>}
                <button className="btn" disabled={busy} type="submit">{t('create')}</button>
              </form>
            )}
          </div>
        )}

        {route.page === 'map' && (
          <div className="wrap">
            {pageHeader(t('map'), t('places'))}
            <div className="map-controls">
              <label className="search">
                <span className="sr">{t('mapSearch')}</span>
                <input
                  value={locationQuery}
                  onChange={(event) => {
                    setLocationQuery(event.target.value);
                    setSelectedLocation(null);
                  }}
                  placeholder={t('mapSearch')}
                />
              </label>
              <label className="map-select">
                <span>{t('category')}</span>
                <select value={locationCategory} onChange={(event) => {
                  setLocationCategory(event.target.value);
                  setSelectedLocation(null);
                }}>
                  <option value="all">{t('allCategories')}</option>
                  {[...new Set((locationsResource.data ?? []).map((location) => location.category))].sort().map((category) => (
                    <option value={category} key={category}>{categoryLabel(category, language)}</option>
                  ))}
                </select>
              </label>
              <label className="map-select">
                <span>{t('floor')}</span>
                <select value={locationFloor} onChange={(event) => {
                  setLocationFloor(event.target.value);
                  setSelectedLocation(null);
                }}>
                  <option value="all">{t('allFloors')}</option>
                  <option value="1">1</option><option value="2">2</option><option value="3">3</option>
                </select>
              </label>
            </div>
            {locationsResource.loading ? resourceStatus(locationsResource, t('noLocations'))
              : locationsResource.error ? resourceStatus(locationsResource, t('noLocations'))
                : (
                  <div className="map-layout">
                    <div className="location-results">
                      <h2>{t('places')} <span className="muted">({mapLocations.length})</span></h2>
                      {mapLocations.length ? mapLocations.map((location) => (
                        <button
                          className="location-row"
                          aria-pressed={selectedLocation === location.id}
                          key={location.id}
                          onClick={() => setSelectedLocation(location.id)}
                          type="button"
                        >
                          <b>{label(location.name, language)}</b>
                          <small>{location.block}{location.floor ? ` · ${t('floor')} ${location.floor}` : ''}</small>
                        </button>
                      )) : <p className="empty">{t('noLocations')}</p>}
                    </div>
                    <div className="campus-map-wrap">
                      <div className="campus-map" ref={mapViewport} aria-label={t('map')}>
                        <div className="campus-map-stage" style={{ width: `${mapZoom * 100}%` }}>
                          <img src="/map.webp" alt="План кампуса SDU" />
                          <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} role="group" aria-label={t('places')}>
                        {mapPins.map((location) => (
                          <g
                            key={location.id}
                            role="button"
                            tabIndex={0}
                            aria-label={label(location.name, language)}
                            aria-pressed={selectedLocation === location.id}
                            onClick={() => setSelectedLocation(location.id)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                setSelectedLocation(location.id);
                              }
                            }}
                          >
                            <circle cx={location.pinX} cy={location.pinY} r="38" className="map-pin-hit" />
                            <circle
                              cx={location.pinX}
                              cy={location.pinY}
                              r={selectedLocation === location.id ? 30 : 22}
                              className={selectedLocation === location.id ? 'map-pin selected' : 'map-pin'}
                            />
                            {location.kind === 'room' && location.floor !== null && (
                              <text x={location.pinX} y={location.pinY + 7} className="map-pin-floor">
                                {location.floor}
                              </text>
                            )}
                          </g>
                        ))}
                          </svg>
                        </div>
                      </div>
                      <div className="map-zoom" aria-label={t('map')}>
                        <button
                          aria-label={t('zoomIn')}
                          disabled={mapZoom >= 3}
                          onClick={() => setCampusMapZoom(mapZoom + 0.5)}
                          type="button"
                        >+</button>
                        <button
                          aria-label={t('zoomOut')}
                          disabled={mapZoom <= 1}
                          onClick={() => setCampusMapZoom(mapZoom - 0.5)}
                          type="button"
                        >−</button>
                        <button
                          aria-label={t('resetZoom')}
                          disabled={mapZoom === 1}
                          onClick={() => setCampusMapZoom(1)}
                          type="button"
                        >1:1</button>
                      </div>
                      {selectedLocation && (() => {
                        const chosen = mapLocations.find((location) => location.id === selectedLocation);
                        return chosen ? (
                          <div className="map-selected">
                            <b>{label(chosen.name, language)}</b>
                            <span>{chosen.block}{chosen.floor ? ` · ${t('floor')} ${chosen.floor}` : ''}</span>
                            <button type="button" onClick={() => setSelectedLocation(null)} aria-label={t('clearSelection')}>×</button>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  </div>
                )}
          </div>
        )}

        {route.page === 'my-events' && (
          <div className="wrap">
            {pageHeader(t('myEvents'), user ? `${t('signedInAs')} ${user.displayName}` : t('noSession'))}
            {!user && authReady ? <p className="empty">{t('noSession')} <a href="/login">{t('login')}</a></p>
              : registrationsResource.loading ? resourceStatus(registrationsResource, t('noRegistrations'))
                : registrationsResource.error ? resourceStatus(registrationsResource, t('noRegistrations'))
                  : registrations.length ? <div className="grid">{registrations.map((registration) => eventCard(registration.event))}</div>
                    : <p className="empty">{t('noRegistrations')}</p>}
          </div>
        )}

        {(route.page === 'login' || route.page === 'register') && (
          <div className="auth-main">
            <section className="auth-card" aria-live="polite">
              <p className="eyebrow">SDU TODAY</p>
              <h1>{route.page === 'login' ? t('loginTitle') : t('signupTitle')}</h1>
              <p className="intro">{route.page === 'login' ? t('subtitle') : t('email')}</p>
              {notice && <p className="notice" role="status">{notice}</p>}
              <form className="auth-form" onSubmit={route.page === 'login' ? handleLogin : handleRegistration}>
                {route.page === 'register' && (
                  <label className="field">
                    <span>{t('fullName')}</span>
                    <input name="displayName" autoComplete="name" maxLength={100} required />
                  </label>
                )}
                <label className="field">
                  <span>{t('email')}</span>
                  <input name="email" type="email" autoComplete="email" placeholder="name@sdu.edu.kz" required />
                </label>
                <label className="field">
                  <span>{t('password')}</span>
                  <input
                    name="password"
                    type="password"
                    autoComplete={route.page === 'login' ? 'current-password' : 'new-password'}
                    minLength={route.page === 'register' ? 8 : undefined}
                    required
                  />
                  {route.page === 'register' && <span className="hint">{t('passwordHint')}</span>}
                </label>
                {route.page === 'register' && (
                  <label className="field">
                    <span>{t('confirmPassword')}</span>
                    <input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required />
                  </label>
                )}
                {authError && <p className="error" role="alert">{authError}</p>}
                <button className="btn block" disabled={busy} type="submit">
                  {busy ? '…' : route.page === 'login' ? t('signIn') : t('signUp')}
                </button>
              </form>
              <p className="switch-page">
                {route.page === 'login' ? t('noAccount') : t('haveAccount')}{' '}
                <a href={route.page === 'login' ? '/register' : '/login'}>
                  {route.page === 'login' ? t('register') : t('login')}
                </a>
              </p>
            </section>
          </div>
        )}

        {route.page === 'not-found' && (
          <div className="wrap empty"><h1>404</h1><a href="/">{t('home')}</a></div>
        )}
      </main>
      <footer className="wrap"><span>SDU Today · {t('subtitle')}</span></footer>
    </>
  );
}
