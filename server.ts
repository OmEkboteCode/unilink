import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(express.json({ limit: '4mb' }));
app.use(
  '/uploads',
  express.static(uploadsDir, {
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    },
  }),
);

function getAllowedDomains(): string[] {
  const raw = process.env.ALLOWED_COLLEGE_DOMAINS || 'gmail.com,ac.in,edu';
  return raw
    .split(',')
    .map((d) => d.trim().toLowerCase().replace(/^@/, ''))
    .filter(Boolean);
}

function isStrictCollegeDomainOnly(): boolean {
  return String(process.env.STRICT_COLLEGE_DOMAIN_ONLY || 'false').toLowerCase() === 'true';
}

function checkEmailDomain(email: string) {
  const allowedDomains = getAllowedDomains();
  const normalized = String(email || '').trim().toLowerCase();
  const atIdx = normalized.lastIndexOf('@');
  const domain = atIdx > 0 ? normalized.slice(atIdx + 1) : '';
  const isAllowedCollegeDomain =
    Boolean(domain) &&
    allowedDomains.some((entry) => domain === entry || domain.endsWith(`.${entry}`));

  return {
    email: normalized,
    domain,
    isAllowedCollegeDomain,
    strictMode: isStrictCollegeDomainOnly(),
    reason: isAllowedCollegeDomain
      ? `Matches configured email domain policy (${allowedDomains.join(', ')})`
      : `Domain "${domain || 'unknown'}" is outside configured allowed domains (${allowedDomains.join(', ')})`,
  };
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'UniLink Server' });
});

// Configurable campus settings (domains, drop-off desks)
app.get('/api/campus-config', (_req, res) => {
  res.json({
    allowedCollegeDomains: getAllowedDomains(),
    strictCollegeDomainOnly: isStrictCollegeDomainOnly(),
    campusDropPoints: [
      'Main Block Security Desk',
      'Central Library Help Counter',
      'Student Activity Center',
      'ECE Block Reception',
      'Hostel Warden Office',
    ],
    firebaseStorageConfigured: true,
  });
});

// Server-side college email domain verification check
app.post('/api/auth/check-domain', (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email : '';
  if (!email || !email.includes('@')) {
    res.status(400).json({ error: 'Valid email address is required.' });
    return;
  }
  res.json(checkEmailDomain(email));
});

// Server-side validation for Lost & Found reports
app.post('/api/validate/report', (req, res) => {
  const body = req.body ?? {};
  const errors: Record<string, string> = {};
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const location = typeof body.location === 'string' ? body.location.trim() : '';
  const eventDate = typeof body.eventDate === 'string' ? body.eventDate.trim() : '';
  const eventTime = typeof body.eventTime === 'string' ? body.eventTime.trim() : '';
  const verificationPrompt =
    typeof body.verificationPrompt === 'string' ? body.verificationPrompt.trim() : '';
  const handoverLocation =
    typeof body.handoverLocation === 'string' ? body.handoverLocation.trim() : '';
  const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : '';
  const validTypes = ['lost', 'found'];
  const validCategories = [
    'ID & Cards',
    'Electronics',
    'Books & Notes',
    'Keys & Wallets',
    'Accessories',
    'Lab Gear',
    'Other',
  ];

  if (!validTypes.includes(body.type)) errors.type = 'Invalid report type.';
  if (title.length < 3 || title.length > 100) errors.title = 'Title must be 3–100 characters.';
  if (description.length < 10 || description.length > 1000) {
    errors.description = 'Description must be 10–1000 characters.';
  }
  if (!validCategories.includes(body.category)) errors.category = 'Invalid category.';
  if (location.length < 2 || location.length > 120) errors.location = 'Location must be 2–120 characters.';
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(eventDate)) errors.eventDate = 'Invalid YYYY-MM-DD date.';
  if (eventTime.length < 2 || eventTime.length > 20) errors.eventTime = 'Invalid approximate time.';
  if (verificationPrompt.length > 200) errors.verificationPrompt = 'Verification question is too long.';
  if (handoverLocation.length > 120) errors.handoverLocation = 'Handover location is too long.';
  if (imageUrl.length > 500) errors.imageUrl = 'Image URL exceeds 500 characters.';

  if (Object.keys(errors).length > 0) {
    res.status(400).json({ valid: false, errors });
    return;
  }
  res.json({ valid: true });
});

// Server-side validation for ReLife Exchange listings
app.post('/api/validate/listing', (req, res) => {
  const body = req.body ?? {};
  const errors: Record<string, string> = {};
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const pickupLocation = typeof body.pickupLocation === 'string' ? body.pickupLocation.trim() : '';
  const swapFor = typeof body.swapFor === 'string' ? body.swapFor.trim() : '';
  const borrowDuration = typeof body.borrowDuration === 'string' ? body.borrowDuration.trim() : '';
  const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : '';
  const price = Number(body.price ?? 0);
  const validTypes = ['donate', 'sell', 'swap', 'borrow'];
  const validCategories = [
    'Books & Notes',
    'Calculators',
    'Lab Kits',
    'Electronics',
    'Hostel & Gear',
    'Other',
  ];
  const validConditions = ['Like New', 'Good', 'Fair', 'Well Used'];

  if (!validTypes.includes(body.listingType)) errors.listingType = 'Invalid listing type.';
  if (title.length < 3 || title.length > 120) errors.title = 'Title must be 3–120 characters.';
  if (description.length < 10 || description.length > 1000) {
    errors.description = 'Description must be 10–1000 characters.';
  }
  if (!validCategories.includes(body.category)) errors.category = 'Invalid category.';
  if (!validConditions.includes(body.condition)) errors.condition = 'Invalid condition.';
  if (body.listingType === 'sell' && (!Number.isFinite(price) || price < 0 || price > 100000)) {
    errors.price = 'Price must be between 0 and 100,000.';
  }
  if (body.listingType === 'swap' && (swapFor.length < 2 || swapFor.length > 120)) {
    errors.swapFor = 'Specify desired swap item (2–120 characters).';
  }
  if (body.listingType === 'borrow' && (borrowDuration.length < 2 || borrowDuration.length > 60)) {
    errors.borrowDuration = 'Specify borrow duration (2–60 characters).';
  }
  if (pickupLocation.length < 2 || pickupLocation.length > 120) {
    errors.pickupLocation = 'Pickup location must be 2–120 characters.';
  }
  if (imageUrl.length > 500) errors.imageUrl = 'Image URL exceeds 500 characters.';

  if (Object.keys(errors).length > 0) {
    res.status(400).json({ valid: false, errors });
    return;
  }
  res.json({ valid: true });
});

// Server-side validation for Campus Events
app.post('/api/validate/event', (req, res) => {
  const body = req.body ?? {};
  const errors: Record<string, string> = {};
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const location = typeof body.location === 'string' ? body.location.trim() : '';
  const organizer = typeof body.organizer === 'string' ? body.organizer.trim() : '';
  const eventDate = typeof body.eventDate === 'string' ? body.eventDate.trim() : '';
  const eventTime = typeof body.eventTime === 'string' ? body.eventTime.trim() : '';
  const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : '';
  const validCategories = [
    'Tech & Hackathons',
    'Workshops & Seminars',
    'Cultural & Fests',
    'Clubs & Meetups',
    'Sports & Wellness',
    'Placement & Career',
    'Other',
  ];

  if (title.length < 3 || title.length > 120) errors.title = 'Title must be 3–120 characters.';
  if (description.length < 10 || description.length > 1000) {
    errors.description = 'Description must be 10–1000 characters.';
  }
  if (!validCategories.includes(body.category)) errors.category = 'Invalid category.';
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(eventDate)) errors.eventDate = 'Invalid YYYY-MM-DD date.';
  if (eventTime.length < 2 || eventTime.length > 20) errors.eventTime = 'Invalid event time.';
  if (location.length < 2 || location.length > 120) errors.location = 'Location must be 2–120 characters.';
  if (organizer.length < 2 || organizer.length > 100) errors.organizer = 'Organizer must be 2–100 characters.';
  if (imageUrl.length > 500) errors.imageUrl = 'Image URL exceeds 500 characters.';

  if (Object.keys(errors).length > 0) {
    res.status(400).json({ valid: false, errors });
    return;
  }
  res.json({ valid: true });
});

// Server-side image upload fallback when Firebase Storage is unavailable or unconfigured
app.post('/api/upload', (req, res) => {
  try {
    const dataUrl = typeof req.body?.dataUrl === 'string' ? req.body.dataUrl : '';
    const match = /^data:(image\/(jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
    if (!match) {
      res.status(400).json({ error: 'Only JPEG, PNG, or WebP images are supported.' });
      return;
    }

    const ext = match[2] === 'jpeg' ? 'jpg' : match[2];
    const buffer = Buffer.from(match[3], 'base64');
    if (buffer.byteLength > 2 * 1024 * 1024) {
      res.status(413).json({ error: 'Uploaded image exceeds 2 MB size limit.' });
      return;
    }

    const fileName = `unilink_${Date.now()}_${crypto.randomBytes(6).toString('hex')}.${ext}`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, buffer);

    res.json({ url: `/uploads/${fileName}` });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to store uploaded image.' });
  }
});

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`UniLink server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
