# hadaryaCRM Design System (Pencil)

Design files for the visual redesign. Managed via Pencil MCP.

## Files

- **hadarya-design-system.pen** — Design system tokens: colors, typography, spacing, Button/Input/Card/Badge components. Access via Pencil MCP tools (`batch_get`, `batch_design`, etc.) with path `designs/hadarya-design-system.pen` or absolute path to this directory.

## Usage

```text
# In Cursor, use Pencil MCP:
batch_get({ filePath: "designs/hadarya-design-system.pen", patterns: [{ reusable: true }] })
```
