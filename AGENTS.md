<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- All ERP data lives in one persisted zustand store (src/lib/store.ts), rehydrated client-side after mount — keeps SSR output matching first client render.
- Derived values (car status, overdue, invoice status, balances, profit) are computed in src/lib/calc.ts, never stored — so numbers can't drift out of sync.
- Create/edit forms are side sheets opened via the global UI store (src/lib/ui.ts) — any page can launch any form.
- Revenue is counted when payments are received; never seed demo records.
