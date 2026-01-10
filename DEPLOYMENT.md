# Deployment Guide - Colorcode

## Prerequisites

- Node.js 20+ installed
- MongoDB Atlas account with a cluster
- Cloudinary account (for video uploads)
- Vercel account

## Environment Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/colorcode.git
   cd colorcode
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment variables**
   ```bash
   cp .env.example .env.local
   ```

4. **Configure environment variables in `.env.local`:**
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: Generate with `openssl rand -base64 32`
   - `NEXT_PUBLIC_APP_URL`: Your production domain
   - Cloudinary credentials for video uploads

5. **Setup database indexes**
   ```bash
   npm run setup-db
   ```

## Local Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Production Deployment

### Option 1: Vercel (Recommended)

1. Push code to GitHub
2. Connect your GitHub repository to Vercel
3. Add environment variables in Vercel dashboard
4. Vercel automatically deploys on push to `main`

### Option 2: Self-Hosted

```bash
npm run build
npm start
```

## Security Checklist

- [ ] Change JWT_SECRET to a strong value
- [ ] Use HTTPS/SSL certificate
- [ ] Enable MongoDB IP whitelist
- [ ] Set secure headers (already configured)
- [ ] Enable rate limiting
- [ ] Setup monitoring (Sentry, LogRocket)
- [ ] Configure CORS appropriately
- [ ] Enable database backups
- [ ] Setup email verification
- [ ] Monitor error logs regularly

## Performance Optimization

- Images are optimized and cached
- Database indexes are automatically created
- API routes use compression
- Browser source maps disabled in production
- Static content cached with long TTL

## Monitoring

- Vercel Analytics dashboard
- Error tracking with Sentry (optional)
- MongoDB Atlas monitoring
- Email alerts for critical errors

## Support

For issues or questions, open an issue on GitHub or contact support.
