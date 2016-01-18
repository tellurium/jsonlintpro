var diffTemplate = [
    '<div id="diff-view">',
        '<a href="#" title="Run validation and perform a diff" class="button diff">',
            '<span class="icon">Diff</span>',
        '</a>',
        '<a href="#" title="Cancel diff" class="button cancel-diff">',
            '<span class="icon">Cancel diff</span>',
        '</a>',
        '<div class="json_input" contenteditable="true"></div>',
    '</div>'].join('');

var DiffView = Backbone.View.extend({
    events : {
        'click .diff' : 'onDiff',
        'click .cancel-diff' : 'onCancel'
    },

    initialize : function (options) {
        _.bindAll(
            this,
            'onDiff',
            'onCancel',
            'resize'
        );

        this.windowObject = options.windowObject;

        $(this.windowObject).resize(this.resize);

        this.render();
    },

    render : function () {
        var el = $(diffTemplate);

        this.$el.replaceWith(el);
        this.setElement(el);

        this.$('.diff').show();

        _.delay(this.resize, 150);
    },

    resize : function () {
        var height = $(this.windowObject).height();

        this.$('.json_input').height(height);
    },

    setHTML : function (html) {
        this.$('.json_input').html(html);
    },

    isActive : function () {
        return this.$el.hasClass('active');
    },

    onShow : function () {
        if (!this.$el.hasClass('active')) {
            this.$el.addClass('active')
        }
    },

    onDiff : function (ev) {
        ev.preventDefault();
        this.trigger('diff');
    },

    onHide : function () {
        if (this.$el.hasClass('active')) {
            this.$el.removeClass('active')
        }
    },

    onCancel : function (ev) {
        ev.preventDefault();

        this.trigger('diff:cancel');
    }
});

module.exports = DiffView;
