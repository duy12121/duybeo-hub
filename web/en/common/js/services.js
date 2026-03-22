// =============================================
// services.js - Centralized External Services
// =============================================
// This file loads all external services in one place
// instead of having them scattered in every HTML file.

// --- Typekit Fonts ---
(function() {
    var tk = document.createElement('script');
    tk.src = 'https://use.typekit.net/wvc1sfl.js';
    tk.onload = function() {
        try { Typekit.load(); } catch (e) { }
    };
    document.head.appendChild(tk);
})();

// --- Google Tag Manager ---
(function(w, d, s, l, i) {
    w[l] = w[l] || [];
    w[l].push({
        'gtm.start': new Date().getTime(),
        event: 'gtm.js'
    });
    var f = d.getElementsByTagName(s)[0],
        j = d.createElement(s),
        dl = l != 'dataLayer' ? '&l=' + l : '';
    j.async = true;
    j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
    f.parentNode.insertBefore(j, f);
})(window, document, 'script', 'dataLayer', 'GTM-T6B7W8W');

// --- jQuery ajaxPrefilter (cross-domain safety) ---
// Applied after jQuery loads
document.addEventListener('DOMContentLoaded', function() {
    if (window.jQuery) {
        jQuery.ajaxPrefilter(function(s) {
            if (s.crossDomain) { s.contents.script = false; }
        });
    }
});
