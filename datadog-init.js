/**
 * Statekraft Marketing Site — Datadog RUM Initialization
 *
 * Shares the RUM application with apps/next-web and apps/next-app — same
 * applicationId / clientToken — so cross-surface user journeys join on the
 * Okta sub set via DD_RUM.setUser in flow-integration.js.
 *
 * Region: AP2
 */
(function (h, o, u, n, d) {
    h = h[d] = h[d] || { q: [], onReady: function (c) { h.q.push(c); } };
    d = o.createElement(u); d.async = 1; d.src = n;
    n = o.getElementsByTagName(u)[0]; n.parentNode.insertBefore(d, n);
})(window, document, 'script', 'https://www.datadoghq-browser-agent.com/ap2/v6/datadog-rum.js', 'DD_RUM');

window.DD_RUM.onReady(function () {
    var host = '';
    var search = '';
    try { host = window.location.hostname || ''; } catch (e) { /* noop */ }
    try { search = window.location.search || ''; } catch (e) { /* noop */ }

    var override = '';
    try { override = (new URLSearchParams(search).get('env') || '').toUpperCase(); } catch (e) { /* noop */ }

    var env;
    if (override === 'DEV' || override === 'UAT') {
        env = override;
    } else if (override === 'PRODUCTION' || override === 'PROD') {
        env = 'Prod';
    } else if (host === 'statekraft.ai' || host === 'www.statekraft.ai') {
        env = 'Prod';
    } else if (host.indexOf('.webflow.io') !== -1) {
        env = 'UAT';
    } else {
        env = 'UAT';
    }

    window.DD_RUM.init({
        applicationId: '8e9f2a64-cf2f-4a25-94c3-286ec0cdf374',
        clientToken: 'puba25944d4e34f49676b2f1afd5092115e',
        site: 'ap2.datadoghq.com',
        service: 'statekraft-marketing',
        env: env,
        sessionSampleRate: 100,
        sessionReplaySampleRate: 20,
        defaultPrivacyLevel: 'mask-user-input',
        trackUserInteractions: true,
        trackResources: true,
        trackLongTasks: true,
    });

    window.DD_RUM.startSessionReplayRecording();
});
