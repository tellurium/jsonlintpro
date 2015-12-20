var DiffView = require('./views/diff-view.js');
var ErrorView = require('./views/error-view.js');
var SecondaryValidatorView = require('./views/secondary-validator-view.js');
var ValidatorView = require('./views/validator-view.js');
var JSONComposite = require('./views/json-composite.js');

var utils = require('./utils/utils.js');

if (!window.getComputedStyle) {
    window.getComputedStyle = function(el, pseudo) {
        this.el = el;
        this.getPropertyValue = function(prop) {
            var re = /(\-([a-z]){1})/g;
            if (prop == 'float') prop = 'styleFloat';
            if (re.test(prop)) {
                prop = prop.replace(re, function () {
                    return arguments[2].toUpperCase();
                });
            }
            return el.currentStyle[prop] ? el.currentStyle[prop] : null;
        }
        return this;
    }
}


/**
 * Helper Function for Caret positioning
 * Gratefully borrowed from the Masked Input Plugin by Josh Bush
 * http://digitalbush.com/projects/masked-input-plugin
**/
$.fn.caret = function (begin, end) {
    if (this.length === 0) {
        return;
    }
    if (typeof begin === 'number') {
        end = (typeof end === 'number') ? end : begin;
        return this.each(function () {
            if (this.setSelectionRange) {
                this.focus();
                this.setSelectionRange(begin, end);
            } else if (this.createTextRange) {
                var range = this.createTextRange();
                range.collapse(true);
                range.moveEnd('character', end);
                range.moveStart('character', begin);
                range.select();
            }
        });
    } else {
        if (this[0].setSelectionRange) {
            begin = this[0].selectionStart;
            end   = this[0].selectionEnd;
        } else if (document.selection && document.selection.createRange) {
            var range = document.selection.createRange();
            begin = -range.duplicate().moveStart('character', -100000);
            end   = begin + range.text.length;
        }
        return {"begin": begin, "end": end};
    }
};

$(function () {
    Backbone.$ = $;

    var JSON_PARAM = utils._getURLParameter('json');

    // this needs to be in a composite
    new JSONComposite({
        el      : $('#json-composite-placeholder'),
        json    : JSON_PARAM
    });
});
