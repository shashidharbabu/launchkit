// "Verdict": a problem-then-solution launch film, 24 s, 1080x1920.
//
// The music (m_v3_duel, trimmed) is a duel: a cold string build to 6.5 s, a
// +12 dB drop, a groove to ~19, a dip at 19-20, a second impact at 20.0, a
// fade from 23.2. The film hangs on it: the problem lives in the build, the
// app arrives on the drop, three how-it-works beats ride the groove, one
// breath in the dip, the call to action on the impact, the lockup in the fade.
//
// Every string comes from the slots (written by lk_studio.pipe from the
// profile, the Business DNA and the site's own copy); the visuals are drawn
// here so the film has a character of its own: cold sagging type and an alarm
// colour before the drop, the brand's palette after it, real product mechanics
// (input, scan, timeline, the live screenshot) instead of words alone.
//
// Motion doctrine (from the upstream kinetic reels): one current, LEFT. Seams
// are cut-the-curve slides, one collision on the drop, one inverse zoom on the
// impact. Only transforms and opacity animate; everything is deterministic.

export const spec = {
  concept: 'verdict',
  title: 'Verdict',
  tagline: 'Problem first, then the app arrives on the drop and proves itself in three beats. Cold type and an alarm colour, then your brand.',
  duration: 24,
  column: 900,
  faces: { anton: 0.46, mono: 0.5, sg: 0.6 },
  music: 'm_v3_duel trimmed to 24 s: build 0-6.5, drop 6.5, groove to 19, dip 19-20, impact 20.0, fade 23.2-24',
  beats: [
    { t: '0.0-1.6', what: 'The scene. One calm line: a moment and a place where the problem happens.', slots: ['open_line'] },
    { t: '1.6-3.4', what: 'The load. Three numbers slam in, one after another, with a label each: the size of the job a person faces by hand. First the volume, then the people, then the squeeze (the time they have), which lands in the alarm colour. Scenario numbers, not product claims.', slots: ['load_n1', 'load_l1', 'load_n2', 'load_l2', 'load_n3', 'load_l3'] },
    { t: '3.4-5.0', what: 'The pile. Cards rain into a heap while a sagging caption says what has to be done to each one by hand.', slots: ['pile_line', 'pile_label', 'pile_sub'] },
    { t: '5.0-6.1', what: 'The doubt. Two questions the person cannot answer today, cold and sagging, swapped with a rack focus.', slots: ['doubt_1', 'doubt_2'] },
    { t: '6.1-6.5', what: 'The cost. One mocking line: what happens when the doubt is not resolved.', slots: ['cost_line'] },
    { t: '6.5-8.5', what: 'The drop. The frame collides, the palette turns to the brand, the app name lands with its mark, then a stamped line says what it does.', slots: ['app_name', 'drop_line'] },
    { t: '8.5-10.5', what: 'How it works, one: the input. A label, then the field the user actually fills (three lines type themselves in) and the button they press.', slots: ['step1_label', 'step1_field', 'step1_button'] },
    { t: '10.5-12.5', what: 'How it works, two: the read. Rows pass under a scan line and each gets a verdict chip. The chips are the product\'s real categories.', slots: ['step2_label', 'chip_1', 'chip_2', 'chip_3', 'chip_4'] },
    { t: '12.5-14.5', what: 'How it works, three: the catch. A timeline of commits; a marker drops in; everything before it turns alarm-coloured and gets a penalty chip.', slots: ['step3_label', 'step3_marker', 'step3_chip'] },
    { t: '14.5-16.6', what: 'The product. The live screenshot in a browser frame, pushing in slowly, with one caption.', slots: ['product_line'] },
    { t: '16.6-18.6', what: 'The payoff. One big number and its unit, a timer counting down under it, a checklist ticking. True numbers only (a batch timer, a count the site states) or ONE.', slots: ['payoff_n', 'payoff_unit', 'payoff_line', 'payoff_timer'] },
    { t: '18.6-19.9', what: 'Breath. Near-empty frame, a cursor and one quiet line.', slots: ['breathe_line'] },
    { t: '20.0-22.0', what: 'Arrival on the impact: the call to action, then the host lands as a chip.', slots: ['arrive_line', 'arrive_chip'] },
    { t: '22.0-24.0', what: 'The lockup, held: who it is for, the name with its mark, the tagline, the host.', slots: ['lock_top', 'lock_title', 'lock_tag', 'lock_host'] },
  ],
  slots: [
    { id: 'open_line', lines: 2, max: 22, default: 'DEMO DAY. 5 PM.', example: 'FRIDAY. 2:10 AM.', face: 'sg', size: 124, selector: '#open-l1', hint: 'a moment and a place: the day, the hour, the room' },
    { id: 'load_n1', max: 4, default: '38', example: '12', face: 'anton', size: 300, selector: '#tile-1 .num', group: 'tiles', hint: 'scenario number one, the volume (submissions, repos, tickets, files)' },
    { id: 'load_l1', max: 14, default: 'SUBMISSIONS', example: 'SERVICES', face: 'mono', size: 44, selector: '#tile-1 .lab', hint: 'what number one counts' },
    { id: 'load_n2', max: 4, default: '4', example: '1', face: 'anton', size: 300, selector: '#tile-2 .num', group: 'tiles', hint: 'scenario number two, the people (judges, reviewers, on call)' },
    { id: 'load_l2', max: 14, default: 'JUDGES', example: 'ON CALL', face: 'mono', size: 44, selector: '#tile-2 .lab', hint: 'what number two counts' },
    { id: 'load_n3', max: 4, default: '30', example: '3', face: 'anton', size: 300, selector: '#tile-3 .num', group: 'tiles', hint: 'scenario number three, the squeeze: the time they have (minutes, hours); this tile lands in the alarm colour' },
    { id: 'load_l3', max: 14, default: 'MINUTES', example: 'MINUTES', face: 'mono', size: 44, selector: '#tile-3 .lab', hint: 'what number three counts, a unit of time' },
    { id: 'pile_line', lines: 2, max: 26, default: 'EVERY ONE. BY HAND.', example: 'EVERY LOG. BY HAND.', face: 'sg', size: 104, selector: '#pile-line', hint: 'what has to happen to each item today, by hand' },
    { id: 'pile_label', max: 12, default: 'SUBMISSION', example: 'SERVICE', face: 'mono', size: 30, selector: '.pcard .plab', hint: 'the item type printed on each card (numbered automatically)' },
    { id: 'pile_sub', max: 24, default: 'REPO · README · DEMO', example: 'LOGS · METRICS · PINGS', face: 'mono', size: 24, selector: '.pcard .psub', hint: 'what each item contains, as a short list with middle dots' },
    { id: 'doubt_1', lines: 2, max: 24, default: 'DID THEY EVEN USE IT?', example: 'IS IT DOWN OR SLOW?', face: 'sg', size: 112, selector: '#doubt-1', hint: 'the first question the person cannot answer today' },
    { id: 'doubt_2', lines: 2, max: 24, default: 'BUILT LAST WEEK?', example: 'WHO GOT PAGED?', face: 'sg', size: 112, selector: '#doubt-2', hint: 'the second question, sharper' },
    { id: 'cost_line', lines: 2, max: 26, default: 'THE LOUDEST DEMO WINS.', example: 'THE CUSTOMER FINDS OUT FIRST.', face: 'sg', size: 108, selector: '#cost-line', hint: 'the unfair outcome when nobody can check' },
    { id: 'app_name', max: 16, default: 'THIS APP', example: 'PULSEBOARD', face: 'anton', size: 150, selector: '#drop-name', hint: 'the app name exactly as the brand writes it' },
    { id: 'drop_line', max: 24, default: 'CHECKS EVERY ONE.', example: 'WATCHES EVERY SERVICE.', face: 'anton', size: 88, selector: '#drop-line', hint: 'what it does, as a stamp: verb first, with a period' },
    { id: 'step1_label', lines: 2, max: 24, default: 'PASTE THE LIST.', example: 'ADD YOUR ENDPOINTS.', face: 'anton', size: 110, selector: '#s1-label', hint: 'step one as an imperative, what the user pastes or types' },
    { id: 'step1_field', max: 32, default: 'ONE PER LINE', example: 'ENDPOINT URL', face: 'mono', size: 28, selector: '#s1-field-label', hint: 'the field label from the product, in its words' },
    { id: 'step1_button', max: 10, default: 'RUN', example: 'RUN', face: 'mono', size: 34, selector: '#s1-run', hint: 'the button the user presses, from the product' },
    { id: 'step2_label', lines: 2, max: 24, default: 'EVERY ONE, READ.', example: 'EVERY ENDPOINT, PINGED.', face: 'anton', size: 110, selector: '#s2-label', hint: 'step two: what the product does to each item' },
    { id: 'chip_1', max: 12, default: 'SIGNIFICANT', example: 'HEALTHY', face: 'mono', size: 28, selector: '.vchip', hint: 'verdict one, the strongest, in the product\'s own words' },
    { id: 'chip_2', max: 12, default: 'MODERATE', example: 'DEGRADED', face: 'mono', size: 28, selector: '.vchip', hint: 'verdict two' },
    { id: 'chip_3', max: 12, default: 'LESS', example: 'SLOW', face: 'mono', size: 28, selector: '.vchip', hint: 'verdict three' },
    { id: 'chip_4', max: 12, default: 'NONE', example: 'DOWN', face: 'mono', size: 28, selector: '.vchip', hint: 'verdict four, the weakest' },
    { id: 'step3_label', lines: 2, max: 28, default: 'THE CATCH, CAUGHT.', example: 'THE OUTAGE, CAUGHT.', face: 'anton', size: 100, selector: '#s3-label', hint: 'step three: the thing that used to slip through, and what happens to it now' },
    { id: 'step3_marker', max: 18, default: 'THE DEADLINE', example: 'SLA THRESHOLD', face: 'mono', size: 28, selector: '#tl-marker-label', hint: 'the line on the timeline: the date or rule that decides' },
    { id: 'step3_chip', max: 10, default: 'FLAGGED', example: 'PAGED', face: 'mono', size: 30, selector: '#tl-chip', hint: 'what a flagged item gets: a penalty or a label, from the product' },
    { id: 'product_line', max: 28, default: 'ONE VIEW PER TEAM.', example: 'ONE BOARD FOR EVERYTHING.', face: 'anton', size: 96, selector: '#prod-line', hint: 'the one thing to notice in the screenshot' },
    { id: 'payoff_n', max: 4, default: 'ONE', example: '30', face: 'anton', size: 300, selector: '#pay-n', hint: 'a true number from the product or the site (a batch timer, a count), else ONE' },
    { id: 'payoff_unit', max: 12, default: 'PASS.', example: 'SECONDS.', face: 'anton', size: 120, selector: '#pay-unit', hint: 'the unit of that number, with a period' },
    { id: 'payoff_line', lines: 2, max: 28, default: 'EVERY ONE. CHECKED.', example: 'EVERY OUTAGE. CAUGHT.', face: 'sg', size: 64, selector: '#pay-line', hint: 'the outcome, two short sentences' },
    { id: 'payoff_timer', max: 5, default: '15:00', example: '00:30', face: 'mono', size: 44, selector: '#pay-timer', hint: 'a timer start in MM:SS that counts down to zero; use the product\'s batch timer if it has one' },
    { id: 'breathe_line', lines: 2, max: 24, default: 'NO MORE GUESSING.', example: 'SLEEP THROUGH THE NIGHT.', face: 'mono', size: 44, selector: '#breathe-line', hint: 'one quiet line for the breath' },
    { id: 'arrive_line', max: 22, default: 'JUDGE WITH PROOF.', example: 'KNOW FIRST.', face: 'anton', size: 130, selector: '#arr-line', hint: 'the call to action, three or four words' },
    { id: 'arrive_chip', max: 40, default: '', example: 'PULSEBOARD.APP', face: 'mono', size: 30, selector: '#arr-chip', optional: true, hint: 'the site host, uppercase, no protocol' },
    { id: 'lock_top', max: 30, default: 'FOR TEAMS WHO SHIP', example: 'FOR SMALL ON-CALL TEAMS', face: 'sg', size: 56, selector: '#lock-top', hint: 'who it is for' },
    { id: 'lock_title', max: 16, default: 'THIS APP', example: 'PULSEBOARD', face: 'anton', size: 140, selector: '#lock-title', hint: 'the app name, shown in the brand colour' },
    { id: 'lock_tag', lines: 2, max: 44, default: 'NOW LIVE', example: 'UPTIME MONITORING FOR SMALL TEAMS', face: 'sg', size: 40, selector: '#lock-tag', hint: 'the tagline in the brand\'s own words' },
    { id: 'lock_host', max: 40, default: '', example: 'PULSEBOARD.APP', face: 'sg', size: 52, selector: '#lock-host', optional: true, hint: 'the site host, uppercase, no protocol' },
  ],
  // Photographs behind the film and on the launch cards, made by the forge's
  // image model from briefs the pipe writes. The film renders without them.
  plates: [
    { id: 'scene', for: 'reel', when: '0.0-3.4', size: '1024x1536', grade: 'cold', hint: 'the room where the problem happens, wide, from the back or above: the people, the tables, the hour, the volume of work in view; nobody is the subject yet', example: 'A small open-plan office at night, three engineers at desks lit only by monitors, a wall of dashboards behind them, rain on the window.' },
    { id: 'pile', for: 'reel', when: '3.4-6.5', size: '1024x1536', grade: 'cold', hint: 'the one person who has to do the job by hand, close, surrounded by the volume (the stacks, the screens, the list), tired and human, not looking at the camera', example: 'An on-call engineer alone at a kitchen table at 2 AM, laptop open, phone lit, head resting on one hand, a dozen alert windows reflected in their glasses.' },
    { id: 'arrival', for: 'reel', when: '20.0-22.0', size: '1024x1536', grade: 'warm', hint: 'the same kind of person after the app: calm, upright, one screen or one sheet in hand, the room lighter, space to breathe', example: 'The same engineer the next morning, coffee in hand, standing relaxed by a window, one laptop closed on the desk, daylight.' },
    { id: 'hero', for: 'cards', when: 'launch images', size: '1536x1024', grade: 'warm', hint: 'the launch image: the person and the place at a glance, landscape, the subject in the right two thirds so a headline can sit on the left', example: 'A small engineering team around one screen in a bright office, relaxed, one of them pointing at a status board, wide shot, subject on the right.' },
  ],
  // The voice-over: a founder pitching, in five lines that land in the film's
  // windows. Word budgets assume a spoken pace of about 2.4 words a second;
  // the forge measures each line and nudges the tempo when it runs long. The breath (18.6-20.0) and the lockup's tail stay silent.
  voice: {
    style: 'A founder pitching in twenty-four seconds: plain words, present tense, confident, spoken to a room of judges and builders as one person talking, never a narrator describing pictures.',
    segments: [
      { id: 'problem', at: 0.4, until: 6.3, words: 14, hint: 'the situation and the load: when it happens, how many, how little time, and that someone does it by hand today' },
      { id: 'drop', at: 6.7, until: 8.4, words: 5, hint: 'the app, named exactly, and the one thing it does' },
      { id: 'how', at: 8.7, until: 14.3, words: 13, hint: 'three steps as three short sentences: what you paste or type, what it does to each item, what it catches' },
      { id: 'proof', at: 14.7, until: 18.4, words: 9, hint: 'the outcome, with the one true number if there is one, said plainly' },
      { id: 'close', at: 20.2, until: 23.6, words: 7, hint: 'the ask: what to do next, ending on the app name (the address is on screen, do not read it)' },
    ],
  },
};

/** "#rrggbb" to "r, g, b" for rgba() scrims. */
function rgb(hex) {
  const m = String(hex ?? '').replace('#', '');
  const n = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) || 0).join(', ');
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const js = (s) => JSON.stringify(String(s ?? ''));

/** Words of a line as waterfall spans. */
function words(text, prefix, cls = '') {
  return String(text).split(' ').filter(Boolean).map((w, i) => `<span class="w ${cls}" id="${prefix}-${i}">${esc(w)}</span>`).join(' ');
}
const wordCount = (text) => String(text).split(' ').filter(Boolean).length;

/** Letters of a line as sag spans (the cold, tired type). */
function letters(text, prefix) {
  return String(text).split(' ').filter(Boolean).map((w, wi) =>
    `<span class="sl">${w.split('').map((ch, i) => `<span class="lt" data-i="${wi * 9 + i}">${esc(ch)}</span>`).join('')}</span>`).join(' ');
}

const PILE = [
  [90, 560, -9], [500, 620, 7], [300, 720, -4], [60, 820, 11], [540, 880, -6], [260, 960, 3], [450, 1030, -12],
  [120, 1100, 5], [360, 1160, -2], [560, 1220, 8], [200, 1280, -7], [480, 1340, 2], [310, 1400, -5], [100, 1450, 9],
];

export function build({ values: v, vars, extras }) {
  const { compositionId, logoImg = '', screenshot = null, fitCss = '', plates = {} } = extras;
  const plateIds = ['scene', 'pile', 'arrival'].filter((k) => plates[k]);
  const hasPlates = plateIds.length > 0;
  const cc = rgb(vars.cold_canvas);
  const bc = rgb(vars.canvas);
  const chips = [v.chip_1, v.chip_2, v.chip_3, v.chip_4, v.chip_1];
  const chipTone = ['t1', 't2', 't3', 't4', 't1'];
  const timer = /^\d{1,2}:\d{2}$/.test(v.payoff_timer) ? v.payoff_timer : '15:00';
  const [tm, ts] = timer.split(':').map(Number);
  const timerSeconds = tm * 60 + ts;
  const inputLines = ['github.com/team-01/project', 'github.com/team-02/project', 'github.com/team-03/project'];
  const productBlock = screenshot
    ? `<div id="browser"><div id="bbar"><span class="bdot"></span><span class="bdot"></span><span class="bdot"></span><span id="burl">${esc((v.lock_host || v.arrive_chip || '').toLowerCase())}</span></div><div id="bview"><img id="shot" src="${esc(screenshot)}" alt=""></div></div>`
    : `<div id="browser" class="nofoto"><div id="bbar"><span class="bdot"></span><span class="bdot"></span><span class="bdot"></span><span id="burl">${esc((v.lock_host || '').toLowerCase())}</span></div><div id="bview"><div id="bfake"><span class="vchip t1">${esc(chips[0])}</span><span class="vchip t2">${esc(chips[1])}</span><span class="vchip t3">${esc(chips[2])}</span></div></div></div>`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=1080, height=1920">
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      @font-face { font-family: "Anton"; src: url("assets/fonts/Anton.ttf") format("truetype"); font-weight: 400; font-display: block; }
      @font-face { font-family: "Space Grotesk"; src: url("assets/fonts/SpaceGrotesk.ttf") format("truetype-variations"); font-weight: 300 700; font-display: block; }
      @font-face { font-family: "Inconsolata"; src: url("assets/fonts/Inconsolata.ttf") format("truetype"); font-display: block; }
      :root {
        --canvas: ${vars.canvas}; --ink: ${vars.ink}; --accent: ${vars.accent}; --accent-soft: ${vars.accent_soft}; --dim: ${vars.dim}; --panel: ${vars.panel}; --brand: ${vars.brand};
        --cold-canvas: ${vars.cold_canvas}; --cold: ${vars.cold}; --cold-panel: ${vars.cold_panel}; --alert: ${vars.alert}; --alert-glow: ${vars.alert_glow}; --accent-glow: ${vars.accent_glow};
      }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 1080px; height: 1920px; overflow: hidden; background: var(--cold-canvas); }
      body { font-family: "Space Grotesk", sans-serif; color: var(--ink); }
      .anton { font-family: "Anton", sans-serif; font-weight: 400; letter-spacing: 0.01em; }
      .mono { font-family: "Inconsolata", monospace; }
      .acc { color: var(--accent); }
      .alert { color: var(--alert); }
      #film, #cam { position: absolute; inset: 0; }
      #bg { position: absolute; inset: 0; background: var(--cold-canvas); }
      #wash { position: absolute; inset: 0; background: var(--accent); opacity: 0; visibility: hidden; }

      /* the photographs: full bleed under the scenes, a scrim in the canvas colour so the type stays the subject */
      .plate { position: absolute; inset: 0; opacity: 0; overflow: hidden; }
      .plate img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 50% 40%; transform-origin: 50% 45%; will-change: transform, filter; }
      .plate .scrim { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(${cc}, 0.5) 0%, rgba(${cc}, 0.64) 50%, rgba(${cc}, 0.9) 100%); }
      #plate-arrival img { filter: grayscale(0.4) saturate(0.9); object-position: 50% 28%; }
      #plate-arrival .tint { position: absolute; inset: 0; background: var(--accent); opacity: 0.16; mix-blend-mode: color; }
      #plate-arrival .scrim { background: linear-gradient(180deg, rgba(${bc}, 0.55) 0%, rgba(${bc}, 0.7) 55%, rgba(${bc}, 0.92) 100%); }
      ${hasPlates ? `#open-l1, .tile .num, .tile .lab, #pile-line, .doubt, #cost-line, #arr-line { text-shadow: 0 4px 40px rgba(0, 0, 0, 0.55); }` : ''}
      .scene { position: absolute; inset: 0; }
      .sc { position: relative; display: flex; flex-direction: column; justify-content: center; align-items: center; width: 100%; height: 100%; padding: 140px 80px; gap: 30px; text-align: center; }
      #sc-load, #sc-pile, #sc-doubt, #sc-cost, #sc-drop, #sc-s1, #sc-s2, #sc-s3, #sc-prod, #sc-pay, #sc-breathe, #sc-arr, #sc-lock, #track { opacity: 0; }
      .w { display: inline-block; will-change: transform, opacity; }
      .sl { display: inline-block; white-space: nowrap; }
      .lt { display: inline-block; will-change: transform; }

      /* s1 open */
      #open-l1 { font-variation-settings: "wght" 500; font-size: 124px; line-height: 1.05; color: var(--cold); text-wrap: balance; }
      #open-rule { width: 150px; height: 3px; background: var(--cold); margin-top: 12px; transform-origin: center; }

      /* s2 load tiles */
      #tiles { display: flex; flex-direction: column; gap: 46px; width: 100%; }
      .tile { display: flex; align-items: baseline; justify-content: flex-start; gap: 44px; padding: 10px 30px 22px; border-bottom: 3px solid var(--cold-panel); will-change: transform, opacity; opacity: 0; }
      .tile .num { font-family: "Anton", sans-serif; font-size: 300px; line-height: 0.9; color: var(--cold); }
      .tile .lab { font-family: "Inconsolata", monospace; font-size: 44px; letter-spacing: 0.16em; color: var(--cold); }
      #tile-3 .num, #tile-3 .lab { color: var(--alert); }
      #tile-3 { border-bottom-color: var(--alert); }

      /* s3 pile */
      #pile { position: absolute; inset: 0; }
      .pcard { position: absolute; width: 500px; height: 168px; padding: 28px 34px; background: var(--cold-panel); border: 2px solid var(--cold); border-radius: 10px; display: flex; flex-direction: column; justify-content: center; gap: 10px; will-change: transform, opacity; opacity: 0; }
      .pcard .plab { font-family: "Inconsolata", monospace; font-size: 34px; letter-spacing: 0.12em; color: var(--ink); }
      .pcard .psub { font-family: "Inconsolata", monospace; font-size: 26px; letter-spacing: 0.08em; color: var(--cold); }
      #pile-line { position: absolute; left: 60px; right: 60px; top: 230px; text-align: center; font-variation-settings: "wght" 300; font-size: 104px; line-height: 1.1; color: var(--cold); opacity: 0; will-change: transform, opacity; text-wrap: balance; }

      /* s4 doubt + s5 cost */
      .doubt { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; padding: 0 70px; text-align: center; font-variation-settings: "wght" 300; font-size: 112px; line-height: 1.1; color: var(--cold); will-change: transform, opacity; }
      #doubt-2 { opacity: 0; }
      .dinner { display: block; text-wrap: balance; }
      #cost-line { position: absolute; left: 60px; right: 60px; top: 50%; transform: translateY(-50%); text-align: center; font-variation-settings: "wght" 700; font-size: 108px; line-height: 1.1; color: var(--alert); will-change: transform, opacity; text-wrap: balance; }

      /* s6 drop */
      #drop-inner { position: relative; display: flex; flex-direction: column; align-items: center; gap: 44px; will-change: transform, opacity; }
      #drop-glow { position: absolute; left: 50%; top: 50%; width: 1100px; height: 720px; margin: -360px 0 0 -550px; border-radius: 50%; background: var(--accent); filter: blur(150px); opacity: 0; }
      #drop-logo { height: 120px; width: auto; max-width: 620px; object-fit: contain; opacity: 0; }
      #drop-name { font-size: 150px; line-height: 1; color: var(--brand); }
      #drop-line { font-size: 88px; line-height: 1; color: var(--ink); border: 6px solid var(--accent); padding: 14px 40px; opacity: 0; will-change: transform, opacity; }

      /* the batch track: the solution half's motif, fills through the groove */
      #track { position: absolute; left: 80px; right: 80px; bottom: 96px; height: 10px; background: var(--dim); border-radius: 5px; overflow: hidden; }
      #track-fill { position: absolute; inset: 0; background: var(--accent); transform-origin: left center; transform: scaleX(0); }
      #track-label { position: absolute; left: 80px; bottom: 116px; font-family: "Inconsolata", monospace; font-size: 26px; letter-spacing: 0.14em; color: var(--dim); }

      /* how-it-works labels */
      .hlabel { font-size: 110px; line-height: 1; color: var(--ink); text-wrap: pretty; }
      #s3-label { font-size: 100px; }
      .hlabel .w { opacity: 0; }

      /* s7 input */
      #field { width: 900px; background: var(--panel); border: 3px solid var(--accent-soft); border-radius: 14px; padding: 34px 40px; text-align: left; will-change: transform, opacity; opacity: 0; }
      #s1-field-label { font-family: "Inconsolata", monospace; font-size: 28px; letter-spacing: 0.16em; color: var(--dim); margin-bottom: 22px; }
      .tline { font-family: "Inconsolata", monospace; font-size: 40px; line-height: 1.5; color: var(--ink); white-space: pre; min-height: 60px; }
      .tline .c { opacity: 0; }
      #s1-run { display: inline-block; margin-top: 26px; font-family: "Inconsolata", monospace; font-size: 34px; letter-spacing: 0.16em; color: var(--canvas); background: var(--accent); padding: 18px 54px; border-radius: 10px; will-change: transform; opacity: 0; }

      /* s8 scan */
      #rows { position: relative; width: 900px; display: flex; flex-direction: column; gap: 22px; }
      .row { display: flex; align-items: center; justify-content: space-between; height: 124px; padding: 0 36px; background: var(--panel); border: 2px solid var(--panel); border-radius: 12px; will-change: transform, opacity; opacity: 0; }
      .row .rname { font-family: "Inconsolata", monospace; font-size: 36px; letter-spacing: 0.08em; color: var(--ink); }
      .vchip { display: inline-flex; align-items: center; gap: 14px; font-family: "Inconsolata", monospace; font-size: 34px; letter-spacing: 0.14em; padding: 14px 26px; border-radius: 999px; border: 2px solid var(--dim); color: var(--ink); background: var(--canvas); opacity: 0; will-change: transform, opacity; }
      .vchip::before { content: ""; width: 18px; height: 18px; border-radius: 50%; background: var(--dim); }
      .vchip.t1 { border-color: var(--accent); } .vchip.t1::before { background: var(--accent); }
      .vchip.t2 { border-color: var(--accent-soft); } .vchip.t2::before { background: var(--accent-soft); }
      .vchip.t3::before { background: var(--dim); }
      .vchip.t4 { color: var(--dim); } .vchip.t4::before { background: var(--cold); }
      #scan { position: absolute; left: -20px; right: -20px; top: 0; height: 6px; background: var(--accent); box-shadow: 0 0 30px var(--accent-glow); opacity: 0; }

      /* s9 timeline */
      #tlwrap { position: relative; width: 900px; height: 420px; }
      #tlline { position: absolute; left: 0; right: 0; top: 210px; height: 8px; background: var(--dim); transform-origin: left center; transform: scaleX(0); }
      .dot { position: absolute; top: 190px; width: 46px; height: 46px; border-radius: 50%; background: var(--ink); border: 4px solid var(--canvas); opacity: 0; will-change: transform, opacity; }
      .dot.bad { background: var(--alert); }
      #tl-marker { position: absolute; left: 480px; top: 60px; width: 4px; height: 300px; background: var(--alert); opacity: 0; transform-origin: top center; }
      #tl-marker-label { position: absolute; left: 500px; top: 60px; font-family: "Inconsolata", monospace; font-size: 32px; letter-spacing: 0.14em; color: var(--alert); opacity: 0; }
      #tl-chip { position: absolute; left: 110px; top: 284px; font-family: "Inconsolata", monospace; font-size: 34px; letter-spacing: 0.14em; color: var(--canvas); background: var(--alert); padding: 12px 24px; border-radius: 999px; opacity: 0; will-change: transform, opacity; }
      #tl-before { position: absolute; left: 0; top: 130px; font-family: "Inconsolata", monospace; font-size: 26px; letter-spacing: 0.12em; color: var(--dim); }

      /* s10 product */
      #browser { width: 920px; border-radius: 18px; overflow: hidden; background: var(--panel); border: 2px solid var(--accent-soft); box-shadow: 0 0 0 1px var(--accent-glow), 0 40px 90px rgba(0,0,0,0.55), 0 0 60px var(--accent-glow); will-change: transform; }
      #bbar { display: flex; align-items: center; gap: 12px; height: 56px; padding: 0 20px; background: var(--panel); border-bottom: 1px solid var(--accent-soft); }
      .bdot { width: 14px; height: 14px; border-radius: 50%; background: var(--dim); }
      #burl { margin-left: 16px; font-family: "Inconsolata", monospace; font-size: 22px; color: var(--dim); background: var(--canvas); padding: 6px 16px; border-radius: 8px; }
      #bview { width: 916px; height: 572px; overflow: hidden; background: var(--canvas); }
      #shot { display: block; width: 916px; height: 572px; object-fit: cover; object-position: top; transform-origin: 50% 20%; }
      #bfake { display: flex; gap: 16px; padding: 60px 40px; }
      #bfake .vchip { opacity: 1; }
      #prod-line { font-size: 96px; line-height: 1; color: var(--ink); opacity: 0; will-change: transform, opacity; }

      /* s11 payoff */
      #pay-row { display: flex; align-items: baseline; gap: 28px; }
      #pay-n { font-size: 300px; line-height: 0.9; color: var(--accent); }
      #pay-unit { font-size: 120px; line-height: 1; color: var(--ink); }
      #pay-line { font-variation-settings: "wght" 600; font-size: 64px; line-height: 1.1; color: var(--ink); opacity: 0; will-change: transform, opacity; text-wrap: balance; }
      #pay-timer { font-family: "Inconsolata", monospace; font-size: 44px; letter-spacing: 0.16em; color: var(--dim); }
      #checks { display: flex; flex-direction: column; gap: 14px; width: 620px; margin-top: 10px; }
      .chk { display: flex; align-items: center; gap: 18px; font-family: "Inconsolata", monospace; font-size: 30px; letter-spacing: 0.08em; color: var(--dim); opacity: 0; will-change: transform, opacity; }
      .chk i { width: 30px; height: 30px; border-radius: 50%; border: 3px solid var(--dim); position: relative; }
      .chk i::after { content: ""; position: absolute; left: 8px; top: 3px; width: 8px; height: 14px; border: 3px solid var(--accent); border-top: 0; border-left: 0; transform: rotate(45deg); opacity: 0; }
      .chk.on { color: var(--ink); } .chk.on i { border-color: var(--accent); } .chk.on i::after { opacity: 1; }

      /* s12 breathe */
      #breathe-line { font-family: "Inconsolata", monospace; font-size: 44px; letter-spacing: 0.16em; color: var(--dim); }
      #b-cursor { width: 22px; height: 64px; background: var(--accent); }

      /* s13 arrival */
      #arr-line { font-size: 130px; line-height: 1; color: var(--ink); }
      #arr-chip { font-family: "Inconsolata", monospace; font-size: 30px; letter-spacing: 0.12em; color: var(--accent); border: 2px solid var(--accent); padding: 12px 26px; border-radius: 999px; opacity: 0; will-change: transform, opacity; }

      /* s14 lockup */
      #lock-logo { height: 120px; width: auto; max-width: 560px; object-fit: contain; }
      #lock-top { font-variation-settings: "wght" 300; font-size: 56px; letter-spacing: 0.06em; color: var(--ink); }
      #lock-title { font-size: 140px; line-height: 1; color: var(--brand); }
      #lock-divider { width: 180px; height: 3px; background: var(--dim); transform-origin: center; }
      #lock-tag { font-variation-settings: "wght" 500; font-size: 40px; line-height: 1.2; color: var(--ink); max-width: 900px; text-wrap: balance; }
      #lock-host { font-variation-settings: "wght" 600; font-size: 52px; color: var(--ink); }

      /* fitted sizes, computed by the forge for this script */
      ${fitCss}
    </style>
  </head>
  <body>
    <div id="stage" data-composition-id="${esc(compositionId)}" data-start="0" data-duration="24" data-fps="30" data-width="1080" data-height="1920" style="position: relative; width: 1080px; height: 1920px; overflow: hidden; background: ${vars.cold_canvas}">
      <div id="film" class="clip" data-start="0" data-duration="24" data-track-index="1" data-layout-allow-overflow="true">
        <div id="cam">
          <div id="bg"></div>
          <div id="wash"></div>
          ${plateIds.map((k) => `<div class="plate" id="plate-${k}" data-layout-allow-overlap="true"><img src="${esc(plates[k])}" alt="">${k === 'arrival' ? '<div class="tint"></div>' : ''}<div class="scrim"></div></div>`).join('\n          ')}

          <div class="scene" id="sc-open">
            <div class="sc" id="open-inner">
              <div id="open-l1">${words(v.open_line, 'ow')}</div>
              <div id="open-rule"></div>
            </div>
          </div>

          <div class="scene" id="sc-load">
            <div class="sc" id="load-inner">
              <div id="tiles">
                <div class="tile" id="tile-1"><span class="num">${esc(v.load_n1)}</span><span class="lab">${esc(v.load_l1)}</span></div>
                <div class="tile" id="tile-2"><span class="num">${esc(v.load_n2)}</span><span class="lab">${esc(v.load_l2)}</span></div>
                <div class="tile" id="tile-3"><span class="num">${esc(v.load_n3)}</span><span class="lab">${esc(v.load_l3)}</span></div>
              </div>
            </div>
          </div>

          <div class="scene" id="sc-pile">
            <div id="pile" data-layout-allow-overlap="true">
              ${PILE.map(([x, y, r], i) => `<div class="pcard" id="pc-${i}" style="left:${x}px;top:${y}px;transform:rotate(${r}deg)"><span class="plab">${esc(v.pile_label)} ${String(i + 1).padStart(2, '0')}</span><span class="psub">${esc(v.pile_sub)}</span></div>`).join('')}
              <div id="pile-line">${letters(v.pile_line, 'pl')}</div>
            </div>
          </div>

          <div class="scene" id="sc-doubt">
            <div class="doubt" id="doubt-1" data-layout-allow-overlap="true"><div class="dinner">${letters(v.doubt_1, 'd1')}</div></div>
            <div class="doubt" id="doubt-2" data-layout-allow-overlap="true"><div class="dinner">${letters(v.doubt_2, 'd2')}</div></div>
          </div>

          <div class="scene" id="sc-cost" data-layout-allow-overlap="true">
            <div id="cost-line">${esc(v.cost_line)}</div>
          </div>

          <div class="scene" id="sc-drop">
            <div class="sc" id="drop-sc">
              <div id="drop-inner">
                <div id="drop-glow" data-layout-allow-overlap="true"></div>
                ${logoImg ? logoImg.replace('id="s14-logo"', 'id="drop-logo"') : ''}
                <div class="anton" id="drop-name">${esc(v.app_name)}</div>
                <div class="anton" id="drop-line">${esc(v.drop_line)}</div>
              </div>
            </div>
          </div>

          <div class="scene" id="sc-s1">
            <div class="sc" id="s1-inner">
              <div class="anton hlabel" id="s1-label">${words(v.step1_label, 's1w')}</div>
              <div id="field">
                <div id="s1-field-label">${esc(v.step1_field)}</div>
                ${inputLines.map((l, i) => `<div class="tline" id="t-${i}">${l.split('').map((c) => `<span class="c">${esc(c)}</span>`).join('')}</div>`).join('')}
                <span id="s1-run">${esc(v.step1_button)}</span>
              </div>
            </div>
          </div>

          <div class="scene" id="sc-s2">
            <div class="sc" id="s2-inner">
              <div class="anton hlabel" id="s2-label">${words(v.step2_label, 's2w')}</div>
              <div id="rows" data-layout-allow-overlap="true">
                ${[0, 1, 2, 3, 4].map((i) => `<div class="row" id="row-${i}"><span class="rname">${esc(v.pile_label)} ${String(i + 1).padStart(2, '0')}</span><span class="vchip ${chipTone[i]}" id="chip-${i}">${esc(chips[i])}</span></div>`).join('')}
                <div id="scan"></div>
              </div>
            </div>
          </div>

          <div class="scene" id="sc-s3">
            <div class="sc" id="s3-inner">
              <div class="anton hlabel" id="s3-label">${words(v.step3_label, 's3w')}</div>
              <div id="tlwrap" data-layout-allow-overlap="true">
                <div id="tlline"></div>
                ${[60, 150, 250, 340, 420, 560, 660, 760, 850].map((x, i) => `<span class="dot${i < 5 ? ' bad-later' : ''}" id="dot-${i}" style="left:${x}px"></span>`).join('')}
                <div id="tl-marker"></div>
                <div id="tl-marker-label">${esc(v.step3_marker)}</div>
                <div id="tl-chip">${esc(v.step3_chip)}</div>
              </div>
            </div>
          </div>

          <div class="scene" id="sc-prod">
            <div class="sc" id="prod-inner" style="gap: 54px">
              ${productBlock}
              <div class="anton" id="prod-line">${esc(v.product_line)}</div>
            </div>
          </div>

          <div class="scene" id="sc-pay">
            <div class="sc" id="pay-inner" style="gap: 26px">
              <div id="pay-row"><span class="anton" id="pay-n">${esc(v.payoff_n)}</span><span class="anton" id="pay-unit">${esc(v.payoff_unit)}</span></div>
              <div id="pay-timer">${esc(timer)}</div>
              <div id="pay-line">${esc(v.payoff_line)}</div>
              <div id="checks">
                ${[0, 1, 2, 3].map((i) => `<div class="chk" id="chk-${i}"><i></i><span>${esc(v.pile_label)} ${String(i + 1).padStart(2, '0')}</span></div>`).join('')}
              </div>
            </div>
          </div>

          <div class="scene" id="sc-breathe">
            <div class="sc" id="breathe-inner" style="gap: 40px">
              <div id="breathe-line">${esc(v.breathe_line)}</div>
              <div id="b-cursor"></div>
            </div>
          </div>

          <div class="scene" id="sc-arr">
            <div class="sc" id="arr-inner" style="gap: 40px">
              <div class="anton" id="arr-line">${esc(v.arrive_line)}</div>
              ${v.arrive_chip ? `<span id="arr-chip">${esc(v.arrive_chip)}</span>` : ''}
            </div>
          </div>

          <div class="scene" id="sc-lock">
            <div class="sc" id="lock-inner" style="gap: 40px">
              ${logoImg ? logoImg.replace('id="s14-logo"', 'id="lock-logo"') : ''}
              <div id="lock-top">${esc(v.lock_top)}</div>
              <div class="anton" id="lock-title">${esc(v.lock_title)}</div>
              <div id="lock-divider"></div>
              <div id="lock-tag">${esc(v.lock_tag)}</div>
              ${v.lock_host ? `<div id="lock-host">${esc(v.lock_host)}</div>` : ''}
            </div>
          </div>

          <div id="track" data-layout-allow-overlap="true"><div id="track-fill"></div></div>
          <div id="track-label" data-layout-allow-overlap="true"></div>
        </div>
      </div>

      <audio id="music" class="clip" src="assets/audio/music.mp3" data-start="0" data-duration="24" data-track-index="10" data-volume="1"></audio>
      <audio id="sfx-riser" class="clip" src="assets/audio/sfx_riser.mp3" data-start="5.6" data-duration="0.9" data-track-index="11" data-volume="0.7"></audio>
      <audio id="sfx-slam" class="clip" src="assets/audio/sfx_flip_slam.mp3" data-start="6.45" data-duration="1.5" data-track-index="12" data-volume="0.75"></audio>
      <audio id="sfx-whoosh-1" class="clip" src="assets/audio/sfx_whoosh_impact.mp3" data-start="8.5" data-duration="1" data-track-index="11" data-volume="0.7"></audio>
      <audio id="sfx-whoosh-2" class="clip" src="assets/audio/sfx_whoosh_impact.mp3" data-start="10.5" data-duration="1" data-track-index="11" data-volume="0.7"></audio>
      <audio id="sfx-whoosh-3" class="clip" src="assets/audio/sfx_whoosh_impact.mp3" data-start="12.5" data-duration="1" data-track-index="11" data-volume="0.7"></audio>
      <audio id="sfx-whoosh-4" class="clip" src="assets/audio/sfx_whoosh_impact.mp3" data-start="14.5" data-duration="1" data-track-index="11" data-volume="0.7"></audio>
      <audio id="sfx-splitflap" class="clip" src="assets/audio/sfx_splitflap.mp3" data-start="19.9" data-duration="1.5" data-track-index="11" data-volume="0.7"></audio>
    </div>

    <script>
      var $id = function (s) { return document.getElementById(s); };
      var $all = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
      function sagY(i) { return 5 + ((i * 7) % 10); }
      function sagR(i) { return (((i * 3) % 5) - 2) * 0.9; }
      var pileLetters = $all('#pile-line .lt');
      var d1Letters = $all('#doubt-1 .lt');
      var d2Letters = $all('#doubt-2 .lt');
      var typed = [0, 1, 2].map(function (i) { return $all('#t-' + i + ' .c'); });

      window.__timelines = window.__timelines || {};
      var tl = gsap.timeline({ paused: true });

      /* ---- pre-sets ---- */
      gsap.set($all('#open-l1 .w'), { opacity: 0 });
      gsap.set('#open-rule', { scaleX: 0 });
      d1Letters.forEach(function (lt, i) { gsap.set(lt, { y: sagY(i), rotation: sagR(i) }); });
      d2Letters.forEach(function (lt, i) { gsap.set(lt, { y: sagY(i + 2), rotation: sagR(i + 2) }); });
      gsap.set('#lock-divider', { scaleX: 0 });
      gsap.set('#drop-line', { rotation: -3 });

      /* helpers: cut-the-curve LEFT (exit) and entry from the right */
      function cutLeft(t, outInner, outScene, inInner, inScene) {
        tl.to(outInner, { x: -230, filter: 'blur(8px)', duration: 0.32, ease: 'power4.in' }, t - 0.32);
        tl.to(outScene, { opacity: 0, duration: 0.3, ease: 'power2.in' }, t - 0.3);
        tl.set(outScene, { opacity: 0 }, t);
        tl.fromTo(inInner, { x: 230, filter: 'blur(8px)' }, { x: 0, filter: 'blur(0px)', duration: 0.42, ease: 'power4.out', immediateRender: false }, t);
        tl.fromTo(inScene, { opacity: 0.35 }, { opacity: 1, duration: 0.3, ease: 'power2.out', immediateRender: false }, t);
      }
      function waterfall(sel, t0, gap, y) {
        $all(sel).forEach(function (w, i) {
          tl.set(w, { opacity: 1, y: y || 50 }, t0 + i * gap);
          tl.to(w, { y: 0, duration: 0.16, ease: 'power4.out' }, t0 + i * gap);
        });
      }
      function shake(t, seq) {
        seq.forEach(function (v, i) { tl.set('#cam', { x: v[0], y: v[1] }, t + i * 0.04); });
      }

      /* ---------- PLATES: the room, the person under the load, the arrival ---------- */
      ${plates.scene ? `tl.set('#plate-scene', { opacity: 1 }, 0);
      tl.fromTo('#plate-scene img', { scale: 1.06 }, { scale: 1.18, duration: 3.8, ease: 'none', immediateRender: false }, 0);
      tl.to('#plate-scene img', { filter: 'brightness(0.55)', duration: 0.3, ease: 'power2.out' }, 1.6);
      /* the room dissolves into the person across the seam, so the story moves in instead of cutting */
      tl.to('#plate-scene', { opacity: 0, duration: 0.55, ease: 'power2.inOut' }, 3.25);` : ''}
      ${plates.pile ? `tl.fromTo('#plate-pile', { opacity: 0 }, { opacity: 1, duration: 0.55, ease: 'power2.inOut', immediateRender: false }, 3.25);
      tl.fromTo('#plate-pile img', { scale: 1.0, filter: 'blur(0px) brightness(0.8)' }, { scale: 1.12, duration: 3.3, ease: 'none', immediateRender: false }, 3.2);
      tl.to('#plate-pile img', { filter: 'blur(14px) brightness(0.5)', duration: 0.5, ease: 'power2.in' }, 5.0);
      tl.to('#plate-pile', { opacity: 0, duration: 0.12, ease: 'power4.in' }, 6.38);` : ''}
      ${plates.arrival ? `/* the arrival plate breathes in under the dip, then snaps to size on the impact */
      tl.fromTo('#plate-arrival', { opacity: 0 }, { opacity: 1, duration: 0.45, ease: 'power2.in', immediateRender: false }, 19.7);
      tl.fromTo('#plate-arrival img', { scale: 1.3 }, { scale: 1.22, duration: 0.3, ease: 'none', immediateRender: false }, 19.7);
      tl.to('#plate-arrival img', { scale: 1.0, duration: 0.6, ease: 'expo.out' }, 20.0);
      tl.to('#plate-arrival img', { scale: 1.06, duration: 1.4, ease: 'none' }, 20.6);
      tl.to('#plate-arrival', { opacity: 0, duration: 0.3, ease: 'power2.in' }, 21.7);` : ''}

      /* ---------- s1 OPEN (0-1.6) ---------- */
      waterfall('#open-l1 .w', 0.16, 0.13, 55);
      tl.to('#open-rule', { scaleX: 1, duration: 0.3, ease: 'power3.out' }, 0.62);

      /* ---------- SEAM @1.6 -> LOAD ---------- */
      cutLeft(1.6, '#open-inner', '#sc-open', '#load-inner', '#sc-load');

      /* ---------- s2 LOAD (1.6-3.4): three tiles slam in ---------- */
      [1.65, 2.05, 2.5].forEach(function (t, i) {
        var tile = '#tile-' + (i + 1);
        tl.set(tile, { opacity: 1 }, t);
        tl.fromTo(tile, { scale: 1.5, x: 120 }, { scale: 1, x: 0, duration: 0.24, ease: 'power4.in', immediateRender: false }, t);
        if (i === 2) shake(t + 0.24, [[4, -3], [-4, 3], [2, 2], [0, 0]]);
      });

      /* ---------- SEAM @3.4 -> PILE ---------- */
      cutLeft(3.4, '#load-inner', '#sc-load', '#pile', '#sc-pile');

      /* ---------- s3 PILE (3.4-5.0): cards rain, caption sags ---------- */
      ${PILE.map(([, , r], i) => `tl.set('#pc-${i}', { opacity: 1, y: -700 }, ${(3.42 + i * 0.055).toFixed(3)});
      tl.to('#pc-${i}', { y: 0, rotation: ${r}, duration: 0.42, ease: 'power2.in' }, ${(3.42 + i * 0.055).toFixed(3)});`).join('\n      ')}
      shake(4.25, [[3, 5], [-3, 3], [2, -2], [0, 0]]);
      tl.set('#pile-line', { opacity: 1, y: 40 }, 4.15);
      tl.to('#pile-line', { y: 0, duration: 0.3, ease: 'power3.out' }, 4.15);
      pileLetters.forEach(function (lt, i) { tl.to(lt, { y: sagY(i), rotation: sagR(i), duration: 0.5, ease: 'power2.inOut' }, 4.45 + i * 0.02); });

      /* ---------- SEAM @5.0 -> DOUBT ---------- */
      cutLeft(5.0, '#pile', '#sc-pile', '#doubt-1', '#sc-doubt');

      /* ---------- s4 DOUBT (5.0-6.1): rack-focus swap at 5.55 ---------- */
      tl.to('#doubt-1', { x: -80, scale: 1.06, filter: 'blur(12px)', duration: 0.3, ease: 'power2.in' }, 5.25);
      tl.set('#doubt-1', { opacity: 0 }, 5.55);
      tl.set('#doubt-2', { opacity: 1 }, 5.55);
      tl.fromTo('#doubt-2', { x: 80, scale: 1.06, filter: 'blur(12px)' }, { x: 0, scale: 1, filter: 'blur(0px)', duration: 0.35, ease: 'power2.out', immediateRender: false }, 5.55);

      /* ---------- s5 COST (6.1-6.5): the mocking line wobbles in over the dimmed doubt ---------- */
      tl.to('#sc-doubt', { opacity: 0.1, duration: 0.15, ease: 'power2.in' }, 6.1);
      tl.to('#doubt-2', { filter: 'blur(14px)', duration: 0.15, ease: 'power2.in' }, 6.1);
      tl.set('#sc-cost', { opacity: 1 }, 6.1);
      tl.fromTo('#cost-line', { scale: 1.35, rotation: -7 }, { scale: 1, rotation: -1.5, duration: 0.24, ease: 'back.out(2.5)', immediateRender: false }, 6.1);

      /* ---------- THE DROP @6.5: crush, wash, palette turns, the name lands ---------- */
      tl.to('#cost-line', { scaleY: 0.05, duration: 0.15, ease: 'power4.in' }, 6.35);
      tl.to('#doubt-2', { scaleY: 0.05, duration: 0.15, ease: 'power4.in' }, 6.35);
      tl.set(['#sc-doubt', '#sc-cost'], { opacity: 0 }, 6.5);
      tl.to('#bg', { backgroundColor: ${js(vars.canvas)}, duration: 0.45, ease: 'power2.out' }, 6.5);
      tl.fromTo('#wash', { autoAlpha: 0.22 }, { autoAlpha: 0, duration: 0.3, ease: 'power3.out', immediateRender: false }, 6.5);
      shake(6.5, [[5, -4], [-6, 4], [5, 4], [-4, -4], [3, 3], [-2, -2], [1, 1], [0, 0]]);
      tl.set('#sc-drop', { opacity: 1 }, 6.5);
      tl.to('#drop-glow', { opacity: 0.32, duration: 0.35, ease: 'power2.out' }, 6.5);
      tl.to('#drop-glow', { opacity: 0.16, duration: 1.4, ease: 'power2.inOut' }, 6.9);
      tl.fromTo('#drop-inner', { scale: 1.14 }, { scale: 1, duration: 0.45, ease: 'expo.out', immediateRender: false }, 6.5);
      tl.fromTo('#drop-name', { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.18, ease: 'power4.out', immediateRender: false }, 6.54);
      ${logoImg ? `tl.fromTo('#drop-logo', { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25, ease: 'power3.out', immediateRender: false }, 6.62);` : ''}
      tl.set('#drop-line', { opacity: 1 }, 7.0);
      tl.fromTo('#drop-line', { scale: 1.9 }, { scale: 1, duration: 0.2, ease: 'power4.in', immediateRender: false }, 7.0);
      shake(7.2, [[2, -2], [0, 0]]);
      /* the batch track appears and fills through the groove */
      tl.set('#track', { opacity: 1 }, 6.8);
      tl.to('#track-fill', { scaleX: 1, duration: 12.2, ease: 'none' }, 6.8);

      /* ---------- SEAM @8.5 -> STEP 1 ---------- */
      cutLeft(8.5, '#drop-inner', '#sc-drop', '#s1-inner', '#sc-s1');
      waterfall('#s1-label .w', 8.6, 0.12, 50);
      tl.set('#field', { opacity: 1, y: 40 }, 8.9);
      tl.to('#field', { y: 0, duration: 0.3, ease: 'power3.out' }, 8.9);
      var TYPE_DT = 0.012;
      typed.forEach(function (chars, li) {
        chars.forEach(function (c, i) { tl.set(c, { opacity: 1 }, 9.05 + li * 0.42 + i * TYPE_DT); });
      });
      tl.set('#s1-run', { opacity: 1, scale: 0.85 }, 10.05);
      tl.to('#s1-run', { scale: 1, duration: 0.2, ease: 'back.out(3)' }, 10.05);
      tl.to('#s1-run', { scale: 0.94, duration: 0.08, ease: 'power2.in' }, 10.3);
      tl.to('#s1-run', { scale: 1, duration: 0.14, ease: 'power2.out' }, 10.38);

      /* ---------- SEAM @10.5 -> STEP 2 ---------- */
      cutLeft(10.5, '#s1-inner', '#sc-s1', '#s2-inner', '#sc-s2');
      waterfall('#s2-label .w', 10.6, 0.12, 50);
      [0, 1, 2, 3, 4].forEach(function (i) {
        tl.set('#row-' + i, { opacity: 1, x: 60 }, 10.75 + i * 0.06);
        tl.to('#row-' + i, { x: 0, duration: 0.25, ease: 'power3.out' }, 10.75 + i * 0.06);
      });
      tl.set('#scan', { opacity: 1, y: 0 }, 11.0);
      tl.to('#scan', { y: 710, duration: 1.15, ease: 'none' }, 11.0);
      tl.set('#scan', { opacity: 0 }, 12.15);
      [0, 1, 2, 3, 4].forEach(function (i) {
        var t = 11.08 + i * 0.23;
        tl.set('#chip-' + i, { opacity: 1, scale: 0.6 }, t);
        tl.to('#chip-' + i, { scale: 1, duration: 0.22, ease: 'back.out(2.5)' }, t);
      });

      /* ---------- SEAM @12.5 -> STEP 3 ---------- */
      cutLeft(12.5, '#s2-inner', '#sc-s2', '#s3-inner', '#sc-s3');
      waterfall('#s3-label .w', 12.6, 0.12, 50);
      tl.to('#tlline', { scaleX: 1, duration: 0.4, ease: 'power3.out' }, 12.75);
      [0, 1, 2, 3, 4, 5, 6, 7, 8].forEach(function (i) {
        tl.set('#dot-' + i, { opacity: 1, scale: 0.3 }, 12.85 + i * 0.05);
        tl.to('#dot-' + i, { scale: 1, duration: 0.2, ease: 'back.out(3)' }, 12.85 + i * 0.05);
      });
      tl.set('#tl-marker', { opacity: 1, scaleY: 0 }, 13.35);
      tl.to('#tl-marker', { scaleY: 1, duration: 0.2, ease: 'power4.in' }, 13.35);
      tl.set('#tl-marker-label', { opacity: 1, y: -14 }, 13.5);
      tl.to('#tl-marker-label', { y: 0, duration: 0.15, ease: 'power3.out' }, 13.5);
      [0, 1, 2, 3, 4].forEach(function (i) {
        tl.to('#dot-' + i, { backgroundColor: ${js(vars.alert)}, scale: 1.25, duration: 0.12, ease: 'power2.out' }, 13.65 + i * 0.05);
        tl.to('#dot-' + i, { scale: 1, duration: 0.15, ease: 'power2.in' }, 13.77 + i * 0.05);
      });
      tl.set('#tl-chip', { opacity: 1, y: 30, scale: 0.8 }, 14.0);
      tl.to('#tl-chip', { y: 0, scale: 1, duration: 0.22, ease: 'back.out(2.5)' }, 14.0);
      shake(14.0, [[3, 2], [-2, -2], [0, 0]]);

      /* ---------- SEAM @14.5 -> PRODUCT ---------- */
      cutLeft(14.5, '#s3-inner', '#sc-s3', '#prod-inner', '#sc-prod');
      ${screenshot ? `tl.fromTo('#shot', { scale: 1 }, { scale: 1.14, duration: 2.1, ease: 'none', immediateRender: false }, 14.5);` : ''}
      tl.set('#prod-line', { opacity: 1, y: 40 }, 15.0);
      tl.to('#prod-line', { y: 0, duration: 0.3, ease: 'power3.out' }, 15.0);

      /* ---------- SEAM @16.6 -> PAYOFF ---------- */
      cutLeft(16.6, '#prod-inner', '#sc-prod', '#pay-inner', '#sc-pay');
      tl.fromTo('#pay-row', { scale: 1.3 }, { scale: 1, duration: 0.35, ease: 'expo.out', immediateRender: false }, 16.6);
      var timerProxy = { s: ${timerSeconds} };
      var timerEl = $id('pay-timer');
      tl.to(timerProxy, { s: 0, duration: 1.5, ease: 'power2.in', onUpdate: function () {
        var s = Math.max(0, Math.round(timerProxy.s)); var m = Math.floor(s / 60); var r = s % 60;
        timerEl.textContent = (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r;
      } }, 16.8);
      tl.set('#pay-line', { opacity: 1, y: 30 }, 17.0);
      tl.to('#pay-line', { y: 0, duration: 0.25, ease: 'power3.out' }, 17.0);
      [0, 1, 2, 3].forEach(function (i) {
        tl.set('#chk-' + i, { opacity: 1, x: 30 }, 17.15 + i * 0.22);
        tl.to('#chk-' + i, { x: 0, duration: 0.2, ease: 'power3.out' }, 17.15 + i * 0.22);
        tl.set('#chk-' + i, { className: 'chk on' }, 17.4 + i * 0.22);
      });

      /* ---------- SEAM @18.6 -> BREATHE ---------- */
      cutLeft(18.6, '#pay-inner', '#sc-pay', '#breathe-inner', '#sc-breathe');
      tl.set('#b-cursor', { opacity: 0 }, 19.05);
      tl.set('#b-cursor', { opacity: 1 }, 19.2);
      tl.set('#b-cursor', { opacity: 0 }, 19.5);
      tl.set('#b-cursor', { opacity: 1 }, 19.65);
      tl.to('#track', { opacity: 0, duration: 0.3 }, 19.0);

      /* ---------- SEAM @20.0: INVERSE zoom arrival on the impact ---------- */
      tl.to('#breathe-inner', { scale: 0.8, filter: 'blur(10px)', duration: 0.2, ease: 'power3.in' }, 19.8);
      tl.to('#sc-breathe', { opacity: 0.15, duration: 0.2, ease: 'none' }, 19.8);
      tl.set('#sc-breathe', { opacity: 0 }, 20.0);
      tl.fromTo('#arr-inner', { scale: 1.25, filter: 'blur(10px)' }, { scale: 1, filter: 'blur(0px)', duration: 0.5, ease: 'expo.out', immediateRender: false }, 20.0);
      tl.fromTo('#sc-arr', { opacity: 0.15 }, { opacity: 1, duration: 0.5, ease: 'expo.out', immediateRender: false }, 20.0);
      ${v.arrive_chip ? `tl.set('#arr-chip', { opacity: 1, y: 36 }, 20.65);
      tl.to('#arr-chip', { y: 0, duration: 0.13, ease: 'power4.out' }, 20.65);` : ''}

      /* ---------- SEAM @22.0 -> LOCKUP, held in the fade ---------- */
      cutLeft(22.0, '#arr-inner', '#sc-arr', '#lock-inner', '#sc-lock');
      var lockProxy = { w: 300 };
      var lockTopEl = $id('lock-top');
      tl.to(lockProxy, { w: 560, duration: 0.55, ease: 'power2.out', onUpdate: function () { lockTopEl.style.fontVariationSettings = "'wght' " + lockProxy.w.toFixed(0); } }, 22.05);
      tl.to('#lock-divider', { scaleX: 1, duration: 0.3, ease: 'power3.out' }, 22.3);

      window.__timelines[${js(compositionId)}] = tl;
      tl.seek(0);
    </script>
  </body>
</html>
`;
}
