# Refactoring SortableTaskList.jsx from react-beautiful-dnd to @dnd-kit/core

This document outlines the steps needed to replace `react-beautiful-dnd` with `@dnd-kit/core` in the `SortableTaskList.jsx` component.

**Tasks:**

1.  **Install Dependencies:**
    *   `@dnd-kit/core`
    *   `@dnd-kit/sortable`
    *   `@dnd-kit/modifiers` (Optional, but useful for common drag behaviors like snapping)
    *   *(Done)*

2.  **Understand `SortableTaskList.jsx`:**
    *   Analyze the existing component's props (`tasks`, `onDragEnd`).
    *   Understand how `DragDropContext`, `Droppable`, and `Draggable` are used to render the list and handle reordering.
    *   Identify the data structure expected by `onDragEnd`.

3.  **Refactor Imports:**
    *   Remove imports from `react-beautiful-dnd`.
    *   Add imports from `@dnd-kit/core`, `@dnd-kit/sortable`, etc.

4.  **Implement `DndContext`:**
    *   Wrap the sortable list area with `<DndContext>`.
    *   Provide necessary props: `sensors`, `collisionDetection`, `onDragEnd`.
    *   Configure sensors (e.g., `PointerSensor`, `KeyboardSensor`).

5.  **Implement `SortableContext`:**
    *   Wrap the list of items with `<SortableContext>`.
    *   Provide the list of item IDs (`tasks.map(task => task.id)`).
    *   Choose a sorting strategy (e.g., `verticalListSortingStrategy`).

6.  **Create Sortable Item Component:**
    *   Create a new component (e.g., `SortableTaskItem`) or modify the existing item rendering logic.
    *   Use the `useSortable` hook within this component.
    *   Apply `attributes`, `listeners`, and `transform`/`transition` styles provided by `useSortable` to the draggable element.
    *   Render the actual task content within this component.

7.  **Update List Rendering:**
    *   Map over the `tasks` array.
    *   Render the `SortableTaskItem` component for each task, passing the `task` data and importantly, the `task.id` as the `id` prop for `SortableContext`.

8.  **Adapt `onDragEnd` Handler:**
    *   The `onDragEnd` event object from `@dnd-kit` has a different structure (`{ active, over }`).
    *   Extract the `id` from `active` and `over`.
    *   Find the original and new indices based on these IDs.
    *   Use a utility like `arrayMove` (from `@dnd-kit/sortable`) or implement logic to create the reordered list.
    *   Call the original `onDragEnd` prop passed to `SortableTaskList` with the *correctly formatted* result (matching what `react-beautiful-dnd` provided, if necessary for compatibility upstream).

9.  **Styling and Accessibility:**
    *   Ensure dragged items have appropriate visual styles (e.g., using `isDragging` from `useSortable`).
    *   Verify keyboard navigation and screen reader accessibility.
    *   Apply modifiers if needed (e.g., `restrictToVerticalAxis`).

10. **Remove `react-beautiful-dnd`:**
    *   Once refactoring is complete and tested, uninstall `react-beautiful-dnd`: `npm uninstall react-beautiful-dnd`.

11. **Testing:**
    *   Thoroughly test drag-and-drop functionality, including edge cases and keyboard interaction.
    *   Run the build (`npm run build:safe`) to confirm the original build error is resolved. 