
const script = async () => {
    const mainScript = () => {
        gsap.registerPlugin(ScrollTrigger);
        ScrollTrigger.defaults({
            invalidateOnRefresh: true
        });

        const cvUnit = (val, unit) => {
            let result;
            switch (true) {
                case unit === 'vw':
                    result = window.innerWidth * (val / 100);
                    break;
                case unit === 'vh':
                    result = window.innerHeight * (val / 100);
                    break;
                case unit === 'rem':
                    result = val / 10 * parseFloat($('html').css('font-size'));
                    break;
                default: break;
            }
            return result;
        }
        const viewport = {
            get w() {
                return window.innerWidth;
            },
            get h() {
                return window.innerHeight;
            },
        }
        const device = { desktop: 991, tablet: 767, mobile: 479 }

        const debounce = (func, timeout = 300) => {
            let timer

            return (...args) => {
                clearTimeout(timer)
                timer = setTimeout(() => { func.apply(this, args) }, timeout)
            }
        }
        const isInViewport = (el, orientation = 'vertical') => {
            if (!el) return;
            const rect = el.getBoundingClientRect();
            if (orientation == 'horizontal') {
                return (
                    rect.left <= (window.innerWidth) &&
                    rect.right >= 0
                );
            } else {
                return (
                    rect.top <= (window.innerHeight) &&
                    rect.bottom >= 0
                );
            }
        }
        const refreshOnBreakpoint = () => {
            const breakpoints = Object.values(device).sort((a, b) => a - b);
            const initialViewportWidth = window.innerWidth || document.documentElement.clientWidth;
            const breakpoint = breakpoints.find(bp => initialViewportWidth < bp) || breakpoints[breakpoints.length - 1];
            window.addEventListener('resize', debounce(function () {
                const newViewportWidth = window.innerWidth || document.documentElement.clientWidth;
                if ((initialViewportWidth < breakpoint && newViewportWidth >= breakpoint) ||
                    (initialViewportWidth >= breakpoint && newViewportWidth < breakpoint)) {
                    location.reload();
                }
            }));
        }
        const documentHeightObserver = (() => {
            let previousHeight = document.documentElement.scrollHeight;
            let resizeObserver;
            let debounceTimer;

            function refreshScrollTrigger() {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    const currentHeight = document.documentElement.scrollHeight;

                    if (currentHeight !== previousHeight) {
                        console.log("Document height changed. Refreshing ScrollTrigger...");
                        ScrollTrigger.getAll().forEach(trigger => {
                            if (trigger.progress === 0 || trigger.vars?.scrub) {
                                trigger.refresh();
                            }
                        });
                        previousHeight = currentHeight;
                    }
                }, 200); // Adjust the debounce delay as needed
            }

            return (action) => {
                if (action === "init") {
                    console.log("Initializing document height observer...");
                    resizeObserver = new ResizeObserver(refreshScrollTrigger);
                    resizeObserver.observe(document.documentElement);
                }
                else if (action === "disconnect") {
                    console.log("Disconnecting document height observer...");
                    if (resizeObserver) {
                        resizeObserver.disconnect();
                    }
                }
            };
        })();
        const getAllScrollTrigger = (fn) => {
            let triggers = ScrollTrigger.getAll();
            triggers.forEach(trigger => {
                if (fn === "refresh") {
                    if (trigger.progress === 0) {
                        trigger[fn]?.();
                    }
                } else {
                    trigger[fn]?.();
                }
            });
        };
        function resetScroll() {
            if (window.location.hash !== '') {
                if ($(window.location.hash).length >= 1) {
                    $("html").animate({ scrollTop: $(window.location.hash).offset().top - 100 }, 1200);

                    setTimeout(() => {
                        $("html").animate({ scrollTop: $(window.location.hash).offset().top - 100 }, 1200);
                    }, 300);
                } else {
                    scrollTop()
                }
            } else if (window.location.search !== '') {
                let searchObj = JSON.parse('{"' + decodeURI(location.search.substring(1)).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}')
                if (searchObj.sc) {
                    if ($(`#${searchObj.sc}`).length >= 1) {
                        let target = `#${searchObj.sc}`;
                        setTimeout(() => {
                            smoothScroll.scrollTo(`#${searchObj.sc}`, {
                                offset: -100
                            })
                        }, 500);
                    } else {
                        scrollTop()
                    }
                }
            } else {
                scrollTop()
            }
        };
        function scrollTop(onComplete) {
            if ('scrollRestoration' in history) {
                history.scrollRestoration = 'manual';
            }
            window.scrollTo(0, 0);
            smoothScroll.scrollToTop({
                onComplete: () => {
                    onComplete?.();
                    getAllScrollTrigger("refresh");
                }
            });
        }
        class SmoothScroll {
            constructor() {
                this.lenis = null;
                this.scroller = {
                    scrollX: window.scrollX,
                    scrollY: window.scrollY,
                    velocity: 0,
                    direction: 0,
                };
                this.lastScroller = {
                    scrollX: window.scrollX,
                    scrollY: window.scrollY,
                    velocity: 0,
                    direction: 0,
                };
            }

            init() {
                this.reInit();

                $.easing.lenisEase = function (t) {
                    return Math.min(1, 1.001 - Math.pow(2, -10 * t));
                };

                gsap.ticker.add((time) => {
                    if (this.lenis) {
                        this.lenis.raf(time * 1000);
                    }
                });
                gsap.ticker.lagSmoothing(0);
            }

            reInit() {
                if (this.lenis) {
                    this.lenis.destroy();
                }
                this.lenis = new Lenis();
                this.lenis.on("scroll", (e) => {
                    this.updateOnScroll(e);
                    ScrollTrigger.update();
                });
            }
            reachedThreshold(threshold) {
                if (!threshold) return false;
                const dist = distance(
                    this.scroller.scrollX,
                    this.scroller.scrollY,
                    this.lastScroller.scrollX,
                    this.lastScroller.scrollY
                );

                if (dist > threshold) {
                    this.lastScroller = { ...this.scroller };
                    return true;
                }
                return false;
            }

            updateOnScroll(e) {
                this.scroller.scrollX = e.scroll;
                this.scroller.scrollY = e.scroll;
                this.scroller.velocity = e.velocity;
                this.scroller.direction = e.direction;
            }

            start() {
                if (this.lenis) {
                    this.lenis.start();
                }
                $(".body").css("overflow", "initial");
            }

            stop() {
                if (this.lenis) {
                    this.lenis.stop();
                }
                $(".body").css("overflow", "hidden");
            }

            scrollTo(target, options = {}) {
                if (this.lenis) {
                    this.lenis.scrollTo(target, options);
                }
            }

            scrollToTop(options = {}) {
                if (this.lenis) {
                    this.lenis.scrollTo("top", { duration: .0001, immediate: true, lock: true, ...options });
                }
            }

            destroy() {
                if (this.lenis) {
                    gsap.ticker.remove((time) => {
                        this.lenis.raf(time * 1000);
                    });
                    this.lenis.destroy();
                    this.lenis = null;
                }
            }
        }
        const smoothScroll = new SmoothScroll();
        smoothScroll.init();

        class ParallaxImage {
            constructor({ el, scaleOffset = 0.1 }) {
                this.el = el;
                this.elWrap = null;
                this.scaleOffset = scaleOffset;
                this.init();
            }
            init() {
                this.elWrap = this.el.parentElement;
                this.setup();
            }
            setup() {
                const scalePercent = 100 + 5 + ((this.scaleOffset - 0.1) * 100);
                gsap.set(this.el, {
                    width: scalePercent + '%',
                    height: $(this.el).hasClass('img-fill') ? scalePercent + '%' : 'auto'
                });
                this.scrub();
            }
            scrub() {
                let dist = this.el.offsetHeight - this.elWrap.offsetHeight;
                let total = this.elWrap.getBoundingClientRect().height + window.innerHeight;
                this.updateOnScroll(dist, total);
                smoothScroll.lenis.on('scroll', () => {
                    this.updateOnScroll(dist, total);
                });
            }
            updateOnScroll(dist, total) {
                if (this.el) {
                    if (isInViewport(this.elWrap)) {
                        let percent = this.elWrap.getBoundingClientRect().top / total;
                        gsap.quickSetter(this.el, 'y', 'px')(-dist * percent * 1.2);
                        gsap.set(this.el, { scale: 1 + (percent * this.scaleOffset) });
                    }
                }
            }
        }

        class TriggerSetup extends HTMLElement {
            constructor() {
                super();
                this.tlTrigger = null;
                this.onTrigger = () => { };
            }
            connectedCallback() {
                this.tlTrigger = gsap.timeline({
                    scrollTrigger: {
                        trigger: $(this).find('section'),
                        start: 'top bottom+=50%',
                        end: 'bottom top-=50%',
                        once: true,
                        onEnter: () => {
                            this.onTrigger?.();
                        }
                    }
                });
            }
            destroy() {
                if (this.tlTrigger) {
                    this.tlTrigger.kill();
                    this.tlTrigger = null;
                }
            }
        }

        const HomePage = {
            'home-hero-wrap': class extends TriggerSetup {
                constructor() {
                    super();
                    this.onTrigger = () => {
                        this.animationReveal();
                        this.animationScrub();
                        this.interact();
                        requestAnimationFrame(() => {
                            $('.body').css({
                                'overflow': 'initial',
                                'position': 'relative',
                                'max-height': 'none',
                                'inset': 'auto',
                                'overflow-y': 'initial'
                            })
                        })
                    };
                }
                animationReveal() {
                }
                animationScrub() {
                    let tl = gsap.timeline({
                        scrollTrigger: {
                            trigger: $(this).find('section'),
                            start: 'top-=1px top',
                            end: 'bottom top',
                            scrub: true
                        }
                    })
                    tl.fromTo('.home-hero-img', { scale: 1 }, { scale: .9, duration: 1, ease: 'none' });
                }
                interact() {
                }
                destroy() {
                    super.destroy();
                }
            },
            'home-val-wrap': class extends TriggerSetup {
                constructor() {
                    super();
                    this.onTrigger = () => {
                        this.animationReveal();
                        this.animationScrub();
                        this.interact();
                    };
                }
                animationReveal() {
                }
                animationScrub() {
                    $(this).find('.home-val-main').addClass('swiper')
                    $(this).find('.home-val-main').find('.home-val-list').addClass('swiper-wrapper')
                    $(this).find('.home-val-main').find('.home-val-item').addClass('swiper-slide')
                    let swiperVal = new Swiper('.home-val-main', {
                        slidesPerView: 'auto',
                        spaceBetween: cvUnit(24, 'rem'),
                        pagination: {
                            el: '.home-val-pagin',
                            bulletClass: 'home-val-pagin-item',
                            bulletActiveClass: 'active'
                        }
                    })
                    if ($(window).width() > 991) {
                        let tl = gsap.timeline({
                            scrollTrigger: {
                                trigger: $(this).find('section').find('.home-val-main'),
                                start: 'center center',
                                end: 'center center',
                                scrub: true,
                                onEnter: () => {
                                    swiperVal.slideTo(1);
                                },
                                onEnterBack: () => {
                                    swiperVal.slideTo(0);
                                }
                            }
                        })
                    }
                }
                interact() {
                }
                destroy() {
                    super.destroy();
                }
            },
            'home-fea-wrap': class extends TriggerSetup {
                constructor() {
                    super();
                    this.onTrigger = () => {
                        this.animationReveal();
                        this.animationScrub();
                        this.interact();
                    };
                }
                animationReveal() {
                }
                animationScrub() {
                    let tl = gsap.timeline({
                        scrollTrigger: {
                            trigger: '.home-fea-thumb',
                            start: 'top bottom',
                            end: 'bottom top',
                            scrub: true
                        }
                    })
                    new ParallaxImage({ el: $('.home-fea-thumb .img-fill').get(0) });
                    tl
                        .fromTo('.home-fea-thumb-inner', { yPercent: -15 }, { yPercent: 15, duration: 1, ease: 'power1.inOut' })
                }
                interact() {
                }
                destroy() {
                    super.destroy();
                }
            },
            'home-pricing-wrap': class extends TriggerSetup {
                constructor() {
                    super();
                    this.onTrigger = () => {
                        this.animationReveal();
                        this.animationScrub();
                        this.interact();
                    };
                }
                animationReveal() {
                }
                animationScrub() {
                }
                interact() {
                    $('.home-pricing-main').addClass('swiper')
                    $('.home-pricing-list').addClass('swiper-wrapper')
                    $('.home-pricing-item').addClass('swiper-slide');
                    $('.home-pricing-list').css('gap', 0);
                    let swiper = new Swiper('.home-pricing-main', {
                        slidesPerView: 'auto',
                        spaceBetween: cvUnit(24, 'rem')
                    });
                    // $('.home-pricing-btn').each(function (idx, item) {
                    //     $(this).attr('href', `${$(this).attr('href')}#${$(this).attr('data-plan')}`);
                    // })
                    $('.home-pricing-toggle-btn, .home-pricing-toggle-title').on('click', function (e) {
                        $('.home-pricing-toggle').toggleClass('per-month');
                        if (!$('.home-pricing-toggle').hasClass('per-month')) {
                            $('.home-pricing-btn').attr('href', '/subscribe?plan=nest&cycle=annual')
                        } else {
                            $('.home-pricing-btn').attr('href', '/subscribe?plan=nest&cycle=monthly')
                        }
                    });
                }
                destroy() {
                    super.destroy();
                }
            },
            'home-role-wrap': class extends TriggerSetup {
                constructor() {
                    super();
                    this.onTrigger = () => {
                        this.animationReveal();
                        this.animationScrub();
                        this.interact();
                    };
                }
                animationReveal() {
                }
                animationScrub() {
                }
                interact() {
                    if (viewport.w <= 767) {
                        $('.home-role-main').addClass('swiper')
                        $('.home-role-list').addClass('swiper-wrapper')
                        $('.home-role-item').addClass('swiper-slide')
                        $('.home-role-list').css('gap', 0);
                        let swiper = new Swiper('.home-role-main', {
                            slidesPerView: 'auto',
                            spaceBetween: cvUnit(16, 'rem'),
                            pagination: {
                                el: '.home-role-pagin',
                                bulletClass: 'home-role-pagin-item',
                                bulletActiveClass: 'active'
                            }
                        });
                    }
                }
                destroy() {
                    super.destroy();
                }
            },
            'home-review-wrap': class extends TriggerSetup {
                constructor() {
                    super();
                    this.onTrigger = () => {
                        this.animationReveal();
                        this.animationScrub();
                        this.interact();
                    };
                }
                animationReveal() {
                }
                animationScrub() {
                }
                interact() {
                    if (viewport.w <= 767) {
                        $('.home-review-main').addClass('swiper')
                        $('.home-review-list').addClass('swiper-wrapper')
                        $('.home-review-item').addClass('swiper-slide')
                        $('.home-review-list').css('gap', 0);
                        let swiper = new Swiper('.home-review-main', {
                            slidesPerView: 'auto',
                            spaceBetween: cvUnit(16, 'rem'),
                            pagination: {
                                el: '.home-review-pagin',
                                bulletClass: 'home-review-pagin-item',
                                bulletActiveClass: 'active'
                            }
                        });
                    }
                }
                destroy() {
                    super.destroy();
                }
            }
        }
        const SignUpPage = {
            'signup-hero-wrap': class extends TriggerSetup {
                constructor() {
                    super();
                    this.onTrigger = () => {
                        this.currentStep = -1;
                        this.animationReveal();
                        this.animationScrub();
                        this.interact();
                    };
                }
                animationReveal() {
                    if (window.location.hash) {
                        this.currentStep += 1;
                        this.updateScreenStep();
                        let planTitle = $(`.signup-hero-item-info-btn-inner${window.location.hash}`).parents('.signup-hero-item').find('.signup-hero-item-title .heading').text();
                        $('.plan-hero-main-head-title .txt').text(planTitle);
                    }
                }
                animationScrub() {
                }
                interact() {
                    $('.signup-hero-item-info-btn-inner').on('click', (e) => {
                        e.preventDefault();
                        this.currentStep += 1;
                        this.updateScreenStep();
                        let planTitle = $(e.currentTarget).parents('.signup-hero-item').find('.signup-hero-item-title .heading').text();
                        $('.plan-hero-main-head-title .txt').text(planTitle);
                    });
                    $('.signup-hero-plan-head-back').on('click', (e) => {
                        e.preventDefault();
                        this.currentStep = -1;
                        $('.signup-hero-plan-step form').get(0).reset();
                        $('.signup-hero-plan-step .input-field-wrap .input-field').removeClass('filled');
                        $('.signup-hero-plan-step .input-field-wrap .input-field').val('');
                        $('.signup-hero-plan-step .radio-field-wrap .radio-field').prop('checked', false);
                        this.updateScreenStep();
                    });
                    this.attachFormHandler();

                    if (viewport.w <= 991) {
                        $('.signup-hero-main').addClass('swiper')
                        $('.signup-hero-list').addClass('swiper-wrapper')
                        $('.signup-hero-item').addClass('swiper-slide');
                        $('.signup-hero-list').css('gap', 0);
                        let swiper = new Swiper('.signup-hero-main', {
                            slidesPerView: 'auto',
                            spaceBetween: cvUnit(24, 'rem'),
                            centeredSlides: true,
                            initialSlide: 1
                        });
                    }
                }
                updateScreenStep() {
                    if (this.currentStep >= 0) {
                        let stepProgress = $('.signup-hero-plan-step').eq(this.currentStep).attr('data-progress');
                        if (stepProgress) {
                            $('.signup-hero-plan-pagin-item').each(function (idx, item) {
                                if (idx < Number(stepProgress) - 1) {
                                    $(item).addClass('filled').removeClass('active');
                                }
                                else {
                                    $(item).removeClass('filled');
                                }
                            });
                            $('.signup-hero-plan-pagin-item').eq(Number(stepProgress) - 1).addClass('active').siblings().removeClass('active');
                        }
                        if (this.currentStep == 0) {
                            $('.signup-hero-title').hide();

                            $('.signup-hero-screen').eq(0).removeClass('active');
                            $('.signup-hero-screen').eq(1).addClass('active');
                            $('.signup-hero-plan-step').eq(this.currentStep).addClass('active').siblings().removeClass('active');
                        } else if (this.currentStep == $('.signup-hero-plan-step').length) {
                            $('.signup-hero-title').hide();

                            $('.signup-hero-screen').eq(1).removeClass('active');
                            $('.signup-hero-screen').eq(2).addClass('active');
                            $('.signup-hero-plan-step').removeClass('active');
                        }
                        else {
                            $('.signup-hero-title').hide();
                            $('.signup-hero-plan-step').eq(this.currentStep).addClass('active').siblings().removeClass('active');
                        }
                    }
                    else {
                        $('.signup-hero-title').show();
                        $('.signup-hero-screen').eq(0).addClass('active');
                        $('.signup-hero-screen').eq(1).removeClass('active');
                        $('.signup-hero-plan-step').removeClass('active');
                    }
                    if (this.currentStep == $('.signup-hero-plan-step').length - 1) {
                        $('.signup-hero-plan-step').eq(this.currentStep).find('input[type="submit"]').prop('disabled', true);
                        $('.signup-hero-plan-step').eq(this.currentStep).find('input[type="submit"]').css('pointer-events', 'none');
                    }

                }
                attachFormHandler() {
                    $('.signup-hero-plan-step').each(function (idx, step) {
                        let form = $(this).find('form').get(0);
                        let hasForm = $(this).find('form').length > 0;
                        let isValid = true;
                        let isFilled = false;
                        if (hasForm) {
                            $(this).find('.input-field-wrap .input-field, .confirm-input-wrap .input-default').on('blur', function (e) {
                                if ($(this).val() != '') {
                                    $(this).closest('.input-field-wrap, .confirm-input-wrap').addClass('filled')
                                    isFilled = true;
                                }
                                else {
                                    $(this).closest('.input-field-wrap, .confirm-input-wrap').removeClass('filled');
                                    isFilled = false;
                                }
                            })
                            $(this).find('.input-field-wrap .input-field, .confirm-input-wrap .input-default').bind('input, change keydown keyup', function (e) {
                                isValid = form.checkValidity();
                                $(form).find('input[type="submit"]').prop('disabled', isValid);
                                $(form).find('input[type="submit"]').css('pointer-events', isValid ? 'none' : 'auto');
                            })
                            $(form).find('.input-submit.main, input[type="submit"]').on("pointerenter", function () {
                                if ($(this).prop("disabled") && !isFilled) {
                                    $(this).prop("disabled", false);
                                }
                            });
                            $(form).find('[type="tel"]').bind('change keydown keyup', function (e) {
                                let inputVal = $(this).val();
                                $(this).val(inputVal.replace(/\D/g, ''));
                            })
                            $(form).find('.input-select-toggle').on('click', function (e) {
                                $(this).parent().toggleClass('active');
                                if ($(this).parent().hasClass('active')) {
                                    $(this).siblings().slideDown({
                                        start: function () {
                                            $(this).css({ display: "flex" })
                                        }
                                    });
                                }
                                else {
                                    $(this).siblings().slideUp();
                                }
                            });
                            $(form).find('.input-select-opt').on('click', function (e) {
                                e.preventDefault();
                                let valText = $(this).text();
                                $(this).parents('.type-select').find('.input-field').val(valText);
                                isFilled = true;
                                $(form).find('input[type="submit"]').prop('disabled', true);
                                $(form).find('input[type="submit"]').css('pointer-events', 'none');
                            });
                            $(window).on('click', function (e) {
                                if (!$(e.target).closest('.input-select-toggle').length) {
                                    if ($(form).find('.type-select').hasClass('active')) {
                                        $(form).find('.input-select-dropdown').slideUp();
                                        $(form).find('.type-select').removeClass('active');
                                    }
                                }
                            });
                            $('.confirm-input-edit').on('click', function (e) {
                                $(this).parent().find('input').removeAttr('readonly');
                                $(this).parent().find('input').focus();
                                setTimeout(() => {
                                    $(this).remove();
                                }, 200);
                            });
                            $(form).find('.input-submit.placeholder').on('click', () => {
                                isValid && handleContinue();
                            });
                        }
                        else {
                            $(this).find('.signup-hero-plan-ctrl-btn.next').on('click', () => {
                                handleContinue();
                            });
                        }

                        $(this).find('.signup-hero-plan-ctrl-btn.prev').on('click', () => {
                            handleBack();
                        });
                    });
                    const handleContinue = () => {
                        if (this.currentStep <= $('.signup-hero-plan-step').length - 1) {
                            this.currentStep += 1;
                        }
                        this.updateScreenStep();
                    }
                    const handleBack = () => {
                        if (this.currentStep >= 0) {
                            this.currentStep -= 1;
                        }
                        this.updateScreenStep();
                    }
                }
                destroy() {
                    super.destroy();
                }
            }
        }
        const SuccessPage = {
            'success-hero-wrap': class extends TriggerSetup {
                constructor() {
                    super();
                    this.onTrigger = () => {
                        this.replaceHref();
                    };
                }
                replaceHref() {
                    const btnSuccess = $('.sb-completed-btn-wrap a')
                    console.log('btnSuccess', btnSuccess)
                    if (btnSuccess.length > 0) {
                        const isStaging = window.location.hostname.includes('webflow');
                        console.log('isStaging', isStaging)
                        btnSuccess.attr('href', `${isStaging ? 'https://dev.statekraft.ai' : 'https://statekraft.ai'}/`);
                        console.log('btnSuccess', btnSuccess)
                    }
                }

                destroy() {
                    super.destroy();
                }
            }
        }
        class PageManager {
            constructor(page) {
                if (!page || typeof page !== 'object') {
                    throw new Error('Invalid page configuration');
                }
                // Store registered component names to prevent duplicate registration
                this.registeredComponents = new Set();

                this.sections = Object.entries(page).map(([name, Component]) => {
                    if (typeof Component !== 'function') {
                        throw new Error(`Section "${name}" must be a class constructor`);
                    }

                    // Only register the custom element if not already registered
                    if (!this.registeredComponents.has(name)) {
                        try {
                            customElements.define(name, Component);
                            this.registeredComponents.add(name);
                        } catch (error) {
                            // Handle case where element is already defined
                            console.warn(`Custom element "${name}" is already registered`);
                        }
                    }

                    return new Component();
                });
            }

            // Method to cleanup sections if needed
            destroy() {
                this.sections.forEach(section => {
                    if (typeof section.destroy === 'function') {
                        section.destroy();
                    }
                });
            }
        }
        const pageName = $('.main-inner').attr('data-namespace');
        const pageConfig = {
            home: HomePage,
            signup: SignUpPage,
            success: SuccessPage
        };
        const registry = {};
        registry[pageName]?.destroy();
        documentHeightObserver("init");
        refreshOnBreakpoint();
        scrollTop(() => pageConfig[pageName] && (registry[pageName] = new PageManager(pageConfig[pageName])));
        AOS.init({
            offset: cvUnit(100, 'rem'),
            duration: 600,
            once: true,
        });
        console.log('registry', registry);
    }
    // ===========================================
    // PAGE ROUTER
    // ===========================================
    const page = window.location.pathname;

    console.log('🚀 Statekraft Integration loaded on:', page);

    // Helper function to safely update DOM elements
    const safeUpdateElement = (id, content, display = 'block') => {
        const element = document.getElementById(id);
        if (element) {
            if (content !== undefined) element.textContent = content;
            if (display !== undefined) element.style.display = display;
        } else {
            console.warn(`Element #${id} not found in DOM`);
        }
    };
    const ENV_CONFIG = {
        DEV: {
            okta: {
                domain: 'https://integrator-3290020.okta.com',
                issuer: 'https://integrator-3290020.okta.com/oauth2/default',
                clientId: '0oaz2445r7kQ1ESy5697',
            },
            api: {
                baseUrl: 'https://bff.dev.statekraft.ai/api/v1',
            },
            airwallex: {
                env: 'demo',
                clientId: '_ZlAu3UkQ16A0cLt0MTFjg',
            },
            googleIdpId: '0oaz64efvzuzicGZY697',
            microsoftIdpId: '0oaz75jv97zxDjksg697',
        },
        UAT: {
            okta: {
                domain: 'https://auth-uat.statekraft.au',
                issuer: 'https://auth-uat.statekraft.au/oauth2/default',
                clientId: '0oa7u5ab26jwOzj5L3l7',
            },
            api: {
                baseUrl: 'https://bff.uat.statekraft.ai/api/v1',
            },
            airwallex: {
                env: 'demo',
                clientId: '_ZlAu3UkQ16A0cLt0MTFjg',
            },
            googleIdpId: '0oa7u1lfd0LnqhJke3l7',
            microsoftIdpId: '0oaz75mm8cpS9cxtW697',
        },
        PRODUCTION: {
            okta: {
                domain: 'https://integrator-6196957.okta.com',
                issuer: 'https://integrator-6196957.okta.com/oauth2/default',
                clientId: '0oaz8b68nxs7NaVZM697',
            },
            api: {
                baseUrl: 'https://bff.prod.statekraft.ai/api/v1',
            },
            airwallex: {
                env: 'prod',
                clientId: "T0o6LEwDS2GGWQjvZQ9DAQ",
                currency: "AUD"
            },
            googleIdpId: '0oazgk22v9zIIdgxs697',
            microsoftIdpId: '0oazgkcih4xOSuRck697',
        }
    };

    let urlParams = getUrlParams();

    function getEnvConfig() {
        try {
            const isWebflow = window.location.hostname.includes('.webflow.io');
            const currentEnv = (
                urlParams.get('env') ||
                (isWebflow ? 'UAT' : 'PRODUCTION')
            ).toUpperCase();
            const envKey = ENV_CONFIG[currentEnv] ? currentEnv : 'UAT';

            return { envKey, envConfig: ENV_CONFIG[envKey], isDev: envKey === 'DEV', isUAT: envKey === 'UAT', isProduction: envKey === 'PRODUCTION' };
        } catch (e) {
            console.warn('Could not access window.location, defaulting to PRODUCTION:', e);
            return { envKey: 'PRODUCTION', envConfig: ENV_CONFIG['PRODUCTION'] };
        }
    }
    const { envKey, envConfig, isDev, isUAT, isProduction } = getEnvConfig();


    const updateLinksForNonProductionEnv = () => {
        if (envKey !== 'DEV' && envKey !== 'UAT') {
            return;
        }

        try {
            const anchors = document.querySelectorAll('a[href*="https://statekraft.ai/"],a[href*="https://statekraft.ai"]');
            anchors.forEach(anchor => {
                try {

                    if (envKey === 'DEV') {
                        anchor.href = 'https://dev.statekraft.ai';
                        console.log('Updated anchor href to:', anchor.href);
                    } else if (envKey === 'UAT') {
                        anchor.href = 'https://uat.statekraft.ai';
                        console.log('Updated anchor href to:', anchor.href);
                    }
                } catch (e) {
                    // Ignore invalid URLs
                    console.warn('Failed to update anchor href:', anchor.href, e);
                }
            });
        } catch (e) {
            console.warn('Failed to update links for non-production env:', e);
        }
    }

    updateLinksForNonProductionEnv();

    try {
        if (page === '/subscribe' || page === '/verify') {
            const urlParams = new URLSearchParams(window.location.search);
            const isVerifyWithError = page === '/verify' && urlParams.has('error');
            const shouldInitSubscription = !isVerifyWithError;

            if (isVerifyWithError) {
                console.log('📄 Verify page with error — skip SubscriptionFlow.init', urlParams.get('error'), urlParams.get('error_description'));
                const errorMessage = document.createElement('div');
                errorMessage.className = 'error-message-mail';
                errorMessage.textContent = "This code is invalid or has already been used." // decodeURIComponent(urlParams.get('error_description'));
                $('#okta-signin-widget-container').append(errorMessage);
                //style error message
                errorMessage.style.color = 'red';
                errorMessage.style.fontSize = '16px';
                errorMessage.style.fontWeight = 'medium';
                errorMessage.style.textAlign = 'center';
                errorMessage.style.padding = '24px 12px';
                errorMessage.style.marginTop = '5rem';
                errorMessage.style.textTransform = 'capitalize';

            } else {
                console.log(page === '/verify' ? '📄 Verify page' : '📄 Subscribe page detected');
                if (window.SubscriptionFlow) {
                    await window.SubscriptionFlow.init();
                } else {
                    console.error('❌ SubscriptionFlow not loaded');
                }
            }

            if (shouldInitSubscription) {
                const cycle = urlParams.get('cycle');
                if (cycle == 'annual') {
                    $('.signup-hero-main').removeClass('per-month').addClass('per-year');
                }
                $('.signup-hero .fade-up').addClass('anim');
            }
            function interact() {
                let firstClick = false;
                $('.sb-input-role').on('click', (e) => {
                    e.preventDefault();
                    $(e.target).closest('.sb-input-role-gr').find('.sb-signup-form-dropdown').slideToggle();
                    $(e.target).closest('.sb-input-role-gr').toggleClass('active');
                    setTimeout(() => {
                        if (!firstClick) {
                            firstClick = true;
                            if ($('.sb-signup-form-dropdown-inner').height() > $('.sb-signup-form-dropdown').height()) {
                                console.log('prevent');
                                $('.sb-signup-form-dropdown').attr('data-lenis-prevent', true);
                            }
                        }
                    }, 310);
                });
                $('.sb-input-role-gr .sb-signup-form-dropdown').on('click', '.sb-signup-form-dropdown-item', (e) => {
                    e.preventDefault();
                    $('.sb-signup-form-dropdown-item').removeClass('active');
                    $(e.target).addClass('active');
                    if (!$(e.target).closest('.sb-input-role-gr').find('.sb-input-role').hasClass('filled')) {
                        $(e.target).closest('.sb-input-role-gr').find('.sb-input-role').addClass('filled');
                    }
                    $(e.target).closest('.sb-signup-form-dropdown').slideUp();
                    let textVal = $(e.target).text();
                    let idVal = $(e.target).attr('data-value');
                    $('input[name="roleId"]').val(idVal);
                    $(e.target).closest('.sb-input-role-gr').find('.sb-input-role .sb-txt').text(textVal);
                });
            }
            interact();

        } else if (page === '/payment-callback') {
            console.log('💳 Payment callback page detected');
            if (window.SubscriptionFlow) {
                try {
                    await window.SubscriptionFlow.handlePaymentCallback();
                } catch (error) {
                    console.error('❌ Payment callback error:', error);
                    safeUpdateElement('error-message', error.message || 'Payment processing failed. Please contact support.', 'block');
                    safeUpdateElement('status-message', undefined, 'none');

                    // Fallback if elements don't exist
                    if (!document.getElementById('error-message')) {
                        alert('Payment verification failed: ' + (error.message || 'Please contact support'));
                    }
                }
            } else {
                console.error('❌ SubscriptionFlow not loaded');
            }

        } else if (page === '/callback') {
            console.log('🔐 OAuth callback page detected');
            if (window.SubscriptionFlow) {
                try {
                    await window.SubscriptionFlow.handleAuthCallback();
                } catch (error) {
                    console.error('❌ Auth callback error:', error);
                    safeUpdateElement('error-message', error.message, 'block');

                    // Fallback if elements don't exist
                    if (!document.getElementById('error-message')) {
                        alert('Authentication failed: ' + error.message);
                    }
                }
            } else {
                console.error('❌ SubscriptionFlow not loaded');
            }

        } else if (page === '/success') {
            console.log('✅ Success page detected');
            //Start  replacement of href
            const btnSuccess = $('.sb-completed-btn-wrap a')
            console.log('btnSuccess', btnSuccess)
            if (btnSuccess.length > 0) {
                btnSuccess.attr('href', `${isDev ? 'https://dev.statekraft.ai' : isUAT ? 'https://uat.statekraft.ai' : 'https://statekraft.ai'}/`);
                console.log('btnSuccess', btnSuccess)
            }
            //End replacement of href

            if (typeof subscriptionSuccess === 'function') {
                subscriptionSuccess();
            } else {
                console.warn('⚠️ subscriptionSuccess function not defined');
            }

        } else {
            console.log('ℹ️ Standard page - running main script');
            mainScript();
        }

    } catch (error) {
        console.error('❌ Critical integration error:', error);
        // Don't break the entire page, just log the error
        console.error('Stack trace:', error.stack);
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', script);
} else {
    // DOM already loaded
    script();
}


