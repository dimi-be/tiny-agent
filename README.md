# Tiny Agent

A lightweight, CLI Worker agent designed to perform local file implementation tasks using local or small LLMs via OpenAI-compatible APIs.

## 🚀 Overview

Tiny Agent is designed to be "light" on the AI side by providing a small toolset and minimal system prompt. It was born out of the need to have an agent that worked well with LLMs that have a small context window. It does not support interactive mode. Its main purpose is to be a tool that is easily integrated in pipelines to let a local AI perform limited tasks.

The project is currently under heavy development, but it works. The currently the focus is on supporting JavaScript and TypeScript.

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
- **Token Tracking**: Prints the current context size after every tool call and gives a summary of context and total tokens at the end.

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

3. Build the project:

   ```bash
   npm run build
   ```

4. (Optional) Link the package globally:
   ```bash
   npm link
   ```

## 🛠 Usage

```bash
tiny-agent -m <model_name> [options] "PROMPT"
```

### Options

| Flag           | Alias | Description                                                                           | Default                    |
| :------------- | :---- | :------------------------------------------------------------------------------------ | :------------------------- |
| `--model`      | `-m`  | **(Required)** The name of the model loaded in your LLM server.                       |                            |
| `--url`        | `-u`  | The local API endpoint.                                                               | `http://localhost:1234/v1` |
| `--system`     | `-s`  | Path to a text file containing a custom system prompt.                                | (Internal default)         |
| `--plan`       | `-p`  | **Plan Mode**: Restricts the agent to read-only tools (`ls`, `tree`, `read`, `grep`). | `false`                    |
| `--yolo`       | `-y`  | **YOLO Mode**: Bypasses manual confirmations for writes and deletes.                  | `false`                    |
| `--plain-text` | `-t`  | **Plain Text Mode**: Disables automatic syntax checking after writes.                 | `false`                    |
| `--log`        | `-l`  | Path to a log file to store the conversation.                                         |                            |

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

## ⚠️ Issues

- Behavior when creating new files is wasting too many calls
  Touching an **empty** file should add it to sessionState
  Example:
  - Let me create a new file for our prime sieve implementation:
  - > Executing tool: touch with args: {"filePath":"prime-sieve.js"} Context: 1030 tokens
  - Now I'll implement the Sieve of Eratosthenes algorithm in the file. This is an efficient way to find all primes up to a given number.
  - > Executing tool: write with args: {"filePath":"prime-sieve.js","content":"[Content truncated]"} Context: 1528 tokens
  - Tool execution error: The file 'prime-sieve.js' already exists. You must read it first using the 'read' tool before overwriting it.
  - I need to read the existing file first before I can overwrite it:
  - > Executing tool: read with args: {"filePath":"prime-sieve.js"} Context: 1608 tokens
  - It seems the file exists but is empty. Let me overwrite it with our implementation:
  - > Executing tool: write with args: {"filePath":"prime-sieve.js","content":"[Content truncated]"} Context: 2083 tokens
- When a write triggers a create this should also add the file to sessionState
- Session state should be called filesReadState
- Add support for passing a json dialog history. Prepend the systemprompt to this and send this off to the agent. (Last message needs to be from user?)
- Redundant calls to fs.access in syntaxChecker code
- Javascript sources should be converted to typescript

## ⚖️ License

MIT
