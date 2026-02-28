import { Resend } from 'resend';

// RESEND_API_KEY が設定されていない場合はダミークライアント
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.EMAIL_FROM ?? 'onboarding@resend.dev';
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? '建設マッチング';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

// ── 招待メール送信 ──────────────────────────────────────────
export async function sendInvitationEmail({
  to,
  companyName,
  inviteUrl,
  message,
}: {
  to: string;
  companyName: string;
  inviteUrl: string;
  message?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.log(`[EMAIL SKIP] RESEND_API_KEY未設定 → ${to} | ${inviteUrl}`);
    return { success: true }; // キーがない場合はスキップ（URL返却で代替）
  }

  try {
    const { error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject: `【${APP_NAME}】ご招待のお知らせ`,
      html: invitationEmailHtml({ companyName, inviteUrl, message }),
    });

    if (error) {
      console.error('[EMAIL ERROR]', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e) {
    console.error('[EMAIL EXCEPTION]', e);
    return { success: false, error: String(e) };
  }
}

// ── 承認通知メール送信 ────────────────────────────────────────
export async function sendApprovalEmail({
  to,
  fullName,
  companyName,
}: {
  to: string;
  fullName: string;
  companyName: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.log(`[EMAIL SKIP] RESEND_API_KEY未設定 → ${to}`);
    return { success: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject: `【${APP_NAME}】ご登録が承認されました`,
      html: approvalEmailHtml({ fullName, companyName }),
    });

    if (error) {
      console.error('[EMAIL ERROR]', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e) {
    console.error('[EMAIL EXCEPTION]', e);
    return { success: false, error: String(e) };
  }
}

// ── HTMLテンプレート: 招待メール ───────────────────────────────
function invitationEmailHtml({
  companyName,
  inviteUrl,
  message,
}: {
  companyName: string;
  inviteUrl: string;
  message?: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ご招待のお知らせ</title>
</head>
<body style="margin:0;padding:0;background:#F5F7FA;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F7FA;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
          <!-- ヘッダー -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a3a6b 0%,#2563EB 100%);padding:32px 40px;text-align:center;">
              <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:0 0 6px;">建設業ビジネスマッチング</p>
              <h1 style="color:#ffffff;font-size:22px;font-weight:800;margin:0;letter-spacing:-0.02em;">${APP_NAME}</h1>
            </td>
          </tr>
          <!-- 本文 -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="color:#1E293B;font-size:18px;font-weight:700;margin:0 0 16px;">ご招待のお知らせ</h2>
              <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 16px;">
                ${companyName} 様、この度は建設マッチングプラットフォームへご招待いたします。
              </p>
              ${message ? `
              <div style="background:#F8FAFC;border-left:4px solid #2563EB;padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:24px;">
                <p style="color:#334155;font-size:14px;line-height:1.6;margin:0;">${message.replace(/\n/g, '<br>')}</p>
              </div>
              ` : ''}
              <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 28px;">
                下記のボタンよりアカウントを作成して、サービスをご利用ください。<br>
                招待リンクの有効期限は <strong>7日間</strong> です。
              </p>
              <!-- ボタン -->
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}" style="display:inline-block;background:linear-gradient(135deg,#1a3a6b 0%,#2563EB 100%);color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:8px;letter-spacing:0.02em;">
                      アカウントを作成する →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- URL表示 -->
          <tr>
            <td style="padding:0 40px 32px;">
              <p style="color:#94A3B8;font-size:12px;margin:0 0 6px;">ボタンが機能しない場合は以下のURLをコピーしてください：</p>
              <p style="color:#2563EB;font-size:12px;word-break:break-all;margin:0;">${inviteUrl}</p>
            </td>
          </tr>
          <!-- フッター -->
          <tr>
            <td style="background:#F8FAFC;padding:20px 40px;border-top:1px solid #E2E8F0;">
              <p style="color:#94A3B8;font-size:12px;margin:0;text-align:center;line-height:1.6;">
                このメールに心当たりがない場合は、無視していただいて構いません。<br>
                © ${new Date().getFullYear()} ${APP_NAME}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// ── HTMLテンプレート: 承認通知メール ──────────────────────────
function approvalEmailHtml({
  fullName,
  companyName,
}: {
  fullName: string;
  companyName: string;
}): string {
  const loginUrl = `${APP_URL}/login`;
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ご登録が承認されました</title>
</head>
<body style="margin:0;padding:0;background:#F5F7FA;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F7FA;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
          <!-- ヘッダー -->
          <tr>
            <td style="background:linear-gradient(135deg,#065F46 0%,#10B981 100%);padding:32px 40px;text-align:center;">
              <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:0 0 6px;">建設業ビジネスマッチング</p>
              <h1 style="color:#ffffff;font-size:22px;font-weight:800;margin:0;letter-spacing:-0.02em;">${APP_NAME}</h1>
            </td>
          </tr>
          <!-- 本文 -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <div style="text-align:center;margin-bottom:24px;">
                <span style="font-size:48px;">✅</span>
              </div>
              <h2 style="color:#1E293B;font-size:18px;font-weight:700;margin:0 0 16px;text-align:center;">
                ご登録が承認されました
              </h2>
              <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">
                ${fullName} 様<br><br>
                ${companyName} のご登録申請が承認されました。<br>
                これより建設マッチングサービスをご利用いただけます。
              </p>
              <!-- ボタン -->
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#065F46 0%,#10B981 100%);color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:8px;">
                      ログインしてはじめる →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- フッター -->
          <tr>
            <td style="background:#F8FAFC;padding:20px 40px;border-top:1px solid #E2E8F0;">
              <p style="color:#94A3B8;font-size:12px;margin:0;text-align:center;line-height:1.6;">
                © ${new Date().getFullYear()} ${APP_NAME}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
