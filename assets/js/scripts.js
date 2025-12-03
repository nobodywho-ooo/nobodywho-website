// Sticky menu for Reveral theme — responsive + delay + immediate reveal fallback
(function () {
  "use strict";

  const CONFIG = {
    headerId: "js-header",
    menuId: "js-navbar-menu",
    hiddenClass: "is-hidden",
    visibleClass: "is-visible",
    stickyClass: "is-sticky",
    scrollThreshold: 10,    // Min scroll delta to trigger actions
    delayThreshold: 60,     // Scroll delta below this (on scroll-up) triggers delayed reveal
    revealDelay: 200,       // Delay in ms for slow scroll-up reveal
    topOffset: 5,           // Offset from top to consider "at the top" (allows for slight scroll)
  };

  const header = document.getElementById(CONFIG.headerId);
  const stickyMenu = document.getElementById(CONFIG.menuId); // Optional

  if (!header) {
    console.warn(`Sticky menu: Header element with ID "${CONFIG.headerId}" not found. Script will not run.`);
    return;
  }

  let lastScrollY = window.scrollY;
  let isTicking = false;
  let navbarHeight = header.offsetHeight;
  let revealTimeout = null;

  function clearRevealTimeout() {
    if (revealTimeout) {
      clearTimeout(revealTimeout);
      revealTimeout = null;
    }
  }

  function showHeader() {
    header.classList.remove(CONFIG.hiddenClass);
    header.classList.add(CONFIG.visibleClass);
    if (stickyMenu) {
      stickyMenu.classList.add(CONFIG.stickyClass);
    }
  }

  function hideHeader() {
    header.classList.remove(CONFIG.visibleClass);
    header.classList.add(CONFIG.hiddenClass);
    // Note: We don't remove stickyClass from stickyMenu here,
    // as it's tied to the header's visibility state.
    // It's removed when resetting to top or if header becomes non-sticky.
    clearRevealTimeout(); // Important: if we start hiding, cancel any pending reveal
  }

  function resetToTopState() {
    header.classList.remove(CONFIG.hiddenClass, CONFIG.visibleClass);
    if (stickyMenu) {
      stickyMenu.classList.remove(CONFIG.stickyClass);
    }
    clearRevealTimeout();
  }

  function updateStickyState() {
    const currentScrollY = window.scrollY;
    const scrollDelta = currentScrollY - lastScrollY;

    // 1. At the very top of the page: Reset to default state
    if (currentScrollY <= CONFIG.topOffset) {
      resetToTopState();
      lastScrollY = Math.max(0, currentScrollY); // Ensure lastScrollY isn't negative
      isTicking = false;
      return;
    }

    // 2. Ignore small scroll movements if not at the top
    // (This check is after "at top" because we always want to reset at the top)
    if (Math.abs(scrollDelta) < CONFIG.scrollThreshold) {
      isTicking = false;
      return;
    }

    // 3. Scrolled down: Hide header
    // Only hide if past the navbar height and not already hidden
    if (scrollDelta > 0 && currentScrollY > navbarHeight) {
      if (!header.classList.contains(CONFIG.hiddenClass)) {
        hideHeader();
      }
    }
    // 4. Scrolled up: Show header (conditionally delayed)
    // Only show if header was previously hidden
    else if (scrollDelta < 0 && header.classList.contains(CONFIG.hiddenClass)) {
      clearRevealTimeout(); // Clear any previous timeout (e.g., from a slower scroll up)

      // Small scroll up (delta is negative) -> delay reveal
      if (Math.abs(scrollDelta) < CONFIG.delayThreshold) {
        revealTimeout = setTimeout(showHeader, CONFIG.revealDelay);
      } else {
        // Fast scroll up -> show immediately
        showHeader();
      }
    }

    lastScrollY = Math.max(0, currentScrollY);
    isTicking = false;
  }

  function onScroll() {
    if (!isTicking) {
      window.requestAnimationFrame(updateStickyState);
      isTicking = true;
    }
  }

  function onResize() {
    navbarHeight = header.offsetHeight;
    // Optionally, re-evaluate sticky state on resize if layout changes significantly
    // requestAnimationFrame(updateStickyState); // Uncomment if needed
  }

  // Initial state setup if not at the top (e.g. page reloaded mid-scroll)
  // This ensures the correct state is applied on load.
  if (window.scrollY > CONFIG.topOffset) {
    // If scrolled past navbar, assume it should initially be hidden,
    // then let scroll handler correct if user scrolls up.
    if (window.scrollY > navbarHeight) {
      header.classList.add(CONFIG.hiddenClass);
    }
  } else {
    resetToTopState(); // Ensure clean state if at top
  }
  lastScrollY = window.scrollY; // Initialize lastScrollY correctly


  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });

})();


// Dropdown menu
(function (menuConfig) {
  /**
   * Merge default config with the theme overrided ones
   */
  var defaultConfig = {
    // behaviour
    mobileMenuMode: 'sidebar', // 'overlay' or 'sidebar'
    animationSpeed: 300,
    submenuWidth: 300,
    doubleClickTime: 500,
    mobileMenuExpandableSubmenus: true,
    isHoverMenu: true,
    // selectors
    wrapperSelector: '.navbar',
    buttonSelector: '.navbar__toggle',
    menuSelector: '.navbar__menu',
    submenuSelector: '.navbar__submenu',
    mobileMenuSidebarLogoSelector: null,
    mobileMenuSidebarLogoUrl: null,
    relatedContainerForOverlayMenuSelector: null,
    // attributes 
    ariaButtonAttribute: 'aria-haspopup',
    // CSS classes
    separatorItemClass: 'is-separator',
    parentItemClass: 'has-submenu',
    submenuLeftPositionClass: 'is-left-submenu',
    submenuRightPositionClass: 'is-right-submenu',
    mobileMenuOverlayClass: 'navbar_mobile_overlay',
    mobileMenuSubmenuWrapperClass: 'navbar__submenu_wrapper',
    mobileMenuSidebarClass: 'navbar_mobile_sidebar',
    mobileMenuSidebarOverlayClass: 'navbar_mobile_sidebar__overlay',
    hiddenElementClass: 'is-hidden',
    openedMenuClass: 'is-active',
    noScrollClass: 'no-scroll',
    relatedContainerForOverlayMenuClass: 'is-visible'
  };

  var config = {};

  Object.keys(defaultConfig).forEach(function (key) {
    config[key] = defaultConfig[key];
  });

  if (typeof menuConfig === 'object') {
    Object.keys(menuConfig).forEach(function (key) {
      config[key] = menuConfig[key];
    });
  }

  /**
   * Menu initializer
   */
  function init() {
    if (!document.querySelectorAll(config.wrapperSelector).length) {
      return;
    }

    initSubmenuPositions();

    if (config.mobileMenuMode === 'overlay') {
      initMobileMenuOverlay();
    } else if (config.mobileMenuMode === 'sidebar') {
      initMobileMenuSidebar();
    }

    initClosingMenuOnClickLink();

    if (!config.isHoverMenu) {
      initAriaAttributes();
    }
  };

  /**
   * Function responsible for the submenu positions
   */
  function initSubmenuPositions() {
    var submenuParents = document.querySelectorAll(config.wrapperSelector + ' .' + config.parentItemClass);

    for (var i = 0; i < submenuParents.length; i++) {
      var eventTrigger = config.isHoverMenu ? 'mouseenter' : 'click';

      submenuParents[i].addEventListener(eventTrigger, function () {
        var submenu = this.querySelector(config.submenuSelector);
        var itemPosition = this.getBoundingClientRect().left;
        var widthMultiplier = 2;

        if (this.parentNode === document.querySelector(config.menuSelector)) {
          widthMultiplier = 1;
        }

        if (config.submenuWidth !== 'auto') {
          var submenuPotentialPosition = itemPosition + (config.submenuWidth * widthMultiplier);

          if (window.innerWidth < submenuPotentialPosition) {
            submenu.classList.remove(config.submenuLeftPositionClass);
            submenu.classList.add(config.submenuRightPositionClass);
          } else {
            submenu.classList.remove(config.submenuRightPositionClass);
            submenu.classList.add(config.submenuLeftPositionClass);
          }
        } else {
          var submenuPotentialPosition = 0;
          var submenuPosition = 0;

          if (widthMultiplier === 1) {
            submenuPotentialPosition = itemPosition + submenu.clientWidth;
          } else {
            submenuPotentialPosition = itemPosition + this.clientWidth + submenu.clientWidth;
          }

          if (window.innerWidth < submenuPotentialPosition) {
            submenu.classList.remove(config.submenuLeftPositionClass);
            submenu.classList.add(config.submenuRightPositionClass);
            submenuPosition = -1 * submenu.clientWidth;
            submenu.removeAttribute('style');

            if (widthMultiplier === 1) {
              submenuPosition = 0;
              submenu.style.right = submenuPosition + 'px';
            } else {
              submenu.style.right = this.clientWidth + 'px';
            }
          } else {
            submenu.classList.remove(config.submenuRightPositionClass);
            submenu.classList.add(config.submenuLeftPositionClass);
            submenuPosition = this.clientWidth;

            if (widthMultiplier === 1) {
              submenuPosition = 0;
            }

            submenu.removeAttribute('style');
            submenu.style.left = submenuPosition + 'px';
          }
        }

        submenu.setAttribute('aria-hidden', false);
      });

      if (config.isHoverMenu) {
        submenuParents[i].addEventListener('mouseleave', function () {
          var submenu = this.querySelector(config.submenuSelector);
          submenu.removeAttribute('style');
          submenu.setAttribute('aria-hidden', true);
        });
      }
    }
  }

  /**
   * Function used to init mobile menu - overlay mode
   */
  function initMobileMenuOverlay() {
    var menuWrapper = document.createElement('div');
    menuWrapper.classList.add(config.mobileMenuOverlayClass);
    menuWrapper.classList.add(config.hiddenElementClass);
    var menuContentHTML = document.querySelector(config.menuSelector).outerHTML;
    menuWrapper.innerHTML = menuContentHTML;
    document.body.appendChild(menuWrapper);

    // Init toggle submenus
    if (config.mobileMenuExpandableSubmenus) {
      wrapSubmenusIntoContainer(menuWrapper);
      initToggleSubmenu(menuWrapper);
    } else {
      setAriaForSubmenus(menuWrapper);
    }

    // Init button events
    var button = document.querySelector(config.buttonSelector);

    button.addEventListener('click', function () {
      var relatedContainer = document.querySelector(config.relatedContainerForOverlayMenuSelector);
      menuWrapper.classList.toggle(config.hiddenElementClass);
      button.classList.toggle(config.openedMenuClass);
      button.setAttribute(config.ariaButtonAttribute, button.classList.contains(config.openedMenuClass));

      if (button.classList.contains(config.openedMenuClass)) {
        document.documentElement.classList.add(config.noScrollClass);

        if (relatedContainer) {
          relatedContainer.classList.add(config.relatedContainerForOverlayMenuClass);
        }
      } else {
        document.documentElement.classList.remove(config.noScrollClass);

        if (relatedContainer) {
          relatedContainer.classList.remove(config.relatedContainerForOverlayMenuClass);
        }
      }
    });
  }

  /**
   * Function used to init mobile menu - sidebar mode
   */
  function initMobileMenuSidebar() {
    // Create menu structure
    var menuWrapper = document.createElement('div');
    menuWrapper.classList.add(config.mobileMenuSidebarClass);
    menuWrapper.classList.add(config.hiddenElementClass);
    var menuContentHTML = '';

    if (config.mobileMenuSidebarLogoSelector !== null) {
      menuContentHTML = document.querySelector(config.mobileMenuSidebarLogoSelector).outerHTML;
    } else if (config.mobileMenuSidebarLogoUrl !== null) {
      menuContentHTML = '<img src="' + config.mobileMenuSidebarLogoUrl + '" alt="" />';
    }

    menuContentHTML += document.querySelector(config.menuSelector).outerHTML;
    menuWrapper.innerHTML = menuContentHTML;

    var menuOverlay = document.createElement('div');
    menuOverlay.classList.add(config.mobileMenuSidebarOverlayClass);
    menuOverlay.classList.add(config.hiddenElementClass);

    document.body.appendChild(menuOverlay);
    document.body.appendChild(menuWrapper);

    // Init toggle submenus
    if (config.mobileMenuExpandableSubmenus) {
      wrapSubmenusIntoContainer(menuWrapper);
      initToggleSubmenu(menuWrapper);
    } else {
      setAriaForSubmenus(menuWrapper);
    }

    // Menu events
    menuWrapper.addEventListener('click', function (e) {
      e.stopPropagation();
    });

    menuOverlay.addEventListener('click', function () {
      menuWrapper.classList.add(config.hiddenElementClass);
      menuOverlay.classList.add(config.hiddenElementClass);
      button.classList.remove(config.openedMenuClass);
      button.setAttribute(config.ariaButtonAttribute, false);
      document.documentElement.classList.remove(config.noScrollClass);
    });

    // Init button events
    var button = document.querySelector(config.buttonSelector);

    button.addEventListener('click', function () {
      menuWrapper.classList.toggle(config.hiddenElementClass);
      menuOverlay.classList.toggle(config.hiddenElementClass);
      button.classList.toggle(config.openedMenuClass);
      button.setAttribute(config.ariaButtonAttribute, button.classList.contains(config.openedMenuClass));
      document.documentElement.classList.toggle(config.noScrollClass);
    });
  }

  /**
   * Set aria-hidden="false" for submenus
   */
  function setAriaForSubmenus(menuWrapper) {
    var submenus = menuWrapper.querySelectorAll(config.submenuSelector);

    for (var i = 0; i < submenus.length; i++) {
      submenus[i].setAttribute('aria-hidden', false);
    }
  }

  /**
   * Wrap all submenus into div wrappers
   */
  function wrapSubmenusIntoContainer(menuWrapper) {
    var submenus = menuWrapper.querySelectorAll(config.submenuSelector);

    for (var i = 0; i < submenus.length; i++) {
      var submenuWrapper = document.createElement('div');
      submenuWrapper.classList.add(config.mobileMenuSubmenuWrapperClass);
      submenus[i].parentNode.insertBefore(submenuWrapper, submenus[i]);
      submenuWrapper.appendChild(submenus[i]);
    }
  }

  /**
   * Initialize submenu toggle events
   */
  function initToggleSubmenu(menuWrapper) {
    // Init parent menu item events
    var parents = menuWrapper.querySelectorAll('.' + config.parentItemClass);

    for (var i = 0; i < parents.length; i++) {
      // Add toggle events
      parents[i].addEventListener('click', function (e) {
        e.stopPropagation();
        var submenu = this.querySelector('.' + config.mobileMenuSubmenuWrapperClass);
        var content = submenu.firstElementChild;

        if (submenu.classList.contains(config.openedMenuClass)) {
          var height = content.clientHeight;
          submenu.style.height = height + 'px';

          setTimeout(function () {
            submenu.style.height = '0px';
          }, 0);

          setTimeout(function () {
            submenu.removeAttribute('style');
            submenu.classList.remove(config.openedMenuClass);
          }, config.animationSpeed);

          content.setAttribute('aria-hidden', true);
          content.parentNode.firstElementChild.setAttribute('aria-expanded', false);
        } else {
          var height = content.clientHeight;
          submenu.classList.add(config.openedMenuClass);
          submenu.style.height = '0px';

          setTimeout(function () {
            submenu.style.height = height + 'px';
          }, 0);

          setTimeout(function () {
            submenu.removeAttribute('style');
          }, config.animationSpeed);

          content.setAttribute('aria-hidden', false);
          content.parentNode.firstElementChild.setAttribute('aria-expanded', true);
        }
      });

      // Block links
      var childNodes = parents[i].children;

      for (var j = 0; j < childNodes.length; j++) {
        if (childNodes[j].tagName === 'A') {
          childNodes[j].addEventListener('click', function (e) {
            var lastClick = parseInt(this.getAttribute('data-last-click'), 10);
            var currentTime = +new Date();

            if (isNaN(lastClick)) {
              e.preventDefault();
              this.setAttribute('data-last-click', currentTime);
            } else if (lastClick + config.doubleClickTime <= currentTime) {
              e.preventDefault();
              this.setAttribute('data-last-click', currentTime);
            } else if (lastClick + config.doubleClickTime > currentTime) {
              e.stopPropagation();
              closeMenu(this, true);
            }
          });
        }
      }
    }
  }

  /**
   * Set aria-* attributes according to the current activity state
   */
  function initAriaAttributes() {
    var allAriaElements = document.querySelectorAll(config.wrapperSelector + ' ' + '*[aria-hidden]');

    for (var i = 0; i < allAriaElements.length; i++) {
      var ariaElement = allAriaElements[i];

      if (
        ariaElement.parentNode.classList.contains('active') ||
        ariaElement.parentNode.classList.contains('active-parent')
      ) {
        ariaElement.setAttribute('aria-hidden', 'false');
        ariaElement.parentNode.firstElementChild.setAttribute('aria-expanded', true);
      } else {
        ariaElement.setAttribute('aria-hidden', 'true');
        ariaElement.parentNode.firstElementChild.setAttribute('aria-expanded', false);
      }
    }
  }

  /**
   * Close menu on click link
   */
  function initClosingMenuOnClickLink() {
    var links = document.querySelectorAll(config.menuSelector + ' a');

    for (var i = 0; i < links.length; i++) {
      if (links[i].parentNode.classList.contains(config.parentItemClass)) {
        continue;
      }

      links[i].addEventListener('click', function (e) {
        closeMenu(this, false);
      });
    }
  }

  /**
   * Close menu
   */
  function closeMenu(clickedLink, forceClose) {
    if (forceClose === false) {
      if (clickedLink.parentNode.classList.contains(config.parentItemClass)) {
        return;
      }
    }

    var relatedContainer = document.querySelector(config.relatedContainerForOverlayMenuSelector);
    var button = document.querySelector(config.buttonSelector);
    var menuWrapper = document.querySelector('.' + config.mobileMenuOverlayClass);

    if (!menuWrapper) {
      menuWrapper = document.querySelector('.' + config.mobileMenuSidebarClass);
    }

    menuWrapper.classList.add(config.hiddenElementClass);
    button.classList.remove(config.openedMenuClass);
    button.setAttribute(config.ariaButtonAttribute, false);
    document.documentElement.classList.remove(config.noScrollClass);

    if (relatedContainer) {
      relatedContainer.classList.remove(config.relatedContainerForOverlayMenuClass);
    }

    var menuOverlay = document.querySelector('.' + config.mobileMenuSidebarOverlayClass);

    if (menuOverlay) {
      menuOverlay.classList.add(config.hiddenElementClass);
    }
  }

  /**
   * Run menu scripts 
   */
  init();
})(window.publiiThemeMenuConfig);


// Load comments
var comments = document.querySelector(".js-post__comments-button");
if (comments) {
  comments.addEventListener("click", function () {
    comments.classList.toggle("is-hidden");
    var container = document.querySelector(".js-post__comments-inner");
    container.classList.toggle("is-visible");
  });
}


// Load search input area
const searchButton = document.querySelector('.search-toggle');
const searchOverlay = document.querySelector('.search-overlay');
const searchInput = document.querySelector('.search__input');

if (searchButton && searchOverlay) {
  const openSearch = () => {
    searchOverlay.classList.add('expanded');
    document.body.classList.add('is-search-active');
    searchButton.setAttribute('aria-expanded', 'true');
    searchOverlay.setAttribute('aria-hidden', 'false');

    if (searchInput) {
      setTimeout(() => searchInput.focus(), 60);
    }
  };

  const closeSearch = () => {
    searchOverlay.classList.remove('expanded');
    document.body.classList.remove('is-search-active');
    searchButton.setAttribute('aria-expanded', 'false');
    searchOverlay.setAttribute('aria-hidden', 'true');
  };

  const toggleSearch = () => {
    const isOpen = searchOverlay.classList.contains('expanded');
    if (isOpen) {
      closeSearch();
    } else {
      openSearch();
    }
  };

  searchButton.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleSearch();
  });

  // Prevent closing when clicking inside the overlay
  searchOverlay.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Close the overlay when clicking outside of it
  document.body.addEventListener('click', (e) => {
    const clickedInside = searchOverlay.contains(e.target);
    const clickedToggle = e.target.closest('.search-toggle');

    if (
      searchOverlay.classList.contains('expanded') &&
      !clickedInside &&
      !clickedToggle
    ) {
      closeSearch();
    }
  });

  // Close the overlay on Escape key press
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchOverlay.classList.contains('expanded')) {
      closeSearch();
    }
  });
}


// Share buttons pop-up
(function () {
  const shareButton = document.querySelector('.js-content__share-button');
  const sharePopup = document.querySelector('.js-content__share-popup');

  const Config = {
    Link: ".js-share",
    Width: 500,
    Height: 500,
    Offset: 12 // vertical spacing between button and popup
  };

  // Trap keyboard focus within popup
  const trapFocus = (container) => {
    const focusable = container.querySelectorAll('a, button');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const keyHandler = (e) => {
      if (e.key === 'Escape') {
        hidePopup();
      }

      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    container.addEventListener('keydown', keyHandler);
  };

  // Show and position the popup
  const showPopup = () => {
    // Temporarily make popup visible (but hidden off-screen) to measure height
    sharePopup.style.visibility = 'hidden';
    sharePopup.style.display = 'block';

    const popupHeight = sharePopup.offsetHeight;
    const buttonRect = shareButton.getBoundingClientRect();

    const spaceAbove = buttonRect.top;
    const spaceBelow = window.innerHeight - buttonRect.bottom;

    const needsFlip = popupHeight > spaceAbove && spaceBelow > spaceAbove;

    // Reset flip class before actual show
    sharePopup.classList.remove('is-flipped');
    if (needsFlip) {
      sharePopup.classList.add('is-flipped');
    }

    // Now actually show popup
    sharePopup.style.visibility = '';
    sharePopup.style.display = '';
    sharePopup.classList.add('is-visible');
    shareButton.setAttribute('aria-expanded', 'true');

    // Set focus and trap
    sharePopup.focus();
    trapFocus(sharePopup);
  };

  // Hide popup and reset state
  const hidePopup = () => {
    sharePopup.classList.remove('is-visible');
    sharePopup.classList.remove('is-flipped');
    shareButton.setAttribute('aria-expanded', 'false');
  };

  if (shareButton && sharePopup) {
    sharePopup.addEventListener('click', (e) => e.stopPropagation());

    shareButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isVisible = sharePopup.classList.contains('is-visible');
      isVisible ? hidePopup() : showPopup();
    });

    document.body.addEventListener('click', hidePopup);
    document.body.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') hidePopup();
    });
  }

  // Handle external share links (open in popup)
  const shareLinks = document.querySelectorAll(Config.Link);
  shareLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();

      const target = e.target.closest(Config.Link);
      if (!target) return;

      hidePopup();

      const px = Math.floor((window.innerWidth - Config.Width) / 2);
      const py = Math.floor((window.innerHeight - Config.Height) / 2);

      const popup = window.open(target.href, "social", `
                width=${Config.Width},
                height=${Config.Height},
                left=${px},
                top=${py},
                location=0,
                menubar=0,
                toolbar=0,
                status=0,
                scrollbars=1,
                resizable=1
            `);

      if (popup) popup.focus();
    });
  });
})();


// Responsive embeds script
(function () {
  let wrappers = document.querySelectorAll('.post__video, .post__iframe');

  for (let i = 0; i < wrappers.length; i++) {
    let embed = wrappers[i].querySelector('iframe, embed, video, object');

    if (!embed) {
      continue;
    }

    if (embed.getAttribute('data-responsive') === 'false') {
      continue;
    }

    let w = embed.getAttribute('width');
    let h = embed.getAttribute('height');
    let ratio = false;

    if (!w || !h) {
      continue;
    }

    if (w.indexOf('%') > -1 && h.indexOf('%') > -1) { // percentage mode
      w = parseFloat(w.replace('%', ''));
      h = parseFloat(h.replace('%', ''));
      ratio = h / w;
    } else if (w.indexOf('%') === -1 && h.indexOf('%') === -1) { // pixels mode
      w = parseInt(w, 10);
      h = parseInt(h, 10);
      ratio = h / w;
    }

    if (ratio !== false) {
      let ratioValue = (ratio * 100) + '%';
      wrappers[i].setAttribute('style', '--embed-aspect-ratio:' + ratioValue);
    }
  }
})();


// Media tabs (audio/video) + Lazy-load video on scroll
(function (mediaTabsConfig) {
  // 1. Default settings
  var defaultConfig = {
    wrapperSelector: '.media-tabs',
    navSelector: '.media-tabs__nav',
    listSelector: '.media-tabs__nav__list',
    tabSelector: '.media-tabs__nav__tab',
    itemSelector: '.media-tabs__item',
    playButtonClass: 'play-button',
    pauseButtonClass: 'pause-button',
    resumeButtonClass: 'resume-button',
    activeTabClass: 'media-tabs__nav__tab--active',
    activeItemClass: 'media-tabs__item--active',
    initiatedClass: 'media-tabs__item--initiated',
    playingClass: 'media-tabs__item--playing',
    pausedClass: 'media-tabs__item--paused',
    indicatorClass: 'media-tabs__indicator',
    animationSpeed: 300,
    useNativeControls: false,
    pauseOtherInstancesOnPlay: true
  };

  // 2. Merge defaults
  var config = {};
  Object.keys(defaultConfig).forEach(function (key) {
    config[key] = defaultConfig[key];
  });
  if (typeof mediaTabsConfig === 'object') {
    Object.keys(mediaTabsConfig).forEach(function (key) {
      if (mediaTabsConfig[key] !== undefined) config[key] = mediaTabsConfig[key];
    });
  }

  // --- Lazy-load function ---
  function loadVideoLazy(video) {
    if (video.dataset.poster) video.poster = video.dataset.poster;
    Array.from(video.querySelectorAll('source')).forEach(source => {
      if (source.dataset.src) source.src = source.dataset.src;
    });
    video.load();
    video.classList.remove('lazy-video');
  }

  document.addEventListener('DOMContentLoaded', function () {
    var mediaTabsInstances = document.querySelectorAll(config.wrapperSelector);
    if (!mediaTabsInstances.length) return;

    function pauseAllVideosGlobally(exceptThisVideo) {
      if (!config.pauseOtherInstancesOnPlay) return;
      mediaTabsInstances.forEach(instanceRoot => {
        Array.from(instanceRoot.querySelectorAll('video')).forEach(videoEl => {
          if (videoEl !== exceptThisVideo && !videoEl.paused) videoEl.pause();
        });
      });
    }

    mediaTabsInstances.forEach(function (root, instanceIndex) {
      var tabsNav = root.querySelector(config.navSelector);
      var tabList = root.querySelector(config.listSelector);
      var tabButtons = tabList ? Array.from(tabList.querySelectorAll(config.tabSelector)) : [];
      var items = Array.from(root.querySelectorAll(config.itemSelector));
      var itemsContainer = items.length > 0 ? items[0].parentElement : root;
      if (!tabsNav || !tabList || tabButtons.length === 0) return;

      // Progressive enhancement: tell Pointer Events (where supported) that vertical pan is allowed
      // This does NOT break older iOS; JS lock below handles Touch Events.
      try { itemsContainer.style.touchAction = 'pan-y'; } catch (e) {}

      if (config.useNativeControls) {
        items.forEach(it => {
          var v = it.querySelector('video');
          if (v) v.controls = true;
          var overlay = it.querySelector('.media-tabs__controls');
          if (overlay) overlay.style.display = 'none';
        });
      }

      // Ensure unique tab-targets
      var usedTargets = new Set();
      tabButtons.forEach(function (btn, i) {
        var rawTarget = btn.dataset.tabTarget || ('tab-' + i);
        var uniqueTarget = rawTarget;
        if (usedTargets.has(uniqueTarget)) {
          uniqueTarget = rawTarget + '-' + instanceIndex + '-' + i;
          btn.dataset.tabTarget = uniqueTarget;
        }
        usedTargets.add(uniqueTarget);

        var panel = root.querySelector('#media-panel-' + rawTarget);
        if (panel) panel.id = 'media-panel-' + uniqueTarget;
      });

      // Indicator
      var indicator = document.createElement('div');
      indicator.classList.add(config.indicatorClass);
      tabList.appendChild(indicator);

      var currentIndex = tabButtons.findIndex(btn => btn.classList.contains(config.activeTabClass));
      if (currentIndex < 0) currentIndex = 0;

      function pauseAllVideosInThisInstance(exceptVideo) {
        items.forEach(it => {
          var v = it.querySelector('video');
          if (v && v !== exceptVideo && !v.paused) v.pause();
        });
      }

      function moveIndicator(btn) {
        if (!btn) {
          indicator.style.width = '0';
          indicator.style.transform = 'translateX(0)';
          return;
        }
        indicator.style.width = btn.offsetWidth + 'px';
        indicator.style.transform = 'translateX(' + btn.offsetLeft + 'px)';
      }

      function scrollToBtn(btn) {
        var navRect = tabsNav.getBoundingClientRect();
        var btnRect = btn.getBoundingClientRect();
        var totalW = tabList.scrollWidth;
        var tf = window.getComputedStyle(tabList).transform;
        var curX = 0;
        if (tf !== 'none') {
          var matrix = tf.match(/matrix\((.+)\)/);
          if (matrix && matrix[1]) curX = parseFloat(matrix[1].split(',')[4]) || 0;
          else try { curX = new DOMMatrix(tf).m41; } catch (e) { curX = 0; }
        }
        var centerNav = navRect.width / 2;
        var centerBtn = btnRect.left - navRect.left + btnRect.width / 2;
        var newX = Math.min(0, Math.max(navRect.width - totalW, curX + (centerNav - centerBtn)));
        tabList.style.transform = 'translateX(' + newX + 'px)';
      }

      function activateTab(targetId, focus) {
        pauseAllVideosInThisInstance();
        var newBtn = null;
        tabButtons.forEach((btn, i) => {
          var isActive = btn.dataset.tabTarget === targetId;
          btn.classList.toggle(config.activeTabClass, isActive);
          btn.setAttribute('aria-selected', isActive);
          btn.setAttribute('tabindex', isActive ? '0' : '-1');
          if (isActive) {
            currentIndex = i;
            newBtn = btn;
            if (focus) btn.focus();
          }
        });

        items.forEach(it => {
          var show = it.id === 'media-panel-' + targetId;
          it.classList.toggle(config.activeItemClass, show);
          it.setAttribute('tabindex', show ? '0' : '-1');

          if (!show) {
            it.classList.remove(config.initiatedClass, config.playingClass, config.pausedClass);
            var v = it.querySelector('video');
            if (v && !v.paused) v.pause();
          } else {
            // Lazy-load video
            it.querySelectorAll('video.lazy-video').forEach(video => loadVideoLazy(video));
          }
        });

        if (newBtn) {
          moveIndicator(newBtn);
          scrollToBtn(newBtn);
        }
      }

      // Tab click + keyboard
      tabButtons.forEach(btn => btn.addEventListener('click', e => activateTab(e.currentTarget.dataset.tabTarget, false)));
      tabList.addEventListener('keydown', function (e) {
        var next = currentIndex, moved = false;
        switch (e.key) {
          case 'ArrowRight': case 'ArrowDown': next = (currentIndex + 1) % tabButtons.length; moved = true; break;
          case 'ArrowLeft': case 'ArrowUp': next = (currentIndex - 1 + tabButtons.length) % tabButtons.length; moved = true; break;
          case 'Home': next = 0; moved = true; break;
          case 'End': next = tabButtons.length - 1; moved = true; break;
        }
        if (moved) { e.preventDefault(); activateTab(tabButtons[next].dataset.tabTarget, true); }
      });

      // Video controls
      items.forEach(it => {
        var v = it.querySelector('video');
        var play = it.querySelector('.' + config.playButtonClass);
        var pause = it.querySelector('.' + config.pauseButtonClass);
        var resume = it.querySelector('.' + config.resumeButtonClass);
        if (!v) return;

        if (play) play.addEventListener('click', () => {
          it.classList.add(config.initiatedClass);
          v.play().catch(() => { it.classList.remove(config.initiatedClass, config.playingClass, config.pausedClass); });
        });
        if (pause) pause.addEventListener('click', () => v.pause());
        if (resume) resume.addEventListener('click', () => v.play().catch(() => {
          it.classList.add(config.pausedClass); it.classList.remove(config.playingClass, config.initiatedClass);
        }));

        v.addEventListener('play', () => {
          if (config.pauseOtherInstancesOnPlay) pauseAllVideosGlobally(v);
          it.classList.remove(config.initiatedClass, config.pausedClass);
          it.classList.add(config.playingClass);
          items.forEach(other => {
            if (other !== it) {
              var ov = other.querySelector('video');
              if (ov && ov !== v) other.classList.remove(config.playingClass, config.initiatedClass);
            }
          });
        });
        v.addEventListener('pause', () => {
          if (!v.ended && (it.classList.contains(config.playingClass) || it.classList.contains(config.initiatedClass))) it.classList.add(config.pausedClass);
          it.classList.remove(config.playingClass, config.initiatedClass);
        });
        v.addEventListener('ended', () => { it.classList.remove(config.playingClass, config.pausedClass, config.initiatedClass); v.currentTime = 0; });
      });

      // Swipe / Drag — horizontal-only on touch (vertical scroll remains native)
      var isDragging = false;
      var startX = 0, startY = 0;
      var directionLocked = null; // null | 'x' | 'y'
      var activationThreshold = 12; // px to decide direction
      var swipeThreshold = 50;      // px to trigger tab change

      function getClientXY(e) {
        // Return { x, y } for both mouse and touch events
        if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        if (e.changedTouches && e.changedTouches[0]) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
        return { x: e.clientX, y: e.clientY };
      }

      function handleDragStart(e) {
        // Ignore clicks on controls or nav
        if (e.target.closest('.' + config.playButtonClass) ||
            e.target.closest('.' + config.pauseButtonClass) ||
            e.target.closest('.' + config.resumeButtonClass) ||
            e.target.closest(config.navSelector)) {
          return;
        }
        var p = getClientXY(e);
        startX = p.x; startY = p.y;
        isDragging = true;
        directionLocked = e.type.indexOf('mouse') === 0 ? 'x' : null; // mouse drags lock to X immediately
        itemsContainer.style.cursor = 'grabbing';

        // IMPORTANT: do NOT preventDefault here for touch; we will do it only after locking to 'x'
        if (e.type.indexOf('mouse') === 0) {
          e.preventDefault();
        }
      }

      function handleDragMove(e) {
        if (!isDragging) return;
        var p = getClientXY(e);
        var dx = p.x - startX;
        var dy = p.y - startY;

        // Decide direction once movement is meaningful
        if (directionLocked == null) {
          if (Math.abs(dx) + Math.abs(dy) < activationThreshold) return; // not enough movement yet
          directionLocked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        }

        if (directionLocked === 'y') {
          // Abort swipe; allow native vertical scroll
          isDragging = false;
          itemsContainer.style.cursor = '';
          return;
        }

        // Horizontal swipe in progress: prevent vertical scroll while swiping
        if (directionLocked === 'x' && e.cancelable) {
          e.preventDefault();
        }
      }

      function handleDragEnd(e) {
        // If we already aborted due to vertical movement, do nothing
        if (!isDragging && directionLocked !== 'x') {
          directionLocked = null;
          return;
        }

        var p = getClientXY(e);
        var diffX = startX - p.x;

        isDragging = false;
        itemsContainer.style.cursor = '';

        if (directionLocked === 'x' && Math.abs(diffX) > swipeThreshold) {
          if (diffX > 0) {
            var nextIndex = (currentIndex + 1) % tabButtons.length;
            activateTab(tabButtons[nextIndex].dataset.tabTarget, false);
          } else {
            var prevIndex = (currentIndex - 1 + tabButtons.length) % tabButtons.length;
            activateTab(tabButtons[prevIndex].dataset.tabTarget, false);
          }
        }

        directionLocked = null;
      }

      // Mouse events
      itemsContainer.addEventListener('mousedown', handleDragStart);
      itemsContainer.addEventListener('mousemove', handleDragMove);
      itemsContainer.addEventListener('mouseup', handleDragEnd);
      itemsContainer.addEventListener('mouseleave', handleDragEnd);

      // Touch events (passive:false so we CAN preventDefault when we detect horizontal swipe)
      itemsContainer.addEventListener('touchstart', handleDragStart, { passive: false });
      itemsContainer.addEventListener('touchmove', handleDragMove, { passive: false });
      itemsContainer.addEventListener('touchend', handleDragEnd);
      itemsContainer.addEventListener('touchcancel', handleDragEnd);

      // Intersection Observer for lazy-load
      var observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            items.forEach(it => { it.querySelectorAll('video.lazy-video').forEach(loadVideoLazy); });
            observer.unobserve(root);
          }
        });
      }, { threshold: 0.1 });
      observer.observe(root);

      // Activate first tab
      requestAnimationFrame(() => {
        var btn = tabButtons[currentIndex] || tabButtons[0];
        if (btn) activateTab(btn.dataset.tabTarget, false);
      });
    });

    // Window resize handling
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        mediaTabsInstances.forEach(instanceRoot => {
          const currentTabsNav = instanceRoot.querySelector(config.navSelector);
          const currentTabList = instanceRoot.querySelector(config.listSelector);
          const currentTabButtons = currentTabList ? Array.from(currentTabList.querySelectorAll(config.tabSelector)) : [];
          const currentIndicator = currentTabList ? currentTabList.querySelector('.' + config.indicatorClass) : null;
          if (!currentTabsNav || !currentTabList || !currentIndicator || currentTabButtons.length === 0) return;
          const activeBtn = currentTabButtons.find(b => b.classList.contains(config.activeTabClass));
          if (!activeBtn) return;
          var prevI = currentIndicator.style.transition, prevL = currentTabList.style.transition;
          currentIndicator.style.transition = 'none';
          currentTabList.style.transition = 'none';
          currentIndicator.style.width = activeBtn.offsetWidth + 'px';
          currentIndicator.style.transform = 'translateX(' + activeBtn.offsetLeft + 'px)';
          var navRect = currentTabsNav.getBoundingClientRect(), btnRect = activeBtn.getBoundingClientRect(), totalW = currentTabList.scrollWidth;
          var tf = window.getComputedStyle(currentTabList).transform, curX = 0;
          if (tf !== 'none') {
            var matrix = tf.match(/matrix\((.+)\)/);
            if (matrix && matrix[1]) curX = parseFloat(matrix[1].split(',')[4]) || 0;
            else try { curX = new DOMMatrix(tf).m41; } catch (e) { curX = 0; }
          }
          var centerNav = navRect.width / 2, centerBtn = btnRect.left - navRect.left + btnRect.width / 2;
          var newX = Math.min(0, Math.max(navRect.width - totalW, curX + (centerNav - centerBtn)));
          currentTabList.style.transform = 'translateX(' + newX + 'px)';
          currentIndicator.offsetHeight; currentTabList.offsetHeight;
          currentIndicator.style.transition = prevI;
          currentTabList.style.transition = prevL || 'transform ' + config.animationSpeed + 'ms ease';
        });
      }, 150);
    });
  });
})(window.mediaTabsConfig);



// Back to top
document.addEventListener('DOMContentLoaded', () => {
  const backToTopButton = document.getElementById('backToTop');
  const progressCircle = document.querySelector('.bttop__progress-indicator');
  const circleRadius = 22;
  const circumference = 2 * Math.PI * circleRadius;

  if (backToTopButton) {
    const updateProgress = () => {
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = scrollTop / scrollHeight;
      const offset = circumference - progress * circumference;

      progressCircle.style.strokeDasharray = circumference;
      progressCircle.style.strokeDashoffset = offset;

      if (scrollTop > 400) {
        backToTopButton.classList.add('is-visible');
      } else {
        backToTopButton.classList.remove('is-visible');
      }
    };

    const backToTopFunction = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('scroll', updateProgress);
    backToTopButton.addEventListener('click', backToTopFunction);

    updateProgress();
  }
});