# City Layout Tree View Integration Plan

This document translates the standalone `new_tree_layout.html` prototype into actionable steps for integrating the "Family City" / force-directed layout into the existing React tree experience (`frontend/src/components/tree`).

## 1. Target Experience
- Offer a new view mode (`TreeViewMode`) alongside Network/Pedigree/etc. that renders the D3-style force layout with generation bands (tree) and a "city" toggle.
- Preserve existing filters, search, and person selection semantics so every view uses the same `ExtendedTreeNode[]` derived from API data.
- Provide zoom/pan/drag interactions, freeze/unfreeze physics, layout toggle, and reset view controls as in the prototype.

## 2. Data Mapping
1. Extend the memoized converter in `EnhancedTreeView` to produce `{ nodes, links }`:
   - Each `ExtendedTreeNode` becomes `{ id, name, family, generationNumber, branchId, isAlive, ... }`.
   - Parent links: derive from `node.parents` (type `parent`).
   - Partner links: derive from `node.spouses` (type `partnership`), dedupe via ordered ids.
2. Include optional metadata for the React overlay (e.g., `bio`, branch label) so the details panel can display consistent information.
3. Memoize the generation calculation (similar to `calculateGenerations` in the prototype) so level information survives React re-renders without recomputation.

## 3. New Component: `CityGraph`
- Location: `frontend/src/components/tree/CityGraph.tsx`.
- Responsibilities:
  - Own the `<svg>` container via `useRef`.
  - Initialize the D3 force simulation in a `useEffect` that runs whenever the data or layout state changes.
  - Handle cleanup by stopping the simulation, removing event listeners, and clearing DOM nodes.
  - Expose callbacks (`onPersonSelect`) so clicks tie into the global selection logic.
  - Maintain local state for `isTreeLayout`, `isSimulationActive`, and zoom transforms; render buttons that mirror the prototype controls but use Tailwind classes from the existing design system.
- Implementation notes:
  - Wrap D3 logic in imperative helper functions to keep the component readable (e.g., `buildSimulation`, `upsertNodes`).
  - Use `d3.zoom()` to toggle label visibility and expose reset functionality.
  - Drag handlers should respect the freeze flag by keeping `fx/fy` pinned when physics is off.

## 4. Wire-Up in `EnhancedTreeView`
1. Update `TreeViewMode` union and select dropdown to include `city` (or `force`).
2. Render `<CityGraph>` when `viewMode === 'city'`. Pass:
   - `nodes={viewNodes}` (already filtered),
   - `links={cityLinks}` from the memoized converter,
   - `onPersonSelect`,
   - `focusPersonId` for optional highlighting.
3. Ensure switching to this view clears/sets `focusPersonId` consistently (similar to network mode).
4. Keep info bars, filters, search, and stats untouched so the new view benefits from existing UI.

## 5. Styling & Shared Utilities
- Move prototype CSS into either:
  - Tailwind utility classes applied in React, or
  - A scoped CSS module imported by `CityGraph`.
- Extract the `getStableColor` helper into `frontend/src/utils/color.ts` (or similar) for reuse by other views (NetworkGraph currently uses branch styling only).
- If we need the floating info panel, build it as a React component (e.g., `CityGraphOverlay`) instead of direct DOM manipulation.

## 6. Validation Checklist
- ✅ Respect filters/search: verify toggling filters reduces nodes in the city view.
- ✅ Selection callback: clicking a node highlights it and propagates to parent components (details drawer, etc.).
- ✅ Performance: test with large trees; consider throttling simulation restarts and giving users the freeze button by default if needed.
- ✅ Accessibility: keyboard focus for action buttons, aria labels, and ensure color contrast of links/nodes meets guidelines.

## 7. Open Questions
1. Should the city layout share the same legend + info panel as existing views or introduce a dedicated overlay?
2. Do we need persistence of manual node positions across sessions (store `fx/fy` in backend) or is per-session layout sufficient?
3. Should branch colors align with existing branch badges to keep visual language consistent?
