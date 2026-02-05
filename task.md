# Tandangin E-Sign Development Tasks

## Phase 1: Complete E-Sign Me Flow
- [x] PDF Rendering - Display uploaded PDF in DocumentViewer (Initial iframe implementation)
- [ ] Implement robust Canvas-based PDF Rendering (using pdfjs-dist)
- [x] Signature Embedding - Embed signature into PDF using pdf-lib
- [ ] Add Red color option to SignatureModal
- [ ] Add Create Initials feature to SignatureModal
- [ ] Backend integration - Save task/document to database
- [ ] Implement Audit Trail logging
- [ ] Generate Audit Trail PDF report

## Phase 2: Request E-Sign Flow
- [ ] Identity Authentication settings in recipient modal
- [ ] Color-coded field assignment per recipient
- [ ] Email notification system (using Nodemailer/Resend)
- [ ] Recipient signing page (POV Signer)
- [ ] Requester status tracking page
- [ ] Multi-document support per task

## Phase 3: Polish & Integration
- [ ] Task list with proper status filtering
- [ ] Search functionality
- [ ] Archive and Trash management
- [ ] Settings page
- [ ] Mobile responsive adjustments
