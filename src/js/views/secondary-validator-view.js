var ValidatorView = require('./validator-view.js');

var FADE_SPEED = 150;

var SecondaryValidatorView = ValidatorView.extend({
    render : function () {
        ValidatorView.prototype.render.call(this);

        this.$('.split-view').addClass('cancel');

        this.$('.diff').css('display', 'block');
    },

    onSplitView : function (ev) {
        ev.preventDefault();

        this.trigger('split:exit');
    },

    enterDiffMode : function () {
        this.$el.animate({
           width : '33%',
           left: '67%'
        }, FADE_SPEED);

        this.$('.diff, .split-view').hide();
    },

    exitDiffMode : function () {
        this.$el.animate({
           width : '50%',
           left: '50%'
        }, FADE_SPEED);

        this.$('.diff, .split-view').show();
    }
});

module.exports = SecondaryValidatorView;
