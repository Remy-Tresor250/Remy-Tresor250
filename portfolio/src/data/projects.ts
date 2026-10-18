export type Project = {
  slug: string
  name: string
  kind: string
  platform: string
  tagline: string
  description: string
  features: string[]
  stack: string[]
  url?: string
  /** brand colours: primary, accent, background */
  colors: [string, string, string]
  gallery: string[]
  award?: string
  /** the card carries a live 3D model instead of only the frame */
  model?: string
}

const g = (slug: string, ...names: string[]) => names.map((n) => `/media/${slug}/${n}.webp`)

export const projects: Project[] = [
  {
    slug: 'libblio',
    name: 'Libblio',
    kind: 'Library SaaS',
    platform: 'Web platform',
    tagline: 'A powerhouse for your school library.',
    description:
      'Libblio turns school libraries into calm, data-driven spaces: borrowing in seconds, automatic insights, offline-ready sync and an AI assistant for librarians. Used by 10+ schools and named TICON Africa Startup of the Year 2025.',
    features: [
      'Check-in / check-out in seconds, zero paperwork',
      'Automatic reports and real-time library insights',
      'Offline mode with automatic sync',
      'AI assistant for guided library management',
      'Smart tracking, overdue notices, patrons & e-books',
    ],
    stack: ['Next.js 15', 'React 19', 'Tailwind v4', 'Mantine', 'Redux Toolkit', 'GraphQL', 'Socket.IO', 'Recharts'],
    url: 'https://libblio.vercel.app',
    colors: ['#005EFF', '#38383D', '#FBFBFB'],
    gallery: g('libblio', 'dashboard', 'overview', 'insights'),
    award: 'TICON Africa · Startup of the Year 2025',
  },
  {
    slug: 'collis',
    name: 'Collis',
    kind: 'Fintech',
    platform: 'Web + iOS + Android',
    tagline: 'Pay easily in Rwanda — we handle local payments for you.',
    description:
      'A wallet for visitors to Rwanda: top up with any card, pay any MTN MoMo or Airtel Money number — taxis, motos, hotels, safaris — and withdraw what is left to PayPal on the way home. Marketing site plus a full Expo mobile app with passport-NFC KYC.',
    features: [
      'Instant top-up with Visa, Mastercard or prepaid cards',
      'Pay any MTN MoMo or Airtel Money number',
      'Withdraw the remaining balance to PayPal',
      'Document scan + passport NFC KYC, passkeys, PIN, 2FA',
      'Multi-currency, PDF receipts, EN/FR, light & dark',
    ],
    stack: ['Next.js 16', 'React Three Fiber', 'Expo 54', 'React Native', 'NativeWind', 'Supabase', 'Zustand', 'TanStack Query'],
    url: 'https://www.collis.so',
    colors: ['#0479FF', '#459CFF', '#011a4d'],
    gallery: g('collis', 'wallet', 'send', 'withdraw'),
  },
  {
    slug: 'claire',
    name: 'Claire AI',
    kind: 'EdTech · AI',
    platform: 'Web platform',
    tagline: 'Your personal AI tutor.',
    description:
      'A lifelike digital-human tutor that teaches with live slides, generates quizzes and adapts to every learner — including learners with disabilities — while on-device computer vision follows engagement through the webcam.',
    features: [
      'Conversational digital-human tutor with live video',
      'TensorFlow.js face-mesh engagement tracking',
      'AI-generated slides with math & code',
      'Auto-generated quizzes with explanations',
      'Real-time sync over Pusher',
    ],
    stack: ['React', 'TypeScript', 'TensorFlow.js', 'MediaPipe', 'Soul Machines SDK', 'Redux Toolkit', 'MUI', 'Pusher'],
    url: 'https://claire-v2.vercel.app',
    colors: ['#009BD3', '#074885', '#050505'],
    gallery: g('claire', 'tutor', 'lesson'),
  },
  {
    slug: 'sorano',
    name: 'Sorano AI',
    kind: 'Commerce · Voice · AR',
    platform: 'Web + mobile',
    tagline: 'Inspired by culture, powered by innovation.',
    description:
      'An AI commerce platform for Made-in-Rwanda products. Shoppers talk to a voice sales agent, products are captured with photogrammetry into 3D, and AR lets you place them in your own space before you buy.',
    features: [
      'Voice sales agent in English and French',
      'Reasoning search that finds exactly what you describe',
      'Photogrammetry → high-resolution 3D models',
      'AR preview: rotate, scale, place in your room',
      'Free in-app calls with Sorano',
    ],
    stack: ['React', 'TypeScript', 'Vite', 'Tailwind v4', 'Framer Motion', 'Cloudinary', 'Photogrammetry', 'WebXR'],
    url: 'https://sorano.vercel.app',
    colors: ['#B96AF3', '#F2AC3E', '#0c0a14'],
    gallery: [],
  },
  {
    slug: 'lala',
    name: 'LaLa Stays',
    kind: 'Marketplace',
    platform: 'Web + host & admin consoles',
    tagline: "Life's adventures, limitless access.",
    description:
      'A short-stay rental marketplace for Rwanda: map search, secure booking and payments for guests; listings, calendars and payouts for hosts; and an admin console for revenue, loyalty and reviews — with real-time chat and video.',
    features: [
      'Mapbox-powered search and property map',
      'Secure booking, payments, reviews',
      'Host console: listings, calendar, payouts',
      'Admin: hosts, revenue, withdrawals, loyalty',
      'Real-time chat & video calls',
    ],
    stack: ['Next.js 15', 'React 19', 'Mapbox GL', 'Mantine', 'Redux Toolkit', 'Stream Chat & Video', 'Recharts', 'Zod'],
    url: 'https://www.lalastays.com',
    colors: ['#DFA85D', '#05322B', '#021a16'],
    gallery: g('lala', 'villa', 'house', 'how'),
  },
  {
    slug: 'tujyane',
    name: 'Tujyane',
    kind: 'Mobility super-app',
    platform: 'iOS + Android + Web',
    tagline: 'Everything you need in one app.',
    description:
      'Tujyane — “let’s go together” — puts rides, shared intercity trips, car rental and store delivery into one app, with live tracking for passengers and an earnings console for drivers and couriers.',
    features: [
      'Rides and shared intercity trips with seat booking',
      'Rent a car straight from its owner',
      'Order from restaurants and supermarkets',
      'Live driver & courier tracking with ETAs',
      'Driver onboarding, KYC and earnings',
    ],
    stack: ['React Native', 'TanStack Router', 'React', 'Motion', 'Socket.IO', 'Leaflet', 'Turf.js', 'Tailwind v4'],
    url: 'https://tujyaneltd.com',
    colors: ['#C6FC2E', '#242425', '#0b0b0c'],
    gallery: g('tujyane', 'services', 'bookings', 'driver'),
    model: '/models/landcruiser.glb',
  },
  {
    slug: 'quantaledger',
    name: 'QuantaLedger',
    kind: 'Supply chain · Blockchain',
    platform: 'Desktop + Web (Flutter)',
    tagline: 'Trust, transparency and traceability in every shipment.',
    description:
      'Blockchain-backed traceability with tamper-proof CDP QR codes. Manufacturers register products, follow shipments and drivers live on the map, and see at a glance which scans are authentic and which are suspicious.',
    features: [
      'Tamper-proof CDP QR product registration',
      'End-to-end product traceability',
      'Authentic vs suspicious scan analytics',
      'Driver journeys, geofencing, live location',
      'Built-in messaging, EN/KO localisation',
    ],
    stack: ['Flutter', 'Dart', 'GetX', 'Hive', 'flutter_map', 'Syncfusion', 'Stream Chat', 'Pusher'],
    colors: ['#6565FD', '#FEA301', '#15155e'],
    gallery: g('quantaledger', 'fleet'),
  },
  {
    slug: 'accountabills',
    name: 'Accountabills',
    kind: 'Fintech · Mobile',
    platform: 'iOS + Android',
    tagline: 'Spending control through approvals and smart card limits.',
    description:
      'A spending-accountability app: send a request with a reason and a receipt, let friends or a group approve it, and a KYC-verified wallet with smart card limits enforces the decision.',
    features: [
      'Spending requests with photo / receipt proof',
      'Approvals from friends or groups',
      'Plaid bank linking, ACH top-ups & withdrawals',
      'Virtual cards with smart limits',
      'KYC, passkeys, 2FA, Apple & Google sign-in',
    ],
    stack: ['Expo 54', 'React Native 0.81', 'Reanimated 4', 'NativeWind', 'Zustand', 'Plaid', 'Socket.IO', 'MMKV'],
    colors: ['#7E51FF', '#6B5EDA', '#241a6b'],
    gallery: [],
  },
  {
    slug: 'uwera',
    name: 'Uwera',
    kind: 'Web',
    platform: 'Web',
    tagline: 'Live at uwera.rw',
    description: 'A web platform built and shipped for the Rwandan market. Visit the live site to explore it.',
    features: [],
    stack: [],
    url: 'https://uwera.rw',
    colors: ['#e98b6a', '#b48cff', '#efe9df'],
    gallery: [],
  },
]
