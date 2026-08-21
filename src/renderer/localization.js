(() => {
  const messages = {
    en: { newConversation: '＋ New conversation', dashboard: 'Dashboard', apps: 'Apps & Gaming', entertainment: 'Entertainment', memory: 'Memory', identity: 'Identity', settings: 'Settings', language: 'Interface language', save: 'Save settings', adultConfirm: 'Confirm legal-adult status', adultEnable: 'Enable Adult Soul', adultWarning: 'Adult Soul is only for people who have reached the age of majority where they are located. It must not be used by minors. This local confirmation is not independent identity or age verification. Confirm that you are legally an adult to continue.' },
    es: { newConversation: '＋ Nueva conversación', dashboard: 'Panel', apps: 'Aplicaciones y juegos', entertainment: 'Entretenimiento', memory: 'Memoria', identity: 'Identidad', settings: 'Configuración', language: 'Idioma de la interfaz', save: 'Guardar configuración', adultConfirm: 'Confirmar mayoría de edad legal', adultEnable: 'Activar Soul para adultos', adultWarning: 'Soul para adultos es solo para personas que hayan alcanzado la mayoría de edad donde se encuentren. Los menores no deben usarlo. Esta confirmación local no verifica de forma independiente la identidad ni la edad. Confirma que eres legalmente adulto para continuar.' },
    fr: { newConversation: '＋ Nouvelle conversation', dashboard: 'Tableau de bord', apps: 'Applications et jeux', entertainment: 'Divertissement', memory: 'Mémoire', identity: 'Identité', settings: 'Paramètres', language: 'Langue de l’interface', save: 'Enregistrer', adultConfirm: 'Confirmer la majorité légale', adultEnable: 'Activer Soul adulte', adultWarning: 'Soul adulte est réservé aux personnes ayant atteint l’âge de la majorité là où elles se trouvent. Les mineurs ne doivent pas l’utiliser. Cette confirmation locale ne constitue pas une vérification indépendante de l’identité ou de l’âge. Confirmez que vous êtes légalement adulte pour continuer.' },
    de: { newConversation: '＋ Neue Unterhaltung', dashboard: 'Übersicht', apps: 'Apps und Gaming', entertainment: 'Unterhaltung', memory: 'Erinnerungen', identity: 'Identität', settings: 'Einstellungen', language: 'Oberflächensprache', save: 'Einstellungen speichern', adultConfirm: 'Volljährigkeit bestätigen', adultEnable: 'Adult Soul aktivieren', adultWarning: 'Adult Soul ist nur für Personen bestimmt, die an ihrem Aufenthaltsort volljährig sind. Minderjährige dürfen die Funktion nicht verwenden. Diese lokale Bestätigung ist keine unabhängige Identitäts- oder Altersprüfung. Bestätigen Sie, dass Sie volljährig sind, um fortzufahren.' }
  };
  let locale = 'en';
  const set = value => { locale = messages[value] ? value : 'en'; document.documentElement.lang = locale; for (const node of document.querySelectorAll('[data-i18n]')) node.textContent = messages[locale][node.dataset.i18n] || messages.en[node.dataset.i18n] || node.textContent; };
  window.eidovaraI18n = { set, t: key => messages[locale][key] || messages.en[key] || key, supported: Object.keys(messages) };
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
