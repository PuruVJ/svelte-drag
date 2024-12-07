<p align="center">
<a href="https://www.neodrag.dev"><img src="https://www.neodrag.dev/logo.svg" height="150" /></a>
</p>

<h1 align="center">
@neodrag/vanilla
</h1>

<h2 align="center">
One draggable to rule em all
</h2>

<p align="center">A lightweight vanillaJS library to make your elements draggable.</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@neodrag/vanilla"><img src="https://img.shields.io/npm/v/@neodrag/vanilla?color=fff&label="></a>
<p>

<p align="center"><a href="https://www.neodrag.dev/docs/vanilla">Getting Started</a></p>

# Features

- 🤏 Tiny - Only 1.79KB min+brotli.
- 🐇 Simple - Quite simple to use, and effectively no-config required!
- 🧙‍♀️ Elegant - Single class, very easy to use.
- 🗃️ Highly customizable - Offers tons of options that you can modify to get different behavior.
- ⚛️ Reactive - Change options passed to it on the fly, it will **just work 🙂**

# Installing

```bash
pnpm add @neodrag/vanilla

# npm
npm install @neodrag/vanilla

# yarn
yarn add @neodrag/vanilla
```

# Usage

Basic usage

```tsx
import { Draggable } from '@neodrag/vanilla';

const dragInstance = new Draggable(document.querySelector('#drag'));
```

With options

```tsx
import { Draggable } from '@neodrag/vanilla';

const dragInstance = new Draggable(document.querySelector('#drag'), {
	axis: 'x',
	grid: [10, 10],
});
```

Defining options elsewhere with typescript

```tsx
import { type Draggable } from '@neodrag/vanilla';

const options: DragOptions = {
	axis: 'y',
	bounds: 'parent',
};

const dragInstance = new Draggable(document.querySelector('#drag'), options);
```

Update options:

```ts
import { Draggable } from '@neodrag/vanilla';

const dragInstance = new Draggable(document.querySelector('#drag'), {
	axis: 'x',
	grid: [10, 10],
});

// Update the specific options. Will be merged with the existing options.
dragInstance.options.axis = 'y';

// Completely overrides existing options, in this case, the `grid` property is removed
dragInstance.options = {
	axis: 'y',
};
```

> NOTE: dragInstance.options is internally a Proxy, allowing the nice `.options[PROPERTY] = VALUE` syntax. If you wish to read the raw value, use `dragInstance.optionsJSON`.

Using via CDN

For users who prefer not to install the package and instead use it directly in their projects via a CDN, you can include `@neodrag/vanilla` directly in your HTML files. This is particularly useful for quick prototyping or projects where you want to avoid a build step. Here’s how to include it using different CDNs:

Using Unpkg

Include the library in your HTML using the following `<script>` tag. This will load the latest version of `@neodrag/vanilla` directly from unpkg:

```html
<script src="https://unpkg.com/@neodrag/vanilla@latest/dist/umd/index.js"></script>
```

Using jsDelivr

Alternatively, you can use jsDelivr as a CDN to load `@neodrag/vanilla`. Include the following line in your HTML:

```html
<script src="https://cdn.jsdelivr.net/npm/@neodrag/vanilla@latest/dist/umd/index.js"></script>
```

Usage with CDN

After including the library via a CDN, `@neodrag/vanilla` will be available as a global variable `NeoDrag`. Here’s how you can use it to make an element draggable:

```html
<div id="drag">Drag me!</div>
<script>
	var dragInstance = new NeoDrag.Draggable(document.getElementById('drag'));
</script>
```

This method allows you to use `@neodrag/vanilla` without any build tools or npm installations, directly in your browser.

<a href="https://www.neodrag.dev/docs/vanilla" style="font-size: 2rem">Read the docs</a>

## Credits

Inspired from the amazing [react-draggable](https://github.com/react-grid-layout/react-draggable) library, and implements even more features with a similar API, but 3.7x smaller.

# License

MIT License &copy; Puru Vijay
