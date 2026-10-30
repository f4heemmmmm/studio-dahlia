"use server";

import { headers } from "next/headers";
import { Resend } from "resend";
import { ENQUIRY_OPTIONS, OCCASIONS } from "@/lib/content";

export type EnquiryState =
  | { status: "idle" }
  | { status: "success"; name: string }
  | { status: "error"; message: string; fieldErrors?: Partial<Record<"name" | "email" | "phone", string>> };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Digits with optional leading +, spaces, dashes, dots and brackets
const PHONE_RE = /^\+?[\d\s().-]{6,24}$/;
const MAX = { name: 100, email: 200, venue: 200, notes: 2000 };

// Best-effort throttles: per IP, plus an overall cap so the form can't be used
// to send mail in bulk. They live in this server instance's memory, so they reset
// on redeploys and aren't shared between instances; enough to blunt spam.
const WINDOW_MS = 10 * 60 * 1000;
const PER_IP_LIMIT = 5;
const GLOBAL_LIMIT = 30;
const recent = new Map<string, number[]>();

function throttled(key: string, limit: number) {
  const now = Date.now();
  const hits = (recent.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  recent.set(key, hits);
  return hits.length > limit;
}

// Vercel sets x-real-ip itself. The left-most x-forwarded-for entry is supplied
// by the client and can be forged, so fall back to the right-most hop, which is
// the one appended by the hosting proxy.
async function clientIp() {
  const h = await headers();
  const realIp = h.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const hops = h.get("x-forwarded-for")?.split(",").map((s) => s.trim()).filter(Boolean);
  return hops?.at(-1) ?? "unknown";
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const formatDate = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" });

export async function sendEnquiry(_prev: EnquiryState, formData: FormData): Promise<EnquiryState> {
  const get = (key: string) => String(formData.get(key) ?? "").trim();

  // Bots fill in every field, including this one hidden from people
  if (get("company")) return { status: "success", name: "" };

  // Collapse whitespace: the name goes into the email subject line
  const name = get("name").replace(/\s+/g, " ").slice(0, MAX.name);
  const email = get("email").slice(0, MAX.email);
  const phone = get("phone").replace(/\s+/g, " ");
  const fieldErrors: Partial<Record<"name" | "email" | "phone", string>> = {};
  if (!name) fieldErrors.name = "Please add your name.";
  if (!EMAIL_RE.test(email)) fieldErrors.email = "Please enter a valid email address.";
  if (phone && !PHONE_RE.test(phone)) fieldErrors.phone = "Please enter a valid phone number, or leave it blank.";
  if (Object.keys(fieldErrors).length) {
    return { status: "error", message: "Please check the highlighted fields.", fieldErrors };
  }

  if (throttled(`ip:${await clientIp()}`, PER_IP_LIMIT) || throttled("all", GLOBAL_LIMIT)) {
    return { status: "error", message: "Too many enquiries in a short time. Please try again in a few minutes." };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ENQUIRY_TO_EMAIL;
  const from = process.env.ENQUIRY_FROM_EMAIL;
  if (!apiKey || !to || !from) {
    console.error("Enquiry form: RESEND_API_KEY, ENQUIRY_TO_EMAIL or ENQUIRY_FROM_EMAIL is not set");
    return { status: "error", message: "Sorry, enquiries can't be sent right now. Please try again later." };
  }

  // Only accept values the form actually offers
  const occasion = OCCASIONS.includes(get("type")) ? get("type") : "Other";
  const interest = ENQUIRY_OPTIONS.includes(get("package")) ? get("package") : "Not sure yet";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(get("date")) ? formatDate(get("date")) : "";
  const venue = get("venue").slice(0, MAX.venue);
  const notes = get("notes").slice(0, MAX.notes);

  const rows: [string, string][] = [
    ["Name", name],
    ["Email", email],
    ["Phone", phone],
    ["Occasion", occasion],
    ["Date", date],
    ["Venue", venue],
    ["Interested in", interest],
    ["Notes", notes],
  ].filter((row): row is [string, string] => Boolean(row[1]));

  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");
  const html = `
    <div style="font-family:Georgia,serif;color:#3B3436;font-size:16px;line-height:1.6">
      <p style="margin:0 0 16px">New enquiry from the Studio Dahlia website.</p>
      <table cellpadding="6" style="border-collapse:collapse">
        ${rows
          .map(
            ([k, v]) =>
              `<tr><td style="vertical-align:top;color:#675D60;padding-right:16px">${k}</td><td style="white-space:pre-wrap">${escapeHtml(v)}</td></tr>`,
          )
          .join("")}
      </table>
      <p style="margin:16px 0 0;color:#675D60">Reply to this email to answer ${escapeHtml(name)} directly.</p>
    </div>`;

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to,
    replyTo: email,
    subject: `New enquiry from ${name}${date ? ` · ${date}` : ""}`,
    text,
    html,
  });

  if (error) {
    console.error("Enquiry form: Resend error", error);
    return { status: "error", message: "Sorry, something went wrong sending your enquiry. Please try again." };
  }

  // Acknowledgement to the visitor. The address is unverified, so this is a fixed
  // message with nothing the visitor typed in it; otherwise the form could be used
  // to send arbitrary text from our domain. A failure here shouldn't undo a
  // delivered enquiry.
  const confirmation = await resend.emails.send({
    from,
    to: email,
    replyTo: to,
    subject: "Thank you for your enquiry · Studio Dahlia",
    text: "Hello,\n\nThank you for getting in touch with Studio Dahlia. We've received your enquiry and will get back to you soon.\n\nWarmly,\nStudio Dahlia",
    html: `
      <div style="font-family:Georgia,serif;color:#3B3436;font-size:16px;line-height:1.6">
        <p>Hello,</p>
        <p>Thank you for getting in touch with Studio Dahlia. We&rsquo;ve received your enquiry and will get back to you soon.</p>
        <p>Warmly,<br>Studio Dahlia</p>
      </div>`,
  });
  if (confirmation.error) console.error("Enquiry form: confirmation email failed", confirmation.error);

  return { status: "success", name };
}
