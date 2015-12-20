var ValidatorView = require('./validator-view.js');
var DiffView = require('./diff-view.js');
var SecondaryValidatorView = require('./secondary-validator-view.js');

var htmlDiff = require('../utils/diff.js').htmlDiff;

require('./jquery-linedtextarea.js');

var FADE_SPEED = 150;

var jsonCompositeTemplate = '<div id="json-composite"><div id="validator-placeholder1"></div><div id="validator-placeholder2"></div><div id="diff-placeholder"></div><a href="#" title="Tips and Tricks" id="help"><span class="icon">Tips and Tricks</span></a><div id="tips-and-tricks"><a id="close-tips" class="close-btn" href="#">X</a><h1>JSON Lint Pro</h1><h2>The easiest way to validate and format JSON</h2><ul><li>Type your JSON into the textarea, or enter a remote URL</li><li>Use the split mode to speed up your workflow, or to run a diff.</li><li>Use the delete button to quickly clear your input.</li></ul><p>A project from the <a href="http://lab.arc90.com">Arc90 Lab</a>. Check out the source on <a href="https://github.com/arc90/jsonlintpro">GitHub</a>. Props to <a href="http://www.crockford.com/">Douglas Crockford</a> of <a href="http://www.json.org">JSON</a> and <a href="http://www.jslint.com">JS Lint</a>, and <a href="http://zaa.ch/">Zach Carter</a>, who provided the <a href="https://github.com/zaach/jsonlint"> JS implementation of JSONlint</a>.</p></div></div>';

var JSONComposite = Backbone.View.extend({
    events : {
        'click #close-tips' : 'onHideHelp',
        'click #help'       : 'onShowHelp'
    },

    initialize : function (options) {
        _.bindAll(
            this,
            'onShowHelp',
            'onHideHelp',
            'enterSplitMode',
            'exitSplitMode',
            'enterDiffMode',
            'exitDiffMode',
            '_setDiff',
            'resize'
        );

        this.json           = options.json;
        this.windowObject   = options.windowObject;

        $(this.windowObject).resize(this.resize);

        this.render();
    },

    render : function () {
        var el = $(jsonCompositeTemplate);

        this.$el.replaceWith(el);
        this.setElement(el);

        this.loadSubviews();
    },

    loadSubviews : function () {
        // this needs to be in a composite
        this.primaryValidator = new ValidatorView({
            el          : this.$('#validator-placeholder1'),
            json        : this.json,
            className   : 'primary'
        });

        this.secondaryValidator  = new SecondaryValidatorView({
            el  : this.$('#validator-placeholder2')
        });

        this.diffView  = new DiffView({
            el  : this.$('#diff-placeholder')
        });

        this.primaryValidator.on('split:enter',     this.enterSplitMode);
        this.secondaryValidator.on('split:exit',    this.exitSplitMode);
        this.secondaryValidator.on('diff',          this.enterDiffMode);
        this.diffView.on('diff:cancel',             this.exitDiffMode);
        this.diffView.on('diff',                    this._setDiff);

        this.$('.json_input').linedtextarea();

        _.delay(this.resize, 150);
    },

    onShowHelp : function (ev) {
        ev.preventDefault();

        this.$('#tips-and-tricks').fadeIn(FADE_SPEED);
    },

    onHideHelp : function (ev) {
        ev.preventDefault();

        this.$('#tips-and-tricks').fadeOut(FADE_SPEED);
    },

    resize : function () {
        var height = $(this.windowObject).height();

        this.$('.json_input').height(height);
    },

    enterSplitMode : function () {
        this.primaryValidator.enterSplitMode();
    },

    exitSplitMode : function () {
        this.primaryValidator.exitSplitMode(this.secondaryValidator.resetView);
    },

    enterDiffMode : function () {
        if (this._setDiff()) {
            if (!this.diffView.isActive()) {
                this.primaryValidator.enterDiffMode();

                this.secondaryValidator.enterDiffMode();

                this.diffView.onShow();
            }
        }
    },

    exitDiffMode : function () {
        this.primaryValidator.exitDiffMode();

        this.secondaryValidator.exitDiffMode();

        this.diffView.onHide();
    },

    _setDiff : function () {
        this.primaryValidator.validate();
        this.secondaryValidator.validate();

        var valA = this.primaryValidator.getValue(),
            valB = this.secondaryValidator.getValue(),
            diff;

        if (valA.length && valB.length) {
            diff = htmlDiff(valA, valB);

            this.diffView.setHTML(diff);
            return true;
        }

        return false;
    }
});

module.exports = JSONComposite;
