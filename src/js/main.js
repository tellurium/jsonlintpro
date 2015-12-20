var DiffView = require('./views/diff-view.js');
var ErrorView = require('./views/error-view.js');
var SecondaryValidatorView = require('./views/secondary-validator-view.js');
var ValidatorView = require('./views/validator-view.js');
var JSONComposite = require('./views/json-composite.js');

var utils = require('./utils.js');

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
 * jQuery Lined Textarea Plugin
 *   http://alan.blog-city.com/jquerylinedtextarea.htm
 *
 * Copyright (c) 2010 Alan Williamson
 *
 * Contributions done by Ryan Zielke (NeoAlchemy@gmail.com)
 *
 * Version:
 *    $Id: jquery-linedtextarea.js 464 2010-01-08 10:36:33Z alan $
 *
 * Released under the MIT License:
 *    http://www.opensource.org/licenses/mit-license.php
 *
 * Usage:
 *   Displays a line number count column to the left of the textarea
 *
 *   Class up your textarea with a given class, or target it directly
 *   with JQuery Selectors
 *
 *   $(".lined").linedtextarea({
 *      selectedLine: 10,
 *    selectedClass: 'lineselect'
 *   });
 *
 * History:
 *   - 2011.12.08: Changes to allow resizing and not affect styling of the outer div
 *   - 2010.01.08: Fixed a Google Chrome layout problem
 *   - 2010.01.07: Refactored code for speed/readability; Fixed horizontal sizing
 *   - 2010.01.06: Initial Release
 *
 */
(function($) {

    $.fn.linedtextarea = function(options) {

        // Get the Options
        var opts = $.extend({}, $.fn.linedtextarea.defaults, options);


        /*
         * Helper function to make sure the line numbers are always
         * kept up to the current system
         */
        var fillOutLines = function(codeLines, h, lineNo){
            while ( (codeLines.height() - h ) <= 0 ){
                if ( lineNo == opts.selectedLine )
                    codeLines.append("<div class='lineno lineselect'>" + lineNo + "</div>");
                else
                    codeLines.append("<div class='lineno'>" + lineNo + "</div>");

                lineNo++;
            }
            return lineNo;
        };


        /*
         * Iterate through each of the elements are to be applied to
         */
        return this.each(function() {
            var lineNo = 1;
            var textarea = $(this);

            /* Turn off the wrapping of as we don't want to screw up the line numbers */
            textarea.attr("wrap", "off");
            var originalTextAreaWidth   = textarea.outerWidth();

            /* Wrap the text area in the elements we need */
            var linedTextAreaDiv    = textarea.wrap("<div class='linedwrap'></div>");
            var linedWrapDiv            = linedTextAreaDiv.parent();

            linedWrapDiv.prepend("<div class='lines' style='width:50px'></div>");

            var linesDiv    = linedWrapDiv.find(".lines");


            /* Draw the number bar; filling it out where necessary */
            linesDiv.append( "<div class='codelines'></div>" );
            var codeLinesDiv    = linesDiv.find(".codelines");
            lineNo = fillOutLines( codeLinesDiv, linesDiv.height(), 1 );

            /* Move the textarea to the selected line */
            if ( opts.selectedLine != -1 && !isNaN(opts.selectedLine) ){
                var fontSize = parseInt( textarea.height() / (lineNo-2) );
                var position = parseInt( fontSize * opts.selectedLine ) - (textarea.height()/2);
                textarea[0].scrollTop = position;
            }

            /* Set the width */
            var sidebarWidth        = linesDiv.outerWidth(true);
            var paddingHorizontal       = parseInt( linedWrapDiv.css("border-left-width") ) + parseInt( linedWrapDiv.css("border-right-width") ) + parseInt( linedWrapDiv.css("padding-left") ) + parseInt( linedWrapDiv.css("padding-right") );
            var linedWrapDivNewWidth    = originalTextAreaWidth - paddingHorizontal;
            var textareaNewWidth        = originalTextAreaWidth - sidebarWidth - paddingHorizontal;

            /* React to the scroll event */
            textarea.scroll( function(tn){
                var domTextArea     = $(this)[0];
                var scrollTop       = domTextArea.scrollTop;
                var clientHeight    = domTextArea.clientHeight;
                codeLinesDiv.css( {'margin-top': (-1*scrollTop) + "px"} );
                lineNo = fillOutLines( codeLinesDiv, scrollTop + clientHeight, lineNo );
            });

            window.setInterval( function(tn) {
                linesDiv.height(textarea.outerHeight());
                var scrollTop       = textarea[0].scrollTop;
                var clientHeight    = textarea[0].clientHeight;
                codeLinesDiv.css( {'margin-top': (-1*scrollTop) + "px"} );
                lineNo = fillOutLines( codeLinesDiv, scrollTop + clientHeight, lineNo );
            },10);

        });
    };

  // default options
  $.fn.linedtextarea.defaults = {
    selectedLine: -1,
    selectedClass: 'lineselect'
  };
})(jQuery);

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





/*
Simple Diff for version 1.0 (ported to JavaScript)

Annotate two versions of a list with the values that have been
changed between the versions, similar to unix's `diff` but with
a dead-simple JavaScript interface.

JavaScript port by DJ Mountney (twk3) based on code by Paul Butler.

(C) 2008-2012 <http://www.paulbutler.org/>
May be used and distributed under the zlib/libpng license
<http://www.opensource.org/licenses/zlib-license.php>
*/

var diff = function(before, after) {
    /*
        Find the differences between two lists. Returns a list of pairs, where the
        first value is in ['+','-','='] and represents an insertion, deletion, or
        no change for that list. The second value of the pair is the list
        of elements.

        Params:
            before  the old list of immutable, comparable values (ie. a list
                    of strings)
            after   the new list of immutable, comparable values

        Returns:
            A list of pairs, with the first part of the pair being one of three
            strings ('-', '+', '=') and the second part being a list of values from
            the original before and/or after lists. The first part of the pair
            corresponds to whether the list of values is a deletion, insertion, or
            unchanged, respectively.

        Examples:
            diff([1,2,3,4],[1,3,4])
            [["=",[1]],["-",[2]],["=",[4]]]

            diff([1,2,3,4],[2,3,4,1])
            [["-",[1]],["=",[2,3,4]],["+",[1]]]

            diff('The quick brown fox jumps over the lazy dog'.split(/[ ]+/),
                'The slow blue cheese drips over the lazy carrot'.split(/[ ]+/))
            [["=",["The"]],
             ["-",["quick","brown","fox","jumps"]],
             ["+",["slow","blue","cheese","drips"]],
             ["=",["over","the","lazy"]],
             ["-",["dog"]],
             ["+",["carrot"]]]
    */

    // Create a map from before values to their indices
    var oldIndexMap = {}, i;
    for (i = 0; i < before.length; i ++) {
        oldIndexMap[before[i]] = oldIndexMap[before[i]] || [];
        oldIndexMap[before[i]].push(i);
    }

    // Find the largest substring common to before and after.
    // We use a dynamic programming approach here.
    // We iterate over each value in the `after` list.
    // At each iteration, `overlap[inew]` is the
    // length of the largest substring of `before.slice(0, iold)` equal
    // to a substring of `after.splice(0, iold)` (or unset when
    // `before[iold]` != `after[inew]`).
    // At each stage of iteration, the new `overlap` (called
    // `_overlap` until the original `overlap` is no longer needed)
    // is built from the old one.
    // If the length of overlap exceeds the largest substring
    // seen so far (`subLength`), we update the largest substring
    // to the overlapping strings.

    var overlap = [], startOld, startNew, subLength, inew;

    // `startOld` is the index of the beginning of the largest overlapping
    // substring in the before list. `startNew` is the index of the beginning
    // of the same substring in the after list. `subLength` is the length that
    // overlaps in both.
    // These track the largest overlapping substring seen so far, so naturally
    // we start with a 0-length substring.
    startOld = startNew = subLength = 0;

    for (inew = 0; inew < after.length; inew++) {
        var _overlap                = [];
        oldIndexMap[after[inew]]    = oldIndexMap[after[inew]] || [];
        for (i = 0; i < oldIndexMap[after[inew]].length; i++) {
            var iold        = oldIndexMap[after[inew]][i];
            // now we are considering all values of val such that
            // `before[iold] == after[inew]`
            _overlap[iold]  = ((iold && overlap[iold-1]) || 0) + 1;
            if (_overlap[iold] > subLength) {
                // this is the largest substring seen so far, so store its
                // indices
                subLength   = _overlap[iold];
                startOld    = iold - subLength + 1;
                startNew    = inew - subLength + 1;
            }
        }
        overlap = _overlap;
    }

    if (subLength === 0) {
        // If no common substring is found, we return an insert and delete...
        var result = [];
        before.length && result.push(['-', before]);
        after.length  && result.push(['+', after]);
        return result;
    }

    // ...otherwise, the common substring is unchanged and we recursively
    // diff the text before and after that substring
    return [].concat(
        diff(before.slice(0, startOld), after.slice(0, startNew)),
        [['=', after.slice(startNew, startNew + subLength)]],
        diff(before.slice(startOld + subLength), after.slice(startNew + subLength))
    );
};

var stringDiff = function(before, after) {
    /*
        Returns the difference between the old and new strings when split on
        whitespace. Considers punctuation a part of the word

        This function is intended as an example; you'll probably want
        a more sophisticated wrapper in practice.

        Params:
            before  the old string
            after   the new string

        Returns:
            the output of `diff` on the two strings after splitting them
            on whitespace (a list of change instructions; see the comment
            of `diff`)

        Examples:
            stringDiff('The quick brown fox', 'The fast blue fox')
            [["=",["The"]],
             ["-",["quick","brown"]],
             ["+",["fast","blue"]],
             ["=",["fox"]]]
    */
    return diff(before, after);
};

var htmlDiff = function(before, after) {
    /*
        Returns the difference between two strings (as in stringDiff) in
        HTML format. HTML code in the strings is NOT escaped, so you
        will get weird results if the strings contain HTML.

        This function is intended as an example; you'll probably want
        a more sophisticated wrapper in practice.

        Params:
            before  the old string
            after   the new string

        Returns:
            the output of the diff expressed with HTML <ins> and <del>
            tags.

        Examples:
            htmlDiff('The quick brown fox', 'The fast blue fox')
            'The <del>quick brown</del> <ins>fast blue</ins> fox'
    */
    var a, b, con, diff, i, results = [];
    con = {
        '=': function(x) {
            return x;
        },
        '+': function(x) {
            return '<ins>' + x + '</ins>';
        },
        '-': function(x) {
            return '<del>' + x + '</del>';
        }
    };

    diff = stringDiff(before, after);
    for (i=0; i < diff.length; i++) {
        var chunk = diff[i];
        results.push(con[chunk[0]](chunk[1]));
    }

    return results.join('');
};

var checkDiff = function(before, after) {
    /*
        This tests that diffs returned by `diff` are valid. You probably won't
        want to use this function, but it's provided for documentation and
        testing.

        A diff should satisfy the property that the before input is equal to the
        elements of the result annotated with '-' or '=' concatenated together.
        Likewise, the after input is equal to the elements of the result annotated
        with '+' or '=' concatenated together. This function compares `before`,
        `after`, and the results of `diff(before, after)` to ensure this is true.

        Tests:
            checkDiff('ABCBA', 'CBABA')
            checkDiff('Foobarbaz', 'Foobarbaz')
            checkDiff('Foobarbaz', 'Boobazbam')
            checkDiff('The quick brown fox', 'Some quick brown car')
            checkDiff('A thick red book', 'A quick blue book')
            checkDiff('dafhjkdashfkhasfjsdafdasfsda', 'asdfaskjfhksahkfjsdha')
            checkDiff('88288822828828288282828', '88288882882828282882828')
            checkDiff('1234567890', '24689')
    */
    before  = [before];
    after   = [after];

    var result  = diff(before, after),
        _before = [],
        _after  = [], i;

    for (i=0; i < result.length; i++) {
        switch (result[i][0]) {
            case '-':
                _before = _before.concat(result[i][1]);
                break;
            case '+':
                _after  = _after.concat(result[i][1]);
                break;
            default:
                _before = _before.concat(result[i][1]);
                _after  = _after.concat( result[i][1]);
        }
    }

    console.assert(JSON.stringify(before) === JSON.stringify(_before), 'Expected', before, 'got', _before);
    console.assert(JSON.stringify(after)  === JSON.stringify(_after),  'Expected', after,  'got', _after);
};

if (typeof(module) === 'object') {
  // Export functionality if used as a node.js or requirejs module
  module.exports = {
    diff: diff,
    htmlDiff: htmlDiff,
    stringDiff: stringDiff,
    checkDiff: checkDiff
  };
}

$(function () {
    Backbone.$ = $;

    var JSON_PARAM = utils._getURLParameter('json');

    // this needs to be in a composite
    new JSONComposite({
        el      : $('#json-composite-placeholder'),
        json    : JSON_PARAM
    });
});



