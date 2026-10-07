"use client";
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { cx } from "@/components/ui/utils";
import { reorder, saveReaction, saveTag, setReactionActive, setTagActive } from "./misc-actions";

interface Item {
  id: string;
  label: string;
  active: boolean;
  /** themes: description; reactions: emoji */
  extra: string;
  count?: number;
}

/** Shared editor for themes and reactions: add, rename, hide/show, reorder. */
function ListEditor({
  kind,
  items,
}: {
  kind: "tags" | "reactions";
  items: Item[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState({ label: "", extra: "" });
  const isTags = kind === "tags";

  const run = (fn: () => Promise<{ ok: boolean; message?: string }>, after?: () => void) =>
    start(async () => {
      const r = await fn();
      setMessage(r.message ?? null);
      if (r.ok) {
        after?.();
        router.refresh();
      }
    });

  const submit = (id?: string) =>
    run(
      () => (isTags ? saveTag({ id, label: draft.label, description: draft.extra }) : saveReaction({ id, label: draft.label, emoji: draft.extra })),
      () => {
        setEditing(null);
        setDraft({ label: "", extra: "" });
      },
    );

  const move = (i: number, d: number) => {
    const ids = items.map((x) => x.id);
    const [m] = ids.splice(i, 1);
    ids.splice(i + d, 0, m);
    run(() => reorder(isTags ? "tags" : "reaction_types", ids));
  };

  const form = (id?: string) => (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      {!isTags ? (
        <Field id={`emoji-${id ?? "new"}`} label="Emoji">
          <TextInput id={`emoji-${id ?? "new"}`} value={draft.extra} maxLength={16} className="w-24 text-center text-xl" onChange={(e) => setDraft({ ...draft, extra: e.target.value })} />
        </Field>
      ) : null}
      <div className="flex-1">
        <Field id={`label-${id ?? "new"}`} label={isTags ? "Theme" : "Word"}>
          <TextInput id={`label-${id ?? "new"}`} value={draft.label} maxLength={isTags ? 40 : 30} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
        </Field>
      </div>
      {isTags ? (
        <div className="flex-1">
          <Field id={`desc-${id ?? "new"}`} label="Description" optional>
            <TextInput id={`desc-${id ?? "new"}`} value={draft.extra} maxLength={200} onChange={(e) => setDraft({ ...draft, extra: e.target.value })} />
          </Field>
        </div>
      ) : null}
      <Button onClick={() => submit(id)} loading={pending}>
        {id ? "Save" : "Add"}
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {message ? (
        <p role="status" className="rounded-md bg-accent-soft p-3 text-sm">
          {message}
        </p>
      ) : null}
      <ul className="flex flex-col gap-2">
        {items.map((item, i) => (
          <li key={item.id} className={cx("flex flex-col gap-3 rounded-lg border border-border bg-surface-raised p-3", !item.active && "opacity-60")}>
            {editing === item.id ? (
              form(item.id)
            ) : (
              <div className="flex items-center gap-2">
                {!isTags ? <span className="text-2xl">{item.extra}</span> : null}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {item.label} {!item.active ? <span className="text-xs text-fg-subtle">(hidden)</span> : null}
                  </p>
                  {isTags && item.extra ? <p className="truncate text-xs text-fg-muted">{item.extra}</p> : null}
                  {item.count !== undefined ? <p className="text-xs text-fg-subtle">{item.count} stories</p> : null}
                </div>
                <button type="button" aria-label="Move up" disabled={i === 0 || pending} onClick={() => move(i, -1)} className="inline-flex size-10 items-center justify-center rounded-full hover:bg-surface disabled:opacity-30">
                  <ArrowUp className="size-4" aria-hidden />
                </button>
                <button type="button" aria-label="Move down" disabled={i === items.length - 1 || pending} onClick={() => move(i, 1)} className="inline-flex size-10 items-center justify-center rounded-full hover:bg-surface disabled:opacity-30">
                  <ArrowDown className="size-4" aria-hidden />
                </button>
                <button type="button" aria-label={`Rename ${item.label}`} onClick={() => { setEditing(item.id); setDraft({ label: item.label, extra: item.extra }); }} className="inline-flex size-10 items-center justify-center rounded-full hover:bg-surface">
                  <Pencil className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label={item.active ? `Hide ${item.label}` : `Show ${item.label}`}
                  disabled={pending}
                  onClick={() => run(() => (isTags ? setTagActive(item.id, !item.active) : setReactionActive(item.id, !item.active)))}
                  className="inline-flex size-10 items-center justify-center rounded-full hover:bg-surface"
                >
                  {item.active ? <Eye className="size-4" aria-hidden /> : <EyeOff className="size-4" aria-hidden />}
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      <section className="rounded-xl border border-dashed border-border-strong p-4">
        <h2 className="mb-3 text-lg">{isTags ? "Add a theme" : "Add a reaction"}</h2>
        {editing ? <p className="text-sm text-fg-muted">Finish editing above first.</p> : form()}
      </section>
    </div>
  );
}

export function TagEditor({ items }: { items: Item[] }) {
  return <ListEditor kind="tags" items={items} />;
}

export function ReactionEditor({ items }: { items: Item[] }) {
  return <ListEditor kind="reactions" items={items} />;
}
