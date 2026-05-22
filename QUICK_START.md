# QuickStart: Local Database Setup

## 5-Minute Setup (XAMPP)

### 1. Start XAMPP
- Open XAMPP Control Panel
- Click **Start** for Apache and MySQL
- Wait for both to show green

### 2. Create Database User
```bash
mysql -u root
CREATE DATABASE voltosmart_portal_dev;
CREATE USER 'voltosmart_dev'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON voltosmart_portal_dev.* TO 'voltosmart_dev'@'localhost';
FLUSH PRIVILEGES;
exit
```

### 3. Configure Environment
Copy `.env.example` to `.env.local` and update DATABASE_URL:
```env
DATABASE_URL="mysql://voltosmart_dev:your_password@localhost:3306/voltosmart_portal_dev"
NEXTAUTH_SECRET="your-random-32-char-secret"
NEXTAUTH_URL="http://localhost:3000"
```

Generate NEXTAUTH_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 4. Run Migration
```bash
npx prisma migrate dev --name init
```

### 5. Start Dev Server
```bash
npm run dev
```

Visit http://localhost:3000

---

## Verify Setup

Test database connection:
```bash
curl http://localhost:3000/api/test-db
```

Expected response:
```json
{"status": "connected", "users": 0, "announcements": 0}
```

---

## Troubleshooting

**"Connection refused"**
- Is MySQL running in XAMPP? (should be green)
- Check DATABASE_URL matches your password

**"Table doesn't exist"**
- Run: `npx prisma migrate dev` again
- Check: `npx prisma db push`

**Port 3000 already in use**
```bash
npm run dev -- -p 3001
```

---

## Next: Add Sample Data

```bash
npx prisma db seed
```

(After creating `prisma/seed.ts` - see DATABASE_SETUP.md)

---

## Production Deployment

When ready, follow **DATABASE_SETUP.md** → **PART 2: Production Deployment**

---

## Architecture Notes

- **Directory Provider Pattern**: `src/lib/directory/index.ts` abstracts data source (mock vs Google Workspace)
- **Database**: MySQL via Prisma ORM
- **Auth**: NextAuth.js with Google OAuth (configured in next steps)
- **UI**: Next.js with React, Tailwind CSS + Volto Design System tokens

Current state: ✅ Schema ready | ✅ Providers ready | ⏳ Auth setup (next) | ⏳ UI components (next)
