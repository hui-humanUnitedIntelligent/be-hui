// supabase/functions/send-auth-email/emailContent.ts
// Übersetzte Inhalte für alle Supabase Auth E-Mails (Send Email Hook).
// SSOT für mehrsprachige Auth-E-Mails — 8 Sprachen: DE/EN/ES/FR/IT/TR/PT/SQ.
// Erzeugt aus /tmp/gen_email_content.py — bei Änderungen dort synchron halten.

export const SUPPORTED_LANGS = ['de','en','es','fr','it','tr','pt','sq'] as const;
export type Lang = typeof SUPPORTED_LANGS[number];

export function resolveLang(raw: unknown): Lang {
  const l = typeof raw === 'string' ? raw.toLowerCase() : '';
  return (SUPPORTED_LANGS as readonly string[]).includes(l) ? (l as Lang) : 'de';
}

export interface EmailContentEntry {
  subject: string;
  heading: string;
  body: string;
  body2?: string;
  button?: string;
}

export const CONTENT: Record<string, Record<Lang, EmailContentEntry>> = {
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
  email_change_current: {
    de: { subject: "HUI E-Mail-Änderung bestätigen", heading: "E-Mail-Adresse ändern", body: "Bestätige die Änderung deiner E-Mail-Adresse von {oldEmail} zu {newEmail}.", button: "E-Mail bestätigen" },
    en: { subject: "Confirm your HUI email change", heading: "Change email address", body: "Confirm the change of your email address from {oldEmail} to {newEmail}.", button: "Confirm email" },
    es: { subject: "Confirma el cambio de correo de HUI", heading: "Cambiar dirección de correo", body: "Confirma el cambio de tu dirección de correo de {oldEmail} a {newEmail}.", button: "Confirmar correo" },
    fr: { subject: "Confirme le changement d'e-mail HUI", heading: "Changer l'adresse e-mail", body: "Confirme le changement de ton adresse e-mail de {oldEmail} à {newEmail}.", button: "Confirmer l'e-mail" },
    it: { subject: "Confermi la modifica dell'email HUI", heading: "Cambiare indirizzo email", body: "Confermi la modifica del tuo indirizzo email da {oldEmail} a {newEmail}.", button: "Confermare l'email" },
    tr: { subject: "HUI e-posta değişikliğini onayla", heading: "E-posta adresini değiştir", body: "E-posta adresinin {oldEmail} adresinden {newEmail} adresine değiştirilmesini onayla.", button: "E-postayı onayla" },
    pt: { subject: "Confirma a alteração de e-mail HUI", heading: "Alterar endereço de e-mail", body: "Confirma a alteração do teu endereço de e-mail de {oldEmail} para {newEmail}.", button: "Confirmar e-mail" },
    sq: { subject: "Konfirmo ndryshimin e email-it HUI", heading: "Ndrysho adresën e email-it", body: "Konfirmo ndryshimin e adresës tënde të email-it nga {oldEmail} në {newEmail}.", button: "Konfirmo email-in" },
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

export const FOOTER: Record<Lang, string> = {
  de: "Diese Nachricht wurde automatisch von HUI – Human United Intelligence generiert.",
  en: "This message was automatically generated by HUI – Human United Intelligence.",
  es: "Este mensaje fue generado automáticamente por HUI – Human United Intelligence.",
  fr: "Ce message a été généré automatiquement par HUI – Human United Intelligence.",
  it: "Questo messaggio è stato generato automaticamente da HUI – Human United Intelligence.",
  tr: "Bu mesaj HUI – Human United Intelligence tarafından otomatik olarak oluşturulmuştur.",
  pt: "Esta mensagem foi gerada automaticamente pela HUI – Human United Intelligence.",
  sq: "Ky mesazh u gjenerua automatikisht nga HUI – Human United Intelligence.",
};
