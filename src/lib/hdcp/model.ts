export type ServiceId = "netflix" | "disney" | "prime";
export type SinkId = "panel23" | "panel14" | "dongle" | "revoked" | "repeater";
export type ResId = "720p" | "1080p" | "2160p";
export type RuleId = "strict" | "legacy720";
export type BlockId =
  | "app"
  | "license"
  | "tee"
  | "pipeline"
  | "serializer"
  | "link"
  | "receiver"
  | "panel";
export type LockId = "cenc" | "cage" | "hdcp";
export type Tile = "cenc" | "clear" | "cipher" | "black" | "idle";

export type Input = {
  service: ServiceId;
  sink: SinkId;
  resolution: ResId;
  rule: RuleId;
};

export type Wire = {
  from: string;
  to: string;
  msg: string;
  rows: { k: string; v: string }[];
};

export type Stage = {
  id: string;
  title: string;
  block: BlockId;
  lock: LockId | "policy";
  tone: "cipher" | "clear" | "fail";
  lead: string;
  body: string;
  wire: Wire | null;
  picture: {
    app: Tile;
    tee: Tile;
    cable: Tile;
    panel: Tile;
    caption: string;
  };
};

export type KeyRow = {
  symbol: string;
  bits: string;
  holder: string;
  transit: string;
  note: string;
  value?: string;
  /** Stage index at which this row resolves. */
  at: number;
  state: "sealed" | "visible" | "withheld";
};

export type Session = {
  protocol: "hdcp22" | "hdcp14" | "aborted";
  ok: boolean;
  headline: string;
  detail: string;
  floor: string;
  stages: Stage[];
  keys: KeyRow[];
};

export const SERVICES: { id: ServiceId; name: string; stack: string }[] = [
  { id: "netflix", name: "Netflix", stack: "Widevine L1 on Android Automotive" },
  { id: "disney", name: "Disney+", stack: "Widevine L1, same secure decoder" },
  { id: "prime", name: "Prime Video", stack: "Widevine L1, or PlayReady on QNX" },
];

export const SINKS: { id: SinkId; name: string; meta: string }[] = [
  { id: "panel23", name: "Center display · HDCP 2.3", meta: "Deserializer holds a DCP-signed certificate" },
  { id: "panel14", name: "Legacy cluster · HDCP 1.4", meta: "Device keys and a KSV, no 2.2 certificate" },
  { id: "dongle", name: "Capture dongle", meta: "Taps the coax. No valid certificate" },
  { id: "revoked", name: "Revoked receiver", meta: "Certificate is real. Receiver ID is on the SRM" },
  { id: "repeater", name: "Seat-back repeater", meta: "Downstream passenger screen is not HDCP 2.2" },
];

export const RESOLUTIONS: { id: ResId; name: string }[] = [
  { id: "720p", name: "720p" },
  { id: "1080p", name: "1080p" },
  { id: "2160p", name: "4K" },
];

export const LOCKS: { id: LockId; n: string; title: string; body: string }[] = [
  {
    id: "cenc",
    n: "01",
    title: "Service encryption ends in the TEE",
    body: "The app only stores CENC ciphertext. The content key is unwrapped inside OEMCrypto, never in Android.",
  },
  {
    id: "cage",
    n: "02",
    title: "Plaintext exists only inside the housing",
    body: "Decoded frames cross a few centimetres of on-board MIPI DSI to the serializer. Software cannot read them back.",
  },
  {
    id: "hdcp",
    n: "03",
    title: "HDCP encryption starts in the serializer",
    body: "The serializer OTP holds the link secrets. It AES-encrypts the cable so the coax never carries pixels.",
  },
];

export const GROUPS: {
  id: string;
  name: string;
  note: string;
  blocks: BlockId[];
  bridge?: string;
}[] = [
  {
    id: "cloud",
    name: "Outside the car",
    note: "Studio license",
    blocks: ["license"],
    bridge: "License is wrapped to this head unit. The content key is not in it.",
  },
  {
    id: "hu",
    name: "Head unit · metal housing",
    note: "REE, TEE, serializer",
    blocks: ["app", "tee", "pipeline", "serializer"],
    bridge: "Cable leaves the box here. HDCP ciphertext from this point.",
  },
  {
    id: "wire",
    name: "Vehicle harness",
    note: "GMSL, FPD-Link, or HDMI",
    blocks: ["link"],
    bridge: "Sideband carries the handshake. Video payload is the cipher.",
  },
  {
    id: "disp",
    name: "Display",
    note: "Receiver and glass",
    blocks: ["receiver", "panel"],
  },
];

export const BLOCKS: Record<
  BlockId,
  { title: string; kicker: string; summary: string; holds: string; never: string }
> = {
  license: {
    title: "License server",
    kicker: "Cloud",
    summary: "After attestation, wraps the content key to this device and states the HDCP floor.",
    holds: "Content key, wrapped for the keybox. Output rules.",
    never: "Does not see lc128, the serializer OTP, or pixels.",
  },
  app: {
    title: "Streaming app",
    kicker: "Rich OS",
    summary: "Netflix, Disney+, or Prime Video. Queues encrypted samples and a protected surface.",
    holds: "CENC segments, a MediaDrm session, a Surface the compositor will not screenshot.",
    never: "Content key, plaintext frames, lc128, ks.",
  },
  tee: {
    title: "Trusted execution environment",
    kicker: "TrustZone",
    summary: "OEMCrypto decrypts the title. A policy TA blanks the plane if the sink is too weak.",
    holds: "Keybox, unwrapped content key, SRM check, attestation key.",
    never: "Does not hold the serializer’s lc128. That key is on another chip.",
  },
  pipeline: {
    title: "Secure video path",
    kicker: "SoC hardware",
    summary: "Decoder output and the hardware composer. Plaintext, but not mapped into Android.",
    holds: "Protected buffers. A scanout switch the TEE can force off.",
    never: "No readback, no screen record, no cast onto an ordinary virtual display.",
  },
  serializer: {
    title: "Serializer · HDCP transmitter",
    kicker: "Link chip",
    summary: "Drives the long cable. Runs AKE, locality, and SKE in hardware, then AES-CTR.",
    holds: "lc128 in OTP. DCP public key to check certificates. HDCP 1.4 device keys if dual-mode.",
    never: "Head-unit software can start auth and read status. It cannot read the OTP back.",
  },
  link: {
    title: "Cable",
    kicker: "Off board",
    summary: "Coax or shielded pair. A tap here sees the handshake and ciphertext, not the picture.",
    holds: "Public messages: nonces, certificate, wrapped km, wrapped ks, riv.",
    never: "km in the clear, ks in the clear, lc128, kpriv, pixels.",
  },
  receiver: {
    title: "Deserializer · HDCP receiver",
    kicker: "In the display",
    summary: "Proves it owns kpriv by opening km, then decrypts the link into the timing controller.",
    holds: "Unique RSA private key. The same global lc128. Pairing key kh derived from kpriv.",
    never: "Will not export kpriv. A failed locality check means it never receives ks.",
  },
  panel: {
    title: "Panel",
    kicker: "Glass",
    summary: "Pixels exist again only after the receiver cipher. Chrome can stay up when video is withheld.",
    holds: "The picture, for the glass.",
    never: "A spliced capture device without keys gets noise, or a link that never authenticates.",
  },
};

export const TEE_APPS: { name: string; body: string }[] = [
  {
    name: "OEMCrypto / Widevine",
    body: "Trusted application that unwraps the content key with the device keybox and decrypts CENC samples into secure memory. It is what “Widevine L1” actually is. Disney+, Netflix, and Prime on Android Automotive all sit on it. A QNX head unit usually runs PlayReady SL3000 in the same role.",
  },
  {
    name: "HDCP policy",
    body: "Reads the serializer’s authentication result over a channel the rich OS cannot spoof. If the sink is below the license, or the Receiver ID is revoked, this TA turns the protected plane off. The streaming app then gets a DRM error. Maps and chrome are a different, unprotected layer and stay visible.",
  },
  {
    name: "SRM check",
    body: "Verifies the DCP signature on the System Renewability Message and keeps the revocation list. The streaming service ships updated lists. The check has to happen before km is sent, and only the top-level transmitter may decide.",
  },
  {
    name: "Attestation",
    body: "Signs boot state and “this TEE is genuine” so the license server will release a hardware-backed license. Without it the server answers with a software-level license, or refuses the title.",
  },
  {
    name: "Keymaster",
    body: "Android’s keystore inside the TEE. Used for app keys and disk wrapping. It is not where HDCP keys live. lc128 and the receiver private key are fused into the link chips, not imported into Keymaster.",
  },
  {
    name: "What is deliberately not a TA",
    body: "The cable cipher. With the keys in the serializer, AES-CTR runs in that chip’s HDCP engine. TrustZone never sees lc128. A compromised Android image still cannot decrypt the harness, and cannot mint a session toward a display the serializer has not authenticated.",
  },
];

const REVOKED_ID = "F0:1D:5A:7E:09";

export function floorOf(input: Input): string {
  if (input.rule === "legacy720" && input.resolution === "720p") return "HDCP 1.4 or higher";
  return "HDCP 2.2 or higher · Type 1";
}

export function serviceName(id: ServiceId): string {
  return SERVICES.find((s) => s.id === id)?.name ?? id;
}

export function preview(input: Input): { title: string; body: string } {
  const name = serviceName(input.service);
  const floor = floorOf(input);
  if (input.sink === "panel23") {
    return {
      title: "This display can take the title",
      body: `${name} will decrypt inside the TEE, the serializer will run HDCP 2.2/2.3 against the panel, and the coax will carry AES-CTR. The license floor is ${floor}.`,
    };
  }
  if (input.sink === "panel14" && floor.startsWith("HDCP 1.4")) {
    return {
      title: "Allowed only as HDCP 1.4 at 720p",
      body: "This older title’s license accepts HDCP 1.4 below 1080p. The serializer uses its 1.4 device keys, not the AES session. A current studio rule would refuse this panel.",
    };
  }
  if (input.sink === "panel14") {
    return {
      title: "Video plane stays black",
      body: `${name} asks for ${floor}. A 1.4 cluster can still show gauges and maps. It cannot show this protected plane.`,
    };
  }
  if (input.sink === "dongle") {
    return {
      title: "Handshake dies before any key is sent",
      body: "The dongle cannot return a DCP-signed certificate. The serializer aborts. km is never generated onto the wire.",
    };
  }
  if (input.sink === "revoked") {
    return {
      title: "Certificate is good. The ID is not.",
      body: `The SRM lists ${REVOKED_ID}. Authentication stops before the master key is encrypted to that display.`,
    };
  }
  return {
    title: "Repeater topology is rejected",
    body: "The seat-back box itself may speak HDCP 2.2, but its downstream list contains a screen that does not. Type 1 content must not flow.",
  };
}

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexBytes(rng: () => number, bytes: number): string {
  let s = "";
  for (let i = 0; i < bytes; i++) s += Math.floor(rng() * 256).toString(16).padStart(2, "0");
  return s.toUpperCase();
}

function grouped(hexStr: string): string {
  return hexStr.match(/.{1,2}/g)?.join(" ") ?? hexStr;
}

function id40(rng: () => number): string {
  return hexBytes(rng, 5).match(/.{1,2}/g)!.join(":");
}

function pic(
  app: Tile,
  tee: Tile,
  cable: Tile,
  panel: Tile,
  caption: string,
): Stage["picture"] {
  return { app, tee, cable, panel, caption };
}

export function buildSession(input: Input): Session {
  const rng = mulberry32(hashSeed(`${input.service}|${input.sink}|${input.resolution}|${input.rule}`));
  const name = serviceName(input.service);
  const floor = floorOf(input);
  const needs22 = floor.startsWith("HDCP 2.2");
  const rtx = grouped(hexBytes(rng, 8));
  const rrx = grouped(hexBytes(rng, 8));
  const rn = grouped(hexBytes(rng, 8));
  const km = grouped(hexBytes(rng, 16));
  const ks = grouped(hexBytes(rng, 16));
  const riv = grouped(hexBytes(rng, 8));
  const hprime = grouped(hexBytes(rng, 16));
  const lprime = grouped(hexBytes(rng, 16));
  const goodId = id40(rng);
  const repeaterId = id40(rng);
  const stages: Stage[] = [];

  const add = (s: Omit<Stage, "id">) => {
    stages.push({ ...s, id: `s${stages.length}` });
  };

  add({
    title: "Ciphertext sits in the app",
    block: "app",
    lock: "cenc",
    tone: "cipher",
    lead: `${name} is in the rich OS. The file it holds is still encrypted.`,
    body: "Segments are CENC (AES-CTR) inside fMP4. The app opens a MediaDrm session and queues samples to a secure decoder. It has a surface, not pixels. Screenshot and screen-record APIs skip this layer.",
    wire: {
      from: name,
      to: "MediaDrm",
      msg: "queue secure input buffers",
      rows: [
        { k: "sample", v: "CENC ciphertext" },
        { k: "key id", v: grouped(hexBytes(rng, 16)) },
        { k: "content key", v: "not present in this process" },
      ],
    },
    picture: pic("cenc", "idle", "idle", "black", "The title is still ciphertext inside the app. The panel is not showing it."),
  });

  add({
    title: "License wrapped to this TEE",
    block: "license",
    lock: "cenc",
    tone: "cipher",
    lead: "The license server will not hand the content key to Android.",
    body: `Attestation convinced the server this is a hardware TEE. The license wraps the content key to the keybox, and it sets the output rule: ${floor}. ${
      input.service === "prime"
        ? "On a QNX unit the same rule arrives inside a PlayReady license instead of Widevine."
        : "Netflix and Disney+ express that rule as an HDCP level inside the Widevine license."
    } The app carries the opaque license blob. It cannot unwrap it.`,
    wire: {
      from: "License server",
      to: "TEE",
      msg: "license response",
      rows: [
        { k: "content key", v: "wrapped to device keybox" },
        { k: "HDCP floor", v: floor },
        { k: "resolution", v: input.resolution === "2160p" ? "2160p" : input.resolution },
      ],
    },
    picture: pic("cenc", "idle", "idle", "black", "A wrapped content key is in transit to the TEE. Pixels still do not exist."),
  });

  add({
    title: "OEMCrypto opens the content key",
    block: "tee",
    lock: "cenc",
    tone: "clear",
    lead: "First time the picture exists — and only inside secure memory.",
    body: "The Widevine trusted application unwraps the content key and decrypts samples into buffers the rich OS is not allowed to map. This is DRM decryption, not HDCP. The serializer has not been involved yet. lc128 has not been used. If the policy TA later rejects the display, these frames are simply never scanned out.",
    wire: {
      from: "OEMCrypto",
      to: "secure heap",
      msg: "decrypt samples",
      rows: [
        { k: "algorithm", v: "AES-CTR (CENC)" },
        { k: "content key", v: "unwrapped, TEE only" },
        { k: "output", v: "protected buffers" },
      ],
    },
    picture: pic("cenc", "clear", "idle", "black", "Clear frames exist in the TEE. The cable and the glass still have nothing."),
  });

  add({
    title: "Composer holds the protected plane",
    block: "pipeline",
    lock: "cage",
    tone: "clear",
    lead: "Inside the housing the hop to the serializer is plaintext.",
    body: "The hardware composer can scan the protected layer onto the SoC’s display output. On this design that output is short-reach MIPI DSI (or OLDI) to the serializer, a few centimetres of PCB. There is no HDCP on that hop. What protects it is the metal housing and the fact that CPU software cannot read the buffers. HDCP starts in the next chip — the one that faces a cable someone can unplug.",
    wire: null,
    picture: pic(
      "cenc",
      "clear",
      "idle",
      "black",
      "Plaintext is caged on the board, between SoC and serializer. It has not left the head unit.",
    ),
  });

  const baseKeys: KeyRow[] = [
    {
      symbol: "CK",
      bits: "128",
      holder: "License server, then TEE only",
      transit: "Wrapped to the keybox. Never on the display cable.",
      note: "Content key for the streaming service. Unrelated to HDCP.",
      value: "unwrapped inside OEMCrypto",
      at: 2,
      state: "sealed",
    },
    {
      symbol: "lc128",
      bits: "128",
      holder: "Every HDCP device OTP — serializer and display",
      transit: "Never transmitted.",
      note: "Global constant mixed into the content cipher as ks ⊕ lc128. Provisioned to adopters, not readable from software.",
      at: 0,
      state: "sealed",
    },
    {
      symbol: "kpriv",
      bits: "1024 RSA",
      holder: "Display receiver only",
      transit: "Never transmitted.",
      note: "Opens Ekpub(km). Pairing key kh is SHA-256(kpriv) truncated to 128 bits.",
      at: 0,
      state: "sealed",
    },
  ];

  const abort = (headline: string, detail: string, extraKeys: KeyRow[]): Session => ({
    protocol: "aborted",
    ok: false,
    headline,
    detail,
    floor,
    stages,
    keys: [...baseKeys, ...extraKeys],
  });

  if (input.sink === "dongle") {
    add({
      title: "Serializer sends AKE_Init",
      block: "serializer",
      lock: "hdcp",
      tone: "cipher",
      lead: "The link chip, not Android, starts authentication.",
      body: "The HDCP engine in the serializer draws a 64-bit nonce r_tx and writes AKE_Init on the sideband (I2C tunnel, DDC, or the GMSL control channel). The timer that waits for a certificate is in the chip. A kernel thread is too jittery to police it.",
      wire: {
        from: "Serializer",
        to: "Sink",
        msg: "AKE_Init",
        rows: [
          { k: "r_tx", v: rtx },
          { k: "TxCaps", v: "HDCP 2.3 transmitter, not a repeater" },
        ],
      },
      picture: pic("cenc", "clear", "idle", "black", "A nonce is on the sideband. No video key has been offered."),
    });
    add({
      title: "No certificate comes back",
      block: "receiver",
      lock: "hdcp",
      tone: "fail",
      lead: "A capture dongle cannot produce cert_rx.",
      body: "A real receiver answers AKE_Send_Cert within 100 ms: a DCP-signed certificate, its own nonce r_rx, and RxCaps. The dongle has no private key and no certificate. The serializer aborts. It never generates km, so there is nothing useful to record off the coax. The policy TA blanks the protected plane. Gauges, maps, and the app chrome stay up; the video rectangle goes black and the app surfaces an HDCP error.",
      wire: {
        from: "Sink",
        to: "Serializer",
        msg: "AKE_Send_Cert — missing",
        rows: [
          { k: "timeout", v: "100 ms, enforced in the serializer" },
          { k: "km", v: "not generated" },
        ],
      },
      picture: pic("cenc", "clear", "idle", "black", "Protected video is withheld. The cable never carries this title."),
    });
    return abort(
      "Video withheld · no receiver",
      "Encryption never starts, because authentication never starts. The content key remains inside the TEE.",
      [
        {
          symbol: "r_tx",
          bits: "64",
          holder: "Serializer",
          transit: "Sent in the clear",
          note: "Nonce. Not a secret.",
          value: rtx,
          at: 4,
          state: "visible",
        },
        {
          symbol: "km",
          bits: "128",
          holder: "Would be created by the serializer",
          transit: "Not sent",
          note: "Aborted before key exchange.",
          at: 5,
          state: "withheld",
        },
      ],
    );
  }

  if (input.sink === "panel14" && needs22) {
    add({
      title: "Sink can only speak HDCP 1.4",
      block: "serializer",
      lock: "policy",
      tone: "fail",
      lead: "The cluster answers with a KSV, not a 2.2 certificate.",
      body: "HDCP 1.4 identifies a device with a 40-bit KSV and protects video with a stream cipher built from 40 secret 56-bit device keys. Those keys, if this serializer is dual-mode, also sit in its OTP — but a Type 1 license will not accept that cipher. The 1.4 model has been publicly broken for years. The policy TA keeps the protected plane off. The cluster can still authenticate 1.4 for ordinary HMI if the program allows it; that session is a different layer and does not carry this title.",
      wire: {
        from: "Cluster",
        to: "Serializer",
        msg: "HDCP 1.4 BKSV",
        rows: [
          { k: "BKSV", v: id40(rng) },
          { k: "2.2 certificate", v: "not supported" },
          { k: "license floor", v: floor },
        ],
      },
      picture: pic("cenc", "clear", "idle", "black", "The panel may show the shell UI. The movie plane is black."),
    });
    return abort(
      "Video withheld · HDCP 1.4 is not enough",
      `${name} required ${floor}. The TEE decrypted the title and then refused to scan it out.`,
      [
        {
          symbol: "BKSV",
          bits: "40",
          holder: "Display",
          transit: "Sent in the clear",
          note: "Selects which of the transmitter’s 1.4 device keys to combine. Not used for this title.",
          value: "seen, then ignored",
          at: 4,
          state: "visible",
        },
        {
          symbol: "km / ks",
          bits: "128",
          holder: "HDCP 2.2 session",
          transit: "Not started",
          note: "A 2.2 master key is not negotiated with a 1.4-only sink.",
          at: 4,
          state: "withheld",
        },
      ],
    );
  }

  if (input.sink === "revoked") {
    add({
      title: "Serializer sends AKE_Init",
      block: "serializer",
      lock: "hdcp",
      tone: "cipher",
      lead: "Same first message as a healthy panel.",
      body: "r_tx and TxCaps go out on the sideband. Nothing secret is in this message.",
      wire: {
        from: "Serializer",
        to: "Display",
        msg: "AKE_Init",
        rows: [
          { k: "r_tx", v: rtx },
          { k: "TxCaps", v: "HDCP 2.3 transmitter" },
        ],
      },
      picture: pic("cenc", "clear", "idle", "black", "Handshake started. The picture is still caged in the head unit."),
    });
    add({
      title: "Certificate verifies",
      block: "receiver",
      lock: "hdcp",
      tone: "clear",
      lead: "The signature is genuine. That is not the end of the check.",
      body: "cert_rx carries the Receiver ID, the receiver public key kpub, and a signature from DCP LLC. The serializer checks that signature with kpub_dcp, the DCP public key stored beside the OTP secrets. Signature success only proves the key was once licensed.",
      wire: {
        from: "Display",
        to: "Serializer",
        msg: "AKE_Send_Cert",
        rows: [
          { k: "Receiver ID", v: REVOKED_ID },
          { k: "kpub", v: "1024-bit RSA, inside the certificate" },
          { k: "r_rx", v: rrx },
          { k: "signature", v: "DCP LLC — valid" },
        ],
      },
      picture: pic("cenc", "clear", "idle", "black", "Public certificate is on the sideband. Still no master key."),
    });
    add({
      title: "SRM hits this Receiver ID",
      block: "tee",
      lock: "policy",
      tone: "fail",
      lead: "Revocation runs before km is encrypted to the display.",
      body: `The policy TA checks the System Renewability Message. ${REVOKED_ID} is on the list, and the SRM signature is valid, so the ID is treated as revoked. The serializer is told to abort. Ekpub(km) is not written. A revoked display must not be given a master key, even though its private key still mathematically works.`,
      wire: {
        from: "SRM",
        to: "Serializer",
        msg: "revocation check",
        rows: [
          { k: "Receiver ID", v: REVOKED_ID },
          { k: "result", v: "revoked — abort" },
          { k: "km", v: "not sent" },
        ],
      },
      picture: pic("cenc", "clear", "idle", "black", "Authentication aborted. The glass does not get the title."),
    });
    return abort(
      "Video withheld · receiver revoked",
      "The certificate chain was fine. The renewability list is what stops a leaked or compromised device.",
      [
        {
          symbol: "r_tx",
          bits: "64",
          holder: "Serializer",
          transit: "Cleartext nonce",
          note: "Not secret.",
          value: rtx,
          at: 4,
          state: "visible",
        },
        {
          symbol: "cert_rx",
          bits: "public",
          holder: "Display",
          transit: "Sent in the clear",
          note: "Receiver ID, kpub, DCP signature.",
          value: REVOKED_ID,
          at: 5,
          state: "visible",
        },
        {
          symbol: "km",
          bits: "128",
          holder: "Not created for this sink",
          transit: "Withheld",
          note: "SRM failure aborts before AKE_No_Stored_km.",
          at: 6,
          state: "withheld",
        },
      ],
    );
  }

  if (input.sink === "panel14" && !needs22) {
    const aksv = id40(rng);
    const bksv = id40(rng);
    add({
      title: "Legacy title allows HDCP 1.4",
      block: "tee",
      lock: "policy",
      tone: "clear",
      lead: "The license floor was relaxed for 720p only.",
      body: "A current Netflix or Disney title would not do this. This scenario is the older rule: below 1080p, HDCP 1.4 is accepted. The TEE will allow scanout only because the serializer reports a completed 1.4 authentication. Bump the resolution to 1080p and the same panel goes black.",
      wire: null,
      picture: pic("cenc", "clear", "idle", "black", "Policy allows a 1.4 link. Authentication has not finished."),
    });
    add({
      title: "KSVs are exchanged",
      block: "serializer",
      lock: "hdcp",
      tone: "cipher",
      lead: "The cable carries selection vectors, not the device keys.",
      body: "Each side has 40 secret 56-bit keys burned at manufacture. The 40-bit AKSV (in the serializer) and BKSV (in the display) each contain 20 ones. The other side sums the keys the KSV selects. That sum is the shared secret. The secret keys themselves never move. This is the HDCP 1.4 material inside the serializer OTP, alongside lc128 for 2.2 sinks.",
      wire: {
        from: "Serializer",
        to: "Cluster",
        msg: "Aksv / Bksv",
        rows: [
          { k: "AKSV", v: aksv },
          { k: "BKSV", v: bksv },
          { k: "device keys", v: "40 × 56-bit, stay in each OTP" },
        ],
      },
      picture: pic("cenc", "clear", "idle", "black", "Only the KSVs are on the wire."),
    });
    add({
      title: "1.4 stream cipher on the cable",
      block: "link",
      lock: "hdcp",
      tone: "cipher",
      lead: "Not AES. A stream cipher seeded from the shared secret.",
      body: "HDCP 1.4 generates a keystream from the shared secret and XOR-combines it with the pixels. There is no km, no ks, no locality check, and no lc128 in this version. It is weaker, which is why the strict studio rule refuses it. On this relaxed 720p title the serializer enables it and the cluster recovers the picture.",
      wire: {
        from: "Serializer",
        to: "Cluster",
        msg: "HDCP 1.4 cipher enable",
        rows: [
          { k: "cipher", v: "HDCP 1.4 stream cipher" },
          { k: "shared secret", v: "computed, not transmitted" },
        ],
      },
      picture: pic("cenc", "clear", "cipher", "clear", "720p is on the glass. The coax carries 1.4 ciphertext, not AES-CTR."),
    });
    return {
      protocol: "hdcp14",
      ok: true,
      headline: "Link up · HDCP 1.4 only",
      detail:
        "Shown so the 1.4 device keys in the serializer are visible. Switch the studio rule back to HDCP 2.2 and this same cluster is rejected.",
      floor,
      stages,
      keys: [
        ...baseKeys,
        {
          symbol: "AKSV",
          bits: "40",
          holder: "Serializer OTP",
          transit: "Cleartext",
          note: "Twenty 1-bits. Selects display device keys.",
          value: aksv,
          at: 5,
          state: "visible",
        },
        {
          symbol: "BKSV",
          bits: "40",
          holder: "Display",
          transit: "Cleartext",
          note: "Selects serializer device keys.",
          value: bksv,
          at: 5,
          state: "visible",
        },
        {
          symbol: "device keys",
          bits: "40 × 56",
          holder: "Each side’s OTP",
          transit: "Never",
          note: "HDCP 1.4 secrets. Not the same as lc128.",
          at: 5,
          state: "sealed",
        },
      ],
    };
  }

  const receiverId = input.sink === "repeater" ? repeaterId : goodId;
  const repeaterBit = input.sink === "repeater";
  const peer = repeaterBit ? "Repeater" : "Display";

  add({
    title: "Serializer sends AKE_Init",
    block: "serializer",
    lock: "hdcp",
    tone: "cipher",
    lead: "Authentication is a hardware state machine on the serializer.",
    body: "Android asked the driver to protect this pipeline. The driver sets a start bit. From here the serializer owns the protocol: it samples r_tx inside the chip and emits AKE_Init. lc128 is not in this message. The SoC never had a copy of it to include.",
    wire: {
      from: "Serializer",
      to: peer,
      msg: "AKE_Init",
      rows: [
        { k: "r_tx", v: rtx },
        { k: "TxCaps", v: "HDCP 2.3, repeater = 0" },
      ],
    },
    picture: pic("cenc", "clear", "idle", "black", "Sideband only. Video encryption is still off."),
  });

  add({
    title: "Display returns its certificate",
    block: "receiver",
    lock: "hdcp",
    tone: "clear",
    lead: "The public half of the receiver key crosses the cable. The private half does not.",
    body: "AKE_Send_Cert carries cert_rx (Receiver ID, 1024-bit kpub, DCP signature), a fresh r_rx, and RxCaps. The serializer verifies the signature with the DCP public key. kpriv stays fused in the display and is what will later open km.",
    wire: {
      from: peer,
      to: "Serializer",
      msg: "AKE_Send_Cert",
      rows: [
        { k: "Receiver ID", v: receiverId },
        { k: "kpub", v: "1024-bit RSA public" },
        { k: "r_rx", v: rrx },
        { k: "RxCaps", v: repeaterBit ? "HDCP 2.3, repeater = 1" : "HDCP 2.3, repeater = 0" },
        { k: "signature", v: "DCP LLC — valid" },
      ],
    },
    picture: pic("cenc", "clear", "idle", "black", "Certificate accepted. SRM does not list this ID."),
  });

  add({
    title: "Master key wrapped to the display",
    block: "serializer",
    lock: "hdcp",
    tone: "cipher",
    lead: "km is random, created here, and only leaves as RSA ciphertext.",
    body: "No stored pairing, so the serializer generates a 128-bit master key km and RSA-OAEP encrypts it to kpub. That blob is AKE_No_Stored_km. The display opens it with kpriv. Both sides then derive kd = dkey₀ ∥ dkey₁. Each dkey is one AES-128 block: the key is km (r_n is still zero), and the data block is r_tx concatenated with r_rx mixed with a counter of 0, then 1.",
    wire: {
      from: "Serializer",
      to: peer,
      msg: "AKE_No_Stored_km",
      rows: [
        { k: "Ekpub(km)", v: "128-byte RSA-OAEP ciphertext" },
        { k: "km", v: `${km}  · simulated, not on the wire` },
        { k: "kd", v: "dkey₀ ∥ dkey₁, derived on both sides" },
      ],
    },
    picture: pic("cenc", "clear", "idle", "black", "km is on the cable only under the display’s public key."),
  });

  add({
    title: "Display proves it could open km",
    block: "receiver",
    lock: "hdcp",
    tone: "clear",
    lead: "H′ is an HMAC, not the key.",
    body: "The receiver computes H′ = HMAC-SHA256( r_tx ∥ RxCaps ∥ TxCaps , key = kd ) and returns it within one second. The serializer computes the same HMAC. A match means the display really decrypted km. Someone who saw Ekpub(km) but has no kpriv cannot produce H′.",
    wire: {
      from: peer,
      to: "Serializer",
      msg: "AKE_Send_H_prime",
      rows: [
        { k: "H′", v: hprime },
        { k: "check", v: "matches — km is shared" },
      ],
    },
    picture: pic("cenc", "clear", "idle", "black", "Master key agreed. Session key not sent yet."),
  });

  add({
    title: "Pairing stored for the next ignition",
    block: "receiver",
    lock: "hdcp",
    tone: "clear",
    lead: "Next start can skip RSA.",
    body: "The display derives kh = the top 128 bits of SHA-256(kpriv) and sends Ekh(km). The serializer stores that blob against the Receiver ID. Next time it sends AKE_Stored_km instead of a fresh RSA wrap. kh never shows up on its own. Losing the stored blob only costs a slower reconnect; it does not reveal km to anyone else.",
    wire: {
      from: peer,
      to: "Serializer",
      msg: "AKE_Send_Pairing_Info",
      rows: [
        { k: "Ekh(km)", v: "AES wrap, stored by the serializer" },
        { k: "kh", v: "derived from kpriv, never sent" },
      ],
    },
    picture: pic("cenc", "clear", "idle", "black", "Pairing info is stored. Locality is still ahead."),
  });

  add({
    title: "Locality check",
    block: "serializer",
    lock: "hdcp",
    tone: "cipher",
    lead: "The display must answer faster than a relay through the car network could.",
    body: "The serializer sends a 64-bit nonce r_n and starts a hardware watchdog. The receiver returns L′ = HMAC-SHA256( r_n , key = kd with r_rx mixed into the low 64 bits ). On an HDMI-style timing budget the round trip must land inside 20 ms. The serializer measures that itself. Pass, and both sides may use r_n in the next derivation. Fail, and authentication aborts with no session key.",
    wire: {
      from: "Serializer",
      to: peer,
      msg: "LC_Init → LC_Send_L_prime",
      rows: [
        { k: "r_n", v: rn },
        { k: "L′", v: lprime },
        { k: "round trip", v: "inside the hardware limit" },
      ],
    },
    picture: pic("cenc", "clear", "idle", "black", "The sink proved it is local. Video is still not enabled."),
  });

  add({
    title: "Session key ks is wrapped",
    block: "serializer",
    lock: "hdcp",
    tone: "cipher",
    lead: "ks is the key that will actually protect frames. It does not travel in the clear.",
    body: "The serializer draws ks and a 64-bit riv. It derives dkey₂ the same way as the earlier dkeys, now mixing r_n in, with counter = 2. Then Edkey(ks) = ks ⊕ (dkey₂ with r_rx in the low half). SKE_Send_Eks carries that wrap plus riv. riv is not secret — it is the IV material. ks is.",
    wire: {
      from: "Serializer",
      to: peer,
      msg: "SKE_Send_Eks",
      rows: [
        { k: "Edkey(ks)", v: "ks under dkey₂, 16 bytes" },
        { k: "ks", v: `${ks}  · simulated` },
        { k: "riv", v: riv },
      ],
    },
    picture: pic(
      "cenc",
      "clear",
      "idle",
      "black",
      "Session key delivered. Encryption is not enabled until the topology is acceptable.",
    ),
  });

  const sessionKeys: KeyRow[] = [
    ...baseKeys,
    {
      symbol: "r_tx",
      bits: "64",
      holder: "Serializer",
      transit: "Cleartext nonce",
      note: "Fresh every authentication.",
      value: rtx,
      at: 4,
      state: "visible",
    },
    {
      symbol: "r_rx",
      bits: "64",
      holder: "Display",
      transit: "Cleartext nonce",
      note: "Fresh every authentication.",
      value: rrx,
      at: 5,
      state: "visible",
    },
    {
      symbol: "kpub",
      bits: "1024 RSA",
      holder: "Inside cert_rx",
      transit: "Public",
      note: "Encrypts km. Checked by the DCP signature.",
      value: "in the certificate",
      at: 5,
      state: "visible",
    },
    {
      symbol: "km",
      bits: "128",
      holder: "Both, after AKE",
      transit: "RSA-OAEP ciphertext only",
      note: "Master key. Random per pairing.",
      value: km,
      at: 6,
      state: "visible",
    },
    {
      symbol: "H′",
      bits: "256",
      holder: "Proof from the display",
      transit: "HMAC, not a key",
      note: "Shows the display could derive kd.",
      value: hprime,
      at: 7,
      state: "visible",
    },
    {
      symbol: "kh",
      bits: "128",
      holder: "Derived in the display",
      transit: "Only as Ekh(km)",
      note: "SHA-256(kpriv), top 128 bits. Stored wrapped.",
      at: 8,
      state: "sealed",
    },
    {
      symbol: "r_n",
      bits: "64",
      holder: "Serializer",
      transit: "Cleartext nonce",
      note: "Locality challenge. Also mixed into dkey₂.",
      value: rn,
      at: 9,
      state: "visible",
    },
    {
      symbol: "ks",
      bits: "128",
      holder: repeaterBit ? "Negotiated, then unused" : "Both, after SKE",
      transit: "XOR-wrapped with dkey₂",
      note: repeaterBit ? "Encryption was never enabled." : "Session key for this connection.",
      value: ks,
      at: 10,
      state: "visible",
    },
    {
      symbol: "riv",
      bits: "64",
      holder: "Both",
      transit: "Cleartext IV",
      note: "Not secret. Builds the AES-CTR counter.",
      value: riv,
      at: 10,
      state: "visible",
    },
  ];

  if (repeaterBit) {
    add({
      title: "Downstream list fails Type 1",
      block: "link",
      lock: "policy",
      tone: "fail",
      lead: "SKE can finish before the transmitter knows what is behind a repeater.",
      body: "The repeater must now send every downstream Receiver ID, plus depth and device count. This seat-back box reports a passenger display with no HDCP 2.2. Type 1 content — the rule in this license — must not be sent into a tree that contains HDCP 1.x or non-HDCP devices. The serializer keeps encryption disabled. The policy TA blanks the plane. ks reached the repeater and then the stream was refused; that ordering is why the topology check is mandatory before cipher enable.",
      wire: {
        from: "Repeater",
        to: "Serializer",
        msg: "RepeaterAuth_Send_ReceiverID_List",
        rows: [
          { k: "depth", v: "1" },
          { k: "device count", v: "2" },
          { k: "downstream", v: "passenger display · HDCP none" },
          { k: "result", v: "Type 1 refused · encryption stays off" },
        ],
      },
      picture: pic("cenc", "clear", "idle", "black", "No ciphertext of the title is released onto the harness."),
    });
    return {
      protocol: "aborted",
      ok: false,
      headline: "Video withheld · repeater topology",
      detail: "A legal HDCP 2.2 box in the middle is not enough. Every screen behind it has to meet the license.",
      floor,
      stages,
      keys: sessionKeys,
    };
  }

  add({
    title: "Cable goes AES-CTR",
    block: "link",
    lock: "hdcp",
    tone: "cipher",
    lead: "This is the encryption step between head unit and display.",
    body: "The serializer may enable HDCP only after AKE, locality, and SKE, and it waits a short guard time after SKE. The content cipher is AES-128 in counter mode. The AES key is ks ⊕ lc128 — the session key mixed with the global constant that never left either OTP. The counter is (riv ⊕ stream counter) concatenated with a per-block input counter, so the keystream moves on every 16 bytes and does not repeat next frame. Pixel blocks are XORed with that keystream. Audio on the same link is covered by the same session.",
    wire: {
      from: "Serializer",
      to: "Display",
      msg: "HDCP cipher enable",
      rows: [
        { k: "AES key", v: "ks ⊕ lc128" },
        { k: "counter", v: "(riv ⊕ streamCtr) ∥ inputCtr" },
        { k: "payload", v: "video and audio, 128-bit blocks" },
        { k: "lc128", v: "used, not transmitted" },
      ],
    },
    picture: pic(
      "cenc",
      "clear",
      "cipher",
      "clear",
      "Ciphertext on the coax. The panel has the picture again, after the receiver decrypts.",
    ),
  });

  add({
    title: "Panel shows the title",
    block: "panel",
    lock: "hdcp",
    tone: "clear",
    lead: "Plaintext exists in two places, and neither of them is the cable.",
    body: "The deserializer applies the same AES-CTR and drives the timing controller. Pixels are clear on the glass. They were also briefly clear on the internal DSI, inside the head unit. Everywhere a person can clip onto the harness, the title is AES ciphertext under ks ⊕ lc128. Drop the display, and the next connect repeats this exchange — faster if pairing is still stored.",
    wire: null,
    picture: pic("cenc", "clear", "cipher", "clear", `${name} is on the glass. The harness is still ciphertext.`),
  });

  return {
    protocol: "hdcp22",
    ok: true,
    headline: "Link encrypted · HDCP 2.3",
    detail: "DRM decryption happened in the TEE. Link encryption happened in the serializer. The app never held either key.",
    floor,
    stages,
    keys: sessionKeys,
  };
}
