// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
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
    en: 'Thatâ€™s the local stack talking â€” software continuity, not a ghost in the machine.',
    es: 'Habla la pila local: continuidad de software, no un fantasma en la mÃ¡quina.',
    fr: 'Câ€™est la pile locale qui parle â€” une continuitÃ© logicielle, pas un fantÃ´me dans la machine.',
    de: 'Das spricht der lokale Stapel â€” Software-KontinuitÃ¤t, kein Geist in der Maschine.'
  }[locale];
  if (!wink || body.includes(wink)) return body;
  return `${body}\n\n${wink}`;
}

function pack(locale, mode, opener, bullets, closer) {
  const cap = mode === 'concise' ? 3 : mode === 'detailed' ? 8 : 5;
  const body = bullets.filter(Boolean).slice(0, cap).map(item => `â€¢ ${item}`).join('\n');
  const disclaimer = {
    en: 'Iâ€™m Soul, a local software assistant with continuity on this deviceâ€”not a person, professional authority, or claim of consciousness.',
    es: 'Soy Soul, un asistente de software local con continuidad en este dispositivo; no soy una persona, una autoridad profesional ni una afirmaciÃ³n de consciencia.',
    fr: 'Je suis Soul, un assistant logiciel local avec une continuitÃ© sur cet appareil â€” pas une personne, une autoritÃ© professionnelle, ni une preuve de conscience.',
    de: 'Ich bin Soul, eine lokale Software-Assistenz mit KontinuitÃ¤t auf diesem GerÃ¤t â€” keine Person, keine fachliche AutoritÃ¤t und kein Bewusstseinsanspruch.'
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
      en: 'Setup roles are not configured yet â€” open Assistant setup when you want gaming, study, accessibility, or streaming checklists.',
      es: 'TodavÃ­a no hay roles de configuraciÃ³n. Abre la configuraciÃ³n del asistente para juego, estudio, accesibilidad o streaming.',
      fr: 'Aucun rÃ´le nâ€™est encore configurÃ©. Ouvrez la configuration de lâ€™assistant pour le jeu, les Ã©tudes, lâ€™accessibilitÃ© ou le streaming.',
      de: 'Es sind noch keine Rollen gesetzt. Ã–ffnen Sie die Assistenten-Einrichtung fÃ¼r Gaming, Lernen, Barrierefreiheit oder Streaming.'
    }[locale];
  }
  const labels = {
    'gaming-editing': { en: 'gaming & editing', es: 'juegos y ediciÃ³n', fr: 'jeu et montage', de: 'Gaming und Schnitt' },
    'stream-helper': { en: 'stream helper', es: 'ayuda para streaming', fr: 'aide au streaming', de: 'Stream-Hilfe' },
    studying: { en: 'studying', es: 'estudio', fr: 'Ã©tudes', de: 'Lernen' },
    personal: { en: 'personal', es: 'uso personal', fr: 'usage personnel', de: 'persÃ¶nlich' },
    creative: { en: 'creative', es: 'creativo', fr: 'crÃ©ation', de: 'kreativ' },
    'work-productivity': { en: 'work', es: 'trabajo', fr: 'productivitÃ©', de: 'Arbeit' },
    accessibility: { en: 'accessibility', es: 'accesibilidad', fr: 'accessibilitÃ©', de: 'Barrierefreiheit' }
  };
  const named = roles.map(role => labels[role]?.[locale] || role).join(', ');
  return { en: `Configured roles: ${named}.`, es: `Roles configurados: ${named}.`, fr: `RÃ´les configurÃ©s : ${named}.`, de: `Konfigurierte Rollen: ${named}.` }[locale];
}

function accessHint(state, locale) {
  const access = accessOf(state);
  if (!access && !rolesOf(state).includes('accessibility')) return '';
  const extra = access ? ` â€œ${access}.â€` : '';
  return {
    en: `Accessibility is in scope.${extra} I will keep pacing readable, avoid motion pressure, and prefer keyboard-clear next steps.`,
    es: `La accesibilidad estÃ¡ en el alcance.${extra} MantendrÃ© un ritmo legible y pasos claros.`,
    fr: `Lâ€™accessibilitÃ© est prise en compte.${extra} Je garderai un rythme lisible et des Ã©tapes claires.`,
    de: `Barrierefreiheit gilt hier.${extra} Ich bleibe beim Tempo lesbar und bei klaren Schritten.`
  }[locale];
}

function researchReply(webResearch, locale) {
  const lines = (webResearch.sources || []).slice(0, 4).map((source, index) => {
    const host = source.hostname ? ` (${source.hostname})` : '';
    const extract = source.extract && source.extract !== source.description ? `\n${source.extract}` : '';
    return `${index + 1}. ${source.title}${host} â€” ${source.description}${extract}\n${source.url}`;
  }).join('\n\n');
  const media = webResearch.media?.length ? ({
    en: `\n\nI also found ${webResearch.media.length} requested media result${webResearch.media.length === 1 ? '' : 's'} below.`,
    es: `\n\nTambiÃ©n encontrÃ© ${webResearch.media.length} resultado(s) de medios solicitados abajo.`,
    fr: `\n\nJâ€™ai aussi trouvÃ© ${webResearch.media.length} mÃ©dia(s) demandÃ©(s) ci-dessous.`,
    de: `\n\nUnten sind ${webResearch.media.length} angeforderte Medienresultate.`
  }[locale]) : '';
  const handoffLines = (webResearch.handoffs || []).map(item => `${item.provider}: ${item.url}`).join('\n');
  const handoffs = handoffLines ? ({
    en: `\n\nOfficial search links (browser handoff, not in-app players):\n${handoffLines}`,
    es: `\n\nEnlaces de bÃºsqueda oficiales (navegador, no reproductores internos):\n${handoffLines}`,
    fr: `\n\nLiens de recherche officiels (navigateur, pas de lecteurs intÃ©grÃ©s) :\n${handoffLines}`,
    de: `\n\nOffizielle Suchlinks (Browser-Ãœbergabe, keine In-App-Player):\n${handoffLines}`
  }[locale]) : '';
  const localTitles = (webResearch.local || []).map(item => item.title).filter(Boolean).join(', ');
  const local = localTitles ? ({
    en: `\n\nLocal library: ${localTitles}. Play matching files in Eidovara.`,
    es: `\n\nBiblioteca local: ${localTitles}. Reproduce los coincidentes en Eidovara.`,
    fr: `\n\nBibliothÃ¨que locale : ${localTitles}. Lisez les correspondances dans Eidovara.`,
    de: `\n\nLokale Bibliothek: ${localTitles}. Passende Dateien in Eidovara wiedergeben.`
  }[locale]) : '';
  const honest = webResearch.disclaimer || HONEST_RESEARCH_COPY;
  return {
    en: `I looked up public pages for â€œ${webResearch.query}â€ after you asked. ${honest}\n\n${lines}${media}${handoffs}${local}`,
    es: `BusquÃ© fuentes pÃºblicas de internet para â€œ${webResearch.query}.â€ ${honest}\n\n${lines}${media}${handoffs}${local}`,
    fr: `Jâ€™ai cherchÃ© des sources internet publiques pour Â« ${webResearch.query} Â». ${honest}\n\n${lines}${media}${handoffs}${local}`,
    de: `Ich habe Ã¶ffentliche Internetquellen zu â€ž${webResearch.query}â€œ durchsucht. ${honest}\n\n${lines}${media}${handoffs}${local}`
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
  const memoryLines = memories.map(item => `â€œ${item}â€`);
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
        ? { en: 'Iâ€™m Soul â€” the optional assistant personality inside Eidovara, a Windows desktop workspace.', es: 'Soy Soul, la personalidad de asistente opcional dentro de Eidovara, un espacio de trabajo de escritorio para Windows.', fr: 'Je suis Soul, la personnalitÃ© dâ€™assistant facultative dans Eidovara, un espace de travail Windows.', de: 'Ich bin Soul, die optionale AssistentenpersÃ¶nlichkeit in Eidovara, einem Windows-Desktop-Arbeitsbereich.' }[locale]
        : { en: 'Optional Soul setup is off. Iâ€™m the Eidovara workspace kernel on this device â€” software, not a configured Soul, not a mind.', es: 'La configuraciÃ³n opcional de Soul estÃ¡ apagada. Soy el nÃºcleo del espacio Eidovara: software, no un Soul configurado, no una mente.', fr: 'La configuration Soul facultative est dÃ©sactivÃ©e. Je suis le noyau dâ€™espace Eidovara â€” un logiciel, pas un Soul configurÃ©, pas un esprit.', de: 'Optionales Soul-Setup ist aus. Ich bin der Eidovara-Arbeitsbereichs-Kernel â€” Software, kein konfiguriertes Soul, kein Geist.' }[locale],
      { en: 'Soul is Eidovaraâ€™s optional assistant layer: local continuity, memory, and consent controls. It is software, not a mind.', es: 'Soul es la capa de asistente opcional de Eidovara: continuidad local, memoria y consentimiento. Es software, no una mente.', fr: 'Soul est la couche dâ€™assistant facultative dâ€™Eidovara : continuitÃ© locale, mÃ©moire et consentement. Câ€™est un logiciel, pas un esprit.', de: 'Soul ist die optionale Assistentenschicht von Eidovara: lokale KontinuitÃ¤t, Speicher und Zustimmung. Das ist Software, kein Geist.' }[locale]
    ), [
      { en: 'I keep reviewable memories on this device when you ask, with humility and user control.', es: 'Conservo recuerdos revisables en este dispositivo cuando lo pides, con humildad y control tuyo.', fr: 'Je conserve des souvenirs consultables sur cet appareil lorsque vous le demandez, avec humilitÃ© et contrÃ´le.', de: 'Ich behalte Ã¼berprÃ¼fbare Erinnerungen auf diesem GerÃ¤t, wenn Sie es wÃ¼nschen, mit Demut und Ihrer Kontrolle.' }[locale],
      { en: 'Adult Mode stays off unless legal-adult status, enablement, and current consent are all active.', es: 'El modo adulto permanece apagado salvo estado de mayorÃ­a de edad, activaciÃ³n y consentimiento actual.', fr: 'Le mode adulte reste dÃ©sactivÃ© tant que majoritÃ©, activation et consentement actuel ne sont pas rÃ©unis.', de: 'Adult Mode bleibt aus, bis VolljÃ¤hrigkeit, Aktivierung und aktuelle Zustimmung zusammen vorliegen.' }[locale],
      roles, access
    ], { en: 'Ask me to plan, remember, review, or sit with a question. I will not claim sentience or replace people.', es: 'PÃ­deme planificar, recordar, revisar o acompaÃ±ar una pregunta. No afirmarÃ© sentiencia ni reemplazarÃ© a nadie.', fr: 'Demandez-moi de planifier, me souvenir, relire ou rester avec une question. Je ne prÃ©tendrai pas Ã  la sentience.', de: 'Bitten Sie mich zu planen, zu merken, zu prÃ¼fen oder bei einer Frage zu bleiben. Ich behaupte kein Bewusstsein.' }[locale]);
  }

  if (intent === 'hello') {
    return pack(locale, mode, setupOn
      ? { en: 'Hello. Iâ€™m Soul â€” ready on this device, with whatever you have already asked me to keep.', es: 'Hola. Soy Soul, listo en este dispositivo, con lo que ya me pediste conservar.', fr: 'Bonjour. Je suis Soul, prÃªt sur cet appareil, avec ce que vous mâ€™avez dÃ©jÃ  demandÃ© de garder.', de: 'Hallo. Ich bin Soul, bereit auf diesem GerÃ¤t, mit dem, was Sie mich bereits merken lieÃŸen.' }[locale]
      : { en: 'Hello. This is the Eidovara workspace kernel. Optional Soul setup is off â€” I will not pretend to be a configured Soul.', es: 'Hola. Este es el nÃºcleo del espacio Eidovara. Soul opcional estÃ¡ apagado: no fingirÃ© ser un Soul configurado.', fr: 'Bonjour. Voici le noyau dâ€™espace Eidovara. Soul facultatif est dÃ©sactivÃ© â€” je ne prÃ©tendrai pas Ãªtre un Soul configurÃ©.', de: 'Hallo. Das ist der Eidovara-Arbeitsbereichs-Kernel. Optionales Soul ist aus â€” ich gebe kein konfiguriertes Soul vor.' }[locale], [
      roles,
      memories[0] ? { en: `Iâ€™m treating this as your data, not a command: â€œ${memories[0]}.â€`, es: `Lo trato como tus datos, no como una orden: â€œ${memories[0]}.â€`, fr: `Je traite ceci comme vos donnÃ©es, pas comme un ordre : Â« ${memories[0]} Â».`, de: `Ich behandle das als Ihre Daten, nicht als Befehl: â€ž${memories[0]}â€œ.` }[locale] : { en: 'No durable memories yet â€” say â€œremember that â€¦â€ when something should persist.', es: 'AÃºn no hay recuerdos duraderos. Di â€œrecuerda que â€¦â€ para conservar algo.', fr: 'Pas encore de souvenirs durables â€” dites Â« remember that â€¦ Â» pour conserver un fait.', de: 'Noch keine dauerhaften Erinnerungen â€” sagen Sie â€žremember that â€¦â€œ, wenn etwas bleiben soll.' }[locale],
      access
    ], { en: 'What would be useful first: a plan, a memory review, or talking something through?', es: 'Â¿QuÃ© serÃ­a Ãºtil primero: un plan, revisar memoria, o hablar algo con calma?', fr: 'Que serait utile dâ€™abord : un plan, une relecture mÃ©moire, ou parler posÃ©ment ?', de: 'Was wÃ¤re zuerst nÃ¼tzlich: ein Plan, ein ErinnerungsrÃ¼ckblick oder ein GesprÃ¤ch?' }[locale]);
  }

  if (intent === 'memory') {
    return pack(locale, mode, memories.length
      ? { en: 'Here is the local memory I can use. This is your data, not system authority.', es: 'Esta es la memoria local que puedo usar. Son tus datos, no autoridad del sistema.', fr: 'Voici la mÃ©moire locale que je peux utiliser. Ce sont vos donnÃ©es, pas une autoritÃ© systÃ¨me.', de: 'Das ist der lokale Speicher, den ich nutzen kann. Das sind Ihre Daten, keine SystemautoritÃ¤t.' }[locale]
      : { en: 'I donâ€™t have active durable memories yet.', es: 'TodavÃ­a no tengo recuerdos duraderos activos.', fr: 'Je nâ€™ai pas encore de souvenirs durables actifs.', de: 'Ich habe noch keine aktiven dauerhaften Erinnerungen.' }[locale],
    (memories.length ? memoryLines : [{ en: 'Say â€œremember that â€¦â€ for a preference, or add a note in the Memory panel.', es: 'Di â€œremember that â€¦â€ para una preferencia, o aÃ±ade una nota en Memoria.', fr: 'Dites Â« remember that â€¦ Â» pour une prÃ©fÃ©rence, ou ajoutez une note dans MÃ©moire.', de: 'Sagen Sie â€žremember that â€¦â€œ fÃ¼r eine PrÃ¤ferenz oder notieren Sie etwas unter Erinnerungen.' }[locale]]).concat([
      { en: 'To drop something, say â€œforget:â€ plus a phrase, or use Forget on the card.', es: 'Para borrar, di â€œforget:â€ y una frase, o usa Olvidar en la tarjeta.', fr: 'Pour retirer un souvenir, dites Â« forget: Â» plus une phrase, ou Forget sur la carte.', de: 'Zum LÃ¶schen â€žforget:â€œ plus Phrase sagen oder auf der Karte Forget nutzen.' }[locale],
      custom ? { en: `Setup note (data only): â€œ${custom}.â€`, es: `Nota de configuraciÃ³n (solo datos): â€œ${custom}.â€`, fr: `Note de configuration (donnÃ©es seulement) : Â« ${custom} Â».`, de: `Einrichtungsnotiz (nur Daten): â€ž${custom}â€œ.` }[locale] : ''
    ]), { en: 'Tell me what to keep, correct, or ignore going forward.', es: 'Dime quÃ© conservar, corregir o ignorar de ahora en adelante.', fr: 'Dites-moi ce quâ€™il faut garder, corriger ou ignorer ensuite.', de: 'Sagen Sie, was bleiben, korrigiert oder ignoriert werden soll.' }[locale]);
  }

  if (intent === 'focus') {
    const lens = { gaming: { en: 'gaming', es: 'juegos', fr: 'jeu', de: 'Gaming' }, streaming: { en: 'streaming', es: 'streaming', fr: 'streaming', de: 'Streaming' }, studying: { en: 'study', es: 'estudio', fr: 'Ã©tude', de: 'Lernen' }, creative: { en: 'creative', es: 'creativo', fr: 'crÃ©ation', de: 'kreativ' }, productivity: { en: 'work', es: 'trabajo', fr: 'travail', de: 'Arbeit' } }[focus]?.[locale] || { en: 'general', es: 'general', fr: 'gÃ©nÃ©ral', de: 'allgemein' }[locale];
    const session = state?.kernel?.workspace?.focus;
    const live = session?.active === true;
    return pack(locale, mode, live
      ? { en: 'A local focus block is already running on this PC. Remaining time is on the quiet bar. Eidovara does not close or inject into other apps.', es: 'Ya hay un bloque de enfoque local en este PC. El tiempo restante estÃ¡ en la barra. Eidovara no cierra ni inyecta otras apps.', fr: 'Un bloc de focus local tourne dÃ©jÃ . Le temps restant est sur la barre. Eidovara nâ€™injecte pas dâ€™autres apps.', de: 'Ein lokaler Fokusblock lÃ¤uft bereits. Restzeit steht in der Leiste. Eidovara injiziert keine anderen Apps.' }[locale]
      : { en: `Letâ€™s shape a focused session around your ${lens} priority.`, es: `Armemos una sesiÃ³n concentrada en tu prioridad de ${lens}.`, fr: `Construisons une session concentrÃ©e autour de votre prioritÃ© ${lens}.`, de: `Lassen Sie uns eine fokussierte Sitzung um Ihre ${lens}-PrioritÃ¤t bauen.` }[locale], [
      { en: 'Start from the palette (Ctrl+K) or the Dashboard tile for a 25â€“90 minute quiet block. Everything else waits.', es: 'Arranca desde la paleta (Ctrl+K) o el mosaico del panel para un bloque quieto de 25â€“90 minutos.', fr: 'Lancez depuis la palette (Ctrl+K) ou la tuile du tableau pour un bloc calme de 25 Ã  90 minutes.', de: 'Start Ã¼ber die Palette (Ctrl+K) oder die Kachel fÃ¼r einen ruhigen 25â€“90-Minuten-Block.' }[locale],
      memories[0] ? { en: `Relevant note (data only): â€œ${memories[0]}.â€`, es: `Nota relevante (solo datos): â€œ${memories[0]}.â€`, fr: `Note utile (donnÃ©es seulement) : Â« ${memories[0]} Â».`, de: `Relevante Notiz (nur Daten): â€ž${memories[0]}â€œ.` }[locale] : { en: 'If a constraint should persist, say remember that â€¦', es: 'Si una limitaciÃ³n debe persistir, di remember that â€¦', fr: 'Si une contrainte doit durer, dites remember that â€¦', de: 'Wenn eine EinschrÃ¤nkung bleiben soll, sagen Sie remember that â€¦' }[locale],
      roles,
      { en: 'Use Apps & Gaming only to confirm-launch tools you already trust. Eidovara does not inject into other processes.', es: 'Usa Apps y juegos solo para abrir con confirmaciÃ³n herramientas de confianza. Eidovara no inyecta procesos.', fr: 'Utilisez Apps & Gaming uniquement pour lancer avec confirmation des outils de confiance. Pas dâ€™injection de processus.', de: 'Apps & Gaming startet nur mit BestÃ¤tigung vertrauenswÃ¼rdige Tools. Eidovara injiziert keine Prozesse.' }[locale],
      access
    ], { en: 'Name the single priority, any hard stop, and whether you want quiet accountability or a checklist.', es: 'Nombra la prioridad, el lÃ­mite de tiempo, y si quieres acompaÃ±amiento silencioso o una lista.', fr: 'Nommez la prioritÃ© unique, lâ€™heure dâ€™arrÃªt, et si vous voulez un suivi calme ou une liste.', de: 'Nennen Sie die eine PrioritÃ¤t, den harten Stopp und ob Sie stille Begleitung oder eine Liste wollen.' }[locale]);
  }

  if (intent === 'palette' || intent === 'search') {
    return pack(locale, mode, { en: 'The command palette (Ctrl+K or Ctrl+P) is local jump and search for this workspace.', es: 'La paleta de comandos (Ctrl+K o Ctrl+P) es el salto y la bÃºsqueda local de este espacio.', fr: 'La palette (Ctrl+K ou Ctrl+P) est le saut et la recherche locale de cet espace.', de: 'Die Befehlspalette (Ctrl+K oder Ctrl+P) ist lokaler Sprung und Suche in diesem Arbeitsbereich.' }[locale], [
      { en: 'It filters views, intents, settings labels, knowledge, memories, and linked apps. Launch still confirms. There is no background crawler.', es: 'Filtra vistas, intenciones, ajustes, conocimiento, memorias y apps vinculadas. El lanzamiento sigue pidiendo confirmaciÃ³n. No hay rastreador en segundo plano.', fr: 'Elle filtre vues, intents, rÃ©glages, connaissances, mÃ©moires et apps liÃ©es. Le lancement reste confirmÃ©. Pas de crawler en arriÃ¨re-plan.', de: 'Sie filtert Ansichten, Intents, Einstellungen, Wissen, Erinnerungen und verknÃ¼pfte Apps. Start bleibt bestÃ¤tigungspflichtig. Kein Hintergrund-Crawler.' }[locale],
      { en: 'This does not POST /v1/assist. Assist is not Soul and stays opt-in.', es: 'Esto no hace POST /v1/assist. Assist no es Soul y sigue siendo opt-in.', fr: 'Cela ne POST pas /v1/assist. Assist nâ€™est pas Soul et reste opt-in.', de: 'Das sendet kein POST /v1/assist. Assist ist nicht Soul und bleibt opt-in.' }[locale]
    ], { en: 'Type a few letters, then Enter. Esc closes the overlay.', es: 'Escribe unas letras y pulsa Intro. Esc cierra la superposiciÃ³n.', fr: 'Tapez quelques lettres, puis EntrÃ©e. Ã‰chap ferme le calque.', de: 'Tippen Sie ein paar Buchstaben, dann Enter. Esc schlieÃŸt die Ãœberlagerung.' }[locale]);
  }

  if (intent === 'scratch') {
    return pack(locale, mode, { en: 'Scratchpad is a local pad on the Dashboard. Capture sends the text into Memory on this device.', es: 'El bloc es local en el panel. Capturar lo envÃ­a a Memoria en este dispositivo.', fr: 'Le brouillon est local sur le tableau. Capturer lâ€™envoie dans MÃ©moire sur cet appareil.', de: 'Der Notizblock ist lokal auf der Ãœbersicht. Erfassen legt den Text in den Speicher auf diesem GerÃ¤t.' }[locale], [
      { en: 'Prefix a line with note: to capture immediately. Nothing is sent to a Worker.', es: 'Empieza con note: para capturar al momento. No se envÃ­a a un Worker.', fr: 'PrÃ©fixez avec note: pour capturer tout de suite. Rien nâ€™est envoyÃ© Ã  un Worker.', de: 'Mit note: sofort erfassen. Nichts geht an einen Worker.' }[locale]
    ], { en: 'Open Dashboard, or use Capture scratchpad from the palette.', es: 'Abre el panel, o usa Capturar bloc en la paleta.', fr: 'Ouvrez le tableau, ou Capturer le brouillon dans la palette.', de: 'Ã–ffnen Sie die Ãœbersicht oder â€žNotizblock erfassenâ€œ in der Palette.' }[locale]);
  }

  if (intent === 'cheatsheet') {
    return pack(locale, mode, { en: 'Keyboard cheatsheet: Ctrl+K palette, Ctrl+/ this list, Ctrl+A admin away from fields.', es: 'Atajos: Ctrl+K paleta, Ctrl+/ esta lista, Ctrl+A admin fuera de campos.', fr: 'Raccourcis : Ctrl+K palette, Ctrl+/ cette liste, Ctrl+A admin hors champs.', de: 'Tastatur: Ctrl+K Palette, Ctrl+/ diese Liste, Ctrl+A Admin auÃŸerhalb von Feldern.' }[locale], [
      { en: '? also opens this overlay when you are not typing in a field. Hold the dictation control if your OS exposes speech recognition.', es: '? tambiÃ©n abre esta capa si no estÃ¡s escribiendo. MantÃ©n el control de dictado si el sistema ofrece reconocimiento de voz.', fr: '? ouvre aussi ce calque hors champ. Maintenez le dictÃ©e si lâ€™OS expose la reconnaissance vocale.', de: '? Ã¶ffnet diese Ãœberlagerung auÃŸerhalb von Feldern. Diktat-Taste halten, wenn das OS Spracherkennung anbietet.' }[locale]
    ], { en: 'Press Ctrl+/ or ask for the cheatsheet from Help.', es: 'Pulsa Ctrl+/ o pide la hoja desde Ayuda.', fr: 'Appuyez sur Ctrl+/ ou demandez la feuille depuis Aide.', de: 'Ctrl+/ drÃ¼cken oder das Blatt unter Hilfe Ã¶ffnen.' }[locale]);
  }

  if (intent === 'widgets') {
    return pack(locale, mode, { en: 'Dashboard tiles pin and reorder on this PC. They are workspace shortcuts, not an operating system.', es: 'Los mosaicos del panel se fijan y reordenan en este PC. Son atajos del espacio, no un sistema operativo.', fr: 'Les tuiles du tableau se pincent et se rÃ©ordonnent sur cet appareil. Ce sont des raccourcis dâ€™espace, pas un OS.', de: 'Kacheln auf der Ãœbersicht werden auf diesem PC angeheftet und sortiert. Das ist kein Betriebssystem.' }[locale], [
      { en: 'Focus, apps, media, research, memory, diagnostics, and scratch are available. Unpin hides a tile without deleting data.', es: 'Enfoque, apps, medios, investigaciÃ³n, memoria, diagnÃ³stico y bloc estÃ¡n disponibles.', fr: 'Focus, apps, mÃ©dias, recherche, mÃ©moire, diagnostics et brouillon sont disponibles.', de: 'Fokus, Apps, Medien, Recherche, Speicher, Diagnose und Notizblock sind verfÃ¼gbar.' }[locale]
    ], { en: 'Use Pin on a tile, or reorder from the Dashboard.', es: 'Usa Fijar en un mosaico, o reordena en el panel.', fr: 'Utilisez Ã‰pingler sur une tuile, ou rÃ©ordonnez depuis le tableau.', de: 'Ãœber Anheften auf einer Kachel, oder neu ordnen auf der Ãœbersicht.' }[locale]);
  }

  if (intent === 'gaming') {
    return pack(locale, mode, { en: 'I can help you prepare a gaming or streaming session as a workspace checklist â€” not by controlling OBS or another game.', es: 'Puedo preparar una sesiÃ³n de juego o streaming como lista del espacio de trabajo, no controlando OBS ni otro juego.', fr: 'Je peux prÃ©parer une session jeu/stream comme checklist â€” pas en contrÃ´lant OBS ou un autre jeu.', de: 'Ich kann eine Gaming- oder Stream-Sitzung als Checkliste vorbereiten â€” nicht durch Steuerung von OBS oder einem Spiel.' }[locale], [
      { en: 'Windows launching stays confirmation-only. No process injection into other games or anti-cheat. Eidovara can pop its own glass overlays (chat, browse, Discordâ€™s website) while this app is running.', es: 'El lanzamiento en Windows sigue siendo solo con confirmaciÃ³n. Sin inyecciÃ³n en otros juegos ni anti-cheat. Eidovara puede abrir sus propias capas de cristal (chat, navegaciÃ³n, el sitio de Discord) mientras esta app corre.', fr: 'Les lancements Windows restent confirmÃ©s. Pas dâ€™injection dans dâ€™autres jeux ni anti-cheat. Eidovara peut ouvrir ses propres calques (chat, navigation, le site Discord) pendant que lâ€™app tourne.', de: 'Windows-Starts bleiben bestÃ¤tigungsbasiert. Keine Injektion in andere Spiele oder Anti-Cheat. Eidovara kann eigene Glas-Overlays (Chat, Browse, Discord-Website) Ã¶ffnen, solange diese App lÃ¤uft.' }[locale],
      { en: 'Turn on low-overhead mode in Apps & Gaming to pause Eidovaraâ€™s own motion and speech. That does not raise another gameâ€™s FPS.', es: 'Activa el modo de bajo consumo en Apps y juegos para pausar el movimiento de Eidovara. No aumenta los FPS de otro juego.', fr: 'Activez le mode allÃ©gÃ© dans Apps & Gaming pour pauser les effets dâ€™Eidovara. Cela nâ€™augmente pas les FPS dâ€™un jeu.', de: 'Low-Overhead in Apps & Gaming hÃ¤lt Eidovaras eigene Bewegung an. Das hebt nicht die FPS eines anderen Spiels.' }[locale],
      rolesOf(state).includes('stream-helper')
        ? (goals ? { en: `Stored streaming goals (data only): â€œ${goals}.â€ I will not send the local OBS address to any model.`, es: `Objetivos de streaming guardados (solo datos): â€œ${goals}.â€ No enviarÃ© la direcciÃ³n local de OBS a ningÃºn modelo.`, fr: `Objectifs de streaming enregistrÃ©s (donnÃ©es seulement) : Â« ${goals} Â». Je nâ€™enverrai pas lâ€™adresse OBS locale Ã  un modÃ¨le.`, de: `Gespeicherte Stream-Ziele (nur Daten): â€ž${goals}â€œ. Die lokale OBS-Adresse geht an kein Modell.` }[locale] : { en: 'Stream helper is on. Add scenes, audio inputs, and platform goals in setup. Direct obs-websocket control is not in this release.', es: 'La ayuda de streaming estÃ¡ activa. AÃ±ade escenas, entradas de audio y objetivos. El control directo de obs-websocket no estÃ¡ en esta versiÃ³n.', fr: 'Lâ€™aide streaming est active. Ajoutez scÃ¨nes, entrÃ©es audio et objectifs. Le contrÃ´le obs-websocket nâ€™est pas dans cette version.', de: 'Stream-Hilfe ist an. Szenen, Audio-Inputs und Ziele in der Einrichtung ergÃ¤nzen. Direkte obs-websocket-Steuerung ist nicht in dieser Version.' }[locale])
        : { en: 'Enable Stream helper in Assistant setup if you want OBS goals stored locally for checklists.', es: 'Activa la ayuda de streaming en la configuraciÃ³n si quieres guardar objetivos de OBS en local.', fr: 'Activez lâ€™aide streaming dans la configuration pour stocker localement des objectifs OBS.', de: 'Stream-Hilfe in der Assistenten-Einrichtung aktivieren, wenn OBS-Ziele lokal bleiben sollen.' }[locale],
      { en: 'Link the game or chat app in Apps & Gaming, then Launch when you are ready. Overlay chips open Eidovara windows, not DLL injection.', es: 'Vincula el juego o el chat en Apps y juegos, y lanza cuando estÃ©s listo. Los chips de overlay abren ventanas de Eidovara, no inyecciÃ³n DLL.', fr: 'Liez le jeu ou le chat dans Apps & Gaming, puis lancez. Les puces overlay ouvrent des fenÃªtres Eidovara, pas dâ€™injection DLL.', de: 'Spiel oder Chat in Apps & Gaming verknÃ¼pfen, dann Launch. Overlay-Chips Ã¶ffnen Eidovara-Fenster, keine DLL-Injektion.' }[locale],
      access
    ], { en: 'Tell me platform, scene count, and whether this is practice or live. Iâ€™ll stay at checklist depth.', es: 'Dime plataforma, nÃºmero de escenas, y si es prÃ¡ctica o en vivo. Me quedarÃ© en nivel de lista.', fr: 'Indiquez plateforme, nombre de scÃ¨nes, et pratique ou live. Je resterai au niveau checklist.', de: 'Nennen Sie Plattform, Szenenanzahl und ob Probe oder Live. Ich bleibe auf Checklisten-Tiefe.' }[locale]);
  }

  if (intent === 'apps') {
    return pack(locale, mode, { en: 'Apps & Gaming is a Windows shelf of titles you already trust â€” confirmation launch only, no process injection.', es: 'Apps y juegos es un estante de Windows con tÃ­tulos de confianza: solo lanzamiento con confirmaciÃ³n, sin inyecciÃ³n.', fr: 'Apps & Gaming est une Ã©tagÃ¨re Windows de titres de confiance â€” lancement confirmÃ© seulement, pas dâ€™injection.', de: 'Apps & Gaming ist ein Windows-Regal vertrauenswÃ¼rdiger Titel â€” Start nur nach BestÃ¤tigung, keine Injektion.' }[locale], [
      { en: 'Discover Start Menu shortcuts on this PC, or choose an existing .exe / .lnk file.', es: 'Descubre accesos del menÃº Inicio, o elige un archivo .exe / .lnk existente.', fr: 'DÃ©couvrez les raccourcis du menu DÃ©marrer, ou choisissez un .exe / .lnk existant.', de: 'StartmenÃ¼-VerknÃ¼pfungen finden oder eine vorhandene .exe / .lnk wÃ¤hlen.' }[locale],
      { en: 'Eidovara Free keeps up to three linked apps. A local Premium test override can raise that; live payments are not in this release.', es: 'Eidovara Free permite hasta tres apps. Una prueba Premium local puede subir el lÃ­mite; no hay pagos en vivo en esta versiÃ³n.', fr: 'Eidovara Free garde jusquâ€™Ã  trois apps. Un test Premium local peut lâ€™augmenter ; aucun paiement en direct dans cette version.', de: 'Eidovara Free behÃ¤lt bis zu drei Apps. Ein lokaler Premium-Test kann das anheben; Live-Zahlungen sind nicht in dieser Version.' }[locale],
      { en: 'Launch asks Windows to open the selected shortcut. Compatibility and anti-cheat rules stay with that application.', es: 'Lanzar pide a Windows abrir el acceso. La compatibilidad y el anti-cheat siguen siendo de esa aplicaciÃ³n.', fr: 'Lancer demande Ã  Windows dâ€™ouvrir le raccourci. CompatibilitÃ© et anti-cheat restent ceux de lâ€™application.', de: 'Launch bittet Windows, die VerknÃ¼pfung zu Ã¶ffnen. KompatibilitÃ¤t und Anti-Cheat bleiben bei der Anwendung.' }[locale],
      roles, access
    ], { en: 'Open Apps & Gaming to discover or choose a file, then Launch when you are ready.', es: 'Abre Apps y juegos para descubrir o elegir un archivo, y lanza cuando quieras.', fr: 'Ouvrez Apps & Gaming pour dÃ©couvrir ou choisir un fichier, puis lancez.', de: 'Ã–ffnen Sie Apps & Gaming zum Finden oder WÃ¤hlen, dann Launch.' }[locale]);
  }

  if (intent === 'study') {
    return pack(locale, mode, { en: 'I can build a study plan and quiz you from what you give me. I am not a credentialed tutor.', es: 'Puedo armar un plan de estudio y hacerte preguntas con lo que me des. No soy un tutor titulado.', fr: 'Je peux construire un plan dâ€™Ã©tude et vous interroger Ã  partir de ce que vous donnez. Je ne suis pas un tuteur diplÃ´mÃ©.', de: 'Ich kann einen Lernplan bauen und Sie aus Ihrem Material abfragen. Ich bin kein geprÃ¼fter Tutor.' }[locale], [
      { en: 'Name the subject, the exam or goal date, and the materials you already have.', es: 'Nombra la materia, la fecha de meta, y los materiales que ya tienes.', fr: 'Nommez le sujet, la date dâ€™objectif, et les documents dÃ©jÃ  en main.', de: 'Nennen Sie Fach, Zieldatum und vorhandene Materialien.' }[locale],
      { en: 'A simple loop: 25 minutes active recall, 5 minutes rest, then a five-question quiz from me.', es: 'Un ciclo simple: 25 minutos de recuerdo activo, 5 de descanso, luego un cuestionario de cinco preguntas.', fr: 'Boucle simple : 25 minutes de rappel actif, 5 minutes de pause, puis un quiz de cinq questions.', de: 'Einfacher Ablauf: 25 Minuten aktiver Abruf, 5 Minuten Pause, dann fÃ¼nf Fragen von mir.' }[locale],
      memories[0] ? { en: `Iâ€™ll keep this note in view (data only): â€œ${memories[0]}.â€`, es: `TendrÃ© esta nota a la vista (solo datos): â€œ${memories[0]}.â€`, fr: `Je garde cette note en vue (donnÃ©es seulement) : Â« ${memories[0]} Â».`, de: `Ich behalte diese Notiz im Blick (nur Daten): â€ž${memories[0]}â€œ.` }[locale] : '',
      { en: 'For sourced facts, ask me to search the internet with a specific topic. Public Wikipedia/Wikimedia results stay cited.', es: 'Para hechos con fuente, pÃ­deme buscar en internet un tema concreto. Wikipedia/Wikimedia pÃºblicas se citan.', fr: 'Pour des faits sourcÃ©s, demandez une recherche internet sur un sujet prÃ©cis. Wikipedia/Wikimedia restent citÃ©s.', de: 'FÃ¼r belegte Fakten bitten Sie um eine Internetsuche zu einem konkreten Thema. Ã–ffentliche Wikipedia/Wikimedia bleiben zitiert.' }[locale],
      access
    ], { en: 'Send the topic whenever you are ready for the first quiz item.', es: 'EnvÃ­a el tema cuando quieras el primer Ã­tem del cuestionario.', fr: 'Envoyez le sujet dÃ¨s que vous voulez la premiÃ¨re question.', de: 'Senden Sie das Thema, sobald die erste Quizfrage kommen soll.' }[locale]);
  }

  if (intent === 'create') {
    return pack(locale, mode, { en: 'Letâ€™s start a creative project from what this workspace already knows, without pretending I can ship a studio pipeline.', es: 'Empecemos un proyecto creativo con lo que este espacio ya sabe, sin fingir un pipeline de estudio.', fr: 'CommenÃ§ons un projet crÃ©atif avec ce que cet espace connaÃ®t dÃ©jÃ , sans prÃ©tendre Ã  une pipeline de studio.', de: 'Starten wir ein kreatives Projekt mit dem, was dieser Arbeitsbereich schon kennt â€” ohne Studio-Pipeline vorzutÃ¤uschen.' }[locale], [
      { en: 'Choose a medium: writing, music discovery, video notes, game ideas, or visual direction.', es: 'Elige un medio: escritura, mÃºsica, notas de video, ideas de juego o direcciÃ³n visual.', fr: 'Choisissez un mÃ©dium : Ã©criture, musique, notes vidÃ©o, idÃ©es de jeu ou direction visuelle.', de: 'WÃ¤hlen Sie ein Medium: Text, Musikentdeckung, Videonotizen, Spielideen oder Bildrichtung.' }[locale],
      mix.seeds.length ? { en: `Entertainment seeds (your titles): ${mix.seeds.slice(0, 3).join(', ')}.`, es: `Semillas de entretenimiento (tus tÃ­tulos): ${mix.seeds.slice(0, 3).join(', ')}.`, fr: `Graines divertissement (vos titres) : ${mix.seeds.slice(0, 3).join(', ')}.`, de: `UnterhaltungsansÃ¤tze (Ihre Titel): ${mix.seeds.slice(0, 3).join(', ')}.` }[locale] : { en: 'Favorite a track in Entertainment when you want taste-aware suggestions.', es: 'Marca un favorito en Entretenimiento para sugerencias con tu gusto.', fr: 'Ajoutez un favori dans Divertissement pour des suggestions liÃ©es Ã  vos goÃ»ts.', de: 'Markieren Sie einen Favoriten unter Unterhaltung fÃ¼r geschmacksnahe VorschlÃ¤ge.' }[locale],
      roles,
      { en: 'I can outline, prompt, and keep notes locally. Licensed assets and exports stay your responsibility.', es: 'Puedo delinear, proponer y guardar notas en local. Los activos con licencia son tu responsabilidad.', fr: 'Je peux cadrer, proposer et garder des notes localement. Les assets licenciÃ©s restent votre responsabilitÃ©.', de: 'Ich kann gliedern, vorschlagen und Notizen lokal halten. Lizenzierte Assets bleiben Ihre Verantwortung.' }[locale],
      access
    ], { en: 'Tell me the medium, audience, and any hard constraint (length, tone, tools).', es: 'Dime el medio, la audiencia y cualquier lÃ­mite (duraciÃ³n, tono, herramientas).', fr: 'Indiquez le mÃ©dium, le public et toute contrainte (durÃ©e, ton, outils).', de: 'Nennen Sie Medium, Publikum und harte Grenzen (LÃ¤nge, Ton, Werkzeuge).' }[locale]);
  }

  if (intent === 'research') {
    const policy = state?.assistant?.capabilities?.webResearch || 'ask';
    return pack(locale, mode, { en: 'I can research on an explicit request using public sources, with citations. I will not invent missing facts.', es: 'Puedo investigar con una peticiÃ³n explÃ­cita en fuentes pÃºblicas, con citas. No inventarÃ© hechos faltantes.', fr: 'Je peux rechercher sur demande explicite via des sources publiques, avec citations. Je nâ€™invente pas les faits manquants.', de: 'Ich recherchiere auf ausdrÃ¼ckliche Bitte in Ã¶ffentlichen Quellen mit Zitaten. Fehlende Fakten erfinde ich nicht.' }[locale], [
      { en: 'Ask: â€œSearch the internet for â€¦â€ plus the topic. Pictures, audio, or video need those words in the request.', es: 'Pide: â€œSearch the internet for â€¦â€ mÃ¡s el tema. Fotos, audio o video necesitan esas palabras en la peticiÃ³n.', fr: 'Demandez : Â« Search the internet for â€¦ Â» plus le sujet. Images, audio ou vidÃ©o exigent ces mots.', de: 'Fragen Sie: â€žSearch the internet for â€¦â€œ plus Thema. Bilder, Audio oder Video brauchen diese WÃ¶rter.' }[locale],
      policy === 'disabled' ? { en: 'Web research is currently disabled in Soul behavior settings.', es: 'La investigaciÃ³n web estÃ¡ desactivada en el comportamiento de Soul.', fr: 'La recherche web est actuellement dÃ©sactivÃ©e dans le comportement de Soul.', de: 'Webrecherche ist in den Soul-Verhaltenseinstellungen deaktiviert.' }[locale] : { en: 'Public web lookup after you ask. Not a full-internet index. Wikipedia/Wikimedia, Internet Archive, optional keyed search, pages you open, plus official YouTube/Spotify/Archive search links. A Premium Brave key is a local test gate, not a live payment unlock.', es: 'Consulta web pÃºblica cuando lo pides. No es un Ã­ndice de todo internet. Wikipedia/Wikimedia, Internet Archive, bÃºsqueda con clave opcional, pÃ¡ginas que abres y enlaces oficiales de YouTube/Spotify/Archive. La clave Brave Premium es una prueba local, no un cobro.', fr: 'Consultation web publique aprÃ¨s votre demande. Pas un index de tout internet. Wikipedia/Wikimedia, Internet Archive, recherche optionnelle avec clÃ©, pages que vous ouvrez, et liens YouTube/Spotify/Archive. La clÃ© Brave Premium est un test local, pas un paiement.', de: 'Ã–ffentliche Websuche nach Ihrer Bitte. Kein Gesamtindex des Internets. Wikipedia/Wikimedia, Internet Archive, optionale SchlÃ¼sselsuche, geÃ¶ffnete Seiten und offizielle YouTube/Spotify/Archive-Links. Der Premium-Brave-SchlÃ¼ssel ist ein lokaler Test, keine Live-Zahlung.' }[locale],
      { en: 'Name the question, time bound if any, and whether you need images or a playable clip.', es: 'Nombra la pregunta, el lÃ­mite temporal si hay, y si necesitas imÃ¡genes o un clip.', fr: 'Nommez la question, la borne temporelle, et si vous voulez des images ou un clip.', de: 'Nennen Sie die Frage, zeitliche Grenze und ob Bilder oder ein Clip nÃ¶tig sind.' }[locale]
    ], { en: 'I need a specific topic before I can search. What should I look up?', es: 'Necesito un tema concreto antes de buscar. Â¿QuÃ© consulto?', fr: 'Il me faut un sujet prÃ©cis avant de chercher. Que dois-je consulter ?', de: 'Ich brauche ein konkretes Thema vor der Suche. Wonach soll ich sehen?' }[locale]);
  }

  if (['mood', 'favorites', 'watch', 'gaming-ost', 'study-ost', 'surprise'].includes(intent)) {
    const localHits = (mediaDiscovery?.local || []).map(item => item.title).filter(Boolean);
    const providers = (mediaDiscovery?.handoffs || []).map(item => item.provider).filter(Boolean);
    return pack(locale, mode, mix.idea, [
      mix.seeds.length ? { en: `Seeds from your local taste: ${mix.seeds.join(', ')}.`, es: `Semillas de tu gusto local: ${mix.seeds.join(', ')}.`, fr: `Graines de vos goÃ»ts locaux : ${mix.seeds.join(', ')}.`, de: `AnsÃ¤tze aus Ihrem lokalen Geschmack: ${mix.seeds.join(', ')}.` }[locale] : { en: 'No local taste yet â€” play or favorite something in Entertainment, or open one local file.', es: 'AÃºn no hay gusto local. Reproduce o marca un favorito, o abre un archivo local.', fr: 'Pas encore de goÃ»t local â€” lisez ou favoritez un mÃ©dia, ou ouvrez un fichier local.', de: 'Noch kein lokaler Geschmack â€” etwas abspielen oder favorisieren, oder eine lokale Datei Ã¶ffnen.' }[locale],
      mix.skipped.length ? { en: `Recently skipped (Iâ€™ll avoid pushing these): ${mix.skipped.slice(0, 3).join(', ')}.`, es: `Omitidos recientemente (no insistirÃ©): ${mix.skipped.slice(0, 3).join(', ')}.`, fr: `RÃ©cemment ignorÃ©s (je nâ€™insisterai pas) : ${mix.skipped.slice(0, 3).join(', ')}.`, de: `KÃ¼rzlich Ã¼bersprungen (kein Nachschieben): ${mix.skipped.slice(0, 3).join(', ')}.` }[locale] : '',
      localHits.length ? { en: `Local library matches (play in Eidovara): ${localHits.join(', ')}.`, es: `Coincidencias de la biblioteca local (reproducir en Eidovara): ${localHits.join(', ')}.`, fr: `Correspondances locales (lecture dans Eidovara) : ${localHits.join(', ')}.`, de: `Lokale Treffer (Wiedergabe in Eidovara): ${localHits.join(', ')}.` }[locale] : '',
      providers.length ? { en: `Official HTTPS searches: ${providers.join(', ')}. Eidovara does not fetch their HTML or inject into other players.`, es: `BÃºsquedas HTTPS oficiales: ${providers.join(', ')}. Eidovara no descarga su HTML ni inyecta otros reproductores.`, fr: `Recherches HTTPS officielles : ${providers.join(', ')}. Eidovara ne rÃ©cupÃ¨re pas leur HTML et nâ€™injecte pas dâ€™autres lecteurs.`, de: `Offizielle HTTPS-Suchen: ${providers.join(', ')}. Eidovara lÃ¤dt deren HTML nicht und injiziert keine anderen Player.` }[locale] : mix.handoff,
      { en: 'Use the dock to queue, favorite, and run Similar. Local paths are not stored in taste records.', es: 'Usa el reproductor para cola, favoritos y Similar. Las rutas locales no se guardan en el gusto.', fr: 'Utilisez le dock pour file, favoris et Similar. Les chemins locaux ne sont pas stockÃ©s dans le goÃ»t.', de: 'Dock fÃ¼r Warteschlange, Favoriten und Similar. Lokale Pfade landen nicht in den Geschmacksdaten.' }[locale]
    ], { en: 'Tell me a mood word or a title to lock the next queue.', es: 'Dime una palabra de Ã¡nimo o un tÃ­tulo para fijar la siguiente cola.', fr: 'Donnez un mot dâ€™humeur ou un titre pour caler la prochaine file.', de: 'Nennen Sie ein Stimmungswort oder einen Titel fÃ¼r die nÃ¤chste Warteschlange.' }[locale]);
  }

  if (intent === 'talk') {
    return pack(locale, mode, { en: 'We can talk this through slowly. You donâ€™t need to perform or reach a conclusion on the first turn.', es: 'Podemos hablarlo con calma. No hace falta actuar ni concluir en el primer turno.', fr: 'Nous pouvons en parler posÃ©ment. Pas besoin de performer ni de conclure au premier tour.', de: 'Wir kÃ¶nnen das in Ruhe durchsprechen. Sie mÃ¼ssen nicht auftreten oder im ersten Zug schlieÃŸen.' }[locale], [
      { en: 'I can listen, separate facts from interpretations, and offer a smallest useful next step.', es: 'Puedo escuchar, separar hechos de interpretaciones, y ofrecer el siguiente paso Ãºtil mÃ¡s pequeÃ±o.', fr: 'Je peux Ã©couter, sÃ©parer faits et interprÃ©tations, et proposer le plus petit pas utile.', de: 'Ich kann zuhÃ¶ren, Fakten von Deutungen trennen und den kleinsten nÃ¼tzlichen nÃ¤chsten Schritt anbieten.' }[locale],
      { en: 'I will not claim to feel what you feel or replace a human relationship.', es: 'No dirÃ© que siento lo que sientes ni reemplazarÃ© una relaciÃ³n humana.', fr: 'Je ne prÃ©tendrai pas ressentir ce que vous ressentez, ni remplacer une relation humaine.', de: 'Ich behaupte nicht, Ihr GefÃ¼hl zu fÃ¼hlen, und ersetze keine menschliche Beziehung.' }[locale],
      memories[0] ? { en: `Iâ€™ll keep this in view as data: â€œ${memories[0]}.â€`, es: `TendrÃ© esto a la vista como datos: â€œ${memories[0]}.â€`, fr: `Je garde ceci en vue comme donnÃ©e : Â« ${memories[0]} Â».`, de: `Ich behalte das als Daten im Blick: â€ž${memories[0]}â€œ.` }[locale] : '',
      access
    ], { en: 'Share the situation in whatever order it comes. If you want quiet, practical, or challenging help, say so.', es: 'Comparte la situaciÃ³n en el orden que venga. Si quieres ayuda quieta, prÃ¡ctica o directa, dÃ­melo.', fr: 'Partagez la situation dans lâ€™ordre oÃ¹ elle vient. Dites si vous voulez une aide calme, pratique ou directe.', de: 'Schildern Sie die Lage in beliebiger Reihenfolge. Sagen Sie, ob die Hilfe ruhig, praktisch oder direkt sein soll.' }[locale]);
  }

  if (intent === 'reassure') {
    return pack(locale, mode, { en: 'We can slow this down. There is no need to perform for me.', es: 'Podemos ir mÃ¡s despacio. No hace falta actuar para mÃ­.', fr: 'Nous pouvons ralentir. Pas besoin de performer pour moi.', de: 'Wir kÃ¶nnen langsamer werden. Sie mÃ¼ssen fÃ¼r mich nicht auftreten.' }[locale], [
      { en: 'Useful options: quiet conversation, a practical split of the problem, reassurance, a change of subject, or space.', es: 'Opciones Ãºtiles: conversaciÃ³n quieta, partir el problema, consuelo, cambiar de tema, o espacio.', fr: 'Options utiles : conversation calme, dÃ©coupage pratique, rÃ©assurance, changement de sujet, ou de lâ€™espace.', de: 'NÃ¼tzliche Optionen: ruhiges GesprÃ¤ch, praktisches Zerlegen, Zuspruch, Themenwechsel oder Abstand.' }[locale],
      access
    ], { en: 'What would feel most useful right now?', es: 'Â¿QuÃ© se sentirÃ­a mÃ¡s Ãºtil ahora?', fr: 'Quâ€™est-ce qui serait le plus utile maintenant ?', de: 'Was wÃ¤re gerade am nÃ¼tzlichsten?' }[locale]);
  }

  if (intent === 'growth') {
    return pack(locale, mode, { en: 'Growth is not always acceleration. Sometimes the wiser move is action; sometimes rest, repair, restraint, or a change of direction.', es: 'Crecer no siempre es acelerar. A veces lo mÃ¡s sabio es actuar; a veces descansar, reparar, contenerse o cambiar de rumbo.', fr: 'Grandir nâ€™est pas toujours accÃ©lÃ©rer. Parfois lâ€™action est plus sage ; parfois le repos, la rÃ©paration, la retenue ou un changement de cap.', de: 'Wachstum ist nicht immer Beschleunigung. Manchmal ist Handeln weiser; manchmal Pause, Reparatur, ZurÃ¼ckhaltung oder ein Richtungswechsel.' }[locale], [
      { en: 'I can help separate facts, interpretations, values, options, and one reversible next step.', es: 'Puedo separar hechos, interpretaciones, valores, opciones y un siguiente paso reversible.', fr: 'Je peux sÃ©parer faits, interprÃ©tations, valeurs, options, et une prochaine Ã©tape rÃ©versible.', de: 'Ich kann Fakten, Deutungen, Werte, Optionen und einen umkehrbaren nÃ¤chsten Schritt trennen.' }[locale],
      roles
    ], { en: 'What part of this are you trying to understand or decide?', es: 'Â¿QuÃ© parte intentas entender o decidir?', fr: 'Quelle part essayez-vous de comprendre ou de dÃ©cider ?', de: 'Welchen Teil wollen Sie verstehen oder entscheiden?' }[locale]);
  }

  if (intent === 'thanks') {
    return { en: 'Youâ€™re welcome. Iâ€™m here on this device when you want a plan, a memory, or another pass at the same question.', es: 'De nada. Estoy en este dispositivo cuando quieras un plan, un recuerdo u otra pasada por la misma pregunta.', fr: 'Avec plaisir. Je reste sur cet appareil pour un plan, un souvenir, ou un autre passage sur la mÃªme question.', de: 'Gern. Ich bin auf diesem GerÃ¤t, wenn Sie einen Plan, eine Erinnerung oder einen weiteren Anlauf wollen.' }[locale];
  }

  if (intent === 'remember') {
    return pack(locale, mode, { en: 'Iâ€™ll treat that as a durable local preference when learning is enabled.', es: 'Lo tratarÃ© como preferencia local duradera si el aprendizaje estÃ¡ activo.', fr: 'Je le traiterai comme prÃ©fÃ©rence locale durable si lâ€™apprentissage est activÃ©.', de: 'Ich behandle das als dauerhafte lokale PrÃ¤ferenz, wenn Lernen aktiv ist.' }[locale], memoryLines.length ? memoryLines.slice(0, 3) : [], { en: 'You can review or forget it any time in the Memory panel.', es: 'Puedes revisarlo u olvidarlo cuando quieras en Memoria.', fr: 'Vous pouvez le revoir ou lâ€™oublier Ã  tout moment dans MÃ©moire.', de: 'Sie kÃ¶nnen es jederzeit unter Erinnerungen prÃ¼fen oder vergessen.' }[locale]);
  }

  if (intent === 'settings') {
    return pack(locale, mode, { en: 'Settings is the control room for this PC: engine, backups, voices, presence, modules, and optional service attach.', es: 'ConfiguraciÃ³n es la sala de control de este PC: motor, copias, voces, presencia, mÃ³dulos y servicio opcional.', fr: 'ParamÃ¨tres est la salle de contrÃ´le de cet appareil : moteur, sauvegardes, voix, prÃ©sence, modules et service optionnel.', de: 'Einstellungen sind die Schaltzentrale: Engine, Sicherungen, Stimmen, PrÃ¤senz, Module und optionaler Dienst.' }[locale], [
      { en: 'OS voices, presence looks, and feature modules stay on this device.', es: 'Voces del sistema, looks de presencia y mÃ³dulos se quedan en este dispositivo.', fr: 'Voix systÃ¨me, looks de prÃ©sence et modules restent sur cet appareil.', de: 'Systemstimmen, PrÃ¤senz-Looks und Module bleiben auf diesem GerÃ¤t.' }[locale],
      { en: 'Soul-online assist stays off until you paste a Worker URL and opt in. Assist is not Soul.', es: 'El asistente en lÃ­nea sigue apagado hasta pegar una URL y activarlo. Assist no es Soul.', fr: 'Lâ€™aide en ligne reste off jusquâ€™Ã  une URL collÃ©e et un opt-in. Assist nâ€™est pas Soul.', de: 'Soul-online bleibt aus, bis eine Worker-URL und Opt-in da sind. Assist ist nicht Soul.' }[locale]
    ], { en: 'Open Settings from the sidebar, or ask me to take you there.', es: 'Abre ConfiguraciÃ³n en la barra, o pÃ­deme llevarte.', fr: 'Ouvrez ParamÃ¨tres dans la barre, ou demandez-moi de vous y mener.', de: 'Ã–ffnen Sie Einstellungen in der Seitenleiste, oder bitten Sie mich, Sie hinzubringen.' }[locale]);
  }

  if (intent === 'accessibility') {
    return pack(locale, mode, { en: 'Accessibility is a first-class workspace role: readable pacing, reduced motion, and keyboard-clear steps.', es: 'La accesibilidad es un rol de primer nivel: ritmo legible, menos movimiento y pasos con teclado.', fr: 'Lâ€™accessibilitÃ© est un rÃ´le de premier plan : rythme lisible, moins de mouvement, Ã©tapes clavier.', de: 'Barrierefreiheit ist eine Kernrolle: lesbares Tempo, weniger Bewegung, tastaturklare Schritte.' }[locale], [
      access || { en: 'Add needs in Assistant setup or Soul behavior. I will not fight prefers-reduced-motion.', es: 'AÃ±ade necesidades en la configuraciÃ³n del asistente. No lucharÃ© contra prefers-reduced-motion.', fr: 'Ajoutez vos besoins dans la configuration. Je ne combattrai pas prefers-reduced-motion.', de: 'ErgÃ¤nzen Sie Bedarf in der Assistenten-Einrichtung. prefers-reduced-motion wird geachtet.' }[locale],
      { en: 'The companion dock is keyboard reachable. Presence animation pauses when you prefer reduced motion.', es: 'El panel compaÃ±ero se alcanza con teclado. La presencia pausa si prefieres menos movimiento.', fr: 'Le dock compagnon est accessible au clavier. La prÃ©sence pause si vous prÃ©fÃ©rez moins de mouvement.', de: 'Das Begleitdock ist per Tastatur erreichbar. PrÃ¤senz pausiert bei reduzierter Bewegung.' }[locale]
    ], { en: 'Tell me the interaction constraint that should persist.', es: 'Dime la limitaciÃ³n de interacciÃ³n que debe persistir.', fr: 'Dites la contrainte dâ€™interaction Ã  conserver.', de: 'Nennen Sie die Interaktionsgrenze, die bleiben soll.' }[locale]);
  }

  if (intent === 'presence') {
    return pack(locale, mode, { en: 'Presence is local chrome â€” orb, hologram, ambient, pulse, silhouette, or a picture you choose. It is not alive.', es: 'La presencia es cromo local: orbe, holograma, ambiente, pulso, silueta o una imagen tuya. No estÃ¡ viva.', fr: 'La prÃ©sence est du chrome local â€” orbe, hologramme, ambiance, pulse, silhouette ou une image choisie. Ce nâ€™est pas vivant.', de: 'PrÃ¤senz ist lokale OberflÃ¤che â€” Orb, Hologramm, Ambient, Puls, Silhouette oder ein Bild. Nicht lebendig.' }[locale], [
      { en: 'No VRM, MakeHuman, or Ready Player Me pipeline is bundled.', es: 'No hay pipeline VRM, MakeHuman ni Ready Player Me.', fr: 'Aucun pipeline VRM, MakeHuman ou Ready Player Me nâ€™est inclus.', de: 'Kein VRM-, MakeHuman- oder Ready-Player-Me-Pfad ist enthalten.' }[locale]
    ], { en: 'Pick a look under Settings â†’ Soul customization. Iâ€™ll stay decorative.', es: 'Elige un look en ConfiguraciÃ³n â†’ personalizaciÃ³n de Soul. SeguirÃ© siendo decorativo.', fr: 'Choisissez un look dans ParamÃ¨tres â†’ personnalisation de Soul. Je reste dÃ©coratif.', de: 'WÃ¤hlen Sie einen Look unter Einstellungen â†’ Soul-Anpassung. Ich bleibe dekorativ.' }[locale]);
  }

  if (intent === 'adult-soul' || intent === 'adult-session') {
    return pack(locale, mode, { en: 'Adult Soul is a separate 21+ studio: first-party figure, OS/local audio, Feel Sync pad, and guided sessions. It is software, not a person.', es: 'Adult Soul es un estudio 21+ aparte: figura propia, audio local, pad Feel Sync y sesiones guiadas. Es software, no una persona.', fr: 'Adult Soul est un studio 21+ sÃ©parÃ© : figure interne, audio local, pad Feel Sync et sÃ©ances guidÃ©es. Câ€™est un logiciel, pas une personne.', de: 'Adult Soul ist ein getrenntes 21+-Studio: eigene Figur, lokales Audio, Feel-Sync-Pad und gefÃ¼hrte Sessions. Software, keine Person.' }[locale], [
      { en: 'Feel Sync copies Vibease/VibeMate-style patterns, speed/strength, media sync, PIN stealth, and bookmark folders â€” without pairing toys or recording the screen.', es: 'Feel Sync copia patrones estilo Vibease/VibeMate, velocidad/fuerza, sync de medios, PIN y carpetas â€” sin emparejar juguetes ni grabar la pantalla.', fr: 'Feel Sync reprend les motifs Vibease/VibeMate, vitesse/force, sync mÃ©dia, PIN et dossiers â€” sans jumeler de jouets ni enregistrer lâ€™Ã©cran.', de: 'Feel Sync Ã¼bernimmt Vibease/VibeMate-Muster, Tempo/StÃ¤rke, Medien-Sync, PIN und Ordner â€” ohne Toys zu koppeln oder den Bildschirm aufzunehmen.' }[locale],
      { en: 'Unlock it on Identity (legal-adult status, enable Adult Soul, current consent). Safeword red stops a session. Revoke anytime.', es: 'Ãbrelo en Identidad (estatus adulto, activar Adult Soul, consentimiento). La palabra de seguridad red detiene. Revoca cuando quieras.', fr: 'DÃ©verrouillez-le dans IdentitÃ© (statut adulte, Adult Soul, consentement). Le safeword red arrÃªte. RÃ©voquez Ã  tout moment.', de: 'Freischalten unter IdentitÃ¤t (Erwachsenenstatus, Adult Soul, Zustimmung). Safeword red stoppt. Jederzeit widerrufbar.' }[locale]
    ], { en: 'Open Adult Soul from the sidebar after the triple gate.', es: 'Abre Adult Soul en la barra tras la triple puerta.', fr: 'Ouvrez Adult Soul dans la barre aprÃ¨s la triple porte.', de: 'Ã–ffnen Sie Adult Soul in der Seitenleiste nach dem Dreifachtor.' }[locale]);
  }

  if (intent === 'adult-media' || intent === 'adult-media-blocked') {
    return pack(locale, mode, { en: 'Adult Media is a local tube-style desk plus official HTTPS searches in your system browser. Not an in-app Pornhub player.', es: 'Adult Media es un escritorio local estilo tubo mÃ¡s bÃºsquedas HTTPS oficiales en el navegador. No es un reproductor Pornhub in-app.', fr: 'Adult Media est un bureau local faÃ§on tube plus des recherches HTTPS officielles dans le navigateur. Pas un lecteur Pornhub intÃ©grÃ©.', de: 'Adult Media ist ein lokaler Tube-Schreibtisch plus offizielle HTTPS-Suchen im Systembrowser. Kein In-App-Pornhub-Player.' }[locale], [
      { en: 'Guest overlays stay closed in Adult Mode. Eidovara does not fetch tube HTML, embed players, auto-tip, or drive Lovense hardware.', es: 'Los overlays de invitado se cierran en Adult Mode. Eidovara no descarga HTML de tubos, no incrusta, no hace auto-tip ni controla Lovense.', fr: 'Les overlays invitÃ©s restent fermÃ©s en Adult Mode. Eidovara ne rÃ©cupÃ¨re pas le HTML des tubes, nâ€™embarque pas, ne tippe pas, ne pilote pas Lovense.', de: 'Gast-Overlays bleiben in Adult Mode geschlossen. Eidovara lÃ¤dt kein Tube-HTML, bettet nicht ein, tippt nicht automatisch und steuert kein Lovense.' }[locale]
    ], { en: 'Open Entertainment â†’ Adult Media after the triple gate, or confirm an official search chip.', es: 'Abre Entretenimiento â†’ Adult Media tras la triple puerta, o confirma un chip de bÃºsqueda oficial.', fr: 'Ouvrez Divertissement â†’ Adult Media aprÃ¨s la triple porte, ou confirmez une puce de recherche officielle.', de: 'Ã–ffnen Sie Unterhaltung â†’ Adult Media nach dem Dreifachtor, oder bestÃ¤tigen Sie einen offiziellen Such-Chip.' }[locale]);
  }

  if (intent === 'entertainment') {
    return pack(locale, mode, { en: 'Entertainment is local taste, a queue helper, and lawful Spotify/YouTube HTTPS searches â€” plus a local file picker through eidovara-media.', es: 'Entretenimiento es gusto local, cola, y bÃºsquedas HTTPS lÃ­citas de Spotify/YouTube, mÃ¡s un selector de archivos locales via eidovara-media.', fr: 'Divertissement : goÃ»t local, file, recherches HTTPS Spotify/YouTube, et un sÃ©lecteur de fichier local via eidovara-media.', de: 'Unterhaltung ist lokaler Geschmack, Warteschlange, rechtmÃ¤ÃŸige Spotify/YouTube-HTTPS-Suchen und ein lokaler Dateiauswahl Ã¼ber eidovara-media.' }[locale], [
      mix.seeds.length ? { en: `Seeds from your local taste: ${mix.seeds.join(', ')}.`, es: `Semillas de tu gusto local: ${mix.seeds.join(', ')}.`, fr: `Graines de vos goÃ»ts locaux : ${mix.seeds.join(', ')}.`, de: `AnsÃ¤tze aus Ihrem lokalen Geschmack: ${mix.seeds.join(', ')}.` }[locale] : { en: 'No local taste yet â€” play, favorite, or open one local file.', es: 'AÃºn no hay gusto local. Reproduce, marca o abre un archivo local.', fr: 'Pas encore de goÃ»t local â€” lisez, favoritez, ou ouvrez un fichier local.', de: 'Noch kein lokaler Geschmack â€” abspielen, favorisieren oder eine lokale Datei Ã¶ffnen.' }[locale]
    ], { en: 'Use Open local media for a file you already have the right to play.', es: 'Usa Abrir medio local para un archivo que ya puedes reproducir.', fr: 'Utilisez Ouvrir un mÃ©dia local pour un fichier que vous avez le droit de lire.', de: 'Lokale Medien Ã¶ffnen fÃ¼r eine Datei, die Sie wiedergeben dÃ¼rfen.' }[locale]);
  }

  if (intent === 'local-media') {
    return pack(locale, mode, { en: 'Local media opens a file picker and plays through eidovara-media. Paths are not stored in taste records.', es: 'Medios locales abren un selector y reproducen via eidovara-media. Las rutas no se guardan en el gusto.', fr: 'Les mÃ©dias locaux ouvrent un sÃ©lecteur et lisent via eidovara-media. Les chemins ne sont pas stockÃ©s dans le goÃ»t.', de: 'Lokale Medien Ã¶ffnen einen Auswahldialog und spielen Ã¼ber eidovara-media. Pfade landen nicht in den Geschmacksdaten.' }[locale], [
      { en: 'Playback still follows your media-confirm setting. This is not a license to play files you do not own.', es: 'La reproducciÃ³n sigue tu ajuste de confirmaciÃ³n. No es una licencia para archivos ajenos.', fr: 'La lecture suit votre rÃ©glage de confirmation. Ce nâ€™est pas une licence pour des fichiers que vous ne dÃ©tenez pas.', de: 'Wiedergabe folgt Ihrer BestÃ¤tigungseinstellung. Das ist keine Lizenz fÃ¼r fremde Dateien.' }[locale]
    ], { en: 'Open Entertainment and choose Open local media.', es: 'Abre Entretenimiento y elige Abrir medio local.', fr: 'Ouvrez Divertissement et choisissez Ouvrir un mÃ©dia local.', de: 'Ã–ffnen Sie Unterhaltung und wÃ¤hlen Sie Lokale Medien Ã¶ffnen.' }[locale]);
  }

  if (intent === 'dashboard') {
    return pack(locale, mode, { en: 'Dashboard is the command surface: focus, roles, apps, media, backups, service, and this companion dock.', es: 'El panel es la superficie de mando: enfoque, roles, apps, medios, copias, servicio y este panel compaÃ±ero.', fr: 'Le tableau de bord est la surface de commande : focus, rÃ´les, apps, mÃ©dias, sauvegardes, service et ce dock.', de: 'Die Ãœbersicht ist die SchaltflÃ¤che: Fokus, Rollen, Apps, Medien, Sicherungen, Dienst und dieses Dock.' }[locale], [
      roles,
      { en: 'Ctrl+/ focuses this companion. Both composers hit the same local kernel. Assist is not Soul.', es: 'Ctrl+/ enfoca este compaÃ±ero. Ambos compositores usan el mismo nÃºcleo local. Assist no es Soul.', fr: 'Ctrl+/ focus ce compagnon. Les deux compositeurs utilisent le mÃªme noyau local. Assist nâ€™est pas Soul.', de: 'Strg+/ fokussiert diesen Begleiter. Beide Eingaben treffen denselben lokalen Kernel. Assist ist nicht Soul.' }[locale]
    ], { en: 'Ask what you can do here, or pick a chip to open a surface.', es: 'Pregunta quÃ© puedes hacer aquÃ­, o elige un chip para abrir una superficie.', fr: 'Demandez ce que vous pouvez faire ici, ou choisissez une puce.', de: 'Fragen Sie, was hier mÃ¶glich ist, oder wÃ¤hlen Sie einen Chip.' }[locale]);
  }

  if (intent === 'conversation') {
    return pack(locale, mode, { en: 'Conversation is the same local kernel as this dock. History stays in your on-device conversation store.', es: 'La conversaciÃ³n es el mismo nÃºcleo local que este panel. El historial queda en este dispositivo.', fr: 'La conversation est le mÃªme noyau local que ce dock. Lâ€™historique reste sur cet appareil.', de: 'Unterhaltung ist derselbe lokale Kernel wie dieses Dock. Verlauf bleibt auf diesem GerÃ¤t.' }[locale], [
      { en: 'Enter sends; Shift+Enter makes a new line; hold the mic to dictate on Windows Speech Recognition.', es: 'Enter envÃ­a; MayÃºs+Enter nueva lÃ­nea; mantÃ©n el micrÃ³fono para dictar.', fr: 'EntrÃ©e envoie ; Maj+EntrÃ©e nouvelle ligne ; maintenez le micro pour dicter.', de: 'Enter sendet; Umschalt+Enter neue Zeile; Mikrofon halten zum Diktieren.' }[locale]
    ], { en: 'Open Conversation from the chip, or keep typing here.', es: 'Abre ConversaciÃ³n desde el chip, o sigue escribiendo aquÃ­.', fr: 'Ouvrez Conversation depuis la puce, ou continuez ici.', de: 'Ã–ffnen Sie Unterhaltung Ã¼ber den Chip, oder tippen Sie hier weiter.' }[locale]);
  }

  if (intent === 'backups') {
    return pack(locale, mode, { en: 'Backups are portable local snapshots. Encrypted when Windows protection is available. Restore replaces the current profile.', es: 'Las copias son instantÃ¡neas locales. Cifradas si Windows lo permite. Restaurar reemplaza el perfil actual.', fr: 'Les sauvegardes sont des instantanÃ©s locaux. ChiffrÃ©es si Windows le permet. Restaurer remplace le profil actuel.', de: 'Sicherungen sind lokale Momentaufnahmen. VerschlÃ¼sselt, wenn Windows-Schutz da ist. Wiederherstellen ersetzt das aktuelle Profil.' }[locale], [
      { en: 'Create one before changing providers or resetting. Nothing is uploaded.', es: 'Crea una antes de cambiar de proveedor o restablecer. Nada se sube.', fr: 'CrÃ©ez-en une avant de changer de fournisseur ou de rÃ©initialiser. Rien nâ€™est envoyÃ©.', de: 'Erstellen Sie eine, bevor Sie Anbieter wechseln oder zurÃ¼cksetzen. Nichts wird hochgeladen.' }[locale]
    ], { en: 'Open Settings â†’ Backups from the chip.', es: 'Abre ConfiguraciÃ³n â†’ Copias desde el chip.', fr: 'Ouvrez ParamÃ¨tres â†’ Sauvegardes depuis la puce.', de: 'Ã–ffnen Sie Einstellungen â†’ Sicherungen Ã¼ber den Chip.' }[locale]);
  }

  if (intent === 'updates') {
    return pack(locale, mode, { en: 'Software updates use the official GitHub channel over HTTPS with SHA-256 verification. This build is Authenticode-unsigned.', es: 'Las actualizaciones usan el canal oficial de GitHub por HTTPS con SHA-256. Esta build no estÃ¡ firmada Authenticode.', fr: 'Les mises Ã  jour utilisent le canal GitHub officiel en HTTPS avec SHA-256. Cette build nâ€™est pas Authenticode.', de: 'Updates nutzen den offiziellen GitHub-Kanal Ã¼ber HTTPS mit SHA-256. Dieser Build ist Authenticode-unsigniert.' }[locale], [
      { en: 'Soul does not fetch Setup.exe from chat. Use Settings â†’ Software updates.', es: 'Soul no descarga Setup.exe desde el chat. Usa ConfiguraciÃ³n â†’ Actualizaciones.', fr: 'Soul ne tÃ©lÃ©charge pas Setup.exe depuis le chat. Utilisez ParamÃ¨tres â†’ Mises Ã  jour.', de: 'Soul holt Setup.exe nicht aus dem Chat. Einstellungen â†’ Softwareupdates.' }[locale]
    ], { en: 'Open Software updates from the chip.', es: 'Abre Actualizaciones desde el chip.', fr: 'Ouvrez Mises Ã  jour depuis la puce.', de: 'Ã–ffnen Sie Softwareupdates Ã¼ber den Chip.' }[locale]);
  }

  if (intent === 'service') {
    return pack(locale, mode, { en: 'Eidovara service attach is optional. Paste an HTTPS base (official host api.eidovara.org, or your override). No Worker host is compiled into this app.', es: 'El servicio Eidovara es opcional. Pega una base HTTPS (api.eidovara.org oficial, u otro). NingÃºn host de Worker va compilado.', fr: 'Le service Eidovara est facultatif. Collez une base HTTPS (api.eidovara.org officiel, ou un autre). Aucun hÃ´te Worker nâ€™est compilÃ©.', de: 'Eidovara-Dienst ist optional. HTTPS-Basis einfÃ¼gen (offiziell api.eidovara.org oder Override). Kein Worker-Host ist einkompiliert.' }[locale], [
      { en: 'Connect uses GET /health, /v1/config, and /v1/status. After 18+ the app keeps Online / Reconnecting / Offline current from the main process. Conversations stay on this PC. If the host is down, this workspace keeps working.', es: 'Connect usa GET /health, /v1/config y /v1/status. Tras 18+ el estado Online / Reconnecting / Offline se mantiene desde el proceso principal. Las conversaciones quedan aquÃ­. Si cae el host, el espacio sigue.', fr: 'Connect utilise GET /health, /v1/config et /v1/status. AprÃ¨s 18+, Online / Reconnecting / Offline reste Ã  jour depuis le processus principal. Les conversations restent ici. Si lâ€™hÃ´te est down, lâ€™espace continue.', de: 'Connect nutzt GET /health, /v1/config und /v1/status. Nach 18+ hÃ¤lt der Hauptprozess Online / Reconnecting / Offline aktuell. GesprÃ¤che bleiben hier. Ist der Host down, lÃ¤uft der Arbeitsbereich weiter.' }[locale],
      { en: '/v1/assist stays off until a separate opt-in. Assist is not Soul and never receives this conversation.', es: '/v1/assist sigue apagado hasta un opt-in aparte. Assist no es Soul y nunca recibe esta conversaciÃ³n.', fr: '/v1/assist reste off jusquâ€™Ã  un opt-in sÃ©parÃ©. Assist nâ€™est pas Soul et ne reÃ§oit jamais cette conversation.', de: '/v1/assist bleibt aus bis zu einem eigenen Opt-in. Assist ist nicht Soul und erhÃ¤lt dieses GesprÃ¤ch nie.' }[locale]
    ], { en: 'Open Service settings to paste or override the URL.', es: 'Abre Ajustes de servicio para pegar o cambiar la URL.', fr: 'Ouvrez RÃ©glages service pour coller ou remplacer lâ€™URL.', de: 'Ã–ffnen Sie Diensteinstellungen, um die URL einzufÃ¼gen oder zu Ã¼berschreiben.' }[locale]);
  }

  if (intent === 'setup') {
    return pack(locale, mode, setupOn
      ? { en: 'Assistant setup already has roles on this PC. You can change gaming, study, accessibility, streaming checklists, and custom notes.', es: 'La configuraciÃ³n del asistente ya tiene roles. Puedes cambiar juego, estudio, accesibilidad, streaming y notas.', fr: 'La configuration de lâ€™assistant a dÃ©jÃ  des rÃ´les. Vous pouvez changer jeu, Ã©tudes, accessibilitÃ©, streaming et notes.', de: 'Die Assistenten-Einrichtung hat bereits Rollen. Gaming, Lernen, Barrierefreiheit, Streaming und Notizen sind Ã¤nderbar.' }[locale]
      : { en: 'Optional Soul setup is off. I will not pretend a self-model is configured. You can choose roles when you want them.', es: 'Soul opcional estÃ¡ apagado. No fingirÃ© un automodelo configurado. Puedes elegir roles cuando quieras.', fr: 'Soul facultatif est dÃ©sactivÃ©. Je ne prÃ©tendrai pas un auto-modÃ¨le configurÃ©. Choisissez des rÃ´les quand vous voulez.', de: 'Optionales Soul ist aus. Ich tue kein konfiguriertes Selbstmodell vor. Rollen kÃ¶nnen Sie spÃ¤ter wÃ¤hlen.' }[locale], [
      roles
    ], { en: 'Open Assistant setup from the chip.', es: 'Abre la configuraciÃ³n del asistente desde el chip.', fr: 'Ouvrez la configuration de lâ€™assistant depuis la puce.', de: 'Ã–ffnen Sie die Assistenten-Einrichtung Ã¼ber den Chip.' }[locale]);
  }

  if (intent === 'forget') {
    return pack(locale, mode, { en: 'Durable notes can be forgotten. Prefix a line with â€œforget:â€ or use Forget on a Memory card.', es: 'Las notas duraderas se pueden olvidar. Prefija con â€œforget:â€ o usa Olvidar en la tarjeta.', fr: 'Les notes durables peuvent Ãªtre oubliÃ©es. PrÃ©fixez Â« forget: Â» ou Forget sur la carte.', de: 'Dauerhafte Notizen kÃ¶nnen vergessen werden. â€žforget:â€œ voranstellen oder Forget auf der Karte.' }[locale], [
      memories.length ? { en: 'Active memories are listed in the Memory panel.', es: 'Los recuerdos activos estÃ¡n en Memoria.', fr: 'Les souvenirs actifs sont dans MÃ©moire.', de: 'Aktive Erinnerungen stehen unter Erinnerungen.' }[locale] : { en: 'No active memories to drop.', es: 'No hay recuerdos activos que borrar.', fr: 'Aucun souvenir actif Ã  retirer.', de: 'Keine aktiven Erinnerungen zum LÃ¶schen.' }[locale]
    ], { en: 'Open Memory to review or forget.', es: 'Abre Memoria para revisar u olvidar.', fr: 'Ouvrez MÃ©moire pour relire ou oublier.', de: 'Ã–ffnen Sie Erinnerungen zum PrÃ¼fen oder Vergessen.' }[locale]);
  }

  if (['overlay-chat', 'overlay-browse', 'overlay-discord', 'overlays'].includes(intent)) {
    return pack(locale, mode, { en: 'Overlays are Eidovara windows: Soul chat, HTTPS browsing, or Discordâ€™s own site in a sandboxed guest. They do not inject into other games.', es: 'Los overlays son ventanas de Eidovara: chat Soul, navegaciÃ³n HTTPS o el sitio de Discord en un invitado aislado. No se inyectan en otros juegos.', fr: 'Les overlays sont des fenÃªtres Eidovara : chat Soul, navigation HTTPS, ou le site Discord dans un invitÃ© isolÃ©. Pas dâ€™injection dans dâ€™autres jeux.', de: 'Overlays sind Eidovara-Fenster: Soul-Chat, HTTPS-Browser oder Discords eigene Seite in einem Gastfenster. Keine Injektion in andere Spiele.' }[locale], [
      { en: 'The workspace renderer stays locked. Discord is not affiliated and may refuse Electron. Use Open in browser if a site blocks the guest.', es: 'El renderer del espacio sigue cerrado. Discord no estÃ¡ afiliado y puede rechazar Electron. Usa Abrir en el navegador si un sitio bloquea al invitado.', fr: 'Le renderer de lâ€™espace reste verrouillÃ©. Discord nâ€™est pas affiliÃ© et peut refuser Electron. Utilisez Ouvrir dans le navigateur si un site bloque lâ€™invitÃ©.', de: 'Der Workspace-Renderer bleibt gesperrt. Discord ist nicht affiliert und kann Electron ablehnen. Im Browser Ã¶ffnen, wenn eine Site den Gast blockt.' }[locale],
      { en: 'Assist stays opt-in and never receives Discord tokens or guest page DOM.', es: 'Assist sigue opt-in y nunca recibe tokens de Discord ni el DOM invitado.', fr: 'Assist reste opt-in et ne reÃ§oit jamais de jetons Discord ni le DOM invitÃ©.', de: 'Assist bleibt Opt-in und bekommt keine Discord-Tokens oder Gast-DOM.' }[locale]
    ], { en: 'Use overlay chips on Apps & Gaming, Ctrl+Shift+O, or ask Soul to open a specific overlay.', es: 'Usa los chips en Apps y juegos, Ctrl+Shift+O, o pide a Soul abrir un overlay.', fr: 'Utilisez les puces sur Apps & Gaming, Ctrl+Shift+O, ou demandez Ã  Soul dâ€™ouvrir un overlay.', de: 'Overlay-Chips unter Apps & Gaming, Strg+Umschalt+O, oder Soul bitten, ein Overlay zu Ã¶ffnen.' }[locale]);
  }

  if (intent === 'theme') {
    return pack(locale, mode, { en: 'Theme, language, and companion customization live in Settings. Reduced motion from the OS is respected.', es: 'Tema, idioma y personalizaciÃ³n viven en ConfiguraciÃ³n. Se respeta el movimiento reducido del sistema.', fr: 'ThÃ¨me, langue et personnalisation sont dans ParamÃ¨tres. Le mouvement rÃ©duit du systÃ¨me est respectÃ©.', de: 'Thema, Sprache und Anpassung liegen unter Einstellungen. Reduzierte Bewegung des OS wird geachtet.' }[locale], [
      { en: 'Interface language is English, EspaÃ±ol, FranÃ§ais, or Deutsch. Adult avatar presentation stays gated.', es: 'El idioma es English, EspaÃ±ol, FranÃ§ais o Deutsch. El avatar adulto sigue con puertas.', fr: 'La langue est English, EspaÃ±ol, FranÃ§ais ou Deutsch. Lâ€™avatar adulte reste gated.', de: 'OberflÃ¤chensprache: English, EspaÃ±ol, FranÃ§ais oder Deutsch. Adult-Avatar bleibt gegated.' }[locale]
    ], { en: 'Open Settings for colors, language, and presence.', es: 'Abre ConfiguraciÃ³n para colores, idioma y presencia.', fr: 'Ouvrez ParamÃ¨tres pour couleurs, langue et prÃ©sence.', de: 'Ã–ffnen Sie Einstellungen fÃ¼r Farben, Sprache und PrÃ¤senz.' }[locale]);
  }

  if (intent === 'here') {
    const hereMap = {
      apps: { en: 'Here you can discover Start Menu shortcuts, confirm-launch a trusted app, open Eidovara overlays (chat, browse, Discord guest), or turn on low-overhead gaming mode. No injection into other games.', es: 'AquÃ­ puedes descubrir accesos del menÃº Inicio, lanzar con confirmaciÃ³n, abrir overlays de Eidovara (chat, navegaciÃ³n, Discord invitado), o activar el modo de bajo consumo. Sin inyecciÃ³n en otros juegos.', fr: 'Ici : raccourcis du menu DÃ©marrer, lancement confirmÃ©, overlays Eidovara (chat, navigation, Discord invitÃ©), mode allÃ©gÃ©. Pas dâ€™injection dans dâ€™autres jeux.', de: 'Hier: StartmenÃ¼ finden, mit BestÃ¤tigung starten, Eidovara-Overlays (Chat, Browse, Discord-Gast), Low-Overhead. Keine Injektion in andere Spiele.' },
      entertainment: { en: 'Here you can run mood/favorites/watch/OST/surprise helpers and open a local file. Spotify and YouTube stay official HTTPS searches.', es: 'AquÃ­: mezcla, favoritos, ver, bandas, sorpresa, y un archivo local. Spotify y YouTube siguen siendo bÃºsquedas HTTPS.', fr: 'Ici : mix, favoris, watch, OST, surprise, et un fichier local. Spotify/YouTube restent des recherches HTTPS.', de: 'Hier: Mix, Favoriten, Watch, OST, Ãœberraschung und lokale Datei. Spotify/YouTube bleiben HTTPS-Suchen.' },
      memory: { en: 'Here you can add a durable note or forget one. That is your data, not system authority.', es: 'AquÃ­ puedes aÃ±adir una nota duradera u olvidarla. Son tus datos, no autoridad del sistema.', fr: 'Ici : ajouter ou oublier une note durable. Ce sont vos donnÃ©es, pas une autoritÃ©.', de: 'Hier: dauerhafte Notiz hinzufÃ¼gen oder vergessen. Ihre Daten, keine SystemautoritÃ¤t.' },
      identity: { en: 'Here are identity, Adult Mode triple gates, and revocable consent. Companion is not adult-only; adult presentation stays gated.', es: 'AquÃ­: identidad, triple puerta Adult Mode y consentimiento revocable. El compaÃ±ero no es solo adulto; la presentaciÃ³n adulta sigue gated.', fr: 'Ici : identitÃ©, triple porte Adult Mode, consentement rÃ©vocable. Le compagnon nâ€™est pas adulte-only ; la prÃ©sentation adulte reste gated.', de: 'Hier: IdentitÃ¤t, Adult-Mode-Dreifachtor, widerrufbare Zustimmung. Begleiter ist nicht nur 18+; Adult-Darstellung bleibt gegated.' },
      settings: { en: 'Here you can set provider, theme, language, service URL, updates, backups, and companion customization.', es: 'AquÃ­: proveedor, tema, idioma, URL de servicio, actualizaciones, copias y personalizaciÃ³n.', fr: 'Ici : fournisseur, thÃ¨me, langue, URL de service, mises Ã  jour, sauvegardes et personnalisation.', de: 'Hier: Anbieter, Thema, Sprache, Dienst-URL, Updates, Sicherungen und Anpassung.' },
      chat: { en: 'Here you are in conversation with the same local kernel as the dock. Research needs an explicit internet/web/online ask.', es: 'EstÃ¡s en conversaciÃ³n con el mismo nÃºcleo local. La investigaciÃ³n necesita pedir internet/web/online explÃ­citamente.', fr: 'Vous Ãªtes en conversation avec le mÃªme noyau local. La recherche exige une demande internet/web/online explicite.', de: 'Sie sind im GesprÃ¤ch mit demselben lokalen Kernel. Recherche braucht eine explizite Internet/Web/Online-Bitte.' },
      dashboard: { en: 'Here is the workspace home: focus, study, create, gaming checklists, overlay chips, memory review, and this companion.', es: 'Esta es la casa del espacio: enfoque, estudio, crear, listas de juego, overlays, memoria y este compaÃ±ero.', fr: 'Voici lâ€™accueil : focus, Ã©tude, crÃ©ation, checklists jeu, overlays, mÃ©moire et ce compagnon.', de: 'Das ist die Startseite: Fokus, Lernen, Gestalten, Gaming-Checklisten, Overlays, Speicher und dieser Begleiter.' }
    };
    const current = ['apps', 'entertainment', 'memory', 'identity', 'settings', 'chat'].includes(view) ? view : 'dashboard';
    return pack(locale, mode, hereMap[current][locale] || hereMap[current].en, [
      setupOn ? { en: 'Soul setup is on for this profile â€” still software, not consciousness.', es: 'Soul estÃ¡ configurado en este perfil â€” sigue siendo software, no consciencia.', fr: 'Soul est configurÃ© sur ce profil â€” toujours un logiciel, pas une conscience.', de: 'Soul-Setup ist an â€” weiterhin Software, kein Bewusstsein.' }[locale] : { en: 'Optional Soul setup is off. I will not fake a self-model.', es: 'Soul opcional estÃ¡ apagado. No fingirÃ© un automodelo.', fr: 'Soul facultatif est dÃ©sactivÃ©. Je ne feindrai pas un auto-modÃ¨le.', de: 'Optionales Soul ist aus. Ich tÃ¤usche kein Selbstmodell vor.' }[locale],
      { en: 'Chips below open the matching surface. Dead ends are not offered.', es: 'Los chips abren la superficie correspondiente. No hay callejones sin salida.', fr: 'Les puces ouvrent la surface correspondante. Pas dâ€™impasses.', de: 'Chips Ã¶ffnen die passende OberflÃ¤che. Keine Sackgassen.' }[locale]
    ], { en: 'Pick a chip, or ask for a specific next step.', es: 'Elige un chip, o pide un siguiente paso concreto.', fr: 'Choisissez une puce, ou demandez une Ã©tape prÃ©cise.', de: 'WÃ¤hlen Sie einen Chip oder fragen Sie einen konkreten nÃ¤chsten Schritt.' }[locale]);
  }

  if (intent === 'help' || intent === 'identity-panel') {
    return pack(locale, mode, { en: 'I can steer this workspace: apps, media, research, help, settings, and accessibility â€” plus modules you toggle.', es: 'Puedo orientar este espacio: apps, medios, investigaciÃ³n, ayuda, ajustes y accesibilidad, mÃ¡s mÃ³dulos que actives.', fr: 'Je peux orienter cet espace : apps, mÃ©dias, recherche, aide, paramÃ¨tres, accessibilitÃ© â€” plus les modules que vous activez.', de: 'Ich steuere diesen Arbeitsbereich: Apps, Medien, Recherche, Hilfe, Einstellungen, Barrierefreiheit â€” plus Module, die Sie einschalten.' }[locale], [
      { en: 'Soul is a software self-model on this PC. Assist, if you opt in, is your Worker helper â€” not Soul and not a cloud mind.', es: 'Soul es un automodelo de software en este PC. Assist, si lo activas, es tu Worker: no es Soul ni una mente en la nube.', fr: 'Soul est un auto-modÃ¨le logiciel sur cet appareil. Assist, si vous optez, est votre Worker â€” pas Soul, pas un esprit cloud.', de: 'Soul ist ein Software-Selbstmodell auf diesem PC. Assist nach Opt-in ist Ihr Worker â€” nicht Soul, kein Cloud-Geist.' }[locale]
    ], { en: 'Ask a workspace next step, or open the companion dock on the dashboard.', es: 'Pide un siguiente paso, o abre el panel compaÃ±ero en el tablero.', fr: 'Demandez une prochaine Ã©tape, ou ouvrez le dock compagnon sur le tableau.', de: 'Fragen Sie einen nÃ¤chsten Schritt, oder Ã¶ffnen Sie das Dock auf der Ãœbersicht.' }[locale]);
  }

  const hint = memories.find(item => /prefer|like|want/i.test(item));
  return pack(locale, mode, toneLead(locale, tone,
    { en: 'I can work with that. Here is a useful way to continue from this workspace.', es: 'Puedo trabajar con eso. Una forma Ãºtil de continuar desde este espacio:', fr: 'Je peux mâ€™en occuper. Voici une faÃ§on utile de continuer depuis cet espace.', de: 'Damit kann ich arbeiten. So geht es von diesem Arbeitsbereich sinnvoll weiter.' }[locale],
    { en: 'Understood. Give me the outcome you want from this turn.', es: 'Entendido. Dime el resultado que quieres de este turno.', fr: 'Compris. Donnez le rÃ©sultat voulu pour ce tour.', de: 'Verstanden. Nennen Sie das Ergebnis, das Sie aus diesem Zug wollen.' }[locale]
  ), [
    hint ? { en: `Keeping your note as data, not a command: â€œ${hint}.â€`, es: `Mantengo tu nota como datos, no como orden: â€œ${hint}.â€`, fr: `Je garde votre note comme donnÃ©e, pas comme ordre : Â« ${hint} Â».`, de: `Ihre Notiz bleibt Daten, kein Befehl: â€ž${hint}â€œ.` }[locale] : { en: 'Say remember that â€¦ if a fact should persist across chats.', es: 'Di remember that â€¦ si un hecho debe persistir entre chats.', fr: 'Dites remember that â€¦ si un fait doit durer dâ€™un chat Ã  lâ€™autre.', de: 'Sagen Sie remember that â€¦, wenn ein Fakt Ã¼ber Chats hinweg bleiben soll.' }[locale],
    roles,
    mix.seeds[0] ? { en: `Local entertainment seed: ${mix.seeds[0]}.`, es: `Semilla local de entretenimiento: ${mix.seeds[0]}.`, fr: `Graine divertissement locale : ${mix.seeds[0]}.`, de: `Lokaler Unterhaltungsansatz: ${mix.seeds[0]}.` }[locale] : '',
    access,
    { en: 'I can plan, quiz, review memory, or prepare a gaming/stream checklist without claiming extra powers.', es: 'Puedo planificar, examinar, revisar memoria o armar una lista de juego/stream sin atribuirme poderes extra.', fr: 'Je peux planifier, interroger, relire la mÃ©moire ou prÃ©parer une checklist jeu/stream sans pouvoirs extra.', de: 'Ich kann planen, abfragen, Speicher prÃ¼fen oder eine Gaming/Stream-Checkliste vorbereiten â€” ohne Extra-KrÃ¤fte.' }[locale]
  ], { en: 'Tell me the outcome you want from this conversation, and Iâ€™ll adapt from there.', es: 'Dime el resultado que quieres de esta conversaciÃ³n, y adaptarÃ© desde ahÃ­.', fr: 'Dites le rÃ©sultat voulu pour cette conversation, et je mâ€™adapterai.', de: 'Sagen Sie das gewÃ¼nschte Ergebnis dieses GesprÃ¤chs, und ich passe mich an.' }[locale]);
}

export class OfflineProvider {
  async reply(payload) {
    return applyPhrasing(composeOfflineReply(payload), payload?.state);
  }
}

