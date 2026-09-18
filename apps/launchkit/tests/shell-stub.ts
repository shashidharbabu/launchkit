// Minimal stand-in for the shell package: the gate test never reaches checkout.
export class ConnectionManager {
  static getInstance() { return new ConnectionManager(); }
  emit(_event: string, _payload: unknown) { /* no shell in a node test */ }
}
