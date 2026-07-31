# Essential HTML & CSS Knowledge for Beginners

> Sources: MDN Web Docs (developer.mozilla.org)

---

## 1. Essential HTML Elements

### 1.1 Document Structure (Every Page Needs These)

| Tag | Purpose | Example |
|-----|---------|---------|
| `<!doctype html>` | Declares the document as HTML5; must be first line | `<!doctype html>` |
| `<html>` | Root element wrapping all content; include `lang` attribute | `<html lang="en">` |
| `<head>` | Container for metadata (title, charset, CSS links) — not visible to users | `<head>...</head>` |
| `<meta charset="utf-8">` | Sets character encoding to UTF-8 (supports all languages) | `<meta charset="utf-8" />` |
| `<title>` | Sets the browser tab title and bookmark name | `<title>My Page</title>` |
| `<body>` | Contains all visible page content | `<body>...</body>` |

### 1.2 Text Content

| Tag | Purpose | Key Points |
|-----|---------|------------|
| `<h1>` – `<h6>` | Headings (h1 = most important, h6 = least) | Use only one `<h1>` per page; follow hierarchy |
| `<p>` | Paragraph of text | Block-level; browser adds default margin |
| `<strong>` | Text with strong importance (bold by default) | Semantic meaning, not just visual |
| `<em>` | Emphasized text (italic by default) | For stress emphasis; `<i>` is for visual italic only |
| `<span>` | Inline wrapper for styling text portions | No semantic meaning; use with `class` for CSS targeting |
| `<br>` | Line break (void element — no closing tag) | `<br>` or `<br />` both work |
| `<pre>` | Preformatted text — preserves whitespace and line breaks | Useful for code blocks |
| `<blockquote>` | Block-level quotation | Use `cite` attribute for source URL |
| `<code>` | Inline code snippet | Often paired with `<pre>` for code blocks |

### 1.3 Links & Navigation

| Tag | Purpose | Key Attributes |
|-----|---------|----------------|
| `<a>` | Anchor / hyperlink | `href="url"` — destination URL; `target="_blank"` — open in new tab; `title` — tooltip on hover |
| `<nav>` | Semantic navigation container | Wraps main site navigation links |

### 1.4 Images & Media

| Tag | Purpose | Key Attributes |
|-----|---------|----------------|
| `<img>` | Embeds an image (void element) | `src` (required) — image URL; `alt` — text description for accessibility; `width` / `height` — dimensions in pixels |
| `<video>` | Embeds video | `controls`, `autoplay`, `muted`, `loop`, `src` |
| `<audio>` | Embeds audio | `controls`, `autoplay`, `src` |
| `<figure>` / `<figcaption>` | Self-contained media with caption | `<figcaption>` goes inside `<figure>` |

### 1.5 Lists

| Tag | Purpose |
|-----|---------|
| `<ul>` | Unordered list (bullet points) |
| `<ol>` | Ordered list (numbered) |
| `<li>` | List item — child of `<ul>` or `<ol>` |
| `<dl>` / `<dt>` / `<dd>` | Description list — term + definition |

### 1.6 Layout / Structure (Semantic HTML)

| Tag | Purpose |
|-----|---------|
| `<div>` | Generic block-level container (no semantic meaning) |
| `<span>` | Generic inline container (no semantic meaning) |
| `<header>` | Page or section header |
| `<footer>` | Page or section footer |
| `<main>` | Dominant content of the page (use once per page) |
| `<section>` | Thematic grouping of content |
| `<article>` | Self-contained, independently distributable content |
| `<aside>` | Tangentially related content (sidebar) |
| `<nav>` | Major navigation blocks |

### 1.7 Forms

| Tag | Purpose | Key Attributes / Types |
|-----|---------|------------------------|
| `<form>` | Form container | `action` — submit URL; `method` — `GET` or `POST` |
| `<input>` | Form input (void element) | `type="text\|email\|password\|number\|checkbox\|radio\|file\|submit\|date\|..."`; `placeholder`; `required`; `disabled` |
| `<label>` | Label for an input | `for="input-id"` — links to input; improves accessibility |
| `<textarea>` | Multi-line text input | `rows`, `cols` |
| `<select>` / `<option>` | Dropdown menu | `<option>` elements nested inside `<select>` |
| `<button>` | Clickable button | `type="submit\|reset\|button"` |

### 1.8 Tables

| Tag | Purpose |
|-----|---------|
| `<table>` | Table container |
| `<tr>` | Table row |
| `<th>` | Table header cell (bold, centered by default) |
| `<td>` | Table data cell |
| `<thead>` / `<tbody>` / `<tfoot>` | Table sections for semantic grouping |

---

## 2. Essential CSS Concepts

### 2.1 CSS Basics — How to Apply Styles

Three ways to add CSS:

| Method | Syntax | Best Practice |
|--------|--------|---------------|
| **External stylesheet** | `<link rel="stylesheet" href="style.css">` in `<head>` | **Preferred** — keeps HTML clean |
| **Internal `<style>` block** | `<style> h1 { color: red; } </style>` in `<head>` | Small pages only |
| **Inline style** | `<p style="color: red;">` | Avoid — mixes content with presentation |

CSS rule anatomy:

```css
selector {
  property: value;
  /* declaration */
}
```

---

### 2.2 Selectors

| Selector Type | Syntax | What It Selects | Example |
|---------------|--------|-----------------|---------|
| **Type (element)** | `element` | All elements of that type | `p { }` — all `<p>` tags |
| **Class** | `.classname` | All elements with that class | `.highlight { }` |
| **ID** | `#idname` | The single element with that ID (unique per page) | `#header { }` |
| **Universal** | `*` | Every element | `* { margin: 0; }` |
| **Multiple classes on one element** | `.class1.class2` | Element must have both classes | `.notebox.warning { }` |
| **Element + class** | `element.class` | Only that element with that class | `span.highlight { }` |
| **Descendant** | `ancestor descendant` | Elements nested inside ancestor | `article p { }` |
| **Child** | `parent > child` | Direct children only | `ul > li { }` |
| **Group (selector list)** | `a, b` | Multiple selectors with same styles | `h1, h2, h3 { }` |
| **Pseudo-class** | `:state` | Elements in a specific state | `a:hover { }`, `li:first-child { }`, `:nth-of-type(3) { }` |
| **Pseudo-element** | `::part` | A specific part of an element | `p::first-line { }` |
| **Attribute** | `[attr]` or `[attr="value"]` | Elements with a given attribute | `[type="text"] { }` |

---

### 2.3 The Box Model

Every HTML element is a rectangular box. From inside to outside:

```
┌─────────────────────────────────────┐
│              margin                  │  ← Outside spacing (transparent)
│  ┌───────────────────────────────┐  │
│  │           border              │  │  ← Visible edge
│  │  ┌─────────────────────────┐  │  │
│  │  │         padding         │  │  │  ← Inside spacing
│  │  │  ┌───────────────────┐  │  │  │
│  │  │  │     content       │  │  │  │  ← Text / image
│  │  │  └───────────────────┘  │  │  │
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Key properties:**

| Property | What It Controls | Example |
|----------|-----------------|---------|
| `width` / `height` | Content area size | `width: 300px; height: 200px;` |
| `padding` | Space inside the border | `padding: 20px;` or `padding: 10px 20px 10px 20px;` (top right bottom left) |
| `border` | Visible edge around padding | `border: 2px solid black;` |
| `margin` | Space outside the border | `margin: 10px auto;` (auto centers block elements horizontally) |

**`box-sizing: border-box`** — Makes `width`/`height` include padding and border (easier to reason about). Modern CSS resets apply this globally.

---

### 2.4 Essential Styling Properties

| Category | Properties | Examples |
|----------|------------|----------|
| **Colors** | `color` (text), `background-color` | `color: #333; background-color: #f0f0f0;` |
| **Typography** | `font-family`, `font-size`, `font-weight`, `font-style`, `line-height`, `text-align`, `text-decoration` | `font-family: sans-serif; font-size: 16px; line-height: 1.5;` |
| **Spacing** | `margin`, `padding` | See Box Model above |
| **Borders** | `border`, `border-radius` | `border: 1px solid #ccc; border-radius: 8px;` |
| **Background** | `background-color`, `background-image`, `background-size` | `background-color: white;` |
| **Display** | `display` | `block`, `inline`, `inline-block`, `none`, `flex`, `grid` |
| **Position** | `position` + `top/right/bottom/left` | `relative`, `absolute`, `fixed`, `sticky` |
| **Overflow** | `overflow` | `hidden`, `scroll`, `auto` |
| **Shadow** | `box-shadow`, `text-shadow` | `box-shadow: 2px 2px 5px rgba(0,0,0,0.2);` |
| **Opacity** | `opacity` | `opacity: 0.5;` (0 = transparent, 1 = opaque) |
| **Cursor** | `cursor` | `pointer` (hand on hover), `default`, `not-allowed` |
| **Transitions** | `transition` | `transition: all 0.3s ease;` |

---

### 2.5 Flexbox — One-Dimensional Layout

**Activate:** `display: flex;` on the parent (creates a **flex container**; children become **flex items**).

**Key Terminology:**
- **Main axis** — direction items flow (horizontal for `row`, vertical for `column`)
- **Cross axis** — perpendicular to the main axis

**Container Properties (set on parent):**

| Property | Common Values | What It Does |
|----------|---------------|--------------|
| `display: flex` | `flex` or `inline-flex` | Turns element into a flex container |
| `flex-direction` | `row` (default), `column`, `row-reverse`, `column-reverse` | Sets direction of the main axis |
| `flex-wrap` | `nowrap` (default), `wrap`, `wrap-reverse` | Allows items to wrap to new lines |
| `flex-flow` | shorthand: `row wrap` | Combines `flex-direction` and `flex-wrap` |
| `justify-content` | `flex-start`, `flex-end`, `center`, `space-between`, `space-around`, `space-evenly` | Aligns items along the **main axis** |
| `align-items` | `stretch` (default), `flex-start`, `flex-end`, `center`, `baseline` | Aligns items along the **cross axis** |
| `align-content` | `stretch`, `center`, `space-between`, `space-around` | Aligns multiple lines of items on the cross axis |
| `gap` | e.g. `20px` | Spacing between flex items (modern alternative to margins) |

**Item Properties (set on children):**

| Property | Common Values | What It Does |
|----------|---------------|--------------|
| `flex` | shorthand: `flex: 1;` or `flex: 1 100px;` | Controls how item grows/shrinks and its base size |
| `flex-grow` | number (unitless) | Proportion of available space this item takes |
| `flex-shrink` | number | How much item shrinks relative to others when space is tight |
| `flex-basis` | length (e.g., `100px`) | Initial size before growing/shrinking |
| `align-self` | same as `align-items` | Overrides `align-items` for this individual item |
| `order` | integer (default `0`) | Changes visual order (lower numbers = earlier) |

**Common Flexbox patterns:**
- Equal columns: `flex: 1;` on each child
- Centering: `display: flex; justify-content: center; align-items: center;` on parent
- Navbar: `display: flex; justify-content: space-between;` on parent

---

### 2.6 CSS Grid — Two-Dimensional Layout

**Activate:** `display: grid;` on the parent (creates a **grid container**; children become **grid items**).

**Key Terminology:**
- **Columns** — vertical tracks
- **Rows** — horizontal tracks
- **Gap** / **Gutter** — space between tracks
- **Explicit Grid** — tracks defined with `grid-template-*`
- **Implicit Grid** — auto-created tracks for overflow content

**Container Properties (set on parent):**

| Property | Common Values | What It Does |
|----------|---------------|--------------|
| `display: grid` | `grid` or `inline-grid` | Turns element into a grid container |
| `grid-template-columns` | `200px 200px 200px`, `1fr 1fr 1fr`, `repeat(3, 1fr)` | Defines number and size of columns |
| `grid-template-rows` | `100px auto`, `repeat(4, 1fr)` | Defines number and size of rows |
| `grid-template-areas` | `"header header" "sidebar main" "footer footer"` | Named layout areas (visual in code) |
| `gap` (or `row-gap` + `column-gap`) | `20px` | Space between grid cells |
| `grid-auto-rows` | `100px`, `minmax(100px, auto)` | Size of automatically created rows |
| `justify-items` | `start`, `end`, `center`, `stretch` | Aligns items horizontally within their cell |
| `align-items` | `start`, `end`, `center`, `stretch` | Aligns items vertically within their cell |

**Item Properties (set on children):**

| Property | Common Values | What It Does |
|----------|---------------|--------------|
| `grid-column` | `1 / 3` (start line / end line) | Which columns the item spans |
| `grid-row` | `1 / 3` | Which rows the item spans |
| `grid-area` | `header` (name from `grid-template-areas`) | Places item into a named area |

**Key Units & Functions:**
- `fr` — fraction of available space (e.g., `1fr 2fr 1fr` = 25% / 50% / 25%)
- `repeat(3, 1fr)` — repeat a track pattern N times
- `minmax(100px, auto)` — set min and max track size
- `auto-fit` — create as many columns as fit: `repeat(auto-fit, minmax(250px, 1fr))`

**Common Grid patterns:**
- Three equal columns: `grid-template-columns: repeat(3, 1fr);`
- Page layout: `grid-template-areas: "header header" "sidebar main" "footer footer";`
- Responsive card grid: `grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));`

---

### 2.7 Responsive Design

**Core principle:** Make pages look good on all screen sizes (mobile, tablet, desktop).

| Technique | How It Works | Example |
|-----------|-------------|---------|
| **Media Queries** | Apply CSS only when conditions match | `@media (max-width: 768px) { ... }` |
| **Fluid images** | Prevent images from overflowing | `img { max-width: 100%; height: auto; }` |
| **Viewport meta tag** | Required in `<head>` for mobile | `<meta name="viewport" content="width=device-width, initial-scale=1.0">` |
| **Relative units** | Use `%`, `vw`, `vh`, `rem`, `em` instead of fixed `px` everywhere | `width: 80%; font-size: 1rem;` |
| **Mobile-first** | Write base CSS for mobile, then `@media (min-width: ...)` for larger screens | Start small, add complexity upward |
| **Flexbox/Grid** | Layouts naturally adapt to available space without media queries | `flex-wrap: wrap;` or `auto-fit` grid |

**Common breakpoints (guidelines, not rules):**

| Breakpoint | Target |
|------------|--------|
| `@media (max-width: 576px)` | Small phones |
| `@media (max-width: 768px)` | Tablets and larger phones |
| `@media (max-width: 992px)` | Small laptops / landscape tablets |
| `@media (max-width: 1200px)` | Desktops |

---

### 2.8 CSS Cascade & Specificity (Why Styles Override Each Other)

**The Cascade:** When multiple rules target the same element, the browser decides which wins by:
1. **Importance** — `!important` overrides everything (avoid when possible)
2. **Specificity** — More specific selectors win
3. **Source order** — Later rules override earlier ones with same specificity

**Specificity hierarchy (lowest to highest):**
1. Type selectors (`div`, `p`) — value: 0-0-1
2. Class selectors (`.class`), attribute selectors, pseudo-classes — value: 0-1-0
3. ID selectors (`#id`) — value: 1-0-0
4. Inline styles — always win (except `!important`)

**Rule of thumb:** Prefer classes for styling; avoid IDs for CSS; avoid `!important`.

---

## 3. Beginner Learning Path (Recommended Order)

1. **HTML first:** Document structure → text → links → images → lists → forms → semantic layout elements
2. **CSS basics:** Selectors (type, class) → box model → colors/fonts → background/borders
3. **CSS layout:** Flexbox (one-dimensional) → Grid (two-dimensional)
4. **Responsive design:** Viewport meta tag → fluid images → media queries → mobile-first workflow
5. **Practice:** Build small projects (landing page, blog layout, form UI)

---

## 4. Key Resources

- [MDN Web Docs — Learn Web Development](https://developer.mozilla.org/en-US/docs/Learn_web_development) — Comprehensive, authoritative
- [MDN HTML Elements Reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements) — Every HTML element documented
- [MDN CSS Properties Reference](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties) — Every CSS property documented
- [Flexbox Froggy](https://flexboxfroggy.com/) — Game for learning Flexbox
- [Grid Garden](https://cssgridgarden.com/) — Game for learning CSS Grid
- [CSS-Tricks Flexbox Guide](https://css-tricks.com/snippets/css/a-guide-to-flexbox/) — Visual reference
- [CSS-Tricks Grid Guide](https://css-tricks.com/complete-guide-css-grid-layout/) — Visual reference
