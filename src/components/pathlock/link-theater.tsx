import { ampPlayback, type Stage } from "@/lib/hdcp/model";

type Dir = "out" | "back" | "round" | "timeout" | "video" | "video14" | "idle" | "dsi";
type Glass = "dark" | "clear";

type Beat = {
  phase: string;
  headline: string;
  dir: Dir;
  packetOut: string;
  packetBack: string;
  serHot: boolean;
  desHot: boolean;
  socHot: boolean;
  serVault: boolean;
  desVault: boolean;
  serLines: string[];
  wireLines: string[];
  desLines: string[];
  glass: Glass;
  dsi: "idle" | "clear";
  amp: "idle" | "armed" | "play";
  ampNote: string;
};

const idleBeat: Beat = {
  phase: "IDLE",
  headline: "The serializer and the deserializer have not started talking.",
  dir: "idle",
  packetOut: "",
  packetBack: "",
  serHot: false,
  desHot: false,
  socHot: false,
  serVault: false,
  desVault: false,
  serLines: ["HDCP engine idle", "OTP holds lc128, unreadable"],
  wireLines: ["Sideband quiet", "Video lane quiet"],
  desLines: ["HDCP receiver idle", "kpriv stays in its OTP"],
  glass: "dark",
  dsi: "idle",
  amp: "idle",
  ampNote: "No samples yet",
};

export function LinkTheater({ stage }: { stage: Stage | null }) {
  const beat = beatFor(stage);
  return (
    <section className="mt-6 rounded-md border border-line bg-surface p-3 sm:p-4" aria-label="Link animation">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-medium text-fg">Serializer ↔ deserializer</h2>
        <p className="font-mono text-xs text-secure">{beat.phase}</p>
      </div>
      <p className="mt-1 text-sm text-fg">{beat.headline}</p>

      <div className="mt-3 hidden lg:grid lg:grid-cols-3 lg:items-stretch lg:gap-3">
        <HeadUnit beat={beat} />
        <Cable beat={beat} axis="x" stageKey={stage?.id ?? "idle"} />
        <DisplayUnit beat={beat} />
      </div>
      <div className="mt-3 flex flex-col gap-3 lg:hidden">
        <HeadUnit beat={beat} />
        <Cable beat={beat} axis="y" stageKey={stage?.id ?? "idle"} />
        <DisplayUnit beat={beat} />
      </div>

      <PhaseRail phase={beat.phase} />

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <Column kicker="In the serializer" lines={beat.serLines} hot={beat.serHot} />
        <Column kicker="On the cable" lines={beat.wireLines} hot={beat.dir !== "idle" && beat.dir !== "dsi"} />
        <Column kicker="In the deserializer" lines={beat.desLines} hot={beat.desHot} />
      </div>
    </section>
  );
}

function HeadUnit({ beat }: { beat: Beat }) {
  return (
    <div className="rounded-md border border-line bg-bg p-3">
      <p className="font-mono text-xs tracking-wide text-faint">HEAD UNIT</p>
      <div className={cx("mt-2 rounded border px-2 py-2", beat.socHot ? "border-warn bg-warn-dim" : "border-line")}>
        <p className="text-xs font-medium text-fg">SoC · secure path</p>
        <p className="mt-0.5 text-xs text-muted">Plaintext only inside this housing</p>
      </div>
      <p className={cx("py-1.5 text-center font-mono text-xs", beat.dsi === "clear" ? "text-warn" : "text-faint")}>
        {beat.dsi === "clear" ? "↓ DSI · plaintext · on the board" : "↓ DSI · idle"}
      </p>
      <div className={cx("rounded border px-2 py-2", beat.serHot ? "border-secure bg-secure-dim" : "border-line")}>
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-xs font-medium text-fg">Serializer</p>
          <p className="font-mono text-xs text-secure">HDCP Tx</p>
        </div>
        <p className={cx("mt-1 font-mono text-xs", beat.serVault ? "text-secure" : "text-faint")}>OTP · lc128 sealed</p>
        {beat.phase === "LOCALITY" ? (
          <div className="mt-2">
            <div className="h-1.5 overflow-hidden rounded bg-line">
              <div className="timer-fill h-full bg-warn" />
            </div>
            <p className="mt-1 font-mono text-xs text-warn">20 ms timer · in this chip</p>
          </div>
        ) : null}
      </div>
      <p className={cx("py-1.5 text-center font-mono text-xs", beat.amp === "play" ? "text-secure" : "text-faint")}>
        {beat.amp === "play" ? "↓ I2S · PCM · stays in the housing" : "↓ I2S · idle"}
      </p>
      <div
        className={cx(
          "rounded border px-2 py-2",
          beat.amp === "play" && "border-secure bg-secure-dim",
          beat.amp === "armed" && "border-warn bg-warn-dim",
          beat.amp === "idle" && "border-line",
        )}
      >
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-xs font-medium text-fg">Amplifier</p>
          <p className="font-mono text-xs text-faint">not HDCP</p>
        </div>
        <p className="mt-1 font-mono text-xs text-muted">{beat.ampNote}</p>
      </div>
    </div>
  );
}

function DisplayUnit({ beat }: { beat: Beat }) {
  return (
    <div className="rounded-md border border-line bg-bg p-3">
      <p className="font-mono text-xs tracking-wide text-faint">DISPLAY</p>
      <div className={cx("mt-2 rounded border px-2 py-2", beat.desHot ? "border-secure bg-secure-dim" : "border-line")}>
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-xs font-medium text-fg">Deserializer</p>
          <p className="font-mono text-xs text-secure">HDCP Rx</p>
        </div>
        <p className={cx("mt-1 font-mono text-xs", beat.desVault ? "text-secure" : "text-faint")}>OTP · kpriv · lc128</p>
      </div>
      <div
        className={cx(
          "mt-2 flex aspect-video items-end rounded border p-2",
          beat.glass === "clear" ? "border-secure bg-secure-dim" : "border-line bg-bg",
        )}
      >
        <p className={cx("font-mono text-xs", beat.glass === "clear" ? "text-secure" : "text-faint")}>
          {beat.glass === "clear" ? "Glass · picture" : "Glass · dark"}
        </p>
      </div>
    </div>
  );
}

function Cable({ beat, axis, stageKey }: { beat: Beat; axis: "x" | "y"; stageKey: string }) {
  const video = beat.dir === "video" || beat.dir === "video14";
  return (
    <div className="flex flex-col justify-center gap-3 rounded-md border border-line bg-bg px-3 py-3">
      <p className="text-center font-mono text-xs text-faint">
        {axis === "x" ? "GMSL / FPD-LINK / HDMI" : "HARNESS"}
      </p>
      <div>
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-mono text-xs text-muted">Sideband</p>
          <p className="text-xs text-faint">control channel</p>
        </div>
        <Track axis={axis} beat={beat} stageKey={stageKey} />
      </div>
      <div>
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-mono text-xs text-muted">Video</p>
          <p className="text-xs text-faint">{beat.dir === "video14" ? "1.4 stream cipher" : "AES-128-CTR"}</p>
        </div>
        {video ? (
          <div className={beat.dir === "video14" ? "video-march video-march-warn" : "video-march"} />
        ) : (
          <div className="flex h-8 items-center justify-center rounded border border-dashed border-line">
            <span className="font-mono text-xs text-faint">no pixels</span>
          </div>
        )}
      </div>
      <div>
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-mono text-xs text-muted">Link audio</p>
          <p className="text-xs text-faint">{video ? "same session" : "not enabled"}</p>
        </div>
        {video ? (
          <div className={beat.dir === "video14" ? "video-march video-march-warn" : "video-march"} />
        ) : (
          <div className="flex h-8 items-center justify-center rounded border border-dashed border-line">
            <span className="font-mono text-xs text-faint">no audio</span>
          </div>
        )}
      </div>
    </div>
  );
}

function Track({ axis, beat, stageKey }: { axis: "x" | "y"; beat: Beat; stageKey: string }) {
  const x = axis === "x";
  const trackClass = x ? "link-track link-track-x" : "link-track link-track-y";
  const showOut = beat.dir === "out" || beat.dir === "round" || beat.dir === "timeout";
  const showBack = beat.dir === "back" || beat.dir === "round";
  return (
    <div className={trackClass} key={stageKey + axis}>
      {showOut ? (
        <span className={cx("pkt", x ? "pkt-x-out" : "pkt-y-out", beat.dir === "timeout" && "pkt-warn")}>
          {beat.packetOut}
        </span>
      ) : null}
      {showBack ? (
        <span className={cx("pkt", x ? "pkt-x-back" : "pkt-y-back")}>{beat.packetBack}</span>
      ) : null}
      {beat.dir === "timeout" ? <span className="pkt-timeout">no reply</span> : null}
      {beat.dir === "idle" || beat.dir === "dsi" || beat.dir === "video" || beat.dir === "video14" ? (
        <span className="pkt-quiet">quiet</span>
      ) : null}
    </div>
  );
}

function PhaseRail({ phase }: { phase: string }) {
  const steps = ["AKE", "LOCALITY", "SKE", "CIPHER", "AUDIO"];
  const active =
    phase === "CIPHER" || phase === "HDCP 1.4" ? "CIPHER" : steps.includes(phase) ? phase : "";
  return (
    <ol className="mt-3 grid grid-cols-5 gap-1">
      {steps.map((step) => (
        <li
          key={step}
          className={cx(
            "rounded border px-1 py-1 text-center font-mono text-xs",
            active === step ? "border-secure bg-secure-dim text-secure" : "border-line text-faint",
          )}
        >
          {step}
        </li>
      ))}
    </ol>
  );
}

function Column({ kicker, lines, hot }: { kicker: string; lines: string[]; hot: boolean }) {
  return (
    <div className={cx("rounded border px-3 py-2", hot ? "border-secure" : "border-line")}>
      <p className="font-mono text-xs text-faint">{kicker}</p>
      <ul className="mt-1 flex flex-col gap-1">
        {lines.map((line) => (
          <li key={line} className="text-xs text-muted">
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}

function beatFor(stage: Stage | null): Beat {
  const amp = ampPlayback(stage);
  if (!stage) return idleBeat;
  const msg = stage.wire?.msg ?? "";
  const glass: Glass =
    stage.title.includes("Panel shows") ||
    stage.title.includes("stream cipher") ||
    stage.title.includes("Cable goes") ||
    stage.title.includes("Amplifier plays")
      ? "clear"
      : "dark";
  const ampNote =
    amp === "idle"
      ? "No samples yet"
      : amp === "armed"
        ? "PCM in the TEE · amp not clocked"
        : "I2S PCM · no HDCP keys";
  const next = (patch: Partial<Beat>): Beat => ({
    ...idleBeat,
    headline: stage.lead,
    glass,
    amp,
    ampNote,
    ...patch,
  });

  if (msg.includes("missing")) {
    return next({
      phase: "AKE",
      dir: "timeout",
      packetOut: "AKE_Init",
      serHot: true,
      serLines: ["Watchdog hits 100 ms", "km is never created", "lc128 unused"],
      wireLines: ["r_tx went out", "No cert_rx comes back"],
      desLines: ["No HDCP receiver", "No kpriv on this tap"],
    });
  }
  if (msg.includes("BKSV") && !msg.includes("Aksv")) {
    return next({
      phase: "AKE",
      dir: "back",
      packetBack: "BKSV",
      serHot: true,
      desHot: true,
      serLines: ["1.4 identity only", "Type 1 license stops here", "2.2 km is not started"],
      wireLines: ["BKSV on the sideband", "No 2.2 certificate"],
      desLines: ["Legacy cluster", "Device keys stay in OTP"],
    });
  }
  if (msg.includes("Aksv")) {
    return next({
      phase: "AKE",
      dir: "round",
      packetOut: "AKSV",
      packetBack: "BKSV",
      serHot: true,
      desHot: true,
      serVault: true,
      desVault: true,
      serLines: ["40 device keys stay in OTP", "BKSV selects which to sum"],
      wireLines: ["Only the two KSVs travel", "The keys themselves do not"],
      desLines: ["AKSV selects its keys", "Both sides reach the same sum"],
    });
  }
  if (msg.includes("1.4 cipher")) {
    return next({
      phase: "HDCP 1.4",
      dir: "video14",
      serHot: true,
      desHot: true,
      serVault: true,
      desVault: true,
      dsi: "clear",
      serLines: ["Stream cipher, not AES", "Shared secret never transmitted"],
      wireLines: ["Keystream XOR pixels and link audio", "No locality check in 1.4"],
      desLines: ["Same cipher, opposite XOR", "720p reaches the glass"],
    });
  }
  if (msg.includes("AKE_Init")) {
    return next({
      phase: "AKE",
      dir: "out",
      packetOut: "AKE_Init",
      serHot: true,
      serLines: ["HDCP engine draws r_tx", "TxCaps: 2.3, not a repeater", "lc128 stays in OTP"],
      wireLines: ["Sideband only", "r_tx in the clear", "No key in this message"],
      desLines: ["Receiver wakes", "Prepares cert_rx", "kpriv not used yet"],
    });
  }
  if (msg.includes("AKE_Send_Cert")) {
    return next({
      phase: "AKE",
      dir: "back",
      packetBack: "cert_rx",
      serHot: true,
      desHot: true,
      desVault: true,
      serLines: ["Verify DCP signature", "Read Receiver ID", "Still no km"],
      wireLines: ["cert_rx, r_rx, RxCaps", "Public key only"],
      desLines: ["Sends the certificate", "kpriv remains fused"],
    });
  }
  if (msg.includes("revocation")) {
    return next({
      phase: "AKE",
      dir: "idle",
      serHot: true,
      serLines: ["Receiver ID is on the SRM", "Abort before Ekpub(km)", "Policy TA blanks the plane"],
      wireLines: ["No master key on the wire"],
      desLines: ["Certificate was real", "Revoked devices get no km"],
    });
  }
  if (msg.includes("No_Stored") || msg.includes("Stored_km")) {
    return next({
      phase: "AKE",
      dir: "out",
      packetOut: "Ekpub(km)",
      serHot: true,
      desHot: true,
      desVault: true,
      serLines: ["Draw random km inside the chip", "RSA-OAEP under kpub", "Plaintext km does not leave"],
      wireLines: ["128-byte ciphertext", "km is not readable here"],
      desLines: ["Open km with kpriv", "Derive kd = dkey₀ ∥ dkey₁"],
    });
  }
  if (msg.includes("H_prime")) {
    return next({
      phase: "AKE",
      dir: "back",
      packetBack: "H′",
      serHot: true,
      desHot: true,
      serLines: ["Recompute the HMAC", "A match means km is shared"],
      wireLines: ["H′ is a proof, not a key"],
      desLines: ["HMAC over r_tx and the caps", "Keyed with kd"],
    });
  }
  if (msg.includes("Pairing")) {
    return next({
      phase: "AKE",
      dir: "back",
      packetBack: "Ekh(km)",
      serHot: true,
      desHot: true,
      desVault: true,
      serLines: ["Store the blob by Receiver ID", "Next start can skip RSA"],
      wireLines: ["km wrapped under kh", "kh itself is not sent"],
      desLines: ["kh = top 128 bits of SHA-256(kpriv)", "kpriv never leaves"],
    });
  }
  if (msg.includes("LC_Init")) {
    return next({
      phase: "LOCALITY",
      dir: "round",
      packetOut: "r_n",
      packetBack: "L′",
      serHot: true,
      desHot: true,
      serLines: ["Send r_n", "Time the reply in hardware", "Late L′ aborts, no ks"],
      wireLines: ["r_n out, L′ back", "Must finish inside ~20 ms"],
      desLines: ["L′ = HMAC(r_n, kd ⊕ r_rx)", "Answered by the link chip"],
    });
  }
  if (msg.includes("SKE_")) {
    return next({
      phase: "SKE",
      dir: "out",
      packetOut: "Edkey(ks)",
      serHot: true,
      desHot: true,
      serLines: ["Draw ks and riv", "dkey₂ mixes in r_n", "Wrap ks, do not send it raw"],
      wireLines: ["Edkey(ks) plus riv", "riv is an IV, not a secret"],
      desLines: ["Recover ks", "Video still off until topology is accepted"],
    });
  }
  if (msg.includes("ReceiverID_List")) {
    return next({
      phase: "SKE",
      dir: "back",
      packetBack: "ID list",
      serHot: true,
      desHot: true,
      serLines: ["Type 1 needs every downstream on 2.2", "Encryption stays disabled"],
      wireLines: ["Depth, device count, Receiver IDs", "No video yet"],
      desLines: ["Repeater reports a non-HDCP screen", "ks is not used"],
    });
  }
  if (msg.includes("HDCP cipher")) {
    return next({
      phase: "CIPHER",
      dir: "video",
      serHot: true,
      desHot: true,
      serVault: true,
      desVault: true,
      dsi: "clear",
      serLines: ["AES-128-CTR turns on", "Key is ks ⊕ lc128", "lc128 never leaves OTP"],
      wireLines: ["Ciphertext video and audio", "Same session, one key", "Counter advances every 16 bytes"],
      desLines: ["Same key, same counter", "Clear pixels only after this chip"],
    });
  }
  if (msg.includes("I2S")) {
    const link = stage.wire?.rows.find((row) => row.k === "display-link audio")?.v ?? "";
    if (link.includes("not enabled")) {
      return next({
        phase: "AUDIO",
        dir: "idle",
        socHot: true,
        dsi: "clear",
        ampNote: "Playing · link audio withheld",
        serLines: ["Link cipher never enabled", "No audio blocks written out"],
        wireLines: ["Coax has no soundtrack", "No second handshake"],
        desLines: ["Nothing to decrypt"],
      });
    }
    const legacy = link.includes("1.4");
    return next({
      phase: "AUDIO",
      dir: legacy ? "video14" : "video",
      serHot: true,
      desHot: true,
      serVault: !legacy,
      desVault: !legacy,
      dsi: "clear",
      glass: "clear",
      serLines: legacy
        ? ["Link audio sits in the 1.4 keystream", "No separate audio handshake"]
        : ["Link audio uses ks ⊕ lc128", "Same cipher as the pixels", "No second handshake"],
      wireLines: ["Audio blocks on the AV lane", "Cabin PCM is not this cable"],
      desLines: ["Recovers link audio after the cipher", "Does not feed the cockpit amp"],
    });
  }
  if (stage.block === "pipeline") {
    return next({
      phase: "ON-BOARD",
      dir: "dsi",
      socHot: true,
      serHot: true,
      dsi: "clear",
      serLines: ["Pixels arrive on the pins", "HDCP engine not started"],
      wireLines: ["The long cable is still idle"],
      desLines: ["Nothing to decrypt yet"],
    });
  }
  if (stage.block === "panel") {
    return next({
      phase: "CIPHER",
      dir: "video",
      serHot: true,
      desHot: true,
      serVault: true,
      desVault: true,
      dsi: "clear",
      glass: "clear",
      serLines: ["Still encrypting every frame", "Key remains ks ⊕ lc128"],
      wireLines: ["Harness is ciphertext", "Picture and link audio, not the amp"],
      desLines: ["Decrypt, then the timing controller", "Glass is the only clear copy outside the head unit"],
    });
  }
  if (stage.tone === "fail") {
    return next({
      phase: "WITHHELD",
      dir: "idle",
      serHot: true,
      serLines: ["Protected plane held back", "Link cipher not enabled"],
      wireLines: ["This title is not on the cable"],
      desLines: ["Glass stays dark for the video plane"],
    });
  }
  return next({
    phase: "UPSTREAM",
    dir: "idle",
    socHot: true,
    serLines: ["Serializer is waiting", "No HDCP message yet"],
    wireLines: ["Cable not involved", "Studio crypto is still inside the head unit"],
    desLines: ["Deserializer is idle"],
  });
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
