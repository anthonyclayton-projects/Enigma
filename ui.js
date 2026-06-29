// ── Default config: Rotors I II III left-to-right, Reflector B, all positions A ──
const state = {
 rotorIds: [0, 1, 2],     // indices into ROTOR_DATA.wiring (0=I, 1=II, 2=III)
 reflectorId: 1,           // 1 = Reflector B
 ringSettings: [0, 0, 0]  // 0 = ring setting A for each slot
};

// Build a fresh machine from state (called once at startup; rebuild on config change)
function buildMachine() {
 const plugboard = new Plugboard();
 const reflector = new Reflector(ROTOR_DATA.reflectors[state.reflectorId]);

 // HTML slot 0 = Left  = machine's r3 (slowest rotor)
 // HTML slot 1 = Middle = machine's r2
 // HTML slot 2 = Right = machine's r1 (steps every keypress)
 const r3 = new Rotor(
  ROTOR_DATA.wiring[state.rotorIds[0]],
  ROTOR_DATA.notches[state.rotorIds[0]],
  state.ringSettings[0], 0
 );
 const r2 = new Rotor(
  ROTOR_DATA.wiring[state.rotorIds[1]],
  ROTOR_DATA.notches[state.rotorIds[1]],
  state.ringSettings[1], 0
 );
 const r1 = new Rotor(
  ROTOR_DATA.wiring[state.rotorIds[2]],
  ROTOR_DATA.notches[state.rotorIds[2]],
  state.ringSettings[2], 0
 );

 return new EnigmaMachine(r1, r2, r3, reflector, plugboard);
}

let machine = buildMachine();

// ── Helpers ──

// Read current rotor positions out of the machine and update the three windows
function syncRotorWindows() {
 document.getElementById('rotor-0').textContent =
  String.fromCharCode(65 + machine.r3.position);
 document.getElementById('rotor-1').textContent =
  String.fromCharCode(65 + machine.r2.position);
 document.getElementById('rotor-2').textContent =
  String.fromCharCode(65 + machine.r1.position);
}

// Given a slot number (0/1/2), return the matching Rotor object
function rotorForSlot(slot) {
 return slot === 0 ? machine.r3 : slot === 1 ? machine.r2 : machine.r1;
}

// Show current ring settings in the three small displays
function syncRingDisplays() {
 for (let i = 0; i < 3; i++) {
  document.getElementById(`ring-${i}`).textContent = state.ringSettings[i] + 1;
 }
}

// Rebuild the machine with updated ring settings, preserving current rotor positions
function rebuildMachine() {
 const savedPositions = [
  machine.r3.position,
  machine.r2.position,
  machine.r1.position
 ];
 machine = buildMachine();
 machine.r3.position = savedPositions[0];
 machine.r2.position = savedPositions[1];
 machine.r1.position = savedPositions[2];
 syncRotorWindows();
}

// Track whichever key + lamp are currently active so we can release them
let activeKeyEl  = null;
let activeLampEl = null;
let activePhysicalKey = null; // which physical keyboard key is held down

// Release whatever is currently lit/pressed
function releaseKey() {
 if (activeKeyEl)  activeKeyEl.classList.remove('pressed');
 if (activeLampEl) activeLampEl.classList.remove('lit');
 activeKeyEl  = null;
 activeLampEl = null;
}

// ── Core action: press one key ──
function pressKey(letter) {
 // encodeChar() steps the rotors internally, then returns the encrypted letter
 const encoded = machine.encodeChar(letter);

 // Sync windows immediately after the step
 syncRotorWindows();

 const keyEl  = document.querySelector(`[data-key="${letter}"]`);
 const lampEl = document.getElementById(`lamp-${encoded}`);
 const tape   = document.getElementById('output-tape');

 // Clear any previously held key/lamp before activating the new one
 releaseKey();

 if (keyEl)  keyEl.classList.add('pressed');
 if (lampEl) lampEl.classList.add('lit');

 activeKeyEl  = keyEl;
 activeLampEl = lampEl;

 // Group output into blocks of 5 (standard Enigma operator convention)
 const currentText = tape.textContent.replace(/ /g, '');
 const newText = currentText + encoded;
 tape.textContent = newText.match(/.{1,5}/g).join(' ') || '';
}

// ── Event listeners ──

// On-screen key clicks: press on mousedown, release on mouseup anywhere
document.querySelectorAll('.key').forEach(el => {
 el.addEventListener('mousedown', () => pressKey(el.dataset.key));
});

// mouseup anywhere — covers cases where the cursor drifted off the key
document.addEventListener('mouseup', releaseKey);

// Physical keyboard — keydown encodes (once), keyup releases
document.addEventListener('keydown', e => {
 if (e.repeat) return; // held key: don't encode again
 if (e.altKey || e.ctrlKey || e.metaKey) return;
 const ch = e.key.toUpperCase();
 if (ch.length === 1 && ch >= 'A' && ch <= 'Z') {
  e.preventDefault();
  activePhysicalKey = ch;
  pressKey(ch);
 }
});

document.addEventListener('keyup', e => {
 const ch = e.key.toUpperCase();
 if (ch === activePhysicalKey) {
  activePhysicalKey = null;
  releaseKey();
 }
});

// Rotor up / down buttons
document.querySelectorAll('.rotor-btn').forEach(btn => {
 btn.addEventListener('click', () => {
  const slot  = parseInt(btn.dataset.rotor);
  const rotor = rotorForSlot(slot);
  // +1 for up, +25 mod 26 = -1 for down (avoids negative modulo)
  const delta = btn.classList.contains('up') ? 1 : 25;
  rotor.position = (rotor.position + delta) % 26;
  syncRotorWindows();
 });
});

// Ring setting +/− buttons
// Changing ring setting rewires the rotor internally, so the machine must be rebuilt
document.querySelectorAll('.ring-btn').forEach(btn => {
 btn.addEventListener('click', () => {
  const slot  = parseInt(btn.dataset.rotor);
  const dir   = parseInt(btn.dataset.dir); // +1 or -1
  const delta = dir === 1 ? 1 : 25;        // +25 mod 26 = -1, avoids negative modulo
  state.ringSettings[slot] = (state.ringSettings[slot] + delta) % 26;
  syncRingDisplays();
  rebuildMachine();
 });
});

// ── Startup ──
syncRotorWindows();
syncRingDisplays();
