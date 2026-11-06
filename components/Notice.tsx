export function ErrorNotice({ error }: { error?: string | string[] | null }) {
  if (!error) return null;
  const list = Array.isArray(error) ? error : [error];
  if (list.length === 0) return null;
  return (
    <div className="notice error" role="alert">
      {list.length === 1 ? list[0] : (
        <ul>{list.map((e) => <li key={e}>{e}</li>)}</ul>
      )}
    </div>
  );
}

export function OkNotice({ message }: { message?: string | null }) {
  if (!message) return null;
  return <div className="notice ok" role="status">{message}</div>;
}

/** First value of a searchParams entry. */
export function sp(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}
