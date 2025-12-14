# Custom Template Builder

> Priority: P3 | Impact: 🔥🔥 | Effort: High

## Summary

Drag-and-drop template editor for advanced customization. Save campaigns as reusable templates.

## Why

Power users and agencies want full control. Creates stickiness and upsell opportunity.

## Features

### Drag-and-Drop Editor
- [ ] Element library (text, image, button, form, timer)
- [ ] Drag elements onto canvas
- [ ] Resize and position elements
- [ ] Layer management (bring to front, send to back)

### Element Customization
- [ ] Font family, size, weight, color
- [ ] Background colors/images
- [ ] Borders and shadows
- [ ] Padding and margins
- [ ] Hover states

### Custom CSS
- [ ] Advanced CSS injection
- [ ] CSS variables for theming
- [ ] Preview with CSS applied

### Save as Template
- [ ] Save campaign as reusable template
- [ ] Template library (personal templates)
- [ ] Share templates (for agencies)

## Technical Challenges

### Rendering Engine
Need consistent rendering between:
- Admin preview
- Storefront (Shadow DOM)
- Mobile devices

### Data Model

```typescript
interface CustomTemplate {
  id: string,
  name: string,
  elements: TemplateElement[],
  styles: Record<string, string>,
  customCSS?: string,
}

interface TemplateElement {
  id: string,
  type: "text" | "image" | "button" | "form" | "timer",
  position: { x: number, y: number },
  size: { width: number, height: number },
  props: Record<string, any>,
  styles: Record<string, string>,
}
```

### Editor Libraries
- Fabric.js
- Konva.js
- Custom React implementation

## MVP Approach

Start with "CSS customization" before full drag-and-drop:
1. Advanced styling panel
2. Custom CSS textarea
3. Element visibility toggles

## Related Files

- `app/domains/campaigns/components/` (new editor)
- `app/domains/templates/` (template storage)

