/**
 * Self-check for the dev-only panel refresh button (ADR-0001).
 * Loads TSP-Sign-Tools/js/main.js in a vm sandbox with stubbed DOM and
 * CSInterface, then verifies the three behaviors that matter:
 *
 *   1. No dev.mode marker  -> button stays hidden, no click handler.
 *   2. dev.mode present    -> button shown; click saves settings
 *      (tspSignDimSettings) and reloads the panel document.
 *   3. No CEP host         -> no evalScript, no crash, button hidden.
 *
 * Run: node test/dev-refresh.test.js
 */
"use strict";

var assert = require("assert");
var fs = require("fs");
var path = require("path");
var vm = require("vm");

var SOURCE = fs.readFileSync(
    path.join(__dirname, "..", "TSP-Sign-Tools", "js", "main.js"),
    "utf8"
);

var SETTINGS_KEY = "tspSignDimSettings";

function element(init) {
    return Object.assign(
        {
            value: "",
            checked: false,
            selectedIndex: 0,
            options: [],
            min: "0",
            max: "200",
            disabled: false,
            textContent: "",
            style: {},
            classList: {
                add: function () {},
                remove: function () {},
                toggle: function () {}
            },
            oninput: null,
            onchange: null,
            onclick: null
        },
        init || {}
    );
}

/**
 * Boots main.js with fresh stubs. `markerResult` is what the fake JSX
 * "String(new File(.../dev.mode).exists)" returns ("true"/"false").
 * `hostAvailable` — flip off to simulate a non-CEP context.
 */
function boot(markerResult, hostAvailable) {
    var elements = {};
    var markerCallbacks = [];
    var liveScripts = [];
    var location = {
        reloadCount: 0,
        reload: function () {
            location.reloadCount += 1;
        }
    };

    var document = {
        readyState: "complete",
        addEventListener: function () {},
        getElementById: function (id) {
            if (!elements[id]) {
                elements[id] = element();
            }
            return elements[id];
        },
        querySelector: function () {
            return null;
        },
        querySelectorAll: function () {
            return [];
        }
    };

    var localStorage = {
        _store: {},
        getItem: function (key) {
            return localStorage._store[key] || null;
        },
        setItem: function (key, value) {
            localStorage._store[key] = value;
        }
    };

    function CSInterface() {
        if (!hostAvailable) {
            throw new Error("no CEP host");
        }
        return {
            getSystemPath: function () {
                return "C:\\fake\\ext";
            },
            evalScript: function (script, callback) {
                liveScripts.push(script);
                if (
                    typeof callback === "function" &&
                    script.indexOf("dev.mode") !== -1
                ) {
                    markerCallbacks.push(function () {
                        callback(markerResult);
                    });
                }
            }
        };
    }

    var sandbox = {
        console: console,
        alert: function () {},
        document: document,
        localStorage: localStorage,
        CSInterface: CSInterface,
        SystemPath: { EXTENSION: "ext" },
        location: location,
        liveScripts: liveScripts,
        elements: elements
    };
    sandbox.window = sandbox;

    vm.runInNewContext(SOURCE, sandbox, { filename: "js/main.js" });

    markerCallbacks.forEach(function (cb) {
        cb();
    });

    return sandbox;
}

console.log("1. marker absent -> hidden");

(function () {
    var s = boot("false", true);
    var btn = s.elements.btnRefreshPanel;

    assert.strictEqual(btn.style.display, undefined, "must stay display:none");
    assert.strictEqual(btn.onclick, null, "no handler without marker");
})();

console.log("   ok");

console.log("2. marker present -> shown; click saves settings then reloads");

(function () {
    var s = boot("true", true);
    var btn = s.elements.btnRefreshPanel;

    assert.strictEqual(btn.style.display, "block", "button shown in dev");

    assert.ok(
        s.liveScripts.some(function (script) {
            return (
                script.indexOf("String(new File(") === 0 &&
                script.indexOf("C:/fake/ext/dev.mode") !== -1
            );
        }),
        "marker script must be quoted with String()"
    );

    // User has edited settings that were never measured (ADR: not lost).
    // Pre-create the controls saveSettings() reads so they exist with stubs.
    [
        "chkTop",
        "chkBottom",
        "chkLeft",
        "chkRight",
        "txtOffset",
        "txtAppearance",
        "ddlFraction",
        "ddlScale",
        "ddlNumFormat",
        "ddlMetricUnit",
        "txtMeasurePercent"
    ].forEach(function (id) {
        s.document.getElementById(id);
    });

    s.elements.chkTop.checked = true;
    s.elements.txtOffset.value = "42";
    s.elements.ddlScale.options = [{ text: "1/2\" = 1'" }];
    s.elements.ddlFraction.value = "1/16";
    s.elements.ddlMetricUnit.value = "mm";

    btn.onclick();

    assert.strictEqual(s.location.reloadCount, 1, "must reload exactly once");

    var saved = JSON.parse(s.localStorage._store[SETTINGS_KEY]);
    assert.strictEqual(saved.top, true, "un-measured edits persisted");
    assert.strictEqual(saved.offset, 42, "offset persisted verbatim");
})();

console.log("   ok");

console.log("3. no CEP host -> no evalScript, button hidden, nothing thrown");

(function () {
    var s = boot("true", false);
    var btn = s.elements.btnRefreshPanel;

    assert.strictEqual(btn.style.display, undefined, "hidden without host");
    assert.strictEqual(btn.onclick, null);
    assert.strictEqual(s.liveScripts.length, 0, "no bridge, no scripts");
})();

console.log("   ok");
console.log("All dev-refresh tests passed.");