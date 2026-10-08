import { docIcon } from "@/app/lib/doc-icon";

/**
 * Preview tile for a repository entry: the thumbnail when there is one,
 * otherwise a type icon. A fixed 4:3 light box — page renders are white
 * paper, so it reads the same in both themes. Usable from server and client
 * components alike (no hooks, no server-only imports).
 */
export default function DocThumb({
  src,
  kind,
  filename,
  title,
}: {
  src: string | null;
  kind: string;
  filename: string;
  title?: string;
}) {
  return (
    <span className="doc-thumb" title={title}>
      {src ? (
        // Private per-user URLs: a plain <img> on purpose (next/image would
        // need a loader and caches optimized copies publicly).
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" decoding="async" />
      ) : (
        <i className={`fa-solid ${docIcon(kind, filename)}`} aria-hidden="true"></i>
      )}
    </span>
  );
}
