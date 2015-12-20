var jslformat = require('../jsonlint/jsl.format.js');
var utils = require('../utils/utils.js');

var ErrorView = require('./error-view.js');

var TABCHARS = "    ";
var PADDING = 40;
var FADE_SPEED = 150;

var validatorTemplate = '<form class="JSONValidate" method="post" action="." name="JSONValidate"><textarea class="json_input" name="json_input" class="json_input" rows="30" cols="100" spellcheck="false" placeholder="Enter json or a url to validate..."></textarea><a href="#" title="Run validation" class="button validate"><span class="icon">Lint Me!</span></a><a href="#" title="Compare two JSON sets" class="button split-view"><span class="icon">Split View</span></a>    <a href="#" title="Delete the current data" class="button reset"><span class="icon">Reset</span></a><a href="#" title="Run validation and perform a diff" class="button diff"><span class="icon">Diff</span></a></form>';

var ValidatorView = Backbone.View.extend({
    events : {
        'click .validate'       : 'onValidate',
        'keyup .json_input'     : 'onKeyUp',
        'keydown .json_input'   : 'onKeyDown',
        'click .reset'          : 'onReset',
        'click .split-view'     : 'onSplitView',
        'click .diff'           : 'onDiff'
    },

    initialize : function (options) {
        _.bindAll(
            this,
            'onValidate',
            'onKeyUp',
            'onKeyDown',
            'onReset',
            'onSplitView',
            'onDiff',
            'resetErrors',
            'resize'
        );

        _.defaults(options, {
            reformat     : true,
            json         : false,
            windowObject : window,
            className    : ''
        });

        this.json   = options.json;
        this.reformat   = options.reformat;
        this.windowObject = options.windowObject;
        this.className = options.className;

        $(this.windowObject).resize(this.resize);

        this.render();
    },

    render : function () {
        var el = $(validatorTemplate);

        this.$el.replaceWith(el);
        this.setElement(el);

        this.$el.addClass(this.className);

        this.textarea = this.$('.json_input');

        this.textarea.scroll(_.bind(function () {
            var offset = this.textarea.scrollTop();

            this.errorView.setScrollOffset(offset);
        }, this));

        this._checkForJSON();

        this.createErrorView();

        _.delay(this.resize, 150);
    },

    createErrorView : function () {
        this.errorView = new ErrorView({
            container : this.$el
        });

        this.errorView.on('error:hide', this.resetErrors);

        this.$el.append(this.errorView.$el);
    },

    resize : function () {
        var height = $(this.windowObject).height();

        this.$el.height(height);
        this.textarea.height(height - PADDING);
    },

    /**
    * Validate any json passes in through the URL
    * @usage: ?json={}
    */
    _checkForJSON : function () {
        if (this.json) {
            this.textarea.val(this.json);

            this.validate();
        }
    },

    onValidate : function (ev) {
        ev.preventDefault();

        if ($.trim(this.textarea.val()).length === 0) {
            return;
        }

        var jsonVal = $.trim(this.textarea.val());

        this.validate();
    },

    onKeyUp : function (ev) {
        this.$('.validate').removeClass('error success');
    },

    onKeyDown : function (ev) {
        if (ev.keyCode === 9) {
            ev.preventDefault();

            this._insertAtCaret(TABCHARS);
        }
    },

    onReset : function (ev) {
        ev.preventDefault();

        this.resetView();
    },

    resetView : function () {
        this.textarea.val('').focus();
        this.resetErrors();
    },

    resetErrors : function () {
        this.errorView.hide();
        this.$('.validate').removeClass('error success');
    },

    validate : function (options) {
        options || (options = {});

        _.defaults(options, {
           success : $.noop,
           error : $.noop
        });

        var jsonVal = this.textarea.val(),
            result;

        try {
            result = JSON.parse(jsonVal);

            if (result) {
                this._appendResult(jsonVal);

                options.success();

                return;
            }

            options.error();

        } catch (parseException) {
            this._handleParseException(parseException);

            options.error();
        }
    },

     _appendResult : function (jsonVal) {
        var tab_chars = this.reformat ? TABCHARS : "";

        this.textarea.val(JSON.stringify(JSON.parse(jsonVal), null, tab_chars));

        this.$('.validate').removeClass('error').addClass('success');
        this.errorView.hide();
    },

    /**
     * If we failed to validate, run our manual formatter and then re-validate so that we
     * can get a better line number. On a successful validate, we don't want to run our
     * manual formatter because the automatic one is faster and probably more reliable.
    **/
    _handleParseException : function (parseException) {
        var jsonVal = this.textarea.val(),
            result;

        try {
            if (this.reformat) {
                jsonVal = jslformat.formatJson(jsonVal);

                this.textarea.val(jsonVal);

                result = JSON.parse(jsonVal);
            }
        } catch(e) {
            parseException = e;
        }

        var lineMatches = parseException.message.match(/line ([0-9]*)/),
            lineNum,
            lineStart,
            lineEnd,
            offset;

        lineNum = parseException.line;

        if (lineNum === 1) {
            lineStart = 0;
        } else {
            lineStart = this._getNthPos(jsonVal, "\n", lineNum - 1);
        }

        lineEnd = jsonVal.indexOf("\n", lineStart);
        if (lineEnd < 0) {
            lineEnd = jsonVal.length;
        }

        this.textarea.focus().caret(lineStart, lineEnd);

        offset = utils.getTextBoundingRect(this.textarea[0],lineStart, lineEnd, false);

        this.showValidationError(offset, parseException);
    },

    showValidationError : function (offset, parseException) {
        this.errorView.setError(parseException.message);
        this.errorView.setPosition(offset);
        this.errorView.show();

        this.$('.validate').removeClass('success').addClass('error');
    },

    /**
     * Function to insert our tab spaces
     */
    _insertAtCaret : function (text) {
        element = this.textarea[0];

        if (document.selection) {
            element.focus();
            var sel = document.selection.createRange();
            sel.text = text;
            element.focus();
        } else if (element.selectionStart || element.selectionStart === 0) {
            var startPos = element.selectionStart,
                endPos = element.selectionEnd,
                scrollTop = element.scrollTop;

            element.value = element.value.substring(0, startPos) + text + element.value.substring(endPos, element.value.length);
            element.focus();
            element.selectionStart = startPos + text.length;
            element.selectionEnd = startPos + text.length;
            element.scrollTop = scrollTop;
        } else {
            element.value += text;
            element.focus();
        }
    },

    /**
     * Get the Nth position of a character in a string
     * @searchStr the string to search through
     * @char the character to find
     * @pos int the nth character to find, 1 based.
     *
     * @return int the position of the character found
    **/
    _getNthPos : function (searchStr, char, pos) {
        var i,
            charCount = 0,
            strArr = searchStr.split(char);

        if (pos === 0) {
            return 0;
        }

        for (i = 0; i < pos; i++) {
            if (i >= strArr.length) {
                return -1;
            }

            // +1 because we split out some characters
            charCount += strArr[i].length + char.length;
        }

        return charCount;
    },

    hideSplitToggle : function () {
        this.$('.split-view').hide();
    },

    showSplitToggle : function () {
        this.$('.split-view').show();
    },

    enterSplitMode : function (callback) {
        callback || (callback = $.noop);

        this.hideSplitToggle();

        this.$el.animate({
           width : '50%'
        }, FADE_SPEED, callback);
    },

    exitSplitMode : function (callback) {
        callback || (callback = $.noop);

        this.$el.animate({
           width : '100%'
        }, FADE_SPEED, _.bind(function () {
            callback();
            this.showSplitToggle();
        }, this));
    },

    enterDiffMode : function () {
        this.$el.animate({
           width : '33%'
        }, FADE_SPEED);
    },

    exitDiffMode : function () {
        this.$el.animate({
           width : '50%'
        }, FADE_SPEED);
    },

    onSplitView : function (ev) {
        ev.preventDefault();

        this.trigger('split:enter');
    },

    onDiff : function (ev) {
        ev.preventDefault();

        this.trigger('diff');
    },

    getValue : function () {
        return this.textarea.val();
    }
});

module.exports = ValidatorView;
