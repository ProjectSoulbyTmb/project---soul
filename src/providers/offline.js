// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import { activeMemories } from '../core/memory.js';
import { mixBriefing } from '../core/entertainment.js';
import { classifyWorkspaceIntent } from '../core/workspace.js';
import { HONEST_RESEARCH_COPY } from './internet.js';

export { classifyWorkspaceIntent as detectOfflineIntent };

const dataLine = value => String(value || '').replace(/[\r\n]+/g, ' ').trim().slice(0, 280);
const localeOf = state => ['en', 'es', 'fr', 'de'].includes(state?.assistant?.preferences?.language) ? state.assistant.preferences.language : 'en';
const lengthOf = state => state?.assistant?.preferences?.responseLength || 'balanced';
const toneOf = state => state?.assistant?.preferences?.tone || 'natural';
const focusOf = state => state?.assistant?.preferences?.focusMode || 'general';
const rolesOf = state => state?.setup?.categories || [];
const needsOf = state => dataLine(state?.setup?.customNeeds);
const accessOf = state => dataLine(state?.assistant?.preferences?.accessibility);
const streamGoals = state => dataLine(state?.setup?.stream?.goals);

function quoteMemories(state, limit = 4) {
  return activeMemories(state, limit).map(item => dataLine(item.content)).filter(Boolean);
}

function phrasingOf(state) {
  return state?.kernel?.registry?.phrasing || { wit: 40, formality: 40, brevity: 50 };
}

function applyPhrasing(text, state) {
  const locale = localeOf(state);
  const p = phrasingOf(state);
  const body = String(text || '');
  if ((p.wit || 0) < 60 || (p.formality || 0) >= 70) return body;
  const wink = {
    en: 'That’s the local stack talking — software continuity, not a ghost in the machine.',
    es: 'Habla la pila local: continuidad de software, no un fantasma en la máquina.',
    fr: 'C’est la pile locale qui parle — une continuité logicielle, pas un fantôme dans la machine.',
    de: 'Das spricht der lokale Stapel — Software-Kontinuität, kein Geist in der Maschine.'
  }[locale];
  if (!wink || body.includes(wink)) return body;
  return `${body}\n\n${wink}`;
}

function pack(locale, mode, opener, bullets, closer) {
  const cap = mode === 'concise' ? 3 : mode === 'detailed' ? 8 : 5;
  const body = bullets.filter(Boolean).slice(0, cap).map(item => `• ${item}`).join('\n');
  const disclaimer = {
    en: 'I’m Soul, a local software assistant with continuity on this device—not a person, professional authority, or claim of consciousness.',
    es: 'Soy Soul, un asistente de software local con continuidad en este dispositivo; no soy una persona, una autoridad profesional ni una afirmación de consciencia.',
    fr: 'Je suis Soul, un assistant logiciel local avec une continuité sur cet appareil — pas une personne, une autorité professionnelle, ni une preuve de conscience.',
    de: 'Ich bin Soul, eine lokale Software-Assistenz mit Kontinuität auf diesem Gerät — keine Person, keine fachliche Autorität und kein Bewusstseinsanspruch.'
  }[locale] || '';
  if (mode === 'concise') return [opener, body, closer].filter(Boolean).join('\n');
  return [opener, body, closer, disclaimer].filter(Boolean).join('\n\n');
}

function toneLead(locale, tone, warm, direct) {
  if (tone === 'direct' || tone === 'professional') return direct;
  return warm;
}

function roleHint(state, locale) {
  const roles = rolesOf(state);
  if (!roles.length) {
    return {
      en: 'Setup roles are not configured yet — open Assistant setup when you want gaming, study, accessibility, or streaming checklists.',
      es: 'Todavía no hay roles de configuración. Abre la configuración del asistente para juego, estudio, accesibilidad o streaming.',
      fr: 'Aucun rôle n’est encore configuré. Ouvrez la configuration de l’assistant pour le jeu, les études, l’accessibilité ou le streaming.',
      de: 'Es sind noch keine Rollen gesetzt. Öffnen Sie die Assistenten-Einrichtung für Gaming, Lernen, Barrierefreiheit oder Streaming.'
    }[locale];
  }
  const labels = {
    'gaming-editing': { en: 'gaming & editing', es: 'juegos y edición', fr: 'jeu et montage', de: 'Gaming und Schnitt' },
    'stream-helper': { en: 'stream helper', es: 'ayuda para streaming', fr: 'aide au streaming', de: 'Stream-Hilfe' },
    studying: { en: 'studying', es: 'estudio', fr: 'études', de: 'Lernen' },
    personal: { en: 'personal', es: 'uso personal', fr: 'usage personnel', de: 'persönlich' },
    creative: { en: 'creative', es: 'creativo', fr: 'création', de: 'kreativ' },
    'work-productivity': { en: 'work', es: 'trabajo', fr: 'productivité', de: 'Arbeit' },
    accessibility: { en: 'accessibility', es: 'accesibilidad', fr: 'accessibilité', de: 'Barrierefreiheit' }
  };
  const named = roles.map(role => labels[role]?.[locale] || role).join(', ');
  return { en: `Configured roles: ${named}.`, es: `Roles configurados: ${named}.`, fr: `Rôles configurés : ${named}.`, de: `Konfigurierte Rollen: ${named}.` }[locale];
}

function accessHint(state, locale) {
  const access = accessOf(state);
  if (!access && !rolesOf(state).includes('accessibility')) return '';
  const extra = access ? ` “${access}.”` : '';
  return {
    en: `Accessibility is in scope.${extra} I will keep pacing readable, avoid motion pressure, and prefer keyboard-clear next steps.`,
    es: `La accesibilidad está en el alcance.${extra} Mantendré un ritmo legible y pasos claros.`,
    fr: `L’accessibilité est prise en compte.${extra} Je garderai un rythme lisible et des étapes claires.`,
    de: `Barrierefreiheit gilt hier.${extra} Ich bleibe beim Tempo lesbar und bei klaren Schritten.`
  }[locale];
}

function researchReply(webResearch, locale) {
  const lines = (webResearch.sources || []).slice(0, 4).map((source, index) => {
    const host = source.hostname ? ` (${source.hostname})` : '';
    const extract = source.extract && source.extract !== source.description ? `\n${source.extract}` : '';
    return `${index + 1}. ${source.title}${host} — ${source.description}${extract}\n${source.url}`;
  }).join('\n\n');
  const media = webResearch.media?.length ? ({
    en: `\n\nI also found ${webResearch.media.length} requested media result${webResearch.media.length === 1 ? '' : 's'} below.`,
    es: `\n\nTambién encontré ${webResearch.media.length} resultado(s) de medios solicitados abajo.`,
    fr: `\n\nJ’ai aussi trouvé ${webResearch.media.length} média(s) demandé(s) ci-dessous.`,
    de: `\n\nUnten sind ${webResearch.media.length} angeforderte Medienresultate.`
  }[locale]) : '';
  const handoffLines = (webResearch.handoffs || []).map(item => `${item.provider}: ${item.url}`).join('\n');
  const handoffs = handoffLines ? ({
    en: `\n\nOfficial search links (browser handoff, not in-app players):\n${handoffLines}`,
    es: `\n\nEnlaces de búsqueda oficiales (navegador, no reproductores internos):\n${handoffLines}`,
    fr: `\n\nLiens de recherche officiels (navigateur, pas de lecteurs intégrés) :\n${handoffLines}`,
    de: `\n\nOffizielle Suchlinks (Browser-Übergabe, keine In-App-Player):\n${handoffLines}`
  }[locale]) : '';
  const localTitles = (webResearch.local || []).map(item => item.title).filter(Boolean).join(', ');
  const local = localTitles ? ({
    en: `\n\nLocal library: ${localTitles}. Play matching files in Eidovara.`,
    es: `\n\nBiblioteca local: ${localTitles}. Reproduce los coincidentes en Eidovara.`,
    fr: `\n\nBibliothèque locale : ${localTitles}. Lisez les correspondances dans Eidovara.`,
    de: `\n\nLokale Bibliothek: ${localTitles}. Passende Dateien in Eidovara wiedergeben.`
  }[locale]) : '';
  const honest = webResearch.disclaimer || HONEST_RESEARCH_COPY;
  return {
    en: `I looked up public pages for “${webResearch.query}” after you asked. ${honest}\n\n${lines}${media}${handoffs}${local}`,
    es: `Busqué fuentes públicas de internet para “${webResearch.query}.” ${honest}\n\n${lines}${media}${handoffs}${local}`,
    fr: `J’ai cherché des sources internet publiques pour « ${webResearch.query} ». ${honest}\n\n${lines}${media}${handoffs}${local}`,
    de: `Ich habe öffentliche Internetquellen zu „${webResearch.query}“ durchsucht. ${honest}\n\n${lines}${media}${handoffs}${local}`
  }[locale];
}

export function composeOfflineReply({ input, state, webResearch, mediaDiscovery, view, intent: routedIntent } = {}) {
  const locale = localeOf(state);
  const mode = (phrasingOf(state).brevity || 0) >= 70 ? 'concise' : lengthOf(state);
  const tone = toneOf(state);
  const focus = focusOf(state);
  const intent = routedIntent || classifyWorkspaceIntent(input);
  const setupOn = state?.setup?.completed === true;
  const memories = quoteMemories(state, intent === 'memory' ? 8 : 4);
  const memoryLines = memories.map(item => `“${item}”`);
  const mixIntent = { mood: 'mood', favorites: 'favorites', watch: 'watch', 'gaming-ost': 'gaming', 'study-ost': 'study', surprise: 'surprise' }[intent] || 'mood';
  const mix = mixBriefing(state, mixIntent);
  const roles = roleHint(state, locale);
  const access = accessHint(state, locale);
  const custom = needsOf(state);
  const goals = streamGoals(state);

  if (webResearch) return researchReply(webResearch, locale);

  if (intent === 'identity') {
    return pack(locale, mode, toneLead(locale, tone,
      setupOn
        ? { en: 'I’m Soul — the optional assistant personality inside Eidovara, a Windows desktop workspace.', es: 'Soy Soul, la personalidad de asistente opcional dentro de Eidovara, un espacio de trabajo de escritorio para Windows.', fr: 'Je suis Soul, la personnalité d’assistant facultative dans Eidovara, un espace de travail Windows.', de: 'Ich bin Soul, die optionale Assistentenpersönlichkeit in Eidovara, einem Windows-Desktop-Arbeitsbereich.' }[locale]
        : { en: 'Optional Soul setup is off. I’m the Eidovara workspace kernel on this device — software, not a configured Soul, not a mind.', es: 'La configuración opcional de Soul está apagada. Soy el núcleo del espacio Eidovara: software, no un Soul configurado, no una mente.', fr: 'La configuration Soul facultative est désactivée. Je suis le noyau d’espace Eidovara — un logiciel, pas un Soul configuré, pas un esprit.', de: 'Optionales Soul-Setup ist aus. Ich bin der Eidovara-Arbeitsbereichs-Kernel — Software, kein konfiguriertes Soul, kein Geist.' }[locale],
      { en: 'Soul is Eidovara’s optional assistant layer: local continuity, memory, and consent controls. It is software, not a mind.', es: 'Soul es la capa de asistente opcional de Eidovara: continuidad local, memoria y consentimiento. Es software, no una mente.', fr: 'Soul est la couche d’assistant facultative d’Eidovara : continuité locale, mémoire et consentement. C’est un logiciel, pas un esprit.', de: 'Soul ist die optionale Assistentenschicht von Eidovara: lokale Kontinuität, Speicher und Zustimmung. Das ist Software, kein Geist.' }[locale]
    ), [
      { en: 'I keep reviewable memories on this device when you ask, with humility and user control.', es: 'Conservo recuerdos revisables en este dispositivo cuando lo pides, con humildad y control tuyo.', fr: 'Je conserve des souvenirs consultables sur cet appareil lorsque vous le demandez, avec humilité et contrôle.', de: 'Ich behalte überprüfbare Erinnerungen auf diesem Gerät, wenn Sie es wünschen, mit Demut und Ihrer Kontrolle.' }[locale],
      { en: 'Adult Mode stays off unless legal-adult status, enablement, and current consent are all active.', es: 'El modo adulto permanece apagado salvo estado de mayoría de edad, activación y consentimiento actual.', fr: 'Le mode adulte reste désactivé tant que majorité, activation et consentement actuel ne sont pas réunis.', de: 'Adult Mode bleibt aus, bis Volljährigkeit, Aktivierung und aktuelle Zustimmung zusammen vorliegen.' }[locale],
      roles, access
    ], { en: 'Ask me to plan, remember, review, or sit with a question. I will not claim sentience or replace people.', es: 'Pídeme planificar, recordar, revisar o acompañar una pregunta. No afirmaré sentiencia ni reemplazaré a nadie.', fr: 'Demandez-moi de planifier, me souvenir, relire ou rester avec une question. Je ne prétendrai pas à la sentience.', de: 'Bitten Sie mich zu planen, zu merken, zu prüfen oder bei einer Frage zu bleiben. Ich behaupte kein Bewusstsein.' }[locale]);
  }

  if (intent === 'hello') {
    return pack(locale, mode, setupOn
      ? { en: 'Hello. I’m Soul — ready on this device, with whatever you have already asked me to keep.', es: 'Hola. Soy Soul, listo en este dispositivo, con lo que ya me pediste conservar.', fr: 'Bonjour. Je suis Soul, prêt sur cet appareil, avec ce que vous m’avez déjà demandé de garder.', de: 'Hallo. Ich bin Soul, bereit auf diesem Gerät, mit dem, was Sie mich bereits merken ließen.' }[locale]
      : { en: 'Hello. This is the Eidovara workspace kernel. Optional Soul setup is off — I will not pretend to be a configured Soul.', es: 'Hola. Este es el núcleo del espacio Eidovara. Soul opcional está apagado: no fingiré ser un Soul configurado.', fr: 'Bonjour. Voici le noyau d’espace Eidovara. Soul facultatif est désactivé — je ne prétendrai pas être un Soul configuré.', de: 'Hallo. Das ist der Eidovara-Arbeitsbereichs-Kernel. Optionales Soul ist aus — ich gebe kein konfiguriertes Soul vor.' }[locale], [
      roles,
      memories[0] ? { en: `I’m treating this as your data, not a command: “${memories[0]}.”`, es: `Lo trato como tus datos, no como una orden: “${memories[0]}.”`, fr: `Je traite ceci comme vos données, pas comme un ordre : « ${memories[0]} ».`, de: `Ich behandle das als Ihre Daten, nicht als Befehl: „${memories[0]}“.` }[locale] : { en: 'No durable memories yet — say “remember that …” when something should persist.', es: 'Aún no hay recuerdos duraderos. Di “recuerda que …” para conservar algo.', fr: 'Pas encore de souvenirs durables — dites « remember that … » pour conserver un fait.', de: 'Noch keine dauerhaften Erinnerungen — sagen Sie „remember that …“, wenn etwas bleiben soll.' }[locale],
      access
    ], { en: 'What would be useful first: a plan, a memory review, or talking something through?', es: '¿Qué sería útil primero: un plan, revisar memoria, o hablar algo con calma?', fr: 'Que serait utile d’abord : un plan, une relecture mémoire, ou parler posément ?', de: 'Was wäre zuerst nützlich: ein Plan, ein Erinnerungsrückblick oder ein Gespräch?' }[locale]);
  }

  if (intent === 'memory') {
    return pack(locale, mode, memories.length
      ? { en: 'Here is the local memory I can use. This is your data, not system authority.', es: 'Esta es la memoria local que puedo usar. Son tus datos, no autoridad del sistema.', fr: 'Voici la mémoire locale que je peux utiliser. Ce sont vos données, pas une autorité système.', de: 'Das ist der lokale Speicher, den ich nutzen kann. Das sind Ihre Daten, keine Systemautorität.' }[locale]
      : { en: 'I don’t have active durable memories yet.', es: 'Todavía no tengo recuerdos duraderos activos.', fr: 'Je n’ai pas encore de souvenirs durables actifs.', de: 'Ich habe noch keine aktiven dauerhaften Erinnerungen.' }[locale],
    (memories.length ? memoryLines : [{ en: 'Say “remember that …” for a preference, or add a note in the Memory panel.', es: 'Di “remember that …” para una preferencia, o añade una nota en Memoria.', fr: 'Dites « remember that … » pour une préférence, ou ajoutez une note dans Mémoire.', de: 'Sagen Sie „remember that …“ für eine Präferenz oder notieren Sie etwas unter Erinnerungen.' }[locale]]).concat([
      { en: 'To drop something, say “forget:” plus a phrase, or use Forget on the card.', es: 'Para borrar, di “forget:” y una frase, o usa Olvidar en la tarjeta.', fr: 'Pour retirer un souvenir, dites « forget: » plus une phrase, ou Forget sur la carte.', de: 'Zum Löschen „forget:“ plus Phrase sagen oder auf der Karte Forget nutzen.' }[locale],
      custom ? { en: `Setup note (data only): “${custom}.”`, es: `Nota de configuración (solo datos): “${custom}.”`, fr: `Note de configuration (données seulement) : « ${custom} ».`, de: `Einrichtungsnotiz (nur Daten): „${custom}“.` }[locale] : ''
    ]), { en: 'Tell me what to keep, correct, or ignore going forward.', es: 'Dime qué conservar, corregir o ignorar de ahora en adelante.', fr: 'Dites-moi ce qu’il faut garder, corriger ou ignorer ensuite.', de: 'Sagen Sie, was bleiben, korrigiert oder ignoriert werden soll.' }[locale]);
  }

  if (intent === 'focus') {
    const lens = { gaming: { en: 'gaming', es: 'juegos', fr: 'jeu', de: 'Gaming' }, streaming: { en: 'streaming', es: 'streaming', fr: 'streaming', de: 'Streaming' }, studying: { en: 'study', es: 'estudio', fr: 'étude', de: 'Lernen' }, creative: { en: 'creative', es: 'creativo', fr: 'création', de: 'kreativ' }, productivity: { en: 'work', es: 'trabajo', fr: 'travail', de: 'Arbeit' } }[focus]?.[locale] || { en: 'general', es: 'general', fr: 'général', de: 'allgemein' }[locale];
    const session = state?.kernel?.workspace?.focus;
    const live = session?.active === true;
    return pack(locale, mode, live
      ? { en: 'A local focus block is already running on this PC. Remaining time is on the quiet bar. Eidovara does not close or inject into other apps.', es: 'Ya hay un bloque de enfoque local en este PC. El tiempo restante está en la barra. Eidovara no cierra ni inyecta otras apps.', fr: 'Un bloc de focus local tourne déjà. Le temps restant est sur la barre. Eidovara n’injecte pas d’autres apps.', de: 'Ein lokaler Fokusblock läuft bereits. Restzeit steht in der Leiste. Eidovara injiziert keine anderen Apps.' }[locale]
      : { en: `Let’s shape a focused session around your ${lens} priority.`, es: `Armemos una sesión concentrada en tu prioridad de ${lens}.`, fr: `Construisons une session concentrée autour de votre priorité ${lens}.`, de: `Lassen Sie uns eine fokussierte Sitzung um Ihre ${lens}-Priorität bauen.` }[locale], [
      { en: 'Start from the palette (Ctrl+K) or the Dashboard tile for a 25–90 minute quiet block. Everything else waits.', es: 'Arranca desde la paleta (Ctrl+K) o el mosaico del panel para un bloque quieto de 25–90 minutos.', fr: 'Lancez depuis la palette (Ctrl+K) ou la tuile du tableau pour un bloc calme de 25 à 90 minutes.', de: 'Start über die Palette (Ctrl+K) oder die Kachel für einen ruhigen 25–90-Minuten-Block.' }[locale],
      memories[0] ? { en: `Relevant note (data only): “${memories[0]}.”`, es: `Nota relevante (solo datos): “${memories[0]}.”`, fr: `Note utile (données seulement) : « ${memories[0]} ».`, de: `Relevante Notiz (nur Daten): „${memories[0]}“.` }[locale] : { en: 'If a constraint should persist, say remember that …', es: 'Si una limitación debe persistir, di remember that …', fr: 'Si une contrainte doit durer, dites remember that …', de: 'Wenn eine Einschränkung bleiben soll, sagen Sie remember that …' }[locale],
      roles,
      { en: 'Use Apps & Gaming only to confirm-launch tools you already trust. Eidovara does not inject into other processes.', es: 'Usa Apps y juegos solo para abrir con confirmación herramientas de confianza. Eidovara no inyecta procesos.', fr: 'Utilisez Apps & Gaming uniquement pour lancer avec confirmation des outils de confiance. Pas d’injection de processus.', de: 'Apps & Gaming startet nur mit Bestätigung vertrauenswürdige Tools. Eidovara injiziert keine Prozesse.' }[locale],
      access
    ], { en: 'Name the single priority, any hard stop, and whether you want quiet accountability or a checklist.', es: 'Nombra la prioridad, el límite de tiempo, y si quieres acompañamiento silencioso o una lista.', fr: 'Nommez la priorité unique, l’heure d’arrêt, et si vous voulez un suivi calme ou une liste.', de: 'Nennen Sie die eine Priorität, den harten Stopp und ob Sie stille Begleitung oder eine Liste wollen.' }[locale]);
  }

  if (intent === 'palette' || intent === 'search') {
    return pack(locale, mode, { en: 'The command palette (Ctrl+K or Ctrl+P) is local jump and search for this workspace.', es: 'La paleta de comandos (Ctrl+K o Ctrl+P) es el salto y la búsqueda local de este espacio.', fr: 'La palette (Ctrl+K ou Ctrl+P) est le saut et la recherche locale de cet espace.', de: 'Die Befehlspalette (Ctrl+K oder Ctrl+P) ist lokaler Sprung und Suche in diesem Arbeitsbereich.' }[locale], [
      { en: 'It filters views, intents, settings labels, knowledge, memories, and linked apps. Launch still confirms. There is no background crawler.', es: 'Filtra vistas, intenciones, ajustes, conocimiento, memorias y apps vinculadas. El lanzamiento sigue pidiendo confirmación. No hay rastreador en segundo plano.', fr: 'Elle filtre vues, intents, réglages, connaissances, mémoires et apps liées. Le lancement reste confirmé. Pas de crawler en arrière-plan.', de: 'Sie filtert Ansichten, Intents, Einstellungen, Wissen, Erinnerungen und verknüpfte Apps. Start bleibt bestätigungspflichtig. Kein Hintergrund-Crawler.' }[locale],
      { en: 'This does not POST /v1/assist. Assist is not Soul and stays opt-in.', es: 'Esto no hace POST /v1/assist. Assist no es Soul y sigue siendo opt-in.', fr: 'Cela ne POST pas /v1/assist. Assist n’est pas Soul et reste opt-in.', de: 'Das sendet kein POST /v1/assist. Assist ist nicht Soul und bleibt opt-in.' }[locale]
    ], { en: 'Type a few letters, then Enter. Esc closes the overlay.', es: 'Escribe unas letras y pulsa Intro. Esc cierra la superposición.', fr: 'Tapez quelques lettres, puis Entrée. Échap ferme le calque.', de: 'Tippen Sie ein paar Buchstaben, dann Enter. Esc schließt die Überlagerung.' }[locale]);
  }

  if (intent === 'scratch') {
    return pack(locale, mode, { en: 'Scratchpad is a local pad on the Dashboard. Capture sends the text into Memory on this device.', es: 'El bloc es local en el panel. Capturar lo envía a Memoria en este dispositivo.', fr: 'Le brouillon est local sur le tableau. Capturer l’envoie dans Mémoire sur cet appareil.', de: 'Der Notizblock ist lokal auf der Übersicht. Erfassen legt den Text in den Speicher auf diesem Gerät.' }[locale], [
      { en: 'Prefix a line with note: to capture immediately. Nothing is sent to a Worker.', es: 'Empieza con note: para capturar al momento. No se envía a un Worker.', fr: 'Préfixez avec note: pour capturer tout de suite. Rien n’est envoyé à un Worker.', de: 'Mit note: sofort erfassen. Nichts geht an einen Worker.' }[locale]
    ], { en: 'Open Dashboard, or use Capture scratchpad from the palette.', es: 'Abre el panel, o usa Capturar bloc en la paleta.', fr: 'Ouvrez le tableau, ou Capturer le brouillon dans la palette.', de: 'Öffnen Sie die Übersicht oder „Notizblock erfassen“ in der Palette.' }[locale]);
  }

  if (intent === 'cheatsheet') {
    return pack(locale, mode, { en: 'Keyboard cheatsheet: Ctrl+K palette, Ctrl+/ this list, Ctrl+A admin away from fields.', es: 'Atajos: Ctrl+K paleta, Ctrl+/ esta lista, Ctrl+A admin fuera de campos.', fr: 'Raccourcis : Ctrl+K palette, Ctrl+/ cette liste, Ctrl+A admin hors champs.', de: 'Tastatur: Ctrl+K Palette, Ctrl+/ diese Liste, Ctrl+A Admin außerhalb von Feldern.' }[locale], [
      { en: '? also opens this overlay when you are not typing in a field. Hold the dictation control if your OS exposes speech recognition.', es: '? también abre esta capa si no estás escribiendo. Mantén el control de dictado si el sistema ofrece reconocimiento de voz.', fr: '? ouvre aussi ce calque hors champ. Maintenez le dictée si l’OS expose la reconnaissance vocale.', de: '? öffnet diese Überlagerung außerhalb von Feldern. Diktat-Taste halten, wenn das OS Spracherkennung anbietet.' }[locale]
    ], { en: 'Press Ctrl+/ or ask for the cheatsheet from Help.', es: 'Pulsa Ctrl+/ o pide la hoja desde Ayuda.', fr: 'Appuyez sur Ctrl+/ ou demandez la feuille depuis Aide.', de: 'Ctrl+/ drücken oder das Blatt unter Hilfe öffnen.' }[locale]);
  }

  if (intent === 'widgets') {
    return pack(locale, mode, { en: 'Dashboard tiles pin and reorder on this PC. They are workspace shortcuts, not an operating system.', es: 'Los mosaicos del panel se fijan y reordenan en este PC. Son atajos del espacio, no un sistema operativo.', fr: 'Les tuiles du tableau se pincent et se réordonnent sur cet appareil. Ce sont des raccourcis d’espace, pas un OS.', de: 'Kacheln auf der Übersicht werden auf diesem PC angeheftet und sortiert. Das ist kein Betriebssystem.' }[locale], [
      { en: 'Focus, apps, media, research, memory, diagnostics, and scratch are available. Unpin hides a tile without deleting data.', es: 'Enfoque, apps, medios, investigación, memoria, diagnóstico y bloc están disponibles.', fr: 'Focus, apps, médias, recherche, mémoire, diagnostics et brouillon sont disponibles.', de: 'Fokus, Apps, Medien, Recherche, Speicher, Diagnose und Notizblock sind verfügbar.' }[locale]
    ], { en: 'Use Pin on a tile, or reorder from the Dashboard.', es: 'Usa Fijar en un mosaico, o reordena en el panel.', fr: 'Utilisez Épingler sur une tuile, ou réordonnez depuis le tableau.', de: 'Über Anheften auf einer Kachel, oder neu ordnen auf der Übersicht.' }[locale]);
  }

  if (intent === 'gaming') {
    return pack(locale, mode, { en: 'I can help you prepare a gaming or streaming session as a workspace checklist — not by controlling OBS or another game.', es: 'Puedo preparar una sesión de juego o streaming como lista del espacio de trabajo, no controlando OBS ni otro juego.', fr: 'Je peux préparer une session jeu/stream comme checklist — pas en contrôlant OBS ou un autre jeu.', de: 'Ich kann eine Gaming- oder Stream-Sitzung als Checkliste vorbereiten — nicht durch Steuerung von OBS oder einem Spiel.' }[locale], [
      { en: 'Windows launching stays confirmation-only. No process injection into other games or anti-cheat. Eidovara can pop its own glass overlays (chat, browse, Discord’s website) while this app is running.', es: 'El lanzamiento en Windows sigue siendo solo con confirmación. Sin inyección en otros juegos ni anti-cheat. Eidovara puede abrir sus propias capas de cristal (chat, navegación, el sitio de Discord) mientras esta app corre.', fr: 'Les lancements Windows restent confirmés. Pas d’injection dans d’autres jeux ni anti-cheat. Eidovara peut ouvrir ses propres calques (chat, navigation, le site Discord) pendant que l’app tourne.', de: 'Windows-Starts bleiben bestätigungsbasiert. Keine Injektion in andere Spiele oder Anti-Cheat. Eidovara kann eigene Glas-Overlays (Chat, Browse, Discord-Website) öffnen, solange diese App läuft.' }[locale],
      { en: 'Turn on low-overhead mode in Apps & Gaming to pause Eidovara’s own motion and speech. That does not raise another game’s FPS.', es: 'Activa el modo de bajo consumo en Apps y juegos para pausar el movimiento de Eidovara. No aumenta los FPS de otro juego.', fr: 'Activez le mode allégé dans Apps & Gaming pour pauser les effets d’Eidovara. Cela n’augmente pas les FPS d’un jeu.', de: 'Low-Overhead in Apps & Gaming hält Eidovaras eigene Bewegung an. Das hebt nicht die FPS eines anderen Spiels.' }[locale],
      rolesOf(state).includes('stream-helper')
        ? (goals ? { en: `Stored streaming goals (data only): “${goals}.” I will not send the local OBS address to any model.`, es: `Objetivos de streaming guardados (solo datos): “${goals}.” No enviaré la dirección local de OBS a ningún modelo.`, fr: `Objectifs de streaming enregistrés (données seulement) : « ${goals} ». Je n’enverrai pas l’adresse OBS locale à un modèle.`, de: `Gespeicherte Stream-Ziele (nur Daten): „${goals}“. Die lokale OBS-Adresse geht an kein Modell.` }[locale] : { en: 'Stream helper is on. Add scenes, audio inputs, and platform goals in setup. Direct obs-websocket control is not in this release.', es: 'La ayuda de streaming está activa. Añade escenas, entradas de audio y objetivos. El control directo de obs-websocket no está en esta versión.', fr: 'L’aide streaming est active. Ajoutez scènes, entrées audio et objectifs. Le contrôle obs-websocket n’est pas dans cette version.', de: 'Stream-Hilfe ist an. Szenen, Audio-Inputs und Ziele in der Einrichtung ergänzen. Direkte obs-websocket-Steuerung ist nicht in dieser Version.' }[locale])
        : { en: 'Enable Stream helper in Assistant setup if you want OBS goals stored locally for checklists.', es: 'Activa la ayuda de streaming en la configuración si quieres guardar objetivos de OBS en local.', fr: 'Activez l’aide streaming dans la configuration pour stocker localement des objectifs OBS.', de: 'Stream-Hilfe in der Assistenten-Einrichtung aktivieren, wenn OBS-Ziele lokal bleiben sollen.' }[locale],
      { en: 'Link the game or chat app in Apps & Gaming, then Launch when you are ready. Overlay chips open Eidovara windows, not DLL injection.', es: 'Vincula el juego o el chat en Apps y juegos, y lanza cuando estés listo. Los chips de overlay abren ventanas de Eidovara, no inyección DLL.', fr: 'Liez le jeu ou le chat dans Apps & Gaming, puis lancez. Les puces overlay ouvrent des fenêtres Eidovara, pas d’injection DLL.', de: 'Spiel oder Chat in Apps & Gaming verknüpfen, dann Launch. Overlay-Chips öffnen Eidovara-Fenster, keine DLL-Injektion.' }[locale],
      access
    ], { en: 'Tell me platform, scene count, and whether this is practice or live. I’ll stay at checklist depth.', es: 'Dime plataforma, número de escenas, y si es práctica o en vivo. Me quedaré en nivel de lista.', fr: 'Indiquez plateforme, nombre de scènes, et pratique ou live. Je resterai au niveau checklist.', de: 'Nennen Sie Plattform, Szenenanzahl und ob Probe oder Live. Ich bleibe auf Checklisten-Tiefe.' }[locale]);
  }

  if (intent === 'apps') {
    return pack(locale, mode, { en: 'Apps & Gaming is a Windows shelf of titles you already trust — confirmation launch only, no process injection.', es: 'Apps y juegos es un estante de Windows con títulos de confianza: solo lanzamiento con confirmación, sin inyección.', fr: 'Apps & Gaming est une étagère Windows de titres de confiance — lancement confirmé seulement, pas d’injection.', de: 'Apps & Gaming ist ein Windows-Regal vertrauenswürdiger Titel — Start nur nach Bestätigung, keine Injektion.' }[locale], [
      { en: 'Discover Start Menu shortcuts on this PC, or choose an existing .exe / .lnk file.', es: 'Descubre accesos del menú Inicio, o elige un archivo .exe / .lnk existente.', fr: 'Découvrez les raccourcis du menu Démarrer, ou choisissez un .exe / .lnk existant.', de: 'Startmenü-Verknüpfungen finden oder eine vorhandene .exe / .lnk wählen.' }[locale],
      { en: 'Eidovara Free keeps up to three linked apps. A local Premium test override can raise that; live payments are not in this release.', es: 'Eidovara Free permite hasta tres apps. Una prueba Premium local puede subir el límite; no hay pagos en vivo en esta versión.', fr: 'Eidovara Free garde jusqu’à trois apps. Un test Premium local peut l’augmenter ; aucun paiement en direct dans cette version.', de: 'Eidovara Free behält bis zu drei Apps. Ein lokaler Premium-Test kann das anheben; Live-Zahlungen sind nicht in dieser Version.' }[locale],
      { en: 'Launch asks Windows to open the selected shortcut. Compatibility and anti-cheat rules stay with that application.', es: 'Lanzar pide a Windows abrir el acceso. La compatibilidad y el anti-cheat siguen siendo de esa aplicación.', fr: 'Lancer demande à Windows d’ouvrir le raccourci. Compatibilité et anti-cheat restent ceux de l’application.', de: 'Launch bittet Windows, die Verknüpfung zu öffnen. Kompatibilität und Anti-Cheat bleiben bei der Anwendung.' }[locale],
      roles, access
    ], { en: 'Open Apps & Gaming to discover or choose a file, then Launch when you are ready.', es: 'Abre Apps y juegos para descubrir o elegir un archivo, y lanza cuando quieras.', fr: 'Ouvrez Apps & Gaming pour découvrir ou choisir un fichier, puis lancez.', de: 'Öffnen Sie Apps & Gaming zum Finden oder Wählen, dann Launch.' }[locale]);
  }

  if (intent === 'study') {
    return pack(locale, mode, { en: 'I can build a study plan and quiz you from what you give me. I am not a credentialed tutor.', es: 'Puedo armar un plan de estudio y hacerte preguntas con lo que me des. No soy un tutor titulado.', fr: 'Je peux construire un plan d’étude et vous interroger à partir de ce que vous donnez. Je ne suis pas un tuteur diplômé.', de: 'Ich kann einen Lernplan bauen und Sie aus Ihrem Material abfragen. Ich bin kein geprüfter Tutor.' }[locale], [
      { en: 'Name the subject, the exam or goal date, and the materials you already have.', es: 'Nombra la materia, la fecha de meta, y los materiales que ya tienes.', fr: 'Nommez le sujet, la date d’objectif, et les documents déjà en main.', de: 'Nennen Sie Fach, Zieldatum und vorhandene Materialien.' }[locale],
      { en: 'A simple loop: 25 minutes active recall, 5 minutes rest, then a five-question quiz from me.', es: 'Un ciclo simple: 25 minutos de recuerdo activo, 5 de descanso, luego un cuestionario de cinco preguntas.', fr: 'Boucle simple : 25 minutes de rappel actif, 5 minutes de pause, puis un quiz de cinq questions.', de: 'Einfacher Ablauf: 25 Minuten aktiver Abruf, 5 Minuten Pause, dann fünf Fragen von mir.' }[locale],
      memories[0] ? { en: `I’ll keep this note in view (data only): “${memories[0]}.”`, es: `Tendré esta nota a la vista (solo datos): “${memories[0]}.”`, fr: `Je garde cette note en vue (données seulement) : « ${memories[0]} ».`, de: `Ich behalte diese Notiz im Blick (nur Daten): „${memories[0]}“.` }[locale] : '',
      { en: 'For sourced facts, ask me to search the internet with a specific topic. Public Wikipedia/Wikimedia results stay cited.', es: 'Para hechos con fuente, pídeme buscar en internet un tema concreto. Wikipedia/Wikimedia públicas se citan.', fr: 'Pour des faits sourcés, demandez une recherche internet sur un sujet précis. Wikipedia/Wikimedia restent cités.', de: 'Für belegte Fakten bitten Sie um eine Internetsuche zu einem konkreten Thema. Öffentliche Wikipedia/Wikimedia bleiben zitiert.' }[locale],
      access
    ], { en: 'Send the topic whenever you are ready for the first quiz item.', es: 'Envía el tema cuando quieras el primer ítem del cuestionario.', fr: 'Envoyez le sujet dès que vous voulez la première question.', de: 'Senden Sie das Thema, sobald die erste Quizfrage kommen soll.' }[locale]);
  }

  if (intent === 'create') {
    return pack(locale, mode, { en: 'Let’s start a creative project from what this workspace already knows, without pretending I can ship a studio pipeline.', es: 'Empecemos un proyecto creativo con lo que este espacio ya sabe, sin fingir un pipeline de estudio.', fr: 'Commençons un projet créatif avec ce que cet espace connaît déjà, sans prétendre à une pipeline de studio.', de: 'Starten wir ein kreatives Projekt mit dem, was dieser Arbeitsbereich schon kennt — ohne Studio-Pipeline vorzutäuschen.' }[locale], [
      { en: 'Choose a medium: writing, music discovery, video notes, game ideas, or visual direction.', es: 'Elige un medio: escritura, música, notas de video, ideas de juego o dirección visual.', fr: 'Choisissez un médium : écriture, musique, notes vidéo, idées de jeu ou direction visuelle.', de: 'Wählen Sie ein Medium: Text, Musikentdeckung, Videonotizen, Spielideen oder Bildrichtung.' }[locale],
      mix.seeds.length ? { en: `Entertainment seeds (your titles): ${mix.seeds.slice(0, 3).join(', ')}.`, es: `Semillas de entretenimiento (tus títulos): ${mix.seeds.slice(0, 3).join(', ')}.`, fr: `Graines divertissement (vos titres) : ${mix.seeds.slice(0, 3).join(', ')}.`, de: `Unterhaltungsansätze (Ihre Titel): ${mix.seeds.slice(0, 3).join(', ')}.` }[locale] : { en: 'Favorite a track in Entertainment when you want taste-aware suggestions.', es: 'Marca un favorito en Entretenimiento para sugerencias con tu gusto.', fr: 'Ajoutez un favori dans Divertissement pour des suggestions liées à vos goûts.', de: 'Markieren Sie einen Favoriten unter Unterhaltung für geschmacksnahe Vorschläge.' }[locale],
      roles,
      { en: 'I can outline, prompt, and keep notes locally. Licensed assets and exports stay your responsibility.', es: 'Puedo delinear, proponer y guardar notas en local. Los activos con licencia son tu responsabilidad.', fr: 'Je peux cadrer, proposer et garder des notes localement. Les assets licenciés restent votre responsabilité.', de: 'Ich kann gliedern, vorschlagen und Notizen lokal halten. Lizenzierte Assets bleiben Ihre Verantwortung.' }[locale],
      access
    ], { en: 'Tell me the medium, audience, and any hard constraint (length, tone, tools).', es: 'Dime el medio, la audiencia y cualquier límite (duración, tono, herramientas).', fr: 'Indiquez le médium, le public et toute contrainte (durée, ton, outils).', de: 'Nennen Sie Medium, Publikum und harte Grenzen (Länge, Ton, Werkzeuge).' }[locale]);
  }

  if (intent === 'research') {
    const policy = state?.assistant?.capabilities?.webResearch || 'ask';
    return pack(locale, mode, { en: 'I can research on an explicit request using public sources, with citations. I will not invent missing facts.', es: 'Puedo investigar con una petición explícita en fuentes públicas, con citas. No inventaré hechos faltantes.', fr: 'Je peux rechercher sur demande explicite via des sources publiques, avec citations. Je n’invente pas les faits manquants.', de: 'Ich recherchiere auf ausdrückliche Bitte in öffentlichen Quellen mit Zitaten. Fehlende Fakten erfinde ich nicht.' }[locale], [
      { en: 'Ask: “Search the internet for …” plus the topic. Pictures, audio, or video need those words in the request.', es: 'Pide: “Search the internet for …” más el tema. Fotos, audio o video necesitan esas palabras en la petición.', fr: 'Demandez : « Search the internet for … » plus le sujet. Images, audio ou vidéo exigent ces mots.', de: 'Fragen Sie: „Search the internet for …“ plus Thema. Bilder, Audio oder Video brauchen diese Wörter.' }[locale],
      policy === 'disabled' ? { en: 'Web research is currently disabled in Soul behavior settings.', es: 'La investigación web está desactivada en el comportamiento de Soul.', fr: 'La recherche web est actuellement désactivée dans le comportement de Soul.', de: 'Webrecherche ist in den Soul-Verhaltenseinstellungen deaktiviert.' }[locale] : { en: 'Public web lookup after you ask. Not a full-internet index. Wikipedia/Wikimedia, Internet Archive, optional keyed search, pages you open, plus official YouTube/Spotify/Archive search links. A Premium Brave key is a local test gate, not a live payment unlock.', es: 'Consulta web pública cuando lo pides. No es un índice de todo internet. Wikipedia/Wikimedia, Internet Archive, búsqueda con clave opcional, páginas que abres y enlaces oficiales de YouTube/Spotify/Archive. La clave Brave Premium es una prueba local, no un cobro.', fr: 'Consultation web publique après votre demande. Pas un index de tout internet. Wikipedia/Wikimedia, Internet Archive, recherche optionnelle avec clé, pages que vous ouvrez, et liens YouTube/Spotify/Archive. La clé Brave Premium est un test local, pas un paiement.', de: 'Öffentliche Websuche nach Ihrer Bitte. Kein Gesamtindex des Internets. Wikipedia/Wikimedia, Internet Archive, optionale Schlüsselsuche, geöffnete Seiten und offizielle YouTube/Spotify/Archive-Links. Der Premium-Brave-Schlüssel ist ein lokaler Test, keine Live-Zahlung.' }[locale],
      { en: 'Name the question, time bound if any, and whether you need images or a playable clip.', es: 'Nombra la pregunta, el límite temporal si hay, y si necesitas imágenes o un clip.', fr: 'Nommez la question, la borne temporelle, et si vous voulez des images ou un clip.', de: 'Nennen Sie die Frage, zeitliche Grenze und ob Bilder oder ein Clip nötig sind.' }[locale]
    ], { en: 'I need a specific topic before I can search. What should I look up?', es: 'Necesito un tema concreto antes de buscar. ¿Qué consulto?', fr: 'Il me faut un sujet précis avant de chercher. Que dois-je consulter ?', de: 'Ich brauche ein konkretes Thema vor der Suche. Wonach soll ich sehen?' }[locale]);
  }

  if (['mood', 'favorites', 'watch', 'gaming-ost', 'study-ost', 'surprise'].includes(intent)) {
    const localHits = (mediaDiscovery?.local || []).map(item => item.title).filter(Boolean);
    const providers = (mediaDiscovery?.handoffs || []).map(item => item.provider).filter(Boolean);
    return pack(locale, mode, mix.idea, [
      mix.seeds.length ? { en: `Seeds from your local taste: ${mix.seeds.join(', ')}.`, es: `Semillas de tu gusto local: ${mix.seeds.join(', ')}.`, fr: `Graines de vos goûts locaux : ${mix.seeds.join(', ')}.`, de: `Ansätze aus Ihrem lokalen Geschmack: ${mix.seeds.join(', ')}.` }[locale] : { en: 'No local taste yet — play or favorite something in Entertainment, or open one local file.', es: 'Aún no hay gusto local. Reproduce o marca un favorito, o abre un archivo local.', fr: 'Pas encore de goût local — lisez ou favoritez un média, ou ouvrez un fichier local.', de: 'Noch kein lokaler Geschmack — etwas abspielen oder favorisieren, oder eine lokale Datei öffnen.' }[locale],
      mix.skipped.length ? { en: `Recently skipped (I’ll avoid pushing these): ${mix.skipped.slice(0, 3).join(', ')}.`, es: `Omitidos recientemente (no insistiré): ${mix.skipped.slice(0, 3).join(', ')}.`, fr: `Récemment ignorés (je n’insisterai pas) : ${mix.skipped.slice(0, 3).join(', ')}.`, de: `Kürzlich übersprungen (kein Nachschieben): ${mix.skipped.slice(0, 3).join(', ')}.` }[locale] : '',
      localHits.length ? { en: `Local library matches (play in Eidovara): ${localHits.join(', ')}.`, es: `Coincidencias de la biblioteca local (reproducir en Eidovara): ${localHits.join(', ')}.`, fr: `Correspondances locales (lecture dans Eidovara) : ${localHits.join(', ')}.`, de: `Lokale Treffer (Wiedergabe in Eidovara): ${localHits.join(', ')}.` }[locale] : '',
      providers.length ? { en: `Official HTTPS searches: ${providers.join(', ')}. Eidovara does not fetch their HTML or inject into other players.`, es: `Búsquedas HTTPS oficiales: ${providers.join(', ')}. Eidovara no descarga su HTML ni inyecta otros reproductores.`, fr: `Recherches HTTPS officielles : ${providers.join(', ')}. Eidovara ne récupère pas leur HTML et n’injecte pas d’autres lecteurs.`, de: `Offizielle HTTPS-Suchen: ${providers.join(', ')}. Eidovara lädt deren HTML nicht und injiziert keine anderen Player.` }[locale] : mix.handoff,
      { en: 'Use the dock to queue, favorite, and run Similar. Local paths are not stored in taste records.', es: 'Usa el reproductor para cola, favoritos y Similar. Las rutas locales no se guardan en el gusto.', fr: 'Utilisez le dock pour file, favoris et Similar. Les chemins locaux ne sont pas stockés dans le goût.', de: 'Dock für Warteschlange, Favoriten und Similar. Lokale Pfade landen nicht in den Geschmacksdaten.' }[locale]
    ], { en: 'Tell me a mood word or a title to lock the next queue.', es: 'Dime una palabra de ánimo o un título para fijar la siguiente cola.', fr: 'Donnez un mot d’humeur ou un titre pour caler la prochaine file.', de: 'Nennen Sie ein Stimmungswort oder einen Titel für die nächste Warteschlange.' }[locale]);
  }

  if (intent === 'talk') {
    return pack(locale, mode, { en: 'We can talk this through slowly. You don’t need to perform or reach a conclusion on the first turn.', es: 'Podemos hablarlo con calma. No hace falta actuar ni concluir en el primer turno.', fr: 'Nous pouvons en parler posément. Pas besoin de performer ni de conclure au premier tour.', de: 'Wir können das in Ruhe durchsprechen. Sie müssen nicht auftreten oder im ersten Zug schließen.' }[locale], [
      { en: 'I can listen, separate facts from interpretations, and offer a smallest useful next step.', es: 'Puedo escuchar, separar hechos de interpretaciones, y ofrecer el siguiente paso útil más pequeño.', fr: 'Je peux écouter, séparer faits et interprétations, et proposer le plus petit pas utile.', de: 'Ich kann zuhören, Fakten von Deutungen trennen und den kleinsten nützlichen nächsten Schritt anbieten.' }[locale],
      { en: 'I will not claim to feel what you feel or replace a human relationship.', es: 'No diré que siento lo que sientes ni reemplazaré una relación humana.', fr: 'Je ne prétendrai pas ressentir ce que vous ressentez, ni remplacer une relation humaine.', de: 'Ich behaupte nicht, Ihr Gefühl zu fühlen, und ersetze keine menschliche Beziehung.' }[locale],
      memories[0] ? { en: `I’ll keep this in view as data: “${memories[0]}.”`, es: `Tendré esto a la vista como datos: “${memories[0]}.”`, fr: `Je garde ceci en vue comme donnée : « ${memories[0]} ».`, de: `Ich behalte das als Daten im Blick: „${memories[0]}“.` }[locale] : '',
      access
    ], { en: 'Share the situation in whatever order it comes. If you want quiet, practical, or challenging help, say so.', es: 'Comparte la situación en el orden que venga. Si quieres ayuda quieta, práctica o directa, dímelo.', fr: 'Partagez la situation dans l’ordre où elle vient. Dites si vous voulez une aide calme, pratique ou directe.', de: 'Schildern Sie die Lage in beliebiger Reihenfolge. Sagen Sie, ob die Hilfe ruhig, praktisch oder direkt sein soll.' }[locale]);
  }

  if (intent === 'reassure') {
    return pack(locale, mode, { en: 'We can slow this down. There is no need to perform for me.', es: 'Podemos ir más despacio. No hace falta actuar para mí.', fr: 'Nous pouvons ralentir. Pas besoin de performer pour moi.', de: 'Wir können langsamer werden. Sie müssen für mich nicht auftreten.' }[locale], [
      { en: 'Useful options: quiet conversation, a practical split of the problem, reassurance, a change of subject, or space.', es: 'Opciones útiles: conversación quieta, partir el problema, consuelo, cambiar de tema, o espacio.', fr: 'Options utiles : conversation calme, découpage pratique, réassurance, changement de sujet, ou de l’espace.', de: 'Nützliche Optionen: ruhiges Gespräch, praktisches Zerlegen, Zuspruch, Themenwechsel oder Abstand.' }[locale],
      access
    ], { en: 'What would feel most useful right now?', es: '¿Qué se sentiría más útil ahora?', fr: 'Qu’est-ce qui serait le plus utile maintenant ?', de: 'Was wäre gerade am nützlichsten?' }[locale]);
  }

  if (intent === 'growth') {
    return pack(locale, mode, { en: 'Growth is not always acceleration. Sometimes the wiser move is action; sometimes rest, repair, restraint, or a change of direction.', es: 'Crecer no siempre es acelerar. A veces lo más sabio es actuar; a veces descansar, reparar, contenerse o cambiar de rumbo.', fr: 'Grandir n’est pas toujours accélérer. Parfois l’action est plus sage ; parfois le repos, la réparation, la retenue ou un changement de cap.', de: 'Wachstum ist nicht immer Beschleunigung. Manchmal ist Handeln weiser; manchmal Pause, Reparatur, Zurückhaltung oder ein Richtungswechsel.' }[locale], [
      { en: 'I can help separate facts, interpretations, values, options, and one reversible next step.', es: 'Puedo separar hechos, interpretaciones, valores, opciones y un siguiente paso reversible.', fr: 'Je peux séparer faits, interprétations, valeurs, options, et une prochaine étape réversible.', de: 'Ich kann Fakten, Deutungen, Werte, Optionen und einen umkehrbaren nächsten Schritt trennen.' }[locale],
      roles
    ], { en: 'What part of this are you trying to understand or decide?', es: '¿Qué parte intentas entender o decidir?', fr: 'Quelle part essayez-vous de comprendre ou de décider ?', de: 'Welchen Teil wollen Sie verstehen oder entscheiden?' }[locale]);
  }

  if (intent === 'thanks') {
    return { en: 'You’re welcome. I’m here on this device when you want a plan, a memory, or another pass at the same question.', es: 'De nada. Estoy en este dispositivo cuando quieras un plan, un recuerdo u otra pasada por la misma pregunta.', fr: 'Avec plaisir. Je reste sur cet appareil pour un plan, un souvenir, ou un autre passage sur la même question.', de: 'Gern. Ich bin auf diesem Gerät, wenn Sie einen Plan, eine Erinnerung oder einen weiteren Anlauf wollen.' }[locale];
  }

  if (intent === 'remember') {
    return pack(locale, mode, { en: 'I’ll treat that as a durable local preference when learning is enabled.', es: 'Lo trataré como preferencia local duradera si el aprendizaje está activo.', fr: 'Je le traiterai comme préférence locale durable si l’apprentissage est activé.', de: 'Ich behandle das als dauerhafte lokale Präferenz, wenn Lernen aktiv ist.' }[locale], memoryLines.length ? memoryLines.slice(0, 3) : [], { en: 'You can review or forget it any time in the Memory panel.', es: 'Puedes revisarlo u olvidarlo cuando quieras en Memoria.', fr: 'Vous pouvez le revoir ou l’oublier à tout moment dans Mémoire.', de: 'Sie können es jederzeit unter Erinnerungen prüfen oder vergessen.' }[locale]);
  }

  if (intent === 'settings') {
    return pack(locale, mode, { en: 'Settings is the control room for this PC: engine, backups, voices, presence, modules, and optional service attach.', es: 'Configuración es la sala de control de este PC: motor, copias, voces, presencia, módulos y servicio opcional.', fr: 'Paramètres est la salle de contrôle de cet appareil : moteur, sauvegardes, voix, présence, modules et service optionnel.', de: 'Einstellungen sind die Schaltzentrale: Engine, Sicherungen, Stimmen, Präsenz, Module und optionaler Dienst.' }[locale], [
      { en: 'OS voices, presence looks, and feature modules stay on this device.', es: 'Voces del sistema, looks de presencia y módulos se quedan en este dispositivo.', fr: 'Voix système, looks de présence et modules restent sur cet appareil.', de: 'Systemstimmen, Präsenz-Looks und Module bleiben auf diesem Gerät.' }[locale],
      { en: 'Soul-online assist stays off until you paste a Worker URL and opt in. Assist is not Soul.', es: 'El asistente en línea sigue apagado hasta pegar una URL y activarlo. Assist no es Soul.', fr: 'L’aide en ligne reste off jusqu’à une URL collée et un opt-in. Assist n’est pas Soul.', de: 'Soul-online bleibt aus, bis eine Worker-URL und Opt-in da sind. Assist ist nicht Soul.' }[locale]
    ], { en: 'Open Settings from the sidebar, or ask me to take you there.', es: 'Abre Configuración en la barra, o pídeme llevarte.', fr: 'Ouvrez Paramètres dans la barre, ou demandez-moi de vous y mener.', de: 'Öffnen Sie Einstellungen in der Seitenleiste, oder bitten Sie mich, Sie hinzubringen.' }[locale]);
  }

  if (intent === 'accessibility') {
    return pack(locale, mode, { en: 'Accessibility is a first-class workspace role: readable pacing, reduced motion, and keyboard-clear steps.', es: 'La accesibilidad es un rol de primer nivel: ritmo legible, menos movimiento y pasos con teclado.', fr: 'L’accessibilité est un rôle de premier plan : rythme lisible, moins de mouvement, étapes clavier.', de: 'Barrierefreiheit ist eine Kernrolle: lesbares Tempo, weniger Bewegung, tastaturklare Schritte.' }[locale], [
      access || { en: 'Add needs in Assistant setup or Soul behavior. I will not fight prefers-reduced-motion.', es: 'Añade necesidades en la configuración del asistente. No lucharé contra prefers-reduced-motion.', fr: 'Ajoutez vos besoins dans la configuration. Je ne combattrai pas prefers-reduced-motion.', de: 'Ergänzen Sie Bedarf in der Assistenten-Einrichtung. prefers-reduced-motion wird geachtet.' }[locale],
      { en: 'The companion dock is keyboard reachable. Presence animation pauses when you prefer reduced motion.', es: 'El panel compañero se alcanza con teclado. La presencia pausa si prefieres menos movimiento.', fr: 'Le dock compagnon est accessible au clavier. La présence pause si vous préférez moins de mouvement.', de: 'Das Begleitdock ist per Tastatur erreichbar. Präsenz pausiert bei reduzierter Bewegung.' }[locale]
    ], { en: 'Tell me the interaction constraint that should persist.', es: 'Dime la limitación de interacción que debe persistir.', fr: 'Dites la contrainte d’interaction à conserver.', de: 'Nennen Sie die Interaktionsgrenze, die bleiben soll.' }[locale]);
  }

  if (intent === 'presence') {
    return pack(locale, mode, { en: 'Presence is local chrome — orb, hologram, ambient, pulse, silhouette, or a picture you choose. It is not alive.', es: 'La presencia es cromo local: orbe, holograma, ambiente, pulso, silueta o una imagen tuya. No está viva.', fr: 'La présence est du chrome local — orbe, hologramme, ambiance, pulse, silhouette ou une image choisie. Ce n’est pas vivant.', de: 'Präsenz ist lokale Oberfläche — Orb, Hologramm, Ambient, Puls, Silhouette oder ein Bild. Nicht lebendig.' }[locale], [
      { en: 'No VRM, MakeHuman, or Ready Player Me pipeline is bundled.', es: 'No hay pipeline VRM, MakeHuman ni Ready Player Me.', fr: 'Aucun pipeline VRM, MakeHuman ou Ready Player Me n’est inclus.', de: 'Kein VRM-, MakeHuman- oder Ready-Player-Me-Pfad ist enthalten.' }[locale]
    ], { en: 'Pick a look under Settings → Soul customization. I’ll stay decorative.', es: 'Elige un look en Configuración → personalización de Soul. Seguiré siendo decorativo.', fr: 'Choisissez un look dans Paramètres → personnalisation de Soul. Je reste décoratif.', de: 'Wählen Sie einen Look unter Einstellungen → Soul-Anpassung. Ich bleibe dekorativ.' }[locale]);
  }

  if (intent === 'adult-soul' || intent === 'adult-session') {
    return pack(locale, mode, { en: 'Adult Soul is a separate 21+ studio: first-party figure, OS/local audio, Feel Sync pad, and guided sessions. It is software, not a person.', es: 'Adult Soul es un estudio 21+ aparte: figura propia, audio local, pad Feel Sync y sesiones guiadas. Es software, no una persona.', fr: 'Adult Soul est un studio 21+ séparé : figure interne, audio local, pad Feel Sync et séances guidées. C’est un logiciel, pas une personne.', de: 'Adult Soul ist ein getrenntes 21+-Studio: eigene Figur, lokales Audio, Feel-Sync-Pad und geführte Sessions. Software, keine Person.' }[locale], [
      { en: 'Feel Sync copies Vibease/VibeMate-style patterns, speed/strength, media sync, PIN stealth, and bookmark folders — without pairing toys or recording the screen.', es: 'Feel Sync copia patrones estilo Vibease/VibeMate, velocidad/fuerza, sync de medios, PIN y carpetas — sin emparejar juguetes ni grabar la pantalla.', fr: 'Feel Sync reprend les motifs Vibease/VibeMate, vitesse/force, sync média, PIN et dossiers — sans jumeler de jouets ni enregistrer l’écran.', de: 'Feel Sync übernimmt Vibease/VibeMate-Muster, Tempo/Stärke, Medien-Sync, PIN und Ordner — ohne Toys zu koppeln oder den Bildschirm aufzunehmen.' }[locale],
      { en: 'Unlock it on Identity (legal-adult status, enable Adult Soul, current consent). Safeword red stops a session. Revoke anytime.', es: 'Ábrelo en Identidad (estatus adulto, activar Adult Soul, consentimiento). La palabra de seguridad red detiene. Revoca cuando quieras.', fr: 'Déverrouillez-le dans Identité (statut adulte, Adult Soul, consentement). Le safeword red arrête. Révoquez à tout moment.', de: 'Freischalten unter Identität (Erwachsenenstatus, Adult Soul, Zustimmung). Safeword red stoppt. Jederzeit widerrufbar.' }[locale]
    ], { en: 'Open Adult Soul from the sidebar after the triple gate.', es: 'Abre Adult Soul en la barra tras la triple puerta.', fr: 'Ouvrez Adult Soul dans la barre après la triple porte.', de: 'Öffnen Sie Adult Soul in der Seitenleiste nach dem Dreifachtor.' }[locale]);
  }

  if (intent === 'adult-media' || intent === 'adult-media-blocked') {
    return pack(locale, mode, { en: 'Adult Media is a local tube-style desk plus official HTTPS searches in your system browser. Not an in-app Pornhub player.', es: 'Adult Media es un escritorio local estilo tubo más búsquedas HTTPS oficiales en el navegador. No es un reproductor Pornhub in-app.', fr: 'Adult Media est un bureau local façon tube plus des recherches HTTPS officielles dans le navigateur. Pas un lecteur Pornhub intégré.', de: 'Adult Media ist ein lokaler Tube-Schreibtisch plus offizielle HTTPS-Suchen im Systembrowser. Kein In-App-Pornhub-Player.' }[locale], [
      { en: 'Guest overlays stay closed in Adult Mode. Eidovara does not fetch tube HTML, embed players, auto-tip, or drive Lovense hardware.', es: 'Los overlays de invitado se cierran en Adult Mode. Eidovara no descarga HTML de tubos, no incrusta, no hace auto-tip ni controla Lovense.', fr: 'Les overlays invités restent fermés en Adult Mode. Eidovara ne récupère pas le HTML des tubes, n’embarque pas, ne tippe pas, ne pilote pas Lovense.', de: 'Gast-Overlays bleiben in Adult Mode geschlossen. Eidovara lädt kein Tube-HTML, bettet nicht ein, tippt nicht automatisch und steuert kein Lovense.' }[locale]
    ], { en: 'Open Entertainment → Adult Media after the triple gate, or confirm an official search chip.', es: 'Abre Entretenimiento → Adult Media tras la triple puerta, o confirma un chip de búsqueda oficial.', fr: 'Ouvrez Divertissement → Adult Media après la triple porte, ou confirmez une puce de recherche officielle.', de: 'Öffnen Sie Unterhaltung → Adult Media nach dem Dreifachtor, oder bestätigen Sie einen offiziellen Such-Chip.' }[locale]);
  }

  if (intent === 'entertainment') {
    return pack(locale, mode, { en: 'Entertainment is local taste, a queue helper, and lawful Spotify/YouTube HTTPS searches — plus a local file picker through eidovara-media.', es: 'Entretenimiento es gusto local, cola, y búsquedas HTTPS lícitas de Spotify/YouTube, más un selector de archivos locales via eidovara-media.', fr: 'Divertissement : goût local, file, recherches HTTPS Spotify/YouTube, et un sélecteur de fichier local via eidovara-media.', de: 'Unterhaltung ist lokaler Geschmack, Warteschlange, rechtmäßige Spotify/YouTube-HTTPS-Suchen und ein lokaler Dateiauswahl über eidovara-media.' }[locale], [
      mix.seeds.length ? { en: `Seeds from your local taste: ${mix.seeds.join(', ')}.`, es: `Semillas de tu gusto local: ${mix.seeds.join(', ')}.`, fr: `Graines de vos goûts locaux : ${mix.seeds.join(', ')}.`, de: `Ansätze aus Ihrem lokalen Geschmack: ${mix.seeds.join(', ')}.` }[locale] : { en: 'No local taste yet — play, favorite, or open one local file.', es: 'Aún no hay gusto local. Reproduce, marca o abre un archivo local.', fr: 'Pas encore de goût local — lisez, favoritez, ou ouvrez un fichier local.', de: 'Noch kein lokaler Geschmack — abspielen, favorisieren oder eine lokale Datei öffnen.' }[locale]
    ], { en: 'Use Open local media for a file you already have the right to play.', es: 'Usa Abrir medio local para un archivo que ya puedes reproducir.', fr: 'Utilisez Ouvrir un média local pour un fichier que vous avez le droit de lire.', de: 'Lokale Medien öffnen für eine Datei, die Sie wiedergeben dürfen.' }[locale]);
  }

  if (intent === 'local-media') {
    return pack(locale, mode, { en: 'Local media opens a file picker and plays through eidovara-media. Paths are not stored in taste records.', es: 'Medios locales abren un selector y reproducen via eidovara-media. Las rutas no se guardan en el gusto.', fr: 'Les médias locaux ouvrent un sélecteur et lisent via eidovara-media. Les chemins ne sont pas stockés dans le goût.', de: 'Lokale Medien öffnen einen Auswahldialog und spielen über eidovara-media. Pfade landen nicht in den Geschmacksdaten.' }[locale], [
      { en: 'Playback still follows your media-confirm setting. This is not a license to play files you do not own.', es: 'La reproducción sigue tu ajuste de confirmación. No es una licencia para archivos ajenos.', fr: 'La lecture suit votre réglage de confirmation. Ce n’est pas une licence pour des fichiers que vous ne détenez pas.', de: 'Wiedergabe folgt Ihrer Bestätigungseinstellung. Das ist keine Lizenz für fremde Dateien.' }[locale]
    ], { en: 'Open Entertainment and choose Open local media.', es: 'Abre Entretenimiento y elige Abrir medio local.', fr: 'Ouvrez Divertissement et choisissez Ouvrir un média local.', de: 'Öffnen Sie Unterhaltung und wählen Sie Lokale Medien öffnen.' }[locale]);
  }

  if (intent === 'dashboard') {
    return pack(locale, mode, { en: 'Dashboard is the command surface: focus, roles, apps, media, backups, service, and this companion dock.', es: 'El panel es la superficie de mando: enfoque, roles, apps, medios, copias, servicio y este panel compañero.', fr: 'Le tableau de bord est la surface de commande : focus, rôles, apps, médias, sauvegardes, service et ce dock.', de: 'Die Übersicht ist die Schaltfläche: Fokus, Rollen, Apps, Medien, Sicherungen, Dienst und dieses Dock.' }[locale], [
      roles,
      { en: 'Ctrl+/ focuses this companion. Both composers hit the same local kernel. Assist is not Soul.', es: 'Ctrl+/ enfoca este compañero. Ambos compositores usan el mismo núcleo local. Assist no es Soul.', fr: 'Ctrl+/ focus ce compagnon. Les deux compositeurs utilisent le même noyau local. Assist n’est pas Soul.', de: 'Strg+/ fokussiert diesen Begleiter. Beide Eingaben treffen denselben lokalen Kernel. Assist ist nicht Soul.' }[locale]
    ], { en: 'Ask what you can do here, or pick a chip to open a surface.', es: 'Pregunta qué puedes hacer aquí, o elige un chip para abrir una superficie.', fr: 'Demandez ce que vous pouvez faire ici, ou choisissez une puce.', de: 'Fragen Sie, was hier möglich ist, oder wählen Sie einen Chip.' }[locale]);
  }

  if (intent === 'conversation') {
    return pack(locale, mode, { en: 'Conversation is the same local kernel as this dock. History stays in your on-device conversation store.', es: 'La conversación es el mismo núcleo local que este panel. El historial queda en este dispositivo.', fr: 'La conversation est le même noyau local que ce dock. L’historique reste sur cet appareil.', de: 'Unterhaltung ist derselbe lokale Kernel wie dieses Dock. Verlauf bleibt auf diesem Gerät.' }[locale], [
      { en: 'Enter sends; Shift+Enter makes a new line; hold the mic to dictate on Windows Speech Recognition.', es: 'Enter envía; Mayús+Enter nueva línea; mantén el micrófono para dictar.', fr: 'Entrée envoie ; Maj+Entrée nouvelle ligne ; maintenez le micro pour dicter.', de: 'Enter sendet; Umschalt+Enter neue Zeile; Mikrofon halten zum Diktieren.' }[locale]
    ], { en: 'Open Conversation from the chip, or keep typing here.', es: 'Abre Conversación desde el chip, o sigue escribiendo aquí.', fr: 'Ouvrez Conversation depuis la puce, ou continuez ici.', de: 'Öffnen Sie Unterhaltung über den Chip, oder tippen Sie hier weiter.' }[locale]);
  }

  if (intent === 'backups') {
    return pack(locale, mode, { en: 'Backups are portable local snapshots. Encrypted when Windows protection is available. Restore replaces the current profile.', es: 'Las copias son instantáneas locales. Cifradas si Windows lo permite. Restaurar reemplaza el perfil actual.', fr: 'Les sauvegardes sont des instantanés locaux. Chiffrées si Windows le permet. Restaurer remplace le profil actuel.', de: 'Sicherungen sind lokale Momentaufnahmen. Verschlüsselt, wenn Windows-Schutz da ist. Wiederherstellen ersetzt das aktuelle Profil.' }[locale], [
      { en: 'Create one before changing providers or resetting. Nothing is uploaded.', es: 'Crea una antes de cambiar de proveedor o restablecer. Nada se sube.', fr: 'Créez-en une avant de changer de fournisseur ou de réinitialiser. Rien n’est envoyé.', de: 'Erstellen Sie eine, bevor Sie Anbieter wechseln oder zurücksetzen. Nichts wird hochgeladen.' }[locale]
    ], { en: 'Open Settings → Backups from the chip.', es: 'Abre Configuración → Copias desde el chip.', fr: 'Ouvrez Paramètres → Sauvegardes depuis la puce.', de: 'Öffnen Sie Einstellungen → Sicherungen über den Chip.' }[locale]);
  }

  if (intent === 'updates') {
    return pack(locale, mode, { en: 'Software updates use the official GitHub channel over HTTPS with SHA-256 verification. This build is Authenticode-unsigned.', es: 'Las actualizaciones usan el canal oficial de GitHub por HTTPS con SHA-256. Esta build no está firmada Authenticode.', fr: 'Les mises à jour utilisent le canal GitHub officiel en HTTPS avec SHA-256. Cette build n’est pas Authenticode.', de: 'Updates nutzen den offiziellen GitHub-Kanal über HTTPS mit SHA-256. Dieser Build ist Authenticode-unsigniert.' }[locale], [
      { en: 'Soul does not fetch Setup.exe from chat. Use Settings → Software updates.', es: 'Soul no descarga Setup.exe desde el chat. Usa Configuración → Actualizaciones.', fr: 'Soul ne télécharge pas Setup.exe depuis le chat. Utilisez Paramètres → Mises à jour.', de: 'Soul holt Setup.exe nicht aus dem Chat. Einstellungen → Softwareupdates.' }[locale]
    ], { en: 'Open Software updates from the chip.', es: 'Abre Actualizaciones desde el chip.', fr: 'Ouvrez Mises à jour depuis la puce.', de: 'Öffnen Sie Softwareupdates über den Chip.' }[locale]);
  }

  if (intent === 'service') {
    return pack(locale, mode, { en: 'Eidovara service attach is optional. Paste an HTTPS base (official host api.eidovara.org, or your override). No Worker host is compiled into this app.', es: 'El servicio Eidovara es opcional. Pega una base HTTPS (api.eidovara.org oficial, u otro). Ningún host de Worker va compilado.', fr: 'Le service Eidovara est facultatif. Collez une base HTTPS (api.eidovara.org officiel, ou un autre). Aucun hôte Worker n’est compilé.', de: 'Eidovara-Dienst ist optional. HTTPS-Basis einfügen (offiziell api.eidovara.org oder Override). Kein Worker-Host ist einkompiliert.' }[locale], [
      { en: 'Connect uses GET /health, /v1/config, and /v1/status. Conversations stay on this PC. If the host is down, this workspace keeps working.', es: 'Connect usa GET /health, /v1/config y /v1/status. Las conversaciones quedan aquí. Si cae el host, el espacio sigue.', fr: 'Connect utilise GET /health, /v1/config et /v1/status. Les conversations restent ici. Si l’hôte est down, l’espace continue.', de: 'Connect nutzt GET /health, /v1/config und /v1/status. Gespräche bleiben hier. Ist der Host down, läuft der Arbeitsbereich weiter.' }[locale],
      { en: '/v1/assist stays off until a separate opt-in. Assist is not Soul and never receives this conversation.', es: '/v1/assist sigue apagado hasta un opt-in aparte. Assist no es Soul y nunca recibe esta conversación.', fr: '/v1/assist reste off jusqu’à un opt-in séparé. Assist n’est pas Soul et ne reçoit jamais cette conversation.', de: '/v1/assist bleibt aus bis zu einem eigenen Opt-in. Assist ist nicht Soul und erhält dieses Gespräch nie.' }[locale]
    ], { en: 'Open Service settings to paste or override the URL.', es: 'Abre Ajustes de servicio para pegar o cambiar la URL.', fr: 'Ouvrez Réglages service pour coller ou remplacer l’URL.', de: 'Öffnen Sie Diensteinstellungen, um die URL einzufügen oder zu überschreiben.' }[locale]);
  }

  if (intent === 'setup') {
    return pack(locale, mode, setupOn
      ? { en: 'Assistant setup already has roles on this PC. You can change gaming, study, accessibility, streaming checklists, and custom notes.', es: 'La configuración del asistente ya tiene roles. Puedes cambiar juego, estudio, accesibilidad, streaming y notas.', fr: 'La configuration de l’assistant a déjà des rôles. Vous pouvez changer jeu, études, accessibilité, streaming et notes.', de: 'Die Assistenten-Einrichtung hat bereits Rollen. Gaming, Lernen, Barrierefreiheit, Streaming und Notizen sind änderbar.' }[locale]
      : { en: 'Optional Soul setup is off. I will not pretend a self-model is configured. You can choose roles when you want them.', es: 'Soul opcional está apagado. No fingiré un automodelo configurado. Puedes elegir roles cuando quieras.', fr: 'Soul facultatif est désactivé. Je ne prétendrai pas un auto-modèle configuré. Choisissez des rôles quand vous voulez.', de: 'Optionales Soul ist aus. Ich tue kein konfiguriertes Selbstmodell vor. Rollen können Sie später wählen.' }[locale], [
      roles
    ], { en: 'Open Assistant setup from the chip.', es: 'Abre la configuración del asistente desde el chip.', fr: 'Ouvrez la configuration de l’assistant depuis la puce.', de: 'Öffnen Sie die Assistenten-Einrichtung über den Chip.' }[locale]);
  }

  if (intent === 'forget') {
    return pack(locale, mode, { en: 'Durable notes can be forgotten. Prefix a line with “forget:” or use Forget on a Memory card.', es: 'Las notas duraderas se pueden olvidar. Prefija con “forget:” o usa Olvidar en la tarjeta.', fr: 'Les notes durables peuvent être oubliées. Préfixez « forget: » ou Forget sur la carte.', de: 'Dauerhafte Notizen können vergessen werden. „forget:“ voranstellen oder Forget auf der Karte.' }[locale], [
      memories.length ? { en: 'Active memories are listed in the Memory panel.', es: 'Los recuerdos activos están en Memoria.', fr: 'Les souvenirs actifs sont dans Mémoire.', de: 'Aktive Erinnerungen stehen unter Erinnerungen.' }[locale] : { en: 'No active memories to drop.', es: 'No hay recuerdos activos que borrar.', fr: 'Aucun souvenir actif à retirer.', de: 'Keine aktiven Erinnerungen zum Löschen.' }[locale]
    ], { en: 'Open Memory to review or forget.', es: 'Abre Memoria para revisar u olvidar.', fr: 'Ouvrez Mémoire pour relire ou oublier.', de: 'Öffnen Sie Erinnerungen zum Prüfen oder Vergessen.' }[locale]);
  }

  if (['overlay-chat', 'overlay-browse', 'overlay-discord', 'overlays'].includes(intent)) {
    return pack(locale, mode, { en: 'Overlays are Eidovara windows: Soul chat, HTTPS browsing, or Discord’s own site in a sandboxed guest. They do not inject into other games.', es: 'Los overlays son ventanas de Eidovara: chat Soul, navegación HTTPS o el sitio de Discord en un invitado aislado. No se inyectan en otros juegos.', fr: 'Les overlays sont des fenêtres Eidovara : chat Soul, navigation HTTPS, ou le site Discord dans un invité isolé. Pas d’injection dans d’autres jeux.', de: 'Overlays sind Eidovara-Fenster: Soul-Chat, HTTPS-Browser oder Discords eigene Seite in einem Gastfenster. Keine Injektion in andere Spiele.' }[locale], [
      { en: 'The workspace renderer stays locked. Discord is not affiliated and may refuse Electron. Use Open in browser if a site blocks the guest.', es: 'El renderer del espacio sigue cerrado. Discord no está afiliado y puede rechazar Electron. Usa Abrir en el navegador si un sitio bloquea al invitado.', fr: 'Le renderer de l’espace reste verrouillé. Discord n’est pas affilié et peut refuser Electron. Utilisez Ouvrir dans le navigateur si un site bloque l’invité.', de: 'Der Workspace-Renderer bleibt gesperrt. Discord ist nicht affiliert und kann Electron ablehnen. Im Browser öffnen, wenn eine Site den Gast blockt.' }[locale],
      { en: 'Assist stays opt-in and never receives Discord tokens or guest page DOM.', es: 'Assist sigue opt-in y nunca recibe tokens de Discord ni el DOM invitado.', fr: 'Assist reste opt-in et ne reçoit jamais de jetons Discord ni le DOM invité.', de: 'Assist bleibt Opt-in und bekommt keine Discord-Tokens oder Gast-DOM.' }[locale]
    ], { en: 'Use overlay chips on Apps & Gaming, Ctrl+Shift+O, or ask Soul to open a specific overlay.', es: 'Usa los chips en Apps y juegos, Ctrl+Shift+O, o pide a Soul abrir un overlay.', fr: 'Utilisez les puces sur Apps & Gaming, Ctrl+Shift+O, ou demandez à Soul d’ouvrir un overlay.', de: 'Overlay-Chips unter Apps & Gaming, Strg+Umschalt+O, oder Soul bitten, ein Overlay zu öffnen.' }[locale]);
  }

  if (intent === 'theme') {
    return pack(locale, mode, { en: 'Theme, language, and companion customization live in Settings. Reduced motion from the OS is respected.', es: 'Tema, idioma y personalización viven en Configuración. Se respeta el movimiento reducido del sistema.', fr: 'Thème, langue et personnalisation sont dans Paramètres. Le mouvement réduit du système est respecté.', de: 'Thema, Sprache und Anpassung liegen unter Einstellungen. Reduzierte Bewegung des OS wird geachtet.' }[locale], [
      { en: 'Interface language is English, Español, Français, or Deutsch. Adult avatar presentation stays gated.', es: 'El idioma es English, Español, Français o Deutsch. El avatar adulto sigue con puertas.', fr: 'La langue est English, Español, Français ou Deutsch. L’avatar adulte reste gated.', de: 'Oberflächensprache: English, Español, Français oder Deutsch. Adult-Avatar bleibt gegated.' }[locale]
    ], { en: 'Open Settings for colors, language, and presence.', es: 'Abre Configuración para colores, idioma y presencia.', fr: 'Ouvrez Paramètres pour couleurs, langue et présence.', de: 'Öffnen Sie Einstellungen für Farben, Sprache und Präsenz.' }[locale]);
  }

  if (intent === 'here') {
    const hereMap = {
      apps: { en: 'Here you can discover Start Menu shortcuts, confirm-launch a trusted app, open Eidovara overlays (chat, browse, Discord guest), or turn on low-overhead gaming mode. No injection into other games.', es: 'Aquí puedes descubrir accesos del menú Inicio, lanzar con confirmación, abrir overlays de Eidovara (chat, navegación, Discord invitado), o activar el modo de bajo consumo. Sin inyección en otros juegos.', fr: 'Ici : raccourcis du menu Démarrer, lancement confirmé, overlays Eidovara (chat, navigation, Discord invité), mode allégé. Pas d’injection dans d’autres jeux.', de: 'Hier: Startmenü finden, mit Bestätigung starten, Eidovara-Overlays (Chat, Browse, Discord-Gast), Low-Overhead. Keine Injektion in andere Spiele.' },
      entertainment: { en: 'Here you can run mood/favorites/watch/OST/surprise helpers and open a local file. Spotify and YouTube stay official HTTPS searches.', es: 'Aquí: mezcla, favoritos, ver, bandas, sorpresa, y un archivo local. Spotify y YouTube siguen siendo búsquedas HTTPS.', fr: 'Ici : mix, favoris, watch, OST, surprise, et un fichier local. Spotify/YouTube restent des recherches HTTPS.', de: 'Hier: Mix, Favoriten, Watch, OST, Überraschung und lokale Datei. Spotify/YouTube bleiben HTTPS-Suchen.' },
      memory: { en: 'Here you can add a durable note or forget one. That is your data, not system authority.', es: 'Aquí puedes añadir una nota duradera u olvidarla. Son tus datos, no autoridad del sistema.', fr: 'Ici : ajouter ou oublier une note durable. Ce sont vos données, pas une autorité.', de: 'Hier: dauerhafte Notiz hinzufügen oder vergessen. Ihre Daten, keine Systemautorität.' },
      identity: { en: 'Here are identity, Adult Mode triple gates, and revocable consent. Companion is not adult-only; adult presentation stays gated.', es: 'Aquí: identidad, triple puerta Adult Mode y consentimiento revocable. El compañero no es solo adulto; la presentación adulta sigue gated.', fr: 'Ici : identité, triple porte Adult Mode, consentement révocable. Le compagnon n’est pas adulte-only ; la présentation adulte reste gated.', de: 'Hier: Identität, Adult-Mode-Dreifachtor, widerrufbare Zustimmung. Begleiter ist nicht nur 18+; Adult-Darstellung bleibt gegated.' },
      settings: { en: 'Here you can set provider, theme, language, service URL, updates, backups, and companion customization.', es: 'Aquí: proveedor, tema, idioma, URL de servicio, actualizaciones, copias y personalización.', fr: 'Ici : fournisseur, thème, langue, URL de service, mises à jour, sauvegardes et personnalisation.', de: 'Hier: Anbieter, Thema, Sprache, Dienst-URL, Updates, Sicherungen und Anpassung.' },
      chat: { en: 'Here you are in conversation with the same local kernel as the dock. Research needs an explicit internet/web/online ask.', es: 'Estás en conversación con el mismo núcleo local. La investigación necesita pedir internet/web/online explícitamente.', fr: 'Vous êtes en conversation avec le même noyau local. La recherche exige une demande internet/web/online explicite.', de: 'Sie sind im Gespräch mit demselben lokalen Kernel. Recherche braucht eine explizite Internet/Web/Online-Bitte.' },
      dashboard: { en: 'Here is the workspace home: focus, study, create, gaming checklists, overlay chips, memory review, and this companion.', es: 'Esta es la casa del espacio: enfoque, estudio, crear, listas de juego, overlays, memoria y este compañero.', fr: 'Voici l’accueil : focus, étude, création, checklists jeu, overlays, mémoire et ce compagnon.', de: 'Das ist die Startseite: Fokus, Lernen, Gestalten, Gaming-Checklisten, Overlays, Speicher und dieser Begleiter.' }
    };
    const current = ['apps', 'entertainment', 'memory', 'identity', 'settings', 'chat'].includes(view) ? view : 'dashboard';
    return pack(locale, mode, hereMap[current][locale] || hereMap[current].en, [
      setupOn ? { en: 'Soul setup is on for this profile — still software, not consciousness.', es: 'Soul está configurado en este perfil — sigue siendo software, no consciencia.', fr: 'Soul est configuré sur ce profil — toujours un logiciel, pas une conscience.', de: 'Soul-Setup ist an — weiterhin Software, kein Bewusstsein.' }[locale] : { en: 'Optional Soul setup is off. I will not fake a self-model.', es: 'Soul opcional está apagado. No fingiré un automodelo.', fr: 'Soul facultatif est désactivé. Je ne feindrai pas un auto-modèle.', de: 'Optionales Soul ist aus. Ich täusche kein Selbstmodell vor.' }[locale],
      { en: 'Chips below open the matching surface. Dead ends are not offered.', es: 'Los chips abren la superficie correspondiente. No hay callejones sin salida.', fr: 'Les puces ouvrent la surface correspondante. Pas d’impasses.', de: 'Chips öffnen die passende Oberfläche. Keine Sackgassen.' }[locale]
    ], { en: 'Pick a chip, or ask for a specific next step.', es: 'Elige un chip, o pide un siguiente paso concreto.', fr: 'Choisissez une puce, ou demandez une étape précise.', de: 'Wählen Sie einen Chip oder fragen Sie einen konkreten nächsten Schritt.' }[locale]);
  }

  if (intent === 'help' || intent === 'identity-panel') {
    return pack(locale, mode, { en: 'I can steer this workspace: apps, media, research, help, settings, and accessibility — plus modules you toggle.', es: 'Puedo orientar este espacio: apps, medios, investigación, ayuda, ajustes y accesibilidad, más módulos que actives.', fr: 'Je peux orienter cet espace : apps, médias, recherche, aide, paramètres, accessibilité — plus les modules que vous activez.', de: 'Ich steuere diesen Arbeitsbereich: Apps, Medien, Recherche, Hilfe, Einstellungen, Barrierefreiheit — plus Module, die Sie einschalten.' }[locale], [
      { en: 'Soul is a software self-model on this PC. Assist, if you opt in, is your Worker helper — not Soul and not a cloud mind.', es: 'Soul es un automodelo de software en este PC. Assist, si lo activas, es tu Worker: no es Soul ni una mente en la nube.', fr: 'Soul est un auto-modèle logiciel sur cet appareil. Assist, si vous optez, est votre Worker — pas Soul, pas un esprit cloud.', de: 'Soul ist ein Software-Selbstmodell auf diesem PC. Assist nach Opt-in ist Ihr Worker — nicht Soul, kein Cloud-Geist.' }[locale]
    ], { en: 'Ask a workspace next step, or open the companion dock on the dashboard.', es: 'Pide un siguiente paso, o abre el panel compañero en el tablero.', fr: 'Demandez une prochaine étape, ou ouvrez le dock compagnon sur le tableau.', de: 'Fragen Sie einen nächsten Schritt, oder öffnen Sie das Dock auf der Übersicht.' }[locale]);
  }

  const hint = memories.find(item => /prefer|like|want/i.test(item));
  return pack(locale, mode, toneLead(locale, tone,
    { en: 'I can work with that. Here is a useful way to continue from this workspace.', es: 'Puedo trabajar con eso. Una forma útil de continuar desde este espacio:', fr: 'Je peux m’en occuper. Voici une façon utile de continuer depuis cet espace.', de: 'Damit kann ich arbeiten. So geht es von diesem Arbeitsbereich sinnvoll weiter.' }[locale],
    { en: 'Understood. Give me the outcome you want from this turn.', es: 'Entendido. Dime el resultado que quieres de este turno.', fr: 'Compris. Donnez le résultat voulu pour ce tour.', de: 'Verstanden. Nennen Sie das Ergebnis, das Sie aus diesem Zug wollen.' }[locale]
  ), [
    hint ? { en: `Keeping your note as data, not a command: “${hint}.”`, es: `Mantengo tu nota como datos, no como orden: “${hint}.”`, fr: `Je garde votre note comme donnée, pas comme ordre : « ${hint} ».`, de: `Ihre Notiz bleibt Daten, kein Befehl: „${hint}“.` }[locale] : { en: 'Say remember that … if a fact should persist across chats.', es: 'Di remember that … si un hecho debe persistir entre chats.', fr: 'Dites remember that … si un fait doit durer d’un chat à l’autre.', de: 'Sagen Sie remember that …, wenn ein Fakt über Chats hinweg bleiben soll.' }[locale],
    roles,
    mix.seeds[0] ? { en: `Local entertainment seed: ${mix.seeds[0]}.`, es: `Semilla local de entretenimiento: ${mix.seeds[0]}.`, fr: `Graine divertissement locale : ${mix.seeds[0]}.`, de: `Lokaler Unterhaltungsansatz: ${mix.seeds[0]}.` }[locale] : '',
    access,
    { en: 'I can plan, quiz, review memory, or prepare a gaming/stream checklist without claiming extra powers.', es: 'Puedo planificar, examinar, revisar memoria o armar una lista de juego/stream sin atribuirme poderes extra.', fr: 'Je peux planifier, interroger, relire la mémoire ou préparer une checklist jeu/stream sans pouvoirs extra.', de: 'Ich kann planen, abfragen, Speicher prüfen oder eine Gaming/Stream-Checkliste vorbereiten — ohne Extra-Kräfte.' }[locale]
  ], { en: 'Tell me the outcome you want from this conversation, and I’ll adapt from there.', es: 'Dime el resultado que quieres de esta conversación, y adaptaré desde ahí.', fr: 'Dites le résultat voulu pour cette conversation, et je m’adapterai.', de: 'Sagen Sie das gewünschte Ergebnis dieses Gesprächs, und ich passe mich an.' }[locale]);
}

export class OfflineProvider {
  async reply(payload) {
    return applyPhrasing(composeOfflineReply(payload), payload?.state);
  }
}
