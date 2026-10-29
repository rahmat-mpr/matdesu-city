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
//   previews: [{ title, drive }]
//     GIF / video previews hosted on Google Drive (file id, shared "Anyone with the link"). Shown one at a time in a
//     square panel with previous / next buttons (no buttons for a single preview); only the shown file is loaded.
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
      'Night-time street racing in an open city. Players race other drivers, customize and upgrade their cars, and build a racing career. Released on Google Play, and on Poki and Yandex Games for desktop and mobile browsers.',
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
      { label: 'Play on Yandex Games', url: 'https://yandex.com/games/app/nsr-street-car-racing-449371' },
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
    previews: [{ title: 'Adelle Score Board video', drive: '1xHCfLA5umrYrwHCl2dQEYUYkhBRJhtw8' }],
    links: [],
  },

  'product-display': {
    id: 'product-display',
    title: 'Product Display',
    role: 'Programmer',
    studio: 'DFactory Visual',
    blurb: 'Interactive 3D product showcase on a large LED screen.',
    description:
      'Interactive 3D product showcase on a large LED screen, built to show products to customers. Visitors rotate and inspect the product in real time, switch its color, open the cap to show what is inside, or let Auto mode spin it as an attract loop between visitors.',
    tags: ['3D viewer', 'LED screen', 'Retail'],
    previews: [{ title: 'Product Display demo', drive: '1T3pnvsFD44aWfBhbAyiBnBL5Ioo0JUDe' }],
    links: [],
  },

  'led-visual-animation': {
    id: 'led-visual-animation',
    title: 'LED Visual Animation',
    role: 'Programmer',
    studio: 'DFactory Visual',
    blurb: 'Real-time animated visuals for large LED screens.',
    description:
      'Animated visual content built in Unity for large LED screens at events and stage shows. Runs in real time at the LED wall resolution, so scenes can loop, switch and sync with the show instead of playing as fixed video files.',
    tags: ['LED installation', 'Motion graphics'],
    previews: [{ title: 'LED Visual Animation', drive: '1Z6Opjhupzu0LV2q8jYMaJ80j7t6KI8_p' }],
    links: [],
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
    links: [{ label: 'Download', url: 'https://play.google.com/store/apps/details?id=haremking.id.co.digitalart' }],
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
      { label: 'G:Project', url: 'https://play.google.com/store/apps/details?id=com.StrategyMax.GProject' },
      { label: 'G:Escape', url: 'https://play.google.com/store/apps/details?id=com.StrategyMax.GEscape' },
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
      { label: 'Animations', url: 'https://drive.google.com/drive/folders/17RNq-TgBAH_2XTHYb_tzwKmyC6FkYrcA' },
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
    links: [{ label: 'Download', url: 'https://play.google.com/store/apps/details?id=com.tictech.kelar' }],
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
      'VR training for photovoltaic troubleshooting, used by employees. I built the scenarios, scene setup and training flow. The build is private under the client agreement; the clips show the training.',
    tags: ['VR', 'Training'],
    previews: [
      { title: 'Training clip', drive: '1FQ3F8PHKJPsnKT1y2F-FVlF71QugsCd8' },
      { title: 'Training clip', drive: '1UG5hHOQ332RuPTKTvYLDRikb756Migbo' },
    ],
    links: [],
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
    studio: 'Niji Games (freelance)',
    blurb: 'Spine 2D animation for customers and a motorbike-taxi driver.',
    image: img('image70'),
    imageAlt: 'Chibi customer character from Chef Story',
    fit: 'contain',
    description: 'Animated customer girls, chibi customers and a chibi motorbike-taxi driver in Spine 2D, freelancing for Niji Games. The game is released on Google Play.',
    tags: ['Spine 2D', 'Animation', 'Google Play'],
    previews: [
      { title: 'Girl · Idle', drive: '1F7J0DUz9dUPM86-Q6kP5vyX0UL-Z2rxO' },
      { title: 'Girl · Walking', drive: '1lAH6VEvX4Liz2LSjtwE5-_F-DVyAPkaN' },
      { title: 'Chibi customer · Walk in', drive: '1sWLrzZx0YCpR4y9SQgR3tXjckmrsgD64' },
      { title: 'Chibi customer · Order, normal', drive: '1d_mVyZ8bgAFRNHI7YwFhtOpkT_Z41_jU' },
      { title: 'Chibi customer · Order, irritated', drive: '1BV462dNTCTASGxE-lBgdDFaDDyAA6FVZ' },
      { title: 'Chibi customer · Order complete', drive: '19GTk2W35eYtyHED1hJ6N2_9u_cpUP4EH' },
      { title: 'Chibi customer · Leave happy', drive: '11B7HBckAzGQKBmH4e0vys4ELAY4z2fQB' },
      { title: 'Chibi customer · Leave angry', drive: '1skoUSG6b_Sgy32cbCFNMqXmLCSB8Ox0n' },
      { title: 'Chibi customer · No service', drive: '1HzkBZJkdZJiH3rqq6Y8C8n3Ys7taE4cp' },
      { title: 'Motorbike-taxi driver · Idle', drive: '1QkEQx2A3bIRi6Aw4IadHO-ClG50btktz' },
      { title: 'Motorbike-taxi driver · Walk', drive: '10nLNS-u-XOA_YbYJZth3t_RFkKFnYZ8r' },
    ],
    links: [{ label: 'Google Play', url: 'https://play.google.com/store/apps/details?id=com.nijigames.chefstorys', primary: true }],
  },
  'virgo-sparkling': {
    id: 'virgo-sparkling',
    title: 'Virgo and the Sparklings',
    role: '2D Animator',
    studio: 'Niji Games (freelance)',
    blurb: 'Idle and talking animations in Spine 2D.',
    image: img('image76'),
    imageAlt: 'Character from Virgo and the Sparklings',
    fit: 'contain',
    description: 'Idle and talking animations for the characters Sarip, Sasmi and Ren in Spine 2D.',
    tags: ['Spine 2D', 'Animation'],
    previews: [
      { title: 'Sasmi · Idle', drive: '1iJOBPmbwwRcYBiBE09nK2MrmbUyUe3cy' },
      { title: 'Sasmi · Talk', drive: '1RkwHuOQod07YLNcCgC9ytUG-LswLkf-y' },
      { title: 'Sasmi, happy · Idle', drive: '1Mx8w3iC-57oB3MGHQ70tyu5wqC_pV3OO' },
      { title: 'Sasmi, happy · Talk', drive: '1_vJAJg42-2cO3peruSH6RH97llxROMNf' },
      { title: 'Sasmi, bashful · Idle', drive: '1l_Byx1G3SV2B80waMQ8k0G8N0vseyWAg' },
      { title: 'Sasmi, bashful · Talk', drive: '1u2jy2UhlxsG-1gcBPTS8lzMzxosKAh3A' },
      { title: 'Sasmi, surprised · Idle', drive: '1YXclVDo8GXuQUyuyyU9YJu3nxc-PrpHT' },
      { title: 'Sasmi, surprised · Talk', drive: '1xcw2mN4wU4OY0h__Gqy4xM80C8hzz989' },
      { title: 'Sasmi, recording · Idle', drive: '1E0WyeMnyE9FnF34HLo_QGufXfPxG-qp6' },
      { title: 'Sasmi, recording · Talk', drive: '10AHcHV1tqGnV5JpoQoAZWobnSNigCx7A' },
      { title: 'Ren · Idle', drive: '11yDHsE5h3VXBFw8dQ4ydBPr9V0lJqIHl' },
      { title: 'Ren · Talk', drive: '1cLVGIXpkuBFc8RX98qgLvM3X-Kb1C0in' },
      { title: 'Ren, serious · Idle', drive: '1EVhB9Gk_7GN3j0p_ceBHhJEaSWC5CoZw' },
      { title: 'Ren, serious · Talk', drive: '1qxa7oN9Sjm_3i61lWpm4nu1Plv6S3tl6' },
      { title: 'Ren, smug · Idle', drive: '1bIYO0a2C569qVDDcHwn5VLjPZUxcHq1y' },
      { title: 'Ren, smug · Talk', drive: '1pKhHpnVLGBdQWQU7_EvXcBG5qUJwoeh5' },
      { title: 'Butler · Idle', drive: '1HF23krwV0abt5F11YhHbfMneNagRO5Ak' },
      { title: 'Butler · Talk', drive: '1joetiByaKrhYrrhd5ndBw000m6iwcvPm' },
    ],
    links: [{ label: 'QooApp', url: 'https://apps.qoo-app.com/en/app/19387', primary: true }],
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
  'ar-name-card': {
    id: 'ar-name-card',
    title: 'AR Name Card',
    role: 'Programmer',
    studio: 'TicTech Studio',
    blurb: 'Marker AR that brings the company mascot out of a name card.',
    image: img('ar-namecard-1'),
    imageAlt: 'AR mascot standing on a scanned name card',
    gallery: [{ src: img('ar-namecard-1'), alt: 'AR mascot standing on a scanned name card' }],
    description:
      'Marker-based AR that shows the company mascot on top of a name card. I wrote the AR code, set up the marker, mapped the scene, built the scenario and coded the mascot animation.',
    tags: ['AR', 'Marker'],
    links: [{ label: 'Open', url: 'https://drive.google.com/drive/folders/10u8H_IJ9JLVX_KQYqLqAcNqX2wbrUoI3' }],
  },
  senalapan: {
    id: 'senalapan',
    title: 'SENALAPAN',
    role: 'Programmer',
    studio: 'TicTech Studio',
    blurb: 'Markerless AR instructions for an ultrasonic mold cleaning machine.',
    image: img('senalapan-1'),
    imageAlt: 'AR step "remove the filter tube" over the cleaning machine',
    gallery: [{ src: img('senalapan-1'), alt: 'AR step "remove the filter tube" over the cleaning machine' }],
    description:
      'Markerless AR that walks operators through the working procedure of an ultrasonic mold cleaning machine, step by step. I built the scenarios, imported the assets, mapped the scene and wrote the flow the client asked for.',
    tags: ['AR', 'Markerless', 'Training'],
    links: [{ label: 'Open', url: 'https://drive.google.com/drive/folders/1vVtH7C6hpSgqclDTTdas59IxbTCWHlKM' }],
  },
  'brodo-shoes': {
    id: 'brodo-shoes',
    title: 'Brodo Shoes',
    role: 'Main Programmer',
    studio: 'TicTech Studio',
    blurb: 'AR Instagram filter that shows Brodo shoes.',
    image: img('brodo-1'),
    imageAlt: 'Instagram filter showing a Brodo shoe above the user',
    previews: [{ title: 'Instagram filter preview', drive: '10hHfNWR1Uj--c_Ue5Ds3hv4k7kh9tL8V' }],
    description:
      'Markerless AR and the "Which Brodo Style Are You" Instagram filter showcasing Brodo shoes, built in Spark AR Studio. The build is not public because of the client agreement; the video shows the filter.',
    tags: ['Spark AR', 'Instagram filter'],
    links: [],
  },
  'ar-foundation': {
    id: 'ar-foundation',
    title: 'AR Foundation showcases',
    role: 'Full-stack developer',
    studio: 'PT Bersama Kreatif Teknologi',
    blurb: 'AR tests: a 3D house, COVID-19 education and a lobster pond.',
    image: img('arf-house-1'),
    imageAlt: '3D house placed in AR',
    gallery: [
      { src: img('arf-house-1'), alt: '3D house placed in AR' },
      { src: img('arf-house-2'), alt: 'Inside the 3D house in AR' },
      { src: img('arf-covid-1'), alt: 'COVID-19 education model in AR' },
      { src: img('arf-lobster-1'), alt: 'Tarpaulin lobster pond in AR' },
    ],
    description:
      'AR tests built with Unity AR Foundation: a 3D house property showcase, a 3D COVID-19 education app and a tarpaulin pond for lobster cultivation. I wrote the AR code and made the 3D assets.',
    tags: ['AR Foundation', '3D assets'],
    links: [
      { label: '3D House', url: 'https://drive.google.com/file/d/1df07NaxaqPoT9WqPbV7LYa7BOV7NW8WB/view' },
      { label: 'COVID-19 Education', url: 'https://drive.google.com/drive/folders/1JyAJBzUwv07JakGSj-COzNAHDKyL6Mca' },
      { label: 'Lobster Pond', url: 'https://drive.google.com/drive/folders/1YkF6H-mgh0givsTfAe7uu6YhkzFIXxiK' },
    ],
  },
  'the-lost-lamb': {
    id: 'the-lost-lamb',
    title: 'The Lost Lamb',
    role: 'Gameplay Programmer',
    studio: 'Vizard Tales',
    blurb: 'Hyper-casual game: save the lamb from lava with bricks.',
    image: img('lostlamb-1'),
    imageAlt: 'The Lost Lamb gameplay',
    gallery: [
      { src: img('lostlamb-1'), alt: 'The Lost Lamb gameplay' },
      { src: img('lostlamb-2'), alt: 'The Lost Lamb level with lava and bricks' },
    ],
    description:
      'Hyper-casual game where players drop bricks to save a lamb from lava, without hitting the lamb. I worked on gameplay development for Vizard Tales. No longer listed on Google Play.',
    tags: ['Hyper-casual', 'Mobile'],
    links: [],
  },
  'mojiken-vn': {
    id: 'mojiken-vn',
    title: 'Mojiken Studio visual novels',
    role: 'Programmer',
    studio: 'Pixelesthe Studio',
    blurb: 'Sofi and the Red Balloon, Joy and the Pitcher, The Goose and the Golden Eggs.',
    image: img('mojiken-sofi-1'),
    imageAlt: 'Sofi and the Red Balloon scene',
    gallery: [
      { src: img('mojiken-sofi-1'), alt: 'Sofi and the Red Balloon scene' },
      { src: img('mojiken-sofi-2'), alt: 'Sofi and the Red Balloon scene' },
      { src: img('mojiken-joy-1'), alt: 'Joy and the Pitcher scene' },
      { src: img('mojiken-joy-2'), alt: 'Joy and the Pitcher scene' },
      { src: img('mojiken-goose-1'), alt: 'The Goose and the Golden Eggs scene' },
      { src: img('mojiken-goose-2'), alt: 'The Goose and the Golden Eggs scene' },
    ],
    description: 'Three visual novels by Mojiken Studio. I built the scenario flow between scenes and the tweening animations.',
    tags: ['Visual novel', 'Tweening'],
    links: [
      { label: 'Sofi and the Red Balloon', url: 'https://drive.google.com/drive/folders/1PHWv1j77-HMVMiEq5iYDrXp8iK82XHF2' },
      { label: 'Joy and the Pitcher', url: 'https://drive.google.com/drive/folders/19LhT7iUlW1_n2n_3ds9SLcSeR2SNXxA0' },
      { label: 'The Goose and the Golden Eggs', url: 'https://drive.google.com/drive/folders/1weqbOYHG26IjFZA7Docf2chRfrv2L4XA' },
    ],
  },
  yumi: {
    id: 'yumi',
    title: 'Yumi',
    role: 'Programmer · 2D Animator',
    studio: 'Pixelesthe Studio',
    blurb: 'Educational game that teaches the alphabet through drawing.',
    image: img('yumi-1'),
    imageAlt: 'Yumi alphabet drawing screen',
    gallery: [
      { src: img('yumi-1'), alt: 'Yumi alphabet drawing screen' },
      { src: img('yumi-2'), alt: 'Yumi letter tracing screen' },
    ],
    description:
      "Yumi stands for \"Yuk Menulis\" (Let's write): an educational game that introduces reading the alphabet mixed with drawing. My first client project: I wrote all of the game code, including the drawing code and tweening, and some of the 2D animation.",
    tags: ['Education', '2D animation'],
    links: [{ label: 'Open', url: 'https://drive.google.com/drive/folders/1eWet7sdqx2xENK34VOGaM3K0O2eMVAHr' }],
  },
};

