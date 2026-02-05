# Tandangin E-Sign Implementation Plan

## Overview
Melengkapi fitur e-sign berdasarkan review flow yang telah dilakukan. Sistem saat ini memiliki skeleton UI tetapi belum terintegrasi dengan backend dan belum bisa memproses PDF.

---

## Current State vs Expected

### E-Sign Me Flow
| Feature | Status | Notes |
|---------|--------|-------|
| Upload Document | ✅ Done | File selection works |
| Task Name | ✅ Done | Auto-fill from filename |
| Field Palette | ✅ Done | 7 field types available |
| Signature Draw | ⚠️ Partial | Missing red color, initials |
| PDF Viewer | ❌ Missing | Only placeholder, no real PDF |
| Signature Embed | ❌ Missing | Not saving to PDF |
| Backend Save | ❌ Missing | Using sessionStorage only |
| Audit Trail | ❌ Missing | No logging or PDF report |

### Request E-Sign Flow
| Feature | Status | Notes |
|---------|--------|-------|
| Recipient Management | ✅ Done | Name, email, role, order |
| Identity Auth | ❌ Missing | Not in advance settings |
| Field per Recipient | ❌ Missing | No color-coded assignment |
| Email Notification | ❌ Missing | No email system |
| Signer POV Page | ❌ Missing | Recipients can't sign |
| Status Tracking | ❌ Missing | No progress updates |

---

## Phase 1: Complete E-Sign Me

### 1.1 PDF Rendering
#### [MODIFY] [DocumentViewer.tsx](file:///c:/Users/User/Documents/Github_Fahrudin/WEB/tandangin/src/components/editor/DocumentViewer.tsx)
- Install `pdfjs-dist` or use `react-pdf`
- Load actual PDF from upload
- Render pages with zoom/scroll

#### [NEW] [usePdfDocument.ts](file:///c:/Users/User/Documents/Github_Fahrudin/WEB/tandangin/src/hooks/usePdfDocument.ts)
- Custom hook for PDF loading state
- Handle page navigation
- Track current page number

### 1.2 Signature Embedding
#### [MODIFY] [assign-fields/page.tsx](file:///c:/Users/User/Documents/Github_Fahrudin/WEB/tandangin/src/app/(dashboard)/create-task/assign-fields/page.tsx)
- Use `pdf-lib` (already installed) to embed signatures
- Convert signature canvas to image
- Place at field coordinates

#### [NEW] [pdfService.ts](file:///c:/Users/User/Documents/Github_Fahrudin/WEB/tandangin/src/lib/pdfService.ts)
- `embedSignature(pdfBytes, signatureImage, position)`
- `addDateField(pdfBytes, date, position)`
- `addTextField(pdfBytes, text, position)`

### 1.3 Signature Modal Enhancements
#### [MODIFY] [SignatureModal.tsx](file:///c:/Users/User/Documents/Github_Fahrudin/WEB/tandangin/src/components/editor/SignatureModal.tsx)
- Add red color option (#ef4444)
- Add "Create Initials" button with separate canvas
- Add "Type" tab for typed signatures

### 1.4 Backend Integration
#### [NEW] [tasks/route.ts](file:///c:/Users/User/Documents/Github_Fahrudin/WEB/tandangin/src/app/api/tasks/route.ts)
- POST: Create new task with document
- GET: List user's tasks with filters

#### [NEW] [tasks/[id]/route.ts](file:///c:/Users/User/Documents/Github_Fahrudin/WEB/tandangin/src/app/api/tasks/[id]/route.ts)
- GET: Task details
- PATCH: Update task status
- DELETE: Soft delete task

#### [NEW] [documents/upload/route.ts](file:///c:/Users/User/Documents/Github_Fahrudin/WEB/tandangin/src/app/api/documents/upload/route.ts)
- Handle multipart file upload
- Store in `uploads/` directory
- Create Document record in DB

### 1.5 Audit Trail
#### [NEW] [AuditService.ts](file:///c:/Users/User/Documents/Github_Fahrudin/WEB/tandangin/src/lib/auditService.ts)
- `logAction(taskId, action, userId, metadata)`
- Actions: created, viewed, signed, completed, etc.

#### [NEW] [tasks/[id]/audit/route.ts](file:///c:/Users/User/Documents/Github_Fahrudin/WEB/tandangin/src/app/api/tasks/[id]/audit/route.ts)
- GET: Return audit log entries
- GET with `?format=pdf`: Generate PDF report

---

## Phase 2: Request E-Sign

### 2.1 Enhanced Recipient Settings
#### [MODIFY] [RecipientManager.tsx](file:///c:/Users/User/Documents/Github_Fahrudin/WEB/tandangin/src/components/editor/RecipientManager.tsx)
- Add "Advance Settings" modal
- Identity Authentication options (None, Email OTP, SMS)

### 2.2 Field Assignment per Recipient
#### [MODIFY] [FieldPalette.tsx](file:///c:/Users/User/Documents/Github_Fahrudin/WEB/tandangin/src/components/editor/FieldPalette.tsx)
- Recipient selector dropdown
- Color indicator per recipient

#### [MODIFY] [DocumentViewer.tsx](file:///c:/Users/User/Documents/Github_Fahrudin/WEB/tandangin/src/components/editor/DocumentViewer.tsx)
- Show field owner with color
- Filter fields by recipient

### 2.3 Email System
#### [NEW] [emailService.ts](file:///c:/Users/User/Documents/Github_Fahrudin/WEB/tandangin/src/lib/emailService.ts)
- Configure Nodemailer or Resend
- Templates: invitation, reminder, completed

#### [NEW] [send-email/route.ts](file:///c:/Users/User/Documents/Github_Fahrudin/WEB/tandangin/src/app/api/send-email/route.ts)
- POST: Send signing invitation to recipients

### 2.4 Recipient Signing Page
#### [NEW] [sign/[token]/page.tsx](file:///c:/Users/User/Documents/Github_Fahrudin/WEB/tandangin/src/app/sign/[token]/page.tsx)
- Public page for recipients
- View document with assigned fields only
- Complete signing without login

---

## Verification Plan

### Automated Tests
```bash
npm run test  # Run Jest/Vitest tests
```

### Manual Verification
1. Upload PDF → verify renders correctly
2. Add signature field → verify placement
3. Draw signature → verify saves to PDF
4. Complete task → verify status in task list
5. Check audit trail → verify all actions logged

---

## Priority Order
1. **PDF Rendering** - Core functionality
2. **Backend Integration** - Data persistence
3. **Signature Embedding** - Complete e-sign me flow
4. **Request E-Sign** - Multi-user support
