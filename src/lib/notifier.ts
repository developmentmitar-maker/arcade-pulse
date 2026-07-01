// ============================================
// Email Notification Service
// ============================================
// Sends update notification emails via Resend to
// all active subscribers when changes are detected.

import { Resend } from 'resend';
import dbConnect from '@/lib/db';
import User from '@/lib/models/user';
import Notification from '@/lib/models/notification';
import type { ChangeDetail, WebsiteId } from '@/types';
import { WEBSITES } from '@/types';
import { format } from 'date-fns';
import mongoose from 'mongoose';

// ============================================
// Resend Configuration
// ============================================
// Required env vars:
//   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxx
//   EMAIL_FROM=Arcade Pulse <onboarding@resend.dev>

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_FROM =
  process.env.EMAIL_FROM || 'Arcade Pulse <onboarding@resend.dev>';

// ============================================
// Main notification function
// ============================================

export async function notifySubscribers(
  websiteId: WebsiteId,
  changes: ChangeDetail[],
  snapshotId: mongoose.Types.ObjectId
): Promise<{ sent: number; failed: number }> {
  await dbConnect();

  // Fetch all active subscribers
  const subscribers = await User.find({ isActive: true }).select('email').lean();

  if (subscribers.length === 0 || changes.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const website = WEBSITES[websiteId];
  const detectedAt = format(new Date(), "h:mm a 'IST'");
  let sent = 0;
  let failed = 0;

  // Build plain-text change summary
  const changeSummary = changes
    .map(
      (c) =>
        `📋 ${c.section.charAt(0).toUpperCase() + c.section.slice(1)}\n` +
        `   Previous: ${c.previousValue}\n` +
        `   Current: ${c.currentValue}`
    )
    .join('\n\n');

  const subject = '🚀 Google Arcade Update Detected';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  for (const subscriber of subscribers) {
    try {
      const htmlBody = buildEmailHtml({
        websiteName: website.name,
        websiteUrl: website.url,
        changes,
        detectedAt,
        appUrl,
        email: subscriber.email,
      });

      await resend.emails.send({
        from: EMAIL_FROM,
        to: subscriber.email,
        subject,
        html: htmlBody,
        text: `Google Arcade Update Detected\n\nWebsite: ${website.name}\n\n${changeSummary}\n\nDetected: ${detectedAt}\n\nVisit: ${website.url}`,
      });

      await Notification.create({
        email: subscriber.email,
        snapshotId,
        changeType: changes.map((c) => c.section).join(', '),
        previousValue: changes.map((c) => `${c.section}: ${c.previousValue}`).join('; '),
        currentValue: changes.map((c) => `${c.section}: ${c.currentValue}`).join('; '),
        status: 'sent',
      });

      sent++;
    } catch (error) {
      console.error(`[notifier] Failed to send email to ${subscriber.email}:`, error);

      await Notification.create({
        email: subscriber.email,
        snapshotId,
        changeType: changes.map((c) => c.section).join(', '),
        previousValue: changes.map((c) => `${c.section}: ${c.previousValue}`).join('; '),
        currentValue: changes.map((c) => `${c.section}: ${c.currentValue}`).join('; '),
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      failed++;
    }
  }

  return { sent, failed };
}

// ============================================
// Email HTML Template
// ============================================

interface EmailTemplateProps {
  websiteName: string;
  websiteUrl: string;
  changes: ChangeDetail[];
  detectedAt: string;
  appUrl: string;
  email: string;
}

function buildEmailHtml({
  websiteName,
  websiteUrl,
  changes,
  detectedAt,
  appUrl,
  email,
}: EmailTemplateProps): string {
  const changeBlocks = changes
    .map(
      (c) => `
      <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 18px; margin-bottom: 14px;">
        <p style="color: #06B6D4; margin: 0 0 12px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;">${c.section}</p>
        <div style="margin-bottom: 10px;">
          <p style="color: #94a3b8; margin: 0 0 5px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Previous</p>
          <p style="color: #f1f5f9; margin: 0; font-size: 14px; background: rgba(239,68,68,0.12); padding: 10px 12px; border-radius: 6px; border-left: 3px solid #ef4444; line-height: 1.5;">${c.previousValue}</p>
        </div>
        <div>
          <p style="color: #94a3b8; margin: 0 0 5px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Current</p>
          <p style="color: #f1f5f9; margin: 0; font-size: 14px; background: rgba(34,197,94,0.12); padding: 10px 12px; border-radius: 6px; border-left: 3px solid #22c55e; line-height: 1.5;">${c.currentValue}</p>
        </div>
      </div>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin: 0; padding: 0; background-color: #080c14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <div style="max-width: 580px; margin: 40px auto; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%); padding: 36px 32px; text-align: center;">
      <div style="font-size: 32px; margin-bottom: 8px;">🚀</div>
      <h1 style="color: white; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Arcade Pulse</h1>
      <p style="color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 14px; font-weight: 500;">Update Detected</p>
    </div>

    <!-- Body -->
    <div style="background: #0f1729; padding: 32px;">
      <div style="margin-bottom: 24px;">
        <p style="color: #64748b; margin: 0 0 4px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600;">Website</p>
        <p style="color: #f1f5f9; margin: 0; font-size: 16px; font-weight: 700;">${websiteName}</p>
      </div>

      <div style="margin-bottom: 24px;">
        <p style="color: #64748b; margin: 0 0 14px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600;">Changes Detected</p>
        ${changeBlocks}
      </div>

      <div style="margin-bottom: 28px;">
        <p style="color: #64748b; margin: 0 0 4px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600;">Detected At</p>
        <p style="color: #f1f5f9; margin: 0; font-size: 15px; font-weight: 600;">${detectedAt}</p>
      </div>

      <a href="${websiteUrl}" style="display: block; text-align: center; background: linear-gradient(135deg, #4F46E5, #06B6D4); color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px; letter-spacing: 0.2px;">
        Visit Official Website →
      </a>
    </div>

    <!-- Footer -->
    <div style="background: #080c14; padding: 20px 32px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center;">
      <p style="color: #334155; margin: 0; font-size: 12px; line-height: 1.6;">
        You're receiving this because you subscribed to Arcade Pulse updates.<br/>
        <a href="${appUrl}/unsubscribe?email=${encodeURIComponent(email)}" style="color: #475569; text-decoration: underline;">Unsubscribe</a>
        &nbsp;•&nbsp; Powered by <strong style="color: #475569;">Arcade Pulse</strong>
      </p>
    </div>

  </div>
</body>
</html>
  `.trim();
}
