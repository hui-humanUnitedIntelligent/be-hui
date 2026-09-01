// supabase/functions/send-auth-email/index.ts
// Supabase Auth Send Email Hook — mehrsprachige Auth-E-Mails.
// Ersetzt Supabase's Default-Templates durch HUI-gebrandete, lokalisierte E-Mails.
//
// Hook-Docs: https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook
// Payload: { user, email_data: { token, token_hash, email, email_action_type, redirect_to, site_url, token_new, token_hash_new } }
//
// KRITISCHER FIX (2026-09-01, INC-002 Bestätigungsmails kamen nie an):
// Root Cause 1: Diese Funktion hat NUR HTML gebaut und als JSON zurückgegeben
//   ({ headers, body }) — das ist NICHT der Vertrag des Send-Email-Hooks.
//   Der Hook muss den Versand SELBST übernehmen (z.B. via Resend API). GoTrue
//   wertet nur den HTTP-Status der Hook-Antwort aus ("Hook ran successfully"
//   bei 200) — es sendet NIE selbst eine Mail, wenn ein Custom-Hook aktiv ist.
//   Beleg: auth_logs zeigte "msg":"Hook ran successfully","success":true bei
//   JEDEM Versuch, aber es kam nie eine Mail an (Gmail UND GMX gleich betroffen
//   — kein Zustellungsproblem, sondern kompletter Sende-Ausfall).
// Root Cause 2: Der Bestätigungslink wurde als `${redirectTo}?token=${token}
//   &type=${type}` gebaut — zeigt direkt auf die App mit rohem Token. Die App
//   hat aber NIRGENDS Code der `verifyOtp()` aufruft oder `?token=`-Query-Params
//   verarbeitet (AuthCallback.jsx erwartet nur die von Supabase's JS-SDK via
//   URL-Hash automatisch gesetzte Session). FIX: Link zeigt jetzt auf
//   `${SUPABASE_URL}/auth/v1/verify?token={token_hash}&type=...&redirect_to=...`
//   — der offizielle Supabase-Verify-Endpoint, der die Session erzeugt und
//   per Redirect mit URL-Hash an die App weitergibt.
// Root Cause 3: `emailData.type` existiert im echten Hook-Payload NICHT —
//   das Feld heißt `email_action_type`. Dadurch defaultete JEDE Mail (auch
//   Recovery, E-Mail-Änderung) auf "signup"-Inhalt. FIX: liest jetzt
//   `email_action_type` mit Fallback auf `type` (Abwärtskompatibilität).
//
// Unterstützte Typen: signup, recovery, email_change_current, email_change_new,
//   password_changed_notification, email_changed_notification, reauthentication, invite

// Deno.serve direkt verwenden (kein externer Import — Management API Deploy bricht bei deno.land Imports mit BOOT_ERROR)
// === emailContent.ts inline (Deployment via Management API unterstützt nur single-file) ===

// supabase/functions/send-auth-email/emailContent.ts
// Übersetzte Inhalte für alle Supabase Auth E-Mails (Send Email Hook).
// SSOT für mehrsprachige Auth-E-Mails — 8 Sprachen: DE/EN/ES/FR/IT/TR/PT/SQ.
// Erzeugt aus /tmp/gen_email_content.py — bei Änderungen dort synchron halten.

const SUPPORTED_LANGS = ['de','en','es','fr','it','tr','pt','sq'] as const;
type Lang = typeof SUPPORTED_LANGS[number];

function resolveLang(raw: unknown): Lang {
  const l = typeof raw === 'string' ? raw.toLowerCase() : '';
  return (SUPPORTED_LANGS as readonly string[]).includes(l) ? (l as Lang) : 'de';
}

interface EmailContentEntry {
  subject: string;
  heading: string;
  body: string;
  body2?: string;
  button?: string;
}

const CONTENT: Record<string, Record<Lang, EmailContentEntry>> = {
  signup: {
    de: { subject: "HUI E-Mail Verifizierung", heading: "Bestätige deine E-Mail-Adresse", body: "Klicke auf den folgenden Link, um dein HUI-Konto zu aktivieren.", button: "E-Mail bestätigen" },
    en: { subject: "HUI Email Verification", heading: "Confirm your email address", body: "Click the link below to activate your HUI account.", button: "Confirm email" },
    es: { subject: "Verificación de correo de HUI", heading: "Confirma tu dirección de correo", body: "Haz clic en el siguiente enlace para activar tu cuenta de HUI.", button: "Confirmar correo" },
    fr: { subject: "Vérification de l'e-mail HUI", heading: "Confirme ton adresse e-mail", body: "Clique sur le lien suivant pour activer ton compte HUI.", button: "Confirmer l'e-mail" },
    it: { subject: "Verifica email HUI", heading: "Confermi il tuo indirizzo email", body: "Clicca sul link seguente per attivare il tuo account HUI.", button: "Confermare l'email" },
    tr: { subject: "HUI E-posta Doğrulama", heading: "E-posta adresini onayla", body: "HUI hesabını etkinleştirmek için aşağıdaki bağlantıya tıkla.", button: "E-postayı onayla" },
    pt: { subject: "Verificação de e-mail HUI", heading: "Confirma o teu endereço de e-mail", body: "Clica no link abaixo para ativar a tua conta HUI.", button: "Confirmar e-mail" },
    sq: { subject: "Verifikimi i email-it HUI", heading: "Konfirmo adresën tënde të email-it", body: "Kliko në linkun më poshtë për të aktivizuar llogarinë tënde HUI.", button: "Konfirmo email-in" },
  },
  recovery: {
    de: { subject: "HUI Passwort-Wiederherstellung", heading: "Passwort zurücksetzen", body: "Klicke auf den folgenden Link, um dein Passwort zu ersetzen.", button: "Passwort ersetzen" },
    en: { subject: "HUI Password Recovery", heading: "Reset your password", body: "Click the link below to set a new password.", button: "Set new password" },
    es: { subject: "Recuperación de contraseña HUI", heading: "Restablece tu contraseña", body: "Haz clic en el siguiente enlace para establecer una nueva contraseña.", button: "Restablecer contraseña" },
    fr: { subject: "Récupération du mot de passe HUI", heading: "Réinitialise ton mot de passe", body: "Clique sur le lien suivant pour définir un nouveau mot de passe.", button: "Définir le mot de passe" },
    it: { subject: "Recupero password HUI", heading: "Reimposta la tua password", body: "Clicca sul link seguente per impostare una nuova password.", button: "Imposta nuova password" },
    tr: { subject: "HUI Şifre Kurtarma", heading: "Şifreni sıfırla", body: "Yeni bir şifre belirlemek için aşağıdaki bağlantıya tıkla.", button: "Yeni şifre belirle" },
    pt: { subject: "Recuperação de senha HUI", heading: "Redefine a tua senha", body: "Clica no link abaixo para definir uma nova senha.", button: "Definir nova senha" },
    sq: { subject: "Rikuperimi i fjalëkalimit HUI", heading: "Rivendos fjalëkalimin tënd", body: "Kliko në linkun më poshtë për të vendosur një fjalëkalim të ri.", button: "Vendos fjalëkalim të ri" },
  },
  // INC-006 v2 (2026-09-01): Sicherheitsmitteilung an die ALTE Adresse.
  // Klar vom "Neue E-Mail bestätigen"-Text der neuen Adresse unterschieden.
  // Der Empfaenger bestaetigt HIERMIT, dass er die Aenderung initiiert hat
  // (nicht, dass er die neue Adresse besitzt). Mit token_hash_new + token.
  email_change_current: {
    de: { subject: "Sicherheitshinweis: E-Mail-Änderung bei HUI", heading: "Wird deine E-Mail-Adresse geändert?", body: "Jemand versucht, deine HUI-E-Mail-Adresse von {oldEmail} zu {newEmail} zu ändern. Warst du das? Dann bestätige die Änderung. Warst du das nicht? Kontaktiere sofort unseren Support.", button: "Änderung bestätigen" },
    en: { subject: "Security Notice: Email change at HUI", heading: "Is your email address being changed?", body: "Someone is trying to change your HUI email address from {oldEmail} to {newEmail}. Was this you? Then confirm the change. Wasn't you? Contact our support immediately.", button: "Confirm change" },
    es: { subject: "Aviso de seguridad: Cambio de correo en HUI", heading: "¿Se está cambiando tu correo?", body: "Alguien está intentando cambiar tu correo de HUI de {oldEmail} a {newEmail}. ¿Fuiste tú? Entonces confirma el cambio. ¿No fuiste tú? Contacta con nuestro soporte inmediatamente.", button: "Confirmar cambio" },
    fr: { subject: "Avis de sécurité: Changement d'e-mail HUI", heading: "Ton adresse e-mail est-elle modifiée ?", body: "Quelqu'un essaie de changer ton adresse e-mail HUI de {oldEmail} à {newEmail}. C'était toi ? Confirme alors le changement. Ce n'était pas toi ? Contacte notre support immédiatement.", button: "Confirmer le changement" },
    it: { subject: "Avviso di sicurezza: Modifica email HUI", heading: "La tua email sta cambiando?", body: "Qualcuno sta cercando di cambiare la tua email HUI da {oldEmail} a {newEmail}. Sei tu? Conferma la modifica. Non sei tu? Contatta immediatamente il nostro supporto.", button: "Conferma modifica" },
    tr: { subject: "Güvenlik bildirimi: HUI e-posta değişikliği", heading: "E-posta adresin değiştiriliyor mu?", body: "Biri HUI e-posta adresini {oldEmail} adresinden {newEmail} adresine değiştirmeye çalışıyor. Sen miydin? Değişikliği onayla. Sen değildin? Destek ekibimizle derhal iletişime geç.", button: "Değişikliği onayla" },
    pt: { subject: "Aviso de segurança: Alteração de e-mail HUI", heading: "O teu e-mail está a ser alterado?", body: "Alguém está a tentar alterar o teu e-mail HUI de {oldEmail} para {newEmail}. Foste tu? Confirma a alteração. Não foste tu? Contacta o nosso suporte imediatamente.", button: "Confirmar alteração" },
    sq: { subject: "Njoftim sigurie: Ndryshimi i email-it HUI", heading: "Po ndryshohet adresa jote e email-it?", body: "Dikush po përpiqet të ndryshojë adresën tënde të email-it HUI nga {oldEmail} në {newEmail}. Që ti? Atëherë konfirmo ndryshimin. Nuk që ti? Kontakto mbështetjen tonë menjëherë.", button: "Konfirmo ndryshimin" },
  },
  email_change_new: {
    de: { subject: "HUI E-Mail-Änderung bestätigen", heading: "Neue E-Mail-Adresse bestätigen", body: "Bestätige deine neue E-Mail-Adresse für dein HUI-Konto ({oldEmail} → {newEmail}).", button: "E-Mail bestätigen" },
    en: { subject: "Confirm your HUI email change", heading: "Confirm new email address", body: "Confirm your new email address for your HUI account ({oldEmail} → {newEmail}).", button: "Confirm email" },
    es: { subject: "Confirma el cambio de correo de HUI", heading: "Confirma la nueva dirección de correo", body: "Confirma tu nueva dirección de correo para tu cuenta de HUI ({oldEmail} → {newEmail}).", button: "Confirmar correo" },
    fr: { subject: "Confirme le changement d'e-mail HUI", heading: "Confirme la nouvelle adresse e-mail", body: "Confirme ta nouvelle adresse e-mail pour ton compte HUI ({oldEmail} → {newEmail}).", button: "Confirmer l'e-mail" },
    it: { subject: "Confermi la modifica dell'email HUI", heading: "Confermi il nuovo indirizzo email", body: "Confermi il tuo nuovo indirizzo email per il tuo account HUI ({oldEmail} → {newEmail}).", button: "Confermare l'email" },
    tr: { subject: "HUI e-posta değişikliğini onayla", heading: "Yeni e-posta adresini onayla", body: "HUI hesabın için yeni e-posta adresini onayla ({oldEmail} → {newEmail}).", button: "E-postayı onayla" },
    pt: { subject: "Confirma a alteração de e-mail HUI", heading: "Confirma o novo endereço de e-mail", body: "Confirma o teu novo endereço de e-mail para a tua conta HUI ({oldEmail} → {newEmail}).", button: "Confirmar e-mail" },
    sq: { subject: "Konfirmo ndryshimin e email-it HUI", heading: "Konfirmo adresën e re të email-it", body: "Konfirmo adresën tënde të re të email-it për llogarinë HUI ({oldEmail} → {newEmail}).", button: "Konfirmo email-in" },
  },
  // INC-006 FIX (2026-09-01): GoTrue sendet bei email_change den Typ "email_change"
  // (NICHT "email_change_current" / "email_change_new" — diese werden nur bei
  // secure_email_change mit dem eingebauten Mailer verwendet). Mit aktivem Custom
  // Hook sendet GoTrue IMMER "email_change" als email_action_type, unabhaengig
  // von der secure_email_change Einstellung. Ohne diesen Eintrag returnierte die
  // Function HTTP 400 ("Unknown email type") → GoTrue returnierte 500
  // "Invalid payload sent to hook" → kein Mail-Versand, kein State-Update.
  email_change: {
    de: { subject: "HUI E-Mail-Änderung bestätigen", heading: "Neue E-Mail-Adresse bestätigen", body: "Bestätige deine neue E-Mail-Adresse für dein HUI-Konto ({oldEmail} → {newEmail}).", button: "E-Mail bestätigen" },
    en: { subject: "Confirm your HUI email change", heading: "Confirm new email address", body: "Confirm your new email address for your HUI account ({oldEmail} → {newEmail}).", button: "Confirm email" },
    es: { subject: "Confirma el cambio de correo de HUI", heading: "Confirma la nueva dirección de correo", body: "Confirma tu nueva dirección de correo para tu cuenta de HUI ({oldEmail} → {newEmail}).", button: "Confirmar correo" },
    fr: { subject: "Confirme le changement d'e-mail HUI", heading: "Confirme la nouvelle adresse e-mail", body: "Confirme ta nouvelle adresse e-mail pour ton compte HUI ({oldEmail} → {newEmail}).", button: "Confirmer l'e-mail" },
    it: { subject: "Confermi la modifica dell'email HUI", heading: "Confermi il nuovo indirizzo email", body: "Confermi il tuo nuovo indirizzo email per il tuo account HUI ({oldEmail} → {newEmail}).", button: "Confermare l'email" },
    tr: { subject: "HUI e-posta değişikliğini onayla", heading: "Yeni e-posta adresini onayla", body: "HUI hesabın için yeni e-posta adresini onayla ({oldEmail} → {newEmail}).", button: "E-postayı onayla" },
    pt: { subject: "Confirma a alteração de e-mail HUI", heading: "Confirma o novo endereço de e-mail", body: "Confirma o teu novo endereço de e-mail para a tua conta HUI ({oldEmail} → {newEmail}).", button: "Confirmar e-mail" },
    sq: { subject: "Konfirmo ndryshimin e email-it HUI", heading: "Konfirmo adresën e re të email-it", body: "Konfirmo adresën tënde të re të email-it për llogarinë HUI ({oldEmail} → {newEmail}).", button: "Konfirmo email-in" },
  },
  password_changed_notification: {
    de: { subject: "HUI: Dein Passwort wurde geändert", heading: "Dein Passwort wurde geändert", body: "Wir bestätigen, dass das Passwort für dein HUI-Konto {email} soeben geändert wurde.", body2: "Warst das nicht du? Dann kontaktiere umgehend unseren Support unter support@be-hui.com, damit wir dein Konto schützen können." },
    en: { subject: "HUI: Your password was changed", heading: "Your password was changed", body: "We confirm that the password for your HUI account {email} was just changed.", body2: "Wasn't you? Please contact our support immediately at support@be-hui.com so we can secure your account." },
    es: { subject: "HUI: Se cambió tu contraseña", heading: "Se cambió tu contraseña", body: "Confirmamos que la contraseña de tu cuenta HUI {email} fue cambiada recién.", body2: "¿No fuiste tú? Contacta de inmediato a nuestro soporte en support@be-hui.com para proteger tu cuenta." },
    fr: { subject: "HUI : ton mot de passe a été modifié", heading: "Ton mot de passe a été modifié", body: "Nous confirmons que le mot de passe de ton compte HUI {email} vient d'être modifié.", body2: "Ce n'était pas toi ? Contacte immédiatement notre support à support@be-hui.com pour sécuriser ton compte." },
    it: { subject: "HUI: la tua password è stata modificata", heading: "La tua password è stata modificata", body: "Confermiamo che la password del tuo account HUI {email} è stata appena modificata.", body2: "Non sei stato tu? Contatta subito il nostro supporto a support@be-hui.com per proteggere il tuo account." },
    tr: { subject: "HUI: Şifren değiştirildi", heading: "Şifren değiştirildi", body: "HUI hesabın {email} için şifrenin az önce değiştirildiğini onaylıyoruz.", body2: "Bu sen değil miydin? Hesabını korumamız için hemen support@be-hui.com üzerinden destek ekibimizle iletişime geç." },
    pt: { subject: "HUI: A tua senha foi alterada", heading: "A tua senha foi alterada", body: "Confirmamos que a senha da tua conta HUI {email} foi alterada agora mesmo.", body2: "Não foste tu? Contacta imediatamente o nosso suporte em support@be-hui.com para protegermos a tua conta." },
    sq: { subject: "HUI: Fjalëkalimi yt u ndryshua", heading: "Fjalëkalimi yt u ndryshua", body: "Konfirmojmë që fjalëkalimi për llogarinë tënde HUI {email} sapo u ndryshua.", body2: "Nuk ishe ti? Kontakto menjëherë ekipin tonë të mbështetjes në support@be-hui.com që të mbrojmë llogarinë tënde." },
  },
  email_changed_notification: {
    de: { subject: "HUI: Deine E-Mail-Adresse wurde geändert", heading: "Deine E-Mail-Adresse wurde geändert", body: "Die E-Mail-Adresse für dein HUI-Konto wurde von {oldEmail} zu {email} geändert. Ab jetzt meldest du dich mit der neuen Adresse an.", body2: "Warst das nicht du? Dann kontaktiere umgehend unseren Support unter support@be-hui.com, damit wir dein Konto schützen können." },
    en: { subject: "HUI: Your email address was changed", heading: "Your email address was changed", body: "The email address for your HUI account was changed from {oldEmail} to {email}. From now on, log in with the new address.", body2: "Wasn't you? Please contact our support immediately at support@be-hui.com so we can secure your account." },
    es: { subject: "HUI: Se cambió tu dirección de correo", heading: "Se cambió tu dirección de correo", body: "La dirección de correo de tu cuenta HUI se cambió de {oldEmail} a {email}. A partir de ahora, inicia sesión con la nueva dirección.", body2: "¿No fuiste tú? Contacta de inmediato a nuestro soporte en support@be-hui.com para proteger tu cuenta." },
    fr: { subject: "HUI : ton adresse e-mail a été modifiée", heading: "Ton adresse e-mail a été modifiée", body: "L'adresse e-mail de ton compte HUI a été modifiée de {oldEmail} à {email}. Connecte-toi désormais avec la nouvelle adresse.", body2: "Ce n'était pas toi ? Contacte immédiatement notre support à support@be-hui.com pour sécuriser ton compte." },
    it: { subject: "HUI: il tuo indirizzo email è stato modificato", heading: "Il tuo indirizzo email è stato modificato", body: "L'indirizzo email del tuo account HUI è stato modificato da {oldEmail} a {email}. Da ora accedi con il nuovo indirizzo.", body2: "Non sei stato tu? Contatta subito il nostro supporto a support@be-hui.com per proteggere il tuo account." },
    tr: { subject: "HUI: E-posta adresin değiştirildi", heading: "E-posta adresin değiştirildi", body: "HUI hesabının e-posta adresi {oldEmail} adresinden {email} adresine değiştirildi. Bundan sonra yeni adresle giriş yap.", body2: "Bu sen değil miydin? Hesabını korumamız için hemen support@be-hui.com üzerinden destek ekibimizle iletişime geç." },
    pt: { subject: "HUI: O teu endereço de e-mail foi alterado", heading: "O teu endereço de e-mail foi alterado", body: "O endereço de e-mail da tua conta HUI foi alterado de {oldEmail} para {email}. A partir de agora, inicia sessão com o novo endereço.", body2: "Não foste tu? Contacta imediatamente o nosso suporte em support@be-hui.com para protegermos a tua conta." },
    sq: { subject: "HUI: Adresa jote e email-it u ndryshua", heading: "Adresa jote e email-it u ndryshua", body: "Adresa e email-it për llogarinë tënde HUI u ndryshua nga {oldEmail} në {email}. Tani e tutje kyçu me adresën e re.", body2: "Nuk ishe ti? Kontakto menjëherë ekipin tonë të mbështetjes në support@be-hui.com që të mbrojmë llogarinë tënde." },
  },
  magic_link: {
    de: { subject: "Dein HUI Magic Link", heading: "Magic Link", body: "Klicke auf den folgenden Link, um dich einzuloggen.", button: "Einloggen" },
    en: { subject: "Your HUI Magic Link", heading: "Magic Link", body: "Click the link below to log in.", button: "Log in" },
    es: { subject: "Tu enlace mágico de HUI", heading: "Enlace mágico", body: "Haz clic en el siguiente enlace para iniciar sesión.", button: "Iniciar sesión" },
    fr: { subject: "Ton lien magique HUI", heading: "Lien magique", body: "Clique sur le lien suivant pour te connecter.", button: "Se connecter" },
    it: { subject: "Il tuo Magic Link HUI", heading: "Magic Link", body: "Clicca sul link seguente per accedere.", button: "Accedi" },
    tr: { subject: "HUI Magic Link'in", heading: "Magic Link", body: "Giriş yapmak için aşağıdaki bağlantıya tıkla.", button: "Giriş yap" },
    pt: { subject: "O teu Magic Link HUI", heading: "Magic Link", body: "Clica no link abaixo para iniciar sessão.", button: "Iniciar sessão" },
    sq: { subject: "Magic Link-u yt HUI", heading: "Magic Link", body: "Kliko në linkun më poshtë për t'u kyçur.", button: "Kyçu" },
  },
  invite: {
    de: { subject: "Du wurdest zu HUI eingeladen", heading: "Einladung zu HUI", body: "Du wurdest eingeladen, ein Konto bei HUI zu erstellen. Klicke auf den Link, um die Einladung anzunehmen.", button: "Einladung annehmen" },
    en: { subject: "You've been invited to HUI", heading: "Invitation to HUI", body: "You've been invited to create a HUI account. Click the link to accept the invitation.", button: "Accept invitation" },
    es: { subject: "Has sido invitado a HUI", heading: "Invitación a HUI", body: "Has sido invitado a crear una cuenta en HUI. Haz clic en el enlace para aceptar la invitación.", button: "Aceptar invitación" },
    fr: { subject: "Tu as été invité à rejoindre HUI", heading: "Invitation à HUI", body: "Tu as été invité à créer un compte HUI. Clique sur le lien pour accepter l'invitation.", button: "Accepter l'invitation" },
    it: { subject: "Sei stato invitato su HUI", heading: "Invito a HUI", body: "Sei stato invitato a creare un account su HUI. Clicca sul link per accettare l'invito.", button: "Accetta invito" },
    tr: { subject: "HUI'ye davet edildin", heading: "HUI davetiyesi", body: "Bir HUI hesabı oluşturman için davet edildin. Daveti kabul etmek için bağlantıya tıkla.", button: "Daveti kabul et" },
    pt: { subject: "Foste convidado para o HUI", heading: "Convite para o HUI", body: "Foste convidado a criar uma conta no HUI. Clica no link para aceitar o convite.", button: "Aceitar convite" },
    sq: { subject: "U ftove në HUI", heading: "Ftesë për HUI", body: "U ftove për të krijuar një llogari në HUI. Kliko në link për të pranuar ftesën.", button: "Prano ftesën" },
  },
  reauthentication: {
    de: { subject: "HUI Login-Bestätigung", heading: "Bestätige deine Anmeldung", body: "Gib diesen Code ein, um deine Anmeldung zu bestätigen:" },
    en: { subject: "HUI Login Confirmation", heading: "Confirm your login", body: "Enter this code to confirm your login:" },
    es: { subject: "Confirmación de acceso HUI", heading: "Confirma tu inicio de sesión", body: "Introduce este código para confirmar tu inicio de sesión:" },
    fr: { subject: "Confirmation de connexion HUI", heading: "Confirme ta connexion", body: "Saisis ce code pour confirmer ta connexion :" },
    it: { subject: "Confermi accesso HUI", heading: "Confermi il tuo accesso", body: "Inserisci questo codice per confermare il tuo accesso:" },
    tr: { subject: "HUI Giriş Onayı", heading: "Girişini onayla", body: "Girişini onaylamak için bu kodu gir:" },
    pt: { subject: "Confirmação de acesso HUI", heading: "Confirma o teu acesso", body: "Insere este código para confirmar o teu acesso:" },
    sq: { subject: "Konfirmimi i kyçjes HUI", heading: "Konfirmo kyçjen tënde", body: "Fut këtë kod për të konfirmuar kyçjen tënde:" },
  },
};

const FOOTER: Record<Lang, string> = {
  de: "Diese Nachricht wurde automatisch von HUI – Human United Intelligence generiert.",
  en: "This message was automatically generated by HUI – Human United Intelligence.",
  es: "Este mensaje fue generado automáticamente por HUI – Human United Intelligence.",
  fr: "Ce message a été généré automatiquement par HUI – Human United Intelligence.",
  it: "Questo messaggio è stato generato automaticamente da HUI – Human United Intelligence.",
  tr: "Bu mesaj HUI – Human United Intelligence tarafından otomatik olarak oluşturulmuştur.",
  pt: "Esta mensagem foi gerada automaticamente pela HUI – Human United Intelligence.",
  sq: "Ky mesazh u gjenerua automatikisht nga HUI – Human United Intelligence.",
};


// ── Konstanten ────────────────────────────────────────────────────────
const FROM = "HUI <noreply@be-hui.com>";
const LOGO_URL = "https://be-hui.vercel.app/assets/brand/hui-logo.png";
const BANNER_BG = "#0EC4B8";
const BTN_BG = "#0EC4B8";
const TEXT_DARK = "#1A1A2E";
const TEXT_MUTED = "#6B7280";
const BG_BODY = "#F8F9FA";
const BG_CARD = "#FFFFFF";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";

// Typen, die KEINEN Bestätigungslink brauchen (reine Info-Mails ohne Token-Flow)
const NO_LINK_TYPES = new Set(["password_changed_notification", "email_changed_notification"]);
// reauthentication zeigt einen Code statt eines Links
const CODE_TYPES = new Set(["reauthentication"]);

// Mapping von email_action_type (granular) auf den Supabase /auth/v1/verify "type"-Query-Param
function toVerifyType(actionType: string): string {
  if (actionType.startsWith("email_change")) return "email_change";
  if (actionType === "signup") return "signup";
  if (actionType === "recovery") return "recovery";
  if (actionType === "invite") return "invite";
  if (actionType === "magiclink") return "magiclink";
  return actionType;
}

// ── HTML Template ─────────────────────────────────────────────────────

function buildHTML(entry: EmailContentEntry, lang: Lang, type: string, link: string, code: string): string {
  const buttonHTML = entry.button && !NO_LINK_TYPES.has(type) && !CODE_TYPES.has(type)
    ? `<tr><td style="padding:0 40px 24px;" align="center">
         <a href="${link}"
            style="display:inline-block;padding:14px 36px;background:${BTN_BG};color:#fff;
                   text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;
                   font-family:Inter,Helvetica,Arial,sans-serif;">
           ${entry.button}
         </a>
       </td></tr>
       <tr><td style="padding:0 40px 8px;" align="center">
         <p style="font-size:12px;color:${TEXT_MUTED};margin:0;">
           ${lang === "de" ? "Wenn der Button nicht funktioniert, kopiere diesen Link:" :
             lang === "en" ? "If the button doesn't work, copy this link:" :
             lang === "es" ? "Si el botón no funciona, copia este enlace:" :
             lang === "fr" ? "Si le bouton ne fonctionne pas, copie ce lien :" :
             lang === "it" ? "Se il pulsante non funziona, copia questo link:" :
             lang === "tr" ? "Buton çalışmıyorsa, bu bağlantıyı kopyala:" :
             lang === "pt" ? "Se o botão não funcionar, copia este link:" :
             "Nëse butoni nuk funksionon, kopjo këtë link:"}
         </p>
         <p style="font-size:12px;color:${TEXT_MUTED};word-break:break-all;margin:4px 0 0;">
           ${link}
         </p>
       </td></tr>`
    : "";

  // Code-Block nur für reauthentication (OTP-Code)
  const codeHTML = CODE_TYPES.has(type)
    ? `<tr><td style="padding:16px 40px 24px;" align="center">
         <div style="font-size:32px;font-weight:700;letter-spacing:8px;color:${TEXT_DARK};
                     font-family:'Courier New',monospace;padding:16px 24px;
                     background:#F3F4F6;border-radius:8px;display:inline-block;">
           ${code}
         </div>
       </td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BG_BODY};font-family:Inter,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG_BODY};padding:24px 0;">
    <tr><td align="center">
      <table width="500" cellpadding="0" cellspacing="0" style="background:${BG_CARD};border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <!-- Banner -->
        <tr><td style="background:${BANNER_BG};padding:28px 40px;text-align:center;">
          <img src="${LOGO_URL}" alt="HUI" width="80" style="margin:0 auto;display:block;"/>
        </td></tr>
        <!-- Heading -->
        <tr><td style="padding:32px 40px 8px;">
          <h1 style="margin:0;font-size:22px;font-weight:700;color:${TEXT_DARK};letter-spacing:-0.3px;">
            ${entry.heading}
          </h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:12px 40px 8px;">
          <p style="margin:0;font-size:15px;color:${TEXT_DARK};line-height:1.7;">
            ${entry.body}
          </p>
        </td></tr>
        ${entry.body2 ? `
        <tr><td style="padding:8px 40px 0;">
          <p style="margin:0;font-size:14px;color:${TEXT_MUTED};line-height:1.6;">
            ${entry.body2}
          </p>
        </td></tr>` : ""}
        <!-- Code (nur reauthentication) -->
        ${codeHTML}
        <!-- Button -->
        ${buttonHTML}
        <!-- Footer -->
        <tr><td style="padding:24px 40px 32px;border-top:1px solid #EEE;">
          <p style="margin:0;font-size:12px;color:${TEXT_MUTED};text-align:center;line-height:1.5;">
            ${FOOTER[lang]}
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Resend-Versand ────────────────────────────────────────────────────

async function sendViaResend(to: string, subject: string, html: string): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!RESEND_API_KEY) {
    return { ok: false, error: "RESEND_API_KEY nicht konfiguriert" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: `Resend HTTP ${res.status}: ${JSON.stringify(json)}` };
    }
    return { ok: true, id: json.id };
  } catch (err) {
    return { ok: false, error: `Resend fetch failed: ${err?.message || err}` };
  }
}

// ── Hook Handler ─────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS" } });
  }

  try {
    const payload = await req.json();

    // Hook-Payload extrahieren
    const user = payload.user || {};
    const emailData = payload.email_data || {};

    // FIX Root Cause 3: Feld heißt email_action_type, nicht type (Fallback für Abwärtskompatibilität)
    const type: string = emailData.email_action_type || emailData.type || "signup";
    const token: string = emailData.token || "";
    const tokenHash: string = emailData.token_hash || token;
    const email: string = emailData.email || user.email || "";
    const newEmail: string = emailData.new_email || email;
    const oldEmail: string = emailData.old_email || "";
    const redirectTo: string = emailData.redirect_to || "https://be-hui.vercel.app";

    // Sprache aus user_metadata (von LoginPage signUp gesetzt), Fallback 'de'
    const lang: Lang = resolveLang(user.user_metadata?.hui_lang);

    // Content für diesen Typ holen
    const contentMap = CONTENT[type];
    if (!contentMap) {
      console.error(`[send-auth-email] Unknown email type: ${type}`);
      return new Response(JSON.stringify({ error: { http_code: 400, message: "Unknown email type" } }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const entry = contentMap[lang];
    const verifyType = toVerifyType(type);
    let callbackBase = redirectTo.replace(/\/+$/, "");
    if (!/\/auth\/callback$/.test(callbackBase)) {
      callbackBase = `${callbackBase}/auth/callback`;
    }

    // INC-006 FIX (2026-09-01): Bei email_change mit secure_email_change=True
    // sendet GoTrue EINEN Hook-Call mit ZWEI Token-Saetzen:
    //   token/token_hash       -> fuer Bestaetigung der ALTEN E-Mail-Adresse
    //   token_new/token_hash_new -> fuer Bestaetigung der NEUEN E-Mail-Adresse
    // Der Hook muss BEIDE Mails versenden. Payload-Beleg (function_logs):
    //   user.email = alte Adresse, user.new_email = neue Adresse
    //   email_data.token_hash + email_data.token_hash_new beide vorhanden
    const isSecureEmailChange = type === "email_change" && !!(emailData.token_hash_new || emailData.token_new);
    const currentEmail = user.email || "";
    const userNewEmail = ((user as Record<string, unknown>).new_email as string) || "";

    // Helper: eine einzelne Mail bauen + senden (mit eigenem Content-Entry)
    async function sendOneWithContent(
      recipient: string, tokHash: string, tok: string,
      contentEntry: { subject: string; heading: string; body: string; button?: string },
      ctxOldEmail: string, ctxNewEmail: string
    ): Promise<{ ok: boolean; id?: string; error?: string }> {
      const link = `${callbackBase}?token_hash=${encodeURIComponent(tokHash)}&type=${encodeURIComponent(verifyType)}`;
      let h = buildHTML(contentEntry, lang, type, link, tok);
      h = h.replace(/\{email\}/g, ctxNewEmail || recipient).replace(/\{oldEmail\}/g, ctxOldEmail).replace(/\{newEmail\}/g, ctxNewEmail);
      let subj = contentEntry.subject.replace(/\{email\}/g, ctxNewEmail || recipient).replace(/\{oldEmail\}/g, ctxOldEmail).replace(/\{newEmail\}/g, ctxNewEmail);
      return sendViaResend(recipient, subj, h);
    }

    // Original helper (für single-email Fälle)
    async function sendOne(
      recipient: string, tokHash: string, tok: string,
      ctxOldEmail: string, ctxNewEmail: string
    ): Promise<{ ok: boolean; id?: string; error?: string }> {
      return sendOneWithContent(recipient, tokHash, tok, entry, ctxOldEmail, ctxNewEmail);
    }

    if (isSecureEmailChange && userNewEmail) {
      // INC-006 v2 FIX (2026-09-01): Supabase Docs — "Counterintuitive field naming"
      //   token_hash_new → fuer ALTE Adresse (user.email) + token
      //   token_hash     → fuer NEUE Adresse (user.new_email) + token_new
      // Vorher waren die Tokens VERTAUSCHT (alte Adresse bekam token_hash, neue token_hash_new).
      // Test-Beweis (2026-09-01): verify(token_hash) bestaetigt neue Email-Seite,
      // verify(token_hash_new) bestaetigt alte Email-Seite + schliesst Aenderung ab.
      //
      // Content: alte Adresse bekommt email_change_current (Sicherheitshinweis),
      // neue Adresse bekommt email_change (Bestaetigung neue Adresse).

      // 1. Mail an ALTE Adresse: token + token_hash_new (Sicherheitshinweis)
      const oldContent = CONTENT["email_change_current"][lang];
      const tokenHashForOld = emailData.token_hash_new || "";
      const result1 = await sendOneWithContent(
        currentEmail, tokenHashForOld, token,
        oldContent, currentEmail, userNewEmail
      );
      if (!result1.ok) {
        console.error(`[send-auth-email] Resend send FAILED (old) for ${currentEmail} (type=${type}): ${result1.error}`);
        return new Response(JSON.stringify({ error: { http_code: 500, message: `E-Mail-Versand fehlgeschlagen (alt): ${result1.error}` } }), {
          status: 500, headers: { "Content-Type": "application/json" },
        });
      }
      console.log(`[send-auth-email] OK (old): ${currentEmail} (type=${type}, lang=${lang}, resend_id=${result1.id})`);

      // 2. Mail an NEUE Adresse: token_new + token_hash (Bestaetigung)
      const tokenHashForNew = emailData.token_hash || "";
      const tokenNew = emailData.token_new || "";
      const result2 = await sendOneWithContent(
        userNewEmail, tokenHashForNew, tokenNew,
        entry, currentEmail, userNewEmail
      );
      if (!result2.ok) {
        console.error(`[send-auth-email] Resend send FAILED (new) for ${userNewEmail} (type=${type}): ${result2.error}`);
        return new Response(JSON.stringify({ error: { http_code: 500, message: `E-Mail-Versand fehlgeschlagen (neu): ${result2.error}` } }), {
          status: 500, headers: { "Content-Type": "application/json" },
        });
      }
      console.log(`[send-auth-email] OK (new): ${userNewEmail} (type=${type}, lang=${lang}, resend_id=${result2.id})`);
    } else {
      // Single email (signup, recovery, invite, etc.)
      const confirmLink = `${callbackBase}?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(verifyType)}`;
      let html = buildHTML(entry, lang, type, confirmLink, token);
      html = html.replace(/\{email\}/g, email).replace(/\{oldEmail\}/g, oldEmail).replace(/\{newEmail\}/g, newEmail);
      let subject = entry.subject.replace(/\{email\}/g, email).replace(/\{oldEmail\}/g, oldEmail).replace(/\{newEmail\}/g, newEmail);

      const sendResult = await sendViaResend(email, subject, html);
      if (!sendResult.ok) {
        console.error(`[send-auth-email] Resend send FAILED for ${email} (type=${type}): ${sendResult.error}`);
        return new Response(JSON.stringify({ error: { http_code: 500, message: `E-Mail-Versand fehlgeschlagen: ${sendResult.error}` } }), {
          status: 500, headers: { "Content-Type": "application/json" },
        });
      }
      console.log(`[send-auth-email] OK: ${email} (type=${type}, lang=${lang}, resend_id=${sendResult.id})`);
    }

    // Erfolgs-Antwort (Hook-Vertrag: leerer Body / 200 = Hook erfolgreich)
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[send-auth-email] Error:", err?.message || err);
    return new Response(JSON.stringify({ error: { http_code: 500, message: "Internal error" } }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
