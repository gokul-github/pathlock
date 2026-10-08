# Pathlock

Interactive bench for HDCP on a cockpit streaming path.

It shows where a title from a streaming app is decrypted, where the head-unit serializer encrypts the cable to the display, which keys cross that link, and what the trusted execution environment is responsible for.

```bash
npm install
npm run dev
```

The dev server listens on port 8080. Values shown in a session are simulated. `lc128` and the receiver private key are never displayed.
