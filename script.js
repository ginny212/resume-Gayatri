/* ==========================================================================
   GK_OS PORTFOLIO INTERACTION SCRIPT
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  lucide.createIcons();

  // DOM Selectors
  const desktop = document.getElementById('desktop');
  const clockElement = document.getElementById('system-clock');
  const dockItems = document.querySelectorAll('.dock-item:not(.utility)');
  const navItems = document.querySelectorAll('.nav-item');
  const windows = document.querySelectorAll('.window');
  const closeBtns = document.querySelectorAll('.control-btn.close');
  const minimizeBtns = document.querySelectorAll('.control-btn.minimize');
  const maximizeBtns = document.querySelectorAll('.control-btn.maximize');
  const resetBtn = document.getElementById('dock-reset');
  const titleBars = document.querySelectorAll('.title-bar');

  // Stacking z-index counter
  let highestZIndex = 50;

  // Initial setup: check URL query parameters for default open window
  const urlParams = new URLSearchParams(window.location.search);
  const targetWinId = urlParams.get('win');
  
  let defaultOpenWin = document.getElementById('identity-win');
  
  if (targetWinId) {
    const targetWin = document.getElementById(targetWinId);
    if (targetWin) {
      defaultOpenWin = targetWin;
    }
  }

  if (defaultOpenWin) {
    defaultOpenWin.classList.add('visible');
    bringToFront(defaultOpenWin);
  }

  /* ==========================================================================
     1. SYSTEM CLOCK
     ========================================================================== */
  function updateClock() {
    const now = new Date();
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = months[now.getMonth()];
    const day = now.getDate();
    
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    
    // Format: "JUN 30 06:07 PM" (Matches screenshot style)
    const timeString = `${month} ${day} ${hours}:${minutes} ${ampm}`;
    clockElement.textContent = timeString;
  }

  updateClock();
  setInterval(updateClock, 1000);

  /* ==========================================================================
     2. WINDOW LAYERING (Z-INDEX)
     ========================================================================== */
  function bringToFront(windowElement) {
    if (!windowElement.classList.contains('active')) {
      // Remove active class from all windows
      windows.forEach(win => win.classList.remove('active'));
      
      // Increment layer and apply to current window
      highestZIndex += 1;
      windowElement.style.zIndex = highestZIndex;
      windowElement.classList.add('active');

      // Update active indicators in the dock
      updateDockActiveIndicator(windowElement.id);
    }
  }

  // Bind click event on any window to bring it to front
  windows.forEach(win => {
    win.addEventListener('mousedown', () => {
      bringToFront(win);
    });
    
    // Touch support
    win.addEventListener('touchstart', () => {
      bringToFront(win);
    });
  });

  /* ==========================================================================
     3. WINDOW CONTROLS & NAVIGATION TOGGLES
     ========================================================================== */
  
  // Update the bottom dock dot indicators
  function updateDockActiveIndicator(windowId) {
    dockItems.forEach(item => {
      if (item.getAttribute('data-window') === windowId) {
        item.classList.add('active');
      } else {
        // Only keep active if the window is open and active
        const targetWin = document.getElementById(item.getAttribute('data-window'));
        if (targetWin && targetWin.classList.contains('visible') && targetWin.classList.contains('active')) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      }
    });

    // Also update top bar menu highlighting
    navItems.forEach(item => {
      if (item.getAttribute('data-window') === windowId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  // Open/Toggle window helper
  function toggleWindow(windowId) {
    const targetWin = document.getElementById(windowId);
    if (!targetWin) return;

    if (window.innerWidth <= 768) {
      // Mobile handling: only show one window at a time as a full-screen layout
      windows.forEach(win => {
        if (win.id === windowId) {
          win.classList.add('visible');
          bringToFront(win);
        } else {
          win.classList.remove('visible');
        }
      });
      return;
    }

    if (!targetWin.classList.contains('visible')) {
      // Open window
      targetWin.classList.add('visible');
      bringToFront(targetWin);
    } else {
      // If already open but not front-most, bring it to front
      if (!targetWin.classList.contains('active')) {
        bringToFront(targetWin);
      } else {
        // If already front-most, minimize (hide)
        targetWin.classList.remove('visible');
        // Clear active status
        targetWin.classList.remove('active');
        // Find next active window to bring to front
        const visibleWins = Array.from(windows).filter(w => w.classList.contains('visible'));
        if (visibleWins.length > 0) {
          // Sort by z-index descending
          visibleWins.sort((a, b) => parseInt(b.style.zIndex || 0) - parseInt(a.style.zIndex || 0));
          bringToFront(visibleWins[0]);
        } else {
          // No windows visible, remove active markers
          dockItems.forEach(item => item.classList.remove('active'));
          navItems.forEach(item => item.classList.remove('active'));
        }
      }
    }
  }

  // Bind click handlers to Dock Items
  dockItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const windowId = item.getAttribute('data-window');
      toggleWindow(windowId);
    });
  });

  // Bind click handlers to Top Bar items
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const windowId = item.getAttribute('data-window');
      toggleWindow(windowId);
    });
  });

  // Desktop Shortcuts click & double-click interactions
  const shortcuts = document.querySelectorAll('.shortcut');
  shortcuts.forEach(shortcut => {
    const openWindow = () => {
      const windowId = shortcut.getAttribute('data-window');
      const targetWin = document.getElementById(windowId);
      if (targetWin) {
        targetWin.classList.add('visible');
        bringToFront(targetWin);
      }
    };
    
    // Support single click for responsiveness (like mobile or user preference)
    shortcut.addEventListener('click', (e) => {
      e.preventDefault();
      openWindow();
    });

    // Double-click to mimic traditional OS behavior
    shortcut.addEventListener('dblclick', (e) => {
      e.preventDefault();
      openWindow();
    });
  });

  // Window Close (Red dot)
  closeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const windowId = btn.getAttribute('data-window');
      const targetWin = document.getElementById(windowId);
      if (targetWin) {
        targetWin.classList.remove('visible');
        targetWin.classList.remove('active');
        // Clean up dock active dots
        updateDockActiveIndicator('');
      }
    });
  });

  // Window Minimize (Yellow dot)
  minimizeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const windowId = btn.getAttribute('data-window');
      const targetWin = document.getElementById(windowId);
      if (targetWin) {
        targetWin.classList.remove('visible');
        targetWin.classList.remove('active');
        // Find if there's any other visible window to focus
        const visibleWins = Array.from(windows).filter(w => w.classList.contains('visible'));
        if (visibleWins.length > 0) {
          visibleWins.sort((a, b) => parseInt(b.style.zIndex || 0) - parseInt(a.style.zIndex || 0));
          bringToFront(visibleWins[0]);
        } else {
          updateDockActiveIndicator('');
        }
      }
    });
  });

  // Window Maximize (Green dot)
  maximizeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const windowId = btn.getAttribute('data-window');
      const targetWin = document.getElementById(windowId);
      if (targetWin) {
        targetWin.classList.toggle('maximized');
      }
    });
  });

  // Double click titlebar to maximize
  titleBars.forEach(titleBar => {
    titleBar.addEventListener('dblclick', () => {
      const win = titleBar.closest('.window');
      if (win) {
        win.classList.toggle('maximized');
      }
    });
  });

  // Reset Desktop Utility (Refreshes positions and centers everything)
  resetBtn.addEventListener('click', (e) => {
    e.preventDefault();
    highestZIndex = 50;
    
    // Default positions mapping
    const defaults = {
      'identity-win': { top: '10%', left: '18%' },
      'qualifications-win': { top: '15%', left: '24%' },
      'projects-win': { top: '8%', left: '38%' },
      'track-record-win': { top: '12%', left: '28%' },
      'video-win': { top: '20%', left: '30%' }
    };

    windows.forEach(win => {
      win.classList.remove('maximized');
      win.classList.remove('active');
      win.classList.add('visible');
      
      const pos = defaults[win.id];
      if (pos) {
        win.style.top = pos.top;
        win.style.left = pos.left;
        win.style.width = '';
        win.style.height = '';
      }
    });

    // Re-focus default Identity window
    const identityWin = document.getElementById('identity-win');
    if (identityWin) bringToFront(identityWin);
  });

  /* ==========================================================================
     4. DRAGGABLE WINDOW LOGIC
     ========================================================================== */
  let activeDragWin = null;
  let startX = 0;
  let startY = 0;
  let initialLeft = 0;
  let initialTop = 0;

  titleBars.forEach(titleBar => {
    // Mouse down on title bar starts dragging
    titleBar.addEventListener('mousedown', dragStart);
    // Touch start for mobile / tablets
    titleBar.addEventListener('touchstart', dragStart, { passive: false });
  });

  function dragStart(e) {
    // Don't drag if window is maximized or layout is mobile
    const win = this.closest('.window');
    if (!win || win.classList.contains('maximized') || window.innerWidth <= 768) return;

    activeDragWin = win;
    bringToFront(win);

    // Get input coordinates
    const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;

    startX = clientX;
    startY = clientY;

    // Get current window offsets
    const rect = win.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top - 32; // Offset by height of top system bar

    // Attach document-level move & end event listeners
    if (e.type.startsWith('touch')) {
      document.addEventListener('touchmove', dragMove, { passive: false });
      document.addEventListener('touchend', dragEnd);
    } else {
      document.addEventListener('mousemove', dragMove);
      document.addEventListener('mouseup', dragEnd);
    }

    // Prevent default browser text-selection
    if (e.cancelable) e.preventDefault();
  }

  function dragMove(e) {
    if (!activeDragWin) return;

    // Get coordinates
    const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;

    // Calculate changes
    const dx = clientX - startX;
    const dy = clientY - startY;

    let newLeft = initialLeft + dx;
    let newTop = initialTop + dy;

    // Boundary constraints to keep title bar reachable
    const minLeft = -activeDragWin.offsetWidth + 80;
    const maxLeft = window.innerWidth - 80;
    const minTop = 0; // Don't go above system-bar
    const maxTop = window.innerHeight - 80;

    newLeft = Math.max(minLeft, Math.min(newLeft, maxLeft));
    newTop = Math.max(minTop, Math.min(newTop, maxTop));

    // Update coordinates
    activeDragWin.style.left = `${newLeft}px`;
    activeDragWin.style.top = `${newTop}px`;

    // Prevent scroll on touch devices during drag
    if (e.cancelable) e.preventDefault();
  }

  function dragEnd(e) {
    if (!activeDragWin) return;

    // Remove event listeners
    document.removeEventListener('mousemove', dragMove);
    document.removeEventListener('mouseup', dragEnd);
    document.removeEventListener('touchmove', dragMove);
    document.removeEventListener('touchend', dragEnd);

    activeDragWin = null;
  }

  // Handle window resizing on screen size changes
  window.addEventListener('resize', () => {
    if (window.innerWidth <= 768) {
      // Stack panels, clean custom absolute positioning styles
      windows.forEach(win => {
        win.style.top = '';
        win.style.left = '';
      });
    }
  });
});
