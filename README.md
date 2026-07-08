# Prompts

<p>
    <a href="https://github.com/charmbracelet/huh"><img src="https://img.shields.io/badge/original-huh-blue" alt="Original Huh"></a>
    <a href="https://github.com/yum-tty/prompts"><img src="https://img.shields.io/badge/port--prompts-green" alt="Prompts Port"></a>
    <a href="https://bun.sh"><img src="https://img.shields.io/badge/runtime-bun-black" alt="Bun Runtime"></a>
</p>

Interactive prompts and forms for Bun. A TypeScript port of [Huh](https://github.com/charmbracelet/huh).

Cinnamon Prompts provides a simple way to build interactive command-line forms with text inputs, confirms, selects, and more.

## Installation

```bash
bun add github:yum-tty/prompts
```

Or install from a specific package:

```bash
bun add @yum-tty/prompts
```

## Quick Start

```typescript
import { Form, Input, Confirm, Group, run } from "cinnamon-prompts"

const form = Form([
  Group({
    title: "User Information",
    fields: [
      Input({
        title: "Name",
        placeholder: "Enter your name",
      }),
      Confirm({
        title: "Subscribe to newsletter?",
        affirmitive: "Yes",
        negative: "No",
      }),
    ],
  }),
])

const results = await run(form)
console.log(results)
// { "Name": "John", "Subscribe to newsletter?": true }
```

## Features

### Text Input

```typescript
import { Input } from "cinnamon-prompts"

const input = Input({
  title: "Email",
  placeholder: "user@example.com",
  charLimit: 100,
  validate: (value) => value.includes("@"),
})

// Access value
console.log(input.value)
```

### Confirm

```typescript
import { Confirm } from "cinnamon-prompts"

const confirm = Confirm({
  title: "Delete file?",
  description: "This action cannot be undone",
  affirmitive: "Delete",
  negative: "Cancel",
  value: false,
})

// Access value
console.log(confirm.value) // true or false
```

### Select

```typescript
import { Select } from "cinnamon-prompts"

const select = Select({
  title: "Choose a color",
  options: [
    { label: "Red", value: "red" },
    { label: "Green", value: "green" },
    { label: "Blue", value: "blue" },
  ],
})

// Access value
console.log(select.value) // "red", "green", or "blue"
```

### Multi-Select

```typescript
import { MultiSelect } from "cinnamon-prompts"

const multiSelect = MultiSelect({
  title: "Select toppings",
  options: [
    { label: "Cheese", value: "cheese" },
    { label: "Pepperoni", value: "pepperoni" },
    { label: "Mushrooms", value: "mushrooms" },
  ],
})

// Access value
console.log(multiSelect.value) // ["cheese", "mushrooms"]
```

### Forms

```typescript
import { Form, Input, Confirm, Select, Group, run } from "cinnamon-prompts"

const form = Form([
  Group({
    title: "Account Setup",
    fields: [
      Input({ title: "Username", placeholder: "johndoe" }),
      Input({ title: "Email", placeholder: "john@example.com" }),
      Select({
        title: "Role",
        options: [
          { label: "User", value: "user" },
          { label: "Admin", value: "admin" },
        ],
      }),
    ],
  }),
  Group({
    title: "Preferences",
    fields: [
      Confirm({ title: "Dark mode?", value: true }),
      Confirm({ title: "Notifications?", value: true }),
    ],
  }),
])

const results = await run(form)
```

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `↑/↓` | Navigate options |
| `Tab` | Next field |
| `Shift+Tab` | Previous field |
| `Enter` | Submit/Select |
| `Space` | Toggle checkbox |
| `Esc` | Cancel |

## Validation

```typescript
import { Input } from "cinnamon-prompts"

const input = Input({
  title: "Age",
  validate: (value) => {
    const age = parseInt(value)
    if (isNaN(age)) return "Please enter a number"
    if (age < 0 || age > 150) return "Please enter a valid age"
    return true
  },
})
```

## Styling

```typescript
import { Input } from "cinnamon-prompts"
import { NewStyle } from "caramel"

const input = Input({
  title: "Name",
  style: NewStyle().foreground("#7f00ff"),
})
```

## API Reference

### Input

| Option | Type | Description |
|--------|------|-------------|
| `title` | string | Field title |
| `description` | string | Field description |
| `placeholder` | string | Placeholder text |
| `value` | string | Initial value |
| `charLimit` | number | Max characters (0 = unlimited) |
| `validate` | function | Validation function |

### Confirm

| Option | Type | Description |
|--------|------|-------------|
| `title` | string | Field title |
| `description` | string | Field description |
| `value` | boolean | Initial value |
| `affirmitive` | string | Affirmative button text |
| `negative` | string | Negative button text |

### Select

| Option | Type | Description |
|--------|------|-------------|
| `title` | string | Field title |
| `description` | string | Field description |
| `options` | Option[] | List of options |
| `value` | string | Initial value |
| `filterable` | boolean | Enable filtering |

### MultiSelect

| Option | Type | Description |
|--------|------|-------------|
| `title` | string | Field title |
| `description` | string | Field description |
| `options` | MultiOption[] | List of options |
| `value` | string[] | Initial values |

### Form

| Option | Type | Description |
|--------|------|-------------|
| `title` | string | Form title |
| `width` | number | Form width |
| `height` | number | Form height |

## Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) first.

## License

[MIT](./LICENSE)

---

Based on [Huh](https://github.com/charmbracelet/huh) by [Charm](https://charm.sh).
