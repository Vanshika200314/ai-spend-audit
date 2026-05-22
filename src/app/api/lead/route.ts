// src/app/api/lead/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

const resendAPIKey = process.env.RESEND_API_KEY;
const resend = resendAPIKey ? new Resend(resendAPIKey) : null;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { auditId, email, companyName, role, teamSize, b_honey } = body;

    // Honeypot spam protection: immediately reject if this hidden field is filled
    if (b_honey) {
      return NextResponse.json({ error: 'Spam detected' }, { status: 400 });
    }

    if (!auditId || !email) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Create the lead entry linked to the audit
    await prisma.lead.create({
      data: {
        auditId,
        email,
        companyName: companyName || null,
        role: role || null,
        teamSize: teamSize || null,
      },
    });

    // Send transactional email via Resend
    if (resend) {
      await resend.emails.send({
        from: 'onboarding@resend.dev', // Default sandbox sender address
        to: email,
        subject: 'Your AI Spend Audit Report',
        html: `
          <h1>AI Spend Audit Complete</h1>
          <p>Thank you for auditing your AI software spend. We have successfully processed your configuration.</p>
          <p>For stack profiles with significant monthly savings, a representative from Credex will reach out to schedule a consulting review.</p>
        `,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}