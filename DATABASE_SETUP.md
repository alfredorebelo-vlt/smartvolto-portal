# Database Setup & Migration Guide
## Volto Smart Portal — MySQL with XAMPP (Local) and Apache (Production)

---

## PART 1: LOCAL DEVELOPMENT SETUP (XAMPP)

### Step 1: Install XAMPP

1. Download XAMPP from https://www.apachefriends.org/
2. Choose the version with PHP 8.1+ and MySQL 8.0+
3. Install with default settings
4. Verify installation: Run XAMPP Control Panel
   - Start Apache (should show green)
   - Start MySQL (should show green)

### Step 2: Verify MySQL is Running

```bash
# Open command prompt/terminal and test MySQL connection
mysql -u root -p
# Press Enter (no password by default on fresh XAMPP install)
# You should see: mysql>
# Exit with: exit
```

### Step 3: Create Database and User for Local Development

```bash
# Connect as root
mysql -u root

# Create database
CREATE DATABASE voltosmart_portal_dev;

# Create dedicated database user (security best practice)
CREATE USER 'voltosmart_dev'@'localhost' IDENTIFIED BY 'your_secure_password_here';

# Grant all privileges on the database
GRANT ALL PRIVILEGES ON voltosmart_portal_dev.* TO 'voltosmart_dev'@'localhost';

# Apply changes
FLUSH PRIVILEGES;

# Verify
SHOW GRANTS FOR 'voltosmart_dev'@'localhost';

# Exit
exit
```

**Important**: Replace `'your_secure_password_here'` with a strong password. Save this password — you'll need it for `.env`.

### Step 4: Configure Environment Variables

In the project root, create or update `.env.local` (for development):

```env
# Database (Local MySQL via XAMPP)
DATABASE_URL="mysql://voltosmart_dev:your_secure_password_here@localhost:3306/voltosmart_portal_dev"

# NextAuth Configuration
NEXTAUTH_SECRET="generate-a-random-string-using-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (configure after setting up Google Cloud Console)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Google Workspace Directory API (configure after setup)
GOOGLE_WORKSPACE_ADMIN_EMAIL="admin@voltodrive.com"
GOOGLE_WORKSPACE_PRIVATE_KEY="your-private-key-from-service-account"
GOOGLE_WORKSPACE_PROJECT_ID="your-project-id"
```

**Generate NEXTAUTH_SECRET**:
```bash
openssl rand -base64 32
```
On Windows, if openssl is not available, use Node.js:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Step 5: Update Prisma Schema

Update `prisma/schema.prisma` to include Google Workspace fields:

```prisma
// prisma/schema.prisma

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Account {
  id                 String  @id @default(cuid())
  userId             String
  type               String
  provider           String
  providerAccountId  String
  refresh_token      String?  @db.Text
  access_token       String?  @db.Text
  expires_at         Int?
  token_type         String?
  scope              String?
  id_token           String?  @db.Text
  session_state      String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  PENDING
}

model User {
  id                    String   @id @default(cuid())
  
  // Authentication
  email                 String   @unique
  emailVerified         DateTime?
  name                  String?
  image                 String?

  // Google Workspace Integration
  googleUserId          String?   @unique
  givenName             String?
  familyName            String?
  jobTitle              String?
  department            String?
  officeLocation        String?
  phoneNumber           String?
  managerEmail          String?
  startDate             DateTime?
  
  // Portal Settings
  isAdmin               Boolean   @default(false)
  status                UserStatus @default(ACTIVE)
  lastSyncedAt          DateTime?

  // Relations
  accounts              Account[]
  sessions              Session[]
  announcements         Announcement[]

  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  @@index([email])
  @@index([googleUserId])
  @@index([status])
}

model Announcement {
  id        String   @id @default(cuid())
  title     String
  body      String   @db.Text
  author    String
  kind      String   // "milestone", "launch", "people", "tech"
  time      String
  reactions Int      @default(0)
  
  authorId  String
  author_rel User    @relation(fields: [authorId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([authorId])
}
```

### Step 6: Run Initial Migration

```bash
# From project root
cd "c:\VoltoDrive Apps\voltosmart portal"

# Generate and run migration
npx prisma migrate dev --name init

# When prompted, enter a migration name: "init"
# This will:
# 1. Create migration files in prisma/migrations/
# 2. Apply the migration to voltosmart_portal_dev database
# 3. Generate Prisma Client

# Verify the database was created
mysql -u voltosmart_dev -p voltosmart_portal_dev
# Show tables
SHOW TABLES;
# You should see: Account, Announcement, Session, User
exit
```

### Step 7: Seed Initial Data (Optional)

Create `prisma/seed.ts` to populate mock data:

```typescript
// prisma/seed.ts
import { PrismaClient, UserStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Clear existing data
  await prisma.announcement.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()

  // Create test users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'ricardo@voltodrive.com',
        name: 'Ricardo Oliveira',
        givenName: 'Ricardo',
        familyName: 'Oliveira',
        jobTitle: 'Diretor Executivo',
        department: 'Gestão',
        isAdmin: true,
        status: UserStatus.ACTIVE,
      },
    }),
    prisma.user.create({
      data: {
        email: 'sofia@voltodrive.com',
        name: 'Sofia Santos',
        givenName: 'Sofia',
        familyName: 'Santos',
        jobTitle: 'Product Manager',
        department: 'Produto',
        isAdmin: false,
        status: UserStatus.ACTIVE,
      },
    }),
  ])

  console.log(`Created ${users.length} users`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
```

Run the seed:
```bash
npx prisma db seed
```

Update `package.json` to include seed script:
```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

### Step 8: Test Database Connection in Next.js

Create a test route at `src/app/api/test-db/route.ts`:

```typescript
// src/app/api/test-db/route.ts
import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const userCount = await prisma.user.count()
    const announcementCount = await prisma.announcement.count()
    
    return NextResponse.json({
      status: 'connected',
      users: userCount,
      announcements: announcementCount,
    })
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: String(error) },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
```

Test in browser: http://localhost:3000/api/test-db
Expected response:
```json
{
  "status": "connected",
  "users": 2,
  "announcements": 0
}
```

---

## PART 2: PRODUCTION DEPLOYMENT (voltosmart.voltodrive.com)

### Prerequisites
- SSH/control panel access to voltosmart.voltodrive.com hosting
- Apache with mod_rewrite enabled
- MySQL 8.0+ installed on server
- Node.js 18+ installed on server
- Domain DNS already pointing to server IP

### Step 1: Create Production Database and User

SSH into your server:
```bash
ssh user@voltosmart.voltodrive.com
```

Connect to MySQL and create production database:
```bash
mysql -u root -p
# Enter your server's root password

# Create production database
CREATE DATABASE voltosmart_portal_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Create dedicated production user
CREATE USER 'voltosmart_prod'@'localhost' IDENTIFIED BY 'strong_production_password_here';

# Grant privileges
GRANT ALL PRIVILEGES ON voltosmart_portal_prod.* TO 'voltosmart_prod'@'localhost';
FLUSH PRIVILEGES;

# Verify
SHOW GRANTS FOR 'voltosmart_prod'@'localhost';
exit
```

### Step 2: Set Up Application Directory

```bash
# Navigate to web root (adjust path based on your host)
cd /var/www/

# Clone or upload your project
git clone https://github.com/voltodrive/voltosmart-portal.git voltosmart
# OR upload via SFTP/SCP

cd voltosmart

# Install dependencies
npm install --production

# Build Next.js application
npm run build
```

### Step 3: Create Production Environment File

Create `.env.production.local` on the server:

```env
# Database (Production MySQL)
DATABASE_URL="mysql://voltosmart_prod:strong_production_password_here@localhost:3306/voltosmart_portal_prod"

# NextAuth Configuration
NEXTAUTH_SECRET="generate-another-random-string-using-openssl"
NEXTAUTH_URL="https://voltosmart.voltodrive.com"

# Google OAuth
GOOGLE_CLIENT_ID="your-production-google-client-id"
GOOGLE_CLIENT_SECRET="your-production-google-client-secret"

# Google Workspace
GOOGLE_WORKSPACE_ADMIN_EMAIL="admin@voltodrive.com"
GOOGLE_WORKSPACE_PRIVATE_KEY="your-private-key"
GOOGLE_WORKSPACE_PROJECT_ID="your-project-id"

# Node environment
NODE_ENV="production"
```

### Step 4: Run Production Migration

```bash
# From /var/www/voltosmart
npx prisma migrate deploy

# This applies all migrations to the production database without generating new ones
```

### Step 5: Configure Apache Virtual Host

Create/update Apache configuration for voltosmart.voltodrive.com:

```bash
sudo nano /etc/apache2/sites-available/voltosmart.voltodrive.com.conf
```

Add configuration:
```apache
<VirtualHost *:80>
    ServerName voltosmart.voltodrive.com
    ServerAlias www.voltosmart.voltodrive.com
    ServerAdmin admin@voltodrive.com

    # Redirect HTTP to HTTPS
    Redirect permanent / https://voltosmart.voltodrive.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName voltosmart.voltodrive.com
    ServerAlias www.voltosmart.voltodrive.com
    ServerAdmin admin@voltodrive.com

    DocumentRoot /var/www/voltosmart/.next/static

    # SSL Configuration (use Let's Encrypt)
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/voltosmart.voltodrive.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/voltosmart.voltodrive.com/privkey.pem

    # Enable mod_rewrite
    <Directory /var/www/voltosmart>
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule ^ http://localhost:3000%{REQUEST_URI} [P,QSA]
    </Directory>

    # Proxy to Node.js application (running on port 3000)
    ProxyRequests Off
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/ nocanon
    ProxyPassReverse / http://localhost:3000/

    # Security headers
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
    Header set Referrer-Policy "strict-origin-when-cross-origin"

    # Enable compression
    <IfModule mod_deflate.c>
        AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
    </IfModule>

    ErrorLog ${APACHE_LOG_DIR}/voltosmart.voltodrive.com-error.log
    CustomLog ${APACHE_LOG_DIR}/voltosmart.voltodrive.com-access.log combined
</VirtualHost>
```

Enable the site and required modules:
```bash
sudo a2ensite voltosmart.voltodrive.com.conf
sudo a2enmod rewrite
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod ssl
sudo a2enmod headers
sudo a2enmod deflate

# Test Apache configuration
sudo apache2ctl configtest
# Should output: Syntax OK

# Restart Apache
sudo systemctl restart apache2
```

### Step 6: Set Up SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-apache

# Obtain certificate
sudo certbot certonly --apache -d voltosmart.voltodrive.com -d www.voltosmart.voltodrive.com

# Follow prompts to verify domain ownership
# Certificate will be installed at:
# /etc/letsencrypt/live/voltosmart.voltodrive.com/

# Set up auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Step 7: Start Next.js Application (PM2 Recommended)

Install PM2 globally:
```bash
npm install -g pm2
```

Create PM2 ecosystem file at `/var/www/voltosmart/ecosystem.config.js`:
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'voltosmart-portal',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/voltosmart',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    error_file: '/var/log/voltosmart/error.log',
    out_file: '/var/log/voltosmart/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  }],
};
```

Start application:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Verify it's running
pm2 status
```

### Step 8: Verify Production Deployment

Test the application:
```bash
# Check if API is responding
curl -I https://voltosmart.voltodrive.com/

# Expected: HTTP/2 200
```

Visit in browser: https://voltosmart.voltodrive.com/api/test-db

---

## PART 3: DATABASE BACKUP & MAINTENANCE

### Automated Backups (Production)

Create backup script at `/var/www/voltosmart/backup-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/voltosmart"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="voltosmart_portal_prod"
DB_USER="voltosmart_prod"

mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u $DB_USER -p -h localhost $DB_NAME | gzip > $BACKUP_DIR/voltosmart_$TIMESTAMP.sql.gz

# Keep only last 30 days of backups
find $BACKUP_DIR -name "voltosmart_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/voltosmart_$TIMESTAMP.sql.gz"
```

Make executable and add to crontab:
```bash
chmod +x /var/www/voltosmart/backup-db.sh

# Schedule daily backup at 2 AM
crontab -e
# Add: 0 2 * * * /var/www/voltosmart/backup-db.sh
```

### Monitor Database Size

```bash
mysql -u voltosmart_prod -p voltosmart_portal_prod
# Check size
SELECT table_name, ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
FROM information_schema.tables
WHERE table_schema = 'voltosmart_portal_prod';
exit
```

---

## PART 4: LOCAL TESTING CHECKLIST

- [ ] MySQL running in XAMPP
- [ ] `.env.local` configured with DATABASE_URL
- [ ] `npx prisma migrate dev` completed successfully
- [ ] Database tables exist: `mysql -u voltosmart_dev -p voltosmart_portal_dev -e "SHOW TABLES;"`
- [ ] `npm run dev` server starts without errors
- [ ] http://localhost:3000 loads without console errors
- [ ] http://localhost:3000/api/test-db returns user/announcement counts
- [ ] All navigation links work in app
- [ ] Mock data displays correctly

---

## PART 5: PRODUCTION DEPLOYMENT CHECKLIST

- [ ] Production database created and user configured
- [ ] `.env.production.local` added to server (not in git)
- [ ] `npm install --production && npm run build` completes
- [ ] `npx prisma migrate deploy` succeeds
- [ ] Apache VirtualHost configured
- [ ] SSL certificate obtained via Let's Encrypt
- [ ] Apache modules enabled (rewrite, proxy, ssl, headers)
- [ ] PM2 ecosystem.config.js created and started
- [ ] https://voltosmart.voltodrive.com accessible
- [ ] Database backups automated via cron
- [ ] Server logs monitored for errors

---

## Troubleshooting

### "Connection refused" error
- Verify MySQL is running: `mysql -u root -p`
- Check DATABASE_URL in `.env.local`
- Windows: Verify port 3306 not blocked by firewall

### "Table doesn't exist" error
- Run: `npx prisma migrate dev` again
- Check: `npx prisma generate` to regenerate client

### "Permission denied" on production
- Verify file ownership: `sudo chown -R www-data:www-data /var/www/voltosmart`
- Check directory permissions: `chmod 755 /var/www/voltosmart`

### NextAuth fails on production
- Verify NEXTAUTH_URL matches domain: `https://voltosmart.voltodrive.com`
- NEXTAUTH_SECRET must be 32+ characters
- Google OAuth must have production URLs whitelisted in Google Cloud Console

---

## Next Steps

1. Complete local setup (Steps 1-8)
2. Test database operations
3. Deploy to production following Part 2
4. Set up automated backups
5. Configure Google Workspace integration (when ready)
