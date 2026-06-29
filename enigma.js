const ROTOR_DATA = {
 wiring: [
  "EKMFLGDQVZNTOWYHXUSPAIBRCJ",
  "AJDKSIRUXBLHWTMCQGZNPYFVOE",
  "BDFHJLCPRTXVZNYEIWGAKMUSQO",
  "ESOVPZJAYQUIRHXLNFTGKDCMWB",
  "VZBRGITYUPSDNHLXAWMJQOFECK"
 ],
 notches: ['Q', 'E', 'V', 'J', 'Z'],
 reflectors: [
  "EJMZALYXVBWFCRQUONTSPIKHGD",
  "YRUHQSLDPXNGOKMIEBFZCWVJAT",
  "FVPJIAOYEDRZXWGCTKUQSBNMHL"
 ]
};

class Rotor {
 constructor(wiring, notch, ringSetting, position) {
  this.wiring = wiring;
  this.notch = notch;
  this.ringSetting = ringSetting;
  this.position = position;
  this.inverseWiring = new Array(26);
  this.buildInverse();
 }

 buildInverse() {
  for (let i = 0; i < 26; i++) {
   this.inverseWiring[this.wiring.charCodeAt(i) - 65] = String.fromCharCode(65 + i);
  }
 }

 encodeForward(input) {
  const offset = (this.position - this.ringSetting + 26) % 26;
  const inIndex = (input.charCodeAt(0) - 65 + offset) % 26;
  const wired = this.wiring[inIndex];
  const outIndex = (wired.charCodeAt(0) - 65 - offset + 26) % 26;
  return String.fromCharCode(65 + outIndex);
 }

 encodeReverse(input) {
  const offset = (this.position - this.ringSetting + 26) % 26;
  const inIndex = (input.charCodeAt(0) - 65 + offset) % 26;
  const wired = this.inverseWiring[inIndex];
  const outIndex = (wired.charCodeAt(0) - 65 - offset + 26) % 26;
  return String.fromCharCode(65 + outIndex);
 }

 atNotch() {
  return this.position === this.notch.charCodeAt(0) - 65;
 }

 step() {
  this.position = (this.position + 1) % 26;
 }

 setPosition(pos) {
  this.position = pos;
 }
}

class Reflector {
 constructor(wiring) {
  this.wiring = wiring;
 }

 reflect(input) {
  return this.wiring[input.charCodeAt(0) - 65];
 }
}

class Plugboard {
 constructor() {
  this.mapping = [];
  for (let i = 0; i < 26; i++) {
   this.mapping[i] = String.fromCharCode(65 + i);
  }
 }

 swap(a, b) {
  this.mapping[a.charCodeAt(0) - 65] = b;
  this.mapping[b.charCodeAt(0) - 65] = a;
 }

 encode(input) {
  return this.mapping[input.charCodeAt(0) - 65];
 }
}

class EnigmaMachine {
 constructor(r1, r2, r3, reflector, plugboard) {
  this.r1 = r1;
  this.r2 = r2;
  this.r3 = r3;
  this.reflector = reflector;
  this.plugboard = plugboard;
 }

 stepRotors() {
  const r1AtNotch = this.r1.atNotch();
  const r2AtNotch = this.r2.atNotch();
  if (r2AtNotch) { this.r2.step(); this.r3.step(); }
  else if (r1AtNotch) { this.r2.step(); }
  this.r1.step();
 }

 encodeChar(input) {
  this.stepRotors();

  let c = this.plugboard.encode(input);
  c = this.r1.encodeForward(c);
  c = this.r2.encodeForward(c);
  c = this.r3.encodeForward(c);
  c = this.reflector.reflect(c);
  c = this.r3.encodeReverse(c);
  c = this.r2.encodeReverse(c);
  c = this.r1.encodeReverse(c);
  c = this.plugboard.encode(c);

  return c;
 }
}
