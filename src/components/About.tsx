import { Show, type JSX } from "solid-js";
import KofiLink, { QUIET_LINK } from "./KofiLink";
import { OutLink } from "./Sources";
import { generationCredit, meta } from "../data";

/** How the work wants to be named when someone re-uses it. */
export const CREDIT = "The Arms of Time";

/** A heading and its body, so each column reads as a stack of short blocks. */
function Section(props: { title: string; children: JSX.Element }) {
  return (
    <section class="flex flex-col gap-1.5">
      <h3 class="text-base-content/45 text-[0.65rem] tracking-[0.14em] uppercase">
        {props.title}
      </h3>
      <div class="text-base-content/75 flex flex-col gap-1.5 text-sm leading-relaxed">
        {props.children}
      </div>
    </section>
  );
}

/** One row of a two-column list: what it is on the left, the detail on the right. */
function Row(props: { term: string; children: JSX.Element }) {
  return (
    <>
      <dt class="text-base-content/45">{props.term}</dt>
      <dd>{props.children}</dd>
    </>
  );
}

/** The grid a run of `Row`s sits in. */
const Rows = (props: { children: JSX.Element }) => (
  <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">{props.children}</dl>
);

/** A numbered step, the number in a small ring so the three read as a sequence. */
function Step(props: { n: number; children: JSX.Element }) {
  return (
    <li class="flex gap-2.5">
      <span class="border-base-content/25 text-base-content/60 mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-[0.65rem] tabular-nums">
        {props.n}
      </span>
      <span>{props.children}</span>
    </li>
  );
}

const Info = () => (
  <svg
    viewBox="0 0 24 24"
    class="size-3.5 shrink-0"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5" />
    <path d="M12 7.6v.2" />
  </svg>
);

/** The one About box on the page. Set when it mounts. */
let dialog: HTMLDialogElement | undefined;

/** Opens the About box, from wherever the reader asked for it. */
export const openAbout = () => dialog?.showModal();

/**
 * The pill that opens the About box. In the footer the word only shows where
 * there is room; in the Settings menu there is always room.
 */
export function AboutButton(props: { always?: boolean; quiet?: boolean }) {
  if (props.quiet) {
    return (
      <button type="button" class={QUIET_LINK} onClick={openAbout}>
        About
      </button>
    );
  }
  return (
    <button
      type="button"
      class="border-base-300 bg-base-200/70 text-base-content/55 hover:text-base-content focus-visible:ring-accent/50 flex h-6 shrink-0 items-center gap-1.5 rounded-full border px-2 text-[0.65rem] leading-none font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:outline-none"
      aria-label="About this page"
      onClick={openAbout}
    >
      <Info />
      <span classList={{ "hidden sm:inline": !props.always }}>About</span>
    </button>
  );
}

/**
 * The About box: what the thing is, and what anyone else may do with it. A
 * native `<dialog>`, so Escape, the backdrop click and the focus trap are the
 * browser's job rather than ours. Rendered once, in `App`; the footer pill and
 * the Settings menu both open it through `openAbout`.
 */
export default function AboutDialog() {
  return (
    <dialog class="modal" ref={(el) => (dialog = el)}>
      <div class="modal-box border-base-300 flex max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl flex-col gap-0 border p-0">
        <header class="border-base-300 flex flex-col gap-3 border-b px-6 pt-8 pb-6 sm:px-14 sm:pt-10 sm:pb-8">
          <h2 class="font-display text-base tracking-[0.18em] uppercase">
            The Arms of Time
          </h2>
          <p class="text-base-content/80 max-w-prose text-sm leading-relaxed sm:text-base">
            A ruler for deep time, laid on the human body. It shows how old the
            world is, and how short our own part of it has been.
          </p>
        </header>

        {/* Only the middle scrolls, so the title and the Close button stay in view. */}
        <div class="grid min-h-0 flex-1 gap-x-14 gap-y-8 overflow-y-auto px-6 py-7 sm:grid-cols-2 sm:px-14 sm:py-10">
          <div class="flex flex-col gap-8">
            <Section title="What this is">
              <p>
                Deep time drawn along the arms of Leonardo's{" "}
                <em>Vitruvian Man</em>. The left fingertip is the beginning, the
                right fingertip is now.
              </p>
              <p>
                Your own arm span sets the scale. Set it under Settings, and
                every distance on screen is measured on your body.
              </p>
            </Section>

            <Section title="How to read it">
              <ol class="flex flex-col gap-2">
                <Step n={1}>
                  Pick a timeline at the top, from the whole Universe to modern
                  humans.
                </Step>
                <Step n={2}>
                  Drag the marker along the arms. The cards below say what
                  happened there.
                </Step>
                <Step n={3}>
                  Hold out your own arms. The scale on screen says how much time
                  each part of them holds.
                </Step>
              </ol>
            </Section>

            <Section title="In a classroom or a museum">
              <ul class="flex list-disc flex-col gap-1 pl-4">
                <li>Free to use. No account, no adverts.</li>
                <li>Nothing is tracked. Nothing loads from other sites.</li>
                <li>Works on a phone, a tablet or a projector.</li>
                <li>Set the arm span to the person standing in front of it.</li>
              </ul>
            </Section>
          </div>

          <div class="flex flex-col gap-8">
            <Section title="Licence">
              <p>Use it, change it, sell it. Only keep the credit.</p>
              <Rows>
                <Row term="Words, dates, design">
                  <OutLink href="https://creativecommons.org/licenses/by/4.0/">
                    CC BY 4.0
                  </OutLink>
                </Row>
                <Row term="Code">
                  <OutLink href="https://opensource.org/license/mit">
                    MIT
                  </OutLink>
                </Row>
                <Row term="The drawing">Public domain</Row>
              </Rows>
              <p>
                Credit it as <span class="text-base-content">{CREDIT}</span>,
                with a link back to this page.
              </p>
            </Section>

            <Section title="Credits">
              <Rows>
                <Row term="Drawing">
                  Leonardo da Vinci, <em>Vitruvian Man</em> (c. 1490). Public
                  domain, via{" "}
                  <OutLink href="https://commons.wikimedia.org/wiki/File:Da_Vinci_Vitruve_Luc_Viatour.jpg">
                    Wikimedia Commons
                  </OutLink>
                  .
                </Row>
                {/* McPhee first: his king's arm and nail file (1981) are where
                    the picture comes from. The museum's video came after. */}
                <Row term="Idea">
                  We thought of it, then found that others had it first: John
                  McPhee, in{" "}
                  <em>
                    <OutLink href="https://en.wikipedia.org/wiki/Annals_of_the_Former_World">
                      Basin and Range
                    </OutLink>
                  </em>{" "}
                  (1981), and the{" "}
                  <OutLink href="https://www.youtube.com/watch?v=uMXt0eGXuZc">
                    Natural History Museum of Los Angeles County
                  </OutLink>
                  .
                </Row>
                <Row term="Generation">
                  One generation is {meta.generationYears} years
                  <Show when={generationCredit} fallback=".">
                    {(credit) => (
                      <>
                        , after{" "}
                        <Show
                          when={credit().url}
                          fallback={
                            <span title={credit().detail}>
                              {credit().label}
                            </span>
                          }
                        >
                          {(href) => (
                            <OutLink href={href()} title={credit().detail}>
                              {credit().label}
                            </OutLink>
                          )}
                        </Show>
                        .
                      </>
                    )}
                  </Show>
                </Row>
                <Row term="Dates">
                  Every date carries its source on its card.
                </Row>
                <Row term="Updated">{meta.generated}</Row>
              </Rows>
            </Section>
          </div>
        </div>

        {/* Support on the left, Close on the right: one bar, always in view. */}
        <footer class="border-base-300 bg-base-200/50 flex flex-wrap items-center justify-between gap-3 border-t px-6 py-5 sm:px-14">
          <div class="flex flex-wrap items-center gap-3">
            <KofiLink big />
            <p class="text-base-content/60 text-xs">
              Free, with no adverts. A coffee keeps it going.
            </p>
          </div>
          <form method="dialog">
            <button class="btn btn-sm">Close</button>
          </form>
        </footer>
      </div>
      {/* Clicking the dark outside closes it. */}
      <form method="dialog" class="modal-backdrop">
        <button aria-label="Close">close</button>
      </form>
    </dialog>
  );
}
