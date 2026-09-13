window.outputUnit = "feet";
window.textStyle = "linear";
window.arrowTextMode = "dual";
window.modeValue = "divide";

function initPanel() {
    try {
        window.__cs = new CSInterface();
    } catch (e) {
        console.log("CSInterface ERROR", e);
        window.__cs = null;
    }

    var $ = function (id) {
        return document.getElementById(id);
    };

    var measPage = $("measPage");
    var scalePage = $("scalePage");
    var calcPage = $("calcPage");

    function showPage(pageId, buttonId) {
        [measPage, scalePage, calcPage].forEach(function (page) {
            if (page) {
                page.style.display = "none";
            }
        });

        ["btnMeas", "btnScale", "btnCalc"].forEach(function (id) {
            var btn = $(id);

            if (btn) {
                btn.classList.remove("active");
            }
        });

        if ($(pageId)) {
            $(pageId).style.display = "block";
        }

        if ($(buttonId)) {
            $(buttonId).classList.add("active");
        }
    }


    // =========================================================
    // TAB NAVIGATION
    // =========================================================

    if ($("btnMeas")) {
        $("btnMeas").onclick = function () {
            showPage("measPage", "btnMeas");
        };
    }

    if ($("btnScale")) {
        $("btnScale").onclick = function () {
            showPage("scalePage", "btnScale");
        };
    }

    if ($("btnCalc")) {
        $("btnCalc").onclick = function () {
            showPage("calcPage", "btnCalc");
        };
    }


    // =========================================================
    // OUTPUT UNIT
    // FEET / INCH
    // =========================================================

    var btnUnit = $("btnUnitToggle");
    var metricUnit = $("ddlMetricUnit");

    if (btnUnit) {
        btnUnit.onclick = function () {

            if (window.outputUnit === "feet") {
                window.outputUnit = "inch";
            } else if (window.outputUnit === "inch") {
                window.outputUnit = "metric";
            } else {
                window.outputUnit = "feet";
            }

            btnUnit.textContent =
                window.outputUnit === "inch"
                    ? "INCH"
                    : window.outputUnit === "metric"
                        ? "METRIC"
                        : "FEET";

            if (metricUnit) {
                metricUnit.disabled = window.outputUnit !== "metric";
            }

            console.log(
                "Output Unit:",
                window.outputUnit
            );
        };
    }

    if (metricUnit) {
        metricUnit.disabled = window.outputUnit !== "metric";
    }


    // =========================================================
    // TEXT STYLE
    // LINEAR / SYMBOL
    // =========================================================

    var btnStyle = $("btnTextStyleToggle");
    var arrowTextModeSelect = $("ddlArrowTextMode");

    function renderArrowTextMode() {
        var selectedStyle = document.querySelector('input[name="rdoLineStyle"]:checked');
        var isArrow = selectedStyle && selectedStyle.value === "arrow";

        if (arrowTextModeSelect) {
            arrowTextModeSelect.disabled = !isArrow;
            if (window.arrowTextMode) {
                arrowTextModeSelect.value = window.arrowTextMode;
            }
        }
    }

    if (btnStyle) {
        btnStyle.onclick = function () {

            if (window.textStyle === "linear") {
                window.textStyle = "symbol";
            } else {
                window.textStyle = "linear";
            }

            btnStyle.textContent =
                window.textStyle === "symbol"
                    ? "SYMBOL"
                    : "LINEAR";

            console.log(
                "Text Style:",
                window.textStyle
            );
        };
    }

    if (arrowTextModeSelect) {
        arrowTextModeSelect.onchange = function () {
            window.arrowTextMode = arrowTextModeSelect.value;
        };
    }

    var lineStyleRadios = document.querySelectorAll('input[name="rdoLineStyle"]');
    for (var i = 0; i < lineStyleRadios.length; i++) {
        lineStyleRadios[i].onchange = renderArrowTextMode;
    }

    renderArrowTextMode();


    // =========================================================
    // SCALE MODE
    // DIVIDE / MULTIPLY
    // =========================================================

    var modeSwitch = $("scaleModeSwitch");

    function renderScaleMode() {

        if (modeSwitch && modeSwitch.checked) {
            window.modeValue = "multiply";
        } else {
            window.modeValue = "divide";
        }

        var lblApply = $("lblApplyMode");
        var lblRestore = $("lblRestoreMode");

        if (lblApply) {
            lblApply.classList.toggle(
                "active",
                window.modeValue === "divide"
            );
        }

        if (lblRestore) {
            lblRestore.classList.toggle(
                "active",
                window.modeValue === "multiply"
            );
        }

        var btnApplyScale = $("btnApplyScale");

        if (btnApplyScale) {

            if (window.modeValue === "divide") {
                btnApplyScale.textContent = "Apply Scale";
            } else {
                btnApplyScale.textContent = "Restore Scale";
            }
        }

        console.log(
            "Scale Mode:",
            window.modeValue
        );
    }

    if (modeSwitch) {
        modeSwitch.onchange = renderScaleMode;

        renderScaleMode();
    }


    // =========================================================
    // SLIDER SYNC
    // =========================================================

    function syncSlider(txtId, sldId) {

        var txt = $(txtId);
        var sld = $(sldId);

        if (!txt || !sld) {
            return;
        }

        txt.oninput = function () {

            var value = parseFloat(txt.value);

            if (isNaN(value)) {
                value = 0;
            }

            var min = parseFloat(sld.min);
            var max = parseFloat(sld.max);

            value = Math.max(
                min,
                Math.min(value, max)
            );

            sld.value = value;
        };

        sld.oninput = function () {
            txt.value = sld.value;
        };
    }

    syncSlider(
        "txtOffset",
        "sldOffset"
    );

    syncSlider(
        "txtAppearance",
        "sldAppearance"
    );


    // =========================================================
    // EXTENSION PATH
    // =========================================================

    function getExtensionPath() {

        var rawPath = window.__cs
            ? window.__cs.getSystemPath(
                SystemPath.EXTENSION
            )
            : "";

        if (
            rawPath.indexOf("\\") !== -1
        ) {

            rawPath =
                rawPath.replace(
                    /\\/g,
                    "/"
                );
        }

        return rawPath;
    }


    // =========================================================
    // LOAD SAVED SETTINGS
    // =========================================================

    try {

        var saved =
            localStorage.getItem(
                "tspSignDimSettings"
            );

        if (saved) {

            var state =
                JSON.parse(saved);


            var checkboxMap = {
                top: "chkTop",
                bottom: "chkBottom",
                left: "chkLeft",
                right: "chkRight"
            };


            [
                "top",
                "bottom",
                "left",
                "right"
            ].forEach(function (key) {

                var element =
                    $(checkboxMap[key]);

                if (
                    state[key] !== undefined &&
                    element
                ) {

                    element.checked =
                        state[key];
                }
            });


            if (
                state.offset !== undefined
            ) {

                $("txtOffset").value =
                    state.offset;

                $("sldOffset").value =
                    Math.min(
                        Number(state.offset) || 0,
                        200
                    );
            }


            if (
                state.appearance !== undefined
            ) {

                $("txtAppearance").value =
                    state.appearance;

                $("sldAppearance").value =
                    Math.min(
                        Number(state.appearance) || 0,
                        200
                    );
            }


            if (
                state.fraction !== undefined &&
                $("ddlFraction")
            ) {

                $("ddlFraction").value =
                    state.fraction;
            }


            if (
                state.numFormat !== undefined &&
                $("ddlNumFormat")
            ) {

                $("ddlNumFormat").value =
                    state.numFormat;
            }


            if (
                state.scaleIndex !== undefined &&
                $("ddlScale")
            ) {

                if (
                    state.scaleIndex <
                    $("ddlScale").options.length
                ) {

                    $("ddlScale").selectedIndex =
                        state.scaleIndex;
                }
            }


            if (
                state.lineStyle !== undefined
            ) {

                var radio =
                    document.querySelector(
                        'input[name="rdoLineStyle"][value="' +
                        state.lineStyle +
                        '"]'
                    );

                if (radio) {
                    radio.checked = true;
                }
            }

            if (
                state.metricUnit !== undefined &&
                metricUnit
            ) {
                metricUnit.value =
                    state.metricUnit;
            }

            window.outputUnit =
                state.unit === "inch"
                    ? "inch"
                    : state.unit === "metric"
                        ? "metric"
                        : "feet";


            window.textStyle =
                state.textStyle === "symbol"
                    ? "symbol"
                    : "linear";

            window.arrowTextMode =
                state.arrowTextMode === "feet"
                    ? "feet"
                    : state.arrowTextMode === "inch"
                        ? "inch"
                        : "dual";

            if (btnUnit) {

                btnUnit.textContent =
                    window.outputUnit === "inch"
                        ? "INCH"
                        : window.outputUnit === "metric"
                            ? "METRIC"
                            : "FEET";
            }

            if (metricUnit) {
                metricUnit.disabled = window.outputUnit !== "metric";
            }


            if (btnStyle) {

                btnStyle.textContent =
                    window.textStyle === "symbol"
                        ? "SYMBOL"
                        : "LINEAR";
            }

            if (arrowTextModeSelect) {
                arrowTextModeSelect.value = window.arrowTextMode;
                renderArrowTextMode();
            }
        }

    } catch (e) {

        console.log(
            "Settings restore error",
            e
        );
    }


    // =========================================================
    // SAVE SETTINGS
    // Shared by the Measure button and by panel refresh (dev).
    // Returns the payload so callers can hand it to the JSX.
    // =========================================================

    function saveSettings() {

        var ddlScale =
            $("ddlScale");

        var checkedStyle =
            document.querySelector(
                'input[name="rdoLineStyle"]:checked'
            );


        var data = {

            top:
                $("chkTop").checked,

            bottom:
                $("chkBottom").checked,

            left:
                $("chkLeft").checked,

            right:
                $("chkRight").checked,


            offset:
            isNaN(parseFloat($("txtOffset").value))
                ? 50
                : parseFloat($("txtOffset").value),


            appearance:
                isNaN(parseFloat($("txtAppearance").value))
                    ? 100
                    : parseFloat($("txtAppearance").value),

            fraction:
                $("ddlFraction").value,


            scale:
                ddlScale.options[
                    ddlScale.selectedIndex
                ].text,


            lineStyle:
                checkedStyle
                    ? checkedStyle.value
                    : "arrow",


            numFormat:
                $("ddlNumFormat")
                    ? $("ddlNumFormat").value
                    : "fraction",


            unit:
                window.outputUnit,

            metricUnit:
                $("ddlMetricUnit")
                    ? $("ddlMetricUnit").value
                    : "mm",

            textStyle:
            window.textStyle,

            arrowTextMode:
                window.arrowTextMode,

            measurePercent:
            isNaN(parseFloat($("txtMeasurePercent").value))
                ? null
                : parseFloat($("txtMeasurePercent").value)
        };


        console.log(
            "MEASUREMENT DATA",
            data
        );


        localStorage.setItem(

            "tspSignDimSettings",

            JSON.stringify({

                top: data.top,

                bottom: data.bottom,

                left: data.left,

                right: data.right,

                offset: data.offset,

                appearance:
                    data.appearance,

                fraction:
                    data.fraction,

                scaleIndex:
                    ddlScale.selectedIndex,

                lineStyle:
                    data.lineStyle,

                numFormat:
                    data.numFormat,

                unit:
                    data.unit,

                metricUnit:
                    data.metricUnit,

                textStyle:
                    data.textStyle,

                arrowTextMode:
                    data.arrowTextMode
            })
        );


        return data;
    }

    // =========================================================
    // MEASURE BUTTON
    // =========================================================

    if ($("btnMeasure")) {

        $("btnMeasure").onclick =
            function () {

                try {

                    var data = saveSettings();

                    var script =

                        '$.evalFile("' +

                        getExtensionPath() +

                        '/jsx/Measurement.jsx"); ' +

                        'runMeasurement(' +

                        JSON.stringify(data) +

                        ');';


                    if (window.__cs) {

                        window.__cs.evalScript(
                            script
                        );
                    }

                } catch (e) {

                    alert(
                        "Measure error: " +
                        e
                    );
                }
            };
    }

    // =========================================================
    // PANEL REFRESH (DEV ONLY)
    // Shown only when the dev marker "dev.mode" exists in the
    // extension directory; omit that file when packaging.
    // =========================================================

    var btnRefresh =
        $("btnRefreshPanel");

    if (btnRefresh && window.__cs) {

        window.__cs.evalScript(

            'String(new File("' +
            getExtensionPath() +
            '/dev.mode").exists)',

            function (result) {

                if (
                    String(result).toLowerCase() !== "true"
                ) {

                    return;
                }

                btnRefresh.style.display = "block";

                btnRefresh.onclick =
                    function () {

                        try {

                            saveSettings();

                        } catch (e) {

                            console.log(
                                "Pre-reload save error",
                                e
                            );
                        }

                        window.location.reload();
                    };
            }
        );
    }


    // =========================================================
    // SCALE BUTTON
    // =========================================================

    if ($("btnApplyScale")) {

        $("btnApplyScale").onclick =
            function () {

                try {

                    var ddlScaleObj =
                        $("ddlScaleObj");


                    if (!ddlScaleObj) {

                        alert(
                            "Scale dropdown ddlScaleObj tidak ditemukan."
                        );

                        return;
                    }


                    var scaleText =

                        ddlScaleObj.options[
                            ddlScaleObj.selectedIndex
                        ].text;


                    var customPercent = "";

                    if ($("txtPercent")) {

                        customPercent =
                            $("txtPercent")
                                .value
                                .trim();
                    }


                    console.log(
                        "SCALE DATA",
                        {
                            scale: scaleText,
                            mode: window.modeValue,
                            percent: customPercent
                        }
                    );


                    var script =

                        '$.evalFile("' +

                        getExtensionPath() +

                        '/jsx/Measurement.jsx"); ' +

                        'scaleObject(' +

                        JSON.stringify(scaleText) +

                        ', ' +

                        JSON.stringify(
                            window.modeValue
                        ) +

                        ', ' +

                        JSON.stringify(
                            customPercent
                        ) +

                        ');';


                    if (window.__cs) {

                        window.__cs.evalScript(
                            script
                        );
                    }

                } catch (e) {

                    alert(
                        "Scale error: " +
                        e
                    );
                }
            };
    }
}


if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initPanel
    );

} else {

    initPanel();
}


// =========================================================
// DETECT OBJECT
// =========================================================

window.detectObjectInIllustrator =
    function (callback) {

        var cs = window.__cs;

        if (!cs) {

            callback(null);

            return;
        }


        var script = [

            'var _out;',

            'if(!app.documents.length)',

            '_out="ERROR:No document.";',

            'else if(!app.activeDocument.selection.length)',

            '_out="ERROR:Select an object.";',

            'else{',

            'var sel=app.activeDocument.selection;',

            'var minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;',

            'for(var i=0;i<sel.length;i++){',

            'try{',

            'var b=sel[i].geometricBounds;',

            'if(b[0]<minX)minX=b[0];',

            'if(b[2]>maxX)maxX=b[2];',

            'if(b[1]>maxY)maxY=b[1];',

            'if(b[3]<minY)minY=b[3];',

            '}catch(e){}',

            '}',

            '_out=((maxX-minX)/72)+":"+((maxY-minY)/72);',

            '}',

            '_out'

        ].join('');


        cs.evalScript(
            script,
            callback
        );
    };