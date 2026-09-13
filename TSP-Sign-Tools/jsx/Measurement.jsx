#target illustrator

var BASE = {
    stroke : 0.9,
    defaultFontSize : 18,
    arrowLength : 18,
    arrowWidth : 8,
    extension : 5,
    textGap : 50 
};

var CFG = {
    showTop : true, showBottom : true, showLeft : true, showRight : true,
    offset : 50, appearance : 100, fontSize : 18, fraction : 8,
    scale : "1\" = 1'",
    measurePercent : null,
    lineStyle : "arrow",
    numFormat : "fraction",
    unit : "feet",
    metricUnit : "mm",
    textStyle : "linear",
    arrowTextMode : "dual"
};

function getSafeLayer(doc) {
    try {
        var layer = doc.activeLayer;
        if (layer && !layer.locked) return layer;
    } catch(e) {}
    var l = doc.layers.add();
    l.name = "__tsp_safe__";
    return l;
}

function collectStroked(root) {
    var list = [];
    function walk(item) {
        try { if (item.stroked && item.strokeWidth > 0) list.push({ ref: item, orig: item.strokeWidth }); } catch(e) {}
        try { for (var i = 0; i < item.pageItems.length; i++) walk(item.pageItems[i]); } catch(e) {}
    }
    walk(root);
    return list;
}

function collectCorners(root) {
    var list = [];
    function walk(item) {
        if (item.typename === "Rectangle") { try { list.push({ ref: item, orig: item.cornerRadius }); } catch(e) {} }
        try { for (var i = 0; i < item.pageItems.length; i++) walk(item.pageItems[i]); } catch(e) {}
    }
    walk(root);
    return list;
}

function getScaleFactor(scaleText){
    switch(scaleText){
        case '1/16" = 1\'': return 192;
        case '3/32" = 1\'': return 128;
        case '1/8" = 1\'': return 96;
        case '3/16" = 1\'': return 64;
        case '1/4" = 1\'': return 48;
        case '3/8" = 1\'': return 32;
        case '1/2" = 1\'': return 24;
        case '3/4" = 1\'': return 16;
        case '1" = 1\'': return 12;
        case '1-1/2" = 1\'': return 8;
        case '2" = 1\'': return 6;
        case '3" = 1\'': return 4;
        case '6" = 1\'': return 2;
        default: return 1;
    }
}

function scaleObject(scaleText, mode, customPercent){
    if(app.documents.length == 0) return alert("No document open.");
    if(app.activeDocument.selection.length == 0) return alert("Select object first.");
   
    var doc = app.activeDocument;
    var safeLayer = getSafeLayer(doc);
    var sel = doc.selection;
    var count = sel.length;
    var percent = 100;
    var indicatorText = "";
    var isCustom = false;

    if (customPercent !== undefined && customPercent !== null && customPercent !== "") {
        percent = Number(customPercent);
        indicatorText = "SCALE: " + percent + "%";
        isCustom = true;
    } else {
        var factor = getScaleFactor(scaleText);
        percent = (mode === "multiply") ? (100 * factor) : (100 / factor);
        var cleanScaleName = scaleText.replace(" = 1'", ""); 
        indicatorText = 'SCALE ' + cleanScaleName + ' : 12"';
    }

    var i, allStrokes = [], allCorners = [];
    for (i = 0; i < count; i++) {
        allStrokes = allStrokes.concat(collectStroked(sel[i]));
        allCorners = allCorners.concat(collectCorners(sel[i]));
    }

    if (count > 1) {
        var grp = doc.groupItems.add();
        for (i = count - 1; i >= 0; i--) sel[i].moveToBeginning(grp);
        grp.resize(percent, percent);
        while (grp.pageItems.length > 0)
            grp.pageItems[0].move(doc, ElementPlacement.PLACEATBEGINNING);
        grp.remove();
    } else {
        sel[0].resize(percent, percent);
    }

    var ratio = percent / 100;
    for (i = 0; i < allStrokes.length; i++) {
        try { allStrokes[i].ref.strokeWidth = allStrokes[i].orig * ratio; } catch(e) {}
    }
    for (i = 0; i < allCorners.length; i++) {
        try { allCorners[i].ref.cornerRadius = allCorners[i].orig * ratio; } catch(e) {}
    }

    if (mode === "divide" || isCustom) {
        var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (i = 0; i < count; i++) {
            var b = sel[i].visibleBounds;
            if (b[0] < minX) minX = b[0];
            if (b[2] > maxX) maxX = b[2];
            if (b[3] < minY) minY = b[3];
        }
        var t = safeLayer.textFrames.add();
        t.contents = indicatorText;
        t.textRange.paragraphAttributes.justification = Justification.CENTER;
        try { t.textRange.characterAttributes.size = 14; t.textRange.characterAttributes.textFont = app.textFonts.getByName("ArialMT"); } catch(e) {}
        t.position = [((minX + maxX) / 2) - (t.width / 2), minY - 20];
    }
}

function applyScale(inch){

    // CUSTOM PERCENTAGE OVERRIDES SCALE DROPDOWN
    if (
        CFG.measurePercent !== null &&
        CFG.measurePercent !== undefined &&
        CFG.measurePercent > 0
    ) {
        return inch * (100 / CFG.measurePercent);
    }

    // STANDARD ARCHITECTURAL SCALE
    var f = getScaleFactor(CFG.scale);
    return inch * f;
}

function ptToInch(pt){
    var sf = 1;

    try {
        sf = app.activeDocument.scaleFactor;
    } catch(e) {
        sf = 1;
    }

    return (pt * sf) / 72;
}

function getFractionString(num, den) {
    return num + "/" + den;
}

function createTick(g, x, y, s){
    var t = g.pathItems.add();
    var aW = Math.round(BASE.arrowWidth * s);
    t.setEntirePath([ [x, y + aW], [x, y - aW] ]);
    applyStroke(t);
}

function createSlantedTick(g, x, y, s){
    var t = g.pathItems.add();
    var aW = Math.round(BASE.arrowWidth * s);
    var topX = x + aW;
    var topY = y + aW;
    var bottomX = x - aW;
    var bottomY = y - aW;
    
    t.setEntirePath([ [topX, topY], [bottomX, bottomY] ]);
    applyStroke(t);
    t.strokeDashes = []; 
}

function createArrow(g, isLeftOrTop, x, y, isHorizontal, s){
    var arrowLength = Math.round(BASE.arrowLength * s);
    var arrowWidth = Math.round(BASE.arrowWidth * s);
    var a = g.pathItems.add();
    if(isHorizontal){
        if(isLeftOrTop) a.setEntirePath([[x, y], [x + arrowLength, y + arrowWidth], [x + arrowLength, y - arrowWidth], [x, y]]);
        else a.setEntirePath([[x, y], [x - arrowLength, y + arrowWidth], [x - arrowLength, y - arrowWidth], [x, y]]);
    } else {
        if(isLeftOrTop) a.setEntirePath([[x, y], [x - arrowWidth, y - arrowLength], [x + arrowWidth, y - arrowLength], [x, y]]);
        else a.setEntirePath([[x, y], [x - arrowWidth, y + arrowLength], [x + arrowWidth, y + arrowLength], [x, y]]);
    }
    a.closed = false; a.filled = true; a.stroked = false; 
    var black = new GrayColor(); black.gray = 100;
    a.fillColor = black;
}

function applyStroke(item){
    var black = new GrayColor(); black.gray = 100;
    item.stroked = true;
    item.filled = false;
    item.strokeColor = black;
    item.strokeWidth = Math.max(0.1, BASE.stroke * (0.02 + (CFG.appearance / 100) * 0.98));
}


function forceTextSize(textFrame, sizeValue) {
    var safeSize = Math.max(0.1, Number(sizeValue));
    try { textFrame.textRange.characterAttributes.size = safeSize; } catch(e) {}
    try {
        var chars = textFrame.textRange.characters;
        for (var i = 0; i < chars.length; i++) {
            chars[i].characterAttributes.size = safeSize;
        }
    } catch(e) {}
}

function styleFractions(textFrame) {
    if (CFG.textStyle === "linear") return;
    var txt = textFrame.contents;
    var re = /(\d+)\/(\d+)/g;
    var m;
    while ((m = re.exec(txt)) !== null) {
        var numStart = m.index;
        var numEnd = numStart + m[1].length;
        var denStart = numEnd + 1;
        var denEnd = denStart + m[2].length;
        var chars = textFrame.textRange.characters;
        var fs = CFG.fontSize || 18;
        
        var numOk = false;
        var slashOk = false;
        var denOk = false;
        
        // --- Method 1: FontBaselineOption (Illustrator CC 2022+) ---
        if (typeof FontBaselineOption !== 'undefined') {
            if (!numOk) { try { for (var i = numStart; i < numEnd; i++) chars[i].characterAttributes.baselinePosition = FontBaselineOption.SUPERSCRIPT; numOk = true; } catch(e) {} }
            if (!slashOk) { try { chars[numEnd].characterAttributes.baselinePosition = FontBaselineOption.NORMAL; slashOk = true; } catch(e) {} }
            if (!denOk) { try { for (var i = denStart; i < denEnd; i++) chars[i].characterAttributes.baselinePosition = FontBaselineOption.SUBSCRIPT; denOk = true; } catch(e) {} }
        }
        
        // --- Method 2: BaselinePosition (Illustrator pre-2022) ---
        if (typeof BaselinePosition !== 'undefined') {
            if (!numOk) { try { for (var i = numStart; i < numEnd; i++) chars[i].characterAttributes.baselinePosition = BaselinePosition.SUPERSCRIPT; numOk = true; } catch(e) {} }
            if (!slashOk) { try { chars[numEnd].characterAttributes.baselinePosition = BaselinePosition.NORMAL; slashOk = true; } catch(e) {} }
            if (!denOk) { try { for (var i = denStart; i < denEnd; i++) chars[i].characterAttributes.baselinePosition = BaselinePosition.SUBSCRIPT; denOk = true; } catch(e) {} }
        }
        
        // --- Method 3: Position (older API fallback) ---
        if (typeof Position !== 'undefined') {
            if (!numOk) { try { for (var i = numStart; i < numEnd; i++) chars[i].characterAttributes.position = Position.SUPERSCRIPT; numOk = true; } catch(e) {} }
            if (!slashOk) { try { chars[numEnd].characterAttributes.position = Position.NORMAL; slashOk = true; } catch(e) {} }
            if (!denOk) { try { for (var i = denStart; i < denEnd; i++) chars[i].characterAttributes.position = Position.SUBSCRIPT; denOk = true; } catch(e) {} }
        }
        
        // --- Method 4: baselineShift fallback (numerator & slash only) ---
        if (!numOk) { try { for (var i = numStart; i < numEnd; i++) chars[i].characterAttributes.baselineShift = Math.round(fs * 0.33); } catch(e) {} }
        if (!slashOk) { try { chars[numEnd].characterAttributes.baselineShift = 0; } catch(e) {} }

        // --- Denom fine-tune: raise denominator with positive baselineShift ---
        try {
            var denShift = denOk ? Math.round(fs * 0.29) : Math.round(-fs * 0.2);
            for (var i = denStart; i < denEnd; i++)
                chars[i].characterAttributes.baselineShift = denShift;
        } catch(e) {}
    }
}

function getMeasureBounds(item) {
    try {
        if (!item) return null;

        if (item.typename === "GroupItem" && item.clipped === true) {
            for (var i = 0; i < item.pageItems.length; i++) {
                var child = item.pageItems[i];

                if (
                    child.typename === "PathItem" &&
                    child.clipping === true
                ) {
                    return child.geometricBounds;
                }

                if (
                    child.typename === "CompoundPathItem" &&
                    child.pathItems.length > 0
                ) {
                    for (var j = 0; j < child.pathItems.length; j++) {
                        if (child.pathItems[j].clipping === true) {
                            return child.geometricBounds;
                        }
                    }
                }
            }
        }
    } catch(e) {}

    try {
        var gb = item.geometricBounds;
        if (gb && gb.length === 4 && isFinite(gb[0]) && isFinite(gb[1]) && isFinite(gb[2]) && isFinite(gb[3])) {
            return gb;
        }
    } catch(e) {}

    try {
        var vb = item.visibleBounds;
        if (vb && vb.length === 4 && isFinite(vb[0]) && isFinite(vb[1]) && isFinite(vb[2]) && isFinite(vb[3])) {
            return vb;
        }
    } catch(e) {}

    try {
        return item.geometricBounds;
    } catch(e) {}

    try {
        return item.visibleBounds;
    } catch(e) {}

    return [0, 0, 0, 0];
}



function centerVerticalText(txt, targetX, targetY, side, padding){

    app.redraw();

    var vb = txt.visibleBounds;
    var cy = (vb[1] + vb[3]) / 2;

    // Center vertically around the measurement midpoint.
    txt.translate(0, targetY - cy);

    app.redraw();

    vb = txt.visibleBounds;
    var textWidth = vb[2] - vb[0];
    var safeGap = Math.max(Math.round(padding * 0.45), 10);

    // Keep the rotated label slightly closer to the measurement line.
    if(side == "right"){
        txt.translate(targetX + safeGap - vb[0], 0);
    }else{
        txt.translate(targetX - safeGap - vb[2], 0);
    }

    app.redraw();
}

function drawMeasurement() {
    var doc = app.activeDocument;
    var safeLayer = getSafeLayer(doc);
    var sel = doc.selection;
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (var i = 0; i < sel.length; i++) {
        try {
            var b = getMeasureBounds(sel[i]);
            if (b[0] < minX) minX = b[0];
            if (b[2] > maxX) maxX = b[2];
            if (b[1] > maxY) maxY = b[1];
            if (b[3] < minY) minY = b[3];
        } catch(e) {}
    }
    
    var left = minX;
    var top = maxY;
    var right = maxX;
    var bottom = minY;
    
    var width = right - left;
    var height = top - bottom;

function formatMetricValue(val) {
    var unit = (CFG.metricUnit || "mm").toLowerCase();
    var inchesToMm = val * 25.4;
    var metricValue = inchesToMm;

    if (unit === "cm") {
        metricValue = inchesToMm / 10;
    } else if (unit === "m") {
        metricValue = inchesToMm / 1000;
    }

    var places = (CFG.numFormat === "decimal3") ? 3 : (CFG.numFormat === "decimal2" ? 2 : 2);
    var formattedValue;

    if (CFG.numFormat === "fraction") {
        formattedValue = metricValue.toFixed(2);
    } else {
        formattedValue = metricValue.toFixed(places);
    }

    if (CFG.numFormat !== "fraction") {
        formattedValue = formattedValue.replace(/(\.\d*?[1-9])0+$/, "$1");
        formattedValue = formattedValue.replace(/\.0+$/, "");
    } else {
        formattedValue = formattedValue.replace(/\.0+$/, "");
    }

    return formattedValue + " " + unit.toUpperCase();
}

function formatDual(val){
    if (CFG.unit === "metric") {
        return formatMetricValue(val);
    }

    var totalText = "";
    var inchText = "";
    var ft = Math.floor(val / 12);
    var remainderInches = val - (ft * 12);

        // ==========================================
        // KONDISI 1: JIKA USER MEMILIH STYLE ARROW
        // ==========================================
        if (CFG.lineStyle === "arrow") {
            if (CFG.arrowTextMode === "feet") {
                if (CFG.numFormat === "decimal2" || CFG.numFormat === "decimal3") {
                    var places = (CFG.numFormat === "decimal2") ? 2 : 3;
                    var feetDecimal = val / 12;
                    return feetDecimal.toFixed(places) + "'";
                } else {
                    var denom = CFG.fraction || 8;
                    var totalFeet = Math.round((val / 12) * denom) / denom;
                    var feetWhole = Math.floor(totalFeet);
                    var feetNumerator = Math.round((totalFeet - feetWhole) * denom + 1e-10);
                    if(feetNumerator == denom){ feetWhole++; feetNumerator = 0; }
                    var feetFrac = "";
                    if(feetNumerator > 0){
                        var g = gcd(feetNumerator, denom);
                        feetFrac = getFractionString(feetNumerator / g, denom / g);
                    }
                    var feetText = feetWhole.toString();
                    if (feetFrac !== "") {
                        feetText = (feetWhole > 0 ? feetWhole + " " : "") + feetFrac;
                    }
                    return feetText + "'";
                }
            }

            if (CFG.arrowTextMode === "inch") {
                if (CFG.numFormat === "decimal2" || CFG.numFormat === "decimal3") {
                    var places = (CFG.numFormat === "decimal2") ? 2 : 3;
                    return val.toFixed(places) + '"';
                } else {
                    var denom = CFG.fraction || 8;
                    var total = Math.round(val * denom) / denom;
                    var totalWhole = Math.floor(total);
                    var totalNumerator = Math.round((total - totalWhole) * denom + 1e-10);
                    if(totalNumerator == denom) { totalWhole++; totalNumerator = 0; }
                    var totalFrac = "";
                    if(totalNumerator > 0) {
                        var gTotal = gcd(totalNumerator, denom);
                        totalFrac = getFractionString(totalNumerator / gTotal, denom / gTotal);
                    }
                    totalText = totalWhole.toString();
                    if (totalFrac !== "") {
                        totalText = (totalWhole > 0 ? totalWhole + " " : "") + totalFrac;
                    }
                    return totalText + '"';
                }
            }

            if (CFG.numFormat === "decimal2" || CFG.numFormat === "decimal3") {
                var places = (CFG.numFormat === "decimal2") ? 2 : 3;
                totalText = val.toFixed(places);
                inchText = remainderInches.toFixed(places);
            } else {
                var denom = CFG.fraction || 8; 
                var total = Math.round(val * denom) / denom;
                ft = Math.floor(total / 12);
                var inches = total - (ft * 12);
                
                var whole = Math.floor(inches);
                var numerator = Math.round((inches - whole) * denom + 1e-10);
                if(numerator == denom){ whole++; numerator = 0; }

                var gcd = function(a,b){ while(b){ var t = b; b = a % b; a = t; } return a; };
                var frac = "";
                
                if(numerator > 0){
                    var g = gcd(numerator, denom);
                    frac = getFractionString(numerator / g, denom / g);
                }

                inchText = whole.toString();
                if (frac !== "") {
                    inchText = (whole > 0 ? whole + " " : "") + frac;
                }

                var totalWhole = Math.floor(total);
                var totalNumerator = Math.round((total - totalWhole) * denom + 1e-10);
                if(totalNumerator == denom) { totalWhole++; totalNumerator = 0; }
                
                var totalFrac = "";
                if(totalNumerator > 0) {
                    var gTotal = gcd(totalNumerator, denom);
                    totalFrac = getFractionString(totalNumerator / gTotal, denom / gTotal);
                }
                
                totalText = totalWhole.toString();
                if (totalFrac !== "") {
                    totalText = (totalWhole > 0 ? totalWhole + " " : "") + totalFrac;
                }
            }
            return totalText + '"' + "\r" + "(" + ft + "'-" + inchText + '"' + ")";
        }

        // ==========================================
        // KONDISI 2: LOGIKA UNTUK STYLE SLANTED & TICK 
        // ==========================================
        if (CFG.numFormat === "decimal2" || CFG.numFormat === "decimal3") {
            var places = (CFG.numFormat === "decimal2") ? 2 : 3;
            
            if (CFG.unit === "inch") {
                return val.toFixed(places) + '"';
            } else {
                var feetDecimal = val / 12;
                return feetDecimal.toFixed(places) + "'";
            }
        } 
        else {
            var denom = CFG.fraction || 8; 
            var total = Math.round(val * denom) / denom;
            ft = Math.floor(total / 12);
            var inches = total - (ft * 12);
            
            var whole = Math.floor(inches);
            var numerator = Math.round((inches - whole) * denom + 1e-10);
            if(numerator == denom){ whole++; numerator = 0; }

            var gcd = function(a,b){ while(b){ var t = b; b = a % b; a = t; } return a; };
            var frac = "";
            
            if(numerator > 0){
                var g = gcd(numerator, denom);
                frac = getFractionString(numerator / g, denom / g);
            }

            inchText = whole.toString();
            if (frac !== "") {
                inchText = (whole > 0 ? whole + " " : "") + frac;
            }

            var totalWhole = Math.floor(total);
            var totalNumerator = Math.round((total - totalWhole) * denom + 1e-10);
            if(totalNumerator == denom) { totalWhole++; totalNumerator = 0; }
            
            var totalFrac = "";
            if(totalNumerator > 0) {
                var gTotal = gcd(totalNumerator, denom);
                totalFrac = getFractionString(totalNumerator / gTotal, denom / gTotal);
            }
            
            totalText = totalWhole.toString();
            if (totalFrac !== "") {
                totalText = (totalWhole > 0 ? totalWhole + " " : "") + totalFrac;
            }

            // 🌟 LOGIKA UTAMA YANG SUDAH DIPERBAIKI SINKRON DENGAN DESIMAL:
            if (CFG.unit === "inch") {
                return totalText + '"'; 
            } else {
                return ft + "'-" + inchText + '"'; 
            }
        }
    }

    var s = 0.02 + (CFG.appearance / 100) * 0.98;
    var verticalTextPadding = Math.round(16 * s);
    var ext = Math.round(BASE.extension * s);
    var gap = Math.round(BASE.textGap * s);
    var slantTail = Math.round(12 * s);
    var fontSize = CFG.fontSize;

    var realW = ptToInch(width);
    var realH = ptToInch(height);
    
    var valH = applyScale(realW);
    var valV = applyScale(realH);
    
    // Offset: percentage of measured dimension (200 = 100%, 100 = 50%)
    // Convert inches to points (1 inch = 72 points)
    // Use real (unscaled) dimension so offset stays proportional to actual object size
    var offsetBase = Math.min(realW, realH);

    var offsetH = ext + (CFG.offset / 200) * offsetBase * 72;
    var offsetV = offsetH;

    // TOP SIDE
    if(CFG.showTop){
        var gTop = safeLayer.groupItems.add();
        var yDim = top + offsetH;
        

        var ext1 = gTop.pathItems.add();

        if (CFG.lineStyle === "slanted") {
            ext1.setEntirePath([
                [left, yDim - slantTail],
                [left, yDim + slantTail]
            ]);
        } else {
            ext1.setEntirePath([
                [left, top],
                [left, yDim + ext]
            ]);
        }

        applyStroke(ext1);


        var ext2 = gTop.pathItems.add();

        if (CFG.lineStyle === "slanted") {
            ext2.setEntirePath([
                [right, yDim - slantTail],
                [right, yDim + slantTail]
            ]);
        } else {
            ext2.setEntirePath([
                [right, top],
                [right, yDim + ext]
            ]);
        }

        applyStroke(ext2);

                
        var txtH = gTop.textFrames.add();
        txtH.contents = formatDual(valH);
        txtH.textRange.paragraphAttributes.justification = Justification.CENTER;
        try { txtH.textRange.characterAttributes.size = fontSize; } catch(e){}
        try {
    txtH.textRange.characterAttributes.textFont =
        app.textFonts.getByName(
            CFG.lineStyle === "slanted"
                ? "Gotham-Medium"
                : "ArialMT"
        );
} catch(e){}
        styleFractions(txtH);
        forceTextSize(txtH, fontSize);
        try { txtH.resize(s * 100, s * 100); } catch(e) {}

        if(CFG.lineStyle === "tick" || CFG.lineStyle === "slanted"){
            if(CFG.lineStyle === "tick") { ext1.strokeDashes = [3, 3]; ext2.strokeDashes = [3, 3]; } 
            else { ext1.strokeDashes = []; ext2.strokeDashes = []; }
            
            var l1 = gTop.pathItems.add(); l1.setEntirePath([[left, yDim], [right, yDim]]); applyStroke(l1);
            if(CFG.lineStyle === "slanted") { createSlantedTick(gTop, left, yDim, s); createSlantedTick(gTop, right, yDim, s); } 
            else { createTick(gTop, left, yDim, s); createTick(gTop, right, yDim, s); }
            txtH.position = [((left + right) / 2) - (txtH.width/2), yDim + txtH.height + 2];
        } else {
            var l1 = gTop.pathItems.add(); l1.setEntirePath([[left, yDim], [(left+right)/2-gap, yDim]]); applyStroke(l1);
            var l2 = gTop.pathItems.add(); l2.setEntirePath([[(left+right)/2+gap, yDim], [right, yDim]]); applyStroke(l2);
            createArrow(gTop, true, left, yDim, true, s); createArrow(gTop, false, right, yDim, true, s);
            txtH.position = [((left + right) / 2) - (txtH.width / 2), yDim + (txtH.height / 2)];
        }
    }

    // BOTTOM SIDE
    if(CFG.showBottom){
        var gBottom = safeLayer.groupItems.add();
        var yDimB = bottom - offsetH;
        var be1 = gBottom.pathItems.add();

        if (CFG.lineStyle === "slanted") {
            be1.setEntirePath([
                [left, yDimB - slantTail],
                [left, yDimB + slantTail]
            ]);
        } else {
            be1.setEntirePath([
                [left, bottom],
                [left, yDimB - ext]
            ]);
        }

        applyStroke(be1);


        var be2 = gBottom.pathItems.add();

        if (CFG.lineStyle === "slanted") {
            be2.setEntirePath([
                [right, yDimB - slantTail],
                [right, yDimB + slantTail]
            ]);
        } else {
            be2.setEntirePath([
                [right, bottom],
                [right, yDimB - ext]
            ]);
        }

        applyStroke(be2);
                
        var txtB = gBottom.textFrames.add();
        txtB.contents = formatDual(valH);
        txtB.textRange.paragraphAttributes.justification = Justification.CENTER;
        try { txtB.textRange.characterAttributes.size = fontSize; } catch(e){}
        try { txtB.textRange.characterAttributes.textFont = app.textFonts.getByName(CFG.lineStyle === "slanted" ? "Gotham-Medium" : "ArialMT"); } catch(e){}
        styleFractions(txtB);
        forceTextSize(txtB, fontSize);
        try { txtB.resize(s * 100, s * 100); } catch(e) {}

        if(CFG.lineStyle === "tick" || CFG.lineStyle === "slanted"){
            if(CFG.lineStyle === "tick") { be1.strokeDashes = [3, 3]; be2.strokeDashes = [3, 3]; } 
            else { be1.strokeDashes = []; be2.strokeDashes = []; }
            
            var l1 = gBottom.pathItems.add(); l1.setEntirePath([[left, yDimB], [right, yDimB]]); applyStroke(l1);
            if(CFG.lineStyle === "slanted") { createSlantedTick(gBottom, left, yDimB, s); createSlantedTick(gBottom, right, yDimB, s); } 
            else { createTick(gBottom, left, yDimB, s); createTick(gBottom, right, yDimB, s); }
            txtB.position = [((left+right)/2) - (txtB.width/2), yDimB - 8];
        } else {
            var bl1 = gBottom.pathItems.add(); bl1.setEntirePath([[left, yDimB], [(left+right)/2-gap, yDimB]]); applyStroke(bl1);
            var bl2 = gBottom.pathItems.add(); bl2.setEntirePath([[(left+right)/2+gap, yDimB], [right, yDimB]]); applyStroke(bl2);
            createArrow(gBottom, true, left, yDimB, true, s); createArrow(gBottom, false, right, yDimB, true, s);
            txtB.position = [((left + right) / 2) - (txtB.width / 2), yDimB + (txtB.height / 2)];
        }
    }

    // RIGHT SIDE
   if(CFG.showRight){
    var gRight = safeLayer.groupItems.add();
    var xDim = right + offsetV;

    var ext3 = gRight.pathItems.add();

    if (CFG.lineStyle === "slanted") {
        ext3.setEntirePath([
            [xDim - slantTail, top],
            [xDim + slantTail, top]
        ]);
    } else {
        ext3.setEntirePath([
            [right, top],
            [xDim + ext, top]
        ]);
    }

    applyStroke(ext3);


    var ext4 = gRight.pathItems.add();

    if (CFG.lineStyle === "slanted") {
        ext4.setEntirePath([
            [xDim - slantTail, bottom],
            [xDim + slantTail, bottom]
        ]);
    } else {
        ext4.setEntirePath([
            [right, bottom],
            [xDim + ext, bottom]
        ]);
    }

    applyStroke(ext4);


    var txtV = gRight.textFrames.add();
    txtV.contents = formatDual(valV);
    txtV.textRange.paragraphAttributes.justification = Justification.CENTER;

    try { txtV.textRange.characterAttributes.size = fontSize; } catch(e){}
    try { txtV.textRange.characterAttributes.textFont = app.textFonts.getByName(CFG.lineStyle === "slanted" ? "Gotham-Medium" : "ArialMT"); } catch(e){}

    styleFractions(txtV);
        forceTextSize(txtV, fontSize);
        try { txtV.resize(s * 100, s * 100); } catch(e) {}

    if (
    CFG.lineStyle === "slanted" ||
    CFG.lineStyle === "tick"
) {
    txtV.rotate(90);
}
    if(CFG.lineStyle === "tick" || CFG.lineStyle === "slanted"){

        if(CFG.lineStyle === "tick") {
            ext3.strokeDashes = [3, 3];
            ext4.strokeDashes = [3, 3];
        } else {
            ext3.strokeDashes = [];
            ext4.strokeDashes = [];
        }

        var l3 = gRight.pathItems.add();
        l3.setEntirePath([
            [xDim, top],
            [xDim, bottom]
        ]);
        applyStroke(l3);

        if(CFG.lineStyle === "slanted") {
            createSlantedTick(gRight, xDim, top, s);
            createSlantedTick(gRight, xDim, bottom, s);
        } else {
            createTick(gRight, xDim, top, s);
            createTick(gRight, xDim, bottom, s);
        }

        app.redraw();

        var vb = txtV.visibleBounds;
        var center = (vb[1] + vb[3]) / 2;

        centerVerticalText(txtV, xDim, ((top + bottom) / 2), "right", verticalTextPadding);

    } else {

        var l3 = gRight.pathItems.add();
        l3.setEntirePath([
            [xDim, top],
            [xDim, ((top + bottom) / 2) + gap]
        ]);
        applyStroke(l3);

        var l4 = gRight.pathItems.add();
        l4.setEntirePath([
            [xDim, ((top + bottom) / 2) - gap],
            [xDim, bottom]
        ]);
        applyStroke(l4);

        createArrow(gRight, true, xDim, top, false, s);
        createArrow(gRight, false, xDim, bottom, false, s);

        app.redraw();

        var vb = txtV.visibleBounds;

        var cx = (vb[0] + vb[2]) / 2;
        var cy = (vb[1] + vb[3]) / 2;

        txtV.translate(
            xDim - cx,
            ((top + bottom) / 2) - cy
        );

}
}

    // LEFT SIDE
    if(CFG.showLeft){
        var gLeft = safeLayer.groupItems.add();
        var xDimL = left - offsetV;
        var le1 = gLeft.pathItems.add();

if (CFG.lineStyle === "slanted") {
    le1.setEntirePath([
        [xDimL - slantTail, top],
        [xDimL + slantTail, top]
    ]);
} else {
    le1.setEntirePath([
        [left, top],
        [xDimL - ext, top]
    ]);
}

applyStroke(le1);


var le2 = gLeft.pathItems.add();

if (CFG.lineStyle === "slanted") {
    le2.setEntirePath([
        [xDimL - slantTail, bottom],
        [xDimL + slantTail, bottom]
    ]);
} else {
    le2.setEntirePath([
        [left, bottom],
        [xDimL - ext, bottom]
    ]);
}

applyStroke(le2);
        var txtL = gLeft.textFrames.add();
        txtL.contents = formatDual(valV);
        txtL.textRange.paragraphAttributes.justification = Justification.CENTER;
        try { txtL.textRange.characterAttributes.size = fontSize; } catch(e){}
        try { txtL.textRange.characterAttributes.textFont = app.textFonts.getByName(CFG.lineStyle === "slanted" ? "Gotham-Medium" : "ArialMT"); } catch(e){}
        styleFractions(txtL);
        forceTextSize(txtL, fontSize);
        try { txtL.resize(s * 100, s * 100); } catch(e) {}

       if (
        CFG.lineStyle === "slanted" ||
        CFG.lineStyle === "tick"
    ) {
        txtL.rotate(90);
    }

        if(CFG.lineStyle === "tick" || CFG.lineStyle === "slanted"){
            if(CFG.lineStyle === "tick") { le1.strokeDashes = [3, 3]; le2.strokeDashes = [3, 3]; } 
            else { le1.strokeDashes = []; le2.strokeDashes = []; }
            
            var ll1 = gLeft.pathItems.add(); ll1.setEntirePath([[xDimL, top], [xDimL, bottom]]); applyStroke(ll1);
            if(CFG.lineStyle === "slanted") { createSlantedTick(gLeft, xDimL, top, s); createSlantedTick(gLeft, xDimL, bottom, s); } 
            else { createTick(gLeft, xDimL, top, s); createTick(gLeft, xDimL, bottom, s); }
            centerVerticalText(txtL, xDimL, ((top + bottom) / 2), "left", verticalTextPadding);
        } else {
            var ll1 = gLeft.pathItems.add(); ll1.setEntirePath([[xDimL, top], [xDimL, ((top+bottom)/2)+gap]]); applyStroke(ll1);
            var ll2 = gLeft.pathItems.add(); ll2.setEntirePath([[xDimL, ((top+bottom)/2)-gap], [xDimL, bottom]]); applyStroke(ll2);
            createArrow(gLeft, true, xDimL, top, false, s); createArrow(gLeft, false, xDimL, bottom, false, s);
            app.redraw();

            var vb = txtL.visibleBounds;

            var cx = (vb[0] + vb[2]) / 2;
            var cy = (vb[1] + vb[3]) / 2;

            txtL.translate(
                xDimL - cx,
                ((top + bottom) / 2) - cy
            );

                }
    }
}

function runMeasurement(data){
    if(typeof data === "string"){
        data = eval('(' + data + ')');
    }
    CFG.showTop = data.top; CFG.showBottom = data.bottom;
    CFG.showLeft = data.left; CFG.showRight  = data.right;
    CFG.offset = (data.offset !== undefined && data.offset !== null) ? Number(data.offset) : 50;
    CFG.appearance = (data.appearance !== undefined && data.appearance !== null) ? Number(data.appearance) : 100;

    var appearanceScale = 0.02 + (CFG.appearance / 100) * 0.98;
    CFG.fontSize = BASE.defaultFontSize;
    CFG.scale = data.scale;

    // CUSTOM MEASUREMENT PERCENTAGE
    if (
        data.measurePercent !== null &&
        data.measurePercent !== undefined &&
        data.measurePercent !== "" &&
        Number(data.measurePercent) > 0
    ) {
        CFG.measurePercent = Number(data.measurePercent);
    } else {
        CFG.measurePercent = null;
    }

    CFG.lineStyle = data.lineStyle; 
    CFG.numFormat = data.numFormat || "fraction";
    
    CFG.unit = data.unit || "feet"; 
    CFG.metricUnit = data.metricUnit || "mm";
    CFG.textStyle = data.textStyle || "symbol";
    CFG.arrowTextMode = data.arrowTextMode || "dual";

    if (data.fraction && data.fraction.indexOf("/") !== -1) {
        CFG.fraction = parseInt(data.fraction.split("/")[1]);
    } else {
        CFG.fraction = 16;
    }
    main();
}

function main() {
   if(app.documents.length == 0) return alert("No document open.");
   if(app.activeDocument.selection.length == 0) return alert("Select an object first.");
   drawMeasurement();
}

function gcd(a, b) {
    while(b) { var t = b; b = a % b; a = t; }
    return a;
}
function formatInchFraction(val) {
    var denom = CFG.fraction || 8;
    var total = Math.round(val * denom) / denom;
    var ft = Math.floor(total / 12);
    var inches = total - ft * 12;
    var whole = Math.floor(inches);
    var num = Math.round((inches - whole) * denom + 1e-10);
    
    if (num === denom) { whole++; num = 0; }
    var result = ft + "'-";
    if (num > 0) {
        var g = gcd(num, denom);
        result += (whole > 0 ? whole + " " : "") + (num/g) + "/" + (denom/g) + '"';
    } else {
        result += whole + '"';
    }
    return result;
}

function detectObjectSize() {
    if (!app.documents.length) return "ERROR:No document open.";
    if (!app.activeDocument.selection.length) return "ERROR:Select an object first.";

    var sel = app.activeDocument.selection;
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (var i = 0; i < sel.length; i++) {
        try {
            var b = getMeasureBounds(sel[i]);
            if (b[0] < minX) minX = b[0];
            if (b[2] > maxX) maxX = b[2];
            if (b[1] > maxY) maxY = b[1];
            if (b[3] < minY) minY = b[3];
        } catch(e) {}
    }

    var realW = ptToInch(maxX - minX);
    var realH = ptToInch(maxY - minY);

    var measureW = applyScale(realW);
    var measureH = applyScale(realH);

    var displayW, displayH;

    if (CFG.unit === "metric") {
        displayW = formatMetricValue(measureW);
        displayH = formatMetricValue(measureH);
    } else if (CFG.unit === "inch") {
        displayW = measureW.toFixed(3).replace(/\.000$/, "") + '"';
        displayH = measureH.toFixed(3).replace(/\.000$/, "") + '"';
    } else {
        displayW = formatInchFraction(measureW);
        displayH = formatInchFraction(measureH);
    }

    return realW + ":" + realH + ":" + displayW + ":" + displayH;
}