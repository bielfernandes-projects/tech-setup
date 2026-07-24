#!/usr/bin/env tsx
/**
 * scripts/create-15-articles.ts
 *
 * Creates 15 articles directly in Supabase with full markdown content.
 * No Gemini/Unsplash dependency — articles are hand-written.
 * Schedules 3/day from 28/07 to 01/08.
 *
 * Usage:
 *   npx tsx scripts/create-15-articles.ts
 *   npx tsx scripts/create-15-articles.ts --dry-run
 */

import { config } from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import * as path from "path";

config({ path: path.resolve(__dirname, "../.env.local") });

const supabase: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const DRY_RUN = process.argv.includes("--dry-run");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 200);
}

async function upsertCategory(name: string): Promise<string> {
  const slug = slugify(name);
  const { data, error } = await supabase
    .from("categories")
    .upsert({ name, slug }, { onConflict: "slug" })
    .select("id")
    .single();
  if (error) throw new Error(`Category upsert failed: ${error.message}`);
  return data.id;
}

async function upsertTags(tagNames: string[]): Promise<string[]> {
  const ids: string[] = [];
  for (const name of tagNames) {
    const slug = slugify(name);
    const { data, error } = await supabase
      .from("tags")
      .upsert({ name, slug }, { onConflict: "slug" })
      .select("id")
      .single();
    if (error) throw new Error(`Tag upsert failed: ${error.message}`);
    ids.push(data.id);
  }
  return ids;
}

// ─── Schedule: 3/day from 28/07 to 01/08 ────────────────────────────────────

const SCHEDULE_DATES = [
  "2026-07-28T12:00:00+00:00",
  "2026-07-29T12:00:00+00:00",
  "2026-07-30T12:00:00+00:00",
  "2026-07-31T12:00:00+00:00",
  "2026-08-01T12:00:00+00:00",
];

// ─── Articles ─────────────────────────────────────────────────────────────────

interface ArticleInput {
  title: string;
  category: string;
  tags: string[];
  excerpt: string;
  content: string;
}

const articles: ArticleInput[] = [
  // ─── Batch 1: 28/07 ────────────────────────────────────────────────────────
  {
    title: "Python Virtual Environments: Complete Guide for 2026",
    category: "Software Config",
    tags: ["python", "virtual-environment", "pip", "setup"],
    excerpt:
      "Master Python virtual environments with venv, pipenv, and poetry. Stop dependency conflicts and keep your projects isolated.",
    content: `## Why Virtual Environments Matter

Every Python project has its own dependencies. Without isolation, installing Package A v2.0 for one project breaks Project B that needs v1.0. Virtual environments solve this by giving each project its own Python and package directory.

## Method 1: venv (Built-in)

Python 3.3+ ships with \`venv\` in the standard library. No extra install needed.

### Create and activate

\`\`\`bash
# Create environment
python -m venv .venv

# Activate (Windows)
.venv\\Scripts\\activate

# Activate (macOS/Linux)
source .venv/bin/activate

# Confirm you're isolated
which python   # should point to .venv
pip list       # only stdlib packages
\`\`\`

### Install dependencies

\`\`\`bash
pip install flask sqlalchemy
pip freeze > requirements.txt
\`\`\`

### Reproduce on another machine

\`\`\`bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
\`\`\`

## Method 2: uv (Fast, Modern)

\`uv\` is a drop-in replacement for pip that's 10-100x faster.

\`\`\`bash
# Install uv
pip install uv

# Create venv + install in one step
uv venv
uv pip install flask sqlalchemy

# Freeze
uv pip freeze > requirements.txt
\`\`\`

## Method 3: Poetry

Poetry manages virtual environments, dependencies, and publishing in one tool.

\`\`\`bash
# Install Poetry
pip install poetry

# New project
poetry new my-project
cd my-project

# Add dependencies
poetry add flask
poetry add --group dev pytest

# Install all deps
poetry install

# Run commands inside the env
poetry run python main.py
\`\`\`

### pyproject.toml

Poetry generates a \`pyproject.toml\` that replaces \`setup.py\` and \`requirements.txt\`:

\`\`\`toml
[tool.poetry]
name = "my-project"
version = "0.1.0"
python = "^3.11"

[tool.poetry.dependencies]
flask = "^3.0"

[tool.poetry.group.dev.dependencies]
pytest = "^8.0"
\`\`\`

## Method 4: Pipenv

\`\`\`bash
pip install pipenv
pipenv install flask
pipenv shell
\`\`\`

Pipenv creates a \`Pipfile\` and \`Pipfile.lock\` for reproducible installs.

## Choosing Between Tools

| Tool | Best For | Speed |
|------|----------|-------|
| venv | Simple projects, scripts | Fast |
| uv | Speed-critical workflows | Fastest |
| Poetry | Library/package development | Medium |
| Pipenv | Application development | Slow |

## Common Mistakes

### Forgetting to activate

\`\`\`bash
# Wrong — installs globally
pip install flask

# Right — activate first
source .venv/bin/activate
pip install flask
\`\`\`

### Committing .venv to git

Add \`.venv\` to \`.gitignore\`:

\`\`\`
.venv/
__pycache__/
*.pyc
\`\`\`

### Mixing system and venv packages

If \`pip list\` shows unexpected packages, you may have activated the wrong environment. Run \`which python\` to verify.

## VS Code Integration

VS Code auto-detects \`.venv\` folders. If it doesn't:

1. Open Command Palette (\`Ctrl+Shift+P\`)
2. "Python: Select Interpreter"
3. Choose the \`.venv\` Python executable

## Docker + Virtual Environments

In Docker, you usually don't need venv since the container is already isolated:

\`\`\`dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "main.py"]
\`\`\`

## Quick Reference

| Task | Command |
|------|---------|
| Create | \`python -m venv .venv\` |
| Activate (Win) | \`.venv\\Scripts\\activate\` |
| Activate (Unix) | \`source .venv/bin/activate\` |
| Deactivate | \`deactivate\` |
| Freeze | \`pip freeze > requirements.txt\` |
| Install from file | \`pip install -r requirements.txt\` |
| Delete | Remove the \`.venv\` folder |`,
  },
  {
    title: "Building REST APIs with Go and Chi Router",
    category: "Software Config",
    tags: ["go", "chi", "rest-api", "backend"],
    excerpt:
      "Build production-ready REST APIs in Go using Chi router. Learn routing, middleware, JSON handling, and graceful shutdown.",
    content: `## Why Go for APIs?

Go compiles to a single binary, handles thousands of concurrent connections with goroutines, and has a batteries-included standard library. It's ideal for microservices and REST APIs.

## Project Setup

\`\`\`bash
mkdir go-api && cd go-api
go mod init github.com/yourname/go-api
go get github.com/go-chi/chi/v5
\`\`\`

## Basic Server

\`\`\`go
package main

import (
    "encoding/json"
    "log"
    "net/http"
    "os"
    "time"

    "github.com/go-chi/chi/v5"
    "github.com/go-chi/chi/v5/middleware"
)

type Response struct {
    Message string \`json:"message"\`
    OK      bool   \`json:"ok"\`
}

func main() {
    r := chi.NewRouter()

    // Middleware
    r.Use(middleware.Logger)
    r.Use(middleware.Recoverer)
    r.Use(middleware.Timeout(30 * time.Second))

    // Routes
    r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
        json.NewEncoder(w).Encode(Response{
            Message: "healthy",
            OK:      true,
        })
    })

    // Start server
    port := os.Getenv("PORT")
    if port == "" {
        port = "8080"
    }
    log.Printf("Server starting on :%s", port)
    log.Fatal(http.ListenAndServe(":"+port, r))
}
\`\`\`

## CRUD Routes

\`\`\`go
type Todo struct {
    ID        string \`json:"id"\`
    Title     string \`json:"title"\`
    Completed bool   \`json:"completed"\`
}

var todos = map[string]Todo{
    "1": {ID: "1", Title: "Learn Go", Completed: false},
}

func main() {
    r := chi.NewRouter()
    r.Use(middleware.Logger)
    r.Use(middleware.Recoverer)

    r.Route("/api/todos", func(r chi.Router) {
        r.Get("/", listTodos)
        r.Post("/", createTodo)
        r.Get("/{id}", getTodo)
        r.Put("/{id}", updateTodo)
        r.Delete("/{id}", deleteTodo)
    })

    log.Fatal(http.ListenAndServe(":8080", r))
}

func listTodos(w http.ResponseWriter, r *http.Request) {
    list := make([]Todo, 0, len(todos))
    for _, t := range todos {
        list = append(list, t)
    }
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(list)
}

func createTodo(w http.ResponseWriter, r *http.Request) {
    var t Todo
    if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    t.ID = fmt.Sprintf("%d", len(todos)+1)
    todos[t.ID] = t
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(t)
}

func getTodo(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")
    t, ok := todos[id]
    if !ok {
        http.Error(w, "not found", http.StatusNotFound)
        return
    }
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(t)
}

func updateTodo(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")
    if _, ok := todos[id]; !ok {
        http.Error(w, "not found", http.StatusNotFound)
        return
    }
    var t Todo
    if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    t.ID = id
    todos[id] = t
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(t)
}

func deleteTodo(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")
    delete(todos, id)
    w.WriteHeader(http.StatusNoContent)
}
\`\`\`

## Middleware Pattern

Chi middleware is just \`func(http.Handler) http.Handler\`:

\`\`\`go
func AuthMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        token := r.Header.Get("Authorization")
        if token == "" {
            http.Error(w, "unauthorized", http.StatusUnauthorized)
            return
        }
        // validate token...
        next.ServeHTTP(w, r)
    })
}

// Use it
r.Use(AuthMiddleware)
\`\`\`

## Graceful Shutdown

\`\`\`go
import (
    "context"
    "log"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"
)

func main() {
    srv := &http.Server{Addr: ":8080", Handler: r}

    go func() {
        if err := srv.ListenAndServe(); err != http.ErrServerClosed {
            log.Fatalf("listen: %s\\n", err)
        }
    }()

    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit

    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    srv.Shutdown(ctx)
    log.Println("Server stopped")
}
\`\`\`

## Testing

\`\`\`go
func TestHealth(t *testing.T) {
    req := httptest.NewRequest("GET", "/health", nil)
    w := httptest.NewRecorder()

    r := chi.NewRouter()
    r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
        json.NewEncoder(w).Encode(map[string]bool{"ok": true})
    })
    r.ServeHTTP(w, req)

    if w.Code != http.StatusOK {
        t.Errorf("expected 200, got %d", w.Code)
    }
}
\`\`\`

## Build and Run

\`\`\`bash
go build -o api.exe .
./api.exe

# Or run directly
go run .
\`\`\`

The binary is self-contained — no runtime dependencies needed on the target machine.`,
  },
  {
    title: "Rust for JavaScript Developers: Getting Started Guide",
    category: "Software Config",
    tags: ["rust", "javascript", "getting-started", "comparison"],
    excerpt:
      "Transitioning from JavaScript to Rust? This guide maps JS concepts to Rust equivalents and gets you productive fast.",
    content: `## Why Rust?

Rust gives you the performance of C++ with memory safety guarantees — no garbage collector, no null pointer exceptions, no data races. If you write Node.js services that need raw speed or CLI tools, Rust is worth learning.

## Installation

\`\`\`bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Verify
rustc --version
cargo --version
\`\`\`

## Hello World

\`\`\`bash
cargo new hello-rust
cd hello-rust
cargo run
\`\`\`

This creates:

\`\`\`
hello-rust/
├── Cargo.toml    # like package.json
└── src/
    └── main.rs   # like index.js
\`\`\`

## Concept Mapping

| JavaScript | Rust |
|-----------|------|
| \`const x = 5\` | \`let x = 5\` |
| \`let x = 5\` (mutable) | \`let mut x = 5\` |
| \`function add(a, b)\` | \`fn add(a: i32, b: i32) -> i32\` |
| \`const arr = [1, 2]\` | \`let arr = vec![1, 2]\` |
| \`arr.push(3)\` | \`arr.push(3)\` |
| \`obj.name\` | \`obj.name\` (struct) or \`obj["name"]\` (HashMap) |
| \`null\` / \`undefined\` | \`Option<T>\` (\`None\` or \`Some(val)\`) |
| \`throw Error()\` | \`Result<T, E>\` (\`Err()\`) |
| \`try { } catch { }\` | \`match result { Ok(v) => ..., Err(e) => ... }\` |

## Variables and Mutability

\`\`\`rust
fn main() {
    let x = 5;          // immutable (like const)
    let mut y = 10;     // mutable (like let)
    y += 1;             // OK
    // x += 1;          // ERROR: cannot mutate
}
\`\`\`

## Ownership (The Big Concept)

Rust's ownership system replaces garbage collection. Every value has exactly one owner:

\`\`\`rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1;        // s1 is MOVED to s2
    // println!("{}", s1);  // ERROR: s1 no longer valid
    println!("{}", s2);    // OK
}
\`\`\`

### Borrowing (like passing by reference)

\`\`\`rust
fn print_length(s: &String) {   // borrow, don't take ownership
    println!("{}", s.len());
}

fn main() {
    let s = String::from("hello");
    print_length(&s);   // pass reference
    println!("{}", s);   // still valid
}
\`\`\`

## Option and Result

### Option (replaces null)

\`\`\`rust
fn find_user(id: u32) -> Option<String> {
    if id == 1 {
        Some(String::from("Alice"))
    } else {
        None
    }
}

fn main() {
    match find_user(1) {
        Some(name) => println!("Found: {}", name),
        None => println!("Not found"),
    }

    // Or use unwrap (panics on None)
    let name = find_user(1).unwrap();
}
\`\`\`

### Result (replaces try/catch)

\`\`\`rust
use std::fs;

fn main() {
    match fs::read_to_string("config.json") {
        Ok(content) => println!("Config: {}", content),
        Err(e) => println!("Error reading file: {}", e),
    }

    // Or use ? operator in functions that return Result
}
\`\`\`

## Structs (like classes/objects)

\`\`\`rust
struct User {
    name: String,
    email: String,
    active: bool,
}

impl User {
    fn new(name: &str, email: &str) -> User {
        User {
            name: name.to_string(),
            email: email.to_string(),
            active: true,
        }
    }

    fn greet(&self) -> String {
        format!("Hi, I'm {}", self.name)
    }
}

fn main() {
    let user = User::new("Alice", "alice@example.com");
    println!("{}", user.greet());
}
\`\`\`

## Vectors (like arrays)

\`\`\`rust
fn main() {
    let mut nums = vec![1, 2, 3];
    nums.push(4);

    // Iterate
    for n in &nums {
        println!("{}", n);
    }

    // Map + collect
    let doubled: Vec<i32> = nums.iter().map(|n| n * 2).collect();
    println!("{:?}", doubled);  // [2, 4, 6, 8]
}
\`\`\`

## Error Handling Pattern

\`\`\`rust
use std::num::ParseIntError;

fn parse_number(s: &str) -> Result<i32, ParseIntError> {
    s.parse::<i32>()
}

fn main() {
    match parse_number("42") {
        Ok(n) => println!("Parsed: {}", n),
        Err(e) => println!("Failed: {}", e),
    }

    // Chaining with ?
    fn compute(s: &str) -> Result<i32, ParseIntError> {
        let n = parse_number(s)?;
        Ok(n * 2)
    }
}
\`\`\`

## Cargo Commands

| Command | What It Does |
|---------|-------------|
| \`cargo new name\` | Create new project |
| \`cargo build\` | Compile (debug) |
| \`cargo build --release\` | Compile (optimized) |
| \`cargo run\` | Build + run |
| \`cargo test\` | Run tests |
| \`cargo clippy\` | Lint |
| \`cargo fmt\` | Format code |
| \`cargo add serde --features derive\` | Add dependency |

## Learning Resources

- **The Rust Book**: doc.rust-lang.org/book
- **Rust by Example**: doc.rust-lang.org/rust-by-example
- **Exercism Rust Track**: exercism.org/tracks/rust`,
  },
  {
    title: "AWS S3 + Lambda: Serverless Image Processing Pipeline",
    category: "DevOps",
    tags: ["aws", "s3", "lambda", "serverless", "image-processing"],
    excerpt:
      "Build a serverless image processing pipeline with AWS S3 and Lambda. Auto-resize, compress, and convert images on upload.",
    content: `## Architecture Overview

When a user uploads an image to S3, a Lambda function automatically triggers, processes the image (resize, compress, convert to WebP), and saves the result back to S3.

\`\`\`
Upload → S3 (original) → Lambda trigger → Process → S3 (processed)
\`\`\`

## Prerequisites

- AWS CLI configured (\`aws configure\`)
- Node.js 18+ installed
- Basic understanding of S3 and Lambda

## Step 1: Create S3 Bucket

\`\`\`bash
aws s3 mb s3://my-image-uploads-$(date +%s) --region us-east-1
\`\`\`

Or via console:
1. Go to S3 → Create bucket
2. Name: \`my-image-uploads\`
3. Region: \`us-east-1\`
4. Block all public access: ON
5. Enable bucket versioning: OFF

## Step 2: Create Lambda Function

\`\`\`bash
mkdir image-processor && cd image-processor
npm init -y
npm install sharp @aws-sdk/client-s3
\`\`\`

### index.mjs

\`\`\`javascript
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

const s3 = new S3Client({ region: process.env.AWS_REGION });
const BUCKET = process.env.PROCESSED_BUCKET;

const SIZES = [
  { suffix: "thumb", width: 150, height: 150 },
  { suffix: "medium", width: 800, height: 600 },
  { suffix: "large", width: 1920, height: 1080 },
];

export const handler = async (event) => {
  const srcKey = decodeURIComponent(
    event.Records[0].s3.object.key.replace(/\\+/g, " ")
  );

  console.log(\`Processing: \${srcKey}\`);

  // Get original image
  const { Body } = await s3.send(
    new GetObjectCommand({
      Bucket: event.Records[0].s3.bucket.name,
      Key: srcKey,
    })
  );

  const buffer = Buffer.from(await Body.transformToByteArray());
  const baseName = srcKey.replace(/\\.[^.]+$/, "");

  // Process each size
  for (const size of SIZES) {
    const processed = await sharp(buffer)
      .resize(size.width, size.height, { fit: "cover" })
      .webp({ quality: 80 })
      .toBuffer();

    const destKey = \`\${baseName}-\${size.suffix}.webp\`;

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: destKey,
        Body: processed,
        ContentType: "image/webp",
      })
    );

    console.log(\`Created: \${destKey} (\${processed.length} bytes)\`);
  }

  return { statusCode: 200, body: "Processed" };
};
\`\`\`

## Step 3: IAM Policy

Create \`lambda-policy.json\`:

\`\`\`json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": [
        "arn:aws:s3:::my-image-uploads/*",
        "arn:aws:s3:::my-processed-images/*"
      ]
    }
  ]
}
\`\`\`

## Step 4: Deploy

\`\`\`bash
# Create deployment package
zip -r function.zip index.mjs node_modules/

# Create Lambda function
aws lambda create-function \\
  --function-name image-processor \\
  --runtime nodejs20.x \\
  --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-s3-role \\
  --handler index.handler \\
  --zip-file fileb://function.zip \\
  --timeout 30 \\
  --memory-size 512 \\
  --environment "Variables={PROCESSED_BUCKET=my-processed-images}"
\`\`\`

## Step 5: Add S3 Trigger

\`\`\`bash
aws lambda add-permission \\
  --function-name image-processor \\
  --principal s3.amazonaws.com \\
  --action lambda:InvokeFunction \\
  --source-arn arn:aws:s3:::my-image-uploads \\
  --source-account YOUR_ACCOUNT_ID
\`\`\`

Then add the notification in S3 bucket properties:

\`\`\`json
{
  "LambdaFunctionConfigurations": [
    {
      "LambdaFunctionArn": "arn:aws:lambda:us-east-1:ACCOUNT:function:image-processor",
      "Events": ["s3:ObjectCreated:*"],
      "Filter": {
        "Key": {
          "Filters": [
            { "Name": "prefix", "Value": "uploads/" },
            { "Name": "suffix", "Value": ".jpg" }
          ]
        }
      }
    }
  ]
}
\`\`\`

## Step 6: Test

\`\`\`bash
aws s3 cp test-image.jpg s3://my-image-uploads/uploads/test-image.jpg

# Check Lambda logs
aws logs tail /aws/lambda/image-processor --follow
\`\`\`

## Cost Estimate

- S3 storage: ~$0.023/GB/month
- Lambda: 1M free requests/month, then $0.20/1M
- For 1000 images/day: roughly $0.50/month

## Production Tips

1. **Set Lambda memory to 1024MB+** for sharp to run fast
2. **Add error handling** — dead letter queue for failed processing
3. **Use S3 Lifecycle policies** to delete originals after processing
4. **Add CloudWatch alarms** for Lambda errors
5. **Consider SQS** for decoupling if processing is heavy`,
  },
  {
    title: "Excel Power Query: Automate Data Cleaning Like a Pro",
    category: "Software Config",
    tags: ["excel", "power-query", "data-cleaning", "automation"],
    excerpt:
      "Stop manually cleaning data in Excel. Power Query transforms, merges, and refreshes datasets with one click.",
    content: `## What is Power Query?

Power Query is Excel's built-in ETL (Extract, Transform, Load) tool. It lets you connect to data sources, clean and reshape data, and load it into worksheets — all without formulas or VBA.

## Opening Power Query

1. Go to **Data** tab
2. Click **Get Data** (or **From Table/Range** for existing data)
3. The Power Query Editor opens

## Basic Transformations

### Remove Columns

1. Select columns you don't need
2. Right-click → **Remove Columns**

### Filter Rows

1. Click the dropdown arrow on a column header
2. Uncheck values you want to exclude

### Change Data Types

1. Click the icon next to the column name
2. Select the correct type (Text, Number, Date, etc.)

### Rename Columns

1. Double-click the column header
2. Type the new name

## Merging Tables (Like VLOOKUP on Steroids)

### Merge Queries

1. **Home** → **Merge Queries**
2. Select the two tables
3. Choose the matching columns
4. Select join type (Left, Inner, Full)
5. Expand the merged column to show fields

### Example: Match Orders with Customers

\`\`\`
Table A (Orders)          Table B (Customers)
┌──────────┬─────────┐   ┌──────────┬──────────┐
│ OrderID  │ CustID  │   │ CustID   │ Name     │
├──────────┼─────────┤   ├──────────┼──────────┤
│ 1001     │ C01     │   │ C01      │ Alice    │
│ 1002     │ C03     │   │ C02      │ Bob      │
│ 1003     │ C01     │   │ C03      │ Charlie  │
└──────────┴─────────┘   └──────────┴──────────┘

After Merge (Left Join on CustID):
┌──────────┬─────────┬──────────┐
│ OrderID  │ CustID  │ Name     │
├──────────┼─────────┼──────────┤
│ 1001     │ C01     │ Alice    │
│ 1002     │ C03     │ Charlie  │
│ 1003     │ C01     │ Alice    │
└──────────┴─────────┴──────────┘
\`\`\`

## Appending Tables (Stack Rows)

1. **Home** → **Append Queries**
2. Select tables to combine
3. Result: all rows stacked vertically

Use this to combine monthly reports, daily logs, etc.

## Common Data Cleaning Recipes

### Remove Duplicates

1. Select the column(s)
2. **Home** → **Remove Rows** → **Remove Duplicates**

### Split Columns

1. Right-click column → **Split Column**
2. Choose delimiter (comma, space, etc.)
3. Or split by number of characters

### Fill Down Nulls

1. Select the column
2. **Transform** → **Fill** → **Down**

This replaces null values with the last non-null value above.

### Unpivot Columns

Convert wide data to tall format:

\`\`\`
Before (Wide):
┌─────────┬──────┬──────┬──────┐
│ Product │ Q1   │ Q2   │ Q3   │
├─────────┼──────┼──────┼──────┤
│ Widget  │ 100  │ 150  │ 200  │
└─────────┴──────┴──────┴──────┘

After Unpivot:
┌─────────┬────────┬───────┐
│ Product │ Quarter│ Sales │
├─────────┼────────┼───────┤
│ Widget  │ Q1     │ 100   │
│ Widget  │ Q2     │ 150   │
│ Widget  │ Q3     │ 200   │
└─────────┴────────┴───────┘
\`\`\`

## M Language (Advanced)

Power Query uses M language behind the scenes. You can edit it directly in the formula bar or **Advanced Editor**:

\`\`\`m
let
    Source = Excel.CurrentWorkbook(){[Name="Sales"]}[Content],
    FilteredRows = Table.SelectRows(Source, each [Amount] > 100),
    SortedRows = Table.Sort(FilteredRows, {{"Amount", Order.Descending}}),
    AddedTotal = Table.AddColumn(SortedRows, "Total", each [Amount] * 1.1)
in
    AddedTotal
\`\`\`

## Refreshing Data

After setting up your query:

1. **Data** → **Refresh All** (or \`Ctrl+Alt+F5\`)
2. All transformations re-apply automatically
3. New data from the source is processed

### Auto-Refresh on File Open

1. **Data** → **Queries & Connections**
2. Right-click query → **Properties**
3. Check **Refresh data when opening the file**

## Connecting to External Sources

### CSV File

\`\`\`
Data → Get Data → From File → From Text/CSV
\`\`\`

### Database

\`\`\`
Data → Get Data → From Database → From SQL Server Database
\`\`\`

### Web API

\`\`\`
Data → Get Data → From Other Sources → From Web
Enter URL: https://api.example.com/data
\`\`\`

### Folder (Combine Multiple Files)

\`\`\`
Data → Get Data → From File → From Folder
Select folder → Power Query detects file structure
\`\`\`

## Tips

1. **Name your queries** — descriptive names make maintenance easier
2. **Document steps** — add comments in Advanced Editor
3. **Use parameters** for dynamic values (date ranges, file paths)
4. **Close & Load To** → only create connection for intermediate queries
5. **Parameters** let users input values at refresh time`,
  },
  {
    title: "Power Automate: Build Your First Workflow in 15 Minutes",
    category: "Software Config",
    tags: ["power-automate", "microsoft", "automation", "workflow"],
    excerpt:
      "Automate repetitive tasks with Power Automate. Build flows that save emails to OneDrive, approve requests, and sync data.",
    content: `## What is Power Automate?

Power Automate (formerly Microsoft Flow) is a no-code automation platform. It connects 400+ services and runs workflows triggered by events — new emails, form submissions, file uploads, scheduled times, and more.

## Accessing Power Automate

1. Go to [flow.microsoft.com](https://flow.microsoft.com)
2. Sign in with your Microsoft 365 account
3. Click **+ Create** to start a new flow

## Flow Types

| Type | Trigger | Use Case |
|------|---------|----------|
| **Automated** | Event (email, file, etc.) | React to things happening |
| **Instant** | Button press / HTTP | On-demand actions |
| **Scheduled** | Time-based | Daily/weekly reports |
| **Desktop** | UI automation | Legacy app interaction |

## Flow 1: Save Email Attachments to OneDrive

### Trigger

1. **+ Create** → **Automated cloud flow**
2. Search: "When a new email arrives"
3. Select **Office 365 Outlook — When a new email arrives (V3)**
4. Configure:
   - **Folder**: Inbox
   - **Include Attachments**: Yes
   - **Only with Attachments**: Yes

### Action: Apply to Each Attachment

1. **+ New step** → **Apply to each**
2. Select **Attachments** from dynamic content
3. Inside the loop:
   - **+ Add an action** → **Create file**
   - **Site Address**: Your OneDrive
   - **Folder Path**: /Email Attachments
   - **File Name**: \`items('Apply_to_each')?['name']\`
   - **File Content**: \`items('Apply_to_each')?['content']\`

### Test

Send yourself an email with an attachment → check OneDrive.

## Flow 2: Daily Digest Email

### Trigger

1. **+ Create** → **Scheduled cloud flow**
2. Name: "Daily Digest"
3. Run: **Every day at 8:00 AM**

### Action: Get Weather

1. **+ New step** → **HTTP**
2. Method: GET
3. URI: \`https://api.openweathermap.org/data/2.5/weather?q=London&appid=YOUR_KEY\`

### Action: Send Email

1. **+ New step** → **Send an email (V2)**
2. To: your email
3. Subject: "Daily Digest - \`formatDateTime(utcNow(), 'MMMM dd')\`"
4. Body: Build HTML with weather data from previous step

## Flow 3: Approval Workflow

### Trigger

1. **+ Create** → **Automated cloud flow**
2. Trigger: "When a new response is submitted" (Microsoft Forms)

### Action: Get Response Details

1. **+ New step** → **Microsoft Forms — Get response details**
2. Form ID: Select your form
3. Response ID: \`triggerOutputs()?['body/responseId']\`

### Action: Start Approval

1. **+ New step** → **Start an approval**
2. Approval Type: "Approve/Reject — First to respond"
3. Title: "New request: \`body('Get_response_details')?['body/Question1']\`"
4. Assigned To: manager's email
5. Details: Response details

### Action: Condition

1. **+ New step** → **Condition**
2. If **Outcome** equals "Approve"
3. **If yes**: Send approval email
4. **If no**: Send rejection email

## Power Automate Desktop (PAD)

For automating Windows applications:

### Install

1. Download from [aka.ms/padownloads](https://aka.ms/padownloads)
2. Sign in with Microsoft account

### Example: Extract Data from Excel

1. Launch PAD
2. **Launch Excel** → open workbook
3. **Read range** → store in variable
4. **For each row** → process data
5. **Write to text file** → save results

### Example: Web Automation

1. **Launch Chrome** → navigate to URL
2. **Populate text field** → enter search term
3. **Click element** → submit form
4. **Extract element values** → scrape results

## Connectors

### Standard (Free with M365)

- Outlook, OneDrive, SharePoint, Teams
- Excel, Word, PowerPoint
- Planner, To Do, Forms

### Premium (License Required)

- SQL Server, SAP, Oracle
- Salesforce, Dynamics 365
- Custom connectors (HTTP, REST APIs)

### Custom Connector

1. **+ Create** → **Custom connector**
2. Enter API base URL
3. Define actions (GET, POST, etc.)
4. Test with sample request

## Best Practices

1. **Error handling**: Add **Configure run after** → check for failures
2. **Concurrency**: Set **Concurrency Control** on Apply to each (up to 50)
3. **Naming**: Use descriptive names for steps
4. **Comments**: Add notes to complex steps
5. **Testing**: Always test with the **Test** button before going live
6. **Environment**: Use separate environments for dev/prod

## Common Patterns

### Parallel Branches

Split a flow into parallel paths:

\`\`\`
Trigger
├── Branch 1: Send email
└── Branch 2: Update database
\`\`\`

### Do Until Loop

Repeat until a condition is met:

\`\`\`
Do Until (status = "Complete")
  → Check status
  → Wait 5 minutes
Loop
\`\`\`

### Scope (Error Handling)

Wrap steps in a Scope to catch errors:

\`\`\`
Scope (Try)
  → Risky operation
Scope (Catch) — Configure run after: has failed
  → Send error notification
\`\`\`

## Troubleshooting

1. Check **Run history** for error details
2. **Resubmit** failed runs after fixing issues
3. Use **Peek code** to see the underlying JSON
4. **Export flow** as JSON for backup/sharing`,
  },
  {
    title: "CSS Container Queries: Component-Level Responsive Design",
    category: "Software Config",
    tags: ["css", "container-queries", "responsive", "frontend"],
    excerpt:
      "Media queries are dead for components. CSS Container Queries let components adapt to their parent's width, not the viewport.",
    content: `## The Problem with Media Queries

Media queries respond to the **viewport** width. But components live inside containers that may be narrow (sidebar) or wide (main content). A card component shouldn't care about the screen size — it should care about its own container.

## Container Query Basics

### 1. Define a Container

\`\`\`css
.card-wrapper {
  container-type: inline-size;
  container-name: card;
}
\`\`\`

- \`inline-size\`: Track the width (not height)
- \`container-name\`: Optional, useful when nesting containers

### 2. Query the Container

\`\`\`css
@container card (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: 200px 1fr;
  }
}

@container card (max-width: 399px) {
  .card {
    display: flex;
    flex-direction: column;
  }
}
\`\`\`

## Practical Example: Card Component

### HTML

\`\`\`html
<div class="card-wrapper">
  <article class="card">
    <img src="hero.jpg" alt="Hero" class="card-image" />
    <div class="card-body">
      <h3 class="card-title">Article Title</h3>
      <p class="card-excerpt">Short description of the article...</p>
      <div class="card-meta">
        <span class="card-date">Jan 15, 2026</span>
        <span class="card-tag">Tutorial</span>
      </div>
    </div>
  </article>
</div>
\`\`\`

### CSS

\`\`\`css
/* Container */
.card-wrapper {
  container-type: inline-size;
}

/* Base style (mobile-first) */
.card {
  border: 1px solid #333;
  border-radius: 8px;
  overflow: hidden;
}

.card-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.card-body {
  padding: 1rem;
}

.card-title {
  font-size: 1.25rem;
  margin: 0 0 0.5rem;
}

/* Wide container: side-by-side layout */
@container (min-width: 500px) {
  .card {
    display: grid;
    grid-template-columns: 250px 1fr;
  }

  .card-image {
    height: 100%;
  }

  .card-title {
    font-size: 1.5rem;
  }
}

/* Extra wide: add more metadata */
@container (min-width: 800px) {
  .card-meta {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #333;
  }

  .card-title {
    font-size: 1.75rem;
  }
}
\`\`\`

## Container Query Units

| Unit | Meaning |
|------|---------|
| \`cqw\` | 1% of container width |
| \`cqh\` | 1% of container height |
| \`cqi\` | 1% of container inline size |
| \`cqb\` | 1% of container block size |
| \`cqmin\` | Smaller of cqi and cqb |
| \`cqmax\` | Larger of cqi and cqb |

### Example: Fluid Typography

\`\`\`css
.card-wrapper {
  container-type: inline-size;
}

.card-title {
  font-size: clamp(1rem, 3cqi, 2rem);
}
\`\`\`

The font scales with the container, not the viewport.

## Nesting Containers

You can nest containers. Each query only affects its direct parent:

\`\`\`css
.sidebar {
  container-type: inline-size;
  container-name: sidebar;
}

.main-content {
  container-type: inline-size;
  container-name: main;
}

/* Card in sidebar */
@container sidebar (max-width: 300px) {
  .card { /* compact layout */ }
}

/* Card in main content */
@container main (min-width: 600px) {
  .card { /* expanded layout */ }
}
\`\`\`

## Named vs Anonymous Containers

\`\`\`css
/* Anonymous — catches all @container rules */
.parent { container-type: inline-size; }

/* Named — only responds to matching queries */
.parent { container-type: inline-size; container-name: parent; }
@container parent (min-width: 500px) { ... }
\`\`\`

Use named containers when you have multiple container types on the page.

## Browser Support (2026)

| Browser | Support |
|---------|---------|
| Chrome 105+ | ✅ |
| Firefox 110+ | ✅ |
| Safari 16+ | ✅ |
| Edge 105+ | ✅ |

Safe to use in production without fallbacks for modern browsers.

## Container Queries vs Media Queries

| Feature | Media Query | Container Query |
|---------|------------|-----------------|
| Responds to | Viewport | Parent container |
| Use case | Page layout | Component layout |
| Responsive to | Screen size | Available space |
| Nesting | N/A | Per-container |

## Common Patterns

### Grid Auto-Fit with Containers

\`\`\`css
.grid-wrapper {
  container-type: inline-size;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

/* Stack on narrow containers */
@container (max-width: 600px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
\`\`\`

### Sidebar Collapse

\`\`\`css
.layout {
  container-type: inline-size;
}

@container (max-width: 768px) {
  .sidebar { display: none; }
  .main { width: 100%; }
}

@container (min-width: 769px) {
  .sidebar { width: 250px; }
  .main { flex: 1; }
}
\`\`\`

## Performance Notes

- Container queries add minimal overhead
- The browser already tracks layout for paint
- Use \`contain: layout inline-size\` for best performance (set automatically by \`container-type\`)
- Avoid querying very deeply nested containers`,
  },
  {
    title: "Ubuntu SSH Setup: Secure Remote Access in 10 Minutes",
    category: "Linux",
    tags: ["ubuntu", "ssh", "linux", "remote-access", "security"],
    excerpt:
      "Set up SSH on Ubuntu for secure remote access. Configure key-based auth, disable password login, and harden your server.",
    content: `## Installing SSH Server

\`\`\`bash
sudo apt update
sudo apt install openssh-server -y
\`\`\`

### Verify It's Running

\`\`\`bash
sudo systemctl status ssh
sudo systemctl enable ssh
\`\`\`

## Connect from Another Machine

\`\`\`bash
# Basic connection
ssh user@server-ip

# Example
ssh ubuntu@192.168.1.100
\`\`\`

Find your server's IP:

\`\`\`bash
ip addr show | grep "inet " | grep -v 127.0.0.1
\`\`\`

## Key-Based Authentication (Recommended)

### Generate Key Pair (on your local machine)

\`\`\`bash
ssh-keygen -t ed25519 -C "your@email.com"
# Press Enter for defaults
# Set a passphrase (recommended)
\`\`\`

This creates:
- \`~/.ssh/id_ed25519\` (private key — never share)
- \`~/.ssh/id_ed25519.pub\` (public key — goes on server)

### Copy Public Key to Server

\`\`\`bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@server-ip
\`\`\`

Or manually:

\`\`\`bash
# On server
mkdir -p ~/.ssh
echo "your-public-key-content" >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
\`\`\`

### Test Key Auth

\`\`\`bash
ssh user@server-ip
# Should connect without password (or with key passphrase only)
\`\`\`

## Harden SSH Configuration

Edit the SSH server config:

\`\`\`bash
sudo nano /etc/ssh/sshd_config
\`\`\`

### Essential Changes

\`\`\`bash
# Change default port (optional, reduces bot scans)
Port 2222

# Disable root login
PermitRootLogin no

# Disable password authentication (keys only)
PasswordAuthentication no

# Disable empty passwords
PermitEmptyPasswords no

# Limit authentication attempts
MaxAuthTries 3

# Use only SSH protocol 2
Protocol 2

# Disable X11 forwarding (unless needed)
X11Forwarding no

# Set idle timeout (seconds)
ClientAliveInterval 300
ClientAliveCountMax 2

# Allow specific users only
AllowUsers ubuntu deploy

# Disable agent forwarding (unless needed)
AllowAgentForwarding no
\`\`\`

### Apply Changes

\`\`\`bash
sudo sshd -t           # Test config syntax
sudo systemctl restart ssh
\`\`\`

**IMPORTANT**: Before restarting, keep your current SSH session open. Test a new connection in a separate terminal to verify you can still connect.

## UFW Firewall Rules

\`\`\`bash
# Allow SSH (adjust port if changed)
sudo ufw allow 2222/tcp
# Or allow from specific IP only
sudo ufw allow from 203.0.113.50 to any port 2222

# Enable firewall
sudo ufw enable
sudo ufw status verbose
\`\`\`

## SSH Config File (Client Side)

Create \`~/.ssh/config\` on your local machine:

\`\`\`
Host myserver
    HostName 192.168.1.100
    User ubuntu
    Port 2222
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 60
\`\`\`

Now connect with just:

\`\`\`bash
ssh myserver
\`\`\`

## SSH Tunnels (Port Forwarding)

### Local Forward Access Remote Service Locally

\`\`\`bash
# Access remote PostgreSQL locally
ssh -L 5432:localhost:5432 user@server

# Now connect to localhost:5432 to reach remote DB
psql -h localhost -p 5432
\`\`\`

### Remote Forward Expose Local Service

\`\`\`bash
# Expose local dev server (port 3000) on remote (port 8080)
ssh -R 8080:localhost:3000 user@server
\`\`\`

### Dynamic Forward (SOCKS Proxy)

\`\`\`bash
ssh -D 1080 user@server
# Configure browser to use SOCKS5 proxy at localhost:1080
\`\`\`

## SCP / File Transfer

\`\`\`bash
# Upload file
scp ./file.txt user@server:/home/ubuntu/

# Download file
scp user@server:/var/log/syslog ./

# Upload directory (recursive)
scp -r ./project/ user@server:/home/ubuntu/project/

# Using config alias
scp ./file.txt myserver:/home/ubuntu/
\`\`\`

## rsync (Better for Directories)

\`\`\`bash
# Sync directory to server
rsync -avz ./project/ myserver:/home/ubuntu/project/

# Exclude patterns
rsync -avz --exclude 'node_modules' --exclude '.git' ./project/ myserver:/home/ubuntu/project/

# Dry run first
rsync -avzn ./project/ myserver:/home/ubuntu/project/
\`\`\`

## Troubleshooting

### Permission Denied (publickey)

\`\`\`bash
# On server, check permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# Check SSH logs
sudo journalctl -u ssh -f
\`\`\`

### Connection Refused

\`\`\`bash
# Check if SSH is running
sudo systemctl status ssh

# Check if firewall is blocking
sudo ufw status

# Check if port is listening
sudo ss -tlnp | grep ssh
\`\`\`

### Slow Connection

Add to \`/etc/ssh/sshd_config\`:

\`\`\`bash
UseDNS no
GSSAPIAuthentication no
\`\`\`

## SSH Key Management

### List Keys

\`\`\`bash
ls -la ~/.ssh/
\`\`\`

### Remove Old Keys from Server

\`\`\`bash
# Edit authorized_keys and remove the line
nano ~/.ssh/authorized_keys
\`\`\`

### Rotate Keys

1. Generate new key pair
2. Copy new key to server
3. Test new key works
4. Remove old key from server
5. Delete old private key`,
  },
  {
    title: "Solidity for Web Developers: Build Your First Smart Contract",
    category: "Software Config",
    tags: ["solidity", "ethereum", "smart-contracts", "web3", "blockchain"],
    excerpt:
      "Learn Solidity fundamentals and deploy your first Ethereum smart contract. Covers syntax, testing, and Hardhat deployment.",
    content: `## What is Solidity?

Solidity is the primary language for writing smart contracts on Ethereum and EVM-compatible chains (Polygon, BSC, Arbitrum). It's statically typed and syntax-heavy — think TypeScript meets C++.

## Environment Setup

### Install Node.js and Hardhat

\`\`\`bash
mkdir solidity-101 && cd solidity-101
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat
\`\`\`

Select "Create a JavaScript project" and accept defaults.

### Project Structure

\`\`\`
solidity-101/
├── contracts/
│   └── Greeter.sol
├── test/
│   └── Greeter.test.js
├── scripts/
│   └── deploy.js
├── hardhat.config.js
└── package.json
\`\`\`

## Your First Contract

### contracts/Greeter.sol

\`\`\`solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Greeter {
    string private greeting;
    address public owner;
    uint256 public greetingCount;

    event GreetingChanged(string oldGreeting, string newGreeting, uint256 count);

    constructor(string memory _greeting) {
        greeting = _greeting;
        owner = msg.sender;
        greetingCount = 0;
    }

    function greet() public view returns (string memory) {
        return greeting;
    }

    function setGreeting(string memory _greeting) public {
        require(msg.sender == owner, "Only owner can change greeting");
        require(bytes(_greeting).length > 0, "Greeting cannot be empty");

        string memory old = greeting;
        greeting = _greeting;
        greetingCount++;

        emit GreetingChanged(old, _greeting, greetingCount);
    }

    function getGreetingCount() public view returns (uint256) {
        return greetingCount;
    }

    receive() external payable {}
}
\`\`\`

## Key Concepts

### Data Locations

| Location | Where | Cost | Use Case |
|----------|-------|------|----------|
| \`storage\` | On-chain | Expensive | State variables |
| \`memory\` | In function | Cheap | Function parameters |
| \`calldata\` | In function | Free | Read-only input |

### Visibility

| Keyword | Meaning |
|---------|---------|
| \`public\` | Anyone can call |
| \`private\` | Only this contract |
| \`internal\` | This contract + derived |
| \`external\` | Only from outside |

### Modifiers

\`\`\`solidity
modifier onlyOwner() {
    require(msg.sender == owner, "Not owner");
    _;
}

function withdraw() public onlyOwner {
    // only owner can call
}
\`\`\`

## Testing with Hardhat

### test/Greeter.test.js

\`\`\`javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Greeter", function () {
  let greeter, owner, addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const Greeter = await ethers.getContractFactory("Greeter");
    greeter = await Greeter.deploy("Hello, World!");
  });

  it("should return initial greeting", async function () {
    expect(await greeter.greet()).to.equal("Hello, World!");
  });

  it("should allow owner to change greeting", async function () {
    await greeter.setGreeting("Hola!");
    expect(await greeter.greet()).to.equal("Hola!");
  });

  it("should emit event on change", async function () {
    await expect(greeter.setGreeting("Hi!"))
      .to.emit(greeter, "GreetingChanged")
      .withArgs("Hello, World!", "Hi!", 1);
  });

  it("should reject non-owner", async function () {
    await expect(
      greeter.connect(addr1).setGreeting("Hacked!")
    ).to.be.revertedWith("Only owner can change greeting");
  });

  it("should track greeting count", async function () {
    await greeter.setGreeting("First");
    await greeter.setGreeting("Second");
    expect(await greeter.getGreetingCount()).to.equal(2);
  });
});
\`\`\`

### Run Tests

\`\`\`bash
npx hardhat test
\`\`\`

## Deployment

### scripts/deploy.js

\`\`\`javascript
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const Greeter = await ethers.getContractFactory("Greeter");
  const greeter = await Greeter.deploy("Hello, Hardhat!");
  await greeter.waitForDeployment();

  console.log("Greeter deployed to:", await greeter.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
\`\`\`

### Deploy to Testnet (Sepolia)

\`\`\`bash
# hardhat.config.js
module.exports = {
  networks: {
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY",
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};

# Deploy
npx hardhat run scripts/deploy.js --network sepolia
\`\`\`

### Verify on Etherscan

\`\`\`bash
npx hardhat verify --network sepolia CONTRACT_ADDRESS "Hello, Hardhat!"
\`\`\`

## Gas Optimization Tips

1. **Use \`uint256\`** — EVM operates on 256-bit words
2. **Pack storage** — declare smaller types together
3. **Cache storage in memory** — read once, use multiple times
4. **Use events** for data you don't need to read on-chain
5. **Avoid loops** with unbounded size
6. **Use \`calldata\`** instead of \`memory\` for read-only params

## Common Patterns

### Ownable

\`\`\`solidity
abstract contract Ownable {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
}
\`\`\`

### Pausable

\`\`\`solidity
bool public paused;

modifier whenNotPaused() {
    require(!paused, "Contract is paused");
    _;
}

function pause() public onlyOwner {
    paused = true;
}

function unpause() public onlyOwner {
    paused = false;
}
\`\`\`

## Resources

- **Solidity Docs**: docs.soliditylang.org
- **OpenZeppelin Contracts**: github.com/OpenZeppelin/openzeppelin-contracts
- **Etherscan**: sepolia.etherscan.io (testnet explorer)
- **Remix IDE**: remix.ethereum.org (browser-based IDE)`,
  },
  {
    title: "Home Assistant on Windows: Smart Home Hub Setup Guide",
    category: "Home Automation",
    tags: ["home-assistant", "smart-home", "automation", "windows", "iot"],
    excerpt:
      "Run Home Assistant on Windows using WSL2 or Docker. Control lights, sensors, and devices from a single dashboard.",
    content: `## What is Home Assistant?

Home Assistant is an open-source home automation platform. It runs locally, supports 2000+ integrations, and keeps your data private. Unlike cloud-based solutions (Google Home, Alexa), everything stays on your network.

## Option 1: Docker (Recommended)

### Install Docker Desktop

1. Download Docker Desktop for Windows
2. Enable WSL 2 backend
3. Restart computer

### Run Home Assistant

\`\`\`bash
docker run -d \\
  --name home-assistant \\
  --restart=unless-stopped \\
  -v homeassistant:/config \\
  -v /etc/localtime:/etc/localtime:ro \\
  --network=host \\
  ghcr.io/home-assistant/home-assistant:stable
\`\`\`

**Note**: \`--network=host\` is required for device discovery.

### Access the Dashboard

Open \`http://localhost:8123\` in your browser.

Create an account when prompted — this is your admin user.

## Option 2: WSL 2

### Install WSL 2

\`\`\`bash
wsl --install -d Ubuntu
\`\`\`

### Install Home Assistant OS (Advanced)

\`\`\`bash
# Inside WSL Ubuntu
sudo apt update && sudo apt install -y curl git

# Follow the Home Assistant OS installation guide
# for WSL2 / virtual machine setup
\`\`\`

## First-Time Configuration

### Onboarding

1. Open \`http://localhost:8123\`
2. Create admin account
3. Set location and timezone
4. Home Assistant discovers devices on your network

### Dashboard

The default dashboard shows:
- **Overview**: All discovered devices
- **Map**: Device locations
- **Logbook**: Event history
- **History**: Sensor data over time

## Adding Integrations

### Step 1: Settings → Devices & Services

Click **+ Add Integration** and search for your device brand.

### Popular Integrations

| Integration | What It Controls |
|-------------|-----------------|
| Philips Hue | Hue lights and bridges |
| Tuya | Smart plugs, sensors |
| MQTT | DIY sensors (ESP32, ESP8266) |
| Zigbee2MQTT | Zigbee devices via MQTT |
| TP-Link Kasa | Smart plugs and switches |
| Google Cast | Chromecast, Nest speakers |
| Frigate | Security camera AI detection |

### Example: Add MQTT Integration

1. Install Mosquitto broker:
\`\`\`bash
docker run -d --name mosquitto -p 1883:1883 eclipse-mosquitto
\`\`\`

2. In Home Assistant: Settings → Add Integration → MQTT
3. Broker: \`localhost\`, Port: \`1883\`

## Automation Examples

### YAML Configuration

Automations are defined in \`config/automations.yaml\`:

\`\`\`yaml
# Turn on lights at sunset
- alias: "Lights at Sunset"
  trigger:
    platform: sun
    event: sunset
  action:
    service: light.turn_on
    target:
      entity_id: light.living_room
    data:
      brightness_pct: 80
      color_temp_kelvin: 2700

# Motion sensor light
- alias: "Motion Light"
  trigger:
    platform: state
    entity_id: binary_sensor.motion_detector
    to: "on"
  action:
    service: light.turn_on
    target:
      entity_id: light.hallway
    data:
      brightness_pct: 100

# Send notification when door opens
- alias: "Door Alert"
  trigger:
    platform: state
    entity_id: binary_sensor.front_door
    to: "on"
  action:
    service: notify.mobile_app
    data:
      title: "Door Opened"
      message: "Front door opened at {{ now().strftime('%H:%M') }}"
\`\`\`

### Visual Editor

1. Settings → Automations → + Create Automation
2. Choose trigger (time, state, device, etc.)
3. Add conditions (optional)
4. Add actions (call service, device action, etc.)
5. Save

## Dashboard Customization

### Add Cards

Edit your dashboard (⋮ menu → Edit Dashboard):

\`\`\`yaml
views:
  - title: Home
    cards:
      - type: entity
        entity: light.living_room
        name: Living Room Light

      - type: thermostat
        entity: climate.thermostat

      - type: history-graph
        entities:
          - sensor.temperature
        hours_to_show: 24

      - type: map
        entities:
          - device_tracker.phone
\`\`\`

### Custom Cards (HACS)

Install HACS (Home Assistant Community Store):

\`\`\`bash
# Inside Home Assistant Docker container
docker exec -it home-assistant bash
wget -O - https://get.hacs.xyz | bash -
\`\`\`

Then restart Home Assistant and go to Settings → Add Integration → HACS.

Popular custom cards:
- **Mini Media Player**: Compact media controls
- **Bubble Card**: Modern, minimal cards
- **Mushroom**: Beautiful entity cards
- **Bar Card**: Visual level indicators

## ESP32 / ESPHome Integration

### Install ESPHome

\`\`\`bash
pip install esphome
\`\`\`

### Create a Sensor

\`\`\`yaml
# sensor.yaml
esphome:
  name: living-room-sensor
  platform: ESP32
  board: esp32dev

wifi:
  ssid: "YourWiFi"
  password: "YourPassword"

sensor:
  - platform: dht
    pin: GPIO4
    temperature:
      name: "Living Room Temperature"
    humidity:
      name: "Living Room Humidity"
    update_interval: 30s
\`\`\`

### Flash and Auto-Discover

\`\`\`bash
esphome run sensor.yaml
\`\`\`

Home Assistant auto-discovers the sensor via mDNS.

## Backup Strategy

### Automated Backups

1. Settings → System → Backups
2. Set up automatic backups (daily recommended)
3. Store backups on network drive or cloud

### Manual Backup

\`\`\`bash
# Export configuration
docker exec home-assistant tar czf /config/backup.tar.gz /config
docker cp home-assistant:/config/backup.tar.gz ./
\`\`\`

## Performance Tips

1. **Use SSD** for config storage — database writes are frequent
2. **Exclude logs** from SD cards (if using Raspberry Pi)
3. **Monitor resource usage** — Settings → System → Resource Usage
4. **Use templates** sparingly — they re-evaluate on every state change
5. **Archive old entities** you no longer use`,
  },
  {
    title: "Prometheus + Grafana: Monitor Your Servers Like a Pro",
    category: "DevOps",
    tags: ["prometheus", "grafana", "monitoring", "devops", "docker"],
    excerpt:
      "Set up Prometheus for metrics collection and Grafana for beautiful dashboards. Monitor CPU, memory, disk, and custom metrics.",
    content: `## Architecture Overview

\`\`\`
Applications → Exporters → Prometheus → Grafana → Dashboards
\`\`\`

- **Prometheus**: Scrapes and stores time-series metrics
- **Exporters**: Expose metrics from targets (node, app, DB)
- **Grafana**: Visualizes metrics with rich dashboards

## Quick Start with Docker Compose

### docker-compose.yml

\`\`\`yaml
version: "3.8"

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - "--config.file=/etc/prometheus/prometheus.yml"
      - "--storage.tsdb.retention.time=30d"
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3000:3000"
    volumes:
      - grafana_data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
      - GF_USERS_ALLOW_SIGN_UP=false
    restart: unless-stopped

  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - "--path.procfs=/host/proc"
      - "--path.sysfs=/host/sys"
      - "--path.rootfs=/rootfs"
    restart: unless-stopped

volumes:
  prometheus_data:
  grafana_data:
\`\`\`

### prometheus.yml

\`\`\`yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]

  - job_name: "node-exporter"
    static_configs:
      - targets: ["node-exporter:9100"]
\`\`\`

### Start Everything

\`\`\`bash
docker compose up -d
\`\`\`

- Prometheus: \`http://localhost:9090\`
- Grafana: \`http://localhost:3000\` (admin / admin123)

## Prometheus Query Language (PromQL)

### Basic Queries

\`\`\`promql
# CPU usage percentage
100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory usage percentage
(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100

# Disk usage percentage
(1 - node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100

# Network receive bytes per second
rate(node_network_receive_bytes_total[5m])
\`\`\`

### Useful Functions

| Function | Purpose |
|----------|---------|
| \`rate()\` | Per-second rate of increase |
| \`irate()\` | Instant rate (spike detection) |
| \`avg_over_time()\` | Average over time range |
| \`histogram_quantile()\` | Percentile from histogram |
| \`sum()\` | Aggregate across labels |
| \`topk()\` | Top N values |
| \`changes()\` | Number of value changes |

## Alerting Rules

### prometheus-alerts.yml

\`\`\`yaml
groups:
  - name: server-alerts
    rules:
      - alert: HighCPU
        expr: 100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage on {{ $labels.instance }}"
          description: "CPU usage is above 80% for 5 minutes"

      - alert: HighMemory
        expr: (1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100 > 90
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High memory usage on {{ $labels.instance }}"

      - alert: DiskSpaceLow
        expr: (1 - node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100 > 85
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Disk space low on {{ $labels.instance }}"
\`\`\`

### Add Alerts to Prometheus

\`\`\`yaml
# prometheus.yml
rule_files:
  - "prometheus-alerts.yml"
\`\`\`

## Grafana Dashboard Setup

### Add Prometheus as Data Source

1. Grafana → Settings → Data Sources → Add
2. Select Prometheus
3. URL: \`http://prometheus:9090\`
4. Save & Test

### Import Community Dashboards

1. Grafana → + → Import
2. Enter dashboard ID:
   - **1860**: Node Exporter Full (comprehensive server metrics)
   - **12006**: Docker container monitoring
   - **11074**: MySQL monitoring
3. Select Prometheus data source
4. Import

### Create Custom Panel

1. Edit dashboard → + Add Panel
2. Query: \`100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)\`
3. Visualization: Gauge
4. Title: "CPU Usage %"
5. Set thresholds: green < 60, yellow < 80, red > 80

## Application Metrics

### Expose Metrics from Node.js

\`\`\`javascript
import { register, Counter, Histogram, Gauge } from "prom-client";

// Create metrics
const httpRequests = new Counter({
  name: "http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "path", "status"],
});

const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "Request duration in seconds",
  labelNames: ["method", "path"],
});

const activeConnections = new Gauge({
  name: "active_connections",
  help: "Number of active connections",
});

// Middleware
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  activeConnections.inc();

  res.on("finish", () => {
    httpRequests.inc({
      method: req.method,
      path: req.path,
      status: res.statusCode,
    });
    end({ method: req.method, path: req.path });
    activeConnections.dec();
  });

  next();
});

// Metrics endpoint
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});
\`\`\`

### Add to Prometheus

\`\`\`yaml
scrape_configs:
  - job_name: "my-app"
    static_configs:
      - targets: ["app:3000"]
    metrics_path: "/metrics"
\`\`\`

## Log Aggregation (Bonus)

### Loki + Promtail

Add to docker-compose.yml:

\`\`\`yaml
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - loki_data:/loki

  promtail:
    image: grafana/promtail:latest
    volumes:
      - /var/log:/var/log
      - ./promtail.yml:/etc/promtail/promtail.yml
    command: -config.file=/etc/promtail/promtail.yml

volumes:
  loki_data:
\`\`\`

Add Loki as a data source in Grafana for log correlation.

## Production Checklist

1. **Set retention** — \`--storage.tsdb.retention.time=30d\`
2. **Add authentication** — reverse proxy with auth
3. **SSL/TLS** — use Let's Encrypt with nginx
4. **Backup Grafana** — provision dashboards as JSON files
5. **Monitor Prometheus itself** — scrape \`/metrics\` endpoint
6. **Use recording rules** — precompute expensive queries
7. **Alert routing** — connect Alertmanager to Slack/PagerDuty`,
  },
  {
    title: "Windows Terminal: Power User Configuration Guide",
    category: "Windows Setup",
    tags: ["windows-terminal", "powershell", "configuration", "productivity"],
    excerpt:
      "Supercharge Windows Terminal with profiles, themes, split panes, and custom keybindings. Turn your terminal into a productivity machine.",
    content: `## Installing Windows Terminal

1. Open Microsoft Store
2. Search "Windows Terminal"
3. Install (free)

Or via winget:

\`\`\`bash
winget install Microsoft.WindowsTerminal
\`\`\`

## Settings File

Open settings: \`Ctrl + ,\`

The settings file is \`settings.json\` — edit it directly for full control.

### Open Settings File

\`\`\`bash
# In Windows Terminal
Ctrl + ,

# Or navigate to
%LOCALAPPDATA%\\Packages\\Microsoft.WindowsTerminal_8wekyb3d8bbwe\\LocalState\\settings.json
\`\`\`

## Custom Profiles

### PowerShell 7 Profile

\`\`\`json
{
  "profiles": {
    "list": [
      {
        "name": "PowerShell 7",
        "source": "Windows.Terminal.PowershellCore",
        "startingDirectory": "%USERPROFILE%\\Projects",
        "font": {
          "face": "CaskaydiaCove Nerd Font",
          "size": 12
        },
        "colorScheme": "Catppuccin Mocha",
        "tabTitle": "PS7",
        "icon": "ms-appx:///ProfileIcons/pwsh.png",
        "padding": "8, 8, 8, 8",
        "useAcrylic": true,
        "opacity": 90
      }
    ]
  }
}
\`\`\`

### Ubuntu/WSL Profile

\`\`\`json
{
  "name": "Ubuntu",
  "source": "Windows.Terminal.Wsl",
  "startingDirectory": "~",
  "font": {
    "face": "JetBrainsMono Nerd Font",
    "size": 12
  },
  "colorScheme": "One Half Dark",
  "tabTitle": "Ubuntu"
}
\`\`\`

### SSH Profile

\`\`\`json
{
  "name": "My Server",
  "commandline": "ssh user@192.168.1.100",
  "font": {
    "face": "Cascadia Code",
    "size": 12
  },
  "colorScheme": "Solarized Dark",
  "icon": "ms-appx:///ProfileIcons/{550ce7b8-d500-50ad-8a1a-c400c3262db3}.png"
}
\`\`\`

## Color Schemes

### Catppuccin Mocha

\`\`\`json
{
  "schemes": [
    {
      "name": "Catppuccin Mocha",
      "background": "#1E1E2E",
      "foreground": "#CDD6F4",
      "cursorColor": "#F5E0DC",
      "black": "#45475A",
      "red": "#F38BA8",
      "green": "#A6E3A1",
      "yellow": "#F9E2AF",
      "blue": "#89B4FA",
      "purple": "#F5C2E7",
      "cyan": "#94E2D5",
      "white": "#BAC2DE",
      "brightBlack": "#585B70",
      "brightRed": "#F38BA8",
      "brightGreen": "#A6E3A1",
      "brightYellow": "#F9E2AF",
      "brightBlue": "#89B4FA",
      "brightPurple": "#F5C2E7",
      "brightCyan": "#94E2D5",
      "brightWhite": "#A6ADC8"
    }
  ]
}
\`\`\`

### Dracula

\`\`\`json
{
  "name": "Dracula",
  "background": "#282A36",
  "foreground": "#F8F8F2",
  "cursorColor": "#F8F8F2",
  "black": "#21222C",
  "red": "#FF5555",
  "green": "#50FA7B",
  "yellow": "#F1FA8C",
  "blue": "#BD93F9",
  "purple": "#FF79C6",
  "cyan": "#8BE9FD",
  "white": "#F8F8F2"
}
\`\`\`

## Keybindings

### Essential Shortcuts

\`\`\`json
{
  "actions": [
    { "command": "toggleFocusMode", "keys": "alt+shift+f" },
    { "command": "toggleFullscreen", "keys": "F11" },
    { "command": "duplicateTab", "keys": "ctrl+shift+d" },
    { "command": "closeTab", "keys": "ctrl+w" },
    { "command": "newTab", "keys": "ctrl+t" },
    { "command": { "action": "switchToTab", "index": 0 }, "keys": "alt+1" },
    { "command": { "action": "switchToTab", "index": 1 }, "keys": "alt+2" },
    { "command": { "action": "switchToTab", "index": 2 }, "keys": "alt+3" },
    { "command": "toggleZoomPane", "keys": "alt+shift+z" },
    { "command": "togglePaneReadOnly", "keys": "alt+shift+r" }
  ]
}
\`\`\`

### Split Pane Shortcuts

\`\`\`json
{ "command": "splitPane", "keys": "alt+shift+-" },
{ "command": "splitPane", "keys": "alt+shift+=" },
{ "command": { "action": "splitPane", "split": "horizontal" }, "keys": "alt+shift+_"}
\`\`\`

## Useful Features

### Quake Mode

Pull down a terminal from the top of the screen:

1. Settings → Actions → "Toggle quake mode"
2. Set shortcut: \`ctrl+\`\`
3. Terminal slides down like a console

### Focus Mode

Hide tabs and title bar for distraction-free work:

1. Settings → Actions → "Toggle focus mode"
2. Or press \`Alt+Shift+F\`

### Retro Effects

\`\`\`json
{
  "profiles": {
    "defaults": {
      "experimental.input.forceVT": true
    }
  }
}
\`\`\`

Then run: \`conhost\` → Properties → Font → Raster Fonts

### Broadcast Input

Send keystrokes to all panes simultaneously:

1. Right-click on a pane
2. "Send input to all panes"

Useful for running the same command on multiple servers.

## Startup Configuration

\`\`\`json
{
  "startupAction": "defaultProfile",
  "firstWindowPreference": "defaultProfile",
  "launchMode": "maximized",
  "snapToGridOnResize": true,
  "confirmCloseAllTabs": true,
  "copyOnSelect": true,
  "trimBlockSelection": true,
  "trimPaste": true,
  "wordDelimiters": " /\\()\"'-.,:;<>~!@#$%^&*|+=[]{}~?│"
}
\`\`\`

## Profiles with Custom Tasks

### Development Environment

\`\`\`json
{
  "name": "Dev - Node.js",
  "commandline": "pwsh -NoExit -Command \"cd ~/Projects; nvm use 20; Clear-Host\"",
  "startingDirectory": "%USERPROFILE%\\Projects",
  "tabTitle": "Dev"
}
\`\`\`

### Quick SSH

\`\`\`json
{
  "name": "SSH - Production",
  "commandline": "ssh -i ~/.ssh/id_ed25519 deploy@prod.example.com",
  "tabTitle": "PROD",
  "colorScheme": "Solarized Dark"
}
\`\`\`

## Backup and Sync Settings

### OneDrive Sync

\`\`\`bash
# Create symlink to OneDrive
mklink /D "%LOCALAPPDATA%\\Packages\\Microsoft.WindowsTerminal_8wekyb3d8bbwe\\LocalState" "%USERPROFILE%\\OneDrive\\TerminalSettings"
\`\`\`

### Export Settings

\`\`\`bash
# Backup
copy "%LOCALAPPDATA%\\Packages\\Microsoft.WindowsTerminal_8wekyb3d8bbwe\\LocalState\\settings.json" "%USERPROFILE%\\Desktop\\terminal-settings-backup.json"
\`\`\`

## Nerd Fonts

Install Nerd Fonts for icons in terminal:

\`\`\`bash
winget install JanDeDobbeleer.OhMyPosh
oh-my-posh init pwsh --config "$env:POSH_THEMES_PATH/catppuccin_mocha.omp.json" | Invoke-Expression
\`\`\`

### Add to PowerShell Profile

\`\`\`powershell
notepad $PROFILE
# Add:
oh-my-posh init pwsh --config "$env:POSH_THEMES_PATH/catppuccin_mocha.omp.json" | Invoke-Expression
\`\`\`

## Troubleshooting

### Slow Performance

1. Disable acrylic: \`"useAcrylic": false\`
2. Reduce font size
3. Disable cursor blinking
4. Use \`"experimental.input.forceVT": true\`

### Wrong Font Characters

Install a Nerd Font and set it in your profile:

\`\`\`json
"font": {
  "face": "CaskaydiaCove Nerd Font"
}
\`\`\`

### Settings Not Saving

1. Check file permissions
2. Close all Windows Terminal instances
3. Delete and recreate \`settings.json\`
4. Reopen Windows Terminal`,
  },
  {
    title: "Cursor IDE: AI-Powered Development Setup Guide",
    category: "Software Config",
    tags: ["cursor", "ide", "ai", "coding", "productivity", "vscode"],
    excerpt:
      "Set up Cursor IDE for maximum productivity. Configure AI assistance, keybindings, extensions, and project settings.",
    content: `## What is Cursor?

Cursor is a fork of VS Code with built-in AI coding assistance. It uses Claude, GPT-4, and other models to help you write, debug, and understand code — all within a familiar editor.

## Installation

### Download

1. Go to [cursor.sh](https://cursor.sh)
2. Download for Windows/macOS/Linux
3. Install and open

### Import VS Code Settings

Cursor auto-detects VS Code on first launch:
1. "Import VS Code Settings" → Yes
2. Extensions migrate automatically
3. Keybindings transfer

## Core Features

### Chat (Ctrl+L)

Open the AI chat panel:
- Ask questions about your code
- Get explanations for complex functions
- Generate code snippets
- Refactor suggestions

### Cmd+K (Inline Edit)

Select code → press \`Ctrl+K\`:
- Type instructions: "add error handling"
- AI modifies the selected code in place
- Accept/reject changes

### Tab Completion

Cursor suggests code as you type:
- Press \`Tab\` to accept
- Press \`Esc\` to dismiss
- Press \`Ctrl+→\` to accept word-by-word

### Composer (Ctrl+I)

Multi-file edits:
1. \`Ctrl+I\` opens Composer
2. Describe changes: "Add a login page with email validation"
3. AI creates/modifies multiple files
4. Review and apply changes

## Configuration

### Settings (Ctrl+,)

#### AI Settings

\`\`\`json
{
  "cursor.ai.enabled": true,
  "cursor.chat.model": "claude-3.5-sonnet",
  "cursor.tab.enabled": true,
  "cursor.tab.maxTokens": 1000
}
\`\`\`

#### Editor Settings

\`\`\`json
{
  "editor.fontSize": 14,
  "editor.fontFamily": "JetBrains Mono, Consolas, monospace",
  "editor.lineHeight": 1.6,
  "editor.bracketPairColorization.enabled": true,
  "editor.guides.bracketPairs": true,
  "editor.minimap.enabled": false,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.suggestSelection": "first",
  "editor.wordWrap": "on"
}
\`\`\`

#### Terminal Settings

\`\`\`json
{
  "terminal.integrated.fontFamily": "JetBrainsMono Nerd Font",
  "terminal.integrated.fontSize": 13,
  "terminal.integrated.defaultProfile.windows": "PowerShell"
}
\`\`\`

### Keybindings (keybindings.json)

\`\`\`json
[
  { "key": "ctrl+shift+/", "command": "editor.action.toggleBlockComment" },
  { "key": "ctrl+d", "command": "editor.action.addSelectionToNextFindMatch" },
  { "key": "alt+up", "command": "editor.action.moveLinesUpAction" },
  { "key": "alt+down", "command": "editor.action.moveLinesDownAction" },
  { "key": "ctrl+shift+k", "command": "editor.action.deleteLines" },
  { "key": "ctrl+enter", "command": "editor.action.insertLineAfter" },
  { "key": "ctrl+shift+enter", "command": "editor.action.insertLineBefore" },
  { "key": "alt+shift+up", "command": "editor.action.copyLinesUpAction" },
  { "key": "f12", "command": "editor.action.revealDefinition" },
  { "key": "alt+f12", "command": "editor.action.peekDefinition" },
  { "key": "ctrl+k ctrl+f", "command": "editor.action.formatDocument" }
]
\`\`\`

## Essential Extensions

### Must-Have

| Extension | Purpose |
|-----------|---------|
| **Prettier** | Code formatting |
| **ESLint** | JavaScript linting |
| **GitLens** | Git blame, history |
| **Error Lens** | Inline error display |
| **Better Comments** | Color-coded comments |
| **Import Cost** | Show package sizes |
| **DotENV** | .env file syntax |

### Productivity

| Extension | Purpose |
|-----------|---------|
| **Todo Tree** | Find TODO/FIXME |
| **Bracket Pair Colorizer** | Nested bracket colors |
| **Path Intellisense** | Auto-complete file paths |
| **Auto Rename Tag** | HTML tag sync |
| **Thunder Client** | API testing |
| **REST Client** | HTTP requests in editor |

### Git

| Extension | Purpose |
|-----------|---------|
| **GitLens** | See who changed what |
| **GitHub Actions** | Workflow support |
| **Conventional Commits** | Commit message helper |

## AI Workflows

### Code Review

1. Open a file with changes
2. \`Ctrl+L\` → "Review this code for bugs and improvements"
3. AI suggests fixes
4. Apply changes with \`Cmd+K\`

### Generate Tests

1. Select a function
2. \`Ctrl+I\` → "Write unit tests for this function using Jest"
3. Review generated tests
4. Accept and adjust

### Explain Code

1. Select unfamiliar code
2. \`Ctrl+L\` → "Explain what this code does step by step"
3. Get detailed explanation

### Refactor

1. Select messy code
2. \`Ctrl+K\` → "Refactor this to use the Strategy pattern"
3. AI restructures code

### Debug

1. \`Ctrl+L\` → "I'm getting this error: [paste error]"
2. AI suggests fix with explanation
3. Apply and test

## .cursorrules

Create \`.cursorrules\` in project root for context:

\`\`\`
# Project: Tech Setup Blog
- Framework: Next.js 16, React 19
- Language: TypeScript strict
- Styling: Tailwind CSS 4
- Database: Supabase (PostgreSQL)
- Package manager: npm
- Code style:
  - Use const over let
  - Prefer early returns
  - Use TypeScript interfaces over types
  - No semicolons
  - Single quotes
  - Trailing commas
\`\`\`

## Performance Tips

1. **Disable extensions** you don't use
2. **Close unused tabs** — each tab uses memory
3. **Use workspace settings** instead of user settings
4. **Exclude folders** in settings:
\`\`\`json
{
  "files.exclude": {
    "**/node_modules": true,
    "**/.next": true,
    "**/dist": true
  }
}
\`\`\`

5. **Restart extensions host** periodically: \`Ctrl+Shift+P\` → "Restart Extension Host"

## Keyboard Shortcuts Cheat Sheet

| Action | Shortcut |
|--------|----------|
| Quick Open | \`Ctrl+P\` |
| Command Palette | \`Ctrl+Shift+P\` |
| AI Chat | \`Ctrl+L\` |
| Inline Edit | \`Ctrl+K\` |
| Composer | \`Ctrl+I\` |
| Toggle Terminal | Ctrl+grave |
| Split Editor | Ctrl+Shift+backslash |
| Go to Definition | \`F12\` |
| Rename Symbol | \`F2\` |
| Find in Files | \`Ctrl+Shift+F\` |
| Replace in Files | \`Ctrl+Shift+H\` |
| Toggle Comment | \`Ctrl+/\` |
| Duplicate Line | \`Shift+Alt+Down\` |
| Move Line Up/Down | \`Alt+Up/Down\` |
| Select Next Occurrence | \`Ctrl+D\` |
| Multi-Cursor | \`Alt+Click\` |

## Syncing Settings

### Export Settings

1. \`Ctrl+Shift+P\` → "Export Settings"
2. Save to cloud drive or dotfiles repo

### Import on New Machine

1. \`Ctrl+Shift+P\` → "Import Settings"
2. Select exported file

### Git Dotfiles

\`\`\`bash
# Backup settings
cp ~/AppData/Roaming/Cursor/User/settings.json ~/dotfiles/cursor-settings.json
\`\`\``,
  },
  {
    title: "Docker Compose: Multi-Container Apps from Scratch",
    category: "DevOps",
    tags: ["docker", "docker-compose", "containers", "devops", "deployment"],
    excerpt:
      "Master Docker Compose for local development. Build, connect, and manage multi-container apps with a single YAML file.",
    content: `## What is Docker Compose?

Docker Compose defines and runs multi-container applications. With one YAML file, you start databases, caches, web servers, and app servers — all networked together.

## Installation

Docker Desktop includes Compose. Verify:

\`\`\`bash
docker compose version
# Docker Compose version v2.x.x
\`\`\`

## Basic Example: Web + Database

### docker-compose.yml

\`\`\`yaml
services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/myapp
    depends_on:
      - db
    volumes:
      - .:/app
      - /app/node_modules
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: myapp
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
\`\`\`

### Dockerfile

\`\`\`dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
\`\`\`

### Start Everything

\`\`\`bash
docker compose up -d
\`\`\`

## Essential Commands

| Command | Purpose |
|---------|---------|
| \`docker compose up -d\` | Start in background |
| \`docker compose down\` | Stop and remove containers |
| \`docker compose ps\` | List running containers |
| \`docker compose logs web\` | View logs for service |
| \`docker compose logs -f\` | Follow all logs |
| \`docker compose exec web sh\` | Shell into container |
| \`docker compose build\` | Rebuild images |
| \`docker compose restart web\` | Restart specific service |
| \`docker compose stop\` | Stop without removing |
| \`docker compose pull\` | Update base images |

## Common Patterns

### Environment Variables

#### Option 1: env_file

\`\`\`yaml
services:
  web:
    env_file:
      - .env
\`\`\`

#### Option 2: inline

\`\`\`yaml
services:
  web:
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@db:5432/myapp
    env_file:
      - .env
\`\`\`

### Networks

\`\`\`yaml
services:
  web:
    networks:
      - frontend
  db:
    networks:
      - frontend
      - backend
  cache:
    networks:
      - backend

networks:
  frontend:
  backend:
\`\`\`

Services on the same network can communicate by service name.

### Health Checks

\`\`\`yaml
services:
  db:
    image: postgres:16-alpine
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d myapp"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  web:
    build: .
    depends_on:
      db:
        condition: service_healthy
\`\`\`

### Volumes

\`\`\`yaml
services:
  db:
    volumes:
      # Named volume (persistent)
      - postgres_data:/var/lib/postgresql/data
      # Bind mount (local directory)
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

volumes:
  postgres_data:
\`\`\`

### Ports

\`\`\`yaml
services:
  web:
    ports:
      # host:container
      - "3000:3000"
      # Bind to localhost only
      - "127.0.0.1:3000:3000"
      # Random host port
      - "3000"
\`\`\`

## Full-Stack Example

### Node.js + PostgreSQL + Redis + Nginx

\`\`\`yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://postgres:secret@db:5432/appdb
      REDIS_URL: redis://cache:6379
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started
    networks:
      - backend

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: appdb
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: secret
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - backend

  cache:
    image: redis:7-alpine
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
    networks:
      - backend

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    networks:
      - backend

volumes:
  pgdata:

networks:
  backend:
\`\`\`

## Development vs Production

### Override File

\`\`\`bash
# docker-compose.yml (base)
services:
  app:
    build: .
    environment:
      NODE_ENV: development

# docker-compose.prod.yml (production overrides)
services:
  app:
    image: myregistry/app:latest
    environment:
      NODE_ENV: production
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: "1.0"
          memory: 512M
\`\`\`

### Commands

\`\`\`bash
# Development
docker compose up -d

# Production
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
\`\`\`

## Debugging

### View Logs

\`\`\`bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f app

# Last 100 lines
docker compose logs --tail 100 app
\`\`\`

### Inspect Network

\`\`\`bash
docker network inspect tech-setup_default
\`\`\`

### Execute Commands

\`\`\`bash
# Shell into running container
docker compose exec app sh

# Run one-off command
docker compose exec app node scripts/migrate.js

# Database shell
docker compose exec db psql -U postgres -d appdb
\`\`\`

## Cleanup

\`\`\`bash
# Remove stopped containers
docker compose down

# Remove containers + volumes
docker compose down -v

# Remove containers + images
docker compose down --rmi all

# Prune everything
docker system prune -af
\`\`\`

## Performance Tips

1. **Use .dockerignore** to exclude \`node_modules\`, \`.git\`
2. **Layer caching**: copy package.json before source code
3. **Named volumes** for databases (not bind mounts)
4. **Multi-stage builds** for smaller production images
5. **Use \`--no-cache\`** only when needed (\`docker compose build --no-cache\`)`,
  },
  {
    title: "Git Advanced: Rebase, Cherry-Pick, and Interactive History",
    category: "Software Config",
    tags: ["git", "rebase", "cherry-pick", "version-control", "advanced"],
    excerpt:
      "Master advanced Git workflows: interactive rebase, cherry-pick, bisect, and history rewriting. Clean up messy commits like a pro.",
    content: `## Interactive Rebase

Interactive rebase lets you rewrite commit history — squash, reorder, edit, or drop commits.

### Basic Syntax

\`\`\`bash
# Rebase last 3 commits
git rebase -i HEAD~3

# Rebase since a specific commit
git rebase -i abc1234
\`\`\`

### The Editor

\`\`\`
pick a1b2c3d Add login page
pick d4e5f6g Add password validation
pick h7i8j9k Fix typo in login
pick l0m1n2o Add remember me checkbox
\`\`\`

### Commands

| Command | Action |
|---------|--------|
| \`pick\` | Keep commit as-is |
| \`reword\` | Keep commit, edit message |
| \`edit\` | Pause to amend commit content |
| \`squash\` | Merge with previous commit |
| \`fixup\` | Like squash, discard this message |
| \`drop\` | Remove commit entirely |

### Squash Example

\`\`\`
pick a1b2c3d Add login page
squash d4e5f6g Add password validation
squash h7i8j9k Fix typo in login
pick l0m1n2o Add remember me checkbox
\`\`\`

Result: First 3 commits become one.

### Reorder Commits

Just reorder the lines:

\`\`\`
pick l0m1n2o Add remember me checkbox
pick a1b2c3d Add login page
pick d4e5f6g Add password validation
pick h7i8j9k Fix typo in login
\`\`\`

## Cherry-Pick

Apply specific commits from one branch to another.

### Single Commit

\`\`\`bash
# Get commit hash from source branch
git log feature-branch --oneline
# a1b2c3d Fix critical bug

# Apply to current branch
git cherry-pick a1b2c3d
\`\`\`

### Multiple Commits

\`\`\`bash
# Cherry-pick range (exclusive of start)
git cherry-pick abc123..def456

# Cherry-pick specific commits
git cherry-pick a1b2c3d d4e5f6g h7i8j9k
\`\`\`

### Cherry-Pick Without Committing

\`\`\`bash
# Apply changes but don't commit
git cherry-pick --no-commit a1b2c3d

# Review changes
git diff --staged

# Commit manually
git commit -m "Applied fix from feature-branch"
\`\`\`

## Git Bisect

Binary search through commits to find when a bug was introduced.

\`\`\`bash
# Start bisect
git bisect start

# Mark current commit as bad
git bisect bad

# Mark a known good commit
git bisect good abc1234

# Git checks out middle commit
# Test it, then mark as good or bad
git bisect good  # or
git bisect bad

# Continue until Git finds the culprit
# Result: "xyz789 is the first bad commit"

# Return to original branch
git bisect reset
\`\`\`

### Automated Bisect

\`\`\`bash
git bisect start
git bisect bad HEAD
git bisect good abc1234

# Git runs test script automatically
git bisect run npm test

# Returns the exact commit that broke tests
\`\`\`

## Reflog: Undo Anything

The reflog tracks every HEAD movement. Nothing is truly lost until garbage collected.

\`\`\`bash
# View reflog
git reflog

# Output:
# abc1234 HEAD@{0}: reset: moving to HEAD~3
# def5678 HEAD@{1}: commit: Add feature
# ghi9012 HEAD@{2}: commit: Fix bug
# jkl3456 HEAD@{3}: commit: Initial work
\`\`\`

### Recover Deleted Branch

\`\`\`bash
# Find the commit where the branch pointed
git reflog

# Create branch at that commit
git checkout -b recovered-branch def5678
\`\`\`

### Undo a Bad Rebase

\`\`\`bash
# Before rebase: abc1234 was HEAD
git reflog
# Find the pre-rebase commit
git reset --hard HEAD@{5}  # or whatever the reflog shows
\`\`\`

## Stashing Advanced

### Stash with Message

\`\`\`bash
git stash push -m "WIP: half-done login feature"
\`\`\`

### Stash Specific Files

\`\`\`bash
git stash push -m "login changes" src/login.ts src/auth.ts
\`\`\`

### Stash Untracked Files

\`\`\`bash
git stash --include-untracked
\`\`\`

### Apply Stash Without Removing

\`\`\`bash
git stash apply stash@{0}
\`\`\`

### Stash as Branch

\`\`\`bash
git stash branch new-feature-branch stash@{0}
\`\`\`

## Worktrees

Work on multiple branches simultaneously without stashing.

\`\`\`bash
# Create worktree for hotfix
git worktree add ../hotfix-branch hotfix-123

# Work in the hotfix directory
cd ../hotfix-branch
# ... fix bug, commit ...

# Return to main worktree
cd ../main-repo

# List worktrees
git worktree list

# Remove worktree
git worktree remove ../hotfix-branch
\`\`\`

## Cleaning Up

### Remove Untracked Files

\`\`\`bash
# Preview what will be deleted
git clean -fd --dry-run

# Delete untracked files and directories
git clean -fd
\`\`\`

### Remove Merged Branches

\`\`\`bash
# List merged branches
git branch --merged main

# Delete merged branches (except main/master)
git branch --merged main | grep -v "main\\|master" | xargs git branch -d

# Force delete unmerged branches
git branch --merged main | grep -v "main\\|master" | xargs git branch -D
\`\`\`

## Commit Amendments

### Change Last Commit Message

\`\`\`bash
git commit --amend -m "New commit message"
\`\`\`

### Add Files to Last Commit

\`\`\`bash
git add forgotten-file.ts
git commit --amend --no-edit
\`\`\`

### Undo Last Commit (Keep Changes)

\`\`\`bash
git reset --soft HEAD~1
\`\`\`

### Undo Last Commit (Discard Changes)

\`\`\`bash
git reset --hard HEAD~1
\`\`\`

## Blame and Search

### Blame (Who Changed What)

\`\`\`bash
git blame src/auth.ts

# Show changes within a range
git blame -L 10,20 src/auth.ts

# Ignore whitespace changes
git blame -w src/auth.ts
\`\`\`

### Search Commits

\`\`\`bash
# Search commit messages
git log --grep="fix" --oneline

# Search code changes
git log -S "functionName" --oneline

# Search for pattern in diffs
git log -G "regex pattern" --oneline
\`\`\`

## aliases (Recommended)

Add to \`\~/.gitconfig\`:

\`\`\`ini
[alias]
    st = status
    co = checkout
    br = branch
    cm = commit
    lg = log --oneline --graph --decorate --all
    unstage = reset HEAD --
    last = log -1 HEAD
    amend = commit --amend --no-edit
    wip = !git add -A && git commit -m 'WIP'
    undo = reset --soft HEAD~1
    Visual = !gitk
\`\`\`

## Cheat Sheet

| Task | Command |
|------|---------|
| Squash last 3 | \`git rebase -i HEAD~3\` |
| Cherry-pick commit | \`git cherry-pick abc123\` |
| Find bad commit | \`git bisect start\` |
| Recover deleted branch | \`git reflog\` → \`git checkout -b branch hash\` |
| Undo last commit | \`git reset --soft HEAD~1\` |
| Stash with name | \`git stash push -m "name"\` |
| Work on 2 branches | \`git worktree add ../branch branch-name\` |
| Clean untracked | \`git clean -fd\` |
| Search code history | \`git log -S "function" --oneline\` |`,
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 Creating 15 articles...\n");

  // Check existing slugs
  const { data: existing } = await supabase.from("articles").select("slug");
  const existingSlugs = new Set(existing?.map((a) => a.slug) ?? []);

  const results: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    const slug = slugify(article.title);
    const batchIndex = Math.floor(i / 3); // 0-4 (5 batches)
    const publishedAt = SCHEDULE_DATES[batchIndex];

    console.log(`[${i + 1}/15] ${article.title}`);
    console.log(`  📅 Scheduled: ${publishedAt.slice(0, 10)}`);

    // Skip if slug exists
    if (existingSlugs.has(slug)) {
      console.log(`  ⏭️  Skipped (slug exists): ${slug}`);
      skipped.push(article.title);
      continue;
    }

    try {
      // Upsert category
      const categoryId = await upsertCategory(article.category);

      // Upsert tags
      const tagIds = await upsertTags(article.tags);

      if (!DRY_RUN) {
        // Insert article
        const { data: art, error: artError } = await supabase
          .from("articles")
          .insert({
            title: article.title,
            slug,
            content: article.content,
            excerpt: article.excerpt,
            hero_image_url: null,
            category_id: categoryId,
            status: "scheduled",
            published_at: publishedAt,
          })
          .select("id")
          .single();

        if (artError) throw new Error(`Insert failed: ${artError.message}`);

        // Link tags
        if (tagIds.length > 0) {
          const { error: tagError } = await supabase
            .from("article_tags")
            .insert(tagIds.map((tagId) => ({ article_id: art.id, tag_id: tagId })));
          if (tagError) throw new Error(`Tag link failed: ${tagError.message}`);
        }

        console.log(`  ✅ Created: ${slug}`);
        results.push(slug);
      } else {
        console.log(`  🔍 Dry run — would create: ${slug}`);
        results.push(slug);
      }
    } catch (err) {
      console.error(`  ❌ Error: ${(err as Error).message}`);
      errors.push(article.title);
    }
  }

  console.log("\n═══════════════════════════════════════════");
  console.log(`✅ Created: ${results.length}`);
  console.log(`⏭️  Skipped: ${skipped.length}`);
  console.log(`❌ Errors:  ${errors.length}`);
  if (DRY_RUN) console.log("\n🔍 DRY RUN — no changes made");
  if (results.length) console.log(`\nSlugs:\n  ${results.join("\n  ")}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
