import { useEffect, useMemo, useState } from "react";
import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { LinkTheater } from "@/components/pathlock/link-theater";
import {
  BLOCKS,
  GROUPS,
  LOCKS,
  RESOLUTIONS,
  SERVICES,
  SINKS,
  TEE_APPS,
  buildSession,
  floorOf,
  preview,
  type BlockId,
  type Input,
  type KeyRow,
  type ResId,
  type RuleId,
  type ServiceId,
  type Session,
  type SinkId,
  type Stage,
  type Tile,
} from "@/lib/hdcp/model";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secure";

export function Lab() {
  const [service, setService] = useState<ServiceId>("netflix");
  const [sink, setSink] = useState<SinkId>("panel23");
  const [resolution, setResolution] = useState<ResId>("1080p");
  const [rule, setRule] = useState<RuleId>("strict");
  const [cursor, setCursor] = useState(-1);
  const [playing, setPlaying] = useState(false);

  const input: Input = { service, sink, resolution, rule };
  const session = useMemo(() => buildSession(input), [service, sink, resolution, rule]);
  const intro = preview(input);
  const stage = cursor >= 0 ? session.stages[cursor] : null;

  useEffect(() => {
    if (!playing) return;
    if (cursor >= session.stages.length - 1) {
      setPlaying(false);
      return;
    }
    const id = window.setTimeout(() => {
      setCursor((c) => Math.min(c + 1, session.stages.length - 1));
    }, 2400);
    return () => window.clearTimeout(id);
  }, [playing, cursor, session.stages.length]);

  function resetScenario(next: Partial<Input>) {
    if (next.service) setService(next.service);
    if (next.sink) setSink(next.sink);
    if (next.resolution) setResolution(next.resolution);
    if (next.rule) setRule(next.rule);
    setCursor(-1);
    setPlaying(false);
  }

  function run() {
    setCursor(0);
    setPlaying(true);
  }

  function step() {
    setPlaying(false);
    setCursor((c) => Math.min(c + 1, session.stages.length - 1));
  }

  const atEnd = cursor >= session.stages.length - 1;
  const status = statusOf(session, cursor, playing);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div>
          <p className="font-mono text-xs tracking-widest text-secure">PATHLOCK</p>
          <h1 className="mt-1 text-2xl font-medium text-fg sm:text-3xl">HDCP on a cockpit stream</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Where the title is decrypted, where the serializer encrypts picture and audio
            onto the cable, and where the amplifier plays.
          </p>
        </div>
        <p
          className={cx(
            "font-mono text-xs tracking-wide",
            status.tone === "ok" && "text-secure",
            status.tone === "bad" && "text-warn",
            status.tone === "run" && "text-fg",
            status.tone === "idle" && "text-muted",
          )}
        >
          {status.label}
        </p>
      </header>

      <LinkTheater stage={stage} />

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-8">
          <section aria-label="Scenario">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-sm font-medium text-fg">Session</h2>
              <p className="font-mono text-xs text-muted">License floor · {floorOf(input)}</p>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {SERVICES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={service === item.id}
                  onClick={() => resetScenario({ service: item.id })}
                  className={cx(choiceClass(service === item.id), focusRing)}
                >
                  <span className="block text-sm font-medium">{item.name}</span>
                  <span className="mt-0.5 block text-xs text-muted">{item.stack}</span>
                </button>
              ))}
            </div>

            <div className="mt-3 grid gap-2">
              {SINKS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={sink === item.id}
                  onClick={() => resetScenario({ sink: item.id })}
                  className={cx(choiceClass(sink === item.id), focusRing, "min-h-11")}
                >
                  <span className="block text-sm font-medium">{item.name}</span>
                  <span className="mt-0.5 block text-xs text-muted">{item.meta}</span>
                </button>
              ))}
            </div>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <div className="flex rounded-md border border-line p-1" role="group" aria-label="Resolution">
                {RESOLUTIONS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={resolution === item.id}
                    onClick={() => resetScenario({ resolution: item.id })}
                    className={cx(
                      "min-h-11 flex-1 rounded px-3 text-sm",
                      focusRing,
                      resolution === item.id ? "bg-raised text-fg" : "text-muted",
                    )}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
              <button
                type="button"
                aria-pressed={rule === "legacy720"}
                onClick={() => resetScenario({ rule: rule === "strict" ? "legacy720" : "strict" })}
                className={cx(choiceClass(rule === "legacy720"), focusRing, "min-h-11 sm:flex-1")}
              >
                <span className="block text-sm font-medium">
                  {rule === "legacy720" ? "720p may use HDCP 1.4" : "Require HDCP 2.2"}
                </span>
                <span className="mt-0.5 block text-xs text-muted">Studio output rule</span>
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={run}
                className={cx(
                  "inline-flex min-h-11 items-center gap-2 rounded-md bg-secure px-4 text-sm font-medium text-on-secure",
                  focusRing,
                )}
              >
                <Play className="size-4" aria-hidden="true" />
                {cursor < 0 ? "Run session" : "Replay"}
              </button>
              <button
                type="button"
                onClick={playing ? () => setPlaying(false) : step}
                disabled={!playing && atEnd && cursor >= 0}
                className={cx(
                  "inline-flex min-h-11 items-center gap-2 rounded-md border border-line bg-surface px-4 text-sm text-fg disabled:opacity-40",
                  focusRing,
                )}
              >
                {playing ? (
                  <>
                    <Pause className="size-4" aria-hidden="true" />
                    Pause
                  </>
                ) : (
                  <>
                    <SkipForward className="size-4" aria-hidden="true" />
                    Step
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCursor(-1);
                  setPlaying(false);
                }}
                className={cx(
                  "inline-flex min-h-11 items-center gap-2 rounded-md border border-line px-3 text-sm text-muted",
                  focusRing,
                )}
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                Reset
              </button>
            </div>
          </section>

          <section aria-label="Three locks">
            <h2 className="text-sm font-medium text-fg">Three places a frame is protected</h2>
            <ol className="mt-3 grid gap-2">
              {LOCKS.map((lock) => {
                const on = stage?.lock === lock.id;
                return (
                  <li
                    key={lock.id}
                    className={cx("border-l-2 py-2 pl-3", on ? "border-l-secure bg-secure-dim" : "border-l-line")}
                  >
                    <p className="font-mono text-xs text-muted">{lock.n}</p>
                    <h3 className="text-sm font-medium text-fg">{lock.title}</h3>
                    <p className="mt-1 text-sm text-muted">{lock.body}</p>
                  </li>
                );
              })}
            </ol>
          </section>

          <section aria-label="Blocks on the path">
            <h2 className="text-sm font-medium text-fg">Blocks</h2>
            <p className="mt-1 text-sm text-muted">
              Select a block to open the step where it acts. The serializer, not the TEE, owns the
              HDCP keys.
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {GROUPS.map((group) => (
                <div key={group.id}>
                  <div className="overflow-hidden rounded-md border border-line">
                    <div className="flex items-baseline justify-between gap-3 border-b border-line px-3 py-2">
                      <h3 className="font-mono text-xs tracking-wide text-muted">{group.name}</h3>
                      <p className="text-right text-xs text-faint">{group.note}</p>
                    </div>
                    <ul className="divide-y divide-line">
                      {group.blocks.map((id) => (
                        <li key={id}>
                          <BlockButton
                            id={id}
                            session={session}
                            cursor={cursor}
                            onPick={() => {
                              const idx = session.stages.findIndex((s) => s.block === id);
                              if (idx < 0) return;
                              setPlaying(false);
                              setCursor(idx);
                            }}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                  {group.bridge ? (
                    <p className="px-3 py-2 text-center font-mono text-xs text-faint">{group.bridge}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-4" aria-label="Handshake">
          <PictureStrip stage={stage} />
          <div aria-live="polite" className="rounded-md border border-line bg-surface p-4">
            {stage ? (
              <>
                <p className="font-mono text-xs text-muted">
                  Step {cursor + 1} / {session.stages.length}
                  {atEnd ? (session.ok ? " · authenticated" : " · stopped") : ""}
                </p>
                <h2 className="mt-1 text-lg font-medium text-fg">{stage.title}</h2>
                <p className="mt-2 text-sm text-fg">{stage.lead}</p>
                <p className="mt-2 text-sm text-muted">{stage.body}</p>
              </>
            ) : (
              <>
                <p className="font-mono text-xs text-muted">Before you run it</p>
                <h2 className="mt-1 text-lg font-medium text-fg">{intro.title}</h2>
                <p className="mt-2 text-sm text-muted">{intro.body}</p>
                <p className="mt-3 text-sm text-muted">
                  Run the session to watch the messages, or pick a block to open its step.
                </p>
              </>
            )}
            {atEnd && cursor >= 0 ? (
              <p
                className={cx(
                  "mt-3 rounded-md border px-3 py-2 text-sm",
                  session.ok ? "border-secure bg-secure-dim text-fg" : "border-warn bg-warn-dim text-fg",
                )}
              >
                <span className="font-medium">{session.headline}. </span>
                {session.detail}
              </p>
            ) : null}
          </div>

          {stage?.wire ? <WireCard wire={stage.wire} /> : null}

          <ol className="flex flex-col" aria-label="Steps">
            {session.stages.map((item, index) => {
              const on = index === cursor;
              const seen = cursor >= index;
              return (
                <li key={`${item.id}-${index}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setPlaying(false);
                      setCursor(index);
                    }}
                    className={cx(
                      "flex min-h-11 w-full items-baseline gap-3 border-l-2 py-1.5 pl-3 text-left",
                      focusRing,
                      on ? "border-l-secure" : "border-l-line",
                    )}
                  >
                    <span className="w-5 shrink-0 font-mono text-xs text-faint tabular-nums">
                      {index + 1}
                    </span>
                    <span className={cx("text-sm", on ? "text-fg" : seen ? "text-muted" : "text-faint")}>
                      {item.title}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          <KeyLedger session={session} cursor={cursor} />
        </aside>
      </div>

      <section className="mt-10 border-t border-line pt-8" aria-label="Trusted applications">
        <h2 className="text-lg font-medium text-fg">Trusted environment</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          The TEE is where the studio’s encryption ends. It is not where the display-cable
          encryption begins. That second cipher sits in the serializer, because that is the chip
          whose OTP holds lc128 and, for legacy panels, the HDCP 1.4 device keys. The trusted
          applications below decide whether those clear frames are allowed to reach the serializer
          at all.
        </p>
        <dl className="mt-4 grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2">
          {TEE_APPS.map((app) => (
            <div key={app.name} className="bg-surface p-4">
              <dt className="text-sm font-medium text-fg">{app.name}</dt>
              <dd className="mt-1 text-sm text-muted">{app.body}</dd>
            </div>
          ))}
        </dl>
      </section>

      <footer className="mt-8 border-t border-line py-6 text-xs text-faint">
        Teaching model of HDCP 2.2/2.3 between a head-unit serializer and a display: AKE, locality
        check, then session-key exchange, then AES-128-CTR under ks ⊕ lc128. Nonces and session
        values are simulated in the page. lc128 and the receiver private key are never shown —
        they do not leave the chips.
      </footer>
    </main>
  );
}

function statusOf(session: Session, cursor: number, playing: boolean) {
  if (playing) return { label: "Authenticating", tone: "run" as const };
  if (cursor < 0) return { label: "Idle", tone: "idle" as const };
  if (cursor >= session.stages.length - 1) {
    return session.ok
      ? { label: "Encrypted link", tone: "ok" as const }
      : { label: "Video withheld", tone: "bad" as const };
  }
  return { label: "Paused", tone: "run" as const };
}

function choiceClass(active: boolean) {
  return cx(
    "rounded-md border px-3 py-2 text-left",
    active ? "border-secure bg-secure-dim text-fg" : "border-line bg-surface text-fg",
  );
}

function BlockButton({
  id,
  session,
  cursor,
  onPick,
}: {
  id: BlockId;
  session: Session;
  cursor: number;
  onPick: () => void;
}) {
  const meta = BLOCKS[id];
  const visual = blockVisual(id, session.stages, cursor);
  return (
    <button
      type="button"
      onClick={onPick}
      className={cx(
        "w-full border-l-2 px-3 py-3 text-left",
        focusRing,
        visual === "active" && "border-l-secure bg-secure-dim",
        visual === "done" && "border-l-secure",
        visual === "fail" && "border-l-warn bg-warn-dim",
        visual === "idle" && "border-l-transparent",
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-fg">{meta.title}</span>
        <span
          className={cx(
            "shrink-0 font-mono text-xs",
            visual === "fail" ? "text-warn" : visual === "idle" ? "text-faint" : "text-secure",
          )}
        >
          {meta.kicker}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted">{meta.summary}</p>
      {visual !== "idle" ? (
        <>
          <p className="mt-2 text-xs text-faint">Holds · {meta.holds}</p>
          <p className="mt-0.5 text-xs text-faint">Never · {meta.never}</p>
        </>
      ) : null}
    </button>
  );
}

function blockVisual(
  id: BlockId,
  stages: Stage[],
  cursor: number,
): "idle" | "active" | "done" | "fail" {
  if (cursor < 0) return "idle";
  let last = -1;
  for (let i = 0; i <= cursor && i < stages.length; i++) {
    if (stages[i].block === id) last = i;
  }
  if (last < 0) return "idle";
  if (stages[last].tone === "fail" && last === cursor) return "fail";
  if (last === cursor) return "active";
  return "done";
}

function PictureStrip({ stage }: { stage: Stage | null }) {
  const cells: { label: string; tile: Tile }[] = stage
    ? [
        { label: "App", tile: stage.picture.app },
        { label: "TEE", tile: stage.picture.tee },
        { label: "Amp", tile: ampTile(stage) },
        { label: "Cable", tile: stage.picture.cable },
        { label: "Panel", tile: stage.picture.panel },
      ]
    : [
        { label: "App", tile: "cenc" },
        { label: "TEE", tile: "idle" },
        { label: "Amp", tile: "idle" },
        { label: "Cable", tile: "idle" },
        { label: "Panel", tile: "black" },
      ];
  return (
    <div className="rounded-md border border-line bg-bg p-3">
      <p className="font-mono text-xs text-muted">Where the frame is</p>
      <div className="mt-2 grid grid-cols-5 gap-2">
        {cells.map((cell) => (
          <div
            key={cell.label}
            className={cx("rounded-md border px-1 py-2 text-center", tileClass(cell.tile))}
          >
            <span className="block font-mono text-xs">{tileWord(cell.tile, cell.label)}</span>
            <span className="mt-1 block text-xs text-current opacity-80">{cell.label}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-sm text-muted">
        {stage
          ? stage.picture.caption
          : "Ciphertext is in the app. Nothing has been decrypted, and the panel is dark."}
      </p>
    </div>
  );
}

function ampTile(stage: Stage | null): Tile {
  if (!stage) return "idle";
  if (stage.block === "app" || stage.block === "license") return "idle";
  if (stage.title.startsWith("OEMCrypto")) return "idle";
  return "clear";
}

function tileWord(tile: Tile, label = "") {
  if (label === "Amp" && tile === "clear") return "PCM";
  if (tile === "cenc") return "CENC";
  if (tile === "clear") return "clear";
  if (tile === "cipher") return "AES";
  if (tile === "black") return "dark";
  return "—";
}

function tileClass(tile: Tile) {
  if (tile === "cenc") return "border-warn bg-warn-dim text-warn";
  if (tile === "clear") return "border-secure bg-secure-dim text-secure";
  if (tile === "cipher") return "border-secure bg-raised text-secure";
  if (tile === "black") return "border-line bg-bg text-faint";
  return "border-line bg-surface text-faint";
}

function WireCard({ wire }: { wire: NonNullable<Stage["wire"]> }) {
  return (
    <div className="rounded-md border border-line bg-raised p-3">
      <p className="font-mono text-xs text-secure">{wire.msg}</p>
      <p className="mt-1 text-xs text-muted">
        {wire.from} → {wire.to}
      </p>
      <dl className="mt-2 flex flex-col gap-2">
        {wire.rows.map((row) => (
          <div key={row.k} className="flex flex-wrap gap-x-3 gap-y-0.5">
            <dt className="w-28 shrink-0 font-mono text-xs text-faint">{row.k}</dt>
            <dd className="min-w-0 flex-1 break-all font-mono text-xs text-fg">{row.v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function KeyLedger({ session, cursor }: { session: Session; cursor: number }) {
  const formula =
    session.protocol === "hdcp14"
      ? "HDCP 1.4 never sends its device keys. Each side combines the 40 secret keys selected by the other’s KSV, then a stream cipher — not AES — masks the pixels."
      : "Frame cipher, once encryption is enabled: AES-128-CTR, key = ks ⊕ lc128, counter = (riv ⊕ streamCtr) ∥ inputCtr. km exists only to agree that session with a local, unrevoked receiver.";
  return (
    <div className="rounded-md border border-line bg-surface p-3">
      <h2 className="text-sm font-medium text-fg">Keys between head unit and display</h2>
      <p className="mt-1 text-xs text-muted">{formula}</p>
      <ul className="mt-3 flex flex-col divide-y divide-line">
        {session.keys.map((row) => (
          <KeyLine key={`${row.symbol}-${row.holder}`} row={row} cursor={cursor} />
        ))}
      </ul>
    </div>
  );
}

function KeyLine({ row, cursor }: { row: KeyRow; cursor: number }) {
  const always = row.state === "sealed" && row.at === 0;
  const show = always || cursor >= row.at;
  return (
    <li className="py-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-sm text-fg">{row.symbol}</span>
        <span className="font-mono text-xs text-faint">{row.bits}</span>
      </div>
      <p className="mt-0.5 text-xs text-muted">
        {row.holder}. {row.transit}
      </p>
      {show ? (
        <p className="mt-1 break-all font-mono text-xs text-fg">
          {row.state === "sealed" ? "Sealed. Not on the cable." : null}
          {row.state === "withheld" ? "Not sent on this attempt." : null}
          {row.state === "visible" ? row.value : null}
        </p>
      ) : (
        <p className="mt-1 text-xs text-faint">Appears later in this handshake.</p>
      )}
      {show ? <p className="mt-1 text-xs text-faint">{row.note}</p> : null}
    </li>
  );
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
