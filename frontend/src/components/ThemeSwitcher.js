import './ThemeSwitcher.css';

const themes = {
  scientific: {
    name: 'Scientific',
    color: '#3182CE',
    vars: {
      '--primary-bg': 'linear-gradient(135deg, #1A1F2C, #2D3748, #4A5568)',
      '--sidebar-bg': '#111827',
      '--sidebar-text': '#E2E8F0',
      '--accent-color': '#3182CE',
      '--text-color': '#F7FAFC',
      '--glass-bg': 'rgba(26, 32, 44, 0.6)',
      '--glass-border': '1px solid rgba(255, 255, 255, 0.1)',
    }
  },
  deep_ocean: {
    name: 'Deep Ocean',
    color: '#2c0b4f',
    vars: {
      '--primary-bg': 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
      '--sidebar-bg': '#0a0e27',
      '--sidebar-text': '#ffffff',
      '--accent-color': '#2c0b4f',
      '--text-color': '#ffffff',
      '--glass-bg': 'rgba(255, 255, 255, 0.1)',
      '--glass-border': '1px solid rgba(255, 255, 255, 0.2)',
    }
  },
  iceberg: {
    name: 'Iceberg',
    color: '#E0F7FA',
    vars: {
      '--primary-bg': 'linear-gradient(135deg, #E0F7FA, #B2EBF2, #80DEEA)',
      '--sidebar-bg': '#006064',
      '--sidebar-text': '#FFFFFF',
      '--accent-color': '#00BCD4',
      '--text-color': '#006064',
      '--glass-bg': 'rgba(255, 255, 255, 0.6)',
      '--glass-border': '1px solid rgba(0, 96, 100, 0.2)',
    }
  },
  midnight: {
    name: 'Midnight',
    color: '#191970',
    vars: {
      '--primary-bg': 'linear-gradient(135deg, #020024, #090979, #00d4ff)',
      '--sidebar-bg': '#000033',
      '--sidebar-text': '#aaaaff',
      '--accent-color': '#191970',
      '--text-color': '#ffffff',
      '--glass-bg': 'rgba(25, 25, 112, 0.3)',
      '--glass-border': '1px solid rgba(255, 255, 255, 0.2)',
    }
  },
  aurora: {
    name: 'Aurora',
    color: '#00fa9a',
    vars: {
      '--primary-bg': 'linear-gradient(135deg, #1d2671, #c33764)', /* Dark purple to pink/red? Aurora is usually green/purple */
      '--primary-bg': 'linear-gradient(135deg, #000428, #004e92)', /* Deep blue */
      '--sidebar-bg': '#000428',
      '--sidebar-text': '#00fa9a',
      '--accent-color': '#00fa9a',
      '--text-color': '#ffffff',
      '--glass-bg': 'rgba(0, 250, 154, 0.1)',
      '--glass-border': '1px solid rgba(0, 250, 154, 0.3)',
    }
  },
  slate: {
    name: 'Slate',
    color: '#708090',
    vars: {
      '--primary-bg': 'linear-gradient(135deg, #2c3e50, #4ca1af)',
      '--sidebar-bg': '#2c3e50',
      '--sidebar-text': '#bdc3c7',
      '--accent-color': '#708090',
      '--text-color': '#ecf0f1',
      '--glass-bg': 'rgba(44, 62, 80, 0.5)',
      '--glass-border': '1px solid rgba(236, 240, 241, 0.2)',
    }
  },
  teal_tech: {
    name: 'Teal Tech',
    color: '#008080',
    vars: {
      '--primary-bg': 'linear-gradient(135deg, #000000, #0f9b0f, #000000)', /* Matrix? No, teal */
      '--primary-bg': 'linear-gradient(135deg, #111, #1a2a2a, #204040)',
      '--sidebar-bg': '#051010',
      '--sidebar-text': '#20b2aa',
      '--accent-color': '#008080',
      '--text-color': '#e0ffff',
      '--glass-bg': 'rgba(0, 128, 128, 0.1)',
      '--glass-border': '1px solid #008080',
    }
  },
  lavender_mist: {
    name: 'Lavender',
    color: '#E6E6FA',
    vars: {
      '--primary-bg': 'linear-gradient(135deg, #E6E6FA, #D8BFD8, #DDA0DD)',
      '--sidebar-bg': '#483D8B',
      '--sidebar-text': '#E6E6FA',
      '--accent-color': '#9370DB',
      '--text-color': '#4B0082',
      '--glass-bg': 'rgba(255, 255, 255, 0.4)',
      '--glass-border': '1px solid rgba(75, 0, 130, 0.2)',
    }
  },
  cobalt: {
    name: 'Cobalt',
    color: '#0047AB',
    vars: {
      '--primary-bg': 'linear-gradient(135deg, #00416A, #E4E5E6)',
      '--sidebar-bg': '#003366',
      '--sidebar-text': '#ffffff',
      '--accent-color': '#0047AB',
      '--text-color': '#ffffff',
      '--glass-bg': 'rgba(0, 71, 171, 0.2)',
      '--glass-border': '1px solid rgba(255, 255, 255, 0.3)',
    }
  },
  glacier: {
    name: 'Glacier',
    color: '#7FFFD4',
    vars: {
      '--primary-bg': 'linear-gradient(135deg, #c2e9fb, #a1c4fd)',
      '--sidebar-bg': '#ffffff',
      '--sidebar-text': '#00bfff',
      '--accent-color': '#00bfff',
      '--text-color': '#007acc',
      '--glass-bg': 'rgba(255, 255, 255, 0.7)',
      '--glass-border': '1px solid #a1c4fd',
    }
  },
  night_sky: {
    name: 'Night Sky',
    color: '#4B0082',
    vars: {
      '--primary-bg': 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)', // Same as original deep ocean? No wait.
      '--primary-bg': 'linear-gradient(to bottom, #020111 10%, #3a3a52 100%)',
      '--sidebar-bg': '#020111',
      '--sidebar-text': '#e0e0e0',
      '--accent-color': '#483D8B',
      '--text-color': '#ffffff',
      '--glass-bg': 'rgba(255, 255, 255, 0.05)',
      '--glass-border': '1px solid rgba(255, 255, 255, 0.1)',
    }
  },
  mint: {
    name: 'Mint',
    color: '#98FF98',
    vars: {
      '--primary-bg': 'linear-gradient(135deg, #0ba360, #3cba92)',
      '--sidebar-bg': '#054025',
      '--sidebar-text': '#e0ffe0',
      '--accent-color': '#006400',
      '--text-color': '#ffffff',
      '--glass-bg': 'rgba(255, 255, 255, 0.2)',
      '--glass-border': '1px solid rgba(255, 255, 255, 0.3)',
    }
  },
  steel: {
    name: 'Steel',
    color: '#4682B4',
    vars: {
      '--primary-bg': 'linear-gradient(135deg, #232526, #414345)',
      '--sidebar-bg': '#191919',
      '--sidebar-text': '#4682B4',
      '--accent-color': '#4682B4',
      '--text-color': '#dcdcdc',
      '--glass-bg': 'rgba(70, 130, 180, 0.1)',
      '--glass-border': '1px solid #4682B4',
    }
  },
  aqua: {
    name: 'Aqua',
    color: '#00FFFF',
    vars: {
      '--primary-bg': 'linear-gradient(135deg, #1A2980, #26D0CE)',
      '--sidebar-bg': '#001f3f',
      '--sidebar-text': '#00FFFF',
      '--accent-color': '#00FFFF',
      '--text-color': '#ffffff',
      '--glass-bg': 'rgba(0, 255, 255, 0.1)',
      '--glass-border': '1px solid rgba(0, 255, 255, 0.3)',
    }
  },
  indigo: {
    name: 'Indigo',
    color: '#4B0082',
    vars: {
      '--primary-bg': 'linear-gradient(135deg, #4b6cb7, #182848)',
      '--sidebar-bg': '#0f0c29',
      '--sidebar-text': '#b0c4de',
      '--accent-color': '#4B0082',
      '--text-color': '#f0f8ff',
      '--glass-bg': 'rgba(255, 255, 255, 0.1)',
      '--glass-border': '1px solid rgba(255, 255, 255, 0.2)',
    }
  },
  winter_night: {
    name: 'Winter',
    color: '#1E90FF',
    vars: {
      '--primary-bg': 'linear-gradient(135deg, #000000, #434343)',
      '--sidebar-bg': '#000000',
      '--sidebar-text': '#1E90FF',
      '--accent-color': '#1E90FF',
      '--text-color': '#ffffff',
      '--glass-bg': 'rgba(30, 144, 255, 0.1)',
      '--glass-border': '1px solid #1E90FF',
    }
  }
};

export function initThemeSwitcher() {
  const container = document.createElement('div');
  container.className = 'theme-switcher';

  // Apply saved theme or default
  const savedTheme = localStorage.getItem('vcl-theme') || 'scientific';
  applyTheme(savedTheme);

  Object.entries(themes).forEach(([key, theme]) => {
    const btn = document.createElement('div');
    btn.className = 'theme-btn';
    btn.style.backgroundColor = theme.color;
    btn.title = theme.name;
    
    if (key === savedTheme) {
      btn.classList.add('active');
    }

    btn.addEventListener('click', () => {
      applyTheme(key);
      
      // Update active state
      document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Save to local storage
      localStorage.setItem('vcl-theme', key);
    });

    container.appendChild(btn);
  });

  const uiLayer = document.getElementById('ui-layer');
  if (uiLayer) {
    uiLayer.appendChild(container);
  } else {
    document.body.appendChild(container);
  }
}

function applyTheme(key) {
  const theme = themes[key];
  if (!theme) return;

  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([varName, value]) => {
    root.style.setProperty(varName, value);
  });
  
  // Body background update (for non-CSS var support fallbacks, though mainly using --primary-bg)
  // But wait, styles.css uses var(--primary-bg) on body.
  // We might want to ensure background-color is set for loading if needed, 
  // but updating variables is enough for now.
}
