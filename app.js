const EVENT = {
  timezone: "Europe/Istanbul",
  dateISO: "2026-04-08",
  title: {
    tr: "FROM GENERATIVE TO AGENTIC",
    en: "FROM GENERATIVE TO AGENTIC",
  },
  sessions: [],
};

const UI_TEXT = {
  tr: {
    locale: "tr-TR",
    currentTitle: "Su anki oturum",
    timelineTitle: "Gunluk akis",
    posterTitle: "Orijinal etkinlik posteri",
    noCurrent: "Bu saatte aktif oturum yok.",
    eventStartsSoon: "Etkinlik henuz baslamadi.",
    eventEnded: "Etkinlik tamamlandi.",
    statuses: {
      ongoing: "Su anda",
      upcoming: "Siradaki",
      completed: "Tamamlandi",
    },
    details: "Detaylar",
    noSpeakers: "Konusmaci bilgisi yok",
    withLink: "Profil",
  },
  en: {
    locale: "en-GB",
    currentTitle: "Current session",
    timelineTitle: "Event timeline",
    posterTitle: "Original event poster",
    noCurrent: "No active session right now.",
    eventStartsSoon: "The event has not started yet.",
    eventEnded: "The event has ended.",
    statuses: {
      ongoing: "Live now",
      upcoming: "Upcoming",
      completed: "Completed",
    },
    details: "Details",
    noSpeakers: "No speaker information",
    withLink: "Profile",
  },
};

let currentLang = "tr";
let lastAutoScrolledSession = null;

function parseEventDateTime(dateISO, timeHHMM) {
  const [year, month, day] = dateISO.split("-").map(Number);
  const [hour, minute] = timeHHMM.split(":").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour - 3, minute, 0, 0));
}

function withDate(dateISO, start, end) {
  return {
    startDate: parseEventDateTime(dateISO, start),
    endDate: parseEventDateTime(dateISO, end),
  };
}

function getNow() {
  return new Date();
}

function getSessionStatus(session, now) {
  if (now >= session.startDate && now < session.endDate) {
    return "ongoing";
  }
  if (now < session.startDate) {
    return "upcoming";
  }
  return "completed";
}

function getOverallStatus(sessions, now) {
  const first = sessions[0];
  const last = sessions[sessions.length - 1];
  if (now < first.startDate) return "before";
  if (now >= last.endDate) return "after";
  return "during";
}

function formatTimeRange(startDate, endDate, locale) {
  const format = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: EVENT.timezone,
  });
  return `${format.format(startDate)} - ${format.format(endDate)}`;
}

function formatEventDate(dateISO, locale) {
  const [year, month, day] = dateISO.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: EVENT.timezone,
  }).format(utcDate);
}

function normalizeSessions() {
  EVENT.sessions = EVENT.sessions.map((session) => {
    const { startDate, endDate } = withDate(EVENT.dateISO, session.start, session.end);
    return {
      ...session,
      startDate,
      endDate,
    };
  });
}

function createSpeakerChip(speaker, text, withLinks = true) {
  if (withLinks && speaker.profileUrl) {
    const a = document.createElement("a");
    a.href = speaker.profileUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.className = "speaker-chip";
    a.textContent = `${speaker.name} · ${text.withLink}`;
    return a;
  }

  const span = document.createElement("span");
  span.className = "speaker-chip";
  span.textContent = speaker.name;
  return span;
}

function createLogoElement(logo) {
  const wrapper = document.createElement("span");
  wrapper.className = "logo";

  if (logo?.imageSrc) {
    const img = document.createElement("img");
    img.src = logo.imageSrc;
    img.alt = logo.alt || logo.fallbackText || "Logo";
    wrapper.appendChild(img);
    return wrapper;
  }

  wrapper.textContent = logo?.fallbackText || "Logo";
  return wrapper;
}

function getCurrentSession(sessions, now) {
  return sessions.find((session) => getSessionStatus(session, now) === "ongoing");
}

function setStaticLabels(text) {
  document.getElementById("event-title").textContent = EVENT.title[currentLang];
  document.getElementById("current-session-heading").textContent = text.currentTitle;
  document.getElementById("timeline-heading").textContent = text.timelineTitle;
  document.getElementById("poster-heading").textContent = text.posterTitle;
  document.getElementById("event-date").textContent = formatEventDate(EVENT.dateISO, text.locale);
}

function renderCurrentSession(now, text) {
  const node = document.getElementById("current-session");
  node.innerHTML = "";

  const current = getCurrentSession(EVENT.sessions, now);
  if (!current) {
    const p = document.createElement("p");
    p.className = "muted";
    p.textContent = text.noCurrent;
    node.appendChild(p);
    return;
  }

  const time = document.createElement("p");
  time.className = "session-time";
  time.textContent = formatTimeRange(current.startDate, current.endDate, text.locale);
  node.appendChild(time);

  const title = document.createElement("h3");
  title.className = "session-title";
  title.textContent = current.title[currentLang];
  node.appendChild(title);

  const speakers = current.speakers || [];
  if (speakers.length === 0) {
    const noSpeaker = document.createElement("p");
    noSpeaker.className = "muted";
    noSpeaker.textContent = text.noSpeakers;
    node.appendChild(noSpeaker);
  } else {
    const speakerList = document.createElement("div");
    speakerList.className = "speaker-list";
    speakers.forEach((speaker) => {
      speakerList.appendChild(createSpeakerChip(speaker, text, true));
    });
    node.appendChild(speakerList);
  }
}

function renderTimeline(now, text) {
  const list = document.getElementById("timeline-list");
  list.innerHTML = "";

  EVENT.sessions.forEach((session) => {
    const status = getSessionStatus(session, now);
    const item = document.createElement("li");
    item.className = `timeline-item is-${status}`;
    item.dataset.sessionId = session.id;

    const row = document.createElement("div");
    row.className = "timeline-row";
    item.appendChild(row);

    const left = document.createElement("div");
    row.appendChild(left);

    const time = document.createElement("p");
    time.className = "session-time";
    time.textContent = formatTimeRange(session.startDate, session.endDate, text.locale);
    left.appendChild(time);

    const title = document.createElement("h3");
    title.className = "session-title";
    title.textContent = session.title[currentLang];
    left.appendChild(title);

    const pill = document.createElement("span");
    pill.className = `status-pill is-${status}`;
    pill.textContent = text.statuses[status];
    row.appendChild(pill);

    if (session.speakers?.length) {
      const speakers = document.createElement("div");
      speakers.className = "speaker-list";
      session.speakers.forEach((speaker) => {
        speakers.appendChild(createSpeakerChip(speaker, text, true));
      });
      item.appendChild(speakers);
    }

    if (session.logos?.length) {
      const logoStrip = document.createElement("div");
      logoStrip.className = "logo-strip";
      session.logos.forEach((logo) => logoStrip.appendChild(createLogoElement(logo)));
      item.appendChild(logoStrip);
    }

    list.appendChild(item);
  });
}

function maybeScrollToCurrent(now) {
  const current = getCurrentSession(EVENT.sessions, now);
  if (!current || current.id === lastAutoScrolledSession) return;

  const node = document.querySelector(`[data-session-id="${current.id}"]`);
  if (node) {
    node.scrollIntoView({ behavior: "smooth", block: "center" });
    lastAutoScrolledSession = current.id;
  }
}

function renderStatusMessage(now, text) {
  const status = getOverallStatus(EVENT.sessions, now);
  const node = document.getElementById("status-message");
  if (status === "before") {
    node.textContent = text.eventStartsSoon;
    return;
  }
  if (status === "after") {
    node.textContent = text.eventEnded;
    return;
  }
  node.textContent = text.statuses.ongoing;
}

function renderApp() {
  const now = getNow();
  const text = UI_TEXT[currentLang];
  setStaticLabels(text);
  renderStatusMessage(now, text);
  renderCurrentSession(now, text);
  renderTimeline(now, text);
  maybeScrollToCurrent(now);
}

function attachListeners() {
  const toggleButton = document.getElementById("lang-toggle");
  toggleButton.addEventListener("click", () => {
    currentLang = currentLang === "tr" ? "en" : "tr";
    toggleButton.textContent = currentLang === "tr" ? "TR / EN" : "EN / TR";
    renderApp();
  });
}

function seedSessionsFromPoster() {
  EVENT.sessions = [
    {
      id: "welcome",
      start: "14:30",
      end: "15:00",
      title: { tr: "Karsilama", en: "Welcome" },
      speakers: [],
      logos: [],
    },
    {
      id: "opening",
      start: "15:00",
      end: "15:15",
      title: {
        tr: 'Acilis Konusmasi: "Neden Agentic Native?"',
        en: 'Opening Speech: "Why Agentic Native?"',
      },
      speakers: [{ name: "Kulup Baskani / Yonetim Kurulu", profileUrl: "" }],
      logos: [],
    },
    {
      id: "keynote-1",
      start: "15:15",
      end: "15:45",
      title: {
        tr: "Keynote-1 (1. Oturum): Insan, Kultur ve Yapay Zeka Sosyolojisi",
        en: "Keynote-1 (Session 1): Human, Culture and AI Sociology",
      },
      speakers: [{ name: "Levent Erden", profileUrl: "" }],
      logos: [{ fallbackText: "NEXT", imageSrc: "./assets/logos/next.svg", alt: "NEXT logo" }],
    },
    {
      id: "break-1",
      start: "15:45",
      end: "15:55",
      title: { tr: "Atistirmalik & Networking Molasi", en: "Snacks & Networking Break" },
      speakers: [],
      logos: [],
    },
    {
      id: "panel",
      start: "15:55",
      end: "16:35",
      title: {
        tr: "Panel (2. Oturum): Native AI ve Agentic Workflow Standartlari",
        en: "Panel (Session 2): Native AI and Agentic Workflow Standards",
      },
      speakers: [
        { name: "Altan Cakir", profileUrl: "" },
        { name: "Baris Karakullukcu", profileUrl: "" },
        { name: "Alper Oner", profileUrl: "" },
      ],
      logos: [
        { fallbackText: "AIONLINE", imageSrc: "./assets/logos/aionline.svg", alt: "AIONLINE logo" },
        { fallbackText: "beko", imageSrc: "./assets/logos/beko.svg", alt: "Beko logo" },
        { fallbackText: "P2", imageSrc: "./assets/logos/p2.svg", alt: "Partner logo" },
      ],
    },
    {
      id: "workshop",
      start: "16:35",
      end: "17:20",
      title: { tr: "Prompt Battle Workshop", en: "Prompt Battle Workshop" },
      speakers: [],
      logos: [],
    },
    {
      id: "keynote-2",
      start: "17:20",
      end: "17:45",
      title: {
        tr: "Keynote-2 (3. Oturum): Agentic AI ve Gelecek Vizyonu: Uretkenlikten Otonom Karar Mekanizmalarina",
        en: "Keynote-2 (Session 3): Agentic AI and Future Vision: From Productivity to Autonomous Decision Mechanisms",
      },
      speakers: [{ name: "Serhan Yilmaz", profileUrl: "" }],
      logos: [{ fallbackText: "SPONSOR", imageSrc: "./assets/logos/sponsor.svg", alt: "Sponsor logo" }],
    },
    {
      id: "break-2",
      start: "17:45",
      end: "17:55",
      title: { tr: "Atistirmalik & Networking Molasi", en: "Snacks & Networking Break" },
      speakers: [],
      logos: [],
    },
    {
      id: "session-4",
      start: "17:55",
      end: "18:20",
      title: {
        tr: "4. Oturum: Agentic Cagda Verinin Demokratiklesmesi",
        en: "Session 4: Democratization of Data in the Agentic Era",
      },
      speakers: [{ name: "Metin Sarikaya", profileUrl: "" }],
      logos: [{ fallbackText: "AKBANK", imageSrc: "./assets/logos/akbank.svg", alt: "Akbank logo" }],
    },
    {
      id: "closing",
      start: "18:20",
      end: "18:30",
      title: { tr: "Kapanis + Duyurular", en: "Closing + Announcements" },
      speakers: [],
      logos: [],
    },
    {
      id: "networking",
      start: "18:30",
      end: "20:30",
      title: { tr: "Networking", en: "Networking" },
      speakers: [],
      logos: [],
    },
  ];
}

function init() {
  seedSessionsFromPoster();
  normalizeSessions();
  attachListeners();
  renderApp();
  setInterval(renderApp, 60 * 1000);
}

init();
