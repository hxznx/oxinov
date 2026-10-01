// The small part of nodemailer the Edu API uses. nodemailer ships no types, and this avoids another
// third-party package (@types/nodemailer) for three signatures.
declare module 'nodemailer' {
  export interface SendMailOptions {
    from: string;
    to: string;
    subject: string;
    text: string;
    html: string;
  }

  export interface Transporter {
    sendMail(options: SendMailOptions): Promise<unknown>;
  }

  export function createTransport(options: { host: string; port: number; secure: boolean; ignoreTLS: boolean }): Transporter;
}
