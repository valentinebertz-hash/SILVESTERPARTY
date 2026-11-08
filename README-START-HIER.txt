SILVESTERPARTY – WER BRINGT WAS?
================================
Vollständige statische GitHub-Pages-App mit Supabase-Cloud.
WICHTIG: Die Cloud funktioniert erst nach den folgenden Einrichtungsschritten.

1. SUPABASE ANLEGEN
   https://supabase.com/dashboard
   Neues Projekt erstellen (Datenbank-Passwort sicher aufbewahren).

2. DATENBANK EINRICHTEN
   Supabase > SQL Editor > New query.
   Den GESAMTEN Inhalt von supabase-setup.sql einfügen und ausführen.
   Dies erstellt Tabellen, sichere Zugriffsregeln (RLS), Admin-Funktionen
   und einen Speicherbereich für das Jahresbild.

3. ANMELDUNG EINRICHTEN
   Supabase > Authentication > Providers > Email aktivieren.
   E-Mail-Bestätigung empfohlen (Standard, ggf. E-Mail-Versandlimit beachten).
   Unter Authentication > URL Configuration die spätere GitHub-Pages-URL
   als Site URL und Redirect URL hinzufügen, z. B.:
   https://DEIN-NAME.github.io/SILVESTERPARTY/
   Für produktiven Betrieb E-Mail-Versand (SMTP) konfigurieren.

4. KONFIGURATION EINTRAGEN
   Supabase > Project Settings > API bzw. Connect:
   Project URL und publishable key (oder legacy anon key) kopieren.
   Datei config.js bearbeiten und beide Platzhalter ersetzen.
   KEIN service_role/secret key! KEIN Admin-Passwort in Dateien speichern!
   Sicherheit erfolgt durch Supabase Auth + Datenbank-RLS.

5. GITHUB PAGES
   Neues GitHub-Repository z. B. SILVESTERPARTY erstellen.
   Alle Dateien aus diesem ZIP in das Hauptverzeichnis hochladen
   (index.html, app.js, style.css, config.js, SQL-Datei, icons usw.).
   Settings > Pages > Deploy from a branch > main > /(root) > Save.
   GitHub-Pages-Adresse im Browser öffnen.
   Tipp: SQL-Datei muss nicht online liegen; sie enthält keine Secrets,
   kann aber nach Einrichtung aus dem Repository entfernt werden.

6. ADMIN EINRICHTEN – WICHTIG
   Auf der Webseite mit deiner E-Mail registrieren und E-Mail bestätigen.
   Dann in Supabase > SQL Editor einmalig ausführen:

   update public.profiles set role='admin'
   where id=(select id from auth.users where email='DEINE-EMAIL@BEISPIEL.DE');

   DEINE-EMAIL@BEISPIEL.DE durch deine echte Anmelde-E-Mail ersetzen.
   Danach Webseite neu laden. Nur dein Konto hat Adminrechte.
   Das Admin-Passwort ist dein persönliches Supabase-Login-Passwort.
   Dieses Passwort wird NIEMALS in den Website-Dateien gespeichert.

7. CLOUD IN ECHTZEIT
   Supabase > Database > Publications > supabase_realtime:
   Tabellen public.profiles, public.items, public.pledges,
   public.party_settings hinzufügen (falls noch nicht aktiviert).
   Dann werden Änderungen live an andere angemeldete Geräte gesendet.
   Ohne Realtime-Aktivierung bleiben Daten trotzdem in der Cloud;
   andere Gäste sehen Änderungen spätestens nach Neuladen.

8. BENUTZUNG
   Jeder Gast registriert sich mit eigenem E-Mail-Konto und Passwort.
   Profil: Name, Begleitpersonen, optionale Hinweise.
   Wunschliste: Wünsche anlegen, eigene Wünsche bearbeiten/löschen.
   Jeder kann zu jedem Wunsch eine eigene Zusage speichern.
   Admin: alle Wünsche und Zusagen verwalten, Profile bearbeiten,
   Benutzerkonten vollständig löschen, Jahr und Titel ändern,
   Jahresbild hochladen (JPG/PNG/WebP, max. 3 MB).
   Beim Wechsel des Jahres bleiben frühere Wünsche in der Datenbank,
   werden aber auf der aktuellen Wunschliste nicht mehr angezeigt.

SICHERHEIT / DATENSCHUTZ
   - Alle registrierten Gäste können Namen, Begleitpersonen,
     Hinweise und Zusagen der anderen Gäste sehen.
   - E-Mail-Adressen werden in der öffentlichen Gästeliste NICHT angezeigt.
   - Passwörter werden ausschließlich durch Supabase Auth verwaltet.
   - Kein vollständiger Offline-Betrieb: Cloud-Daten benötigen Internet.
   - Für private Feiern ggf. Registrierung nach Abschluss deaktivieren:
     Supabase > Authentication > Settings > Allow new users to sign up OFF.
   - Vor Live-Nutzung mit zwei Testkonten die Berechtigungen testen.
   - Datenbank-Backups und DSGVO-Hinweise selbst organisieren.

DATEIEN
   index.html, style.css, app.js, config.js, manifest.webmanifest,
   sw.js, icons/, supabase-setup.sql, README-START-HIER.txt
