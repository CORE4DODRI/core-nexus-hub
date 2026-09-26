# DODRI module UIs

Each folder here is the front-end of one registered module.

```
src/modules/<slug>/index.tsx   ->  export default function ModuleUI(props) { ... }
```

Rules:

1. The folder name MUST equal the `slug` of the module row in the Core registry
   (Parameters → Modules Management).
2. The file must have a default export React component. It receives
   `{ slug, name, version }`.
3. The Core loads it lazily and renders it inside the dashboard workspace —
   no route change, no page reload.
4. If a module is registered in the database but has no folder here, the Core
   shows its registry details instead (no crash).
5. Business logic stays inside the module folder. The Core only provides
   auth, users, roles, permissions, registry and connections.
