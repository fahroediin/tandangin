# 📝 Tandangin

**Digital Document Signing Platform** - Sign documents digitally and request signatures from others.

![Next.js](https://img.shields.io/badge/Next.js-14.1.0-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-5.9-2D3748?logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwindcss)

## ✨ Features

- 🔐 **Authentication** - Secure login/register with bcrypt password hashing
- ✍️ **Digital Signatures** - Draw, type, or upload your signature
- 📄 **Document Management** - Upload and manage PDF documents
- 👥 **Multi-recipient Signing** - Request signatures from multiple parties
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 📋 **Audit Trail** - Complete history of all document actions

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | SQLite + Prisma ORM |
| Auth | NextAuth.js |
| Styling | Tailwind CSS |
| PDF | pdf-lib |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/fahroediin/tandangin.git
   cd tandangin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   ```env
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Setup database**
   ```bash
   npm run db:generate
   npm run db:push
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📁 Project Structure

```
tandangin/
├── prisma/
│   └── schema.prisma      # Database schema
├── src/
│   ├── app/
│   │   ├── (auth)/        # Login & Register pages
│   │   ├── (dashboard)/   # Protected dashboard pages
│   │   └── api/           # API routes
│   ├── components/
│   │   ├── editor/        # Document editor components
│   │   ├── layout/        # Layout components (Sidebar, Header)
│   │   ├── providers/     # Context providers
│   │   └── tasks/         # Task-related components
│   ├── lib/
│   │   ├── auth.ts        # NextAuth configuration
│   │   ├── db.ts          # Prisma client
│   │   └── utils.ts       # Utility functions
│   └── types/             # TypeScript type definitions
├── package.json
└── tailwind.config.ts
```

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Prisma Studio |

## 🗃️ Database Models

- **User** - User accounts and authentication
- **Signature** - User's saved signatures
- **Task** - Signing tasks (self-sign or request)
- **Document** - Uploaded PDF documents
- **Recipient** - Task recipients with signing status
- **Field** - Signature/form fields on documents
- **AuditLog** - Activity tracking

## 📄 License

MIT License - feel free to use this project for your own purposes.

---

Made with ❤️ by [Fahrudin](https://github.com/fahroediin)
