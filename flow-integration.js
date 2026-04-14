/**
 * Statekraft Subscription Flow - Webflow Integration Bundle
 * 
 * Single-file integration for Webflow sites
 * Includes: Configuration, API Service, App Logic, Okta Widget, Payment Handling
 * 
 * Usage:
 * 1. Include this script in Webflow Custom Code
 * 2. Configure window.SubscriptionFlowConfig before this script
 * 3. Add HTML structure from WEBFLOW-INTEGRATION.md
 */

const ENV_CONFIG = {
    DEV: {
        okta: {
            // domain: 'https://integrator-3290020.okta.com',
            // issuer: 'https://integrator-3290020.okta.com/oauth2/default',
            // clientId: '0oaz2445r7kQ1ESy5697', 
            domain: 'https://auth-dev.statekraft.au',
            issuer: 'https://auth-dev.statekraft.au/oauth2/default',
            clientId: '0oa7uaeijjim9faNk3l7'
        },
        baseUrl: 'https://dev.statekraft.ai',
        api: {
            baseUrl: 'https://bff.dev.statekraft.ai/api/v1',
        },
        airwallex: {
            env: 'demo',
            clientId: '_ZlAu3UkQ16A0cLt0MTFjg',
        },
        googleIdpId: '0oa7u95b4zSC291Mz3l7',
        microsoftIdpId: '0oaz75jv97zxDjksg697',
    },
    UAT: {
        okta: {
            domain: 'https://auth-uat.statekraft.au',
            issuer: 'https://auth-uat.statekraft.au/oauth2/default',
            clientId: '0oa7u5ab26jwOzj5L3l7',
        },
        baseUrl: 'https://uat.statekraft.ai',
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
            domain: 'https://auth.statekraft.au',
            issuer: 'https://auth.statekraft.au/oauth2/default',
            clientId: '0oa7ot84g6mcBH52F3l7',
        },
        baseUrl: 'https://statekraft.ai',
        api: {
            baseUrl: 'https://bff.prod.statekraft.ai/api/v1',
        },
        airwallex: {
            env: 'prod',
            clientId: "T0o6LEwDS2GGWQjvZQ9DAQ",
            currency: "AUD"
        },
        googleIdpId: '0oa7u1758xy7zLvAt3l7',
        microsoftIdpId: '0oazgkcih4xOSuRck697',
    }
};

function getUrlParams() {
    try {
        const search = typeof window !== 'undefined' && window.location && window.location.search;
        return new URLSearchParams(search != null ? search : '');
    } catch (e) { /* fallback */ }
    try {
        if (typeof window !== 'undefined' && window.location && window.location.href) {
            return new URLSearchParams(new URL(window.location.href).search);
        }
    } catch (e2) { /* fallback */ }
    return new URLSearchParams();
}

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

function devLog(...args) {
    if (isDev) {
        console.log(...args);
    }
}

devLog('urlParams_________________', urlParams);

try {
    devLog(`Environment: ${envKey}`);
    devLog(`Hostname: ${window.location.hostname}`);
} catch (e) {
    devLog(`Environment: ${envKey}`);
}

window.SubscriptionFlowConfig = {
    // Okta Configuration
    okta: {
        domain: envConfig.okta.domain,
        issuer: envConfig.okta.issuer,
        clientId: envConfig.okta.clientId,
        redirectUri: `${window.location.origin}/callback`
    },

    // Backend API Configuration
    api: {
        baseUrl: envConfig.api.baseUrl,
    },

    // Airwallex Configuration
    airwallex: {
        env: envConfig.airwallex.env,
        clientId: envConfig.airwallex.clientId,
        returnUrl: `${window.location.origin}/payment-callback`,
        cancelUrl: `${window.location.origin}/subscribe`,
    },

    // Subscription Plan
    plan: {
        id: 'nest',
        name: 'Nest',
        price: {
            monthly: 49.50,
            annual: 495,
            original: 66
        },
        billingCycle: 'monthly'
    },

    // Callback Pages
    callbacks: {
        auth: '/callback',
        payment: '/payment-callback',
        success: '/success'
    }
};
(function (global) {
    'use strict';

    const plan = urlParams.get('plan');
    const cycle = urlParams.get('cycle');

    const baseSubscribeUrl = `${window.location.origin}/subscribe`;
    const subscribeParams = new URLSearchParams();

    if (isDev) {
        subscribeParams.append('env', 'dev');
    }
    if (plan) {
        subscribeParams.append('plan', plan);
    }
    if (cycle) {
        subscribeParams.append('cycle', cycle);
    }

    const subscribeRedirectUri = subscribeParams.toString()
        ? `${baseSubscribeUrl}?${subscribeParams.toString()}`
        : baseSubscribeUrl;

    const DEFAULT_CONFIG = {
        okta: {
            domain: '',
            issuer: '',
            clientId: '',
            redirectUri: subscribeRedirectUri,
            scopes: ['openid', 'profile', 'email'],
        },
        api: {
            baseUrl: '',
        },
        airwallex: {
            env: 'demo',
            clientId: '',
            returnUrl: '',
            cancelUrl: '',
        },
        plan: {
            id: 'nest',
            name: 'Nest',
            price: { monthly: 49.50, annual: 495, original: 66 },
            billingCycle: 'monthly',
        },
        callbacks: {
            auth: `/callback${subscribeParams.toString() ? `?${subscribeParams.toString()}` : ''}`,
            payment: `/payment-callback`,
            success: `/success${subscribeParams.toString() ? `?${subscribeParams.toString()}` : ''}`,
        },
    };

    let CONFIG = { ...DEFAULT_CONFIG };
    if (global.SubscriptionFlowConfig) {
        CONFIG = mergeDeep(DEFAULT_CONFIG, global.SubscriptionFlowConfig);
    }

    function mergeDeep(target, source) {
        const output = Object.assign({}, target);
        if (isObject(target) && isObject(source)) {
            Object.keys(source).forEach(key => {
                if (isObject(source[key])) {
                    if (!(key in target)) Object.assign(output, { [key]: source[key] });
                    else output[key] = mergeDeep(target[key], source[key]);
                } else {
                    Object.assign(output, { [key]: source[key] });
                }
            });
        }
        return output;
    }

    function isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    }


    const Storage = {
        keys: {
            selectedPlan: 'sk_webflow_selected_plan',
            billingCycle: 'sk_webflow_billing_cycle',
            formData: 'sk_webflow_form_data',
            tokens: 'sk_webflow_tokens',
            user: 'sk_webflow_user',
            sessionToken: 'sk_webflow_session_token',
            oktaResetState: 'sk_webflow_okta_reset_state',
        },
        setItem(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                console.warn('Storage setItem failed:', e);
            }
        },
        getItem(key) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : null;
            } catch (e) {
                return null;
            }
        },
        removeItem(key) {
            try {
                localStorage.removeItem(key);
            } catch (e) { }
        },
        clear() {
            Object.values(this.keys).forEach(key => {
                this.removeItem(key);
                sessionStorage.removeItem(key);
            });
        },
        // Clear all subscription/sign-up related data including Airwallex and email verify
        clearRegistrationPath() {
            this.clear();
            try {
                [
                    'payment_verified',
                    // Stripe (DEV)
                    'stripe_session_id',
                    // Airwallex (UAT/PROD legacy)
                    'awx_session_token',
                    'awx_payment_intent_id',
                    // Email verify
                    'email_verify_otp',
                    'email_verify_state'
                ].forEach(k => sessionStorage.removeItem(k));
            } catch (e) { }
        },
    };

    // ===========================================
    // API SERVICE
    // ===========================================
    const API = {
        async _fetchWithRetry(url, options, accessToken, isRetry = false) {
            const response = await fetch(url, options);

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                if (response.status === 404 && isRetry) {
                    window.location.reload();
                    return
                }
                if ((response.status === 404 || response.status === 400) && !isRetry) {
                    Storage.removeItem(Storage.keys.sessionToken);

                    await this.initiateAuthenticatedSubscription(
                        accessToken,
                        CONFIG.plan.id,
                        CONFIG.plan.billingCycle
                    );

                    const newSessionToken = Storage.getItem(Storage.keys.sessionToken);
                    // const newUrl = url.replace(/\/[^\/]+(\?|$)/, `/${newSessionToken}$1`);
                    return this._fetchWithRetry(url, options, accessToken, true);
                }
                devLog('error_________________', error)
                throw error
            }

            return response.json();
        },
        async getAuthConfig() {
            try {
                const response = await fetch(`${CONFIG.api.baseUrl}/auth/config`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                if (!response.ok) {
                    throw new Error('Failed to get auth config');
                }
                devLog({ ...envConfig[''] })
                const data = await response.json();
                envConfig.okta = {
                    domain: data.domain,
                    issuer: data.issuer,
                    // clientId: data.clientId,
                    scopes: data.scopes,
                };
                devLog(envConfig)
            } catch (error) {
                console.error('Error getting auth config:', error)
            }
        },
        async getPaymentConfig() {
            try {
                const response = await fetch(`${CONFIG.api.baseUrl}/payments/config`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                if (!response.ok) {
                    throw new Error('Failed to get env config');
                }
                const data = await response.json();
                envConfig.stripe = {
                    publishableKey: data.publishableKey,
                };
                devLog(envConfig)
            } catch (error) {
                console.error('Error getting payment config:', error)
            }
        },
        getAccessToken() {
            const tokens = Storage.getItem(Storage.keys.tokens);
            if (!tokens?.accessToken) return null;
            return typeof tokens.accessToken === 'string'
                ? tokens.accessToken
                : tokens.accessToken?.accessToken || tokens.accessToken?.value;
        },
        setAccessToken(token) {
            Storage.setItem(Storage.keys.tokens, {
                accessToken: token,
            });
        },
        logout: async function () {
            try {
                if (AppState.widget && AppState.widget.authClient) {
                    try {
                        await AppState.widget.authClient.signOut({
                            postLogoutRedirectUri: `${window.location.origin}/subscribe${subscribeParams.toString() ? `?${subscribeParams.toString()}` : ''}`,
                        });
                        Storage.clear();
                        AppState.user = null;
                        AppState.tokens = null;
                        AppState.formData = {};
                        AppState.currentStep = 0; // avoid beforeunload "leave page" popup after logout
                        devLog('Okta session was clear');

                    } catch (err) {
                        const msg = String(err?.errorCode || err?.message || '');
                        if (msg.includes('id_token_does_not_match_session')) {
                            // Session on Okta side already gone / mismatched; treat as logged out
                            console.warn('Okta signOut id_token_does_not_match_session; ignoring and continuing logout.');
                        } else {
                            throw err;
                        }
                    }
                } else {
                    console.warn('Widget or authClient is not ready');
                    Storage.clear();
                    AppState.user = null;
                    AppState.tokens = null;
                    AppState.formData = {};
                    AppState.currentStep = 0;
                }
            } catch (error) {
                console.error('Error when logout:', error);
                // Still reset so "leave page" popup does not show
                AppState.currentStep = 0;
            }
        },
        async initiateAuthenticatedSubscription(accessToken, plan, billingCycle) {
            try {
                // If session token is already set, don't initiate a new session 
                // const sessionToken = Storage.getItem(Storage.keys.sessionToken);
                // if (sessionToken) {
                //     devLog('sessionToken already exists_________________')
                //     return {
                //         sessionToken: sessionToken,
                //     }
                // }
                devLog('initiateAuthenticatedSubscription_________________')
                const response = await fetch(`${CONFIG.api.baseUrl}/subscriptions/initiate-authenticated`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({
                        accountType: 'individual',
                        tier: plan,
                        billingCycle,
                    }),
                });

                if (!response.ok) {
                    const error = await response.json().catch(() => ({}));

                    throw error;
                }

                const data = await response.json();
                if (data.sessionToken) {
                    Storage.setItem(Storage.keys.sessionToken, data.sessionToken);
                }
                return data;
            } catch (e) {
                if (e?.errorCode?.includes("ACTIVE_SUBSCRIPTION_EXISTS")) {
                    const signInUrl = typeof envConfig !== 'undefined' && envConfig.baseUrl ? envConfig.baseUrl : '/';
                    UI.showAlreadyRegisteredModal(signInUrl);
                    return
                } else if (e.message && (e.message.includes('expired') || e.message.includes('Invalid')) || e.statusCode === 401) {
                    // If token expired, clear and re-auth  
                    devLog('🔄 Token expired - clearing auth state', accessToken);
                    // await API.logout()
                    return
                }
            }
        },

        async getRoleItem(accessToken) {
            const response = await fetch(`${CONFIG.api.baseUrl}/subscriptions/job-roles/types`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                }
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || 'Failed to get role items');
            }

            const data = await response.json();
            if (data.roleTypes?.length > 0) {
                UI.updateUIRoleItems(data.roleTypes);
            }
            return data;
        },

        async getMySubscription() {
            const accessToken = this.getAccessToken();

            return this._fetchWithRetry(
                `${CONFIG.api.baseUrl}/subscriptions/my-subscription`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`,
                    }
                },
                accessToken
            );
        },

        async getCurrentRole() {
            const sessionToken = Storage.getItem(Storage.keys.sessionToken);
            if (!sessionToken) throw new Error('No subscription session found');

            const accessToken = this.getAccessToken();

            const data = await this._fetchWithRetry(
                `${CONFIG.api.baseUrl}/subscriptions/job-role/${sessionToken}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`,
                    }
                },
                accessToken
            );

            if (data.jobRoleId && data.jobRoleName) {
                UI.updateUICurrentRole(data.jobRoleName, data.jobRoleId);
            }
            return data;
        },
        async loginWithEmail() {

            const params = new URLSearchParams({
                redirect_url: subscribeRedirectUri,
                idp: envConfig.googleIdpId,
                prompt: 'login',
                platform: 'mobile',
            })

            const loginUrl = `${CONFIG.api.baseUrl}/auth/login?${params.toString()}`
            window.location.href = loginUrl
        },

        async handleLoginCallback() {
            const token = urlParams.get('token');
            const error = urlParams.get('error');

            if (error) throw new Error(`OAuth authentication failed: ${error}`);
            if (!token) return null;

            this.setAccessToken(token);

            const accessToken = this.getAccessToken();
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            };

            const accessCheck = await this._fetchWithRetry(
                `${CONFIG.api.baseUrl}/subscriptions/check-access`,
                { method: 'GET', headers },
                accessToken
            );

            if (!accessCheck?.hasActiveSubscription) {
                throw new Error('Subscription required');
            }

            const userInfo = await this._fetchWithRetry(
                `${CONFIG.api.baseUrl}/users/me`,
                { method: 'GET', headers },
                accessToken
            );

            Storage.setItem(Storage.keys.user, userInfo);
            return userInfo;
        },

        async updateRoleUser(roleId) {
            const sessionToken = Storage.getItem(Storage.keys.sessionToken);
            if (!sessionToken) throw new Error('No subscription session found');

            const accessToken = this.getAccessToken();
            devLog('roleId', roleId);
            return this._fetchWithRetry(
                `${CONFIG.api.baseUrl}/subscriptions/job-role`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({
                        jobRoleId: roleId.toString(),
                        sessionToken: sessionToken,
                    }),
                },
                accessToken
            );
        },

        async updatePersonalDetails(details) {
            const sessionToken = Storage.getItem(Storage.keys.sessionToken);
            if (!sessionToken) throw new Error('No subscription session found');

            const accessToken = this.getAccessToken();

            return this._fetchWithRetry(
                `${CONFIG.api.baseUrl}/subscriptions/personal-details`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({
                        sessionToken,
                        ...details,
                    }),
                },
                accessToken
            );
        },

        async updatePaymentDetails(details) {
            const sessionToken = Storage.getItem(Storage.keys.sessionToken);
            if (!sessionToken) throw new Error('No subscription session found');

            const accessToken = this.getAccessToken();

            return this._fetchWithRetry(
                `${CONFIG.api.baseUrl}/subscriptions/payment-details`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({
                        sessionToken,
                        ...details,
                    }),
                },
                accessToken
            );
        },

        async createCheckoutSession() {
            const sessionToken = Storage.getItem(Storage.keys.sessionToken);
            if (!sessionToken) throw new Error('No subscription session found');

            const accessToken = this.getAccessToken();
            const plan = CONFIG.plan.id;
            const cycle = CONFIG.plan.billingCycle;
            const successUrl = `${window.location.origin}/payment-callback${subscribeParams.toString() ? `?${subscribeParams.toString()}` : ''}`;
            subscribeParams.append('action', 'continue_signup');
            subscribeParams.append('payment_status', 'cancelled');
            const cancelUrl = `${window.location.origin}/subscribe${subscribeParams.toString() ? `?${subscribeParams.toString()}` : ''}`;
            return this._fetchWithRetry(
                `${CONFIG.api.baseUrl}/payments/checkout`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        // 'Authorization': `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({
                        sessionToken,
                        successUrl,
                        cancelUrl,
                    }),
                },
                accessToken
            );
        },

        async createPaymentIntent() {
            const sessionToken = Storage.getItem(Storage.keys.sessionToken);
            if (!sessionToken) throw new Error('No subscription session found');

            const accessToken = this.getAccessToken();

            return this._fetchWithRetry(
                `${CONFIG.api.baseUrl}/payments/create-intent`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({ sessionToken }),
                },
                accessToken
            );
        },

        async confirmPayment(stripeSessionId) {
            const sessionToken = Storage.getItem(Storage.keys.sessionToken);
            if (!sessionToken) throw new Error('No subscription session found');

            const accessToken = this.getAccessToken();

            return this._fetchWithRetry(
                `${CONFIG.api.baseUrl}/payments/confirm`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        // 'Authorization': `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({
                        sessionToken,
                        stripeSessionId,
                    }),
                },
                accessToken
            );
        },

        async confirmAirwallexPayment(paymentIntentId, cardLast4 = null) {
            const sessionToken = Storage.getItem(Storage.keys.sessionToken);
            if (!sessionToken) throw new Error('No subscription session found');

            const accessToken = this.getAccessToken();

            return this._fetchWithRetry(
                `${CONFIG.api.baseUrl}/payments/confirm`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({
                        sessionToken,
                        paymentIntentId,
                        cardLast4,
                    }),
                },
                accessToken
            );
        },

        async applyDiscount(discountCode) {
            const sessionToken = Storage.getItem(Storage.keys.sessionToken);
            if (!sessionToken) throw new Error('No subscription session found');

            const accessToken = this.getAccessToken();

            return this._fetchWithRetry(
                `${CONFIG.api.baseUrl}/subscriptions/apply-discount`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({
                        sessionToken,
                        discountCode,
                    }),
                },
                accessToken
            );
        },
        async getTokenOktaFromMobile(token) {
            //  /auth/okta-token  
            const response = await fetch(`${CONFIG.api.baseUrl}/auth/okta-token`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });



            if (!response.ok) {
                throw new Error('Failed to get token from mobile');
            }

            return response.json();
        },
        async checkSubscription() {
            const accessToken = this.getAccessToken();
            if (!accessToken) return;
            const response = await this._fetchWithRetry(`${CONFIG.api.baseUrl}/subscriptions/check-access`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            }, accessToken);
            return response;
        },
        async checkSessionStatus(sessionToken) {
            if (!sessionToken) {
                // throw new Error('Session token is required');
            }

            const accessToken = this.getAccessToken();
            if (!accessToken) {
                // throw new Error('Access token is required');
            }

            try {
                const response = await this._fetchWithRetry(`${CONFIG.api.baseUrl}/subscriptions/session/${sessionToken}`, { method: 'GET' }, accessToken);

                if (!response.ok) {
                    throw new Error(`Failed to check session: ${response.status}`);
                }

                return response;
            } catch (error) {
                console.error('Error checking session status:', error);
                return {
                    valid: false,
                    expired: true,
                    error: error.message || 'Failed to check session status',
                };
            }
        },

        async cleanupIncompleteRegistration() {
            const accessToken = this.getAccessToken();
            if (!accessToken) return;

            try {
                const res = await fetch(`${ENV_CONFIG[envKey].api.baseUrl}/subscriptions/cleanup-incomplete-registration`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    keepalive: true
                });
                devLog('res_________________', res)
                if (res.ok) {
                    devLog('✅ Incomplete registration cleaned up');
                    await API.logout();
                }
            } catch (err) {
                throw err;
            }
        },


        async saveIncompleteSignup(payload) {
            try {
                const response = await fetch(`${CONFIG.api.baseUrl}/marketing/incomplete-signup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                if (!response.ok) {
                    console.warn('saveIncompleteSignup failed:', response.status);
                }
            } catch (e) {
                console.warn('saveIncompleteSignup error:', e);
            }
        },

    };
    // ===========================================
    // APPLICATION STATE
    // ===========================================
    const AppState = {
        currentStep: 1,
        selectedPlan: null,
        billingCycle: 'monthly',
        formData: {},
        user: null,
        tokens: null,
        widget: null,
        /** Current Okta widget controller (e.g. 'primary-auth', 'registration') - for controlling step render/transition */
        oktaController: null,
        /** Current Okta widget step from context.step - sub-step within controller */
        oktaStep: null,
        /** Previous controller, to detect step changes and avoid duplicate setup */
        oktaControllerPrev: null,
        /** Lazy-bound DOM form handlers (e.g. when goToStep runs before forms exist at first init) */
        formsBound: {
            personalDetails: false,
            personalRole: false,
            addressActions: false,
        },
    };



    // ===========================================
    // UI HELPERS
    // ===========================================
    const UI = {
        updateUIRoleItems(roleItems) {
            let itemUI = $('.sb-signup-form-dropdown-item').eq(0).clone();
            $('.sb-signup-form-dropdown-inner').empty();
            roleItems.forEach(roleItem => {
                let itemUIClone = itemUI.clone();
                itemUIClone.text(roleItem.name).attr('data-value', roleItem.id);
                $('.sb-signup-form-dropdown-inner').append(itemUIClone);
                itemUIClone.on('click', () => {
                    UI.hideError('step2Error');
                    devLog('click_________________', roleItem.name)
                })
            });

        },
        setAddressActionCheck() {
            if (AppState.formsBound.addressActions) return;
            const addressActionCheck = document.querySelector('#bussiness-address');
            const trialGroupInput = document.querySelector('#trial-sub');
            if (!trialGroupInput) return;

            let oldValueOfAddress = '';
            let oldCodeOfDiscount = '';

            addressActionCheck?.addEventListener('click', (e) => {
                const personalForm = document.querySelector('#personalDetailsForm');
                const address = personalForm.querySelector('[name="address"]');
                const invoiceAddress = personalForm.querySelector('[name="invoiceAddress"]');

                addressActionCheck.classList.toggle('active')
                const addressValue = address.value;
                if (addressActionCheck.classList.contains('active')) {
                    if (oldValueOfAddress !== addressValue) {
                        oldValueOfAddress = addressValue;
                    }
                    addressValue && (invoiceAddress.value = addressValue)
                } else {
                    if (oldValueOfAddress !== addressValue) {
                        invoiceAddress.value = oldValueOfAddress;
                        oldValueOfAddress = '';
                    }
                }
            })

            trialGroupInput.addEventListener('click', () => {
                const personalForm = document.querySelector('#personalDetailsForm');
                const discountInput = personalForm.querySelector('[name="discountCode"]');

                trialGroupInput.classList.toggle('active')

                if (trialGroupInput.classList.contains('active')) {
                    if (oldCodeOfDiscount !== 'FREEFIRSTMONTH' && discountInput.value) {
                        oldCodeOfDiscount = discountInput.value || ''
                    }
                    discountInput && (discountInput.value = 'FREEFIRSTMONTH')
                } else {
                    discountInput.value = oldCodeOfDiscount || '';
                }
            })
            AppState.formsBound.addressActions = true;
        },
        updateUIShowProgressIndicator() {
            const hideProgressIncaditor = document.querySelector('.sb-progress-indicator')
            devLog('hideProgressIncaditor', hideProgressIncaditor)
            if (hideProgressIncaditor) hideProgressIncaditor.classList.add('active')
        },
        updateUICurrentRole(roleName, roleId) {
            if (roleName && roleId) {
                $('.sb-input-role .sb-txt').text(roleName);
                $('.sb-input-role input[name="roleId"]').val(roleId);
                $('.sb-input-role').addClass('filled');
                $('.sb-signup-form-dropdown-item[data-value="' + roleId + '"]').addClass('active');
            }
        },
        setupOverrideUIForOktaWidget(controller) {
            if (controller === 'primary-auth') {
                const titleSignIn = document.querySelector('.okta-form-title.o-form-head');
                if (titleSignIn) {
                    titleSignIn.textContent = 'Create new account';

                    // Add a subtitle right under the main okta title (idempotent)
                    let subTitle = document.querySelector('.okta-form-subtitle.custom-subtitle');
                    if (!subTitle) {
                        subTitle = document.createElement('h3');
                        subTitle.className = 'okta-form-title custom-subtitle';
                        subTitle.style.marginBottom = '2.4rem';
                        subTitle.style.color = 'var(--_color---primary--orange) !important';
                        subTitle.textContent = '$0 for your first month';
                        titleSignIn.insertAdjacentElement('afterend', subTitle);
                    }
                }
            }

            const wrapIdp = document.querySelector('.sign-in-with-idp');
            const btnSignIn = document.querySelector('#okta-sign-in .siw-main-footer .footer-info .signup-info .signup-link .link');
            const btnGoogleIdp = document.querySelector('.social-auth-button.social-auth-google-button.link-button');
            if (!wrapIdp?.parentElement) return;

            var baseUrl = ENV_CONFIG[envKey]?.baseUrl || '#';
            var dataUriGoogle = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAYAAADEtGw7AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAALOSURBVHgBnZRNSFRRFMfPvfe9Nx+m4wcVQYtZlGYtQgYcF31oYFSSBImkhkREBQVJLQx1oVC6qYXZxyKQoBCMSEXIygTB1DCEFn4UJkS4KPwAFefrvXtvd57OzJvxOWPzhzvvvnPv+c05Z+YcgMRCkITiOeHh43k3cu22e4jSNI1x3agQDGLn82u0YffA14f/A8YzJ93Xs4C3aZRjiCMbxqBI5K6lb+SBeKXxwHjhVME0U2k2bFPBPCyp1rr07qGWrcDSQrF7kjGWbeYsYwRcbCjn0Xa7tS2zd6hGbFlUhOFLpccaTKBclnDPtdmZjMz+MZT1aQyVz87bVgl5JfKmW0GNEaMl9xGm7fCHD6wyYUXzqnV8fFwFc6GNxcwOpeAHHZFqAUZh8f5hBj6CKQeW9v6LvJVTKJuNZSq9FJyhRubBkHFrAtuL/lKvXW5PAE0ovRR0WObMGzEWX1Ftg7/AF3u55InGtUB84Nr8aM3n5qOteim4AYFEDmbQoAIeDWhAi8cFJWVviXi0YvMckhdnTCesgy2GA/E/ulQI6WZOWHQaJtGLx/yAWFKmgk+9FH4FVhQfpHER7uO1XPhx+8ALGOw8F8NFH+4om/IpbJr7jqT0nND7n6n+d+GIJ35DPcIcihbP8A7vPlA9WikcAiU2S9gsgoljf+QC55MvL38Mg91l6tOcxQrm5yTcMAUtFV4wdKaJ8OlH3gAgFL6DgC2HAggZ2U4pcNPopXkC2NVxXi3oq3zudDqtIbvL5ZLz2ksb8rvKVXUpAgXGtOW3J3ZFvsQQgbvnwjT1qqaTDYkhBMFBpEX6hpMVcPzsEFAbOJyouasqpd4MrMPz35RPM237Y1O4cAer7hyoPHsRDDM5toZsrOz1Qeue1CYs4cRIhTBiQ9UCWgUJBn3Umbu7opZz1ogQsjD/eschhQC2kGXf3Grdt6u9zyDOIEpGCfvzH322C1n+WxqoAAAAAElFTkSuQmCC';

            // Google icon: only add if not already present (safe for multiple calls)
            if (btnGoogleIdp && !btnGoogleIdp.querySelector('img[alt="Google"]')) {
                var imgGoogle = document.createElement('img');
                imgGoogle.src = dataUriGoogle;
                imgGoogle.alt = 'Google';
                imgGoogle.width = 22;
                imgGoogle.height = 22;
                imgGoogle.style.marginRight = '0.8rem';
                btnGoogleIdp.textContent = 'Continue with Google'
                btnGoogleIdp.prepend(imgGoogle);


                btnGoogleIdp.href = '#';
                btnGoogleIdp.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    API.loginWithEmail();
                });
            }
            if (btnSignIn) {
                btnSignIn.textContent = 'Continue with email';
                // Override action from okta widget
            }

            // Footer "Sign in here": remove previous instance to avoid duplicates
            var parent = wrapIdp.parentElement;
            var prevFooter = parent.querySelector('.wrap-footer-content');
            if (prevFooter) prevFooter.remove();

            var wrapFooterContent = document.createElement('div');
            wrapFooterContent.className = 'wrap-footer-content';
            wrapFooterContent.style.cssText = 'text-align:center;margin-top:1.6rem;';
            wrapFooterContent.innerHTML = 'Already have an account? <a class="btn-sign-in-here" href="' + baseUrl + '" target="_blank" rel="noopener noreferrer">Sign in here</a>';

            var linkSignIn = wrapFooterContent.querySelector('.btn-sign-in-here');
            if (linkSignIn) {
                linkSignIn.addEventListener('click', function (e) {
                    e.preventDefault();
                    const isIos = navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad') || navigator.userAgent.includes('iPod');
                    var isMobile = localStorage.getItem('from') === 'mobile' || isIos;
                    if (isMobile) {
                        window.location.href = 'statekraft://callback';

                        setTimeout(function () {
                            if (document.hasFocus()) {
                                window.location.href = baseUrl;
                            }
                        }, 1500);
                    } else {
                        window.open(baseUrl, '_blank', 'noopener,noreferrer');
                    }
                });
            }

            parent.appendChild(wrapFooterContent);
        },

        goToStep(step) {
            AppState.currentStep = step;
            let offset;
            let newStep;
            let stepAfterRemoveRole;
            const track = document.getElementById('sliderTrack');
            if (track) {
                // New flow will remove step 2 (choose role), backup to change here, just change offset to show, not change in webflow 

                newStep = step > 2 ? step - 1 : step;
                offset = (newStep - 1) * -100;

                devLog('offset__', offset)
                track.style.transform = `translateX(${offset}%)`;
            }

            document.querySelectorAll('.slide').forEach((slide, index) => {
                slide.classList.toggle('active', index === newStep - 1);
            });

            document.querySelectorAll('.progress-dot').forEach((dot, index) => {
                dot.classList.remove('active', 'completed');
                if (index < newStep - 1) {
                    dot.classList.add('completed');
                } else if (index === newStep - 1) {
                    dot.classList.add('active');
                }
            });

            document.querySelectorAll('.progress-line').forEach((line, index) => {
                line.classList.toggle('active', index < step - 1);
            });

            if (step >= 2) {
                ensureSignupFormHandlers();
                UI.setAddressActionCheck();
            }
        },
        goToStepOkta({ step, currentStep, action = 'next' }) {
            AppState.oktaController = step || currentStep;
            const buttonBack = document.querySelector('.sb-btn.sc-btn-sub.sb-form-back');
            if (!buttonBack) return;

            const handleBackButtonClick = (e) => {
                e.preventDefault();
                if (action === 'back') {
                    if (AppState.oktaController === 'registration' && AppState.widget) {
                        try {
                            AppState.widget.showSignIn({ el: '#okta-signin-widget-container' });
                        } catch (err) {
                            console.warn('Widget showSignIn (back to login):', err);
                        }
                    }
                }
            };

            buttonBack.replaceWith(buttonBack.cloneNode(true));
            document.querySelector('.sb-btn.sc-btn-sub.sb-form-back').addEventListener('click', handleBackButtonClick);
        },


        showError(elementId, message) {
            const el = document.getElementById(elementId);
            if (el) {
                el.textContent = message;
                el.classList.add('show');
            }
        },

        hideError(elementId) {
            const el = document.getElementById(elementId);
            if (el) el.classList.remove('show');
        },

        setButtonLoading(button, loading) {
            if (button) {
                button.classList.toggle('loading', loading);
                button.disabled = loading;
            }
        },

        showLoading(text = 'Processing...') {
            const textEl = document.getElementById('loadingText');
            const overlay = document.getElementById('loadingOverlay');
            if (textEl) textEl.textContent = text;
            if (overlay) overlay.classList.add('show');
        },

        hideLoading() {
            const overlay = document.getElementById('loadingOverlay');
            if (overlay) overlay.classList.remove('show');
        },

        // Show modal when user already has a subscription (ACTIVE_SUBSCRIPTION_EXISTS). Registration path is for new users only.
        showAlreadyRegisteredModal(signInUrl) {
            const message = 'This account is already registered. Please go to the sign in page to log in.';
            devLog('showAlreadyRegisteredModal', { signInUrl });

            const closeAndLogout = () => {
                const modal = document.getElementById('sb-already-registered-modal');
                if (!modal) return;
                if (modal.classList.contains('done')) return;
                modal.classList.add('done');
                setTimeout(() => {
                    modal.style.display = 'none';
                    API.logout();
                }, 200);
            };

            let el = document.getElementById('sb-already-registered-modal');
            if (el) {
                el.querySelector('.sb-already-registered-message').textContent = message;
                el.querySelector('.sb-already-registered-go').onclick = (e) => {
                    e.preventDefault();
                    API.logout();
                    window.location.href = signInUrl;
                };
                const backdrop = el.querySelector('.sb-already-registered-backdrop');
                const closeBtn = el.querySelector('.sb-already-registered-close');
                if (backdrop) backdrop.onclick = closeAndLogout;
                if (closeBtn) closeBtn.onclick = closeAndLogout;
                el.style.display = '';
                return;
            }
            el = document.createElement('div');
            el.id = 'sb-already-registered-modal';
            el.setAttribute('role', 'dialog');
            el.setAttribute('aria-modal', 'true');
            el.innerHTML =
                '<div class="sb-already-registered-backdrop"></div>' +
                '<div class="sb-already-registered-box">' +
                '<button type="button" class="sb-already-registered-close" aria-label="Close">×</button>' +
                '<p class="sb-already-registered-message">' + message + '</p>' +
                '<p class="sb-already-registered-hint">Registration is for new accounts only. Use the app to sign in or manage your subscription.</p>' +
                '<div class="sb-already-registered-actions">' +
                '<a href="' + signInUrl + '" class="sb-already-registered-go sb-btn sc-btn-brand">Go to Sign in</a>' +
                '</div></div>';
            const style = document.createElement('style');
            style.textContent =
                // Use max-ish z-index to avoid being hidden behind Webflow/Okta overlays
                '#sb-already-registered-modal{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:1rem;opacity:1;transition:opacity 0.2s ease-out;}' +
                '#sb-already-registered-modal.done{opacity:0;}' +
                '.sb-already-registered-backdrop{position:absolute;inset:0;background:rgba(0,0,0,0.5);cursor:pointer;}' +
                '.sb-already-registered-box{position:relative;background:#fff;border-radius:1.2rem;padding:2rem;max-width:420px;box-shadow:0 4px 20px rgba(0,0,0,0.2);}' +
                '.sb-already-registered-close{position:absolute;top:1rem;right:1rem;width:3.2rem;height:3.2rem;padding:0;border:none;background:transparent;font-size:2.4rem;line-height:1;color:#666;cursor:pointer;border-radius:0.4rem;}' +
                '.sb-already-registered-close:hover{color:#333;background:rgba(0,0,0,0.06);}' +
                '.sb-already-registered-message{margin:0 0 0.5rem;font-size:2.4rem;font-weight: 600; line-height:1.5;color:#333; text-align:center;}' +
                '.sb-already-registered-hint{margin:0 0 1.25rem;font-size:1.6rem;color:#666; text-align:center;}' +
                '.sb-already-registered-actions{display:flex;justify-content:flex-end;}' +
                '.sb-already-registered-go{font-size:1.6rem;font-weight: 600; line-height:1.5;color:#fff; text-align:center;}';

            document.head.appendChild(style);
            const goBtn = el.querySelector('.sb-already-registered-go');
            goBtn.onclick = (e) => {
                e.preventDefault();
                // API.logout();
                window.location.href = signInUrl;
            };
            el.querySelector('.sb-already-registered-backdrop').onclick = closeAndLogout;
            el.querySelector('.sb-already-registered-close').onclick = closeAndLogout;
            // Append safely even if body isn't available yet
            (document.body || document.documentElement).appendChild(el);
        },

        updatePriceDisplays() {
            const price = CONFIG.plan.price[AppState.billingCycle];
            const originalPrice = CONFIG.plan.price.original;

            ['displayPrice', 'step2Price', 'confirmPrice'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = price.toFixed(2);
            });

            ['displayOriginalPrice'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = originalPrice.toFixed(2);
            });
        },

        prefillForms() {
            const data = AppState.formData;
            const user = AppState.user;

            if (user) {
                const fullName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim();
                const nameInput = document.getElementById('fullName');
                if (nameInput) nameInput.value = data.fullName || fullName || '';
            }

            ['address', 'phoneNumber', 'abn', 'businessInfo', 'invoiceAddress', 'discountCode'].forEach(id => {
                const input = document.getElementById(id);
                if (input && data[id]) input.value = data[id];
            });
        },

        updateConfirmationPage() {
            const data = AppState.formData;
            const user = AppState.user;

            const setText = (id, value) => {
                const el = document.getElementById(id);
                if (el) el.textContent = value || '-';
            };
            devLog('user_________________', user)
            devLog('data_________________', data)

            setText('confirmUsername', user?.username || data.username);
            setText('confirmFullName', data.fullName);
            setText('confirmEmail', user?.email || data.email);
            setText('confirmPhoneNumber', user?.phoneNumber || data?.phoneNumber || '-');
            setText('confirmBusinessInfo', data.businessInfo || '-');
            setText('confirmInvoiceAddress', data.invoiceAddress || '-');
            setText('confirmDiscountCode', data.discountCode || '-');
        },

        updateSuccessPage() {
            const plan = AppState.selectedPlan || CONFIG.plan;
            const price = CONFIG.plan.price[AppState.billingCycle];
            const interval = AppState.billingCycle === 'monthly' ? 'month' : 'year';

            const planEl = document.getElementById('successPlan');
            if (planEl) planEl.textContent = plan.name || CONFIG.plan.name;

            const amountEl = document.getElementById('successAmount');
            if (amountEl) amountEl.textContent = `$${price.toFixed(2)}/${interval}`;

            const nextBillingEl = document.getElementById('successNextBilling');
            if (nextBillingEl) {
                const nextBilling = new Date();
                if (AppState.billingCycle === 'monthly') {
                    nextBilling.setMonth(nextBilling.getMonth() + 1);
                } else {
                    nextBilling.setFullYear(nextBilling.getFullYear() + 1);
                }
                nextBillingEl.textContent = nextBilling.toLocaleDateString('en-AU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                });
            }

            this.updateSuccessPageFeatures();
        },

        updateSuccessPageFeatures() {
            const planDetails = AppState.planDetails;
            if (!planDetails?.features) return;

            const featuresContainer = document.getElementById('successFeatures');
            if (!featuresContainer) return;

            const features = planDetails.features;
            const featuresList = [];

            if (features.billTrackingLimit > 0) {
                featuresList.push(`Track up to ${features.billTrackingLimit === -1 ? 'unlimited' : features.billTrackingLimit} bills`);
            }
            if (features.canExportData) {
                featuresList.push('Export data in ' + (features.exportFormats?.join(', ') || 'multiple formats'));
            }
            if (features.canAccessHistoricalData) {
                featuresList.push(`${features.historicalDataMonths || 12} months historical data`);
            }
            if (features.realTimeAlertsEnabled) {
                featuresList.push('Real-time alerts');
            }
            if (features.canUseAdvancedSearch) {
                featuresList.push('Advanced search');
            }

            featuresContainer.innerHTML = featuresList.map(f => `<li>✓ ${f}</li>`).join('');
        },

        updateSubscriptionStatus(subscription, access) {
            const statusEl = document.getElementById('subscriptionStatus');
            if (!statusEl) return;

            let statusText = subscription?.status || 'Active';
            let statusClass = 'active';

            if (!access?.accessible) {
                statusClass = 'warning';
                switch (access?.reason) {
                    case 'trial_expired':
                        statusText = 'Trial Expired';
                        break;
                    case 'subscription_expired':
                        statusText = 'Expired';
                        break;
                    case 'subscription_paused':
                        statusText = 'Paused';
                        break;
                    default:
                        statusText = access?.reason || 'Inactive';
                }
            } else if (subscription?.status === 'TRIAL') {
                statusClass = 'trial';
                if (access.daysRemaining) {
                    statusText = `Trial (${access.daysRemaining} days left)`;
                }
            } else if (access.daysRemaining && access.daysRemaining < 7) {
                statusClass = 'warning';
                statusText = `Active (renews in ${access.daysRemaining} days)`;
            }

            const statusBadge = document.createElement('span');
            statusBadge.className = `status-badge status-${statusClass}`;
            statusBadge.textContent = statusText;
            statusEl.innerHTML = '';
            statusEl.appendChild(statusBadge);
        },
        isRegistrationInProgress() {
            return AppState.currentStep >= 1 && AppState.currentStep <= 4;
        },

        setupExitConfirmation() {
            if (UI.__exitConfirmationSetup) return;
            UI.__exitConfirmationSetup = true;

            let lastAction = 'unknown';
            let beaconSent = false;

            // Shared: beacon cleanup so server can run same logic as DELETE. Backend knows by ?beacon=1 and body.beacon
            function sendCleanupBeacon() {
                if (beaconSent || typeof navigator.sendBeacon !== 'function') return;
                try {
                    var accessToken = API.getAccessToken();
                    if (!accessToken) return;
                    beaconSent = true;
                    var beaconUrl = ENV_CONFIG[envKey].api.baseUrl + '/subscriptions/cleanup-incomplete-registration ';
                    var payload = JSON.stringify({ accessToken: accessToken, beacon: true });
                    navigator.sendBeacon(beaconUrl, new Blob([payload], { type: 'application/json' }));
                } catch (_) { }
            }


            // document.addEventListener('visibilitychange', function () {
            //     if (document.visibilityState !== 'hidden') return;
            //     if (!UI.isRegistrationInProgress()) return;
            //     if (lastAction === 'auth_google' || lastAction === 'proceed_payment') return;
            //     sendCleanupBeacon();
            //     API.cleanupIncompleteRegistration();
            // });


            window.addEventListener('pagehide', function () {
                if (!UI.isRegistrationInProgress()) return;
                if (lastAction === 'auth_google' || lastAction === 'proceed_payment') return;
                sendCleanupBeacon();
                API.cleanupIncompleteRegistration();
            });

            window.addEventListener('keydown', (e) => {
                const key = (e.key || '').toLowerCase();
                if (key === 'f5' || ((e.ctrlKey || e.metaKey) && key === 'r')) {
                    lastAction = 'reload_hotkey';
                }
            }, { capture: true });

            document.addEventListener('click', (e) => {
                const target = e.target;
                if (target?.closest?.('.social-auth-button.social-auth-google-button, .social-auth-google-button')) {
                    lastAction = 'auth_google';
                    return;
                }
                if (target?.closest?.('#confirmBtn')) {
                    lastAction = 'proceed_payment';
                    return;
                }
            }, { capture: true });


            window.addEventListener('beforeunload', (e) => {
                if (!UI.isRegistrationInProgress()) return;
                if (lastAction === 'auth_google' || lastAction === 'proceed_payment') return;

                if (lastAction === 'reload_hotkey') {
                    try {
                        sessionStorage.setItem('sk_remove_method_param_on_reload', '1');
                    } catch (_) { }
                }

                e.preventDefault();
                e.returnValue = '';
            });
        }
    };

    async function getOktaTokens(widget, from, token) {
        if (from === 'mobile' && token) {
            Storage.clear();
            localStorage.setItem('from', 'mobile');
            const response = await API.getTokenOktaFromMobile(token);
            devLog('response-mobile_________________', response);
            devLog('remove token and from after set');
            urlParams.delete('token');
            urlParams.delete('from');
            const urlReplace = window.location.pathname + (urlParams.toString() ? `?${urlParams.toString()}` : '');
            window.history.replaceState(null, '', urlReplace);
            // await widget.authClient.tokenManager.setTokens(response.tokens);

            return { ...response };
        }

        localStorage.removeItem('from');
        let tokenResponse = await widget.authClient.token.getWithoutPrompt({
            scopes: CONFIG.okta.scopes,
            responseType: ['token', 'id_token'],
        });

        devLog('tokenResponse-web_________________', tokenResponse);
        await widget.authClient.tokenManager.setTokens(tokenResponse.tokens);
        return tokenResponse.tokens;
    }

    const OktaWidget = {
        async init(clearStateAndStorage = null) {
            let init = false

            if (!init) {
                await API.getAuthConfig()
                await API.getPaymentConfig()
                UI.setupExitConfirmation()
                init = true
            }

            if (!global.OktaSignIn) {
                console.error('Okta Sign-In Widget not loaded');
                return;
            }

            const container = document.getElementById('okta-signin-widget-container');
            if (!container) {
                console.error('Widget container not found');
                return;
            }

            const widgetConfig = {
                baseUrl: CONFIG.okta.domain,
                clientId: CONFIG.okta.clientId,
                redirectUri: CONFIG.okta.redirectUri,
                authParams: {
                    issuer: CONFIG.okta.issuer,
                    scopes: CONFIG.okta.scopes,
                    pkce: true,
                    responseType: 'code',
                },
                // useInteractionCodeFlow: true,
                features: {
                    registration: true,
                    rememberMe: true,
                    selfServiceUnlock: false,
                    multiOptionalFactorEnroll: false
                },
                colors: {
                    brand: '#FF6B35',
                },
                idpDisplay: 'PRIMARY',
                idps: [
                    {
                        type: 'GOOGLE', id: envConfig.googleIdpId,

                    },
                    {
                        type: 'MICROSOFT', id: envConfig.microsoftIdpId,
                    },
                ],
                // Custom language + validation messages
                language: 'en',
                i18n: {
                    en: {
                        // Custom duplicate-email message
                        'error.EmailExists': 'This account already exists. Please use a different email.',
                        // Common additional cases
                        'error.AccountLocked': 'Your account is locked. Please contact support.',
                        'error.TooManyAttempts': 'Too many attempts. Please wait a moment and try again.',
                        'error.Network': 'Network error. Please check your connection and try again.',
                        'error.GenericAuth': 'Authentication failed. Please try again.',
                    },
                },
                registration: {
                    preSubmit: function (postData, onSuccess, onFailure) {
                        var password = (postData.credentials && postData.credentials.passcode) || '';
                        devLog('password__________', password)
                        var errorCauses = [];

                        if (password.length < 8) {
                            errorCauses.push({ errorSummary: 'Password must be at least 8 characters', property: 'credentials.passcode' });
                        }
                        if (!/[A-Z]/.test(password)) {
                            errorCauses.push({ errorSummary: 'Password must contain at least one uppercase letter', property: 'credentials.passcode' });
                        }
                        if (!/[a-z]/.test(password)) {
                            errorCauses.push({ errorSummary: 'Password must contain at least one lowercase letter', property: 'credentials.passcode' });
                        }
                        if (!/[0-9]/.test(password)) {
                            errorCauses.push({ errorSummary: 'Password must contain at least one number', property: 'credentials.passcode' });
                        }
                        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
                            errorCauses.push({ errorSummary: 'Password must contain at least one special character', property: 'credentials.passcode' });
                        }

                        console.log('errorCauses_________________', errorCauses)
                        if (errorCauses.length > 0) {
                            onFailure({ errorSummary: 'Please fix the following errors', errorCauses: errorCauses });
                        } else {
                            onSuccess(postData);
                        }
                    }
                }
            };

            try {
                AppState.widget = new global.OktaSignIn(widgetConfig);

                try {
                    const { token, from } = getResponseFromMobile();

                    // Only attempt silent web auth when there is an Okta session.
                    // For mobile deep-links we always go through the mobile token path.
                    const tokens = await getOktaTokens(AppState.widget, from, token);
                    await new Promise(resolve => setTimeout(resolve, 100));
                    if (from !== 'mobile') {
                        const sessionExists = await AppState.widget.authClient.session.exists();
                        if (!sessionExists) {
                            throw new Error('login_required');
                        }
                        await clearStateAndStorage?.();
                        await new Promise(resolve => setTimeout(resolve, 100));

                    }
                    devLog('token_________________', token)
                    devLog('from_________________', from)


                    await handleAuthSuccess(tokens);
                    return; // Don't show widget

                } catch (silentAuthError) {
                    const msg = String(silentAuthError?.errorSummary || silentAuthError?.message || '');
                    if (msg.includes('login_required') || msg.includes('The client specified not to prompt')) {
                        devLog('ℹ️ No existing Okta session for silent auth. Falling back to showing the widget.');
                    } else {
                        devLog('⚠️ Silent auth failed, showing widget:', msg);
                    }
                    UI.hideLoading();
                    // Fall through to show widget
                }
                // Check for email verification params
                const emailOtp = sessionStorage.getItem('email_verify_otp');
                const emailState = sessionStorage.getItem('email_verify_state');

                if (emailOtp && emailState) {
                    widgetConfig.otp = emailOtp;
                    widgetConfig.state = emailState;
                    sessionStorage.removeItem('email_verify_otp');
                    sessionStorage.removeItem('email_verify_state');
                }

                // Event handlers for debugging
                AppState.widget.on('ready', function (context) {
                    devLog('✅ Widget ready:', context.controller);
                    devLog('AppState.widget', AppState.widget);
                    $('.sb-loader').fadeOut();
                });
                // Re-apply override when switching between login and signup (Okta re-renders DOM)
                // Control step state and UI: only run override when controller actually changes to avoid flicker
                AppState.widget.on('afterRender', async function (context) {
                    var controller = context && context.controller;
                    var step = context && context.step;
                    AppState.oktaStep = step;
                    AppState.oktaControllerPrev = AppState.oktaController;
                    AppState.oktaController = controller;

                    devLog('controller_________________', controller)
                    if (controller === 'primary-auth' || controller === 'registration') {
                        UI.setupOverrideUIForOktaWidget(controller);
                    }
                    if (controller !== 'primary-auth') {
                        UI.updateUIShowProgressIndicator()
                    }

                });
                devLog('step_1_________')

                AppState.widget.showSignInToGetTokens({
                    el: '#okta-signin-widget-container',
                }).then(function (tokens) {
                    devLog('step_2_________')
                    handleAuthSuccess(tokens);
                }).catch(function (error) {
                    console.error('Widget error:', error);
                    const errorMsg = error.message || error.errorSummary || '';
                    if (errorMsg.includes('already exists') || errorMsg.includes('already registered')) {
                        // Duplicate user / email already registered
                        UI.showError('step1Error', 'Account was already registered. Please use a different email.');
                    } else if (!errorMsg.includes('cancelled')) {
                        UI.showError('step1Error', errorMsg || 'Authentication failed. Please try again.');
                    }
                });
            } catch (e) {
                console.error('Failed to create OktaSignIn:', e);
            }
        },
    };

    // ===========================================
    // AUTH HANDLERS
    // ===========================================
    async function handleAuthSuccess(tokens) {
        try {

            UI.showLoading('Setting up your account...');

            AppState.tokens = tokens;
            Storage.setItem(Storage.keys.tokens, tokens);

            const accessToken = typeof tokens.accessToken === 'string'
                ? tokens.accessToken
                : tokens.accessToken?.accessToken || tokens.accessToken;

            let userInfo = null;
            if (tokens.idToken) {
                const idToken = typeof tokens.idToken === 'string'
                    ? JSON.parse(atob(tokens.idToken.split('.')[1]))
                    : tokens.idToken.claims || tokens.idToken;

                userInfo = {
                    id: idToken.sub,
                    email: idToken.email,
                    username: idToken.custom_username || idToken.customUsername || idToken.nickname || idToken.preferred_username || idToken.email?.split('@')[0] || idToken.sub,
                    firstName: idToken.given_name || idToken.name?.split(' ')[0] || '',
                    lastName: idToken.family_name || idToken.name?.split(' ').slice(1).join(' ') || '',
                    name: idToken.name || `${idToken.given_name || ''} ${idToken.family_name || ''}`.trim(),
                };
            }
            devLog('run_________________', userInfo)

            if (userInfo) {
                AppState.user = userInfo;
                Storage.setItem(Storage.keys.user, userInfo);
                // Reset formData for new account so old session data (address, phone, etc.) is not carried over
                AppState.formData = {
                    email: userInfo.email,
                    username: userInfo.username,
                    firstName: userInfo.firstName,
                    lastName: userInfo.lastName,
                };
                Storage.setItem(Storage.keys.formData, AppState.formData);

                if (accessToken) {
                    const result = await API.initiateAuthenticatedSubscription(
                        accessToken,
                        CONFIG.plan.id,
                        CONFIG.plan.billingCycle
                    );
                    devLog('✅ Authenticated subscription initiated:', result);
                    if (result) {
                        // await API.getRoleItem(accessToken);
                        UI.prefillForms();
                        UI.hideLoading();
                        UI.goToStep(2);
                        const form = document.getElementById('personalDetailsForm');
                        UI.updateUIShowProgressIndicator()
                        UI.setAddressActionCheck()
                        setTimeout(() => {
                            handleCheckValidationForm(form);
                        }, 300)
                    }
                }
            } else {
                throw new Error('Failed to get user information');
            }
        } catch (error) {
            console.error('Error handling auth success:', error);
            UI.hideLoading();
            if (error?.errorCode?.includes('ACTIVE_SUBSCRIPTION_EXISTS')) {
                const signInUrl = typeof envConfig !== 'undefined' && envConfig.baseUrl ? envConfig.baseUrl : '/';
                UI.showAlreadyRegisteredModal(signInUrl);
                return;
            }
            UI.showError('step1Error', 'Failed to setup account. Please try again.');
        }
    }

    // ===========================================
    // FORM HANDLERS
    // ===========================================
    async function handlePersonalDetailsSubmit(e) {
        e.preventDefault();
        devLog('handlePersonalDetailsSubmit');
        const fullName = document.getElementById('fullName').value.trim();
        const address = document.getElementById('address').value.trim();
        const phoneNumber = document.getElementById('phoneNumber').value.trim();
        const abn = document.getElementById('abn').value.trim();
        const businessInfo = document.getElementById('businessInfo').value.trim();
        const invoiceAddress = document.getElementById('invoiceAddress').value.trim();
        const discountCode = document.getElementById('discountCode').value.trim();
        const agreedToTerms = document.getElementById('agreedToTerms').checked;
        const agreedToPrivacyPolicy = document.getElementById('agreedToPrivacyPolicy').checked;
        if (!agreedToTerms || !agreedToPrivacyPolicy) {
            UI.showError('step2Error', 'Please agree to the terms and privacy policy');
            return;
        } else {
            UI.hideError('step2Error');
        }
        if (!fullName || !address) {
            UI.showError('step2Error', 'Please fill in required fields');
            return;
        } else {
            UI.hideError('step2Error');
        }

        const submitBtn = e.target.querySelector('.btn-continue');
        UI.setButtonLoading(submitBtn, true);
        UI.hideError('step2Error');
        UI.hideError('step3Error');


        try {
            await API.updatePersonalDetails({
                fullName,
                address,
                phoneNumber,
                abn,
            });

            await API.updatePaymentDetails({
                paymentFullName: fullName,
                paymentEmail: AppState.user?.email || '',
                businessInfo,
                invoiceAddress: invoiceAddress,
                discountCode,
                agreedToTerms,
                agreedToPrivacyPolicy,

            });

            AppState.formData = {
                ...AppState.formData,
                fullName,
                address,
                phoneNumber,
                abn,
                businessInfo,
                invoiceAddress: invoiceAddress,
                discountCode
            };
            Storage.setItem(Storage.keys.formData, AppState.formData);

            UI.updateConfirmationPage();
            UI.goToStep(4);
            UI.setAddressActionCheck()

        } catch (error) {
            console.error('Personal details error:', error);
            UI.showError('step3Error', error.message || 'Failed to save details');
        } finally {
            UI.setButtonLoading(submitBtn, false);
        }
    }
    function handleCheckValidationForm(form) {
        devLog('form_________________', form)
        const isValid = form.checkValidity();
        const completeButton = form.querySelector('button[type="submit"]');
        if (!isValid) {
            form.reportValidity();
            completeButton.setAttribute('disabled', true);

        } else {
            completeButton.removeAttribute('disabled');
        }
        return isValid;
    }

    async function handleRoleSubmit(e) {
        UI.hideError('step2Error');
        e.preventDefault();
        const roleId = document.getElementById('roleId').value;
        if (!roleId) {
            UI.showError('step2Error', 'Please select a role');
            return;
        } else {
            UI.hideError('step2Error');
        }
        try {
            await API.updateRoleUser(roleId);
            UI.goToStep(3);

        } catch (error) {
            console.error('Role error:', error);
            UI.showError('step2Error', error.message || 'Failed to update role');
        }
    }

    function ensureSignupFormHandlers() {
        if (!AppState.formsBound.personalDetails) {
            const form = document.getElementById('personalDetailsForm');
            if (form) {
                form.addEventListener('submit', handlePersonalDetailsSubmit);
                form.addEventListener('change', () => handleCheckValidationForm(form));
                AppState.formsBound.personalDetails = true;
            }
        }
        if (!AppState.formsBound.personalRole) {
            const formRole = document.getElementById('personalRoleForm');
            if (formRole) {
                formRole.addEventListener('submit', handleRoleSubmit);
                AppState.formsBound.personalRole = true;
            }
        }
    }

    async function confirmAndPay() {
        const confirmBtn = document.getElementById('confirmBtn');
        UI.setButtonLoading(confirmBtn, true);
        // UI.hideError('step4Error');
        console.log('confirmAndPay');
        try {
            const checkout = await API.createCheckoutSession();
            devLog('✅ Stripe Checkout Session created:', checkout);

            if (checkout?.skipPayment) {
                const envParams = urlParams.get('env');
                const result = await API.confirmPayment('FREE');
                if (result?.id) {
                    await checkActionCallbackAfterSuccess(envParams);
                }
                return;
            }

            // Store session ID so payment-callback page can confirm
            sessionStorage.setItem('stripe_session_id', checkout.sessionId);

            // Redirect to Stripe Checkout — Stripe handles payment, then redirects back
            window.location.href = checkout.url;

        } catch (error) {
            console.error('Payment error:', error);
            UI.showError('step4Error', error.message || 'Payment failed. Please try again.');
        } finally {
            UI.setButtonLoading(confirmBtn, false);
        }
    }

    // ===========================================
    // CALLBACK HANDLERS
    // ===========================================
    function handleAuthCallback() {
        const interactionCode = urlParams.get('interaction_code');
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        const methodLogin = localStorage?.getItem('method_login');

        if (methodLogin) {
            //clear method_login
            localStorage.removeItem('method_login');
        }
        if (error) {
            console.error('Auth error:', error);
            window.location.href = '/subscribe';
            return;
        }

        if (interactionCode || code) {
            // Tokens should be handled by OktaAuth SDK
            // Redirect back to main flow
            setTimeout(() => {
                window.location.href = '/subscribe' + (methodLogin ? `?method=${methodLogin}` : '');
            }, 1000);
        }
    }

    async function handlePaymentCallback() {
        const status = urlParams.get('status');
        const stripeSessionId = urlParams.get('session_id') || sessionStorage.getItem('stripe_session_id');
        const paymentIntentId = urlParams.get('intent_id') || urlParams.get('payment_intent_id') || sessionStorage.getItem('awx_payment_intent_id');
        const sessionToken = urlParams.get('session_token') || sessionStorage.getItem('awx_session_token') || Storage.getItem(Storage.keys.sessionToken);
        const envParams = urlParams.get('env');

        if (!sessionToken) {
            alert('Session expired. Please start over.');
            window.location.href = '/subscribe?' + (envParams ? `env=${envParams}` : '');
            return;
        }
        {
            // Don't call confirm for failed/cancelled payments — redirect back to retry
            if (status === 'failed' || status === 'cancelled') {
                const cycle = urlParams.get('cycle');
                const plan = urlParams.get('plan');
                const retryParams = new URLSearchParams({ payment_status: status, action: 'continue_signup', cycle, plan });
                if (envParams) retryParams.append('env', envParams);
                window.location.href = '/subscribe?' + retryParams.toString();
                return;
            }

        }

        if (stripeSessionId && sessionToken) {
            // Restore session token to storage so confirmPayment() can read it
            Storage.setItem(Storage.keys.sessionToken, sessionToken);
            try {
                const result = await API.confirmPayment(stripeSessionId);

                if (result?.id) {
                    const verifiedData = {
                        verified: true,
                        timestamp: Date.now(),
                        subscriptionId: result.id,
                        stripeSessionId,
                    };
                    sessionStorage.setItem('payment_verified', JSON.stringify(verifiedData));
                    sessionStorage.removeItem('stripe_session_id');

                    await checkActionCallbackAfterSuccess(envParams)
                } else {
                    throw new Error(result?.message || 'Payment not completed');
                }
            } catch (error) {
                console.error('Error verifying payment:', error);
                const retryParams = new URLSearchParams({ payment_status: 'failed', action: 'continue_signup' });
                if (envParams) retryParams.append('env', envParams);
                window.location.href = '/subscribe?' + retryParams.toString();
            }
        }
    }
    function getResponseFromMobile() {
        let token = urlParams.get('token');
        const from = urlParams.get('from');

        if (!token) {
            const fullSearch = window.location.search;
            const parts = fullSearch.split('?');
            let queryPart = parts[parts.length - 1];

            const params = new URLSearchParams(queryPart);
            token = params.get('token');
            devLog('token_________________', token)
        }
        return {
            token,
            from,
        };
    }
    async function checkActionCallbackAfterSuccess(envParams) {
        const pageCurrent = window.location.pathname;
        devLog('CONFIG.callbacks.success', CONFIG.callbacks.success)
        if (pageCurrent.includes('privacy-policy') || pageCurrent.includes('terms-of-service')) {
            return;
        }

        const from = urlParams.get('from') || localStorage.getItem('from');
        const redirectSuccessUrl = CONFIG.callbacks.success + (envParams ? `?env=${envParams}` : '') || '/success';
        if (from === 'mobile') {
            window.location.href = 'statekraft://callback';
            setTimeout(() => {
                window.location.href = redirectSuccessUrl;
            }, 2500);
            return;
        }
        window.location.href = redirectSuccessUrl;
    }
    async function updateSuccessPageWithDetails() {
        try {
            const subscriptionData = await API.getMySubscription();
            if (subscriptionData?.subscription) {
                const sub = subscriptionData.subscription;
                const plan = subscriptionData.plan || sub.plan;

                if (plan) {
                    AppState.planDetails = plan;
                    AppState.selectedPlan = {
                        id: plan.code,
                        name: plan.name,
                        price: {
                            monthly: plan.priceMonthly / 100,
                            annual: plan.priceAnnual / 100,
                        },
                    };
                }

                if (sub.currentPeriodEnd) {
                    const nextBillingEl = document.getElementById('successNextBilling');
                    if (nextBillingEl) {
                        nextBillingEl.textContent = new Date(sub.currentPeriodEnd).toLocaleDateString('en-AU', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        });
                    }
                }

                UI.updateSubscriptionStatus(sub, subscriptionData.access);
            }
        } catch (error) {
            console.warn('Could not fetch subscription details:', error);
        }

        UI.updateSuccessPage();
    }

    async function showSuccess() {
        const verifiedDataStr = sessionStorage.getItem('payment_verified');
        if (verifiedDataStr) {
            const verifiedData = JSON.parse(verifiedDataStr);
            const fiveMinutes = 5 * 60 * 1000;

            if (verifiedData.verified && (Date.now() - verifiedData.timestamp) <= fiveMinutes) {
                const user = AppState.user || Storage.getItem(Storage.keys.user);
                if (user?.email) {
                    await API.removeFromMarketingList(user.email);
                }
                AppState.currentStep = 4;
                UI.goToStep(4);
                UI.setAddressActionCheck()
                await updateSuccessPageWithDetails();
                sessionStorage.removeItem('payment_verified');
                return;
            }
        }

        window.location.href = '/';
    }

    // ===========================================
    // INITIALIZATION
    // ===========================================
    async function init() {
        devLog('🚀 Initializing Statekraft Subscription Flow');

        // After reload (user accepted exit confirm): remove ?method= and call clearStateAndStorage
        let wasReloadWithFlag = false;
        try {
            if (sessionStorage.getItem('sk_remove_method_param_on_reload') === '1') {
                wasReloadWithFlag = true;
                sessionStorage.removeItem('sk_remove_method_param_on_reload');
                const sp = new URLSearchParams(window.location.search);
                if (sp.has('method')) {
                    sp.delete('method');
                    const qs = sp.toString();
                    history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : '') + window.location.hash);
                }
            }
        } catch (e) {
            console.warn('Cleanup method param on reload:', e?.message || e);
        }

        await API.getAuthConfig();
        await API.getPaymentConfig();


        // Check for success hash (from demo payment redirect) before clearing cache
        const hash = window.location.hash.replace('#', '');
        if (hash === 'success') {
            devLog('✅ Success hash detected, showing step 4...');
            history.replaceState(null, null, window.location.pathname + window.location.search);
            await showSuccess();
            return;
        }
        devLog('isProduction', isProduction)
        // Handle failed payment redirect from Stripe Checkout
        const paymentStatus = urlParams.get('payment_status');
        devLog('handle failed payment redirect from Stripe Checkout', paymentStatus)
        if (paymentStatus === 'failed' || paymentStatus === 'cancelled') {
            // Clean URL so refresh doesn't re-show error
            const cleanParams = urlParams;
            cleanParams.delete('payment_status');
            const remaining = cleanParams.toString();
            history.replaceState(null, null,
                window.location.pathname + (remaining ? '?' + remaining : '')
            );

            // Restore session from localStorage
            AppState.formData = Storage.getItem(Storage.keys.formData) || {};
            AppState.user = Storage.getItem(Storage.keys.user);
            AppState.tokens = Storage.getItem(Storage.keys.tokens);
            AppState.selectedPlan = CONFIG.plan;
            AppState.billingCycle = CONFIG.plan.billingCycle;

            devLog('AppState.tokens', AppState.tokens, AppState.user)
            if (AppState.tokens && AppState.user) {
                UI.updatePriceDisplays();
                UI.prefillForms();
                UI.updateConfirmationPage();
                UI.updateUIShowProgressIndicator();
                UI.goToStep(4);
                UI.setAddressActionCheck()

                // Ensure confirm button is not stuck in loading state
                const confirmBtn = document.getElementById('confirmBtn');
                if (confirmBtn) UI.setButtonLoading(confirmBtn, false);

                if (paymentStatus === 'failed') {
                    // Show error message
                    UI.showError('step4Error',
                        'Your payment could not be processed. Please try again with a different card.'
                    );
                }

                return;
            }
        }

        // Check for email verification callback (from magic link)
        const otp = urlParams.get('otp');
        const state = urlParams.get('state');
        const cycle = urlParams.get('cycle');
        if (cycle == 'annual') {
            CONFIG.plan.billingCycle = cycle;
        }
        if (otp && state) {
            devLog('📧 Email verification callback detected');
            sessionStorage.setItem('email_verify_otp', otp);
            sessionStorage.setItem('email_verify_state', state);
        }

        // Note: Callback page routing removed - now handled by integration.js
        // This prevents double callback handling

        // Initialize main flow state from storage (may be cleared later)
        AppState.selectedPlan = CONFIG.plan;
        AppState.billingCycle = CONFIG.plan.billingCycle;
        AppState.formData = Storage.getItem(Storage.keys.formData) || {};
        AppState.user = Storage.getItem(Storage.keys.user);
        AppState.tokens = Storage.getItem(Storage.keys.tokens);

        if (wasReloadWithFlag) {
            await clearStateAndStorage();
        }

        UI.updatePriceDisplays();

        // Setup form handlers (idempotent; goToStep also calls ensureSignupFormHandlers when forms mount later)
        ensureSignupFormHandlers();



        // Load Okta Widget
        if (!global.OktaSignIn) {
            // Load Okta Widget script
            devLog('load external')
            const script = document.createElement('script');
            script.src = 'https://global.oktacdn.com/okta-signin-widget/7.14.0/js/okta-sign-in.min.js';
            script.onload = () => {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://global.oktacdn.com/okta-signin-widget/7.14.0/css/okta-sign-in.min.css';
                document.head.appendChild(link);
                setTimeout(() => OktaWidget.init(clearStateAndStorage.bind(this)), 100);
            };
            document.head.appendChild(script);
        } else {
            devLog('loaded internal')
            OktaWidget.init(clearStateAndStorage.bind(this));
        }
    }

    async function clearStateAndStorage() {
        const action = urlParams.get('action');
        const hasSession = !!(AppState.tokens && AppState.user);
        devLog('hasSession_________________', hasSession)
        if (action === 'continue_signup' && hasSession) {
            devLog('✅ Continuing existing sign-up for:', AppState.user.email);

            const accessToken = API.getAccessToken();
            if (accessToken) {
                try {
                    await API.initiateAuthenticatedSubscription(
                        accessToken,
                        CONFIG.plan.id,
                        CONFIG.plan.billingCycle
                    );
                    // await API.getRoleItem(accessToken);
                    // await API.getCurrentRole(accessToken);
                } catch (e) {
                    if (e?.errorCode?.includes('ACTIVE_SUBSCRIPTION_EXISTS')) {
                        const signInUrl = typeof envConfig !== 'undefined' && envConfig.baseUrl ? envConfig.baseUrl : '/';
                        UI.showAlreadyRegisteredModal(signInUrl);
                        return;
                    }
                    devLog('ℹ️ Role item fetch issue:', e?.message || e);
                }
            }

            // If session is still valid, resume from step 2
            if (AppState.tokens && AppState.user) {
                UI.prefillForms();
                UI.goToStep(2);
                UI.updateUIShowProgressIndicator()
                UI.setAddressActionCheck()
                setTimeout(() => {
                    const pdForm = document.getElementById('personalDetailsForm');
                    if (pdForm) handleCheckValidationForm(pdForm);
                }, 300)
                return;
            }
        } else if (hasSession) {
            // Default behaviour: treat leftover session as incomplete and clean up
            devLog('🧹 Previous incomplete registration found — cleaning up...');

            try {
                await API.cleanupIncompleteRegistration();
                devLog('cleanupIncompleteRegistration success');
            } catch (e) {
                console.warn('Cleanup endpoint failed (non-blocking):', e?.message || e);
            } finally {
            }
        } else {
            devLog('no session found');
        }
    }

    const SubscriptionFlow = {
        init,
        goToStep: UI.goToStep,
        editField(field, step) {
            UI.goToStep(step);
            setTimeout(() => {
                const input = document.getElementById(field);
                if (input) {
                    input.focus();
                    input.select();
                }
            }, 500);
        },
        confirmAndPay,
        goToDashboard() {
            Storage.clear();
            window.location.href = '/';
        },
        handleAuthCallback,
        handlePaymentCallback,
        showSuccess,
        updateSuccessPageWithDetails,
    };

    // Export to global
    global.SubscriptionFlow = SubscriptionFlow;

    // Note: Auto-initialization removed - now handled by integration.js page router
    // This prevents double initialization on subscribe page

})(typeof window !== 'undefined' ? window : this);

