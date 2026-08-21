(() => {
  const messages = {
    en: {
      newConversation: '＋ New conversation', dashboard: 'Dashboard', apps: 'Apps & Gaming', entertainment: 'Entertainment', memory: 'Memory', identity: 'Identity', settings: 'Settings', language: 'Interface language', save: 'Save settings',
      adultConfirm: 'Confirm legal-adult status', adultEnable: 'Enable Adult Soul',
      adultWarning: 'Adult Soul is only for people who have reached the age of majority where they are located. It must not be used by minors. This local confirmation is not independent identity or age verification. Confirm that you are legally an adult to continue.',
      dashboardTitle: 'Your Eidovara workspace', dashboardLead: 'A command center for applications, gaming, entertainment, research, backups, and optional Soul assistance.',
      appsTitle: 'Apps & Gaming Hub', appsLead: 'Organize trusted Windows applications and ask Windows to launch them. Compatibility varies; Eidovara does not inject into or control them.',
      discoverApps: 'Discover installed apps', chooseFile: '＋ Choose file', gamingMode: 'Gaming mode', gamingModeLead: 'Reduces Eidovara’s animated lighting and transparency while you play. It does not change another game’s process or frame rate.', lowOverhead: 'Low-overhead mode',
      entertainmentTitle: 'Entertainment', entertainmentLead: 'Local taste, queue helpers, and lawful platform handoff — Spotify and YouTube stay official HTTPS searches.',
      emptyAppsTitle: 'No applications linked yet', emptyAppsBody: 'Build a Windows shelf of titles you already trust and are permitted to use.',
      emptyAppsStep1: 'Discover Start Menu shortcuts on this PC, or choose a .exe / .lnk file.', emptyAppsStep2: 'Launch is confirmation-only. Eidovara does not inject into games or bypass anti-cheat.', emptyAppsStep3: 'Free editions keep up to three linked apps; Premium testing can raise that locally.',
      emptyFavorites: 'Favorite media will appear here after you heart something in the player.', emptyRecent: 'Play, skip, and complete events will appear here. Local file paths are not stored in taste records.', emptyMemory: 'No durable memories yet.',
      focusSession: 'Focus session', gamingStream: 'Gaming & stream', study: 'Study', create: 'Create', research: 'Research', reviewMemory: 'Review memory',
      moodMix: 'Mood mix', fromFavorites: 'From favorites', watchSomething: 'Watch something', gamingSoundtrack: 'Gaming soundtrack', studySoundtrack: 'Study soundtrack', surpriseMe: 'Surprise me',
      favoriteMedia: 'Favorite media', recentActivity: 'Recent activity', mixHelper: 'Queue helper', mixEmpty: 'Play or favorite something to grow a local mix. Suggestions stay on this device.',
      platformTitle: 'Platform connections', platformLead: 'Spotify and YouTube open official searches in your system browser. Eidovara does not capture credentials, bypass subscriptions, download protected streams, or imply affiliation.',
      openLocalMedia: 'Open local media',
      setupTitle: 'What do you need Soul for?', setupLead: 'Choose any roles that fit. You can change this later in Settings.',
      roleGaming: 'Gaming & editing assistant', roleGamingLead: 'Game planning, clips, creative editing, and workflows.',
      roleStream: 'Stream helper', roleStreamLead: 'Streaming goals, OBS preparation, scenes, inputs, and checklists. Direct OBS control is not in this release.',
      roleStudy: 'Studying assistant', roleStudyLead: 'Explanations, review plans, research, and practice.',
      rolePersonal: 'Personal usage', rolePersonalLead: 'Conversation, planning, memory, and everyday assistance.',
      roleCreative: 'Creative projects', roleCreativeLead: 'Writing, ideas, music discovery, and media.',
      roleWork: 'Work & productivity', roleWorkLead: 'Organization, drafting, decisions, and task support.',
      roleAccess: 'Accessibility support', roleAccessLead: 'Readable pacing, reduced motion, keyboard-first steps, and related workspace needs.',
      setupCustom: 'Anything else Soul should understand?', setupAccess: 'Accessibility or interaction needs', saveContinue: 'Save and continue', cancel: 'Cancel',
      nextConfigure: 'Configure roles', nextAddApps: 'Add a trusted app', nextMemory: 'Review memory', nextBackup: 'Create a backup', nextSettings: 'Open settings', nextEntertainment: 'Open Entertainment', nextDiagnostics: 'Show diagnostics',
      backupTitle: 'Backups', backupLead: 'Create a portable local snapshot or restore an earlier snapshot. Encrypted when Windows protection is available.',
      createBackup: 'Create backup', refreshList: 'Refresh list', restoreBackup: 'Restore selected backup', noBackups: 'No backups yet. Create one before changing providers or resetting.',
      diagShow: 'Show diagnostics', diagLead: 'Local snapshot of this installation. Not a security certification or compatibility guarantee.',
      behaviorSaved: 'Behavior settings saved. Language, tone, and accessibility remain as set.',
      dashFocus: 'Focus', dashRoles: 'Roles', dashMemory: 'Memory', dashApps: 'Apps', dashMedia: 'Entertainment', dashPrivacy: 'Workspace', dashBackups: 'Backups', dashHealth: 'Diagnostics',
      notConfigured: 'not configured', offlineFirst: 'offline-first', connectedProvider: 'connected provider',
      mediaDisabled: 'Media playback is disabled in Soul behavior settings.', mediaConfirm: 'Play this media in Eidovara:',
      launchApp: 'Launch', launchCancelled: 'Launch cancelled.',
      premiumLocked: 'Free: offline/local models, Wikipedia/Wikimedia research, up to 3 apps. RGB, Brave key, and remote endpoints stay Premium.',
      premiumUnlocked: 'Premium test gates are on: remote endpoints, Brave search key, RGB, and unlimited apps.',
      soulDockTitle: 'Soul', soulLive: 'Soul is live on this PC', soulIdle: 'Soul kernel idle'
    },
    es: {
      newConversation: '＋ Nueva conversación', dashboard: 'Panel', apps: 'Aplicaciones y juegos', entertainment: 'Entretenimiento', memory: 'Memoria', identity: 'Identidad', settings: 'Configuración', language: 'Idioma de la interfaz', save: 'Guardar configuración',
      adultConfirm: 'Confirmar mayoría de edad legal', adultEnable: 'Activar Soul para adultos',
      adultWarning: 'Soul para adultos es solo para personas que hayan alcanzado la mayoría de edad donde se encuentren. Los menores no deben usarlo. Esta confirmación local no verifica de forma independiente la identidad ni la edad. Confirma que eres legalmente adulto para continuar.',
      dashboardTitle: 'Tu espacio Eidovara', dashboardLead: 'Un centro de mando para aplicaciones, juegos, entretenimiento, investigación, copias y Soul opcional.',
      appsTitle: 'Centro de aplicaciones y juegos', appsLead: 'Organiza aplicaciones de Windows de confianza y pide a Windows que las abra. La compatibilidad varía; Eidovara no inyecta ni las controla.',
      discoverApps: 'Descubrir apps instaladas', chooseFile: '＋ Elegir archivo', gamingMode: 'Modo de juego', gamingModeLead: 'Reduce la iluminación y transparencia de Eidovara mientras juegas. No cambia el proceso ni los FPS de otro juego.', lowOverhead: 'Modo de bajo consumo',
      entertainmentTitle: 'Entretenimiento', entertainmentLead: 'Gusto local, ayudas de cola y transferencia lícita: Spotify y YouTube siguen siendo búsquedas HTTPS oficiales.',
      emptyAppsTitle: 'Aún no hay aplicaciones vinculadas', emptyAppsBody: 'Arma un estante de Windows con títulos que ya confías y puedes usar.',
      emptyAppsStep1: 'Descubre accesos del menú Inicio, o elige un archivo .exe / .lnk.', emptyAppsStep2: 'El lanzamiento es solo con confirmación. Eidovara no inyecta juegos ni evade anti-cheat.', emptyAppsStep3: 'La edición gratuita permite hasta tres apps; Premium de prueba puede subir ese límite en local.',
      emptyFavorites: 'Los favoritos aparecerán cuando marques algo en el reproductor.', emptyRecent: 'Reproducciones, omisiones y cierres aparecerán aquí. Las rutas locales no se guardan en el gusto.', emptyMemory: 'Aún no hay recuerdos duraderos.',
      focusSession: 'Sesión de enfoque', gamingStream: 'Juegos y stream', study: 'Estudio', create: 'Crear', research: 'Investigar', reviewMemory: 'Revisar memoria',
      moodMix: 'Mezcla de ánimo', fromFavorites: 'Desde favoritos', watchSomething: 'Ver algo', gamingSoundtrack: 'Banda de juego', studySoundtrack: 'Banda de estudio', surpriseMe: 'Sorpréndeme',
      favoriteMedia: 'Medios favoritos', recentActivity: 'Actividad reciente', mixHelper: 'Ayuda de cola', mixEmpty: 'Reproduce o marca un favorito para armar una mezcla local. Las sugerencias se quedan en este dispositivo.',
      platformTitle: 'Conexiones de plataforma', platformLead: 'Spotify y YouTube abren búsquedas oficiales en el navegador. Eidovara no captura credenciales, evita suscripciones, descarga streams protegidos ni implica afiliación.',
      openLocalMedia: 'Abrir medio local',
      setupTitle: '¿Para qué necesitas a Soul?', setupLead: 'Elige los roles que encajen. Puedes cambiarlos luego en Configuración.',
      roleGaming: 'Asistente de juegos y edición', roleGamingLead: 'Plan de partidas, clips, edición creativa y flujos.',
      roleStream: 'Ayuda de streaming', roleStreamLead: 'Objetivos, preparación de OBS, escenas y listas. El control directo de OBS no está en esta versión.',
      roleStudy: 'Asistente de estudio', roleStudyLead: 'Explicaciones, planes de repaso, investigación y práctica.',
      rolePersonal: 'Uso personal', rolePersonalLead: 'Conversación, planificación, memoria y ayuda cotidiana.',
      roleCreative: 'Proyectos creativos', roleCreativeLead: 'Escritura, ideas, descubrimiento musical y medios.',
      roleWork: 'Trabajo y productividad', roleWorkLead: 'Organización, borradores, decisiones y tareas.',
      roleAccess: 'Apoyo de accesibilidad', roleAccessLead: 'Ritmo legible, menos movimiento, pasos con teclado y necesidades afines.',
      setupCustom: '¿Algo más que Soul deba entender?', setupAccess: 'Necesidades de accesibilidad o interacción', saveContinue: 'Guardar y continuar', cancel: 'Cancelar',
      nextConfigure: 'Configurar roles', nextAddApps: 'Añadir app de confianza', nextMemory: 'Revisar memoria', nextBackup: 'Crear copia', nextSettings: 'Abrir configuración', nextEntertainment: 'Abrir Entretenimiento', nextDiagnostics: 'Ver diagnósticos',
      backupTitle: 'Copias de seguridad', backupLead: 'Crea una instantánea local o restaura una anterior. Cifrada cuando Windows lo permite.',
      createBackup: 'Crear copia', refreshList: 'Actualizar lista', restoreBackup: 'Restaurar copia seleccionada', noBackups: 'Aún no hay copias. Crea una antes de cambiar de proveedor o restablecer.',
      diagShow: 'Mostrar diagnósticos', diagLead: 'Instantánea local de esta instalación. No es una certificación de seguridad ni una garantía de compatibilidad.',
      behaviorSaved: 'Comportamiento guardado. Idioma, tono y accesibilidad se mantienen.',
      dashFocus: 'Enfoque', dashRoles: 'Roles', dashMemory: 'Memoria', dashApps: 'Apps', dashMedia: 'Entretenimiento', dashPrivacy: 'Espacio', dashBackups: 'Copias', dashHealth: 'Diagnóstico',
      notConfigured: 'sin configurar', offlineFirst: 'primero local', connectedProvider: 'proveedor conectado',
      mediaDisabled: 'La reproducción está desactivada en el comportamiento de Soul.', mediaConfirm: 'Reproducir este medio en Eidovara:',
      launchApp: 'Abrir', launchCancelled: 'Lanzamiento cancelado.',
      premiumLocked: 'Gratis: modelos locales, Wikipedia/Wikimedia, hasta 3 apps. RGB, clave Brave y endpoints remotos son Premium.',
      premiumUnlocked: 'Prueba Premium activa: endpoints remotos, clave Brave, RGB y apps ilimitadas.',
      soulDockTitle: 'Soul', soulLive: 'Soul está en vivo en este PC', soulIdle: 'Kernel de Soul inactivo'
    },
    fr: {
      newConversation: '＋ Nouvelle conversation', dashboard: 'Tableau de bord', apps: 'Applications et jeux', entertainment: 'Divertissement', memory: 'Mémoire', identity: 'Identité', settings: 'Paramètres', language: 'Langue de l’interface', save: 'Enregistrer',
      adultConfirm: 'Confirmer la majorité légale', adultEnable: 'Activer Soul adulte',
      adultWarning: 'Soul adulte est réservé aux personnes ayant atteint l’âge de la majorité là où elles se trouvent. Les mineurs ne doivent pas l’utiliser. Cette confirmation locale ne constitue pas une vérification indépendante de l’identité ou de l’âge. Confirmez que vous êtes légalement adulte pour continuer.',
      dashboardTitle: 'Votre espace Eidovara', dashboardLead: 'Un poste de commandement pour applications, jeu, divertissement, recherche, sauvegardes et Soul facultatif.',
      appsTitle: 'Hub applications et jeux', appsLead: 'Organisez des applications Windows de confiance et demandez à Windows de les lancer. La compatibilité varie ; Eidovara n’injecte ni ne les contrôle.',
      discoverApps: 'Découvrir les apps installées', chooseFile: '＋ Choisir un fichier', gamingMode: 'Mode jeu', gamingModeLead: 'Réduit l’éclairage et la transparence d’Eidovara pendant que vous jouez. Cela ne change pas le processus ni les FPS d’un autre jeu.', lowOverhead: 'Mode allégé',
      entertainmentTitle: 'Divertissement', entertainmentLead: 'Goût local, aides de file et transfert licite — Spotify et YouTube restent des recherches HTTPS officielles.',
      emptyAppsTitle: 'Aucune application liée', emptyAppsBody: 'Constituez une étagère Windows de titres que vous avez le droit d’utiliser.',
      emptyAppsStep1: 'Découvrez les raccourcis du menu Démarrer, ou choisissez un .exe / .lnk.', emptyAppsStep2: 'Le lancement est confirmé. Eidovara n’injecte pas les jeux et n’évite pas l’anti-cheat.', emptyAppsStep3: 'L’édition gratuite garde jusqu’à trois apps ; le test Premium peut l’augmenter localement.',
      emptyFavorites: 'Les favoris apparaîtront après un cœur dans le lecteur.', emptyRecent: 'Lectures, ignores et fins apparaîtront ici. Les chemins locaux ne sont pas stockés dans le goût.', emptyMemory: 'Pas encore de souvenirs durables.',
      focusSession: 'Session concentrée', gamingStream: 'Jeu et stream', study: 'Étude', create: 'Créer', research: 'Recherche', reviewMemory: 'Relire la mémoire',
      moodMix: 'Mix d’humeur', fromFavorites: 'Depuis les favoris', watchSomething: 'Regarder', gamingSoundtrack: 'Bande jeu', studySoundtrack: 'Bande étude', surpriseMe: 'Surprenez-moi',
      favoriteMedia: 'Médias favoris', recentActivity: 'Activité récente', mixHelper: 'Aide de file', mixEmpty: 'Lisez ou favoritez un média pour une mixte locale. Les suggestions restent sur cet appareil.',
      platformTitle: 'Connexions de plateformes', platformLead: 'Spotify et YouTube ouvrent des recherches officielles dans le navigateur. Eidovara ne capture pas les identifiants, n’évite pas les abonnements, ne télécharge pas les flux protégés et n’implique aucune affiliation.',
      openLocalMedia: 'Ouvrir un média local',
      setupTitle: 'Pour quoi avez-vous besoin de Soul ?', setupLead: 'Choisissez les rôles adaptés. Modifiable plus tard dans Paramètres.',
      roleGaming: 'Assistant jeu et montage', roleGamingLead: 'Plan de parties, clips, montage créatif et flux.',
      roleStream: 'Aide streaming', roleStreamLead: 'Objectifs, préparation OBS, scènes et listes. Le contrôle direct d’OBS n’est pas dans cette version.',
      roleStudy: 'Assistant d’étude', roleStudyLead: 'Explications, plans de révision, recherche et pratique.',
      rolePersonal: 'Usage personnel', rolePersonalLead: 'Conversation, planification, mémoire et aide quotidienne.',
      roleCreative: 'Projets créatifs', roleCreativeLead: 'Écriture, idées, découverte musicale et médias.',
      roleWork: 'Travail et productivité', roleWorkLead: 'Organisation, brouillons, décisions et tâches.',
      roleAccess: 'Support d’accessibilité', roleAccessLead: 'Rythme lisible, moins de mouvement, étapes clavier et besoins liés.',
      setupCustom: 'Autre chose que Soul devrait comprendre ?', setupAccess: 'Besoins d’accessibilité ou d’interaction', saveContinue: 'Enregistrer et continuer', cancel: 'Annuler',
      nextConfigure: 'Configurer les rôles', nextAddApps: 'Ajouter une app de confiance', nextMemory: 'Relire la mémoire', nextBackup: 'Créer une sauvegarde', nextSettings: 'Ouvrir les paramètres', nextEntertainment: 'Ouvrir Divertissement', nextDiagnostics: 'Afficher les diagnostics',
      backupTitle: 'Sauvegardes', backupLead: 'Créez un instantané local portable ou restaurez-en un. Chiffré lorsque Windows le permet.',
      createBackup: 'Créer une sauvegarde', refreshList: 'Actualiser', restoreBackup: 'Restaurer la sauvegarde', noBackups: 'Pas encore de sauvegarde. Créez-en une avant de changer de fournisseur ou de réinitialiser.',
      diagShow: 'Afficher les diagnostics', diagLead: 'Instantané local de cette installation. Pas une certification de sécurité ni une garantie de compatibilité.',
      behaviorSaved: 'Comportement enregistré. Langue, ton et accessibilité restent tels quels.',
      dashFocus: 'Focus', dashRoles: 'Rôles', dashMemory: 'Mémoire', dashApps: 'Apps', dashMedia: 'Divertissement', dashPrivacy: 'Espace', dashBackups: 'Sauvegardes', dashHealth: 'Diagnostics',
      notConfigured: 'non configuré', offlineFirst: 'd’abord hors ligne', connectedProvider: 'fournisseur connecté',
      mediaDisabled: 'La lecture multimédia est désactivée dans le comportement de Soul.', mediaConfirm: 'Lire ce média dans Eidovara :',
      launchApp: 'Lancer', launchCancelled: 'Lancement annulé.',
      premiumLocked: 'Gratuit : modèles locaux, Wikipedia/Wikimedia, 3 apps max. RGB, clé Brave et endpoints distants restent Premium.',
      premiumUnlocked: 'Portes Premium de test actives : endpoints distants, clé Brave, RGB et apps illimitées.',
      soulDockTitle: 'Soul', soulLive: 'Soul est actif sur cet appareil', soulIdle: 'Noyau Soul inactif'
    },
    de: {
      newConversation: '＋ Neue Unterhaltung', dashboard: 'Übersicht', apps: 'Apps und Gaming', entertainment: 'Unterhaltung', memory: 'Erinnerungen', identity: 'Identität', settings: 'Einstellungen', language: 'Oberflächensprache', save: 'Einstellungen speichern',
      adultConfirm: 'Volljährigkeit bestätigen', adultEnable: 'Adult Soul aktivieren',
      adultWarning: 'Adult Soul ist nur für Personen bestimmt, die an ihrem Aufenthaltsort volljährig sind. Minderjährige dürfen die Funktion nicht verwenden. Diese lokale Bestätigung ist keine unabhängige Identitäts- oder Altersprüfung. Bestätigen Sie, dass Sie volljährig sind, um fortzufahren.',
      dashboardTitle: 'Ihr Eidovara-Arbeitsbereich', dashboardLead: 'Eine Schaltzentrale für Apps, Gaming, Unterhaltung, Recherche, Sicherungen und optionale Soul-Unterstützung.',
      appsTitle: 'Apps- und Gaming-Hub', appsLead: 'Ordnen Sie vertrauenswürdige Windows-Anwendungen und lassen Sie Windows sie starten. Kompatibilität variiert; Eidovara injiziert oder steuert sie nicht.',
      discoverApps: 'Installierte Apps finden', chooseFile: '＋ Datei wählen', gamingMode: 'Spielemodus', gamingModeLead: 'Reduziert Eidovaras Licht und Transparenz während des Spielens. Ändert nicht den Prozess oder die FPS eines anderen Spiels.', lowOverhead: 'Low-Overhead-Modus',
      entertainmentTitle: 'Unterhaltung', entertainmentLead: 'Lokaler Geschmack, Warteschlangen-Helfer und rechtmäßige Übergabe — Spotify und YouTube bleiben offizielle HTTPS-Suchen.',
      emptyAppsTitle: 'Noch keine Anwendungen verknüpft', emptyAppsBody: 'Bauen Sie ein Windows-Regal aus Titeln, die Sie nutzen dürfen.',
      emptyAppsStep1: 'Startmenü-Verknüpfungen finden oder eine .exe / .lnk wählen.', emptyAppsStep2: 'Start nur nach Bestätigung. Eidovara injiziert keine Spiele und umgeht kein Anti-Cheat.', emptyAppsStep3: 'Free behält bis zu drei Apps; Premium-Tests können das lokal anheben.',
      emptyFavorites: 'Favoriten erscheinen, sobald Sie im Player ein Herz setzen.', emptyRecent: 'Wiedergabe, Überspringen und Abschluss erscheinen hier. Lokale Pfade stehen nicht in den Geschmacksdaten.', emptyMemory: 'Noch keine dauerhaften Erinnerungen.',
      focusSession: 'Fokus-Sitzung', gamingStream: 'Gaming & Stream', study: 'Lernen', create: 'Gestalten', research: 'Recherche', reviewMemory: 'Erinnerungen prüfen',
      moodMix: 'Stimmungsmix', fromFavorites: 'Aus Favoriten', watchSomething: 'Etwas ansehen', gamingSoundtrack: 'Gaming-Soundtrack', studySoundtrack: 'Lern-Soundtrack', surpriseMe: 'Überrasche mich',
      favoriteMedia: 'Lieblingsmedien', recentActivity: 'Letzte Aktivität', mixHelper: 'Warteschlangen-Hilfe', mixEmpty: 'Spielen oder favorisieren Sie etwas für einen lokalen Mix. Vorschläge bleiben auf diesem Gerät.',
      platformTitle: 'Plattformverbindungen', platformLead: 'Spotify und YouTube öffnen offizielle Suchen im Systembrowser. Eidovara erfasst keine Zugangsdaten, umgeht keine Abos, lädt keine geschützten Streams und impliziert keine Partnerschaft.',
      openLocalMedia: 'Lokale Medien öffnen',
      setupTitle: 'Wofür brauchen Sie Soul?', setupLead: 'Wählen Sie passende Rollen. Später unter Einstellungen änderbar.',
      roleGaming: 'Gaming- und Schnitt-Assistenz', roleGamingLead: 'Spielplanung, Clips, kreativer Schnitt und Abläufe.',
      roleStream: 'Stream-Hilfe', roleStreamLead: 'Ziele, OBS-Vorbereitung, Szenen und Checklisten. Direkte OBS-Steuerung ist nicht in dieser Version.',
      roleStudy: 'Lernassistenz', roleStudyLead: 'Erklärungen, Wiederholungspläne, Recherche und Übung.',
      rolePersonal: 'Persönliche Nutzung', rolePersonalLead: 'Gespräch, Planung, Speicher und Alltagshilfe.',
      roleCreative: 'Kreative Projekte', roleCreativeLead: 'Schreiben, Ideen, Musikentdeckung und Medien.',
      roleWork: 'Arbeit und Produktivität', roleWorkLead: 'Organisation, Entwürfe, Entscheidungen und Aufgaben.',
      roleAccess: 'Barrierefreiheit', roleAccessLead: 'Lesbares Tempo, weniger Bewegung, tastaturklare Schritte und verwandte Bedürfnisse.',
      setupCustom: 'Was soll Soul sonst noch verstehen?', setupAccess: 'Barrierefreiheit oder Interaktionsbedarf', saveContinue: 'Speichern und weiter', cancel: 'Abbrechen',
      nextConfigure: 'Rollen einrichten', nextAddApps: 'Vertrauenswürdige App hinzufügen', nextMemory: 'Erinnerungen prüfen', nextBackup: 'Sicherung erstellen', nextSettings: 'Einstellungen öffnen', nextEntertainment: 'Unterhaltung öffnen', nextDiagnostics: 'Diagnose zeigen',
      backupTitle: 'Sicherungen', backupLead: 'Erstellen Sie eine lokale Momentaufnahme oder stellen Sie eine frühere wieder her. Verschlüsselt, wenn Windows-Schutz verfügbar ist.',
      createBackup: 'Sicherung erstellen', refreshList: 'Liste aktualisieren', restoreBackup: 'Ausgewählte Sicherung wiederherstellen', noBackups: 'Noch keine Sicherungen. Erstellen Sie eine, bevor Sie Anbieter wechseln oder zurücksetzen.',
      diagShow: 'Diagnose anzeigen', diagLead: 'Lokale Momentaufnahme dieser Installation. Keine Sicherheitszertifizierung und keine Kompatibilitätsgarantie.',
      behaviorSaved: 'Verhalten gespeichert. Sprache, Ton und Barrierefreiheit bleiben erhalten.',
      dashFocus: 'Fokus', dashRoles: 'Rollen', dashMemory: 'Speicher', dashApps: 'Apps', dashMedia: 'Unterhaltung', dashPrivacy: 'Arbeitsbereich', dashBackups: 'Sicherungen', dashHealth: 'Diagnose',
      notConfigured: 'nicht konfiguriert', offlineFirst: 'zuerst offline', connectedProvider: 'verbundener Anbieter',
      mediaDisabled: 'Medienwiedergabe ist in den Soul-Verhaltenseinstellungen deaktiviert.', mediaConfirm: 'Dieses Medium in Eidovara wiedergeben:',
      launchApp: 'Starten', launchCancelled: 'Start abgebrochen.',
      premiumLocked: 'Free: lokale Modelle, Wikipedia/Wikimedia, bis zu 3 Apps. RGB, Brave-Schlüssel und Remote-Endpunkte bleiben Premium.',
      premiumUnlocked: 'Premium-Test aktiv: Remote-Endpunkte, Brave-Schlüssel, RGB und unbegrenzte Apps.',
      soulDockTitle: 'Soul', soulLive: 'Soul ist auf diesem PC aktiv', soulIdle: 'Soul-Kernel inaktiv'
    }
  };
  let locale = 'en';
  const t = (key, fallback) => messages[locale]?.[key] || messages.en[key] || fallback || key;
  const set = value => {
    locale = messages[value] ? value : 'en';
    document.documentElement.lang = locale;
    for (const node of document.querySelectorAll('[data-i18n]')) node.textContent = t(node.dataset.i18n, node.textContent);
    window.dispatchEvent(new CustomEvent('eidovara:locale', { detail: { locale } }));
  };
  window.eidovaraI18n = { set, t, supported: Object.keys(messages), messages };
  queueMicrotask(async () => {
    try {
      let settings = await window.soul.getSettings();
      const select = document.querySelector('#languageSelect');
      if (!select) return;
      select.value = messages[settings.language] ? settings.language : 'en';
      set(select.value);
      select.addEventListener('change', async () => {
        set(select.value);
        settings = await window.soul.saveSettings({ provider: settings.provider, endpoint: settings.endpoint, model: settings.model, language: select.value, theme: settings.theme, companion: settings.companion });
        const state = await window.soul.snapshot();
        const p = state.assistant?.preferences || {}, c = state.assistant?.capabilities || {};
        await window.soul.configureAssistant({ autonomy: state.assistant?.autonomy, initiativeEnabled: state.assistant?.initiativeEnabled, reflectionEnabled: state.assistant?.reflectionEnabled, responseLength: p.responseLength, tone: p.tone, focusMode: p.focusMode, accessibility: p.accessibility, language: select.value, webResearch: c.webResearch, mediaPlayback: c.mediaPlayback, memoryLearning: c.memoryLearning });
      });
    } catch {}
  });
})();
