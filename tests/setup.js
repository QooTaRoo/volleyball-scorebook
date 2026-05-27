import { beforeAll, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

// Load HTML template
const htmlContent = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');

// Mock localStorage
class LocalStorageMock {
  constructor() {
    this.store = {};
  }
  clear() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
}

// Global browser API mocks
beforeAll(() => {
  global.localStorage = new LocalStorageMock();
  
  // Mock navigator.vibrate
  global.navigator.vibrate = vi.fn().mockReturnValue(true);
  
  // Mock external CDN scripts
  global.lucide = {
    createIcons: vi.fn(),
  };
  global.html2canvas = vi.fn().mockResolvedValue({
    toDataURL: () => 'data:image/png;base64,mocked_image'
  });
  
  // Mock window.scrollTo
  window.scrollTo = vi.fn();
});

// Helper to reset and load the entire application in JSDOM
global.loadApp = () => {
  // 1. Reset DOM from index.html
  document.documentElement.innerHTML = htmlContent;
  
  // 2. Clear localStorage
  localStorage.clear();
  
  // 3. Reset all standard mocks
  vi.clearAllMocks();

  // 4. Set up Lucide & html2canvas mocks on window too
  window.lucide = global.lucide;
  window.html2canvas = global.html2canvas;
  window.navigator.vibrate = global.navigator.vibrate;

  // 5. Read all scripts and concatenate them
  const scripts = [
    'js/state.js',
    'js/ui.js',
    'js/libero.js',
    'js/game.js',
    'js/radial.js',
    'js/court.js',
    'js/history.js',
    'js/teams.js',
    'js/pwa.js',
    'js/backup.js',
    'js/init.js'
  ];

  let combinedCode = '';
  scripts.forEach(scriptPath => {
    const absolutePath = path.resolve(__dirname, '../', scriptPath);
    let code = fs.readFileSync(absolutePath, 'utf8');
    
    // Replace top-level let declarations with var to make them true globals on window in JSDOM
    code = code
      .replace(/^let state\s*=/m, 'var state =')
      .replace(/^let setupServingTeam\s*=/m, 'var setupServingTeam =')
      .replace(/^let lastRenderedScoreA\s*=/m, 'var lastRenderedScoreA =')
      .replace(/^let lastRenderedScoreB\s*=/m, 'var lastRenderedScoreB =')
      .replace(/^let isMenuHubActive\s*=/m, 'var isMenuHubActive =')
      .replace(/^let currentCourtTeam\s*=/m, 'var currentCourtTeam =')
      .replace(/^let currentSubPosIdx\s*=/m, 'var currentSubPosIdx =')
      .replace(/^let swapSelectionIdx\s*=/m, 'var swapSelectionIdx =')
      .replace(/^let radialState\s*=/m, 'var radialState =')
      .replace(/^let currentEditingActionIdx\s*=/m, 'var currentEditingActionIdx =')
      .replace(/^let masterEditMembers\s*=/m, 'var masterEditMembers =');

    combinedCode += code + '\n;';
  });

  try {
    window.eval(combinedCode);
  } catch (e) {
    console.error('Failed to load combined application scripts', e);
  }

  // Manually dispatch DOMContentLoaded to run app init if needed
  const event = new Event('DOMContentLoaded', {
    bubbles: true,
    cancelable: true
  });
  document.dispatchEvent(event);
};

// Auto load before each test file
beforeEach(() => {
  global.loadApp();
});
