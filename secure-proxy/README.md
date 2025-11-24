# TikTok Audyt - Secure API Proxy

This is a secure API proxy server that implements comprehensive security measures for the TikTok Audyt application, including CORS protection, CSRF tokens, rate limiting, and request signing.

## Security Features

### 🔒 Core Security
- **Domain Whitelist**: CORS restricted to allowed origins only
- **CSRF Protection**: Anti-CSRF tokens with httpOnly cookies
- **Rate Limiting**: Per-IP limits for general and critical endpoints
- **Security Headers**: CSP, HSTS, X-Frame-Options, etc.
- **Input Validation**: Request sanitization and validation
- **Admin IP Bypass**: Configurable admin IP whitelist

### 🛡️ Advanced Protection
- **HMAC Request Signing**: Critical endpoints require signature verification
- **Nonce Management**: One-time tokens for replay attack prevention
- **Secret Management**: All API keys and secrets kept server-side only
- **Security Logging**: Comprehensive audit trail of security events

### 🚫 Attack Prevention
- **SQL Injection**: Input validation and parameterized queries
- **XSS Protection**: CSP headers and content sanitization
- **CSRF Attacks**: Token validation and SameSite cookies
- **Replay Attacks**: Nonce-based request signing
- **Rate Limiting**: DDoS and abuse prevention
- **Data Exfiltration**: Origin restrictions and CSP

## Setup Instructions

### 1. Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env
```

Fill in your actual values in `.env`:
```bash
# Required: Generate a strong random string for HMAC signing
SERVER_SECRET=your-256-bit-random-string-here

# Required: Your Supabase service role key (NEVER expose to frontend)
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Required: Your Apify token (NEVER expose to frontend)
APIFY_TOKEN=your-apify-token

# Optional: Stripe secret key for payments
STRIPE_SECRET_KEY=your-stripe-secret-key

# Update with your actual domains
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Development

```bash
npm run dev
```

### 4. Production Build

```bash
npm run build
npm start
```

## Deployment Options

### Option 1: Deploy with Application (Recommended)

If you're using the same server for frontend and backend:

1. Build the proxy: `npm run build`
2. Start the proxy on port 3001: `npm start`
3. Configure your frontend to use the proxy endpoints
4. Set up a reverse proxy (nginx) to route `/api/*` to the secure proxy

### Option 2: Separate Server Deployment

Deploy the proxy on a separate server:

1. Deploy to your server of choice (Heroku, VPS, etc.)
2. Update `ALLOWED_ORIGINS` with your frontend domain
3. Update frontend API endpoints to point to the proxy server

### Option 3: Cloudflare Workers (Advanced)

For maximum security and performance, deploy as Cloudflare Workers:

1. Convert Express routes to Cloudflare Workers format
2. Use Cloudflare KV for token storage
3. Enable Cloudflare security features (Bot Fight Mode, etc.)

## Frontend Integration

Update your frontend to use the secure proxy endpoints:

```typescript
// Instead of calling Supabase edge function directly:
// await supabase.functions.invoke('tiktok-scraper', { body: data })

// Use the secure proxy:
import { secureFetch } from './lib/security';

const response = await secureFetch('/api/tiktok-scraper', {
  method: 'POST',
  body: JSON.stringify(data)
});
```

## Security Checklist

### ✅ Environment Security
- [ ] All secrets are in environment variables, not hardcoded
- [ ] `.env` file is in `.gitignore`
- [ ] Different secrets for dev/staging/production environments
- [ ] Service role keys are never exposed to frontend
- [ ] Admin IPs are properly configured

### ✅ Network Security
- [ ] CORS origins are restricted to your actual domains
- [ ] HTTPS is enforced in production
- [ ] Security headers are properly configured
- [ ] Rate limits are appropriate for your usage

### ✅ Application Security
- [ ] CSRF tokens are working correctly
- [ ] HMAC signing is implemented for critical operations
- [ ] Input validation is comprehensive
- [ ] Error messages don't leak sensitive information

### ✅ Monitoring & Maintenance
- [ ] Security events are being logged
- [ ] Rate limit violations are monitored
- [ ] Token rotation procedures are established
- [ ] Security logs are regularly reviewed

## API Endpoints

### Security Endpoints
- `GET /api/csrf` - Get CSRF token
- `GET /api/nonce` - Get nonce for HMAC signing
- `GET /api/health` - Health check

### Application Endpoints
- `POST /api/tiktok-scraper` - Secure proxy to TikTok scraper function

## Troubleshooting

### CORS Errors
- Verify your domain is in `ALLOWED_ORIGINS`
- Check that the origin header matches exactly
- Ensure HTTPS is used in production

### CSRF Errors
- Clear browser cookies and refresh
- Check that CSRF tokens are being generated
- Verify cookie settings for your domain

### Rate Limit Errors
- Check if your IP is hitting the limits
- Consider increasing limits for legitimate usage
- Implement user-specific rate limiting if needed

### HMAC Signature Errors
- Verify nonce is being used correctly
- Check that request body hasn't been modified
- Ensure server secret is consistent

## Production Considerations

1. **Secrets Management**: Use a proper secrets manager (AWS Secrets Manager, Azure Key Vault, etc.)
2. **Monitoring**: Set up alerts for security events and rate limit violations
3. **Logging**: Use structured logging and ship logs to a central system
4. **Scaling**: Consider using Redis for rate limiting and token storage
5. **Updates**: Keep dependencies updated and monitor security advisories

## Contributing

When making changes to security features:

1. Test all security measures thoroughly
2. Update this documentation
3. Consider the impact on legitimate users
4. Test with various attack scenarios
5. Review changes with security-focused eyes

---

**Security Note**: This proxy implements multiple layers of security. However, security is an ongoing process. Regularly review and update security measures, monitor for new threats, and follow security best practices.