// ellieOS - scripts.js

class EllieOS {
    constructor() {
        this.windows = [];
        this.focusedWindow = null;
        this.draggedWindow = null;
        this.dragOffset = { x: 0, y: 0 };
        this.windowZIndex = 1000;
        this.init();
    }

    init() {
        this.setupTaskbar();
        this.setupClock();
        this.setupVimBindings();
        this.setupStartButton();
        this.openWindow('index', 'Welcome to ellieOS', { width: 0.5, height: 0.5 });
    }

    setupTaskbar() {
        const taskbarItems = document.querySelectorAll('.taskbar-item');
        taskbarItems.forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                
                // Check if window already exists
                const existingWindow = this.windows.find(w => w.page === page);
                if (existingWindow) {
                    // Focus and show existing window
                    this.focusWindow(existingWindow.element);
                    existingWindow.element.style.display = 'flex';
                    this.setActiveTaskbarItem(page);
                    return;
                }
                
                // Open new window
                const config = this.getWindowConfig(page);
                this.openWindow(page, this.getTitleForPage(page), config);
                this.setActiveTaskbarItem(page);
            });
        });
    }

    getWindowConfig(page) {
        const configs = {
            'index': { width: 0.5, height: 0.5, centered: true },
            'projects': { width: 0.8, height: 0.8, centered: true },
            'blog': { width: 0.8, height: 0.8, centered: true },
            'contact': { width: 0.25, height: 0.35, centered: true },
            'resume': { width: 0.8, height: 0.85, centered: true }
        };
        return configs[page] || { width: 0.8, height: 0.8, centered: true };
    }

    getTitleForPage(page) {
        const titles = {
            'index': 'Welcome to ellieOS',
            'projects': 'Projects',
            'blog': 'Internet Explorer - ellie\'s blog',
            'contact': 'contact.txt - Notepad',
            'resume': 'Resume - Ellie Feng'
        };
        return titles[page] || 'Window';
    }

    setActiveTaskbarItem(page) {
        document.querySelectorAll('.taskbar-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === page) {
                item.classList.add('active');
            }
        });
    }

    setupClock() {
        const updateClock = () => {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            document.getElementById('clock').textContent = `${hours}:${minutes}`;
        };
        updateClock();
        setInterval(updateClock, 1000);
    }

    setupVimBindings() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'h' && e.ctrlKey) {
                this.focusPreviousWindow();
            }
            if (e.key === 'l' && e.ctrlKey) {
                this.focusNextWindow();
            }
            if (e.key === 'q' && e.ctrlKey && this.focusedWindow) {
                this.closeWindow(this.focusedWindow);
            }
        });
    }

    setupStartButton() {
        const startBtn = document.querySelector('.start-button');
        startBtn.addEventListener('click', () => {
            this.openResume();
        });
    }

    openResume() {
        // Check if resume window already exists
        const existingResume = this.windows.find(w => w.page === 'resume');
        if (existingResume) {
            this.focusWindow(existingResume.element);
            existingResume.element.style.display = 'flex';
            return;
        }
        
        this.openWindow('resume', 'Resume - Ellie Feng', { width: 0.8, height: 0.85 });
    }

    focusPreviousWindow() {
        if (this.windows.length === 0) return;
        const currentIndex = this.windows.findIndex(w => w.element === this.focusedWindow);
        const previousIndex = currentIndex > 0 ? currentIndex - 1 : this.windows.length - 1;
        this.focusWindow(this.windows[previousIndex].element);
    }

    focusNextWindow() {
        if (this.windows.length === 0) return;
        const currentIndex = this.windows.findIndex(w => w.element === this.focusedWindow);
        const nextIndex = currentIndex < this.windows.length - 1 ? currentIndex + 1 : 0;
        this.focusWindow(this.windows[nextIndex].element);
    }

    openWindow(page, title, config = {}) {
        const template = document.getElementById('window-template');
        const newWindow = template.content.cloneNode(true);
        const windowEl = newWindow.querySelector('.window');
        
        windowEl.querySelector('.window-title').textContent = title;
        
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight - 28;
        const widthPercent = config.width || 0.8;
        const heightPercent = config.height || 0.8;
        const windowWidth = screenWidth * widthPercent;
        const windowHeight = screenHeight * heightPercent;
        const posX = (screenWidth - windowWidth) / 2;
        const posY = (screenHeight - windowHeight) / 2;
        
        windowEl.style.left = posX + 'px';
        windowEl.style.top = posY + 'px';
        windowEl.style.width = windowWidth + 'px';
        windowEl.style.height = windowHeight + 'px';

        document.getElementById('windows-container').appendChild(windowEl);

        this.loadWindowContent(windowEl, page);

        const closeBtn = windowEl.querySelector('.close-btn');
        const minimizeBtn = windowEl.querySelector('.minimize-btn');
        const maximizeBtn = windowEl.querySelector('.maximize-btn');
        const titlebar = windowEl.querySelector('.window-titlebar');

        closeBtn.addEventListener('click', () => this.closeWindow(windowEl));
        minimizeBtn.addEventListener('click', () => this.minimizeWindow(windowEl));
        maximizeBtn.addEventListener('click', () => this.maximizeWindow(windowEl));

        titlebar.addEventListener('mousedown', (e) => this.startDrag(e, windowEl));

        windowEl.addEventListener('mousedown', () => this.focusWindow(windowEl));

        this.windows.push({ element: windowEl, page });
        this.focusWindow(windowEl);

        return windowEl;
    }

    loadWindowContent(windowEl, page) {
        const contentDiv = windowEl.querySelector('.window-content');
        
        if (page === 'index') {
            this.loadHomePage(contentDiv);
        } else if (page === 'contact') {
            this.loadContactPage(contentDiv);
        } else {
            fetch(`html/${page}.html`)
                .then(response => response.text())
                .then(html => {
                    contentDiv.innerHTML = html;
                    this.initializePageScripts(page, contentDiv);
                })
                .catch(err => {
                    contentDiv.innerHTML = `<p>Error loading page: ${err.message}</p>`;
                });
        }
    }

    loadHomePage(contentDiv) {
        const terminal = document.createElement('div');
        terminal.className = 'terminal home-terminal';
        terminal.id = 'interactive-terminal';
        
        const welcomeText = `<strong>Welcome to ellieOS v1.0</strong>

Hi there! Welcome to my personal portfolio.
This is ellieOS - an interactive OS-inspired 
portfolio experience.

<strong>HOW TO USE:</strong>
• Click the taskbar items at the bottom to 
  navigate to different sections
• Drag windows around to organize
• Use Ctrl+H/L to switch between windows
• Use Ctrl+Q to close the focused window
• Click Start for resume!

<strong>TERMINAL COMMANDS:</strong>
• help - Show available commands
• pwd - Print working directory
• ls - List contents
• neofetch - Display system info
• whoami - Display user info
• clear - Clear terminal

Type a command and press Enter...

`;

        let index = 0;
        let currentHTML = '';
        const typeText = () => {
            if (index < welcomeText.length) {
                currentHTML = welcomeText.slice(0, index + 1);
                terminal.innerHTML = currentHTML + '<span class="cursor">▌</span>';
                index++;
                setTimeout(typeText, 20);
            } else {
                setTimeout(() => {
                    this.setupInteractiveTerminal(terminal, contentDiv);
                }, 500);
            }
        };

        contentDiv.appendChild(terminal);
        typeText();
    }

    loadContactPage(contentDiv) {
        const notepadContent = document.createElement('div');
        notepadContent.className = 'notepad-content';
        
        const html = `<card>
    <n> Ellie Feng </n>
    <title> UX Designer </title>
    <email> ellief5288@gmail.com </email>
    <url> ellieOS.dev </url>
</card>`;

        const pre = document.createElement('pre');
        pre.textContent = html;
        pre.style.margin = '0';
        pre.style.fontFamily = "'Courier New', monospace";
        pre.style.fontSize = '12px';
        pre.style.color = 'var(--gray-darkest)';
        pre.style.lineHeight = '1.6';

        notepadContent.appendChild(pre);

        const copyBtn = document.createElement('button');
        copyBtn.textContent = '📋 Copy';
        copyBtn.className = 'notepad-copy-btn';
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(html);
            copyBtn.textContent = '✓ Copied!';
            setTimeout(() => {
                copyBtn.textContent = '📋 Copy';
            }, 2000);
        });

        const btnContainer = document.createElement('div');
        btnContainer.style.marginTop = '12px';
        btnContainer.appendChild(copyBtn);
        notepadContent.appendChild(btnContainer);

        contentDiv.appendChild(notepadContent);
    }

    setupInteractiveTerminal(terminalEl, contentDiv) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'terminal-input';
        input.placeholder = 'elliefeng@ellieOS:~$ ';
        input.style.marginTop = '8px';
        
        contentDiv.appendChild(input);
        input.focus();

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const command = input.value.trim();
                this.executeTerminalCommand(command, terminalEl, input);
            }
        });
    }

    executeTerminalCommand(command, terminalEl, inputEl) {
        const output = document.createElement('div');
        output.style.marginTop = '12px';

        const commandLine = document.createElement('div');
        commandLine.style.color = 'var(--highlight-blue)';
        commandLine.style.marginBottom = '8px';
        commandLine.textContent = `elliefeng@ellieOS:~$ ${inputEl.value}`;
        output.appendChild(commandLine);

        const result = document.createElement('div');
        result.style.color = 'var(--gray-darkest)';
        result.style.whiteSpace = 'pre-wrap';
        result.style.fontFamily = "'Courier New', monospace";
        result.style.fontSize = '12px';

        const commands = {
            'help': `Available commands:
  pwd              - Print working directory
  ls               - List directory contents
  whoami           - Display user information
  neofetch         - Display system information
  clear            - Clear the terminal
  help             - Show this help message`,
            'pwd': '/home/elliefeng',
            'ls': `blog/
projects/
contact.txt
resume.pdf
dotfiles/`,
            'whoami': `elliefeng
Location: Melbourne, VIC, AU
Status: UX Designer & Creative Coder
Interests: Ricing, F1, Keyboards, Design`,
            'neofetch': this.getNeoFetchOutput(),
            'clear': 'CLEAR_TERMINAL'
        };

        if (commands.hasOwnProperty(command.toLowerCase())) {
            const cmd = command.toLowerCase();
            if (cmd === 'clear') {
                terminalEl.innerHTML = '';
                inputEl.value = '';
                inputEl.focus();
                return;
            }
            result.textContent = commands[cmd];
        } else if (command === '') {
            // Empty command
        } else {
            result.textContent = `command not found: ${command}`;
            result.style.color = 'var(--highlight-purple)';
        }

        if (command !== '') {
            output.appendChild(result);
            terminalEl.appendChild(output);
        }

        inputEl.value = '';
        inputEl.focus();
        
        terminalEl.parentElement.scrollTop = terminalEl.parentElement.scrollHeight;
    }

    getNeoFetchOutput() {
        return `                    'c.          elliefeng@Ellies-MacBook-Pro.local
                 ,xNMM.          ----------------------------------
               .OMMMMo           OS: macOS 26.1 25B78 arm64
               OMMM0,            Kernel: 25.1.0
     .;loddo:' loolloddol;.      Uptime: 7 hours, 21 mins
   cKMMMMMMMMMMNWMMMMMMMMMM0:    Packages: 269 (brew)
 .KMMMMMMMMMMMMMMMMMMMMMMMWd.    Shell: zsh 5.9
 XMMMMMMMMMMMMMMMMMMMMMMMX.      WM: Quartz Compositor
;MMMMMMMMMMMMMMMMMMMMMMMM:       CPU: Apple M1 Pro
:MMMMMMMMMMMMMMMMMMMMMMMM:       GPU: Apple M1 Pro
.MMMMMMMMMMMMMMMMMMMMMMMMX.      Song: Olivia Marsh - Too Good to be Bad
 kMMMMMMMMMMMMMMMMMMMMMMMMWd.    Music Player: Spotify
 .XMMMMMMMMMMMMMMMMMMMMMMMMMMk
  .XMMMMMMMMMMMMMMMMMMMMMMMMK.
    kMMMMMMMMMMMMMMMMMMMMMMd
     ;KMMMMMMMWXXWMMMMMMMk.
       .cooc,.    .,coo:.`;
    }

    initializePageScripts(page, contentDiv) {
        // Page-specific initialization
    }

    startDrag(e, windowEl) {
        if (e.target.closest('.window-controls')) return;
        
        this.focusWindow(windowEl);
        this.draggedWindow = windowEl;
        const rect = windowEl.getBoundingClientRect();
        this.dragOffset.x = e.clientX - rect.left;
        this.dragOffset.y = e.clientY - rect.top;

        const handleMouseMove = (e) => this.drag(e, windowEl);
        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            this.stopDrag();
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }

    drag(e, windowEl) {
        if (!this.draggedWindow || this.draggedWindow !== windowEl) return;
        windowEl.style.left = (e.clientX - this.dragOffset.x) + 'px';
        windowEl.style.top = (e.clientY - this.dragOffset.y) + 'px';
    }

    stopDrag() {
        this.draggedWindow = null;
    }

    focusWindow(windowEl) {
        if (this.focusedWindow) {
            this.focusedWindow.classList.remove('focused');
        }
        windowEl.classList.add('focused');
        windowEl.style.zIndex = this.windowZIndex++;
        this.focusedWindow = windowEl;
    }

    closeWindow(windowEl) {
        const index = this.windows.findIndex(w => w.element === windowEl);
        if (index > -1) {
            this.windows.splice(index, 1);
        }
        windowEl.remove();
        if (this.focusedWindow === windowEl) {
            this.focusedWindow = null;
        }
    }

    minimizeWindow(windowEl) {
        windowEl.style.display = 'none';
    }

    maximizeWindow(windowEl) {
        if (windowEl.classList.contains('maximized')) {
            windowEl.classList.remove('maximized');
            windowEl.style.left = windowEl.dataset.prevLeft;
            windowEl.style.top = windowEl.dataset.prevTop;
            windowEl.style.width = windowEl.dataset.prevWidth;
            windowEl.style.height = windowEl.dataset.prevHeight;
        } else {
            windowEl.dataset.prevLeft = windowEl.style.left;
            windowEl.dataset.prevTop = windowEl.style.top;
            windowEl.dataset.prevWidth = windowEl.style.width;
            windowEl.dataset.prevHeight = windowEl.style.height;
            windowEl.classList.add('maximized');
            windowEl.style.left = '0';
            windowEl.style.top = '0';
            windowEl.style.width = '100%';
            windowEl.style.height = 'calc(100vh - 28px)';
        }
    }

    // Case study functions
    openCaseStudy(studyId) {
        const projectsWindow = this.windows.find(w => w.page === 'projects');
        if (projectsWindow) {
            const contentDiv = projectsWindow.element.querySelector('.window-content');
            
            if (!projectsWindow.element.navHistory) {
                projectsWindow.element.navHistory = ['projects'];
            } else {
                projectsWindow.element.navHistory.push('projects');
            }
            
            fetch(`html/${studyId}.html`)
                .then(response => response.text())
                .then(html => {
                    contentDiv.innerHTML = html;
                    projectsWindow.element.currentPage = studyId;
                })
                .catch(err => {
                    console.error('Error loading case study:', err);
                });
        }
    }

    // Blog post functions
    openBlogPost(postId) {
        const blogWindow = this.windows.find(w => w.page === 'blog');
        if (blogWindow) {
            const contentDiv = blogWindow.element.querySelector('.window-content');
            
            if (!blogWindow.element.navHistory) {
                blogWindow.element.navHistory = ['blog'];
            } else {
                blogWindow.element.navHistory.push('blog');
            }
            
            const postHTML = this.getBlogPostHTML(postId);
            contentDiv.innerHTML = postHTML;
            blogWindow.element.currentPage = `blog-${postId}`;
        }
    }

    getBlogPostHTML(postId) {
        if (postId === 'dumbphone') {
            return `
                <div class="ie-toolbar">
                    <div class="toolbar-buttons">
                        <button class="ie-btn" onclick="navigateBackBlog()">← Back</button>
                        <button class="ie-btn disabled">Forward →</button>
                        <button class="ie-btn disabled">Stop</button>
                        <button class="ie-btn disabled">Refresh</button>
                        <button class="ie-btn disabled">Home</button>
                    </div>
                    <div class="address-bar">
                        <span class="address-label">Address:</span>
                        <input type="text" value="ellieOS://blog/dumbphone" readonly>
                    </div>
                </div>
                <div class="blog-post-container" style="padding: 24px; font-size: 16px; line-height: 1.8;">
                    <h1 style="color: var(--highlight-blue); margin-bottom: 8px; font-size: 28px;">today i realised that my dumbphone did NOT cure my smartphone addiction</h1>
                    <p style="color: var(--gray-dark); font-size: 15px; margin-bottom: 20px;">by ellie | 21.11.24</p>
                    <p style="margin-bottom: 16px;">Full blog content here...</p>
                </div>
            `;
        }
        return '<p>Post not found.</p>';
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    const ellieOS = new EllieOS();
    
    // Make functions globally accessible
    window.openBlogPost = (postId) => ellieOS.openBlogPost(postId);
    window.openCaseStudy = (studyId) => ellieOS.openCaseStudy(studyId);
    
    // Global navigation functions
    window.navigateBack = () => {
        const projectsWindow = ellieOS.windows.find(w => w.page === 'projects');
        if (projectsWindow && projectsWindow.element.navHistory && projectsWindow.element.navHistory.length > 0) {
            const previousPage = projectsWindow.element.navHistory.pop();
            const contentDiv = projectsWindow.element.querySelector('.window-content');
            fetch(`html/${previousPage}.html`)
                .then(response => response.text())
                .then(html => {
                    contentDiv.innerHTML = html;
                    projectsWindow.element.currentPage = previousPage;
                });
        }
    };
    
    window.navigateBackBlog = () => {
        const blogWindow = ellieOS.windows.find(w => w.page === 'blog');
        if (blogWindow && blogWindow.element.navHistory && blogWindow.element.navHistory.length > 0) {
            const previousPage = blogWindow.element.navHistory.pop();
            const contentDiv = blogWindow.element.querySelector('.window-content');
            fetch(`html/${previousPage}.html`)
                .then(response => response.text())
                .then(html => {
                    contentDiv.innerHTML = html;
                    blogWindow.element.currentPage = previousPage;
                });
        }
    };
});
