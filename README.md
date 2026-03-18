# Tiny Agent

A lightweight, security-conscious CLI "Worker" agent designed to perform local file implementation tasks using a local LLM (like LM Studio, Ollama, or LocalAI).

## 🚀 Overview

Tiny Agent is built to be "light" on the AI side by providing a targeted toolset and minimal system prompt. It acts as an execution layer that can take instructions and perform safe, local file operations with built-in validation loops.

## ✨ Features

- **Local LLM Integration**: Communicates via OpenAI-compatible APIs (defaults to `http://localhost:1234/v1`).
- **Plan Mode (`-p`)**: A read-only mode for the agent to research the codebase and design solutions without making any changes.
- **YOLO Mode (`-y`)**: Bypasses manual confirmation prompts for destructive operations (write, delete, mkdir, npm).
- **Automatic Syntax Checking**: Immediately validates files after every `write`.
  - Supports: JavaScript (`node -c`), JSON (`JSON.parse`), Python (`py_compile`), and TypeScript/React (`npx tsc --noEmit`).
- **`AGENTS.md` Intelligence**:
  - **Root Injection**: Automatically appends root `AGENTS.md` rules to the system prompt.
  - **Nested Warnings**: Intercepts reads in directories containing nested `AGENTS.md` files and warns the agent to read them.
  - **Visual Decoration**: Flags directories containing `AGENTS.md` in `ls` and `tree` outputs.
- **Security Jail**:
  - **CWD Sandboxing**: Prevents the agent from accessing files outside the current working directory.
  - **Read-Before-Write Policy**: Ensures the agent has inspected a file's content before being allowed to overwrite it.
- **Rich Toolset**:
  - `ls` / `tree`: Explore directory structures (respects `.gitignore`).
  - `read`: Efficient file reading.
  - `grep`: Fast pattern searching with line numbers.
  - `write` / `mkdir` / `touch` / `rm`: Filesystem manipulation.
  - `npm`: Execute any npm command directly.
- **Token Tracking**: Real-time monitoring of current context window usage after every tool call and session cumulative totals.

## 📦 Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd tiny-agent
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. (Optional) Link the package globally:
   ```bash
   npm link
   ```

## 🛠 Usage

```bash
tiny-agent -m <model_name> [options] "PROMPT"
```

### Options

| Flag       | Alias | Description                                                                           | Default                    |
| :--------- | :---- | :------------------------------------------------------------------------------------ | :------------------------- |
| `--model`  | `-m`  | **(Required)** The name of the model loaded in your LLM server.                       |                            |
| `--url`    | `-u`  | The local API endpoint.                                                               | `http://localhost:1234/v1` |
| `--system` | `-s`  | Path to a text file containing a custom system prompt.                                | (Internal default)         |
| `--plan`   | `-p`  | **Plan Mode**: Restricts the agent to read-only tools (`ls`, `tree`, `read`, `grep`). | `false`                    |
| `--yolo`   | `-y`  | **YOLO Mode**: Bypasses manual confirmations for writes and deletes.                  | `false`                    |

### Examples

**Researching a codebase (Plan Mode):**

```bash
tiny-agent -m llama3 -p "How does the authentication logic work in this project?"
```

**Implementing a feature (YOLO Mode):**

```bash
tiny-agent -m llama3 -y "Add a new /health endpoint to the Express server in src/app.js"
```

## 🧪 Testing

The project includes unit tests for security, syntax checking, and `AGENTS.md` logic.

```bash
npm test
```

## ⚖️ License

MIT
