import { useCallback, useEffect, useState } from "react";

export function useFetch(loader, deps) {
  const [state, setState] = useState({ data: null, error: "", loading: true });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    setState((previous) => ({ ...previous, loading: true, error: "" }));
    loader()
      .then((data) => active && setState({ data, error: "", loading: false }))
      .catch((err) => active && setState({ data: null, error: err.message, loading: false }));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);

  const reload = useCallback(() => setVersion((value) => value + 1), []);
  return { ...state, reload };
}
