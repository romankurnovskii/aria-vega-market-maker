# Feature Request: Open and Edit Saved Strategies in the GUI

## Objective

Enable users to load, view, and edit previously saved custom strategy definitions directly from the Strategy Builder GUI. Currently, users can create and save strategies, but there is no interface in the frontend to reload a saved strategy into the builder canvas for modification.

---

## User-Facing UX/UI Design

### 1. Strategy Selector Dropdown

- Add a dropdown at the top navigation bar of the **Strategy Builder** next to the Strategy Name input.
- Displays a list of all custom saved strategies retrieved from the backend.
- Selecting a strategy from this dropdown will prompt the user (if there are unsaved changes) and load the selected strategy definition into the canvas.

### 2. "New Strategy" Button

- Add a "Reset/New" button to clear the canvas and initialize it with the default `context-setup` step.

### 3. Edit & Update Flow

- When a saved strategy is loaded, the Save button shifts action to update that specific strategy (sending `POST /strategies` with the matching ID) rather than creating a new one.

---

## Technical Implementation Plan

### 1. Backend (`apps/engine`)

#### `GET /strategies` / `GET /strategies/:id`

- **Modify** `apps/engine/src/routes/introspection.ts` to support fetching the full JSON strategy definition:
  - Create a new endpoint `GET /strategies/:id` to retrieve a single saved strategy's full AST (including steps and params) from the `strategyStore`.
  - Alternatively, extend `GET /strategies` to accept a query parameter `?full=true` or return the full configuration if requested.
- **Update** `apps/engine/src/openapi.yaml` to document the new `GET /strategies/:id` endpoint.

```typescript
// Proposed route addition in introspection.ts
router.get('/strategies/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const strategies = await strategyStore.getStrategies();
    const strategy = strategies.find((s) => s.id === id);
    if (!strategy) {
      res.status(404).json({ error: `Strategy with ID ${id} not found.` });
      return;
    }
    res.json(strategy);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});
```

---

### 2. Frontend (`apps/frontend`)

#### A. API Hook (`apps/frontend/src/app/hooks/useStrategyApi.ts`)

- Add `fetchStrategies`: `GET /strategies` to get the list of saved strategies.
- Add `fetchStrategyById`: `GET /strategies/:id` to fetch a specific strategy definition.

```typescript
const fetchStrategies = useCallback(async (): Promise<{ id: string; description: string }[]> => {
  const res = await fetch(`${API_BASE_URL}/strategies`);
  if (!res.ok) throw new Error(`Failed to fetch strategies`);
  const data = await res.json();
  return data.strategies || [];
}, []);

const fetchStrategyById = useCallback(async (id: string): Promise<StrategyDefinition | null> => {
  const res = await fetch(`${API_BASE_URL}/strategies/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch strategy ${id}`);
  return await res.json();
}, []);
```

#### B. Zustand Store (`apps/frontend/src/app/stores/useStrategyBuilderStore.ts`)

- Add `loadStrategy` action:

```typescript
loadStrategy: (definition: StrategyDefinition) =>
  set({
    id: definition.id,
    name: definition.name || 'Untitled Strategy',
    description: definition.description || '',
    simulationConfig: definition.simulationConfig || { poolAddress: '', positionId: '' },
    steps: definition.steps.map((s, idx) => ({
      ...s,
      instanceId: `${s.stepId}-${Date.now()}-${idx}`,
    })),
  });
```

#### C. Container & Component Integration (`apps/frontend/src/app/containers/StrategyBuilderContainer.tsx`)

- Call `fetchStrategies` on mount to populate the strategy list.
- Render the selector dropdown in the navbar header.
- Add confirmation modal if loading a strategy over an unsaved draft canvas.

---

## Verification Plan

### Automated Tests

- Add integration tests verifying the `GET /strategies/:id` endpoint in `apps/engine/src/routes/positions.test.ts` or a new test suite.
- Add unit tests for `loadStrategy` in `apps/frontend/src/app/stores/useStrategyBuilderStore.test.ts`.

### Manual Verification

1. Create a strategy in the builder GUI and save it.
2. Verify that the strategy appears in the selector dropdown.
3. Refresh the page or clear the canvas.
4. Load the saved strategy via the dropdown and verify all steps and parameters load correctly.
