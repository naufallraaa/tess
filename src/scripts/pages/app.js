import { getActiveRoute } from '../routes/url-parser';
import {
  generateAuthenticatedNavigationListTemplate,
  generateMainNavigationListTemplate,
  generateUnauthenticatedNavigationListTemplate,
} from '../templates';
import { transitionHelper } from '../utils';
import { getAccessToken, getLogout } from '../utils/auth';
import { routes } from '../routes/routes';

export default class App {
  #content;
  #drawerButton;
  #drawerNavigation;
  currentUrl;

  constructor({ content, drawerNavigation, drawerButton }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#drawerNavigation = drawerNavigation;

    this.#init();
  }

  #init() {
    this.#setupDrawer();
    this.#setupBrandLink();
    this.#setupSkipLink();
  }

  // Drawer toggle setup
  #setupDrawer() {
    this.#drawerButton.addEventListener('click', () => {
      this.#drawerNavigation.classList.toggle('open');
    });

    document.body.addEventListener('click', (event) => {
      const isTargetInsideDrawer = this.#drawerNavigation.contains(event.target);
      const isTargetInsideButton = this.#drawerButton.contains(event.target);

      if (!(isTargetInsideDrawer || isTargetInsideButton)) {
        this.#drawerNavigation.classList.remove('open');
      }

      this.#drawerNavigation.querySelectorAll('a').forEach((link) => {
        if (link.contains(event.target)) {
          this.#drawerNavigation.classList.remove('open');
        }
      });
    });
  }

  // Setup the brand link to navigate based on user authentication state
  #setupBrandLink() {
    const brandLink = document.querySelector('.brand-name');
    if (brandLink) {
      brandLink.addEventListener('click', (event) => {
        event.preventDefault();
        const isLogin = !!getAccessToken();
        location.hash = isLogin ? '/home' : '/';
      });
    }
  }

  // Setup skip link to navigate to main content
  #setupSkipLink() {
    const skipLink = document.getElementById('skip-link');
    const mainContent = document.getElementById('main-content');

    if (skipLink && mainContent) {
      skipLink.addEventListener('click', (event) => {
        event.preventDefault();
        skipLink.blur();

        mainContent.focus();
        mainContent.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }

  // Set up the navigation list based on login state
  #setupNavigationList() {
    const isLogin = !!getAccessToken();
    const navListMain = this.#drawerNavigation.querySelector('#navlist-main');
    const navList = this.#drawerNavigation.querySelector('#navlist');

    if (!navListMain || !navList) return; // Check if nav lists exist

    if (!isLogin) {
      navListMain.innerHTML = '';
      navList.innerHTML = generateUnauthenticatedNavigationListTemplate();
    } else {
      navListMain.innerHTML = generateMainNavigationListTemplate();
      navList.innerHTML = generateAuthenticatedNavigationListTemplate();
    }

    // Add logout functionality if button exists
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
      logoutButton.addEventListener('click', (event) => {
        event.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
          getLogout();
          location.hash = '/login';
        }
      });
    }
  }

  // Render the page based on the active route
  async renderPage() {
    const url = getActiveRoute();
    const prevUrl = this.currentUrl || '/';
    this.currentUrl = url;

    // Check if route exists
    const route = routes[url] || routes['404'];
    const page = route();

    // Determine the transition type based on navigation
    let transitionType = 'default';

    // Detect forward and backward navigation
    if (url === '/' && prevUrl !== '/') {
      transitionType = 'backward';
    } else if (url.includes('/stories/') && !prevUrl.includes('/stories/')) {
      transitionType = 'detail';
    } else if (prevUrl.includes('/stories/') && !url.includes('/stories/')) {
      transitionType = 'exit-detail';
    } else if (url !== prevUrl) {
      transitionType = 'forward';
    }

    // Handle transition and page rendering
    const transition = transitionHelper({
      updateDOM: async () => {
        this.#content.innerHTML = await page.render();
        page.afterRender();
      },
      transitionType: transitionType,
    });

    transition.ready.catch(console.error);
    transition.updateCallbackDone.then(() => {
      scrollTo({ top: 0, behavior: 'instant' });
      this.#setupNavigationList();
    });
  }
}
