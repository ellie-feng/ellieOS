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
                const existingWindow = this.windows.find(w => w.page === page);
                if (existingWindow) {
                    this.focusWindow(existingWindow.element);
                    existingWindow.element.style.display = 'flex';
                    this.setActiveTaskbarItem(page);
                    return;
                }
                const config = this.getWindowConfig(page);
                this.openWindow(page, this.getTitleForPage(page), config);
                this.setActiveTaskbarItem(page);
            });
        });
    }

    getWindowConfig(page) {
        const configs = {
            'index': { width: 0.5, height: 0.5 },
            'projects': { width: 0.8, height: 0.8 },
            'blog': { width: 0.8, height: 0.8 },
            'contact': { width: 0.25, height: 0.35 },
            'resume': { width: 0.8, height: 0.85 }
        };
        return configs[page] || { width: 0.8, height: 0.8 };
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
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.openResume();
            });
        }
    }

    openResume() {
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
        if (!template) {
            console.error('Window template not found');
            return;
        }
        
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
                .then(response => {
                    if (!response.ok) throw new Error('Failed to load page');
                    return response.text();
                })
                .then(html => {
                    contentDiv.innerHTML = html;
                })
                .catch(err => {
                    console.error('Error loading page:', err);
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

    setupInteractiveTerminal(terminalEl, contentDiv) {
        const inputContainer = document.createElement('div');
        inputContainer.style.display = 'flex';
        inputContainer.style.alignItems = 'center';
        inputContainer.style.marginTop = '8px';
        
        const prompt = document.createElement('span');
        prompt.textContent = 'user@ellieOS:~$ ';
        prompt.style.color = 'var(--highlight-blue)';
        prompt.style.fontFamily = "'Courier New', monospace";
        prompt.style.fontSize = '15px';
        prompt.style.whiteSpace = 'pre';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.style.border = 'none';
        input.style.background = 'transparent';
        input.style.outline = 'none';
        input.style.flex = '1';
        input.style.color = 'var(--highlight-purple)';
        input.style.fontFamily = "'Courier New', monospace";
        input.style.fontSize = '15px';
        input.style.padding = '0';
        
        inputContainer.appendChild(prompt);
        inputContainer.appendChild(input);
        contentDiv.appendChild(inputContainer);
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
        commandLine.textContent = `user@ellieOS:~$ ${inputEl.value}`;
        output.appendChild(commandLine);

        const result = document.createElement('div');
        result.style.color = 'var(--gray-darkest)';
        result.style.whiteSpace = 'pre-wrap';
        result.style.fontFamily = "'Courier New', monospace";
        result.style.fontSize = '15px';

        const commands = {
            'help': `Available commands:
  pwd       - Print working directory
  ls        - List directory contents
  whoami    - Display user information
  neofetch  - Display system information
  clear     - Clear the terminal
  help      - Show this help message`,
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

    openBlogPost(postId) {
        const blogWindow = this.windows.find(w => w.page === 'blog');
        if (blogWindow) {
            const contentDiv = blogWindow.element.querySelector('.window-content');
            
            if (!blogWindow.element.navHistory) {
                blogWindow.element.navHistory = ['blog'];
            } else {
                blogWindow.element.navHistory.push('blog');
            }
            
            // Fetch the actual blog post HTML file
            fetch(`html/${postId}.html`)
                .then(response => {
                    if (!response.ok) throw new Error('Failed to load blog post');
                    return response.text();
                })
                .then(html => {
                    // Extract only the content inside the blog-page div, excluding the outer HTML structure
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const blogContent = doc.querySelector('.blog-page');
                    
                    if (blogContent) {
                        contentDiv.innerHTML = blogContent.innerHTML;
                        // Update the back button to work with navigateBackBlog
                        const backBtn = contentDiv.querySelector('.ie-toolbar .ie-btn');
                        if (backBtn && backBtn.textContent.includes('Back')) {
                            backBtn.setAttribute('onclick', '');
                            backBtn.addEventListener('click', () => {
                                window.navigateBackBlog();
                            });
                        }
                    } else {
                        // Fallback: use the entire body content
                        const bodyContent = doc.body.innerHTML;
                        contentDiv.innerHTML = bodyContent;
                    }
                    
                    blogWindow.element.currentPage = `blog-${postId}`;
                })
                .catch(err => {
                    console.error('Error loading blog post:', err);
                    contentDiv.innerHTML = `<p>Error loading blog post: ${err.message}</p>`;
                });
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing ellieOS...');
    const ellieOS = new EllieOS();
    
    window.openBlogPost = (postId) => {
        console.log('Opening blog post:', postId);
        ellieOS.openBlogPost(postId);
    };
    
    window.openCaseStudy = (studyId) => {
        console.log('Opening case study:', studyId);
        ellieOS.openCaseStudy(studyId);
    };
    
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
    
    console.log('ellieOS initialized successfully');
});
