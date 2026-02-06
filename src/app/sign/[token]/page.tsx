'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import PdfRenderer from '@/components/editor/PdfRenderer';
import SignatureModal from '@/components/editor/SignatureModal';

interface TaskData {
    id: string;
    name: string;
    status: string;
    documents: {
        id: string;
        originalName: string;
    }[];
    recipient: {
        id: string;
        name: string;
        email: string;
        status: string;
        color: string;
    };
    fields: Field[];
}

interface Field {
    id: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    page: number;
    value?: string;
    recipientId: string;
}

type PageStatus = 'loading' | 'invalid' | 'expired' | 'already_signed' | 'ready' | 'signing' | 'completed' | 'error';

export default function RecipientSigningPage() {
    const params = useParams();
    const token = params.token as string;

    const [status, setStatus] = useState<PageStatus>('loading');
    const [taskData, setTaskData] = useState<TaskData | null>(null);
    const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
    const [fields, setFields] = useState<Field[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageCount, setPageCount] = useState(1);
    const [signatureModalField, setSignatureModalField] = useState<Field | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Load task data from token
    useEffect(() => {
        const loadTaskData = async () => {
            try {
                const response = await fetch(`/api/sign/${token}`);
                if (!response.ok) {
                    const error = await response.json();
                    if (error.code === 'INVALID_TOKEN') {
                        setStatus('invalid');
                    } else if (error.code === 'EXPIRED') {
                        setStatus('expired');
                    } else if (error.code === 'ALREADY_SIGNED') {
                        setStatus('already_signed');
                    } else {
                        setErrorMessage(error.message || 'Failed to load document');
                        setStatus('error');
                    }
                    return;
                }

                const data = await response.json();
                setTaskData(data);
                setFields(data.fields || []);

                // Load PDF
                const pdfResponse = await fetch(`/api/documents/${data.documents[0].id}/download`);
                if (pdfResponse.ok) {
                    const pdfBuffer = await pdfResponse.arrayBuffer();
                    setPdfData(pdfBuffer);
                }

                setStatus('ready');
            } catch (error) {
                console.error('Error loading task:', error);
                setErrorMessage('Failed to load document. Please try again.');
                setStatus('error');
            }
        };

        if (token) {
            loadTaskData();
        }
    }, [token]);

    const handleFieldClick = (field: Field) => {
        if (field.type === 'signature' || field.type === 'initials') {
            setSignatureModalField(field);
        }
    };

    const handleSignatureSave = (signatureDataUrl: string) => {
        if (!signatureModalField) return;

        setFields(fields.map(f =>
            f.id === signatureModalField.id
                ? { ...f, value: signatureDataUrl }
                : f
        ));
        setSignatureModalField(null);
    };

    const handleSubmit = async () => {
        // Check if all required fields are filled
        const myFields = fields.filter(f => f.recipientId === taskData?.recipient.id);
        const signatureFields = myFields.filter(f => f.type === 'signature' || f.type === 'initials');
        const unsignedFields = signatureFields.filter(f => !f.value);

        if (unsignedFields.length > 0) {
            alert(`Please complete all ${unsignedFields.length} signature field(s) before submitting.`);
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch(`/api/sign/${token}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fields }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to submit signature');
            }

            setStatus('completed');
        } catch (error) {
            console.error('Error submitting signature:', error);
            alert('Failed to submit signature. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Render based on status
    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-600">Loading document...</p>
                </div>
            </div>
        );
    }

    if (status === 'invalid') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md mx-auto px-4">
                    <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h1>
                    <p className="text-gray-600">This signing link is invalid or has been revoked. Please contact the sender for a new link.</p>
                </div>
            </div>
        );
    }

    if (status === 'expired') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md mx-auto px-4">
                    <div className="w-20 h-20 mx-auto mb-6 bg-orange-100 rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Expired</h1>
                    <p className="text-gray-600">This signing link has expired. Please contact the sender to request a new invitation.</p>
                </div>
            </div>
        );
    }

    if (status === 'already_signed') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md mx-auto px-4">
                    <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Already Signed</h1>
                    <p className="text-gray-600">You have already signed this document. No further action is required.</p>
                </div>
            </div>
        );
    }

    if (status === 'completed') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md mx-auto px-4">
                    <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Signature Complete!</h1>
                    <p className="text-gray-600 mb-6">Thank you for signing. The document has been submitted successfully.</p>
                    <p className="text-sm text-gray-500">You may close this window.</p>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md mx-auto px-4">
                    <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
                    <p className="text-gray-600">{errorMessage}</p>
                </div>
            </div>
        );
    }

    // Ready status - show signing interface
    const myFields = fields.filter(f => f.recipientId === taskData?.recipient.id);
    const currentPageFields = myFields.filter(f => f.page === currentPage);

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="font-semibold text-gray-900">{taskData?.name}</h1>
                        <p className="text-sm text-gray-500">
                            Signing as {taskData?.recipient.name} ({taskData?.recipient.email})
                        </p>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                    >
                        {submitting ? 'Submitting...' : 'Complete Signing'}
                    </button>
                </div>
            </header>

            {/* Instructions */}
            <div className="max-w-5xl mx-auto px-4 py-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <p className="text-sm text-blue-800 font-medium">How to sign</p>
                            <p className="text-sm text-blue-700">
                                Click on the highlighted fields to add your signature. Fields marked with your color ({taskData?.recipient.color}) require your input.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Document Viewer */}
            <div className="max-w-5xl mx-auto px-4 pb-8">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {/* Page Navigation */}
                    <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage <= 1}
                            className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-600">
                            Page {currentPage} of {pageCount}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))}
                            disabled={currentPage >= pageCount}
                            className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>

                    {/* PDF with Fields */}
                    <div className="relative flex justify-center p-4 bg-gray-200">
                        {pdfData && (
                            <div className="relative">
                                <PdfRenderer
                                    pdfData={pdfData}
                                    currentPage={currentPage}
                                    width={612}
                                    onLoadSuccess={setPageCount}
                                />

                                {/* Overlay fields */}
                                {currentPageFields.map(field => (
                                    <div
                                        key={field.id}
                                        onClick={() => handleFieldClick(field)}
                                        className="absolute cursor-pointer transition-all hover:ring-2 hover:ring-offset-1"
                                        style={{
                                            left: field.x,
                                            top: field.y,
                                            width: field.width,
                                            height: field.height,
                                            backgroundColor: field.value ? 'transparent' : `${taskData?.recipient.color}20`,
                                            borderWidth: 2,
                                            borderStyle: field.value ? 'solid' : 'dashed',
                                            borderColor: taskData?.recipient.color || '#3b82f6',
                                            borderRadius: 4,
                                        }}
                                    >
                                        {field.value ? (
                                            <img
                                                src={field.value}
                                                alt="Signature"
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs font-medium"
                                                style={{ color: taskData?.recipient.color }}>
                                                {field.type === 'signature' ? 'Click to Sign' : 'Click to Add Initials'}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Signature Modal */}
            {signatureModalField && (
                <SignatureModal
                    mode={signatureModalField.type === 'initials' ? 'initials' : 'signature'}
                    onComplete={(signatureData) => handleSignatureSave(signatureData)}
                    onClose={() => setSignatureModalField(null)}
                />
            )}
        </div>
    );
}
