// Portfolio content for MatDesu City. Data only. Source of truth: the classic portfolio (https://rahmat-mpr.github.io/).
// All text is English. Image paths are relative to the site root; images load only when a card that shows them opens.
//
// `studio: null` means "no studio shown". Fill it in later if the attribution is confirmed.

export const CLASSIC_URL = 'https://rahmat-mpr.github.io/';

export const profile = {
  name: 'Rahmat Maulana Putra Rianto',
  headline: 'Unity Game Programmer & PIC QA',
  location: 'Surabaya, Indonesia',
  portrait: 'assets/img/image10.jpg',
  portraitAlt: 'Portrait of Rahmat Maulana',
  intro:
    'Game programmer with 6+ years shipping Unity titles across mobile, WebGL, Steam, AR/VR and interactive installations. Currently at Yes2Games in Singapore (remote), where I write gameplay code and run QA for released games.',
  skills:
    'C#, Python, Lua · Unity 2D/3D, Unreal · Git · AR Foundation, VR, Photon · Hokuyo LIDAR, Orbbec, Kinect v2 · Spine 2D, Blender, Photoshop',
  qa: 'Test planning, test case design, functional, regression and smoke testing, bug tracking, release verification',
};

export const contact = {
  email: 'rahmatmpr@rocketmail.com',
  linkedin: 'https://www.linkedin.com/in/rahmatmpr/',
  classic: CLASSIC_URL,
  cv: 'assets/cv/Rahmat-Maulana-Putra-Rianto-CV.pdf', // linked from Town Square (About me) and Post Office
};

// "Where I've worked". Entries with studio: null show role, dates and place only.
export const experience = [
  { when: 'Jun 2025 – now', studio: 'Yes2Games', role: 'Unity Game Programmer & PIC QA', place: 'Remote, Singapore' },
  { when: 'Apr – Jun 2025', studio: 'DFactory Visual', role: 'Unity Game Programmer', place: 'Surabaya' },
  { when: 'Oct 2023 – Jan 2025', studio: null, role: 'Unity Programmer', place: 'Remote' },
  { when: 'Sep 2023 – Aug 2024', studio: 'SMA 1 Puri Mojokerto', role: 'Game Developer Trainer', place: null },
  { when: 'Aug 2023 – Jul 2024', studio: 'Ardilab', role: 'Freelance 3D Animator', place: 'Remote' },
  { when: 'Dec 2022 – Sep 2023', studio: null, role: 'Part-time Unity Programmer', place: 'Sidoarjo' },
  { when: 'Jan – Aug 2022', studio: 'Digital Artha', role: 'Game Developer', place: 'Remote' },
  { when: 'Jul – Oct 2021', studio: 'Game5Mobile', role: 'Game Programmer', place: 'Remote' },
  { when: 'Sep 2020 – Apr 2021', studio: 'Strategy Max', role: 'Game Developer', place: 'Surabaya' },
  { when: 'Jan – Aug 2020', studio: 'TicTech Studio', role: 'Game Programmer, AR/VR', place: 'Surabaya' },
  { when: 'Jan 2017 – Aug 2019', studio: 'Pixelesthe Studio', role: 'Programmer', place: null },
];

// Extra info blocks rendered at the top of an island card (islands.js: section: '<key>').
export const sections = {
  pens: {
    facts: [
      {
        title: 'Education',
        text: 'Bachelor of Applied Science in Game Technology, Politeknik Elektronika Negeri Surabaya (2016 – 2023)',
      },
      { title: 'Achievement', text: 'Grand Finalist, Gameseed 2023' },
      { title: 'Campus', text: 'Chief Lab Assistant, Game Technology (2018) · Lab Assistant, Game Technology · Sponsorship Division, Gubufest 2018 · Decoration Division, Janaka Festival PENS 2017' },
      { title: 'Teaching', text: 'Game Developer Trainer, SMA 1 Puri Mojokerto (Sep 2023 – Aug 2024)' },
    ],
  },
};

// Optional inline media per project (omit when not available; never invent):
//   video: { type: 'youtube' | 'instagram' | 'mp4' | 'iframe', src }
//     Shown in the detail view. The iframe/<video> is created when the detail opens and removed when it closes.
//     e.g. video: { type: 'youtube', src: 'https://www.youtube.com/embed/VIDEO_ID' }
//          video: { type: 'mp4', src: 'assets/video/demo.mp4' }
//   play: { src, note?, aspect? }
//     A WebGL build. The detail view shows a "Play" button that opens a fullscreen overlay with a lazy iframe.
//     e.g. play: { src: 'games/nsr/index.html', note: 'Runs best on desktop', aspect: '16 / 9' }
const img = (f) => `assets/img/${f}.jpg`;

export const projects = {
  nsr: {
    id: 'nsr',
    title: 'NSR – Nitro Street Racing',
    role: 'PIC QA · Programmer',
    studio: 'Yes2Games',
    period: '2025 – now',
    blurb: 'Night-time street racing in an open city.',
    image: img('nsr-p0'),
    imageAlt: 'NSR app icon',
    gallery: [
      { src: img('nsr-p6'), alt: 'NSR gameplay: racing through a neon city at night' },
      { src: img('nsr-p4'), alt: 'Yellow supercar boosting through a neon tunnel' },
      { src: img('nsr-p7'), alt: 'Car customization screen with paint and rim options' },
      { src: img('nsr-p3'), alt: 'Showroom with car stats and upgrades' },
      { src: img('nsr-p5'), alt: 'Driver walking next to a car in the open city' },
      { src: img('nsr-p2'), alt: 'Blue car drifting on a city highway' },
    ],
    description:
      'Night-time street racing in an open city. Players race other drivers, customize and upgrade their cars, and build a racing career. Released on Google Play and on Poki for desktop and mobile browsers.',
    tags: ['Racing', 'Unity · C#', 'Android · WebGL'],
    stats: [
      { value: '100K+', label: 'Google Play downloads' },
      { value: '4.3★', label: 'Google Play, 603 reviews' },
      { value: '4.6★', label: 'Poki, 36K+ votes' },
    ],
    roles: [
      {
        title: 'PIC QA',
        text: 'Own QA for the game: test plans and test cases, functional, regression and smoke testing, bug tracking and fix verification before each release.',
      },
      { title: 'Programming', text: 'Build gameplay features, fix bugs and optimize performance in Unity and C#.' },
      { title: 'WebGL / Poki', text: 'Prepare and optimize WebGL builds for release on Poki.' },
      { title: 'Android', text: 'Prepare Android builds and releases for Google Play.' },
    ],
    links: [
      {
        label: 'Google Play',
        url: 'https://play.google.com/store/apps/details?id=com.y2g.nsr.real.street.drift.car.racing.speed.driving.simulator',
        primary: true,
      },
      { label: 'Play on Poki', url: 'https://poki.com/id/g/nsr-street-car-racing' },
    ],
  },

  'disney-piano': {
    id: 'disney-piano',
    title: 'Disney Piano',
    role: 'Lead Programmer',
    studio: 'DFactory Visual',
    blurb: 'Rhythm game for an LED floor and wall, tracked by LIDAR.',
    image: img('image2'),
    imageAlt: 'Children playing Disney Piano on an LED floor',
    description:
      'Rhythm game for an LED floor and LED wall at Pakuwon Mall Surabaya, with Disney as client. Kids step on piano keys in time with notes on the wall. A Hokuyo LIDAR sensor tracks player positions in real time.',
    tags: ['LED installation', 'LIDAR'],
    video: { type: 'instagram', src: 'https://www.instagram.com/p/DLKTauBz58l/embed' },
    links: [{ label: 'Watch on Instagram', url: 'https://www.instagram.com/p/DLKTauBz58l/' }],
  },
  'adelle-score-board': {
    id: 'adelle-score-board',
    title: 'Adelle Score Board',
    role: 'Programmer',
    studio: 'DFactory Visual',
    blurb: 'Touchscreen scoreboard web app for Adelle Jewellery events.',
    image: img('image28'),
    imageAlt: 'Adelle Score Board scoreboard screen',
    description:
      'Touchscreen web app for Adelle Jewellery events, running on iPad Air. I built the scoreboard simulation and the touch input that triggers promotional videos from an external host.',
    tags: ['Web app', 'iPad'],
    links: [{ label: 'See project', url: 'https://interactive.dfactory.pro/' }],
  },

  'magica-planta-botanica': {
    id: 'magica-planta-botanica',
    title: 'Magica Planta Botanica',
    role: 'Programmer',
    studio: null,
    blurb: 'Survival deck-builder with roguelite progression and tower defense.',
    image: img('image29'),
    imageAlt: 'Magica Planta Botanica gameplay',
    description:
      'Survival deck-builder with roguelite progression and tower defense. I fixed bugs, built a tool that converts CSV data into Unity Localization format, and added the in-game language switcher.',
    tags: ['Steam', 'Localization'],
    links: [{ label: 'Steam page', url: 'https://store.steampowered.com/app/2336690/Magica_Planta_Botanica/' }],
  },
  'school-beat': {
    id: 'school-beat',
    title: 'School Beat',
    role: 'Programmer',
    studio: null,
    blurb: "Beat 'em up roguelite built on TopDown Engine.",
    image: img('image12'),
    imageAlt: 'School Beat gameplay',
    description:
      "Beat 'em up roguelite. Built on TopDown Engine: I prototyped NPC behavior, teleport between areas, character data and vending machines, and wrote custom scripts to integrate them with the plugin.",
    tags: ['Steam', 'TopDown Engine'],
    links: [{ label: 'Steam page', url: 'https://store.steampowered.com/app/3244720/School_Beat/' }],
  },

  'unrivaled-heroes': {
    id: 'unrivaled-heroes',
    title: 'Unrivaled Heroes',
    role: 'Programmer',
    studio: null,
    blurb: "2.5D side-scrolling beat 'em up set in Nusantara folklore.",
    image: img('image79'),
    imageAlt: 'Unrivaled Heroes key art',
    description:
      "2.5D side-scrolling beat 'em up set in Nusantara folklore. I built the top-down gameplay, migrated the project from Unreal to Unity, and moved gameplay from 2D to 3D with a 2.5D look.",
    tags: ['Steam', 'Unreal → Unity', '2.5D'],
    links: [{ label: 'Steam page', url: 'https://store.steampowered.com/app/2690830/Unrivaled_Heroes_25D_Brawler/' }],
  },
  haremking: {
    id: 'haremking',
    title: 'HaremKing – Kode Keras Cowok 3',
    role: 'Solo Programmer',
    studio: 'Digital Artha',
    blurb: 'Visual novel with match-3, chat and gacha modes.',
    image: img('image31'),
    imageAlt: 'HaremKing match-3 gameplay',
    fit: 'contain',
    description:
      'Visual novel with match-3. I built a Tinder-like matching system, a chat system that reads story scripts from text files with simple commands for writers, plus dress-up and gacha wheel modes.',
    tags: ['Mobile', 'Lua', 'Narrative tools'],
    links: [{ label: 'Download', url: 'https://bit.ly/44rRIFz' }],
  },
  'g-project': {
    id: 'g-project',
    title: 'G:Project and G:Escape',
    role: 'Main Programmer · Game Designer',
    studio: 'Strategy Max',
    blurb: 'Space arcade shooter and its survival sequel.',
    image: img('image54'),
    imageAlt: 'G:Project title screen',
    description:
      'Space arcade shooter and its survival sequel. I designed both games and built the game manager connecting gameplay, achievements, shop and sound across scenes.',
    tags: ['Mobile', 'Game design'],
    links: [
      { label: 'G:Project', url: 'https://bit.ly/G_Project1' },
      { label: 'G:Escape', url: 'https://bit.ly/G_Escape' },
    ],
  },
  'worker-brawler': {
    id: 'worker-brawler',
    title: 'Worker Brawler',
    role: 'Lead Programmer · 2D Animator',
    studio: 'Game jam',
    blurb: 'Online multiplayer brawler made for a game jam.',
    image: img('image61'),
    imageAlt: 'Worker Brawler title screen',
    description:
      'Online multiplayer brawler made for the Indigo Game Startup Incubation Game Jam 2021. I animated the characters and built online multiplayer with Photon.',
    tags: ['Photon', 'Multiplayer'],
    links: [
      { label: 'itch.io', url: 'https://ategonstd.itch.io/worker-brawler' },
      { label: 'Animations', url: 'https://bit.ly/2QBe9be' },
    ],
  },

  'ar-magazine': {
    id: 'ar-magazine',
    title: 'AR Magazine – Klikuark',
    role: 'Programmer',
    studio: 'TicTech Studio × PT Kuark International',
    blurb: 'AR app that brings comic stories on the page to life.',
    image: img('image18'),
    imageAlt: 'AR Magazine scene over a comic page',
    description:
      "AR app that brings comic stories on the page to life with animated explanations. I built the AR scenarios, marker setup and scene flow to the client's requests.",
    tags: ['AR', 'Education'],
    links: [{ label: 'Download', url: 'https://bit.ly/Klikuark' }],
  },
  'giz-solar-vr': {
    id: 'giz-solar-vr',
    title: 'GIZ Solar Panel VR',
    role: 'Programmer',
    studio: 'TicTech Studio',
    blurb: 'VR training for photovoltaic troubleshooting.',
    image: img('image24'),
    imageAlt: 'Solar panel VR training scene',
    description:
      'VR training for photovoltaic troubleshooting, used by employees. I built the scenarios, scene setup and training flow. The build is private under the client agreement.',
    tags: ['VR', 'Training'],
    links: [{ label: 'Preview', url: 'http://bit.ly/37xRt0L' }],
  },
  'petro-360': {
    id: 'petro-360',
    title: 'Petro 360 Tour',
    role: 'Programmer',
    studio: 'TicTech Studio × Petrokimia',
    blurb: '360° plant tour linked to a map.',
    image: img('image36'),
    imageAlt: 'Petro 360 Tour room view with map pins',
    description:
      '360° plant tour linked to a map. I integrated Mapbox into Unity, parsed API data, and built login, room search, history and 360° views tied to map pins. The build is private under the client agreement.',
    tags: ['Mapbox', 'REST API'],
    links: [],
  },

  'chef-story': {
    id: 'chef-story',
    title: 'Chef Story: Cooking Game',
    role: '2D Animator',
    studio: 'Freelance',
    blurb: 'Spine 2D animation for customers and a motorbike-taxi driver.',
    image: img('image70'),
    imageAlt: 'Chibi customer character from Chef Story',
    fit: 'contain',
    description: 'Animated customer girls, chibi customers and a chibi motorbike-taxi driver in Spine 2D.',
    tags: ['Spine 2D', 'Animation'],
    links: [{ label: 'More previews', url: 'http://bit.ly/3Vki87p' }],
  },
  'virgo-sparkling': {
    id: 'virgo-sparkling',
    title: 'Virgo and the Sparkling',
    role: '2D Animator',
    studio: 'Freelance',
    blurb: 'Idle and talking animations in Spine 2D.',
    image: img('image76'),
    imageAlt: 'Character from Virgo and the Sparkling',
    fit: 'contain',
    description: 'Idle and talking animations for the characters Sarip, Sasmi and Ren in Spine 2D.',
    tags: ['Spine 2D', 'Animation'],
    links: [{ label: 'More previews', url: 'http://bit.ly/3PO57C2' }],
  },

  distance: {
    id: 'distance',
    title: 'Distance',
    role: 'Main Programmer · 3D Animator',
    studio: 'PENS final project',
    blurb: 'Final project of the game production workshop at PENS.',
    image: img('image74'),
    imageAlt: 'Distance gameplay',
    fit: 'contain',
    description:
      'Final project for the game production workshop at PENS. I handled everything except the art: programming, gameplay, game design, balancing and 3D character animation.',
    tags: ['3D animation', 'Game design'],
    links: [{ label: 'itch.io', url: 'https://rahadianrayhan.itch.io/distance' }],
  },
};

// Compact "More projects" entries. `note` mirrors the classic site's one-line description and credit.
export const archive = {
  'the-lost-lamb': {
    title: 'The Lost Lamb',
    note: 'Hyper-casual gameplay development · Vizard Tales',
    links: [{ label: 'Google Play', url: 'https://play.google.com/store/apps/details?id=com.VizardTales.TheLostLamb' }],
  },
  'food-tycoon': {
    title: 'Food Tycoon Nusantara',
    note: 'Core gameplay · Mobile',
    links: [{ label: 'Open', url: 'https://drive.google.com/file/d/1pr1EJ_IRzzMnwODNirqz5cZgjmsDS1N6/view' }],
  },
  'ar-name-card': {
    title: 'AR Name Card',
    note: 'Marker AR that shows the company mascot · TicTech',
    links: [{ label: 'Open', url: 'https://bit.ly/AR_NameCard' }],
  },
  senalapan: {
    title: 'SENALAPAN',
    note: 'Markerless AR machine operating instructions · TicTech',
    links: [{ label: 'Open', url: 'http://bit.ly/2NJUJzi' }],
  },
  'brodo-shoes': {
    title: 'Brodo Shoes',
    note: 'AR Instagram filter with Spark AR · TicTech',
    links: [{ label: 'Preview', url: 'http://drive.google.com/file/d/10hHfNWR1Uj--c_Ue5Ds3hv4k7kh9tL8V/view' }],
  },
  'ar-foundation': {
    title: 'AR Foundation showcases',
    note: 'Code and 3D assets · PT Bersama Kreatif',
    links: [
      { label: '3D House', url: 'https://bit.ly/3fDQ7EW' },
      { label: 'COVID-19 Education', url: 'https://bit.ly/3f8WVM1' },
      { label: 'Lobster Pond', url: 'https://bit.ly/3bIQEEA' },
    ],
  },
  'mojiken-vn': {
    title: 'Mojiken Studio visual novels',
    note: 'Scene flow and tweening · Pixelesthe',
    links: [
      { label: 'Sofi and the Red Balloon', url: 'http://bit.ly/3dzbs30' },
      { label: 'Joy and the Pitcher', url: 'http://bit.ly/3btWtVE' },
      { label: 'The Goose and the Golden Eggs', url: 'http://bit.ly/3pCmzL1' },
    ],
  },
  yumi: {
    title: 'Yumi',
    note: 'Educational alphabet and drawing game, all game code and 2D animation · Pixelesthe',
    links: [{ label: 'Open', url: 'http://bit.ly/3qCSQ67' }],
  },
};
