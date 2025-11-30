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
        input.className = 'terminal-input';
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
                <div class="blog-post-container" style="padding: 24px; font-size: 16px; line-height: 1.8; overflow-y: auto;">
                    <h1 style="color: var(--highlight-blue); margin-bottom: 8px; font-size: 28px;">today i realised that my dumbphone did NOT cure my smartphone addiction</h1>
                    <p style="color: var(--gray-dark); font-size: 15px; margin-bottom: 20px;">by ellie | 21.11.24</p>
                    
                    <h3 style="color: var(--highlight-blue); margin-top: 20px; margin-bottom: 10px; font-size: 20px;">acknowledging the problem</h3>
                    <p style="margin-bottom: 16px;">
                    I would highly recommend you read through the whole entry before making your opinion.<br><br>
                    I was introduced to James Scholz's youtube channel a while ago, and one of the first videos I ever watched was him explaining why he does what he does: studying for 12 hours a day. 
                    In this <a href="https://www.youtube.com/watch?v=5XA67ur9wm8&t=553s" style="color: var(--highlight-blue);">video</a>, he recommended a book called 'Digital Minimalism' by Cal Newport. 
                    At that point, I kinda already knew what I was going to read about; how our phones are sucking us into a state of mindlessness. right? almost! 
                    I took this book with me when my family took a day trip to the beach, and left my phone at home. This day started my digital minimalism journey.
                    This was my first self-help book too, I have since read many and I believe these books aren't made for you to learn anything (at least not in abundance) but instead, they serve as a rather aggressive reminder (or a wake-up call with this book particularly) of just how far we've fallen. I hope this entry wakes you up in the same fashion this book did.
                    I am writing this diary entry in a cafe, surrounded by families with children who are glued to their ipads like there is no tomorrow. Next to them, I saw the adults doing the exact same thing.
                    I do get upset when I see this, but I've seen this scene so many times that it's almost normalised even if I'm observing.
                    <br><br>
                    Growing up, I was taught that people who didn't have any self-control, no self-governance were people who drank and smoked the day away. But these days, it's hard to ignore how that's almost everyone around us. We have become the people who scroll our day away.
                    Quite frankly, we all are going through a behavioural addiction epidemic with our devices. According to <a href="https://duckduckgo.com/?t=ffab&q=behavioural+addiction&ia=web" target="_blank" style="color: var(--highlight-blue);">PubMed</a>, behavioural addiction is a form of addiction that involves a compulsion to engage in a rewarding non-substance-related behavior sometimes called a natural reward 
                    despite any negative consequences to the person's physical, mental, social or financial well-being. 
                    It may seem harsh to call it an addiction because we associate addiction with beverages that burn our livers and sticks of herbs that claw at our lungs, but is it not addiction when we reach for these rectangles of glowing light when we feel bored, sad, agitated, self-conscious or anxious?
                    Is it not addiction when we open instagram, on the edge of our seat gambling whether anyone has texted us in the past five seconds when we last checked?
                    Once we ask ourselves these questions, it becomes clear that this behaviour is not normal. We are reaching for our phones as a coping mechanism and numbing our minds with a never-ending stream of content (as in mindless content that we gain no knowledge of) from all these apps. We fall into a state of mindlessness, and this state is the most dangerous. 
                    We have become so used to being pulled along this stream of content that our brains don't know how to be bored anymore. In other words, everytime we consume content, our brains release dopamine. Dopamine is a hormone that is associated with pleasure and reward, but there must be a balance.
                    And if we consistently consume content and keep producing dopamine, there is an imbalance; too much dopamine. This can affect things such as our attention span and our mental health, and as a student, those two things are some of the most important things to regulate to avoid burnout. 
                    Our brains have now been accustomed to always being dopamine-induced that it's not used to being 'bored' or 'empty'. 
                    This can lead to feeling even more anxious, not being able to focus on the task at hand and constantly feeling overwhelmed.
                    <br><br>
                    Newport's book advocates the reader to take smaller actions to make a big impact in their technology use. I am no way saying that technology is bad, I love technology and the way it brings people together. However, we need to use it with absolute intention. I am not going on youtube to waste an hour
                    watching videos about things that don't benefit me in any way, I'm going to spend the hour watching crochet tutorials so I can start my new hobby. See the difference there? That's the main principle of digital minimalism, it's not hating technology, it's using technology with intention. 
                    Much like a military mission, you go in, do your thing and immediately after, you're out of there. Screen time is used as a metric in this space to measure your addiction. Simply put, the higher your screen time, the more addicted you are. In most cases this is true, but for the exceptions where people 
                    use their phones for work, a higher screen time is valid. My screen time before was an average of three to four hours, with my most used apps being instagram and safari. My screen time now is around 30 minutes a day.
                    </p>
                    
                    <h3 style="color: var(--highlight-blue); margin-top: 20px; margin-bottom: 10px; font-size: 20px;">solution 1: the 'dumb' smartphone</h3>
                    <p style="margin-bottom: 16px;">
                    I started with dumbing down my iphone using an app called the 'Smile App Launcher'. This is a launcher similar to Unlauncher in Android. 
                    I deleted all my social media, games and miscellaneous apps. I knew that this journey wasn't going to be easy but I was committed to making a change.
                    I dug out my kindle voyage (which hadn't seen the light of day for almost 5 years) and used Calibre to download books onto it. I made it my goal (if I got a seat on the train) to read on the way to uni.
                    I also created a list of hobbies I wanted to do incase I found myself doom-scrolling again.
                    And that's just what happened. I still found myself swiping to the right, opening up safari and accessing the website versions of the apps I downloaded. In other words, my brain was still craving those hits of dopamine just as much as the next person.
                    I quickly fell back into old habits, I was constantly feeling anxious and overwhelmed. What I was going through was withdrawal and is normal when you are cutting off something your brain is so used to receiving on the daily. 
                    Despite this, the issue persisted and I struggled a lot with my self-control. My lack of self-control can be blamed but I believe that it's not the sole reason.
                    These technology companies are heavily incentivised to make us spend as much time as possible on these apps, because more of our time and attention means we see and watch more ads, which makes them more money. 
                    By putting the whole blame on our self-control ignores the multi-billion dollar industry enabling it in the first place.
                    </p>
                    
                    <p style="text-align: center; margin: 20px 0; font-weight: bold; font-size: 16px;">
                    I had no option but to legitimately go cold-turkey.
                    </p>
                    
                    <h3 style="color: var(--highlight-blue); margin-top: 20px; margin-bottom: 10px; font-size: 20px;">solution 2: the dumbphone</h3>
                    <p style="margin-bottom: 16px;">
                    Not long later, I slid down the dumbphone rabbithole (mainly r/dumbphones), a community of people united together by their distaste for what our state of normalcy has become for our technology use. And after thorough research, I bought myself my first ever dumbphone.
                    </p>
                    
                    <div style="text-align: center; margin: 20px 0;">
                        <img src="media/nokia_3210_4g.jpeg" alt="nokia 3210 4g" style="max-width: 300px; height: auto; border: 2px solid var(--gray-medium);">
                        <p style="font-size: 15px; color: var(--gray-dark); margin-top: 8px;">nokia 3210 4g (grunge black) playing 'Hocus Pocus' by Loossemble</p>
                    </div>
                    
                    <p style="margin-bottom: 16px;">
                    I used this dumbphone for the majority of two weeks. I took it to uni, work and outings with friends and family. Initially, I still found myself reaching for it any chance I could, but was quickly reminded that the 
                    most stimulating thing this phone could do was play music and the never-ending game of snake (which was not doable due to its horrendous screen). After around three days, I found myself in a state of peace. Everything about
                    this phone was intentional. Messaging was so slow that I had to make my messages as concise as possible which in turn, made me really think about what I had to say. I no longer had a library of tens of millions of songs
                    at my fingertips. Instead, at the beginning of every week, downloaded songs onto this phone from my macbook via cable which I had accumulated over the past few days. I found myself being more content with the music I was listening to.
                    I found myself getting more engrossed with the content I was studying, asking questions and getting help with questions felt rewarding and reading was my new favourite pastime. 
                    <br><br>
                    However, not all of this was sunshine and rainbows. Yes, at this point, my phone usage was very much non-existent. However, I found myself moving my scrolling to my other devices such as my macbook and ipad. 
                    To combat this, I installed leech-block and blocked pretty much all distracting sites but it was pretty easy to bypass and I ended up leaving a lot of these sites unblocked. 
                    <br><br>
                    This reminded me that this is a LIFESTYLE CHANGE. Just because I switched to a dumbphone didn't suddenly mean I was less addicted, I had to literally retrain my brain to undo all the bad habits it had made on the way.
                    I can try all the dumbphones in the world and still be as addicted as when I first started. To make this big of a change takes great amounts of self-discipline and resilience, things that can be nurtured
                    through pushing yourself and not giving up.
                    </p>

                    <h3 style="color: var(--highlight-blue); margin-top: 20px; margin-bottom: 10px; font-size: 20px;">solution 3: the de-centralised approach (and my current edc)</h3>
                    <p style="margin-bottom: 16px;">
                    After reflecting with my time with the 3210 4g, I thought it was time to revisit my approach with my smartphone. My only intentions with my smartphone was to message and call. That's it.
                    I wanted to make an edc (stands for everyday carry which usually refers to what people carry around in their pockets and bags, think essentials), that would take up features that I didn't use on my smartphone e.g. camera and music.
                    By having these single-purpose devices, I found myself reaching for my phone less and less. For music, I am using my nokia 3210 which is convenient because it had a headphone jack and bluetooth capabilities.
                    For my camera, I am using my trusty Canon Powershot A520 from 2005. The photos have a dreamy look to them and I enjoy taking photos with this almost twenty year old camera more than my phone. My smartphone is still the 
                    iPhone 14 Pro I had before, if I had a choice I would buy a mini phone/se if they still made the mini phones. My ereader of choice used to be the Kindle Voyage from ten years ago, but I have since upgraded
                    to the Kobo Libra Colour and have absolutely no regrets.
                    </p>
                    
                    <div style="text-align: center; margin: 20px 0;">
                        <img src="media/edc.jpeg" alt="everyday carry" style="max-width: 400px; height: auto; border: 2px solid var(--gray-medium);">
                        <p style="font-size: 15px; color: var(--gray-dark); margin-top: 8px;">canon powershot a520 (2005), airpods 3, nokia 3210 4g (grunge black), apple watch se 1st gen, iphone 14 pro, kobo libra colour (white)</p>
                    </div>

                    <h3 style="color: var(--highlight-blue); margin-top: 20px; margin-bottom: 10px; font-size: 20px;">you don't need a dumbphone to be a digital minimalist</h3>
                    <p style="margin-bottom: 16px;">
                    Here are some steps you can take right now with your smartphone to lower your screentime:<br><br>
                    1. delete all your apps except for calls and messages<br>
                    2. turn off all your notifications (only exceptions would be calls and messages from immediate family/roommates, friends not included)<br>
                    3. turn your phone to greyscale mode. studies have shown that putting your phone in greyscale mode makes your device less enticing to scroll on.<br>
                    4. experiment with analogue methods of things you would've done on your phone e.g. calendar, todo lists, journalling
                    </p>

                    <h3 style="color: var(--highlight-blue); margin-top: 20px; margin-bottom: 10px; font-size: 20px;">reflection</h3>
                    <p style="margin-bottom: 16px;">
                    I hope this entry has prompted you to reflect and question yourself about your habits. Always remember resilience over resistance!
                    </p>
                    <p style="text-align: right; font-style: italic; margin-top: 20px; margin-bottom: 40px; font-size: 16px;">-ellie 21.11.24</p>
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
