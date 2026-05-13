# チームメンバー登録・ローテーション管理機能 実装プラン

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** スコア記録に加えて、選手のローテーション管理とサーブ権表示、選手交代機能を追加する。

**Architecture:** 既存の `state` オブジェクトを拡張し、得点ロジックに自動回転（ローテーション）を組み込む。UIはコート図を模したオーバーレイとして実装し、視覚的な操作を可能にする。

**Tech Stack:** Vanilla JavaScript, Tailwind CSS (CDN)

---

### Task 1: state の拡張と初期化処理

**Files:**
- Modify: `index.html`

- [ ] **Step 1: state オブジェクトにメンバーとローテーション関連のプロパティを追加**

```javascript
        let state = {
            // ... existing ...
            teamA: "TEAM A",
            teamB: "TEAM B",
            // 追加分
            membersA: Array.from({length: 12}, (_, i) => ({ id: `A${i+1}`, number: i + 1, name: `Player A${i+1}` })),
            membersB: Array.from({length: 12}, (_, i) => ({ id: `B${i+1}`, number: i + 1, name: `Player B${i+1}` })),
            lineupA: ["A1", "A2", "A3", "A4", "A5", "A6"], // P1, P2, P3, P4, P5, P6
            lineupB: ["B1", "B2", "B3", "B4", "B5", "B6"],
            liberoA: null,
            liberoB: null,
            servingTeam: 'A',
            rotationLog: [] // Undo用: { lineupA, lineupB, servingTeam }
        };
```

- [ ] **Step 2: init 関数と applySettings 関数の初期化ロジックを更新**

デフォルトメンバーが正しくセットされるように修正。

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: extend state for member and rotation management"
```

---

### Task 2: メンバー編集モーダルの実装

**Files:**
- Modify: `index.html`

- [ ] **Step 1: メンバー編集用の HTML モーダルを追加**

設定画面（⚙️）の近く、または設定画面内に「メンバー編集」ボタンを追加し、専用のモーダルを表示できるようにする。

- [ ] **Step 2: メンバー情報を編集・保存する関数 `updateMembers()` を実装**

背番号と名前を編集できるようにする。

- [ ] **Step 3: UIでメンバー編集ボタンを有効化**

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add member editing modal"
```

---

### Task 3: サーブ権表示と自動ローテーション

**Files:**
- Modify: `index.html`

- [ ] **Step 1: チーム名の横にサーブ権アイコン（🏐）を表示する UI を追加**

`updateUI` 関数内で `state.servingTeam` に応じてアイコンを表示。

- [ ] **Step 2: `addPoint` 関数のロジックを更新し、自動回転を実装**

サイドアウト（サーブ権がないチームが加点）した際に、`rotateTeam(team)` を呼び出し、サーブ権を移動させる。

- [ ] **Step 3: `rotateTeam(team)` 関数の実装**

配列を時計回りにずらす（P1→P6→P5...の順序に注意）。
バレーの回転：1 -> 6 -> 5 -> 4 -> 3 -> 2 -> 1 (配列の末尾を先頭に持ってくる)

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add auto-rotation and serving indicator"
```

---

### Task 4: コート図オーバーレイの実装

**Files:**
- Modify: `index.html`

- [ ] **Step 1: コート図オーバーレイの HTML/CSS を追加**

ハーフコートの6分割ポジションを表示する UI。

- [ ] **Step 2: `toggleCourtOverlay(team)` 関数の実装**

指定したチームの現在のラインナップをコート図に描画して表示。

- [ ] **Step 3: 選手交代（サブスティチュート）機能の実装**

ポジション枠をタップすると、ベンチメンバー一覧を表示し、選択して交代。

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add court overlay and substitution"
```

---

### Task 5: Undo 機能の拡張

**Files:**
- Modify: `index.html`

- [ ] **Step 1: アクションごとにローテーション状態を保存するように `actionLog` を拡張**

- [ ] **Step 2: `undo()` 関数を修正し、ラインナップとサーブ権も復元するようにする**

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: support rotation undo"
```

---

### Task 6: 最終確認とデバッグ

- [ ] **Step 1: 全機能の動作確認（得点、回転、交代、Undo）**
- [ ] **Step 2: localStorage への保存と復元の確認**
- [ ] **Step 3: Commit**
