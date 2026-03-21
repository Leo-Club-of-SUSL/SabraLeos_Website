# 🦁 Leo Club of SUSL - Developer Handover

Welcome, fellow Leo/Developer! This document is designed to help you understand, maintain, and extend the Leo Club of Sabaragamuwa University of Sri Lanka (SUSL) website. 

The goal of this project is to provide a premium, accessible, and easily manageable gateway for our club's activities and members.

---

## 1. Project Overview
The website serves as the digital face of the Leo Club of SUSL, featuring:
- **Public Portal**: Showcases projects, leadership, awards, and an extensive photo gallery.
- **Admin Dashboard**: A secure CMS where committee members can update site content, manage projects, and upload images without touching the code.
- **Modern UI**: Built with a "Premium & Minimalist" aesthetic, focusing on accessibility (WCAG AA) and responsive design.

### 🛠 Tech Stack
- **Frontend**: [React](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/) (Type safety is our friend!)
- **Build Tool**: [Vite](https://vitejs.dev/) (Fast development and optimized builds)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Utility-first styling) & [Framer Motion](https://www.framer.com/motion/) (Animations)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL + Auth + Realtime)
- **Image Storage**: [Cloudinary](https://cloudinary.com/) (For Gallery/Awards) & [Supabase Storage](https://supabase.com/storage) (For Leadership/Site Content)
- **Deployment**: [Netlify](https://www.netlify.com/) (Continuous Deployment from GitHub)
- **SEO**: [React Helmet Async](https://github.com/staylor/react-helmet-async)

- **Live URL**: [https://sabraleos.org](https://sabraleos.org)
- **GitHub Repository**: [Leo-Club-of-SUSL/SabraLeos_Website](https://github.com/Leo-Club-of-SUSL/SabraLeos_Website)

---

## 2. Accounts & Access
To manage the full lifecycle of the site, the ICT/Web committee needs access to:
1. **GitHub Org**: For code hosting and collaborative development.
2. **Netlify**: Directs deployment and manages the Custom Domain/SSL.
3. **Supabase**: Primary database and administrative user management.
4. **Cloudinary**: Media library for large-scale image assets.
5. **GoDaddy**: Domain registration (`sabraleos.org`).
6. **UptimeRobot**: Monitors site status 24/7.
7. **Google Search Console**: Monitors search visibility and index status.

> [!IMPORTANT]
> **Credential Security**: All accounts must be tied to the official club email. Never share passwords in plain text. Use a shared Password Manager (like Bitwarden) for the committee.

---

## 3. Local Development Setup
Follow these steps to get the project running on your machine:

1. **Clone the Repo**:
   ```bash
   git clone https://github.com/Leo-Club-of-SUSL/SabraLeos_Website.git
   cd SabraLeos_Website
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Setup Environment Variables**:
   Create a `.env` file in the root directory. Copy the contents from `.env.example` and fill in the secrets (see Section 4).
4. **Run Dev Server**:
   ```bash
   npm run dev
   ```
   The site will be available at `http://localhost:5173`.

---

## 4. Environment Variables
You need the following keys in your `.env` file for the app to function:

| Variable | Description | Where to find it |
|----------|-------------|-------------------|
| `VITE_SUPABASE_URL` | Your Supabase Project API URL | Supabase Dashboard > Settings > API |
| `VITE_SUPABASE_ANON_KEY` | Public Anon key for client-side access | Supabase Dashboard > Settings > API |
| `VITE_CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud identifier | Cloudinary Dashboard |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Unsigned upload preset for images | Cloudinary > Settings > Upload |
| `VITE_BASE_URL` | The production URL (used for SEO/OG tags) | `https://sabraleos.org` |

---

## 5. Project Structure
```text
/src
  /components     # Reusable UI elements (Navbar, Footer, Hero, etc.)
  /context        # React Context (Auth, Theme, Data loading)
  /lib            # Shared services (Supabase client, Security, Cloudinary upload)
  /pages          # Main page components (Home, Gallery, AdminDashboard)
  /types.ts       # Global TypeScript interfaces
/public           # Static assets (favicons, robots.txt, sitemap.xml)
/supabase         # Database schema and RLS policies
```

---

## 6. Database
The database is hosted on **Supabase** (Postgres). 

### Tables:
- `projects`: Stores all club projects (Active/Ongoing/Completed).
- `leadership`: Stores members of the Executive and Board committees.
- `site_content`: A Key-Value store allowing admins to change homepage text/links.
- `gallery`: Registry of images visible in the photo library and home feed.
- `awards`: Recognition received by the club.
- `security_logs`: Audit trail for login attempts and administrative actions.

### 🛡 Row Level Security (RLS)
We use RLS to ensure data integrity:
- **Public**: Can only `SELECT` (read) from tables.
- **Authenticated Admins**: Can perform `ALL` actions (Insert/Update/Delete).
- **Security Logs**: Anyone can `INSERT` (to log failed attempts), but only admins can `SELECT`.

---

## 7. Storage (Hybrid Approach)
We use two storage solutions to optimize for cost and performance:
1. **Supabase Storage**: Used for stable assets like Leadership photos and Site Logo.
   - *Why?* Integration with the database is native and highly secure.
2. **Cloudinary**: Used for high-volume assets like Gallery images and Awards.
   - *Why?* Cloudinary provides automatic image compression and optimization on the fly, saving bandwidth for our users.

---

## 8. Deployment
The site is hosted on **Netlify** with automatic CI/CD:
- **Auto-Deploy**: Every time you push code to the `main` branch on GitHub, Netlify automatically builds and deploys the update.
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Manual Redeploy**: You can trigger a "Clear Cache and Deploy" from the Netlify Dashboard > Deploys if something feels stuck.

---

## 9. Domain & DNS
- **Domain Name**: `sabraleos.org` (GoDaddy)
- **Management**: DNS is managed by **Netlify**.
- **SSL**: Automatic HTTPS is handled via Let's Encrypt through Netlify.
- **Note**: If you need to add custom MX records (for email) or TXT records (for verification), do it in the **Netlify DNS Settings**.

---

## 10. Common Tasks

### How to add a new admin user?
1. Go to **Supabase Dashboard** > **Authentication** > **Users**.
2. Click "Add User" > "Create new user".
3. Use the club member's email and a temporary password (they should change it later).

### How to update environment variables?
1. **Locally**: Update your `.env` file.
2. **Production**: Go to **Netlify Dashboard** > **Site Settings** > **Environment Variables**. Add them there and trigger a "New Deploy".

### How to roll back a deployment?
If a push to `main` breaks the site:
1. Go to **Netlify** > **Deploys**.
2. Find the last successful deploy.
3. Click "Publish Deploy" to roll back immediately.

---

## 11. Architecture Decisions
- **Supabase Over Firebase**: Better relational data handling (SQL) and excellent developer experience for TypeScript.
- **Hybrid Storage**: Supabase is perfect for structured club data; Cloudinary is superior for media delivery and optimization.
- **RLS Mandatory**: We never disable RLS in production. It is our primary defense against unauthorized data modification.

---

## 12. Known Limitations & Future Improvements
- **Supabase/Cloudinary Free Tiers**: Keep an eye on usage. We currently use `browser-image-compression` on the client side to keep file sizes under **300KB** and preserve our free-tier quotas.
- **Future Goals**:
  - Integrate a **KPI System** for member performance tracking.
  - Interactive **Member Portal** for Leo-only resources.
  - Native **Event Registration** system to move away from external Google Forms.

---

## 13. Emergency & Support
- **Site is down?**: Check [Netlify Status](https://www.netlifystatus.com/) and [Supabase Status](https://status.supabase.com/).
- **Lost Admin Access?**: Use the Supabase Dashboard to reset passwords or create a new user.
- **Supabase Paused?**: Free tier projects pause after 1 week of inactivity. Simply log into the Supabase dashboard and click "Restore Project".

### 📚 Official Docs:
- [Supabase Documentation](https://supabase.com/docs)
- [Netlify Help Center](https://docs.netlify.com/)
- [Cloudinary Documentation](https://cloudinary.com/documentation)

---
*Maintained by the ICT & Web Development Committee, Leo Club of SUSL.*
