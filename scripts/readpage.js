var synthesis = window.speechSynthesis;
var mode = 0; // 0：整句， 1：分句
var material;
var current = 0;
var sentences;
var clauses;
var pause = false;

console.log("readPage load");

window.onload = function() {
    var paragraphs = document.querySelectorAll('p');
    for (var p of paragraphs) {
        splitP(p);
    }
    var sentences = document.querySelectorAll('[sentence]');
    for (var sentence of sentences) {
        splitSenten(sentence);
    }
    document.addEventListener('keydown', function(event) {
        if (event.keyCode === 37 || event.keyCode === 39) {
            selectElement(material[current], true);
        }
        if (event.keyCode === 37) {         // left
            current--;
        } else if (event.keyCode === 38) {  // up
            // current--;
        } else if (event.keyCode === 39) {  // right
            current++;
        } else if (event.keyCode === 40) {  // down
            // current++;
        } else if (event.keyCode === 32) {  // space
            event.preventDefault();
            pause = !pause;
            if (pause) {
                synthesis.pause();
            } else {
                synthesis.resume();
            }
        }
        if (current < 0) {
            current = 0;
        }
        if (current >= material.length) {
            current = 0;
        }
        if (event.keyCode === 37 || event.keyCode === 39) {
            playCurrent();
        }
    });
    initPlay();
}

function initPlay() {
    if (mode == 1) {
        material = document.querySelectorAll('[sentence]');
    } else {
        material = document.querySelectorAll('[clause]');
    }
    playCurrent();
}

function playCurrent() {
    if (!material[current]) {
        return;
    }
    selectElement(material[current]);
    var text = material[current].innerText;
    console.log("play: " + text);
    synthesis.cancel();
    var utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-GB';
    utterance.onend = function() {
        console.log("read finished");
        selectElement(material[current], true);
        current++;
        playCurrent();
    }
    synthesis.speak(utterance);
}

function generateRelativeP(pNode) {
    var newP = document.createElement("p");
    newP.style = pNode.style;
    newP.innerText = pNode.innerText;
    newP.style.display = "none";
    newP.style.border = "1px solid #383838"
    newP.style.padding = "10px"
    pNode.parentNode.insertBefore(newP, pNode.nextSibling);
    return newP;
}

function splitP(pNode) {
    /*
    I. 句分类
    分句:
    2. 以字母、数字、汉字开头，以逗号结尾;
    3. 既非句子，也非分句1。
    句子：
    2. 以字母、数字、汉字开头，以句号、问号、感叹号、分号结尾；

    II. 句子结构
    2. 句子可以包含或不包含若干分句
    3. 分句不可以包含分句
    */

    // 2. 划分句子，标记"sentence"
    // 3. 在句子中划分子句，标记"clause"
   
    pNode = generateRelativeP(pNode);
    
    var text = getLastText(pNode);
    let match;
    const regex = /[a-zA-Z+]+.*?[\.\?!;]+/s;

    while ((match = regex.exec(text)) !== null) {
        var matchText = match[0];
        var start = match.index;
        var len = matchText.length;
        var range = makeRange(getLastTextNode(pNode), start, len + start);
        tagContent(range, true);
        text = getLastText(pNode);
    }
}

function splitSenten(pNode) {
    var text = getLastText(pNode);
    let match;
    const regex = /[a-zA-Z+]+.*?[\.\?!;,]+/s;

    while ((match = regex.exec(text)) !== null) {
        var matchText = match[0];
        var start = match.index;
        var len = matchText.length;
        var range = makeRange(getLastTextNode(pNode), start, len + start);
        tagContent(range, false);
        text = getLastText(pNode);
    }
}

function getLastTextNode(p) {
    var len = p.childNodes.length;
    for (var i = len - 1; i >= 0; --i) {
        if (p.childNodes[i].nodeType == Node.TEXT_NODE) {
            return p.childNodes[i];
        }
    }
    return null;
}

function getLastText(p) {
    var textNode = getLastTextNode(p);
    if (textNode) {
        return textNode.data;
    }
    return "";
}

function tagContent(range, isSentence) {
    var parent = document.createElement("p");
    if (isSentence) {
        parent.setAttribute("sentence", true);
        parent.style.display = "inline";
    } else {
        parent.setAttribute("clause", true);
        parent.style.display = "inline";
    }
    range.surroundContents(parent);
}

function checkSameParant(range) {
    if (range.startContainer != range.endContainer) {
        throw Error("range not in the same element");
    }
}

function selectRange(range) {
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
}

function selectElement(element, unselect) {
    var parent;
    if (mode == 0) {
        element.parentNode;
    } else {
        element.parentNode.parentNode;
    }
    if (unselect) {
        parent.style.display = "none";
        element.style.backgroundColor = "white";
        element.style.color = "black";
    } else {
        parent.style.display = "block";
        parent.scrollIntoView();
        element.style.backgroundColor = "#234235";
        element.style.color = "white";
    }
}

function makeRange(element, start, end) {
    var range = document.createRange();
    range.setStart(element, start);
    range.setEnd(element, end);
    return range;
}

function rangePP(range) {
    console.log("rangePP");
    checkSameParant(range);
    var element = range.endContainer;
    range.setEnd(element, range.endOffset + 2);
    range.setStart(element, range.startOffset + 2);
}

function rangeMM(range) {
    console.log("rangePP");
    var element = range.endContainer;
    range.setStart(element, range.startOffset - 2);
    range.setEnd(element, range.endOffset - 2);
}

function rangeExpand(range, backward, forward) {
    console.log("rangeExpand",
        "backward: " + backward + ", forward: " + forward);
    checkSameParant(range);
    var element = range.endContainer;
    var newStart = range.startOffset;
    var newEnd = range.endOffset;
    if (typeof backward == Number) {
        var newStart = range.startOffset - backward;
        if (newStart < 1) {
            throw Error("rangeExpand back too far");
        }
    }
    if (typeof forward == Number) {
        var newEnd = range.endOffset + forward;
        if (newEnd >= range.length) {
            throw Error("rangeExpand forward too far");
        }
    }
    range.setStart(newStart);
    range.setEnd(newEnd);
}